"""La musique et les bruitages de la bande-annonce, synthétisés (numpy seul) :
python3 tools/trailer/music.py  ->  tools/trailer/out/music.wav

120 BPM (un temps = 0,5 s), calé sur le montage de src/components/trailer/Trailer.tsx :
l'intro sombre qui monte, le BOOM à 4 s, le beat jusqu'à 31,5 s, le logo à 32 s."""

import os
import wave

import numpy as np

SR = 44100
DUR = 36.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
mix = np.zeros((N, 2))
B = 0.5  # un temps


def at(t):
    return int(t * SR)


def add(sig, t, gain=1.0, pan=0.0):
    """pose un son (mono ou stéréo) à t secondes"""
    if sig.ndim == 1:
        l, r = np.sqrt(0.5 * (1 - pan)), np.sqrt(0.5 * (1 + pan))
        sig = np.stack([sig * l * 1.41, sig * r * 1.41], 1)
    i = at(t)
    if i >= N:
        return
    n = min(len(sig), N - i)
    mix[i:i + n] += sig[:n] * gain


def env(n, a=0.002, d=0.2, curve=1.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-6)) * np.exp(-t / d) ** curve
    return e


def noise(sec):
    return rng.standard_normal(int(sec * SR))


def band(x, lo, hi):
    """filtre passe-bande par FFT (lo, hi en Hz)"""
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X = np.fft.rfft(x)
    m = ((f >= lo) & (f <= hi)).astype(float)
    return np.fft.irfft(X * m, len(x))


def sweep_noise(sec, f0, f1, width=0.6):
    """du bruit dont la bande monte (ou descend) de f0 à f1 : souffles, montées"""
    n = int(sec * SR)
    out = np.zeros(n)
    hop = 2048
    x = noise(sec + 0.1)
    win = np.hanning(hop * 2)
    for i in range(0, n, hop):
        p = i / n
        fc = f0 * (f1 / f0) ** p
        seg = x[i:i + hop * 2]
        if len(seg) < hop * 2:
            seg = np.pad(seg, (0, hop * 2 - len(seg)))
        y = band(seg * win, fc * (1 - width), fc * (1 + width))
        k = min(hop * 2, n - i)
        out[i:i + k] += y[:k]
    return out / (np.abs(out).max() + 1e-9)


def osc(freq, sec, kind="sine", detune=0.0):
    """freq : un nombre ou une courbe (Hz par échantillon)"""
    n = int(sec * SR)
    f = np.full(n, float(freq)) if np.isscalar(freq) else freq[:n]
    ph = 2 * np.pi * np.cumsum(f * (1 + detune)) / SR
    if kind == "sine":
        return np.sin(ph)
    if kind == "saw":  # dent de scie adoucie : 12 harmoniques
        return sum(np.sin(ph * k) / k for k in range(1, 13)) * 0.6
    if kind == "square":
        return sum(np.sin(ph * k) / k for k in range(1, 12, 2)) * 0.8
    raise ValueError(kind)


def note(n):  # numéro MIDI -> Hz
    return 440 * 2 ** ((n - 69) / 12)


def reverb(x, sec=1.8, wet=0.3):
    ir = rng.standard_normal(int(sec * SR)) * np.exp(-np.arange(int(sec * SR)) / SR / (sec / 5))
    ir = band(ir, 200, 9000)
    ir /= np.abs(ir).sum() ** 0.5 * 6
    out = np.zeros_like(x)
    for c in range(2):
        L = len(x) + len(ir)
        y = np.fft.irfft(np.fft.rfft(x[:, c], L) * np.fft.rfft(ir, L), L)[:len(x)]
        out[:, c] = y
    return x * (1 - wet) + out * wet * 3


# ---------- les sons ----------

def kick(big=False):
    sec = 0.9 if big else 0.42
    n = int(sec * SR)
    t = np.arange(n) / SR
    f = 42 + (180 if big else 140) * np.exp(-t / 0.035)
    s = osc(f, sec) * env(n, 0.001, 0.32 if big else 0.16)
    s += band(noise(sec), 2000, 8000) * env(n, 0.0005, 0.006) * 0.5
    return np.tanh(s * 1.8)


def clap():
    sec = 0.4
    n = int(sec * SR)
    x = band(noise(sec), 900, 5000)
    e = np.zeros(n)
    for k, d in enumerate([0, 0.011, 0.022]):
        e += np.roll(env(n, 0.0005, 0.008 if k < 2 else 0.11), at(d))
    return x * e * 0.9


