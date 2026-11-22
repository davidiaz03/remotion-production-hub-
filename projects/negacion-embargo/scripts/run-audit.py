#!/usr/bin/env python3
"""Auditoría de audio completa del reel (scripts/audio/audit-audio.py).

Uso: python3 scripts/run-audit.py <master.mp4> [--tag v1] [--force]
Lee research/timeline.json para los tiempos de SFX (tiempos de EVENTO,
no de inicio de archivo) y usa los mismos parámetros de ducking y
volumen de música que run-mix.py, para que la simulación del check
(f) coincida con la mezcla real.

FAIL = no entregar.
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
HUB_PY = os.environ.get("HUB_PY",
                        os.path.expanduser("~/workspace/remotion-hub/.venv/bin/python"))
AUDIT = os.path.expanduser(
    "~/workspace/remotion-hub/repo/scripts/audio/audit-audio.py")


def main() -> int:
    if len(sys.argv) < 2:
        print("uso: run-audit.py <master.mp4> [--tag v1]", file=sys.stderr)
        return 2
    master = sys.argv[1]
    tag = "v1"
    if "--tag" in sys.argv:
        tag = sys.argv[sys.argv.index("--tag") + 1]
    t = json.load(open(os.path.join(PROJ, "research/timeline.json")))
    vo = os.path.join(PROJ, "research/vo")
    pub = os.path.join(PROJ, "public")
    out_dir = os.path.join(PROJ, "research", f"audit-{tag}")
    args = [HUB_PY, AUDIT,
            "--project", "negacion-embargo", "--tag", tag,
            "--master", master,
            "--mix", os.path.join(pub, "audio/mix.wav"),
            "--voice-orig", os.path.join(vo, "voice-orig.wav"),
            "--voice-edited", os.path.join(pub, "audio/voice-placed.wav"),
            "--captions", os.path.join(vo, "captions-audit.json"),
            "--vo-lines", os.path.join(vo, "vo-lines.json"),
            "--transcription", os.path.join(vo, "vo-orig-transcription.json"),
            "--transcription-edited",
            os.path.join(vo, "vo-edited-transcription.json"),
            "--prediction", os.path.join(vo, "vo-editada-prediccion.json"),
            "--edit-plan", os.path.join(vo, "edit-plan.json"),
            "--section",
            os.path.join(pub, "audio/music-bed.wav") + "@0@77.5",
            "--music-volume", "0.40",  # igual que run-mix.py
            "--duck-release", "250",
            "--duck-threshold", "0.08",
            "--duck-ratio", "5",
            "--seconds", "77.5",
            "--expected-frames", "2325",
            "--out-dir", out_dir]
    for s in t["sfx"]:
        if s["underVO"]:
            path = os.path.join(pub, "audio/sfx-mix", f"{s['id']}.wav")
        else:
            path = os.path.join(pub, s["file"])
        args += ["--sfx", f"{path}@{s['event_s']}"]
    print(f"auditando {master} (tag {tag}, {len(t['sfx'])} SFX)")
    return subprocess.run(args, cwd=PROJ).returncode


if __name__ == "__main__":
    raise SystemExit(main())
