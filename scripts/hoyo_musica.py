"""Musica y efectos de 'El hoyo' (estilo Tinta), hechos 100% con codigo (numpy).
Uso: python3 scripts/hoyo_musica.py <salida.wav> [voz.mp3]
Lee los tiempos de src/hoyo-tiempos.json. Si se pasa una voz, la mezcla encima y baja la musica mientras habla.
Paleta: cuerdas graves, piano suelto, golpes metalicos de la plataforma, lapiz al escribir notas."""
import json, subprocess, sys, wave
import numpy as np

T = json.load(open("src/hoyo-tiempos.json"))
SR = 48000
DUR = float(T["dur"])
N = int(SR * DUR)
rng = np.random.default_rng(48)
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

# ---------- musica: Dm - Bb - Gm - A, 4 s por acorde ----------
ACORDES = [(38, [62, 65, 69]), (34, [62, 65, 70]), (31, [62, 67, 70]), (33, [61, 64, 69])]
t0, k = 0.0, 0
while t0 < DUR:
    bajo, notas = ACORDES[k % 4]
    add(mus, t0, cuerda(bajo, 4.6), 0.9)
    add(mus, t0, cuerda(bajo + 12, 4.6), 0.4, pan=-0.3)
    add(mus, t0, cuerda(notas[1] - 12, 4.6, 0.6), 0.25, pan=0.3)
    if t0 >= T["reglas"]:
        for j, n in enumerate([notas[0], notas[2], notas[1]]):
            add(mus, t0 + j * 1.33, piano(n + 12 if t0 >= T["leccion"] else n, 3.5, 0.7), 0.8, pan=0.2 * (-1) ** j)
    t0 += 4.0
    k += 1
mus *= lvl([(0, 0.5), (T["reglas"], 0.75), (T["banquete"], 0.85), (T["bajas"], 1.0), (T["vacios"] + 1, 0.55), (T["leccion"], 0.8), (T["titulo"], 1.0), (DUR - 2, 1.0), (DUR, 0.0)])[:, None]

# ---------- efectos ----------
add(sfx, 0.0, rumble(2.5), 0.4)
add(sfx, T["gancho"] + 1.2, latido(), 0.7)
add(sfx, T["celda"] + 1.2, lapiz(0.5), 1.0)
add(sfx, T["abajo"] + 0.3, rumble(3.0), 0.5)
for nota in ("gancho", "celda", "arriba", "abajo", "reglas", "r1", "r2", "r3", "banquete", "necesita", "peroNo", "ultima", "bajas", "vacios", "loco", "haceLoMismo", "leccion", "frase1", "frase2"):
    add(sfx, T[nota] + (0.4 if nota == "gancho" else 0.0), papel(), 0.3, pan=0.3)
    add(sfx, T[nota] + 0.15 + (0.4 if nota == "gancho" else 0.0), lapiz(1.0), 0.8, pan=0.2)
# plataforma regla 1
add(sfx, T["r1"], rumble(T["llega"] - T["r1"] + 0.3), 0.6)
add(sfx, T["llega"], metal(2.0, 140), 0.9)
add(sfx, T["sigue"], metal(1.2, 160), 0.6)
add(sfx, T["sigue"], rumble(1.8), 0.5)
# regla 2
add(sfx, T["calor"], calor(T["tira"] - T["calor"] + 0.5), 0.8)
for s in np.arange(T["calor"], T["tira"], 0.6):
    add(sfx, s, latido(), 0.6)
add(sfx, T["tira"] + 0.9, metal(0.8, 300), 0.3)
# regla 3
add(sfx, T["arranca"], rasgado(), 0.8)
add(sfx, T["piso6"], metal(0.9, 220), 0.4)
add(sfx, T["piso132"], metal(1.4, 90), 0.6)
# banquete y diagrama
add(sfx, T["banquete"], metal(1.8, 140), 0.7)
for j in range(8):
    add(sfx, T["necesita"] + 0.5 + 0.4 + j * 0.47, piano(74 + [0, 2, 4, 7, 9, 12, 14, 16][j], 1.6), 0.6)
# la caida
add(sfx, T["bajas"], rumble(T["vacios"] - T["bajas"] + 0.5), 1.0)
for s in np.arange(T["bajas"] + 0.3, T["vacios"] - 0.2, 0.18):
    add(sfx, s, metal(0.25, 200 + rng.uniform(-40, 40)), 0.18, pan=rng.uniform(-0.6, 0.6))
add(sfx, T["vacios"], metal(2.5, 70), 1.0)
# lo mas loco
for s in np.arange(T["loco"], T["rompe"], 0.8):
    add(sfx, s, latido(), 0.5)
add(sfx, T["rompe"], rasgado(), 0.7)
add(sfx, T["haceLoMismo"], metal(1.5, 140), 0.6)
# cierre
add(sfx, T["leccion"], rumble(2.0), 0.5)
tl = T["titulo"] + 0.5
for j in range(len("Esto es…") + len("EL HOYO") + 30):
    add(sfx, tl + j * 0.07 + rng.uniform(0, 0.02), tecla(), 0.4, pan=rng.uniform(-0.3, 0.3))
add(sfx, T["titulo"] + 3.6, sello(), 0.9)
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
