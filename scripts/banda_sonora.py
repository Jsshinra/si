"""Genera la banda sonora de 'Mensaje a las 3 AM' 100% con codigo (numpy).
Los tiempos (en segundos) estan sincronizados con src/Historia.tsx."""
import sys, wave
import numpy as np

SR = 48000
DUR = 34.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
mix = np.zeros((N, 2))

def t_arr(d):
    return np.arange(int(SR * d)) / SR

def band(sig, lo, hi):
    spec = np.fft.rfft(sig)
    f = np.fft.rfftfreq(len(sig), 1 / SR)
    spec[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(spec, len(sig))

def add(at, sig, gain=1.0, pan=0.0):
    i = int(at * SR)
    if sig.ndim == 1:
        sig = np.stack([sig * (1 - max(pan, 0)), sig * (1 + min(pan, 0))], 1)
    j = min(N, i + len(sig))
    mix[i:j] += sig[: j - i] * gain

def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(t / max(a, 1e-4), 1) * np.exp(-t / d)

# --- sonidos ---
def impact(d=2.2):
    t = t_arr(d)
    sub = np.sin(2 * np.pi * (38 + 60 * np.exp(-t * 9)) * t) * np.exp(-t * 1.6)
    crack = band(rng.standard_normal(len(t)), 80, 3000) * np.exp(-t * 14)
    return np.tanh((sub * 1.2 + crack * 0.25) * 1.5)

def whoosh(d=0.9, rise=True):
    t = t_arr(d)
    n = rng.standard_normal(len(t))
    shape = np.sin(np.pi * (t / d) ** (0.6 if rise else 1.6))
    out = band(n, 300, 6000) * shape
    return out / np.abs(out).max()

def riser(d):
    t = t_arr(d)
    f = 120 * (2 ** (3 * t / d))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR)
    n = band(rng.standard_normal(len(t)), 1500, 9000)
    e = (t / d) ** 2.2
    return (tone * 0.5 + n / np.abs(n).max() * 0.5) * e

def ping(soft=False):
    t = t_arr(0.9)
    a = np.sin(2 * np.pi * 1318.5 * t) * env(len(t), 0.003, 0.18)
    b = np.zeros_like(t)
    k = int(0.11 * SR)
    b[k:] = np.sin(2 * np.pi * 1760 * t[: len(t) - k]) * env(len(t) - k, 0.003, 0.25)
    return (a + b) * (0.5 if soft else 0.8)

def knock():
    t = t_arr(0.6)
    body = np.sin(2 * np.pi * 95 * t) * np.exp(-t * 18)
    wood = band(rng.standard_normal(len(t)), 150, 900) * np.exp(-t * 35)
    wood /= np.abs(wood).max()
    return np.tanh((body * 1.4 + wood * 0.9) * 2)

def heartbeat():
    t = t_arr(0.5)
    def thump(f):
        return np.sin(2 * np.pi * f * t) * np.exp(-t * 22)
    out = thump(55)
    k = int(0.16 * SR)
    out[k:] += thump(48)[: len(t) - k] * 0.7
    return out

def tick():
    t = t_arr(0.08)
    return band(rng.standard_normal(len(t)), 2500, 8000) * np.exp(-t * 90) * 0.6

def type_click():
    t = t_arr(0.05)
    return band(rng.standard_normal(len(t)), 1800, 7000) * np.exp(-t * 120) * 0.35

def glitch(d=0.45):
    n = int(d * SR)
    out = np.zeros(n)
    i = 0
    while i < n:
        seg = int(rng.uniform(0.01, 0.05) * SR)
        kind = rng.integers(3)
        tt = np.arange(seg) / SR
        if kind == 0:
            s = np.sign(np.sin(2 * np.pi * rng.uniform(200, 1500) * tt))
        elif kind == 1:
            s = rng.standard_normal(seg)
        else:
            s = np.zeros(seg)
        out[i : i + seg] = s[: n - i] * 0.6
        i += seg
    return np.round(out * 6) / 6  # bitcrush

def pop():
    t = t_arr(0.25)
    f = 300 + 900 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 25) * 0.7

# --- drone de fondo (tension continua) ---
t = np.arange(N) / SR
drone = (np.sin(2 * np.pi * 43.65 * t) + 0.7 * np.sin(2 * np.pi * 44.2 * t)
         + 0.35 * np.sin(2 * np.pi * 65.4 * t + np.sin(2 * np.pi * 0.2 * t)))
air = band(rng.standard_normal(N), 200, 900)
air /= np.abs(air).max()
drone = drone * 0.22 + air * 0.05 * (1 + np.sin(2 * np.pi * 0.13 * t))
lvl = np.interp(t, [0, 1.6, 3, 12.4, 12.6, 13.0, 16.5, 23, 31, 34],
                   [0.2, 0.2, 0.7, 0.9, 0.0, 0.0, 0.9, 1.25, 1.1, 0.0])
mix += np.stack([drone * lvl, np.roll(drone, 300) * lvl], 1)

# --- eventos (segundos) ---
add(0.0, riser(1.6), 0.35)
add(0.75, whoosh(0.85), 0.35)
add(1.6, impact(), 0.95)
add(3.0, whoosh(0.7, False), 0.3)
for s in np.arange(3.0, 6.5, 1.0):
    add(s, tick(), 0.5, pan=0.3)
for s in np.arange(3.3, 12.4, 0.9):
    add(s, heartbeat(), 0.75)
add(6.5, whoosh(0.7), 0.35)
add(7.5, ping(), 0.7)
add(9.5, impact(1.6), 0.55)
for s in (13.0, 13.6, 14.2):
    add(s, knock(), 1.0, pan=-0.15)
add(16.5, whoosh(0.7, False), 0.3)
for s in np.arange(17.0, 18.45, 0.11):
    add(s + rng.uniform(-0.02, 0.02), type_click(), 0.6)
add(18.5, ping(True), 0.7)
add(20.5, riser(2.7), 0.4)
add(21.3, impact(1.4), 0.35)
add(22.3, glitch(), 0.45)
add(23.2, impact(), 1.0)
for s in (24.0, 24.5, 25.8, 26.6):
    add(s, pop(), 0.55)
for s in np.arange(23.6, 33.0, 0.7):
    add(s, heartbeat(), 0.8)
add(29.7, ping(True), 0.4)

# --- master ---
mix = np.tanh(mix * 1.1)
mix /= np.abs(mix).max() / 0.89
fade = np.ones(N)
fade[-int(SR * 1.2):] = np.linspace(1, 0, int(SR * 1.2))
mix *= fade[:, None]
pcm = (mix * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("ok", sys.argv[1])
