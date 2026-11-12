"""Musica y efectos de 'Las 200 horas que cuesta un amigo', hechos 100% con codigo (numpy).
Uso: python3 scripts/amigos_musica.py <salida.wav> [voz.mp3]
Lee los tiempos de src/amigos-tiempos.json (los mismos que usa el video).
Si se pasa una voz, la mezcla encima y baja la musica mientras habla."""
import json, subprocess, sys, wave
import numpy as np

T = json.load(open("src/amigos-tiempos.json"))
SR = 48000
DUR = float(T["dur"])
N = int(SR * DUR)
rng = np.random.default_rng(200)
mus = np.zeros((N, 2))
sfx = np.zeros((N, 2))

def add(buf, at, sig, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N or i < 0:
        return
    st = np.stack([sig * (1 - max(pan, 0)), sig * (1 + min(pan, 0))], 1)
    j = min(N, i + len(st))
    buf[i:j] += st[: j - i] * gain

def tt(d):
    return np.arange(int(SR * d)) / SR

def hz(m):
    return 440 * 2 ** ((m - 69) / 12)

def pad(m, d):
    t = tt(d)
    out = sum(np.sin(2 * np.pi * hz(m) * (1 + det) * t + ph) / h
              for det, ph, h in [(0, 0, 1), (0.003, 1, 1), (-0.004, 2, 1), (1.0, 0.5, 4)])
    return out * np.minimum(t / 0.6, 1) * np.minimum((d - t) / 0.8, 1) * 0.2

def pluck(m, d=1.6, soft=1.0):
    t = tt(d)
    f = hz(m)
    out = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(4 * np.pi * f * t) * np.exp(-t * 6) + 0.2 * np.sin(6 * np.pi * f * t) * np.exp(-t * 10)
    return out * np.exp(-t * 3.4) * np.minimum(t / 0.004, 1) * 0.3 * soft

def blip(m, d=0.14):
    t = tt(d)
    return np.sin(2 * np.pi * hz(m) * t) * np.exp(-t * 34) * np.minimum(t / 0.002, 1)

def noise_band(d, lo, hi):
    n = rng.standard_normal(int(SR * d))
    sp = np.fft.rfft(n)
    f = np.fft.rfftfreq(len(n), 1 / SR)
    sp[(f < lo) | (f > hi)] = 0
    o = np.fft.irfft(sp, len(n))
    return o / np.abs(o).max()

def whoosh(d=0.6):
    t = tt(d)
    return noise_band(d, 400, 5000) * np.sin(np.pi * t / d) ** 2

def kick():
    t = tt(0.3)
    return np.sin(2 * np.pi * np.cumsum(50 + 90 * np.exp(-t * 40)) / SR) * np.exp(-t * 14)

def shaker():
    t = tt(0.07)
    return noise_band(0.07, 5000, 11000) * np.exp(-t * 60)

def clap():
    t = tt(0.18)
    return noise_band(0.18, 900, 4500) * np.exp(-t * 28)

def boing(up=True):
    t = tt(0.32)
    f = 260 * (1 + (0.9 if up else -0.5) * t / 0.32) * (1 + 0.06 * np.sin(2 * np.pi * 28 * t))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)

def gliss(m0, m1, d):
    t = tt(d)
    f = hz(m0 + (m1 - m0) * t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) * 0.6

def lvl(points):
    xs, ys = zip(*points)
    return np.interp(np.arange(N) / SR, xs, ys)

# ---------- musica: C - G - Am - F, 100 bpm (2,4 s por acorde) ----------
ACORDES = [(48, [60, 64, 67]), (43, [59, 62, 67]), (45, [60, 64, 69]), (41, [60, 65, 69])]
PENTA = [72, 74, 76, 79, 81, 84, 86, 88]
BEAT = 0.6
giro, amigo, cierre = T["giro"], T["amigo"], T["cierre"]
k = 0
t0 = 0.0
while t0 < DUR:
    bajo, notas = ACORDES[k % 4]
    calmo = giro <= t0 < amigo
    add(mus, t0, pad(bajo, 2.9), 0.9)
    for n in notas:
        add(mus, t0, pad(n, 2.9), 0.5, pan=rng.uniform(-0.4, 0.4))
    for j in range(8):
        ta = t0 + j * BEAT / 2
        if ta >= DUR:
            break
        if calmo and j % 2:
            continue
        add(mus, ta, pluck(notas[[0, 2, 1, 2, 0, 2, 1, 2][j]] + 12, soft=0.5 if calmo else 0.85), 1.0, pan=0.3 * (-1) ** j)
        if t0 >= T["h50a"] and not calmo:
            add(mus, ta, shaker(), 0.1 if j % 2 else 0.05)
    if t0 >= T["h50a"] and not calmo:
        for b in range(4):
            add(mus, t0 + b * BEAT, kick(), 0.55)
            if b % 2:
                add(mus, t0 + b * BEAT, clap(), 0.16)
    t0 += 2.4
    k += 1
mus *= lvl([(0, 0.6), (4, 0.8), (giro - 0.4, 0.9), (giro + 0.6, 0.45), (amigo, 0.55), (amigo + 2.5, 1.0), (DUR - 2.0, 1.0), (DUR, 0.0)])[:, None]

