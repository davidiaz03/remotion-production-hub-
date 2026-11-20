#!/usr/bin/env python3
"""Buclea una cama musical de la biblioteca a la duración del video.

Una cama de 60 s en bucle con crossfades de 3 s suena continua bajo
narración duckeada (probado en modern-wisdom-aprende: ciclo de ~3 min
con 3 secciones, 11 repeticiones, sin quejas). Generar una cama nueva
con MusicGen cuesta ~30 min/60 s en esta caja; buclear una existente
cuesta segundos: para video largo, la biblioteca es SIEMPRE el primer
recurso y MusicGen solo se usa para moods que la biblioteca no cubra.

Biblioteca: ~/workspace/remotion-hub/assets/music/beds/ + registry.json
(ver ese archivo para el catálogo). Con --bed <id> se resuelve desde
el registro; con --bed <ruta> se usa el archivo tal cual. Con varias
camas (--bed a --bed b --bed c) se alternan en ciclo (A-B-C-A-...),
como en modern-wisdom-aprende.

Uso:
  .venv/bin/python scripts/audio/bed-loop.py --bed calm-documentary-a \\
      --seconds 1962 --out public/audio/music-bed.wav
  .venv/bin/python scripts/audio/bed-loop.py \\
      --bed calm-documentary-a --bed calm-documentary-b \\
      --bed calm-documentary-c --seconds 1962 --xfade 3.0 \\
      --target-lufs -16 --out public/audio/music-bed.wav

Salida: WAV mono 48 kHz a --target-lufs (defecto -16, el STEM de
música; mix.py la duckeada bajo la VO). Crossfade de potencia igual
(raíz cuadrada) para no subir ni bajar el nivel en el empalme.
"""
import argparse
import json
import math
import os
import subprocess
import sys
import wave

import numpy as np

HUB = os.path.expanduser("~/workspace/remotion-hub")
BEDS_DIR = os.path.join(HUB, "assets", "music", "beds")
REGISTRY = os.path.join(BEDS_DIR, "registry.json")
OUT_SR = 48000


def load_registry() -> dict:
    if not os.path.isfile(REGISTRY):
        return {}
    with open(REGISTRY, encoding="utf-8") as f:
        return {b["id"]: b for b in json.load(f).get("beds", [])}


def resolve_bed(spec: str, registry: dict) -> str:
    if os.path.isfile(spec):
        return spec
    if spec in registry:
        return os.path.join(BEDS_DIR, registry[spec]["file"])
    raise SystemExit(
        f"cama no encontrada: {spec!r} (ni archivo ni id del registro; "
        f"ids: {', '.join(sorted(registry)) or 'registro vacío'})")


def read_wav_mono(path: str) -> tuple[np.ndarray, int]:
    """Lee un WAV PCM a float32 mono (mezcla canales si es estéreo)."""
    with wave.open(path, "rb") as w:
        nch, sw, sr, n = (w.getnchannels(), w.getsampwidth(),
                          w.getframerate(), w.getnframes())
        raw = w.readframes(n)
    if sw == 2:
        a = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    elif sw == 4:
        a = np.frombuffer(raw, dtype=np.int32).astype(np.float32) / 2147483648.0
    else:
        raise SystemExit(f"{path}: profundidad {sw * 8} bits no soportada")
    if nch > 1:
        a = a.reshape(-1, nch).mean(axis=1)
    return np.ascontiguousarray(a), sr


def resample_linear(a: np.ndarray, sr_in: int, sr_out: int) -> np.ndarray:
    if sr_in == sr_out:
        return a
    n_out = int(round(len(a) * sr_out / sr_in))
    x_old = np.linspace(0, len(a) - 1, n_out)
    return np.interp(x_old, np.arange(len(a)), a).astype(np.float32)


def lufs_of(path: str) -> float:
    out = subprocess.run(
        ["ffmpeg", "-v", "info", "-i", path, "-af",
         "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True).stderr
    js = out[out.index("{", out.index("Parsed_loudnorm")):
             out.index("}", out.index("Parsed_loudnorm")) + 1]
    return float(json.loads(js)["input_i"])


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--bed", action="append", required=True,
                   help="Id de biblioteca o ruta WAV (repetible: se "
                   "alternan en ciclo)")
    p.add_argument("--seconds", type=float, required=True,
                   help="Duración de salida en s")
    p.add_argument("--out", required=True, help="WAV de salida (48 kHz mono)")
    p.add_argument("--xfade", type=float, default=3.0,
                   help="Crossfade entre repeticiones (s, defecto 3)")
    p.add_argument("--target-lufs", type=float, default=-16.0,
                   help="Sonoridad del STEM (defecto -16 LUFS)")
    p.add_argument("--force", action="store_true")
    a = p.parse_args()
    if a.seconds < 2:
        p.error("--seconds debe ser >= 2")
    if os.path.exists(a.out) and not a.force:
        p.error(f"la salida ya existe: {a.out} (usa --force)")

    registry = load_registry()
    beds = []
    for spec in a.bed:
        path = resolve_bed(spec, registry)
        audio, sr = read_wav_mono(path)
        audio = resample_linear(audio, sr, OUT_SR)
        peak = float(np.max(np.abs(audio))) if len(audio) else 0.0
        if peak <= 0:
            p.error(f"cama silenciosa: {path}")
        beds.append((spec, audio / peak * 0.89))
        print(f"cama {spec}: {len(audio) / OUT_SR:.1f} s "
              f"(pico normalizado a 0.89)")
    total = int(math.ceil(a.seconds * OUT_SR))
    xfade_n = int(a.xfade * OUT_SR)
    out = np.zeros(total, dtype=np.float32)
    # Crossfade de potencia igual: subida sqrt, bajada sqrt invertida.
    up = np.sqrt(np.linspace(0, 1, xfade_n, dtype=np.float32))
    down = up[::-1].copy()
    pos = 0  # inicio de la siguiente copia (solapa xfade_n con la anterior)
    bi = 0
    first = True
    while pos < total:
        bed = beds[bi % len(beds)][1]
        bi += 1
        end = min(pos + len(bed), total)
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
        if end >= total:
            break
        pos = end - xfade_n  # la siguiente copia empieza antes del fin
    # Fade-out final de 1 s para no cortar en seco.
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
    print(f"OK {a.out} — {a.seconds:.1f} s de cama "
          f"({len(beds)} secciones en ciclo, xfade {a.xfade}s), "
          f"{final:.2f} LUFS, {os.path.getsize(a.out) / 1e6:.1f} MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
