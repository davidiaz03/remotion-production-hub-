#!/usr/bin/env python3
"""Puerta QA visual permanente (Investigación 3, técnica 8 — 22-nov-2026).

Regla medible, tras cada render, junto a la auditoría de audio:
  - ningún fotograma negro fuera de los intencionados, y
  - ningún tramo de más de 3 s sin un cambio visual (corte, movimiento de
    cámara, entrada gráfica o cambio de plano).

Lo que mide este script (ffmpeg blackdetect + scdet):
  - segmentos negros (blackdetect): FALLO salvo los intencionados, que se
    pasan por --allow-negro "inicio-fin,..." (segundos).
  - tramos >3 s sin CORTE (scdet): AVISO, no fallo — un zoom/drift lento o
    una entrada gráfica es un cambio visual que scdet no detecta; cada
    tramo listado debe revisarse a ojo y, si no hay movimiento ni entrada
    gráfica, recibe un latido.

Uso:
  scripts/qa-visual-gaps.py <video.mp4> [--fps 30] [--max-sin-corte 3.0]
      [--allow-negro "26.5-28.9,..."] [--json salida.json]
Salida: informe por stdout; código 1 si hay negro no autorizado.
"""
import argparse
import json
import re
import subprocess
import sys

BLACK_RE = re.compile(
    r"black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)")
SCD_RE = re.compile(r"lavfi\.scd\.time: ([\d.]+)")
DUR_RE = re.compile(r"Duration: (\d+):(\d+):([\d.]+)")


def run_ffmpeg(path):
    cmd = [
        "ffmpeg", "-hide_banner", "-i", path,
        "-vf", "blackdetect=d=0.05:pic_th=0.98:pix_th=0.10,"
                "scdet=t=0.35",
        "-an", "-f", "null", "-",
    ]
    p = subprocess.run(cmd, capture_output=True, text=True)
    return p.stderr


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--fps", type=float, default=30)
    ap.add_argument("--max-sin-corte", type=float, default=3.0,
                    help="Tramo máximo sin corte antes de avisar (s)")
    ap.add_argument("--allow-negro", default="",
                    help='Rangos intencionales "a-b,c-d" en segundos')
    ap.add_argument("--json")
    args = ap.parse_args()

    log = run_ffmpeg(args.video)
    m = DUR_RE.search(log)
    dur = (int(m.group(1)) * 3600 + int(m.group(2)) * 60
           + float(m.group(3))) if m else None

    negros = [(float(a), float(b), float(c))
              for a, b, c in BLACK_RE.findall(log)]
    cortes = sorted(float(x) for x in SCD_RE.findall(log))

    allow = []
    for part in args.allow_negro.split(","):
        part = part.strip()
        if part:
            a, b = part.split("-")
            allow.append((float(a), float(b)))

    def autorizado(a, b):
        return any(a >= x - 0.05 and b <= y + 0.05 for x, y in allow)

    negros_malos = [(a, b, c) for a, b, c in negros
                    if not autorizado(a, b)]

    # Tramos sin corte: entre cortes consecutivos (0 y duración como bordes).
    puntos = [0.0] + cortes + ([dur] if dur else [])
    tramos = []
    for i in range(len(puntos) - 1):
        a, b = puntos[i], puntos[i + 1]
        if b - a > args.max_sin_corte:
            tramos.append((round(a, 2), round(b, 2), round(b - a, 2)))

    fps = args.fps
    print(f"video: {args.video}  duración: {dur}s  cortes: {len(cortes)}")
    print(f"segmentos negros: {len(negros)} "
          f"({len(negros_malos)} no autorizados)")
    for a, b, c in negros:
        tag = "AUTORIZADO" if autorizado(a, b) else "FALLO"
        print(f"  negro {a:.2f}–{b:.2f}s ({c:.2f}s, "
              f"f{round(a*fps)}–f{round(b*fps)}) [{tag}]")
    print(f"tramos >{args.max_sin_corte}s sin corte: {len(tramos)} (aviso)")
    for a, b, c in tramos:
        print(f"  sin corte {a:.2f}–{b:.2f}s ({c:.2f}s, "
              f"f{round(a*fps)}–f{round(b*fps)})")

    if args.json:
        with open(args.json, "w") as f:
            json.dump({"video": args.video, "duration": dur,
                       "black": [{"start": a, "end": b, "duration": c,
                                  "authorized": autorizado(a, b)}
                                 for a, b, c in negros],
                       "cuts": cortes,
                       "no_cut_stretches": [
                           {"start": a, "end": b, "duration": c}
                           for a, b, c in tramos]}, f, indent=1)

    if negros_malos:
        print("RESULTADO: FAIL — hay negro no autorizado")
        return 1
    print("RESULTADO: PASS (negro) — revisa los tramos sin corte listados")
    return 0


if __name__ == "__main__":
    sys.exit(main())