def hat(open_=False):
    sec = 0.35 if open_ else 0.06
    n = int(sec * SR)
    return band(noise(sec), 7000, 16000) * env(n, 0.0005, 0.12 if open_ else 0.018)


def sub808(midi, sec):
    n = int(sec * SR)
    t = np.arange(n) / SR
    f = note(midi) * (1 + 0.5 * np.exp(-t / 0.02))
    s = osc(f, sec) * np.minimum(1, (sec - t) / 0.03) * env(n, 0.003, sec * 0.9)
    return np.tanh(s * 2.2) * 0.8


def impact(size=1.0):
    """le BOOM : le kick géant, la basse qui tombe, le fracas"""
    sec = 2.6
    n = int(sec * SR)
    t = np.arange(n) / SR
    boom = osc(30 + 90 * np.exp(-t / 0.09), sec) * env(n, 0.001, 0.9)
    crash = band(noise(sec), 300, 12000) * env(n, 0.001, 0.5) * 0.45
    s = np.tanh((boom * 1.6 + crash) * size)
    s[: len(kick(True))] += kick(True) * 0.6
    return s


def whoosh(sec=0.5, up=True):
    s = sweep_noise(sec, 300 if up else 6000, 6000 if up else 300, 0.5)
    n = len(s)
    e = np.sin(np.linspace(0, np.pi, n)) ** (1.5 if up else 0.7)
    if up:
        e = np.linspace(0, 1, n) ** 2.5
    return s * e


def riser(sec):
    n = int(sec * SR)
    t = np.arange(n) / SR
    tone = osc(110 * 2 ** (t / sec * 2.5), sec, "saw") * 0.25
    nz = sweep_noise(sec, 400, 9000, 0.4) * 0.6
    return (tone + nz) * (t / sec) ** 2


def tick():
    sec = 0.03
    return band(noise(sec), 2500, 7000) * env(int(sec * SR), 0.0002, 0.006)


def chime(midi, sec=0.9):
    n = int(sec * SR)
    s = sum(osc(note(midi) * k, sec) * a for k, a in [(1, 1), (2, 0.4), (3, 0.25), (4.2, 0.15)])
    return s * env(n, 0.002, 0.28) * 0.5


def coin():
    sec = 0.5
    n = int(sec * SR)
    a = osc(note(88), sec, "square") * env(n, 0.001, 0.05)
    b = osc(note(93), sec, "square") * env(n, 0.001, 0.25)
    return (a + np.roll(b, at(0.07))) * 0.18


def rip():
    sec = 0.55
    n = int(sec * SR)
    x = sweep_noise(sec, 1200, 4500, 0.5)
    grit = (rng.random(n) < 0.02) * rng.standard_normal(n) * 3
    return (x + band(grit, 500, 6000)) * env(n, 0.005, 0.22)


