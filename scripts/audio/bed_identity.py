#!/usr/bin/env python3
"""Verifica que un stem de cama se construyó desde la cama configurada.

Incidente 23-nov-2026 (negacion-embargo V4): `research/timeline.json`
pedía `memorial-cama-documental`, pero `build-audio.sh` tenía
hardcodeado `--bed documentary-flow-a`; el máster V4 sonó con la cama
vieja (ya oída en otros reels) y ningún chequeo lo detectó: la
auditoría mide niveles, no identidad, y `mix.wav.json` guardaba el
sha256 del stem sin compararlo con nada.

Por qué funciona: el stem es un bucle de la cama de biblioteca
(`bed-loop.py`): la primera copia empieza en la muestra 0 y el
`--target-lufs` se aplica como una ganancia lineal constante. Antes
del primer dip, el stem es una copia escalada de la cama. La
correlación normalizada (NCC, invariante a ganancia) entre esa
ventana limpia del stem y la misma ventana de la cama de biblioteca
es ~1 si la cama es la correcta y ~0 si es otra.

Uso (CLI):
  bed_identity.py --stem public/audio/music-bed.wav \\
      --bed memorial-cama-documental [--timeline research/timeline.json]
  Sale 0 si el stem coincide con la cama, 1 si no.

Uso (librería):
  from bed_identity import verify_bed_stem
  r = verify_bed_stem(stem, bed_id, timeline_path)
  # r = {"ok": bool, "bed_id": ..., "ncc": ..., "window_s": ...,
  #      "bed_file": ..., "error": ...}
"""

import argparse
import json
import os
import sys
import wave

import numpy as np

HUB = os.path.expanduser("~/workspace/remotion-hub")
BEDS_DIR = os.path.join(HUB, "assets", "music", "beds")
REGISTRY = os.path.join(BEDS_DIR, "registry.json")

# Umbral de NCC: la copia escalada da >0.999 en la práctica; una cama
# distinta da |NCC| < 0,05. 0,99 deja margen al redondeo int16 y al
# resampleo sin aceptar jamás una cama equivocada.
DEFAULT_THRESHOLD = 0.99
# Ventana limpia máxima (s): antes del primer dip y del primer
# crossfade del bucle (que empieza a bed_seconds - xfade, >= 57 s en
# la biblioteca actual). 5 s bastan para una NCC concluyente.
MAX_WINDOW_S = 5.0
# Ventana mínima para que la NCC sea concluyente.
MIN_WINDOW_S = 2.0
# Margen de seguridad antes del inicio de la rampa del primer dip.
MARGIN_S = 0.25


def load_registry(beds_dir: str = BEDS_DIR) -> dict:
    path = os.path.join(beds_dir, "registry.json")
    if not os.path.isfile(path):
        raise FileNotFoundError(f"sin registro de camas: {path}")
    with open(path, encoding="utf-8") as f:
        return {b["id"]: b for b in json.load(f).get("beds", [])}


def resolve_bed(bed_id: str, beds_dir: str = BEDS_DIR) -> str:
    registry = load_registry(beds_dir)
    if bed_id not in registry:
        raise ValueError(
            f"cama no registrada: {bed_id!r} "
            f"(ids: {', '.join(sorted(registry)) or 'registro vacío'})")
    path = os.path.join(beds_dir, registry[bed_id]["file"])
    if not os.path.isfile(path):
        raise FileNotFoundError(f"archivo de cama ausente: {path}")
    return path


def read_wav_mono(path: str) -> tuple[np.ndarray, int]:
    """Lee un WAV PCM a float64 mono (mezcla canales si es estéreo)."""
    with wave.open(path, "rb") as w:
        nch, sw, sr, n = (w.getnchannels(), w.getsampwidth(),
                          w.getframerate(), w.getnframes())
        raw = w.readframes(n)
    if sw == 2:
        a = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768.0
    elif sw == 4:
        a = np.frombuffer(raw, dtype=np.int32).astype(np.float64) / 2147483648.0
    else:
        raise ValueError(f"{path}: profundidad {sw * 8} bits no soportada")
    if nch > 1:
        a = a.reshape(-1, nch).mean(axis=1)
    return np.ascontiguousarray(a), sr


