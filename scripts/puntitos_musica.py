"""Musica y efectos de 'Tu vida en 100 puntitos', hechos 100% con codigo (numpy).
Uso: python3 scripts/puntitos_musica.py <salida.wav> [voz.mp3]
Lee los tiempos de src/puntitos-tiempos.json (los mismos que usa el video).
Si se pasa una voz, la mezcla encima y baja la musica mientras habla."""
import json, subprocess, sys, wave
import numpy as np

T = json.load(open("src/puntitos-tiempos.json"))
SR = 48000
DUR = float(T["dur"])
N = int(SR * DUR)
rng = np.random.default_rng(100)
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
              for det, ph, h in [(0, 0, 1), (0.003, 1, 1), (-0.004, 2, 1), (1.0, 0.5, 4), (2.0, 0.3, 9)])
    e = np.minimum(t / 1.2, 1) * np.minimum((d - t) / 1.5, 1)
    return out * e * 0.2

def pluck(m, d=2.2, soft=1.0):
    t = tt(d)
    f = hz(m)
    out = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(4 * np.pi * f * t) * np.exp(-t * 6) + 0.15 * np.sin(6 * np.pi * f * t) * np.exp(-t * 10)
    return out * np.exp(-t * 2.6) * np.minimum(t / 0.004, 1) * 0.3 * soft

def blip(m, d=0.18):
    t = tt(d)
    return np.sin(2 * np.pi * hz(m) * t) * np.exp(-t * 30) * np.minimum(t / 0.002, 1)

def tock(m):
    t = tt(0.22)
    f = hz(m) * (1 + 0.5 * np.exp(-t * 60))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 26)

def noise_band(d, lo, hi):
    n = rng.standard_normal(int(SR * d))
    sp = np.fft.rfft(n)
    f = np.fft.rfftfreq(len(n), 1 / SR)
    sp[(f < lo) | (f > hi)] = 0
    o = np.fft.irfft(sp, len(n))
    return o / np.abs(o).max()

def whoosh(d=0.7):
    t = tt(d)
    return noise_band(d, 400, 5000) * np.sin(np.pi * t / d) ** 2

def boom():
    t = tt(2.5)
    return np.sin(2 * np.pi * (40 + 30 * np.exp(-t * 6)) * t) * np.exp(-t * 1.8)

def lvl(points):
    xs, ys = zip(*points)
    return np.interp(np.arange(N) / SR, xs, ys)

# ---------- musica: Am - F - C - G, un acorde cada 4 s ----------
ACORDES = [(45, [57, 60, 64]), (41, [57, 60, 65]), (48, [55, 60, 64]), (43, [55, 59, 62])]
PENTA = [69, 72, 74, 76, 79, 81, 84, 86, 88]
sil, giro, cierre = T["silencio"], T["giro"], T["cierre"]
k = 0
t0 = 0.0
while t0 < DUR:
    bajo, notas = ACORDES[k % 4]
    add(mus, t0, pad(bajo, 5.2), 0.9)
    for n in notas:
        add(mus, t0, pad(n, 5.2), 0.55, pan=rng.uniform(-0.4, 0.4))
    # arpegio en corcheas
    for j in range(8):
        ta = t0 + j * 0.5
        if ta >= DUR:
            break
        en_silencio = sil <= ta < giro
        if en_silencio and j % 4 != 0:
            continue
        nota = notas[[0, 1, 2, 1, 0, 2, 1, 2][j]] + (12 if ta >= giro and j % 2 else 0)
        fuerza = 0.45 if ta < 9 else 0.7 if ta < sil else 0.35 if en_silencio else 0.8 if ta < cierre else 1.0
        add(mus, ta, pluck(nota + 12, soft=fuerza), 1.0, pan=0.25 * (-1) ** j)
        if ta >= cierre:
            add(mus, ta + 0.25, pluck(nota + 24, 1.5, 0.5), 1.0, pan=-0.25 * (-1) ** j)
    t0 += 4.0
    k += 1
mus *= lvl([(0, 0.6), (4, 0.75), (sil - 0.5, 0.85), (sil + 0.8, 0.28), (giro, 0.32), (giro + 4, 0.8), (cierre, 1.0), (DUR - 2.2, 1.0), (DUR, 0.0)])[:, None]

# ---------- efectos ----------
# 1. aparecen los 100 puntos: lluvia de blips
for i in range(100):
    add(sfx, T["aparecen"] + rng.uniform(0, 0.55), blip(rng.choice(PENTA) + 12, 0.12), 0.16, pan=rng.uniform(-0.7, 0.7))
add(sfx, T["aparecen"] - 0.3, whoosh(0.6), 0.25)
# 2. se apagan 25, uno por uno (cada vez mas grave)
for i in range(25):
    ta = T["apagarDesde"] + i / 25 * (T["apagarHasta"] - T["apagarDesde"])
    add(sfx, ta, tock(76 - i * 0.9), 0.4, pan=(i % 10 - 4.5) / 8)
# 3. bloques de colores
for b, (tb, n) in enumerate(zip(T["bloques"], [33, 15, 14, 18])):
    add(sfx, tb - 0.25, whoosh(0.5), 0.22)
    for j in range(n):
        add(sfx, tb + j * 0.025, blip(PENTA[(j + b * 2) % len(PENTA)], 0.1), 0.2, pan=(j % 10 - 4.5) / 7)
    add(sfx, tb + 0.05, pluck(72 + [0, 4, 7, 12][b], 1.6), 0.9)
for tc in T["chistes"]:
    if tc is not None:
        add(sfx, tc, blip(84, 0.1), 0.3)
        add(sfx, tc + 0.09, blip(88, 0.14), 0.3)
# 4. el silencio
add(sfx, sil, boom(), 0.7)
add(sfx, sil, whoosh(1.4)[::-1], 0.18)
for j in range(20):
    add(sfx, sil + 0.9 + j * 0.04, blip(81 + (j % 3) * 2 + 12, 0.25), 0.1, pan=(j % 10 - 4.5) / 6)
# 5. se vuelven a encender
add(sfx, giro, pluck(76, 2.5), 0.8)
for tl, n in zip(T["lineas"], [18, 29, 33]):
    for j in range(n):
        add(sfx, tl + rng.uniform(0, 1.2), blip(rng.choice(PENTA) + 12, 0.35), 0.13, pan=rng.uniform(-0.8, 0.8))
add(sfx, T["frase"] - 0.5, whoosh(0.9), 0.2)
for n in (60, 64, 67, 72):
    add(sfx, T["frase"], pluck(n + 12, 3.0), 0.7)
# 6. cierre
add(sfx, cierre - 0.6, whoosh(1.0), 0.3)
add(sfx, cierre, boom(), 0.45)
for j in range(40):
    add(sfx, cierre + rng.uniform(0, 3.5), blip(rng.choice(PENTA) + 24, 0.5), 0.09, pan=rng.uniform(-0.9, 0.9))
add(sfx, T["cta"], blip(84, 0.2), 0.35)
add(sfx, T["cta"] + 0.1, blip(91, 0.3), 0.35)

# ---------- reverb simple ----------
base = mus * 0.8 + sfx
ir_t = tt(1.8)
ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 3.2)
L = N + len(ir) - 1
nfft = 1 << (L - 1).bit_length()
IR = np.fft.rfft(ir, nfft)
wet = np.stack([np.fft.irfft(np.fft.rfft(base[:, c], nfft) * IR, nfft)[:N] for c in (0, 1)], 1)
wet /= np.abs(wet).max()
bed = base / np.abs(base).max() + wet * 0.22
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
