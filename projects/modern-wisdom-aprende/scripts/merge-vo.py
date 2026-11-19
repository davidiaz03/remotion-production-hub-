#!/usr/bin/env python3
"""Concatena los 15 WAV de capítulo (Kokoro, 24 kHz mono) en un solo
vo-full.wav y fusiona los 15 chNN-lines.json en vo-full-lines.json con
tiempos ABSOLUTOS (offset = duración acumulada de los capítulos previos).

Los capítulos son contiguos en src/timeline.json (sin huecos entre ellos),
así que los tiempos absolutos del WAV concatenado coinciden con el timeline.

Uso: python3 scripts/merge-vo.py   (desde la raíz del proyecto)
Salidas: public/audio/vo-full.wav, vo-chapters/vo-full-lines.json
"""
import json
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VO_DIR = ROOT / "public/audio/vo"
OUT_WAV = ROOT / "public/audio/vo-full.wav"
OUT_LINES = ROOT / "vo-chapters/vo-full-lines.json"


def main() -> None:
    merged_lines = []
    offset = 0.0
    total_frames = 0
    params = None

    with wave.open(str(OUT_WAV), "wb") as out:
        for n in range(15):
            f = f"ch{n:02d}"
            wav_path = VO_DIR / f"{f}.wav"
            lines_path = ROOT / "vo-chapters" / f"{f}-lines.json"
            if not wav_path.exists():
                raise SystemExit(f"falta {wav_path}")
            if not lines_path.exists():
                raise SystemExit(f"falta {lines_path}")
            with wave.open(str(wav_path), "rb") as w:
                if params is None:
                    params = (w.getnchannels(), w.getsampwidth(), w.getframerate())
                    out.setnchannels(params[0])
                    out.setsampwidth(params[1])
                    out.setframerate(params[2])
                else:
                    cur = (w.getnchannels(), w.getsampwidth(), w.getframerate())
                    if cur != params:
                        raise SystemExit(f"{f}.wav tiene otros parámetros: {cur} ≠ {params}")
                frames = w.readframes(w.getnframes())
                out.writeframes(frames)
                total_frames += w.getnframes()
            meta = json.loads(lines_path.read_text(encoding="utf-8"))
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
            print(f"{f}: {meta['total_duration']:.2f}s, offset acumulado {offset:.2f}s")

    total_duration = total_frames / params[2]
    OUT_LINES.write_text(json.dumps({
        "sample_rate": params[2],
        "voice": "em_alex",
        "speed": 0.95,
        "total_duration": round(total_duration, 3),
        "lines": merged_lines,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OK {OUT_WAV} ({total_duration:.1f}s) + {OUT_LINES} "
          f"({len(merged_lines)} líneas)")


if __name__ == "__main__":
    main()