# ---------- efectos ----------
def bloques(t_a, t_b, h_a, h_b):
    n = h_b - h_a
    for j in range(0, n, 2):
        add(sfx, t_a + j / n * (t_b - t_a), blip(60 + (h_a + j) * 0.15, 0.08), 0.22, pan=(h_a + j) / 100 - 1)

add(sfx, T["gancho"], whoosh(0.5), 0.25)
add(sfx, T["gancho"] + 0.1, pluck(72, 1.2), 0.8)
bloques(T["h50a"], T["h50b"], 0, 50)
bloques(T["h90a"], T["h90b"], 50, 90)
for th, m in ((T["h50b"], 84), (T["h90b"], 88)):
    add(sfx, th, blip(m, 0.4), 0.5)
    add(sfx, th + 0.1, blip(m + 7, 0.5), 0.5)
# maletines que rebotan
for j in range(10):
    tl = T["trabajo"] + j * 0.45 + 0.5
    if tl < T["otras"] - 0.3:
        add(sfx, tl, boing(False), 0.3, pan=rng.uniform(-0.5, 0.5))
add(sfx, T["gustavo"], whoosh(0.4), 0.2)
add(sfx, T["perro"], gliss(70, 62, 0.5), 0.35)
# las otras horas
for te, m in ((T["mates"], 76), (T["viajes"], 79), (T["charlas"], 84)):
    add(sfx, te, boing(True), 0.35)
    add(sfx, te + 0.12, pluck(m, 1.2), 0.9)
    bloques(te + 0.1, te + 0.8, 90, 110)
# 200
add(sfx, T["h200a"] - 0.5, whoosh(0.7), 0.25)
bloques(T["h200a"], T["h200b"], 150, 200)
add(sfx, T["h200a"], gliss(72, 91, T["h200b"] - T["h200a"]), 0.25)
for n in (72, 76, 79, 84, 88):
    add(sfx, T["h200b"], pluck(n, 2.6), 0.8)
add(sfx, T["h200b"], kick(), 0.9)
for j in range(24):
    add(sfx, T["h200b"] + rng.uniform(0, 1.6), blip(rng.choice(PENTA) + 12, 0.35), 0.1, pan=rng.uniform(-0.8, 0.8))
# giro: el puente se vacia
add(sfx, T["giro"] + 0.3, gliss(84, 60, 0.7), 0.3)
add(sfx, T["noSosVos"], pluck(72, 1.5), 0.7)
add(sfx, T["faltan"], pluck(76, 1.8), 0.8)
# el amigo cruza y el puente se vuelve dorado
add(sfx, T["amigo"], gliss(60, 84, 0.6), 0.3)
for j in range(8):
    add(sfx, T["amigo"] + 0.6 + j * 0.28, blip(64 + (j % 2) * 3, 0.06), 0.25)
for j in range(25):
    add(sfx, T["gasto"] + j * 0.04, blip(PENTA[j % len(PENTA)] + 12, 0.25), 0.13, pan=j / 12.5 - 1)
for n in (72, 76, 79, 84):
    add(sfx, T["enVos"], pluck(n + 12, 2.6), 0.6)
for j in range(20):
    add(sfx, T["enVos"] + rng.uniform(0, 2.0), blip(rng.choice(PENTA) + 12, 0.4), 0.1, pan=rng.uniform(-0.8, 0.8))
add(sfx, T["mas"], boing(True), 0.35)
add(sfx, T["mas"] + 0.15, blip(91, 0.4), 0.5)
add(sfx, T["cta"], blip(84, 0.2), 0.35)
add(sfx, T["cta"] + 0.1, blip(91, 0.3), 0.35)

# ---------- reverb y mezcla ----------
base = mus * 0.8 + sfx
ir_t = tt(1.2)
ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 4.5)
nfft = 1 << (N + len(ir) - 2).bit_length()
IR = np.fft.rfft(ir, nfft)
wet = np.stack([np.fft.irfft(np.fft.rfft(base[:, c], nfft) * IR, nfft)[:N] for c in (0, 1)], 1)
bed = base / np.abs(base).max() + wet / np.abs(wet).max() * 0.15
bed = np.tanh(bed * 1.3)
bed /= np.abs(bed).max()

if len(sys.argv) > 2:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", sys.argv[2], "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    voz = np.frombuffer(raw, dtype=np.float32).astype(np.float64)[:N]
    voz = np.pad(voz, (0, N - len(voz)))
    voz = voz / np.abs(voz).max() * 0.92
    win = int(0.05 * SR)
    act = (np.convolve(np.abs(voz), np.ones(win) / win, mode="same") > 0.02).astype(float)
    sw = int(0.3 * SR)
    duck = 1 - 0.6 * np.convolve(act, np.ones(sw) / sw, mode="same").clip(0, 1)
    mix = voz[:, None] + bed * 0.5 * duck[:, None]
else:
    mix = bed
mix /= np.abs(mix).max() / 0.92
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print("ok", sys.argv[1])
