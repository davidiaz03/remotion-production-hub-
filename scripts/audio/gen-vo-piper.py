#!/usr/bin/env python3
"""Genera la voz en off de PREVISUALIZACIÓN con Piper (TTS neuronal local,
100% offline tras descargar el modelo).

Migración genérica de projects/marabana-v1/scripts/gen-vo-piper.py: el
guion (fragmentos + pausas) viene de un JSON en vez de estar cableado.

Voz por defecto: es_MX-ald-medium (masculina, español de México).
Modelo: ~/workspace/.piper-voices/es_MX-ald-medium/

NOTA: la primera voz probada, es_MX-claude-high, resultó ser FEMENINA
(F0 mediana 184 Hz, verificada 15-nov-2026). No existe voz masculina
"high" en español en Piper; ald-medium es la mejor masculina
latinoamericana disponible.

¿Por qué Piper y no edge-tts? edge-tts (es-MX-JorgeNeural) usa WebSocket
contra speech.platform.bing.com y desde este entorno el endpoint NO
responde de forma utilizable (timeout de 60 s, HTTP 400, o 101 con el
header Connection mutilado por el proxy; verificado 15-nov-2026).

Estrategia: se sintetiza línea por línea y se concatenan con silencios
exactos en los puntos dramáticos. Esto da, además, la duración de cada
línea para el re-timing de los beats y para transcribe-vo.py.

La VO de Piper es SOLO previsualización: el usuario graba la definitiva
y se re-sincronizan karaoke y ritmo (ver EDIT_NOTES.md de cada proyecto).

Uso:
  .venv/bin/python scripts/audio/gen-vo-piper.py --script vo-script.json \\
      --out public/audio/vo-preview.wav
  # vo-script.json: {"fragments": [{"text": "...", "pause_after": 0.2}, ...]}
  # Salida: <out> (22.050 Hz mono, sin normalizar) + <out-dir>/vo-lines.json
  # con los tiempos de cada línea. prep-vo.sh lo pasa a 48 kHz y -14 LUFS.

Trucos de guion para TTS (documentados en Marabana):
- Iniciales deletreadas: "O.F.A.C." con puntos (espeak deletrea).
- Pausas dramáticas: pause_after mayor tras el giro (0.45 s) y antes
  del remate (0.65 s); 0.2 s de respiración entre líneas normales.
- Piper NO es determinista entre ejecuciones: no regenerar la VO
  completa para cambiar una línea (sintetizar solo el fragmento y
  empalmar, como splice-open-loop.py).
"""
import argparse
import json
import os
import subprocess
import sys
import wave

import numpy as np

DEFAULT_MODEL = os.path.expanduser(
    "~/workspace/.piper-voices/es_MX-ald-medium/es_MX-ald-medium.onnx")
DEFAULT_LENGTH_SCALE = "0.75"
PIPER_BIN = os.path.expanduser(
    "~/workspace/remotion-hub/.venv/bin/piper")


def synth_line(text: str, out_path: str, model: str, length_scale: str) -> None:
    result = subprocess.run(
        [PIPER_BIN, "--model", model, "--output_file", out_path,
         "--sentence-silence", "0.0", "--length-scale", length_scale],
        input=text.encode("utf-8"), capture_output=True,
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"piper falló para {text!r}: {result.stderr.decode()}")


def read_wav(path: str) -> tuple[np.ndarray, int]:
    with wave.open(path, "rb") as w:
        n = w.getnframes()
        rate = w.getframerate()
        data = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32)
    return data, rate


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--script", required=True,
                   help='JSON {"fragments": [{"text", "pause_after"}]}')
    p.add_argument("--out", required=True, help="WAV de salida")
    p.add_argument("--lines-json",
                   help="JSON de tiempos (por defecto <out-dir>/vo-lines.json)")
    p.add_argument("--model", default=DEFAULT_MODEL)
    p.add_argument("--length-scale", default=DEFAULT_LENGTH_SCALE,
                   help="<1 acelera el habla (0.75 = ritmo de reel)")
    p.add_argument("--tmp-dir", default="/tmp/vo-piper")
    p.add_argument("--force", action="store_true")
    a = p.parse_args()

    with open(a.script, encoding="utf-8") as f:
        fragments = json.load(f)["fragments"]
    if not fragments:
        p.error("sin fragmentos en el guion")
    lines_json = a.lines_json or os.path.join(
        os.path.dirname(os.path.abspath(a.out)), "vo-lines.json")
    if os.path.exists(a.out) and not a.force:
        p.error(f"la salida ya existe: {a.out} (usa --force)")

    os.makedirs(a.tmp_dir, exist_ok=True)
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)

    parts: list[np.ndarray] = []
    lines: list[dict] = []
    t = 0.0
    sample_rate = 22050
    for i, frag in enumerate(fragments):
        text, pause_after = frag["text"], frag.get("pause_after", 0.0)
        frag_path = os.path.join(a.tmp_dir, f"frag-{i:02d}.wav")
        synth_line(text, frag_path, a.model, a.length_scale)
        audio, sample_rate = read_wav(frag_path)
        # Recorta silencio inicial/final propio de Piper (umbral bajo).
        nonzero = np.nonzero(np.abs(audio) > 100)[0]
        if len(nonzero):
            audio = audio[nonzero[0]:nonzero[-1] + 1]
        dur = len(audio) / sample_rate
        lines.append({"index": i, "text": text, "start": round(t, 3),
                      "end": round(t + dur, 3), "duration": round(dur, 3)})
        print(f"frag {i:02d} {t:6.2f}-{t + dur:6.2f}s ({dur:5.2f}s) {text[:60]}")
        parts.append(audio)
        t += dur
        if pause_after > 0:
            parts.append(np.zeros(int(pause_after * sample_rate),
                                  dtype=np.float32))
            t += pause_after

    full = np.concatenate(parts).astype(np.int16)
    with wave.open(a.out, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        w.writeframes(full.tobytes())
    total = len(full) / sample_rate
    with open(lines_json, "w", encoding="utf-8") as f:
        json.dump({"sample_rate": sample_rate,
                   "total_duration": round(total, 3), "lines": lines},
                  f, ensure_ascii=False, indent=2)
    print(f"\nOK {a.out} — duración total {total:.2f} s "
          f"({len(lines)} fragmentos)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
