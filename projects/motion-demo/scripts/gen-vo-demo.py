#!/usr/bin/env python3
"""Genera la VO de PREVISUALIZACIÓN de la demo del módulo motion con Piper.

Mismo patrón que projects/marabana-v1/scripts/gen-vo-piper.py: síntesis
línea por línea (es_MX-ald-medium, length_scale 0.75, ritmo de reel),
concatenación con 0,2 s de respiración entre líneas.

Uso: ~/workspace/remotion-hub/.venv/bin/python scripts/gen-vo-demo.py
Salida: public/audio/vo-demo.wav (22.050 Hz mono) + vo-lines.json
"""
import json
import os
import subprocess
import wave

import numpy as np

PROJECT = os.path.expanduser(
    "~/workspace/remotion-hub/repo/projects/motion-demo"
)
MODEL = os.path.expanduser(
    "~/workspace/.piper-voices/es_MX-ald-medium/es_MX-ald-medium.onnx"
)
LENGTH_SCALE = "0.75"
OUT_WAV = os.path.join(PROJECT, "public/audio/vo-demo.wav")
OUT_JSON = os.path.join(PROJECT, "public/audio/vo-lines.json")
TMP_DIR = "/tmp/vo-demo-piper"

# (texto, silencio DESPUÉS en segundos)
FRAGMENTS = [
    ("¿Sabías que el Memorial guarda la historia que no te contaron?", 0.20),
    ("Visítalo en tres pasos.", 0.20),
    ("Uno: abre el mapa y busca Miramar.", 0.20),
    ("Dos: toca reservar y elige tu día.", 0.20),
    ("Tres: recorre la denuncia.", 0.25),
    ("El Memorial te espera.", 0.0),
]


def synth_line(text: str, out_path: str) -> None:
    result = subprocess.run(
        [
            os.path.expanduser("~/workspace/remotion-hub/.venv/bin/piper"),
            "--model", MODEL,
            "--output_file", out_path,
            "--sentence-silence", "0.0",
            "--length-scale", LENGTH_SCALE,
        ],
        input=text.encode("utf-8"),
        capture_output=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"piper falló para {text!r}: {result.stderr.decode()}")


def read_wav(path: str):
    with wave.open(path, "rb") as w:
        n = w.getnframes()
        rate = w.getframerate()
        data = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32)
    return data, rate


def main() -> None:
    os.makedirs(TMP_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(OUT_WAV), exist_ok=True)
    parts: list[np.ndarray] = []
    lines: list[dict] = []
    t = 0.0
    sample_rate = 22050
    for i, (text, pause_after) in enumerate(FRAGMENTS):
        frag_path = os.path.join(TMP_DIR, f"frag-{i:02d}.wav")
        synth_line(text, frag_path)
        audio, sample_rate = read_wav(frag_path)
        nonzero = np.nonzero(np.abs(audio) > 100)[0]
        if len(nonzero):
            audio = audio[nonzero[0]:nonzero[-1] + 1]
        dur = len(audio) / sample_rate
        lines.append({
            "index": i, "text": text,
            "start": round(t, 3), "end": round(t + dur, 3),
            "duration": round(dur, 3),
        })
        print(f"frag {i:02d} {t:6.2f}-{t + dur:6.2f}s ({dur:5.2f}s) {text[:60]}")
        parts.append(audio)
        t += dur
        if pause_after > 0:
            parts.append(np.zeros(int(pause_after * sample_rate), dtype=np.float32))
            t += pause_after
    full = np.concatenate(parts).astype(np.int16)
    with wave.open(OUT_WAV, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        w.writeframes(full.tobytes())
    json.dump(lines, open(OUT_JSON, "w"), ensure_ascii=False, indent=1)
    print(f"total VO: {t:.2f}s -> {OUT_WAV} ({os.path.getsize(OUT_WAV)} bytes)")


if __name__ == "__main__":
    main()
