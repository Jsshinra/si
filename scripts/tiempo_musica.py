"""Musica y efectos de 'El precio del mañana' (estilo Tinta), hechos 100% con codigo (numpy).
Uso: python3 scripts/tiempo_musica.py <salida.wav> [voz.mp3]
Lee los tiempos de src/tiempo-tiempos.json. Si se pasa una voz, la mezcla encima y baja la musica mientras habla.
Paleta: tic-tac de reloj, cuerdas graves, piano suelto, pulsos digitales, lapiz al escribir notas."""
import json, subprocess, sys, wave
import numpy as np

T = json.load(open("src/tiempo-tiempos.json"))
SR = 48000
DUR = float(T["dur"])
N = int(SR * DUR)
rng = np.random.default_rng(25)
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

def band(sig, lo, hi):
    sp = np.fft.rfft(sig)
    f = np.fft.rfftfreq(len(sig), 1 / SR)
    sp[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(sp, len(sig))

def noise(d, lo, hi):
    o = band(rng.standard_normal(int(SR * d)), lo, hi)
    return o / (np.abs(o).max() + 1e-9)

def cuerda(m, d, vib=1.0):
    """cello sintetico: sierra filtrada con vibrato y arco lento"""
    t = tt(d)
    f = hz(m) * (1 + 0.004 * vib * np.sin(2 * np.pi * 5.2 * t))
    ph = np.cumsum(f) / SR
    saw = 2 * (ph % 1) - 1
    o = band(saw, 30, hz(m) * 5)
    e = np.minimum(t / 1.4, 1) * np.minimum((d - t) / 1.2, 1)
    return o * e * 0.35

def piano(m, d=3.0, v=1.0):
    t = tt(d)
    f = hz(m)
    o = sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t * (1.2 + k * 0.9)) / k ** 1.3 for k in range(1, 7))
    return o * np.minimum(t / 0.003, 1) * 0.35 * v

def metal(d=1.6, f0=180):
    t = tt(d)
    o = sum(np.sin(2 * np.pi * f0 * r * t) * np.exp(-t * (2 + r)) for r in (1, 2.76, 5.4, 8.93))
    o += noise(d, 300, 4000) * np.exp(-t * 30) * 0.8
    return np.tanh(o * 1.2) * 0.6

def rumble(d):
    t = tt(d)
    return noise(d, 25, 160) * np.sin(np.pi * t / d) ** 0.7

def lapiz(d):
    t = tt(d)
    trazos = (np.sin(2 * np.pi * 7 * t + np.sin(2 * np.pi * 1.3 * t) * 3) > -0.2).astype(float)
    return noise(d, 2500, 9000) * trazos * 0.18 * np.minimum((d - t) * 10, 1)

def papel(d=0.35):
    t = tt(d)
    return noise(d, 800, 8000) * np.exp(-t * 9) * 0.6

def rasgado(d=0.6):
    t = tt(d)
    return noise(d, 1200, 7000) * (np.abs(np.sin(2 * np.pi * 34 * t)) ** 2) * np.exp(-t * 3)

def tecla():
    t = tt(0.09)
    return noise(0.09, 1500, 7000) * np.exp(-t * 80) + np.sin(2 * np.pi * 180 * t) * np.exp(-t * 60) * 0.5

def sello():
    t = tt(0.4)
    return np.tanh((np.sin(2 * np.pi * np.cumsum(60 + 90 * np.exp(-t * 30)) / SR) * np.exp(-t * 12) + noise(0.4, 200, 2000) * np.exp(-t * 40) * 0.5) * 2)

def latido():
    t = tt(0.45)
    th = lambda f: np.sin(2 * np.pi * f * t) * np.exp(-t * 20)
    o = th(52)
    k = int(0.16 * SR)
    o[k:] += th(46)[: len(t) - k] * 0.7
    return o

def calor(d):
    t = tt(d)
    f = 200 + 300 * t / d
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.2 + noise(d, 3000, 9000) * 0.25) * np.sin(np.pi * t / d)

def lvl(points):
    xs, ys = zip(*points)
    return np.interp(np.arange(N) / SR, xs, ys)

def tic(alto=True):
    t = tt(0.06)
    f = 2400 if alto else 1800
    return (np.sin(2 * np.pi * f * t) * 0.6 + noise(0.06, 2000, 8000) * 0.4) * np.exp(-t * 90)

def bip(m=88, d=0.12):
    t = tt(d)
    return np.sign(np.sin(2 * np.pi * hz(m) * t)) * 0.25 * np.minimum((d - t) * 40, 1)

def flujo(d):
    t = tt(d)
    f = 600 + 900 * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25 * np.sin(np.pi * t / d) + noise(d, 4000, 9000) * 0.06

