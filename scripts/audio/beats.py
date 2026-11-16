#!/usr/bin/env python3
"""Detecta beats y onsets de una pista de música (Fase B, R16 — aubio).

Uso:
  .venv/bin/python scripts/audio/beats.py <audio.wav|mp3> [--fps 30]
      [--out beats.json] [--min-bpm 40] [--max-bpm 240]

Salida JSON:
  {"file": ..., "duration": ..., "bpm": ..., "beats": [seg, ...],
   "beats_frames": [f, ...], "onsets": [seg, ...], "onsets_frames": [f, ...]}

Para qué sirve en un reel: colocar cortes y transiciones SOBRE el ritmo
de la música (Flow o MusicGen) sin hacerlo a oído. `beats_frames` da los
fotogramas (a --fps, defecto 30) donde cae cada beat: úsalos como
fronteras de escena en TransitionSeries o como `atFrame` de SFX.

Método: aubio `tempo` (detección de beats por onset + seguimiento de
tempo) + `onset` (ataques). El BPM se estima de la mediana de los
intervalos entre beats; si la pista es ambiental sin pulso claro (típico
de cues documentales de Flow), los beats salen irregulares y el BPM es
poco fiable — en ese caso usa los onsets fuertes como guía, no el BPM.

Requiere aubio 0.4.9 en el venv del hub (`pip install aubio`).
"""
import argparse
import json
import statistics
import sys
import wave as wave_mod

import aubio


def wav_duration(path):
    """Duración real de un WAV (stdlib). Los WAV de Flow llevan una
    carátula mjpeg adjunta que confunde al lector de aubio (+5 s
    fantasma con beats inexistentes); la duración del módulo wave es
    la de verdad y sirve para recortar esos beats fantasma."""
    try:
        with wave_mod.open(path, "rb") as w:
            return w.getnframes() / w.getframerate()
    except Exception:
        return None


def detect(path, samplerate=0, hop=512):
    # samplerate=0 → frecuencia nativa del archivo (aubio no re-muestrea
    # sin libsamplerate; los WAV del hub son 48 kHz y pedir 44100 falla).
    src = aubio.source(path, samplerate, hop)
    sr = src.samplerate
    tempo = aubio.tempo("default", 1024, hop, sr)
    onset = aubio.onset("default", 1024, hop, sr)
    beats = []
    onsets = []
    total = 0
    while True:
        samples, read = src()
        if tempo(samples):
            beats.append(tempo.get_last_s())
        if onset(samples):
            onsets.append(onset.get_last_s())
        total += read
        if read < hop:
            break
    return sr, total / sr, beats, onsets


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("audio", help="Archivo de audio (wav/mp3/...)")
    ap.add_argument("--fps", type=float, default=30,
                    help="Fotogramas por segundo del reel (defecto 30)")
    ap.add_argument("--out", help="Archivo JSON de salida (defecto: stdout)")
    ap.add_argument("--min-bpm", type=float, default=40)
    ap.add_argument("--max-bpm", type=float, default=240)
    args = ap.parse_args()

    _, duration, beats, onsets = detect(args.audio)
    real = wav_duration(args.audio)
    if real is not None and abs(real - duration) > 0.5:
        # aubio leyó de más (p. ej. carátula mjpeg en WAV de Flow):
        # recortar beats/onsets a la duración real.
        print(f"aviso: aubio midió {duration:.1f}s pero el WAV dura "
              f"{real:.1f}s; recorto beats/onsets", file=sys.stderr)
        duration = real
        beats = [b for b in beats if b <= real]
        onsets = [o for o in onsets if o <= real]
    bpm = None
    if len(beats) >= 2:
        intervals = [b - a for a, b in zip(beats, beats[1:])]
        med = statistics.median(intervals)
        if med > 0:
            cand = 60.0 / med
            if args.min_bpm <= cand <= args.max_bpm:
                bpm = round(cand, 1)
    out = {
        "file": args.audio,
        "duration": round(duration, 3),
        "bpm": bpm,
        "beats": [round(b, 3) for b in beats],
        "beats_frames": [round(b * args.fps) for b in beats],
        "onsets": [round(o, 3) for o in onsets],
        "onsets_frames": [round(o * args.fps) for o in onsets],
    }
    text = json.dumps(out, indent=1, ensure_ascii=False)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as fh:
            fh.write(text + "\n")
    else:
        print(text)
    print(f"beats={len(beats)} onsets={len(onsets)} bpm={bpm} "
          f"dur={duration:.1f}s", file=sys.stderr)


if __name__ == "__main__":
    main()
