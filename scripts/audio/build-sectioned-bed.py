#!/usr/bin/env python3
"""Construye una cama musical por SECCIONES (una cama por acto) con
crossfades en las fronteras y dips de silencio horneados.

A diferencia de bed-loop.py (que ALTERNA las camas en ciclo A-B-C-A…),
aquí cada cama cubre un tramo fijo del video: intriga en el Acto 0,
investigación en los Actos 1-2, resolución en el Acto 3. Dentro de cada
sección, la cama de 60 s se buclea con crossfades de potencia igual
(igual que bed-loop.py). En cada frontera de acto hay un crossfade de
3 s CENTRADO en la frontera (la saliente baja y la entrante sube en los
3 s anteriores a la frontera). Los dips silencian la cama con rampas
lineales de 0,5 s (igual que dip-bed.py): el silencio es el golpe en
las revelaciones.

Método (mismo que bed-loop.py): numpy, mono 48 kHz, cada cama con el
pico normalizado a 0,89; al final se mide la sonoridad con loudnorm y
se aplica una ganancia constante hasta el objetivo (-16 LUFS).

Uso:
  .venv/bin/python scripts/audio/build-sectioned-bed.py \
      --section libreto-largo-intriga@0@79.73 \
      --section libreto-largo-investigacion@79.73@424.42 \
      --section libreto-largo-resolucion@424.42@548.3 \
      --dip 215.18@219.94 --dip 333.46@349.48 \
      --seconds 548.3 --xfade 3 --target-lufs -16 \
      --out public/audio/music-bed.wav --report public/audio/music-bed.json
"""
import argparse
import hashlib
import importlib.util
import json
import math
import os
import subprocess
import sys
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location(
    "bed_loop", os.path.join(HERE, "bed-loop.py"))
bed_loop = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(bed_loop)
load_registry = bed_loop.load_registry
resolve_bed = bed_loop.resolve_bed
read_wav_mono = bed_loop.read_wav_mono
resample_linear = bed_loop.resample_linear
lufs_of = bed_loop.lufs_of
OUT_SR = bed_loop.OUT_SR

DIP_RAMP_S = 0.5  # rampas lineales de los dips (igual que dip-bed.py)


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def loop_section(bed, span_n, xfade_n):
    """Buclea una cama (array mono) hasta span_n muestras, con
    crossfades de potencia igual entre repeticiones (misma lógica que
    bed-loop.py). Devuelve el array de la sección."""
    out = np.zeros(span_n, dtype=np.float32)
    up = np.sqrt(np.linspace(0, 1, xfade_n, dtype=np.float32))
    down = up[::-1].copy()
    pos = 0
    first = True
    while pos < span_n:
        end = min(pos + len(bed), span_n)
        n = end - pos
        if first:
            out[pos:end] = bed[:n]
            first = False
        else:
            k = min(xfade_n, n)
            out[pos:pos + k] = (out[pos:pos + k] * down[:k]
                                + bed[:k] * up[:k])
            if n > k:
                out[pos + k:end] = bed[k:n]
        if end >= span_n:
            break
        pos = end - xfade_n
    return out


def parse_section(spec):
    try:
        bed, start, end = spec.rsplit("@", 2)
        return bed, float(start), float(end)
    except ValueError:
        raise argparse.ArgumentTypeError(
            f"--section espera CAMA@INICIO@FIN, recibido {spec!r}")


