"""Musica y efectos de 'El contrato' (la idea de Severance), hechos 100% con codigo (numpy).
Uso: python3 scripts/contrato_musica.py <salida.wav> [voz.mp3]
Lee los tiempos de src/contrato-tiempos.json (los mismos que usa el video).
Si se pasa una voz, la mezcla encima y baja la musica mientras habla."""
import json, subprocess, sys, wave
import numpy as np

T = json.load(open("src/contrato-tiempos.json"))
SR = 48000
DUR = float(T["dur"])
N = int(SR * DUR)
rng = np.random.default_rng(9)
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
    return out * np.minimum(t / 0.8, 1) * np.minimum((d - t) / 1.0, 1) * 0.2

def pluck(m, d=1.8, soft=1.0):
    t = tt(d)
    f = hz(m)
    out = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(4 * np.pi * f * t) * np.exp(-t * 6) + 0.2 * np.sin(6 * np.pi * f * t) * np.exp(-t * 10)
    return out * np.exp(-t * 3.0) * np.minimum(t / 0.004, 1) * 0.3 * soft

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

def sello():
    t = tt(0.5)
    return np.tanh((np.sin(2 * np.pi * np.cumsum(45 + 120 * np.exp(-t * 30)) / SR) * np.exp(-t * 9) + noise_band(0.5, 200, 2500) * np.exp(-t * 40) * 0.6) * 2)

def ding():
    t = tt(1.4)
    return (np.sin(2 * np.pi * 1568 * t) + 0.5 * np.sin(2 * np.pi * 3136 * t)) * np.exp(-t * 4) * 0.5

def zap():
    t = tt(0.25)
    return np.sign(np.sin(2 * np.pi * np.cumsum(1800 * np.exp(-t * 14) + 200) / SR)) * np.exp(-t * 16) * 0.4

def gliss(m0, m1, d):
    t = tt(d)
    return np.sin(2 * np.pi * np.cumsum(hz(m0 + (m1 - m0) * t / d)) / SR) * np.sin(np.pi * t / d) * 0.6

def parpadeo():
    t = tt(0.3)
    return noise_band(0.3, 80, 700) * np.sin(np.pi * t / 0.3) ** 2

def lvl(points):
    xs, ys = zip(*points)
    return np.interp(np.arange(N) / SR, xs, ys)

def viaje(t0, d, baja=True):
    """ascensor: va, parpadeo, vuelve"""
    add(sfx, t0 + 0.26 * d, ding(), 0.25)
    add(sfx, t0 + 0.28 * d, gliss(64, 52, 0.17 * d) if baja else gliss(52, 64, 0.17 * d), 0.3)
    add(sfx, t0 + 0.45 * d, parpadeo(), 0.5)
    add(sfx, t0 + 0.55 * d, gliss(52, 64, 0.17 * d) if baja else gliss(64, 52, 0.17 * d), 0.3)
    add(sfx, t0 + 0.72 * d, ding(), 0.25)

# ---------- musica: Am - F - Dm - E, un acorde cada 3 s ----------
ACORDES = [(45, [57, 60, 64]), (41, [57, 60, 65]), (38, [57, 62, 65]), (40, [56, 59, 64])]
alg, lec, tit = T["alguien"], T["leccion"], T["titulo"]
k = 0
t0 = 0.0
while t0 < DUR:
    bajo, notas = ACORDES[k % 4]
    oscuro = alg <= t0 < lec
    add(mus, t0, pad(bajo - (12 if oscuro else 0), 3.6), 1.0 if oscuro else 0.8)
    for n in notas:
        add(mus, t0, pad(n, 3.6), 0.45, pan=rng.uniform(-0.4, 0.4))
    for j in range(8):
        ta = t0 + j * 0.375
        if ta >= DUR:
            break
        if t0 >= lec and j % 2:
            continue
        nota = notas[[0, 1, 2, 1, 0, 2, 1, 2][j]] + (0 if oscuro else 12)
        add(mus, ta, pluck(nota, soft=0.6 if oscuro else 0.8), 1.0, pan=0.3 * (-1) ** j)
    if oscuro:
        for b in range(4):
            add(mus, t0 + b * 0.75, kick(), 0.45)
    t0 += 3.0
    k += 1
