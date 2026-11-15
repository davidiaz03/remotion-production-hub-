#!/usr/bin/env python3
"""V1.2 — SFX sintetizados con numpy (sin fuentes externas ni login).

Tres efectos en una sola pista (public/audio/sfx.wav, 48 kHz estéreo,
44.97 s = CONTENT_END, silencio fuera de los tres momentos). Niveles
discretos bajo la VO; el disparo del sting no se toca.
  1. Golpe seco/grave en el sello CANCELADO — 4.42 s (frame 133):
     seno 70→45 Hz con decay exponencial (0.22 s) + click de ruido de
     10 ms. Pico -18 dBFS.
  2. Whoosh en el whip de cambio de acto — 11.77 s (frame 353):
     ruido blanco con barrido de banda 400→2500 Hz (0.5 s, ventana
     FFT con overlap-add) y envolvente en campana. Pico -20 dBFS.
  3. Riser antes del beat de Ernesto — 34.176–35.976 s (1.8 s):
     seno 180→880 Hz + ruido filtrado, crescendo hasta -22 dBFS y
     corte limpio justo al arrancar Ernesto (frame 1079).

La deriva de audio del pipeline por tramos (~+0.3 s al final, ver
EDIT_NOTES.md) desplaza estos efectos igual que a la VO y la música:
el golpe y el whoosh caen en los primeros 12 s (deriva < 0.1 s) y el
riser es un sonido gradual (0.25 s de desfase en su resolución no se
percibe). No se pre-compensa.

Uso: ~/workspace/remotion-hub/.venv/bin/python scripts/make-sfx-v12.py
"""
import os
import wave

import numpy as np

PROJECT = os.path.expanduser("~/workspace/remotion-hub/repo/projects/marabana-v1")
OUT = os.path.join(PROJECT, "public/audio/sfx.wav")
SR = 48000
TOTAL = 44.97  # CONTENT_END

# Tiempos (s) — de src/timeline.ts
STAMP_T = 133 / 30      # 4.433 s (frame exacto del sello)
WHOOSH_T = 353 / 30     # 11.767 s (whip del giro)
RISER_END = 1079 / 30   # 35.967 s (arranque de Ernesto)
RISER_DUR = 1.8


def dbfs(x: float) -> float:
    return 10 ** (x / 20.0)


def thump() -> np.ndarray:
    """Golpe grave: seno con caída de frecuencia + click de ruido."""
    dur = 0.25
    n = int(dur * SR)
    t = np.arange(n) / SR
    freq = 70 - 25 * (t / dur)  # 70 -> 45 Hz
    phase = 2 * np.pi * np.cumsum(freq) / SR
    body = np.sin(phase) * np.exp(-t * 18.0)
    rng = np.random.default_rng(7)
    click = rng.standard_normal(int(0.012 * SR)) * np.exp(
        -np.arange(int(0.012 * SR)) / (0.003 * SR)) * 0.5
    sig = body.copy()
    sig[: len(click)] += click
    sig *= dbfs(-18.0) / np.max(np.abs(sig))
    return sig


def swept_noise(dur: float, f0: float, f1: float, peak_db: float) -> np.ndarray:
    """Ruido blanco con barrido de banda por ventanas FFT (overlap-add)."""
    rng = np.random.default_rng(11)
    n = int(dur * SR)
    noise = rng.standard_normal(n)
    win, hop = 1024, 256
    out = np.zeros(n + win)
    window = np.hanning(win)
    freqs = np.fft.rfftfreq(win, 1 / SR)
    for start in range(0, n, hop):
        frac = start / n
        fc = f0 * (f1 / f0) ** frac  # barrido logarítmico
        seg = noise[start:start + win]
        if len(seg) < win:
            seg = np.pad(seg, (0, win - len(seg)))
        spec = np.fft.rfft(seg * window)
        # Banda de una octava alrededor de fc
        band = np.exp(-0.5 * (np.log2(np.maximum(freqs, 1) / fc) ** 2) / 0.25 ** 2)
        out[start:start + win] += np.fft.irfft(spec * band, win) * window
    out = out[:n]
    # Envolvente en campana (sube y baja)
    env = np.sin(np.pi * np.arange(n) / n) ** 1.5
    out *= env
    out *= dbfs(peak_db) / np.max(np.abs(out))
    return out


def riser() -> np.ndarray:
    """Subida que resuelve en Ernesto: seno ascendente + ruido."""
    n = int(RISER_DUR * SR)
    t = np.arange(n) / SR
    # Seno 180 -> 880 Hz, subida exponencial
    freq = 180 * (880 / 180) ** (t / RISER_DUR)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    tone = np.sin(phase)
    noise = swept_noise(RISER_DUR, 300, 4000, -30.0)
    # Crescendo cuadrático; los últimos 30 ms caen a cero (corte limpio)
    env = (t / RISER_DUR) ** 2
    fade = np.ones(n)
    m = int(0.03 * SR)
    fade[-m:] = np.linspace(1, 0, m)
    sig = (tone * 0.7 + noise * 0.6) * env * fade
    sig *= dbfs(-22.0) / np.max(np.abs(sig))
    return sig


def main():
    total = int(TOTAL * SR)
    mix = np.zeros(total, dtype=np.float32)

    th = thump()
    s0 = int(STAMP_T * SR)
    mix[s0:s0 + len(th)] += th
    print(f"golpe del sello: {STAMP_T:.3f} s, {len(th) / SR:.2f} s, "
          f"pico {20 * np.log10(np.max(np.abs(th))):.1f} dBFS")

    wh = swept_noise(0.5, 400, 2500, -20.0)
    s0 = int(WHOOSH_T * SR)
    mix[s0:s0 + len(wh)] += wh
    print(f"whoosh: {WHOOSH_T:.3f} s, 0.50 s, "
          f"pico {20 * np.log10(np.max(np.abs(wh))):.1f} dBFS")

    ri = riser()
    s0 = int((RISER_END - RISER_DUR) * SR)
    mix[s0:s0 + len(ri)] += ri
    print(f"riser: {RISER_END - RISER_DUR:.3f}-{RISER_END:.3f} s, "
          f"pico {20 * np.log10(np.max(np.abs(ri))):.1f} dBFS")

    peak = np.max(np.abs(mix))
    print(f"pico global de la pista SFX: {20 * np.log10(peak):.1f} dBFS")
    stereo = np.stack([mix, mix], axis=1)
    pcm = np.clip(stereo, -1, 1)
    pcm = (pcm * 32767).astype(np.int16)
    with wave.open(OUT, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"OK {OUT} ({os.path.getsize(OUT) / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
