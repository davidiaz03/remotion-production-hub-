#!/usr/bin/env python3
"""Importa una pista (Google Flow Music u otra) a la biblioteca de camas.

Una cama de la biblioteca es una VENTANA LIMPIA de una pista larga:
`bed-loop.py` la repite en ciclo con crossfades para cubrir un video
entero. Importar a mano es propenso a error (la pista «Documentary
underscore» de Flow llevaba voces fantasma en 60-88 s que solo el
escaneo Whisper+VAD detecta). Este script automatiza la ingesta:

  1. `select-bed-window.py` (Whisper small + VAD, un solo escaneo de
     toda la pista) elige la mejor ventana limpia de --duration s.
     Sin ventana limpia: exit 1, sin tocar la biblioteca.
  2. ffmpeg recorta la ventana a assets/music/beds/<id>.wav (48 kHz
     mono s16le). Sin fundidos en los bordes: bed-loop.py ya aplica
     crossfades de potencia igual entre repeticiones.
  3. `scan-bed.py` verifica el RECORTE (por defecto; --no-verify lo
     salta). Un recorte con VOICE es FAIL y no se registra.
  4. Se añade la entrada a assets/music/beds/registry.json con origen,
     ventana, escaneo, LUFS y SHA-256.

La pista original NO se mueve ni se modifica: queda donde estaba (lo
ideal, assets/music/flow/ — ver scripts/audio/FLOW_MUSIC.md) y el
registro guarda su ruta.

Uso (con el Python de STT, que tiene faster-whisper):
  ~/workspace/.stt-env/bin/python scripts/audio/bed-import.py \\
      --in assets/music/flow/shadows-and-evidence-flow.wav \\
      --id documentary-flow-a --duration 60 \\
      --tags calm,documentary,piano \\
      --title "Shadows and Evidence (Flow)"
  # Reusar un escaneo ya hecho (sin Whisper, para tests o re-imports):
  ... --scan-json assets/music/beds/<id>.scan.json
"""
import argparse
import hashlib
import importlib.util
import json
import os
import subprocess
import sys
import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
HUB = os.path.expanduser("~/workspace/remotion-hub")
BEDS_DIR = os.path.join(HUB, "assets", "music", "beds")
REGISTRY = os.path.join(BEDS_DIR, "registry.json")
STT_PY = os.path.expanduser("~/workspace/.stt-env/bin/python")