mus *= lvl([(0, 0.6), (4, 0.8), (alg - 0.3, 0.85), (alg + 0.3, 0.35), (T["adentro"], 0.9), (lec - 0.4, 1.0), (lec + 0.6, 0.6), (tit, 0.9), (DUR - 2.0, 1.0), (DUR, 0.0)])[:, None]

# ---------- efectos ----------
add(sfx, T["oferta"], whoosh(0.5), 0.25)
for j in range(14):
    add(sfx, T["oferta"] + 0.3 + j * 0.09, blip(72 + j, 0.08), 0.2)
add(sfx, T["oferta"] + 1.6, ding(), 0.5)
add(sfx, T["condicion"], pluck(57, 2.0), 0.9)
add(sfx, T["chip"], zap(), 0.6)
add(sfx, T["entrar"], gliss(72, 60, 0.4), 0.3)
add(sfx, T["salir"], gliss(60, 72, 0.4), 0.3)
viaje(T["ascensor"], T["ascensorDur"], True)
add(sfx, T["ascensor"] + T["ascensorDur"] * 0.95, ding(), 0.4)
for tk, m in ((T["lunes"], 76), (T["jefe"], 79), (T["cobras"], 84)):
    add(sfx, tk, blip(m, 0.3), 0.4)
add(sfx, T["firmas"], whoosh(0.5), 0.25)
add(sfx, T["todosSi"], sello(), 0.8)
add(sfx, alg, kick(), 0.9)
add(sfx, alg, whoosh(1.2)[::-1], 0.2)
add(sfx, T["adentro"], gliss(40, 52, 0.9), 0.4)
for j in range(6):
    add(sfx, T["adentro"] + 0.1 + j * 0.07, blip(96 - j, 0.05), 0.15)
tc = T["ciclo"]
for d in (3.0, 1.4, 0.9):
    viaje(tc, d, False)
    tc += d
tfin = T["renuncia"] - 0.3
j = 0
while tc < tfin:
    add(sfx, tc, blip(88 - (j % 5), 0.04), 0.14, pan=0.4 * (-1) ** j)
    tc += max(0.05, 0.22 - j * 0.01)
    j += 1
for tk in (T["casa"], T["findes"], T["sol"]):
    add(sfx, tk, pluck(52, 1.5), 0.8)
add(sfx, T["jornada"], kick(), 0.8)
add(sfx, T["renuncia"], whoosh(0.4), 0.25)
add(sfx, T["renuncia"] + 0.9, gliss(52, 64, 0.8), 0.3)
add(sfx, T["no"], sello(), 1.0)
add(sfx, T["no"] + 0.05, gliss(64, 50, 0.6), 0.35)
add(sfx, T["no"] + 1.6, gliss(64, 52, 0.7), 0.25)
add(sfx, lec, pluck(69, 2.5), 0.8)
add(sfx, T["otro"], pluck(72, 2.5), 0.8)
add(sfx, T["vos"], kick(), 0.8)
for n in (57, 64, 69, 72):
    add(sfx, T["vos"], pluck(n, 3.0), 0.6)
add(sfx, tit - 0.5, whoosh(0.8), 0.3)
add(sfx, tit, kick(), 1.0)
for n in (57, 64, 69, 76):
    add(sfx, tit, pluck(n + 12, 3.0), 0.7)
add(sfx, T["pregunta"], blip(84, 0.2), 0.4)
add(sfx, T["pregunta"] + 0.1, blip(91, 0.3), 0.4)

# ---------- reverb y mezcla ----------
base = mus * 0.8 + sfx
ir_t = tt(1.6)
ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 3.6)
nfft = 1 << (N + len(ir) - 2).bit_length()
IR = np.fft.rfft(ir, nfft)
wet = np.stack([np.fft.irfft(np.fft.rfft(base[:, c], nfft) * IR, nfft)[:N] for c in (0, 1)], 1)
bed = base / np.abs(base).max() + wet / np.abs(wet).max() * 0.2
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
