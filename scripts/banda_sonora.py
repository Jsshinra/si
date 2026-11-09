"""Banda sonora de 'Mensaje a las 3 AM' hecha 100% con codigo (numpy) + mezcla con la voz.

Uso: python3 scripts/banda_sonora.py <voz.mp3> <salida.wav>

La voz se corta en VOZ_CORTE y se le inserta un silencio de VOZ_HUECO segundos para los golpes
en la puerta. La musica baja sola (ducking) mientras habla el narrador.
Los tiempos (en segundos) estan sincronizados con src/Historia.tsx.
"""
import subprocess, sys, wave
import numpy as np

SR = 48000
DUR = 45.0
N = int(SR * DUR)
VOZ_CORTE = 17.35
VOZ_HUECO = 2.2
rng = np.random.default_rng(7)
bed = np.zeros((N, 2))

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
    bed[i:j] += sig[: j - i] * gain

def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(t / max(a, 1e-4), 1) * np.exp(-t / d)

# ---------- sonidos ----------
def impact(d=2.2):
    t = t_arr(d)
    sub = np.sin(2 * np.pi * (38 + 60 * np.exp(-t * 9)) * t) * np.exp(-t * 1.6)
    crack = band(rng.standard_normal(len(t)), 80, 3000) * np.exp(-t * 14)
    return np.tanh((sub * 1.2 + crack * 0.25) * 1.5)

def whoosh(d=0.9, rise=True):
    t = t_arr(d)
    shape = np.sin(np.pi * (t / d) ** (0.6 if rise else 1.6))
    out = band(rng.standard_normal(len(t)), 300, 6000) * shape
    return out / np.abs(out).max()

def riser(d):
    t = t_arr(d)
    f = 120 * (2 ** (3 * t / d))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR)
    n = band(rng.standard_normal(len(t)), 1500, 9000)
    return (tone * 0.5 + n / np.abs(n).max() * 0.5) * (t / d) ** 2.2

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
    return np.tanh((body * 1.4 + wood / np.abs(wood).max() * 0.9) * 2)

def heartbeat():
    t = t_arr(0.5)
    thump = lambda f: np.sin(2 * np.pi * f * t) * np.exp(-t * 22)
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
        tt = np.arange(seg) / SR
        kind = rng.integers(3)
        s = (np.sign(np.sin(2 * np.pi * rng.uniform(200, 1500) * tt)) if kind == 0
             else rng.standard_normal(seg) if kind == 1 else np.zeros(seg))
        out[i : i + seg] = s[: n - i] * 0.6
        i += seg
    return np.round(out * 6) / 6

def buzz(d=0.45):
    t = t_arr(d)
    am = (np.sin(2 * np.pi * 22 * t) > 0).astype(float)
    return np.sign(np.sin(2 * np.pi * 160 * t)) * 0.35 * am * np.minimum(1, (d - t) * 30)

def pop():
    t = t_arr(0.25)
    f = 300 + 900 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 25) * 0.7

# ---------- drone de tension ----------
t = np.arange(N) / SR
drone = (np.sin(2 * np.pi * 43.65 * t) + 0.7 * np.sin(2 * np.pi * 44.2 * t)
         + 0.35 * np.sin(2 * np.pi * 65.4 * t + np.sin(2 * np.pi * 0.2 * t)))
air = band(rng.standard_normal(N), 200, 900)
drone = drone * 0.22 + air / np.abs(air).max() * 0.05 * (1 + np.sin(2 * np.pi * 0.13 * t))
lvl = np.interp(t, [0, 2.8, 4.6, 17.2, 17.45, 19.9, 21.6, 32, 43, 45],
                   [0.2, 0.2, 0.6, 0.8, 0.0, 0.0, 0.85, 1.1, 0.95, 0.0])
bed += np.stack([drone * lvl, np.roll(drone, 300) * lvl], 1)

# ---------- eventos ----------
add(0.0, riser(2.8), 0.3)
add(1.95, whoosh(0.85), 0.3)
add(2.8, impact(), 0.95)
add(4.6, whoosh(0.7, False), 0.3)
for s in np.arange(4.6, 9.5, 1.0):
    add(s, tick(), 0.45, pan=0.3)
for s in np.arange(4.9, 17.2, 0.9):
    add(s, heartbeat(), 0.6)
add(10.8, buzz(), 0.6)
add(12.16, ping(True), 0.6)
add(15.88, pop(), 0.45)
add(17.4, whoosh(0.5), 0.3)
add(13.3, impact(1.6), 0.5)
for s in (17.75, 18.35, 18.95):
    add(s, knock(), 1.0, pan=-0.15)
add(21.9, pop(), 0.4)
for s in np.arange(21.9, 23.25, 0.11):
    add(s + rng.uniform(-0.02, 0.02), type_click(), 0.55)
add(23.3, ping(True), 0.6)
add(26.45, riser(1.95), 0.35)
add(26.6, whoosh(0.6, False), 0.25)
add(28.4, impact(1.4), 0.35)
add(30.85, glitch(), 0.45)
add(32.1, impact(), 1.0)
for s in (33.5, 35.55, 37.85, 39.35):
    add(s, pop(), 0.5)
for s in np.arange(32.5, 43.5, 0.7):
    add(s, heartbeat(), 0.75)
add(42.2, ping(True), 0.4)

# ---------- voz ----------
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", sys.argv[1], "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                     capture_output=True, check=True).stdout
voz = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
c = int(VOZ_CORTE * SR)
voz = np.concatenate([voz[:c], np.zeros(int(VOZ_HUECO * SR)), voz[c:]])[:N]
voz = np.pad(voz, (0, N - len(voz)))
voz = voz / np.abs(voz).max() * 0.92

# ducking: la musica baja ~9 dB mientras habla el narrador
win = int(0.05 * SR)
nivel = np.convolve(np.abs(voz), np.ones(win) / win, mode="same")
activo = (nivel > 0.02).astype(float)
suav = int(0.25 * SR)
activo = np.convolve(activo, np.ones(suav) / suav, mode="same").clip(0, 1)
duck = 1 - 0.65 * activo

bed = np.tanh(bed * 1.1)
bed /= np.abs(bed).max()
mix = voz[:, None] + bed * 0.5 * duck[:, None]
mix /= np.abs(mix).max() / 0.95
fade = np.ones(N)
fade[-int(SR * 1.5):] = np.linspace(1, 0, int(SR * 1.5))
mix *= fade[:, None]
with wave.open(sys.argv[2], "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print("ok", sys.argv[2])
