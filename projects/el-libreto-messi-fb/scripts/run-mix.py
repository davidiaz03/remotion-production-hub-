#!/usr/bin/env python3
"""Mezcla final del reel: VO colocada + cama musical + 6 SFX.

Lee research/timeline.json: los SFX bajo VO usan la copia con
ganancia/recorte de public/audio/sfx-mix/. El `at` ya descuenta el
sync del índice (el ataque cae sobre el evento).

La cama es la nueva de Flow Music creada para este proyecto
('libreto-messi-desmentido'), definida en timeline.json (bed.id,
fuente única). Puerta de identidad (incidente V4, 23-nov-2026):
antes de mezclar se verifica el stem con bed_identity (NCC contra
la cama de biblioteca, umbral 0,99). Si no coincide, la mezcla NO
se construye: re-ejecutar el paso audio (build-audio.sh lee bed.id
de timeline.json) y reintentar. La verificación es acústica, no por
nombre de archivo: un stem con el nombre correcto y el contenido
equivocado también falla.

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
    # Puerta de identidad de cama (incidente V4, 23-nov-2026): el stem
    # debe ser la cama que pide timeline.json (bed.id). Si no coincide,
    # la mezcla NO se construye.
    bed_id = t.get("bed", {}).get("id")
    if not bed_id:
        print("ERROR: research/timeline.json no declara bed.id",
              file=sys.stderr)
        return 1
    repo = os.path.dirname(os.path.dirname(PROJ))
    sys.path.insert(0, os.path.join(repo, "scripts", "audio"))
    import bed_identity
    stem = os.path.join(PROJ, "public/audio/music-bed.wav")
    try:
        r = bed_identity.verify_bed_stem(
            stem, bed_id, os.path.join(PROJ, "research/timeline.json"))
    except (FileNotFoundError, ValueError) as e:
        print(f"ERROR: verificación de cama: {e}", file=sys.stderr)
        return 1
    if not r["ok"]:
        print(f"ERROR: public/audio/music-bed.wav NO es '{bed_id}' "
              f"(NCC {r['ncc']:.3f}, umbral {r['threshold']}): "
              "la cama del stem no es la configurada; re-ejecuta "
              "el paso audio y vuelve a mezclar", file=sys.stderr)
        return 1
    print(f"cama verificada: '{bed_id}' (NCC {r['ncc']:.3f})")
    # Parámetros de mezcla desde la timeline (fuente única). Ducking:
    # receta probada (threshold 0,08, ratio 5, release 250 ms).
    # Volumen 0,40 (-7,96 dB): la cama (nativa -23,86 LUFS) queda
    # ~14 dB bajo la VO (-18 LUFS) antes del ducking; el ducking la
    # baja más bajo la voz y la deja subir en el outro (la VO termina
    # a 25,12 s). --fixed-gain: ganancia constante a -16 LUFS.
    # --limiter 0.65: doma los picos de SFX antes de la ganancia.
    # (La auditoría debe usar los mismos valores: run-audit.py.)
    # H10 de la auditoría v1: la v1 bombeaba 12 dB (sobre tono de
    # sala); con música real, re-verificar el bombeo en la
    # re-auditoría y suavizar el ducking si sigue >6 dB.
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
    print(f"mezclando: VO + cama '{bed_id}' + {len(t['sfx'])} SFX -> mix.wav "
          f"({t['duration_s']} s)")
    return subprocess.run(args, cwd=PROJ).returncode


if __name__ == "__main__":
    raise SystemExit(main())
