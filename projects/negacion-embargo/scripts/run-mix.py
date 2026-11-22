#!/usr/bin/env python3
"""Mezcla final del reel: VO colocada + cama (con dips horneados) + SFX.

Lee research/timeline.json: los SFX bajo VO usan la copia con uvo de
public/audio/sfx-mix/; los demás, el original de public/audio/sfx/.
El `at` ya descuenta el sync del índice (el ataque cae sobre el evento).

Uso: HUB_PY=... python3 scripts/run-mix.py [--force]
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
HUB_PY = os.environ.get("HUB_PY",
                        os.path.expanduser("~/workspace/remotion-hub/.venv/bin/python"))
MIX = os.path.expanduser("~/workspace/remotion-hub/repo/scripts/audio/mix.py")


def main() -> int:
    t = json.load(open(os.path.join(PROJ, "research/timeline.json")))
    # Ducking: receta probada de marti-fidel V1.5+ (threshold 0,08,
    # ratio 5, release 250 ms): bombeo 20,1 -> 9,1 dB, profundidad
    # media -11,8 -> -3,4 dB, recuperación perfecta. Los defaults de
    # mix.py (0,018 / 7 / 420 ms) bombean ~20 dB y recuperan lento
    # (el check (f) de la auditoría haría FAIL en recuperación).
    args = [HUB_PY, MIX,
            "--voice", os.path.join(PROJ, "public/audio/voice-placed.wav"),
            "--music", os.path.join(PROJ, "public/audio/music-bed.wav"),
            "--seconds", str(t["duration_s"]),
            "--duck-threshold", "0.08",
            "--duck-ratio", "5",
            "--duck-release", "250",
            "--out", os.path.join(PROJ, "public/audio/mix.wav")]
    if "--force" in sys.argv:
        args.append("--force")
    for s in t["sfx"]:
        if s["underVO"]:
            path = os.path.join(PROJ, "public/audio/sfx-mix",
                                f"{s['id']}.wav")
        else:
            path = os.path.join(PROJ, "public", s["file"])
        if not os.path.isfile(path):
            print(f"FALTA SFX: {path}", file=sys.stderr)
            return 1
        args += ["--sfx", f"{path}@{s['at_s']}"]
    print(f"mezclando: VO + cama + {len(t['sfx'])} SFX -> mix.wav "
          f"({t['duration_s']} s)")
    return subprocess.run(args, cwd=PROJ).returncode


if __name__ == "__main__":
    raise SystemExit(main())
