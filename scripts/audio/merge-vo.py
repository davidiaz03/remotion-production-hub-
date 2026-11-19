#!/usr/bin/env python3
"""Fusiona los WAV de capítulo de vo-batch.py en un solo vo-full.wav.

Generalización de projects/modern-wisdom-aprende/scripts/merge-vo.py:
los capítulos vienen del mismo manifiesto de vo-batch.py (en orden) y
los lines_json se fusionan con tiempos ABSOLUTOS (offset = duración
acumulada de los capítulos previos). Los capítulos son contiguos en el
timeline (sin huecos entre ellos), así que los tiempos absolutos del
WAV fusionado coinciden con el timeline del video.

Uso:
  python3 scripts/audio/merge-vo.py --manifest vo-manifest.json \\
      --out public/audio/vo-full.wav \\
      --lines-out vo-chapters/vo-full-lines.json
"""
import argparse
import json
import os
import sys
import wave


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--manifest", required=True,
                   help="Manifiesto de vo-batch.py (chapters en orden)")
    p.add_argument("--root", default=".",
                   help="Carpeta del proyecto (rutas relativas)")
    p.add_argument("--out", required=True, help="WAV fusionado")
    p.add_argument("--lines-out", required=True,
                   help="lines.json fusionado (tiempos absolutos)")
    p.add_argument("--force", action="store_true")
    a = p.parse_args()
    if os.path.exists(a.out) and not a.force:
        p.error(f"la salida ya existe: {a.out} (usa --force)")
    with open(a.manifest, encoding="utf-8") as f:
        chapters = json.load(f)["chapters"]
    if not chapters:
        p.error("el manifiesto no trae capítulos")
    root = os.path.abspath(a.root)
    merged_lines = []
    offset = 0.0
    total_frames = 0
    params = None
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    os.makedirs(os.path.dirname(os.path.abspath(a.lines_out)),
                exist_ok=True)
    with wave.open(a.out, "wb") as out:
        for n, ch in enumerate(chapters):
            wav_path = os.path.join(root, ch["out"])
            lines_path = os.path.join(root, ch["lines_json"])
            if not os.path.isfile(wav_path):
                raise SystemExit(f"falta {wav_path}")
            if not os.path.isfile(lines_path):
                raise SystemExit(f"falta {lines_path}")
            with wave.open(wav_path, "rb") as w:
                cur = (w.getnchannels(), w.getsampwidth(),
                       w.getframerate())
                if params is None:
                    params = cur
                    out.setnchannels(cur[0])
                    out.setsampwidth(cur[1])
                    out.setframerate(cur[2])
                elif cur != params:
                    raise SystemExit(
                        f"{ch['out']} tiene otros parámetros: "
                        f"{cur} ≠ {params}")
                frames = w.readframes(w.getnframes())
                out.writeframes(frames)
                total_frames += w.getnframes()
            with open(lines_path, encoding="utf-8") as f:
                meta = json.load(f)
            for line in meta["lines"]:
                merged_lines.append({
                    "index": len(merged_lines),
                    "text": line["text"],
                    "start": round(offset + line["start"], 3),
                    "end": round(offset + line["end"], 3),
                    "duration": line["duration"],
                    "chapter": n,
                })
            offset += meta["total_duration"]
    total_s = total_frames / params[2]
    with open(a.lines_out, "w", encoding="utf-8") as f:
        json.dump({"sample_rate": params[2],
                   "total_duration": round(total_s, 3),
                   "lines": merged_lines}, f, ensure_ascii=False, indent=2)
    print(f"OK {a.out} — {len(chapters)} capítulos, {total_s:.2f} s, "
          f"{len(merged_lines)} líneas")
    return 0


if __name__ == "__main__":
    sys.exit(main())