def clean_window_s(timeline_path: str | None) -> float:
    """Duración de la ventana limpia al inicio del stem (s).

    Termina antes del primer dip de `timeline.json` (con su rampa y
    un margen); sin timeline, 5 s. Falla si no hay al menos 2 s
    limpios: sin ventana no se puede verificar la identidad.
    """
    window = MAX_WINDOW_S
    if timeline_path:
        with open(timeline_path, encoding="utf-8") as f:
            dips = json.load(f).get("bed", {}).get("dips", [])
        for d in dips:
            end = d["t0"] - d.get("ramp_s", 0.0) / 2 - MARGIN_S
            window = min(window, end)
    if window < MIN_WINDOW_S:
        raise ValueError(
            f"ventana limpia {window:.2f} s < {MIN_WINDOW_S} s: "
            "el primer dip empieza demasiado pronto para verificar "
            "la identidad de la cama")
    return window


def ncc(a: np.ndarray, b: np.ndarray) -> float:
    a = a - a.mean()
    b = b - b.mean()
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    return float(a @ b / denom)


def verify_bed_stem(stem_path: str, bed_id: str,
                    timeline_path: str | None = None,
                    beds_dir: str = BEDS_DIR,
                    threshold: float = DEFAULT_THRESHOLD) -> dict:
    """Comprueba que `stem_path` se construyó desde `bed_id`.

    Nunca lanza por un desajuste de identidad: lo devuelve como
    ok=False. Solo lanza por errores de configuración o archivos
    ausentes/ilegibles.
    """
    bed_path = resolve_bed(bed_id, beds_dir)
    window = clean_window_s(timeline_path)
    stem, sr_stem = read_wav_mono(stem_path)
    bed, sr_bed = read_wav_mono(bed_path)
    if sr_stem != sr_bed:
        raise ValueError(
            f"muestreo distinto: stem {sr_stem} Hz, cama {sr_bed} Hz")
    n = int(window * sr_stem)
    if len(stem) < n or len(bed) < n:
        raise ValueError(
            f"ventana de {window:.1f} s mayor que el audio "
            f"(stem {len(stem) / sr_stem:.1f} s, "
            f"cama {len(bed) / sr_bed:.1f} s)")
    value = ncc(stem[:n], bed[:n])
    return {
        "ok": value >= threshold,
        "bed_id": bed_id,
        "bed_file": bed_path,
        "ncc": value,
        "threshold": threshold,
        "window_s": window,
    }


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--stem", required=True, help="Stem a verificar (WAV)")
    p.add_argument("--bed", required=True, help="Id de cama del registro")
    p.add_argument("--timeline", default=None,
                   help="research/timeline.json del proyecto (dips)")
    p.add_argument("--beds-dir", default=BEDS_DIR,
                   help="Directorio de la biblioteca de camas")
    p.add_argument("--threshold", type=float, default=DEFAULT_THRESHOLD)
    a = p.parse_args()
    try:
        r = verify_bed_stem(a.stem, a.bed, a.timeline, a.beds_dir,
                            a.threshold)
    except (FileNotFoundError, ValueError) as e:
        print(f"bed-identity: ERROR: {e}", file=sys.stderr)
        return 2
    if r["ok"]:
        print(f"bed-identity: OK: el stem es '{r['bed_id']}' "
              f"(NCC {r['ncc']:.3f} en {r['window_s']:.1f} s)")
        return 0
    print(f"bed-identity: FAIL: el stem NO es '{r['bed_id']}' "
          f"(NCC {r['ncc']:.3f}, umbral {r['threshold']}); "
          f"la cama mezclada no es la configurada", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
