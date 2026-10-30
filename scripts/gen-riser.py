#!/usr/bin/env python3
"""The film's ending riser, made here so its licence is ours (upstream's riser-cine cannot be traced).

1.5 s: three detuned sine partials gliding up from 180 to 2000 Hz, noise through a low-pass that opens up,
an accelerating tremolo, volume climbing with t^2.2 and a 12 ms fade at the end so it cuts cleanly into the
impact. Needs numpy and ffmpeg. Output: public/motion-studio/sfxlib/riser/riser-rise-build.mp3
(then run `npm run gen:sfx-peaks`).
"""
import subprocess, wave
import numpy as np

SR, DUR = 44100, 1.5
n = int(SR * DUR)
t = np.arange(n) / SR
rng = np.random.default_rng(20261030)
f = 180 * np.exp(np.log(2000 / 180) * (t / DUR) ** 1.6)
phase = 2 * np.pi * np.cumsum(f) / SR
tone = sum(np.sin(phase * m + ph) * a for m, a, ph in [(1, 0.5, 0), (1.005, 0.35, 1.3), (2.01, 0.25, 2.1), (3.0, 0.12, 0.7)])
white = rng.standard_normal(n)
cut = 300 * np.exp(np.log(9000 / 300) * (t / DUR) ** 1.3)
a = 1 - np.exp(-2 * np.pi * cut / SR)
noise = np.zeros(n)
y = 0.0
for i in range(n):
    y += a[i] * (white[i] - y)
    noise[i] = y
noise /= np.max(np.abs(noise))
trem = 1 - 0.35 * (0.5 + 0.5 * np.sin(2 * np.pi * np.cumsum(6 + 22 * (t / DUR) ** 2) / SR))
sig = (0.55 * tone / np.max(np.abs(tone)) + 0.75 * noise) * (t / DUR) ** 2.2 * trem
sig *= np.minimum(1, (DUR - t) / 0.012)
sig *= 0.7 / np.max(np.abs(sig))
w = wave.open("/tmp/riser.wav", "wb")
w.setnchannels(1)
w.setsampwidth(2)
w.setframerate(SR)
w.writeframes((np.clip(sig, -1, 1) * 32767).astype("<i2").tobytes())
w.close()
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "/tmp/riser.wav", "-codec:a", "libmp3lame", "-q:a", "3", "public/motion-studio/sfxlib/riser/riser-rise-build.mp3"], check=True)