def _load_bed_loop():
    path = os.path.join(HERE, "bed-loop.py")
    spec = importlib.util.spec_from_file_location("bed_loop", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def sha256_of(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def probe_duration(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                        "format=duration", "-of", "csv=p=0", path],
                       capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def load_registry():
    if not os.path.isfile(REGISTRY):
        return {"version": 1, "dir": "assets/music/beds", "beds": []}
    with open(REGISTRY, encoding="utf-8") as f:
        return json.load(f)


def save_registry(reg):
    tmp = REGISTRY + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(reg, f, ensure_ascii=False, indent=1)
        f.write("\n")
    os.replace(tmp, REGISTRY)


def select_window(stt_py, inp, duration, scan_out):
    """Escanea la pista y devuelve (ventana, informe)."""
    cmd = [stt_py, os.path.join(HERE, "select-bed-window.py"),
           "--in", inp, "--duration", str(duration),
           "--out", scan_out]
    r = subprocess.run(cmd, capture_output=True, text=True)
    sys.stdout.write(r.stdout)
    if r.stderr:
        sys.stderr.write(r.stderr)
    if r.returncode != 0:
        raise SystemExit(
            f"select-bed-window falló (código {r.returncode}): "
            "ninguna ventana limpia de esa duración en la pista")
    with open(scan_out, encoding="utf-8") as f:
        report = json.load(f)
    chosen = report.get("chosen")
    if not chosen:
        raise SystemExit("select-bed-window no eligió ninguna ventana")
    return chosen, report


def verify_cut(stt_py, wav, verify_out):
    cmd = [stt_py, os.path.join(HERE, "scan-bed.py"),
           "--in", wav, "--out", verify_out]
    r = subprocess.run(cmd, capture_output=True, text=True)
    sys.stdout.write(r.stdout)
    if r.stderr:
        sys.stderr.write(r.stderr)
    if r.returncode != 0:
        raise SystemExit(
            f"scan-bed FAIL sobre el recorte (código {r.returncode}): "
            "el recorte contiene voz; no se registra la cama")
    with open(verify_out, encoding="utf-8") as f:
        return json.load(f)


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--in", dest="inp", required=True,
                   help="Pista de origen (cualquier formato ffmpeg)")
    p.add_argument("--id", required=True,
                   help="Id de la cama en la biblioteca "
                   "(p. ej. documentary-flow-a)")
    p.add_argument("--duration", type=float, default=60.0,
                   help="Duración de la ventana en s (defecto 60)")
    p.add_argument("--title", default="",
                   help="Título legible de la pista de origen")
    p.add_argument("--tags", default="",
                   help="Etiquetas separadas por comas")
    p.add_argument("--source", default="flow-music",
                   help="Origen (defecto flow-music)")
    p.add_argument("--scan-json", default=None,
                   help="Informe de select-bed-window ya hecho: se "
                   "reutiliza su ventana sin escanear (tests, re-imports)")
    p.add_argument("--no-verify", action="store_true",
                   help="Saltar el scan-bed del recorte (no recomendado)")
    p.add_argument("--force", action="store_true",
                   help="Sobrescribir una cama con el mismo id")
    p.add_argument("--stt-python", default=STT_PY,
                   help="Python con faster-whisper")
    a = p.parse_args()
    if not os.path.isfile(a.inp):
        p.error(f"no existe la pista {a.inp}")
    if a.duration < 10:
        p.error("--duration debe ser >= 10 s")
    if "/" in a.id or a.id in (".", ".."):
        p.error(f"id inválido: {a.id!r}")

    os.makedirs(BEDS_DIR, exist_ok=True)
    reg = load_registry()
    beds = reg.setdefault("beds", [])
    existing = next((b for b in beds if b["id"] == a.id), None)
    if existing and not a.force:
        p.error(f"ya existe la cama {a.id!r} (usa --force para rehacerla)")

    out_wav = os.path.join(BEDS_DIR, f"{a.id}.wav")
    scan_out = os.path.join(BEDS_DIR, f"{a.id}.scan.json")
    verify_out = os.path.join(BEDS_DIR, f"{a.id}.verify.json")
    track_dur = probe_duration(a.inp)
    if track_dur < a.duration:
        p.error(f"la pista dura {track_dur:.1f} s < {a.duration} s")

    if a.scan_json:
        with open(a.scan_json, encoding="utf-8") as f:
            report = json.load(f)
        chosen = report.get("chosen")
        if not chosen:
            p.error(f"{a.scan_json} no trae ventana elegida (chosen)")
        win_len = chosen["end_s"] - chosen["start_s"]
        if abs(win_len - a.duration) > 0.1:
            p.error(f"la ventana del escaneo dura {win_len:.2f} s, "
                    f"no {a.duration} s")
        # Copia el informe junto a la cama (auditoría).
        with open(scan_out, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=1)
    else:
        chosen, report = select_window(a.stt_python, a.inp,
                                       a.duration, scan_out)
    start, end = float(chosen["start_s"]), float(chosen["end_s"])
    print(f"Ventana elegida: {start:.2f}-{end:.2f} s "
          f"(puntuación {chosen.get('score')})")

    # Recorte (sin fundidos: bed-loop aplica los crossfades).
    subprocess.run(["ffmpeg", "-y", "-v", "error",
                    "-ss", str(start), "-i", a.inp,
                    "-t", str(end - start),
                    "-map", "0:a:0", "-ac", "1", "-ar", "48000",
                    "-c:a", "pcm_s16le", out_wav], check=True)
    cut_dur = probe_duration(out_wav)
    if abs(cut_dur - a.duration) > 0.2:
        raise SystemExit(f"el recorte dura {cut_dur:.2f} s, "
                         f"no {a.duration} s")
    print(f"Recorte: {out_wav} ({cut_dur:.2f} s)")

    if not a.no_verify:
        verify_cut(a.stt_python, out_wav, verify_out)
        print("Verificación del recorte: PASS (sin voz)")
    elif os.path.exists(verify_out):
        os.remove(verify_out)

    bed_loop = _load_bed_loop()
    lufs = bed_loop.lufs_of(out_wav)
    entry = {
        "id": a.id,
        "file": f"{a.id}.wav",
        "title": a.title or a.id,
        "source": a.source,
        "source_file": os.path.abspath(a.inp),
        "source_track_s": round(track_dur, 2),
        "window": {"start_s": start, "end_s": end,
                   "score": chosen.get("score")},
        "scan": f"{a.id}.scan.json",
        "verify": None if a.no_verify else f"{a.id}.verify.json",
        "added": datetime.date.today().isoformat(),
        "seconds": round(cut_dur, 2),
        "sample_rate": 48000,
        "channels": 1,
        "lufs_measured": round(lufs, 2),
        "sha256": sha256_of(out_wav),
        "tags": [t.strip() for t in a.tags.split(",") if t.strip()],
    }
    if existing:
        beds[beds.index(existing)] = entry
    else:
        beds.append(entry)
    save_registry(reg)
    print(f"OK cama {a.id}: {cut_dur:.2f} s, {lufs:.2f} LUFS, "
          f"ventana {start:.2f}-{end:.2f} s de {a.inp}")
    print(f"Uso: --bed {a.id}  (bed-loop.py / pipeline.json music.beds)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