# ---------- musica: Am - F - C - E, 4 s por acorde, con pulso de reloj ----------
ACORDES = [(33, [57, 60, 64]), (29, [57, 60, 65]), (36, [55, 60, 64]), (28, [56, 59, 64])]
t0, k = 0.0, 0
while t0 < DUR:
    bajo, notas = ACORDES[k % 4]
    add(mus, t0, cuerda(bajo + 12, 4.6), 0.8)
    add(mus, t0, cuerda(notas[1] - 12, 4.6, 0.6), 0.3, pan=0.3)
    if t0 >= T["reglas"]:
        for j, n in enumerate([notas[0], notas[2], notas[1], notas[2]]):
            add(mus, t0 + j, piano(n + (12 if t0 >= T["leccion"] else 0), 2.6, 0.6), 0.7, pan=0.2 * (-1) ** j)
    t0 += 4.0
    k += 1
mus *= lvl([(0, 0.45), (T["reglas"], 0.7), (T["divide"], 0.85), (T["pocos"], 1.0), (T["leccion"], 0.6), (T["titulo"], 0.9), (DUR - 2, 1.0), (DUR, 0.0)])[:, None]

# tic-tac de reloj durante casi todo el video (se calla en el cero y en el cierre)
s = 0.0
j = 0
while s < T["titulo"]:
    if not (T["cero"] <= s < T["r3"]):
        add(sfx, s, tic(j % 2 == 0), 0.35 if s < T["divide"] else 0.22, pan=0.25)
    s += 0.5
    j += 1

# ---------- efectos ----------
add(sfx, T["gancho"] + 0.6, flujo(1.0), 0.6)
add(sfx, T["gancho"] + 1.6, bip(91), 0.5)
for nota in ("gancho", "reloj", "reglas", "r1", "r2", "cero", "r3", "cafe", "divide", "ricos", "pobres", "suben", "pocos", "leccion", "noVes"):
    add(sfx, T[nota] + 0.3, papel(), 0.3, pan=0.3)
    add(sfx, T[nota] + 0.45, lapiz(1.0), 0.8, pan=0.2)
for k2 in range(4):
    add(sfx, T["r1"] + 0.6 + k2 * 0.7, piano(72 + k2 * 4, 1.4), 0.6)
add(sfx, T["para"], rasgado(0.4), 0.4)
add(sfx, T["unAnio"], bip(96, 0.3), 0.6)
add(sfx, T["unAnio"], flujo(0.8), 0.5)
for s2 in np.arange(T["cero"] - 1.4, T["cero"], 0.06):
    add(sfx, s2, bip(100, 0.04), 0.18)
add(sfx, T["cero"], bip(64, 1.2), 0.6)
add(sfx, T["cero"], rumble(2.0), 0.7)
add(sfx, T["cero"] + 0.2, latido(), 0.9)
add(sfx, T["paga"], flujo(2.2), 0.8)
add(sfx, T["paga"] + 2.2, bip(93, 0.2), 0.5)
add(sfx, T["cafe"], papel(0.3), 0.6)
add(sfx, T["colectivo"], papel(0.3), 0.6)
add(sfx, T["divide"], rumble(1.6), 0.6)
add(sfx, T["divide"] + 0.2, metal(1.4, 120), 0.4)
for s2 in (T["suben"], T["suben"] + 1.6, T["suben"] + 3.0):
    add(sfx, s2, lapiz(0.35), 0.9)
    add(sfx, s2 + 0.2, bip(84, 0.15), 0.4)
for s2 in np.arange(T["pocos"] + 0.6, T["pocos"] + 2.6, 0.7):
    add(sfx, s2, bip(60, 0.6), 0.35)
add(sfx, T["pocos"] + 0.6, latido(), 0.8)
add(sfx, T["noVes"], piano(76, 3.0), 0.7)
tl = T["titulo"] + 0.5
for j2 in range(40):
    add(sfx, tl + j2 * 0.07 + rng.uniform(0, 0.02), tecla(), 0.4, pan=rng.uniform(-0.3, 0.3))
add(sfx, T["titulo"] + 4.3, sello(), 0.9)
add(sfx, T["pregunta"], papel(), 0.4)
add(sfx, T["pregunta"] + 0.15, lapiz(1.4), 0.8)

# ---------- reverb y mezcla ----------
base = mus * 0.85 + sfx
ir_t = tt(2.2)
ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 2.6)
nfft = 1 << (N + len(ir) - 2).bit_length()
IR = np.fft.rfft(ir, nfft)
wet = np.stack([np.fft.irfft(np.fft.rfft(base[:, c], nfft) * IR, nfft)[:N] for c in (0, 1)], 1)
bed = base / np.abs(base).max() + wet / np.abs(wet).max() * 0.28
bed = np.tanh(bed * 1.2)
bed /= np.abs(bed).max()

if len(sys.argv) > 2:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", sys.argv[2], "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
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