def parse_dip(spec):
    try:
        start, end = spec.split("@", 1)
        return float(start), float(end)
    except ValueError:
        raise argparse.ArgumentTypeError(
            f"--dip espera INICIO@FIN, recibido {spec!r}")


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--section", action="append", required=True,
                   type=parse_section,
                   help="CAMA@INICIO@FIN (repetible, en orden; deben "
                   "cubrir [0, --seconds] sin huecos)")
    p.add_argument("--dip", action="append", default=[],
                   type=parse_dip,
                   help="INICIO@FIN de silencio total (repetible; "
                   "rampas de 0,5 s)")
    p.add_argument("--seconds", type=float, required=True)
    p.add_argument("--xfade", type=float, default=3.0,
                   help="Crossfade entre secciones y entre repeticiones (s)")
    p.add_argument("--target-lufs", type=float, default=-16.0)
    p.add_argument("--out", required=True)
    p.add_argument("--report", help="JSON de informe (defecto: <out>.json)")
    p.add_argument("--force", action="store_true")
    a = p.parse_args()
    if a.seconds < 2:
        p.error("--seconds debe ser >= 2")
    if os.path.exists(a.out) and not a.force:
        p.error(f"la salida ya existe: {a.out} (usa --force)")
    report = a.report or (a.out + ".json")
    if os.path.exists(report) and not a.force:
        p.error(f"el informe ya existe: {report} (usa --force)")

    sections = sorted(a.section, key=lambda s: s[1])
    # Validación: cobertura contigua [0, seconds].
    if abs(sections[0][1]) > 1e-6:
        p.error(f"la primera sección debe empezar en 0 (empieza en "
                f"{sections[0][1]})")
    if abs(sections[-1][2] - a.seconds) > 1e-6:
        p.error(f"la última sección debe terminar en {a.seconds} "
                f"(termina en {sections[-1][2]})")
    for (b1, s1, e1), (b2, s2, e2) in zip(sections, sections[1:]):
        if abs(e1 - s2) > 1e-6:
            p.error(f"hueco o solape entre secciones: {e1} != {s2}")
    for ds, de in a.dip:
        if ds < 0 or de > a.seconds or de <= ds:
            p.error(f"dip inválido: {ds}@{de}")
        for _, s, e in sections[1:]:
            if ds < s and de > s - a.xfade:
                print(f"AVISO: el dip {ds}-{de} solapa el crossfade "
                      f"de la frontera {s}", file=sys.stderr)

    registry = load_registry()
    beds = {}
    for bed_id, _, _ in sections:
        if bed_id in beds:
            continue
        path = resolve_bed(bed_id, registry)
        audio, sr = read_wav_mono(path)
        audio = resample_linear(audio, sr, OUT_SR)
        peak = float(np.max(np.abs(audio))) if len(audio) else 0.0
        if peak <= 0:
            p.error(f"cama silenciosa: {path}")
        beds[bed_id] = (path, audio / peak * 0.89)
        print(f"cama {bed_id}: {len(audio) / OUT_SR:.1f} s "
              f"(pico normalizado a 0.89)")

    total = int(math.ceil(a.seconds * OUT_SR))
    xfade_n = int(a.xfade * OUT_SR)
    up = np.sqrt(np.linspace(0, 1, xfade_n, dtype=np.float32))
    down = up[::-1].copy()
    out = np.zeros(total, dtype=np.float32)
    for i, (bed_id, start, end) in enumerate(sections):
        s_n = int(round(start * OUT_SR))
        e_n = int(round(end * OUT_SR))
        # La sección entrante empieza xfade antes de su frontera (salvo
        # la primera, que empieza en 0): su bucle cubre el solape.
        loop_start = max(0, s_n - xfade_n) if i > 0 else s_n
        span = e_n - loop_start
        sec = loop_section(beds[bed_id][1], span, xfade_n)
        if i > 0:
            # Fade-in de potencia igual sobre el solape.
            sec[:xfade_n] *= up
        if i < len(sections) - 1:
            # Fade-out de potencia igual sobre los últimos xfade s.
            sec[-xfade_n:] *= down
        out[loop_start:e_n] += sec
        print(f"sección {bed_id}: {start:.2f}-{end:.2f} s "
              f"(bucle desde {loop_start / OUT_SR:.2f} s)")

    # Dips: rampas lineales de 0,5 s a silencio y de vuelta.
    ramp_n = int(DIP_RAMP_S * OUT_SR)
    for ds, de in sorted(a.dip):
        ds_n = int(round(ds * OUT_SR))
        de_n = int(round(de * OUT_SR))
        out[max(0, ds_n - ramp_n):ds_n] *= np.linspace(
            1, 0, min(ramp_n, ds_n), dtype=np.float32)
        out[ds_n:de_n] = 0.0
        k_up = min(ramp_n, total - de_n)
        out[de_n:de_n + k_up] *= np.linspace(
            0, 1, k_up, dtype=np.float32)
        print(f"dip: silencio {ds:.2f}-{de:.2f} s "
              f"(rampas {DIP_RAMP_S} s)")
    # Fade-out final de 1 s para no cortar en seco (como bed-loop.py).
    n_fade = min(int(OUT_SR), total)
    out[-n_fade:] *= np.linspace(1, 0, n_fade, dtype=np.float32)

    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    tmp = a.out + ".tmp.wav"
    pcm = (np.clip(out, -1.0, 1.0) * 32767).astype(np.int16)
    with wave.open(tmp, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(OUT_SR)
        w.writeframes(pcm.tobytes())
    measured = lufs_of(tmp)
    gain_db = a.target_lufs - measured
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp, "-af",
                    f"volume={gain_db}dB", "-ar", "48000", a.out],
                   check=True)
    os.remove(tmp)
    final = lufs_of(a.out)
    res = {
        "status": "PASS",
        "out": a.out,
        "seconds": a.seconds,
        "sections": [{"bed": b, "start": s, "end": e,
                      "file": beds[b][0], "sha256": sha256(beds[b][0])}
                     for b, s, e in sections],
        "dips": [{"start": ds, "end": de} for ds, de in sorted(a.dip)],
        "xfade_s": a.xfade,
        "dip_ramp_s": DIP_RAMP_S,
        "target_lufs": a.target_lufs,
        "measured_lufs_before_gain": round(measured, 2),
        "gain_db": round(gain_db, 2),
        "measured_lufs": round(final, 2),
        "output_sha256": sha256(a.out),
    }
    with open(report, "w", encoding="utf-8") as f:
        json.dump(res, f, indent=2, ensure_ascii=False)
    print(f"OK {a.out} — {a.seconds:.1f} s de cama "
          f"({len(sections)} secciones, xfade {a.xfade}s, "
          f"{len(a.dip)} dips), {final:.2f} LUFS, "
          f"{os.path.getsize(a.out) / 1e6:.1f} MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
