#!/usr/bin/env python3
"""Mezcla final del reel: VO colocada + tono de sala + 6 SFX.

Lee research/timeline.json: los SFX bajo VO usan la copia con
ganancia/recorte de public/audio/sfx-mix/. El `at` ya descuenta el
sync del índice (el ataque cae sobre el evento).

SIN MÚSICA: la «cama» es el tono de sala amb-room-tone. La puerta de
identidad (incidente V4, 23-nov-2026) se adapta: en vez de la NCC de
bed_identity (que resuelve camas MUSICALES del registry), se compara
el hash del PCM decodificado del stem contra el archivo de biblioteca.
Si no coincide, la mezcla NO se construye.

Uso: HUB_PY=... python3 scripts/run-mix.py [--force]
"""
import hashlib
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
HUB_PY = os.environ.get("HUB_PY",
                        os.path.expanduser("~/workspace/remotion-hub/.venv/bin/python"))
MIX = os.path.expanduser("~/workspace/remotion-hub/repo/scripts/audio/mix.py")
LIB_SFX = os.path.expanduser("~/workspace/remotion-hub/assets/sfx")


def pcm_hash(path: str) -> str:
    """SHA-256 del PCM decodificado (mono 48k s16le): inmune a
    diferencias de cabecera WAV entre el stem y la biblioteca."""
    r = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", "48000",
         "-f", "hash", "-hash", "sha256", "-"],
        capture_output=True, text=True, check=True)
    return r.stdout.strip().split("=", 1)[1]


def main() -> int:
    t = json.load(open(os.path.join(PROJ, "research/timeline.json")))
    bed_id = t.get("bed", {}).get("id")
    if not bed_id:
        print("ERROR: research/timeline.json no declara bed.id",
              file=sys.stderr)
        return 1
    stem = os.path.join(PROJ, "public/audio/music-bed.wav")
    lib = os.path.join(LIB_SFX, "sounds-extra/ambience",
                       f"{bed_id}.wav")
    if not os.path.isfile(lib):
        print(f"ERROR: no existe el tono de sala en la biblioteca: {lib}",
              file=sys.stderr)
        return 1
    if not os.path.isfile(stem):
        print(f"ERROR: no existe el stem: {stem} (primero build-audio.sh)",
              file=sys.stderr)
        return 1
    if pcm_hash(stem) != pcm_hash(lib):
        print(f"ERROR: public/audio/music-bed.wav NO es '{bed_id}' de la "
              "biblioteca: re-ejecuta el paso audio y vuelve a mezclar",
              file=sys.stderr)
        return 1
    print(f"tono de sala verificado: '{bed_id}' (hash PCM idéntico)")
    # Parámetros de mezcla desde la timeline (fuente única). Ducking:
    # receta probada (threshold 0,08, ratio 5, release 250 ms).
    # Volumen 0,40: el tono de sala queda ~23 dB bajo la VO (banda
    # 20-25 dB). --fixed-gain: ganancia constante a -16 LUFS.
    # --limiter 0.65: doma los picos de SFX antes de la ganancia.
    # (La auditoría debe usar los mismos valores: run-audit.py.)
    m = t["mix"]
    args = [HUB_PY, MIX,
            "--voice", os.path.join(PROJ, "public/audio/voice-placed.wav"),
            "--music", stem,
            "--seconds", str(t["duration_s"]),
            "--music-volume", str(m["music_volume"]),
            "--duck-threshold", str(m["duck_threshold"]),
            "--duck-ratio", str(m["duck_ratio"]),
            "--duck-release", str(m["duck_release_ms"]),
            "--fixed-gain",
            "--target-lufs", str(m["target_lufs"]),
            "--limiter", str(m["limiter"]),
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
    print(f"mezclando: VO + tono de sala + {len(t['sfx'])} SFX -> mix.wav "
          f"({t['duration_s']} s)")
    return subprocess.run(args, cwd=PROJ).returncode


if __name__ == "__main__":
    raise SystemExit(main())
