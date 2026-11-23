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
    # Puerta de identidad de cama (incidente V4, 23-nov-2026): el stem
    # debe ser la cama que pide timeline.json (bed.id). Si no coincide,
    # la mezcla NO se construye: re-ejecutar el paso audio
    # (build-audio.sh lee bed.id de timeline.json) y reintentar. La
    # verificación es acústica (NCC contra la cama de biblioteca), no
    # por nombre de archivo: un stem con el nombre correcto y el
    # contenido equivocado también falla.
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
    # Ducking: receta probada de marti-fidel V1.5+ (threshold 0,08,
    # ratio 5, release 250 ms): bombeo 20,1 -> 9,1 dB, profundidad
    # media -11,8 -> -3,4 dB, recuperación perfecta. Los defaults de
    # mix.py (0,018 / 7 / 420 ms) bombean ~20 dB y recuperan lento
    # (el check (f) de la auditoría haría FAIL en recuperación).
    # Volumen de música 0,40 (no el default 0,32): el stem nuevo
    # (memorial-cama-documental, -21,4 LUFS nativos) es ~1,7 LU más
    # bajo que documentary-flow-a (-19,7); 0,40 (-7,96 dB) deja la
    # cama en la mezcla al mismo nivel que la mezcla temporal
    # (-29,4 LUFS sin ducking). Ganancia lineal: conserva los dips.
    # (La auditoría debe usar el mismo valor: run-audit.py.)
    # --fixed-gain (ganancia CONSTANTE en vez de loudnorm): el
    # loudnorm de un solo pase es dinámico y DESHACE los dips
    # horneados (medido 22-nov: el giro de -12 dB quedó en 0 dB netos
    # en la mezcla); y --two-pass tampoco sirve aquí porque los picos
    # de SFX (TP -0,82 con limiter 0,89) hacen inalcanzable el
    # objetivo lineal y ffmpeg vuelve a dinámico aunque se pida
    # linear=true (medido: con 0,89 y con 0,65 el two-pass salió
    # dinámico y los dips se borraron igual). Con fixed-gain, mix.py
    # mide la mezcla y aplica volume=(objetivo - I_entrada) + un
    # limitador de seguridad 0,8: ganancia constante = dips exactos.
    # --limiter 0.65 (-3,7 dBFS): doma los picos de SFX antes de la
    # ganancia para que el limitador de seguridad apenas tenga que
    # actuar (solo sobre los transitorios más altos).
    # --target-lufs -16.0 (no el default -14.5): con fixed-gain, el
    # objetivo define la ganancia (objetivo - I_entrada ≈ +3,2 dB);
    # -14.5 exigiría +4,7 dB y el limitador de seguridad recortaría
    # los slams ~3 dB. Con -16.0 el recorte es ~1,4 dB y el máster
    # (mezcla + voces del panel) queda ~-15,3, dentro del gate.
    args = [HUB_PY, MIX,
            "--voice", os.path.join(PROJ, "public/audio/voice-placed.wav"),
            "--music", os.path.join(PROJ, "public/audio/music-bed.wav"),
            "--seconds", str(t["duration_s"]),
            "--music-volume", "0.40",
            "--duck-threshold", "0.08",
            "--duck-ratio", "5",
            "--duck-release", "250",
            "--fixed-gain",
            "--target-lufs", "-16.0",
            "--limiter", "0.65",
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