def glitch(sec=0.18):
    n = int(sec * SR)
    s = osc(np.repeat(rng.uniform(200, 2400, n // 400 + 1), 400), sec, "square")
    return s * (rng.random(n) > 0.3) * env(n, 0.001, 0.08) * 0.35


def pad(chord, sec, gain=0.12):
    n = int(sec * SR)
    s = sum(osc(note(m), sec, "saw", d) for m in chord for d in (-0.004, 0.004))
    s = band(s, 60, 2400)
    a = np.minimum(1, np.arange(n) / SR / 0.4) * np.minimum(1, (n - np.arange(n)) / SR / 0.6)
    return s * a * gain


def pluck(midi, sec=0.35):
    n = int(sec * SR)
    s = osc(note(midi), sec, "saw") + osc(note(midi + 12), sec, "square") * 0.3
    return band(s, 200, 5000) * env(n, 0.002, 0.11) * 0.22


# ---------- la partition ----------

# l'intro : un bourdon grave, les coups de cœur, les grésillements, la montée
drone = pad([33, 40, 45], 4.0, 0.16)
add(drone, 0, 1.0)
for t0, g in [(0.5, 0.8), (1.5, 0.7), (2.0, 1.0)]:
    add(kick(True), t0, g)
    add(glitch(0.22), t0, 0.9, 0.3)
for k in range(10):
    add(glitch(0.08 + rng.random() * 0.1), 2.6 + k * 0.11, 0.5 + k * 0.05, rng.uniform(-0.7, 0.7))
add(riser(1.25), 2.5, 0.9)
add(whoosh(0.6), 3.4, 0.6)

# le BOOM, puis le beat : A mineur — F, C, G, Am (2 mesures chacun)
add(impact(1.2), 4.0, 1.0)
PROG = [(41, [53, 57, 60]), (36, [48, 52, 55]), (43, [50, 55, 59]), (45, [52, 57, 60])]
END = 31.5
t = 4.0
bar = 0
while t < END - 1e-6:
    root, chord = PROG[(bar // 2) % 4]
    half = bar % 2
    # les 808 : un motif syncopé
    for st, ln in [(0, 0.7), (0.75, 0.25), (1.5, 0.45)]:
        if t + st < END:
            add(sub808(root - 12 + (12 if (half and st == 1.5) else 0), ln), t + st, 0.95)
    # le kick et le clap
    for st in [0, 0.75, 1.5] if not half else [0, 1.0, 1.25]:
        if t + st < END:
            add(kick(), t + st, 0.9)
    for st in [0.5, 1.5]:
        if t + st < END:
            add(clap(), t + st, 0.55, 0.1)
    # les charlestons, en croches, avec des roulements
    for k in range(8):
        st = k * 0.25
        if t + st >= END:
            break
        add(hat(open_=(k == 7)), t + st, 0.18 if k % 2 else 0.26, 0.35)
        if half and k == 6:
            for r in range(4):
                add(hat(), t + st + r * 0.0625, 0.14, 0.35)
    # le synthé : un arpège sur l'accord
    for k in range(8):
        st = k * 0.25
        if t + st < END:
            add(pluck(chord[k % 3] + (12 if k in (3, 6) else 0)), t + st, 0.9, -0.25 if k % 2 else 0.25)
    add(pad(chord, 2.0, 0.07), t, 1.0)
    t += 2.0
    bar += 1

# les bruitages, collés aux images
for c in [7.0, 14.5, 17.5, 21.5, 25.5, 27.5]:
    add(whoosh(0.45), c - 0.45, 0.55)
    add(kick(True), c, 0.55)
add(rip(), 7.45, 0.9)
add(impact(0.8), 7.5, 0.5)
# la bande des raretés : les plaques qui passent, de moins en moins vite
tt, gap = 8.55, 0.035
while tt < 10.0:
    add(tick(), tt, 0.5, rng.uniform(-0.2, 0.2))
    tt += gap
    gap *= 1.07
add(impact(1.1), 10.0, 0.85)
add(chime(84, 1.6), 10.0, 0.7)
add(chime(91, 1.6), 10.05, 0.5)
# les cartes qui se retournent
for k, tf in enumerate([11.38, 11.63, 11.89, 12.15, 12.4]):
    add(whoosh(0.18, up=False), tf - 0.05, 0.35)
    add(chime(76 + k * 2, 0.5), tf + 0.05, 0.35)
add(chime(88, 1.2), 12.7, 0.5)
add(impact(0.9), 14.5, 0.7)
add(chime(93, 2.0), 14.55, 0.5)
# les raretés, une par temps : une note de plus en plus haute
for k, m in enumerate([72, 76, 79, 84, 91]):
    add(chime(m, 0.8), 17.5 + k * 0.5, 0.75)
    add(kick(True), 17.5 + k * 0.5, 0.35 + k * 0.08)
add(whoosh(0.5), 21.0, 0.6)
# la vente : les clics, la frappe, la caisse
for c in [22.15, 22.95, 24.45]:
    add(tick(), c, 1.2)
for k in range(4):
    add(tick(), 23.2 + k * 0.12, 0.7)
add(coin(), 24.5, 1.0)
add(impact(0.8), 28.0, 0.5)
add(impact(1.2), 28.5, 0.9)
for c in [29.25, 29.75, 30.25]:
    add(coin(), c, 1.0, rng.uniform(-0.5, 0.5))
for k in range(16):
    add(coin(), 29.0 + k * 0.11, 0.35, rng.uniform(-0.8, 0.8))
add(riser(0.5), 31.0, 0.6)
# la fin : le logo, l'accord qui reste
add(impact(1.3), 32.0, 1.0)
add(pad([45, 52, 57, 60, 64], 4.0, 0.16), 32.0, 1.0)
add(chime(81, 3.0), 32.0, 0.6)
add(chime(88, 3.0), 32.05, 0.5)
add(chime(93, 3.0), 33.1, 0.45)

out = reverb(mix, 1.6, 0.18)
out = np.tanh(out * 0.9)
fade = np.ones(N)
fade[at(35.0):] = np.linspace(1, 0, N - at(35.0))
out *= fade[:, None]
out /= np.abs(out).max() / 0.89

os.makedirs(os.path.join(os.path.dirname(__file__), "out"), exist_ok=True)
path = os.path.join(os.path.dirname(__file__), "out", "music.wav")
with wave.open(path, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((out * 32767).astype("<i2").tobytes())
print(path)
