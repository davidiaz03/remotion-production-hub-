#!/usr/bin/env python3
"""Auditoría de audio completa del reel (scripts/audio/audit-audio.py).

Uso:
  python3 scripts/run-audit.py <master.mp4> [--tag v1]
  python3 scripts/run-audit.py --pre [--tag pre]   # pre-auditoría (P0-2)

La pre-auditoría corre SIN máster: audita la mezcla + captions + VO
colocada antes de renderizar (el patrón v4-pre2, que demostró 0 FAIL
sobre insumos antes del render v4). Es una puerta ADICIONAL, no un
reemplazo: la auditoría final sobre el máster sigue siendo obligatoria
(la pre-auditoría no ve deriva A/V, agujeros de frontera ni la
alineación karaoke/onset del máster). Con --pre se pasa --no-master
para que audit-audio.py NO recoja un out/*_MASTER.mp4 viejo.

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


def build_args(master=None, tag="v1", pre=False):
    """Argumentos para audit-audio.py. Con pre=True no se pasa máster
    (ni --expected-frames: el conteo de fotogramas es del máster)."""
    with open(os.path.join(PROJ, "research/timeline.json")) as f:
        t = json.load(f)
    vo = os.path.join(PROJ, "research/vo")
    pub = os.path.join(PROJ, "public")
    out_dir = os.path.join(PROJ, "research", f"audit-{tag}")
    args = [HUB_PY, AUDIT,
            "--project", "negacion-embargo", "--tag", tag]
    if pre:
        args += ["--no-master"]
    else:
        args += ["--master", master,
                 "--expected-frames", "2325"]
    args += [
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
            "--out-dir", out_dir]
    for s in t["sfx"]:
        if s["underVO"]:
            path = os.path.join(pub, "audio/sfx-mix", f"{s['id']}.wav")
        else:
            path = os.path.join(pub, s["file"])
        args += ["--sfx", f"{path}@{s['event_s']}"]
    return args, out_dir, len(t["sfx"])


def main() -> int:
    pre = "--pre" in sys.argv
    argv = [a for a in sys.argv[1:] if a != "--pre"]
    if pre:
        master = None
        tag = "pre"
    else:
        if not argv:
            print("uso: run-audit.py <master.mp4> [--tag v1] | "
                  "run-audit.py --pre [--tag pre]", file=sys.stderr)
            return 2
        master = argv[0]
        tag = "v1"
    if "--tag" in argv:
        tag = argv[argv.index("--tag") + 1]
    args, out_dir, n_sfx = build_args(master, tag, pre)
    print(f"auditando {'insumos (pre-auditoría)' if pre else master} "
          f"(tag {tag}, {n_sfx} SFX)")
    return subprocess.run(args, cwd=PROJ).returncode


if __name__ == "__main__":
    raise SystemExit(main())
