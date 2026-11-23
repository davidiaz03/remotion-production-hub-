#!/usr/bin/env python3
"""Tiempos de audio medidos una sola vez — fuente única (P0-5).

Los tiempos de eventos de audio (palabras del panel, impactos, slams
que caen SOBRE una palabra) se miden UNA vez con Whisper sobre el
clip real y se guardan en `research/audio-times.json` con procedencia
(clip, método, probabilidad, fecha). La composición y la mezcla LEEN
ese archivo; nunca se copian tiempos a mano entre documentos.

Por qué existe: el desync de «PUNTO.» (f400 visual vs f423 audio,
0,77 s) existió porque la v2 puso el slam en 13,32 s creyendo que
«Period.» caía en 13,72 s, cuando la medición correcta (4,58 s del
clip panel-t2.mp4 + J-cut 9,5 s = 14,08 s, f423) ya existía. El fix
costó ~21 min y se descubrió de casualidad. Con este archivo, el
tiempo medido es uno solo y el `check` caza cualquier copia
desactualizada (encontró `punto_s: 13.32` en timeline.json, ya
corregido a 14,08).

Formato de research/audio-times.json:
  {"version": 1, "project": "<id>", "fps": 30, "events": [
    {"id": "panel-t2-period", "label": "...",
     "clip": "public/video/panel-t2.mp4",       # relativo al proyecto
     "clip_t_s": 4.58, "clip_t_end_s": 5.28,    # medido en el clip
     "offset_s": 9.5,                           # colocación global
     "offset_note": "J-cut: Sequence T2 video from f285",
     "global_t_s": 14.08, "global_f": 423,
     "method": "faster-whisper-small, word timestamps, lang=en",
     "prob": 0.98, "word": "Period.",
     "measured_at": "2026-11-23",
     "cross_check": {"file": "research/timeline.json",
                     "path": "panel.t2_waltz7.punto_s",
                     "tolerance_s": 0.1},
     "composition_ref": [
       {"file": "src/MainReel.tsx", "const": "SLAMS", "contains": 423},
       {"file": "src/MainReel.tsx", "const": "PUNTO_AT",
        "value": 126, "base_f": 297}]}]}
  - global_t_s = offset_s + clip_t_s (tolerancia 0,05 s en el check).
  - global_f es el fotograma de COLOCACIÓN (el que usa la
    composición); puede diferir ±1 f del redondeo de global_t_s*fps
    (14,08 s × 30 = 422,4; el slam cae en f423, primer fotograma con
    la palabra plenamente audible).
  - cross_check/composition_ref son opcionales; si se declaran, el
    check los verifica (un desacuerdo es ERROR: es la clase de bug
    que este archivo existe para cazar).
  - Lo que NO va aquí: slams puramente visuales (sin evento de
    audio), tiempos de SFX de diseño (viven en timeline.json) y la
    colocación de la VO (vo_placement en timeline.json).

Uso:
  audio-times.py measure --project ID --clip REL --word PALABRA
      [--language en] [--offset-s 9.5] [--event-id ID] [--append]
      [--global-f F]     # medir y (con --append) registrar el evento
  audio-times.py check --project ID
      # valida estructura, consistencia y referencias cruzadas
  audio-times.py sync --project ID
      # genera src/audio-times.generated.ts desde el JSON
`measure` transcribe con faster-whisper (venv STT, mismo patrón que
audit-audio.py); `check` y `sync` solo necesitan ffprobe y Python.
"""
import argparse
import datetime
import json
import os
import re
import subprocess
import sys
import tempfile

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
WHISPER_VENV = os.path.expanduser("~/workspace/.stt-env/bin/python")
WHISPER_MODEL = os.path.expanduser(
    "~/workspace/.stt-models/faster-whisper-small")

# Tolerancias del check.
TOL_OFFSET_S = 0.05   # global_t_s vs offset_s + clip_t_s
TOL_FRAME = 1         # global_f vs round(global_t_s * fps)


def project_dir(project):
    return os.path.join(REPO, "projects", project)


def times_path(project):
    return os.path.join(project_dir(project), "research",
                        "audio-times.json")


def load_times(project):
    with open(times_path(project)) as f:
        return json.load(f)


def file_dur(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", path], capture_output=True, text=True,
        check=True).stdout.strip()
    return float(out)


def norm_word(w):
    return re.sub(r"[^a-záéíóúñü0-9]", "", w.lower())


# ---------------- measure ----------------

def transcribe_words(clip_path, language):
    """Palabras con timestamps vía faster-whisper (venv STT).

    Mismo patrón que audit-audio.py: subproceso con un script
    generado (el venv del hub no tiene faster-whisper). Devuelve
    [{w, s, e, p}]."""
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, "clip-16k.wav")
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", clip_path,
                        "-vn", "-ac", "1", "-ar", "16000", wav],
                       check=True)
        script = (
            "import json, sys\n"
            "from faster_whisper import WhisperModel\n"
            "m = WhisperModel(sys.argv[1], device='cpu', "
            "compute_type='int8', local_files_only=True)\n"
            f"segs, _ = m.transcribe(sys.argv[2], language='{language}',\n"
            "                       word_timestamps=True)\n"
            "words = []\n"
            "for s in segs:\n"
            "    for w in s.words:\n"
            "        words.append({'w': w.word.strip(), "
            "'s': round(w.start, 3), 'e': round(w.end, 3), "
            "'p': round(w.probability, 3)})\n"
            "json.dump(words, open(sys.argv[3], 'w'), "
            "ensure_ascii=False)\n"
        )
        sp = os.path.join(td, "tw.py")
        op = os.path.join(td, "words.json")
        with open(sp, "w") as f:
            f.write(script)
        env = dict(os.environ, NO_PROXY="localhost,127.0.0.1",
                   no_proxy="localhost,127.0.0.1")
        subprocess.run([WHISPER_VENV, sp, WHISPER_MODEL, wav, op],
                       check=True, capture_output=True, timeout=600,
                       env=env)
        with open(op) as f:
            return json.load(f)


def measure_event(project, clip, word, language="en", offset_s=0.0,
                  after_s=0.0):
    """Mide una palabra en un clip. Devuelve el dict del evento (sin
    id/label/global_f: los pone el llamador)."""
    clip_path = os.path.join(project_dir(project), clip)
    if not os.path.isfile(clip_path):
        raise ValueError(f"clip no encontrado: {clip_path}")
    words = transcribe_words(clip_path, language)
    want = norm_word(word)
    for w in words:
        if w["s"] >= after_s and norm_word(w["w"]) == want:
            return {"clip": clip, "word": w["w"],
                    "clip_t_s": w["s"], "clip_t_end_s": w["e"],
                    "offset_s": offset_s,
                    "global_t_s": round(offset_s + w["s"], 3),
                    "method": ("faster-whisper-small, word timestamps, "
                               f"lang={language}"),
                    "prob": w["p"],
                    "measured_at": datetime.date.today().isoformat(),
                    "measured_by": "audio-times.py measure"}
    heard = " ".join(w["w"] for w in words)
    raise ValueError(f"palabra {word!r} no encontrada en {clip} "
                     f"(transcripción: {heard!r})")


# ---------------- check ----------------

def get_path(data, dotted):
    cur = data
    for part in dotted.split("."):
        if isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            return None
    return cur


def check_ts_const(proj, ref, event):
    """Verifica una referencia a una constante TS. Devuelve un error
    (str) o None. Formas: {"const": "SLAMS", "contains": 423} o
    {"const": "PUNTO_AT", "value": 126, "base_f": 297} (value+base_f
    debe ser global_f)."""
    path = os.path.join(proj, ref["file"])
    if not os.path.isfile(path):
        return f"{event['id']}: falta {ref['file']} para verificar " \
               f"{ref['const']}"
    with open(path, encoding="utf-8") as f:
        src = f.read()
    m = re.search(rf"const {re.escape(ref['const'])}\s*=\s*([^;]+);", src)
    if not m:
        return f"{event['id']}: no se encontró const {ref['const']} " \
               f"en {ref['file']}"
    rhs = m.group(1).strip()
    if "contains" in ref:
        vals = [int(x) for x in re.findall(r"\d+", rhs)]
        if ref["contains"] not in vals:
            return f"{event['id']}: {ref['const']} no contiene " \
                   f"{ref['contains']} (tiene {vals})"
    if "value" in ref:
        try:
            got = int(rhs)
        except ValueError:
            return f"{event['id']}: {ref['const']} no es un entero " \
                   f"({rhs!r})"
        if got != ref["value"]:
            return f"{event['id']}: {ref['const']} = {got}, se " \
                   f"esperaba {ref['value']}"
        if "base_f" in ref and got + ref["base_f"] != event["global_f"]:
            return f"{event['id']}: {ref['const']} ({got}) + base_f " \
                   f"({ref['base_f']}) = {got + ref['base_f']}, pero " \
                   f"global_f es {event['global_f']}"
    return None


def check_project_dir(proj):
    """Valida research/audio-times.json en el directorio `proj`.
    Devuelve (errores, advertencias, n_eventos)."""
    errors, warnings = [], []
    tp = os.path.join(proj, "research", "audio-times.json")
    try:
        with open(tp) as f:
            data = json.load(f)
    except FileNotFoundError:
        return [f"falta {tp}"], [], 0
    except json.JSONDecodeError as exc:
        return [f"audio-times.json inválido: {exc}"], [], 0
    fps = data.get("fps")
    if not isinstance(fps, (int, float)) or fps <= 0:
        errors.append("fps inválido o ausente")
        fps = 30
    events = data.get("events")
    if not isinstance(events, list) or not events:
        errors.append("events vacío o ausente")
        return errors, warnings, 0
    seen = set()
    for ev in events:
        eid = ev.get("id", "?")
        if eid in seen:
            errors.append(f"{eid}: id duplicado")
        seen.add(eid)
        for k in ("clip", "clip_t_s", "global_t_s", "global_f",
                  "method", "measured_at"):
            if k not in ev:
                errors.append(f"{eid}: falta el campo {k}")
        if errors and eid == "?":
            continue
        clip_path = os.path.join(proj, ev.get("clip", ""))
        if not os.path.isfile(clip_path):
            errors.append(f"{eid}: clip no encontrado: {ev.get('clip')}")
        else:
            try:
                dur = file_dur(clip_path)
                if not 0 <= ev.get("clip_t_s", -1) <= dur:
                    errors.append(f"{eid}: clip_t_s {ev.get('clip_t_s')} "
                                  f"fuera del clip (duración {dur:.2f} s)")
            except subprocess.CalledProcessError:
                errors.append(f"{eid}: ffprobe falló sobre el clip")
        if "offset_s" in ev:
            expect = ev["offset_s"] + ev.get("clip_t_s", 0)
            if abs(ev.get("global_t_s", 0) - expect) > TOL_OFFSET_S:
                errors.append(f"{eid}: global_t_s {ev.get('global_t_s')} "
                              f"!= offset_s + clip_t_s ({expect:.3f})")
        expect_f = round(ev.get("global_t_s", 0) * fps)
        if abs(ev.get("global_f", -999) - expect_f) > TOL_FRAME:
            errors.append(f"{eid}: global_f {ev.get('global_f')} difiere "
                          f"de global_t_s*fps ({expect_f}) en más de "
                          f"{TOL_FRAME} fotograma")
        if ev.get("prob") is not None and ev["prob"] < 0.5:
            warnings.append(f"{eid}: probabilidad baja ({ev['prob']}): "
                            f"verificar de oído")
        cc = ev.get("cross_check")
        if cc:
            cc_path = os.path.join(proj, cc["file"])
            if not os.path.isfile(cc_path):
                warnings.append(f"{eid}: cross_check: falta {cc['file']}")
            else:
                with open(cc_path) as f:
                    other = json.load(f)
                val = get_path(other, cc["path"])
                tol = cc.get("tolerance_s", 0.1)
                if val is None:
                    warnings.append(f"{eid}: cross_check: no existe "
                                    f"{cc['path']} en {cc['file']}")
                elif abs(val - ev["global_t_s"]) > tol:
                    errors.append(f"{eid}: cross_check: {cc['file']} "
                                  f"{cc['path']} = {val}, pero "
                                  f"global_t_s es {ev['global_t_s']} "
                                  f"(desvío > {tol} s: valor copiado "
                                  f"desactualizado)")
        for ref in ev.get("composition_ref", []):
            err = check_ts_const(proj, ref, ev)
            if err:
                errors.append(err)
    return errors, warnings, len(events)


def check_project(project):
    return check_project_dir(project_dir(project))


# ---------------- sync ----------------

def ts_id(event_id):
    return re.sub(r"[^A-Z0-9]+", "_", event_id.upper()).strip("_")


def sync_project_dir(proj):
    """Genera src/audio-times.generated.ts desde el JSON."""
    with open(os.path.join(proj, "research", "audio-times.json")) as f:
        data = json.load(f)
    lines = [
        "// GENERATED by scripts/audio-times.py sync — DO NOT EDIT.",
        "// Fuente única: research/audio-times.json (P0-5). Para cambiar",
        "// un tiempo: medir con `audio-times.py measure --append` y",
        "// re-generar con `audio-times.py sync`.",
        "",
        "export const AUDIO_TIMES = {",
    ]
    for ev in data["events"]:
        lines.append(
            f"\t\"{ev['id']}\": {{clipT: {ev['clip_t_s']}, "
            f"globalT: {ev['global_t_s']}, globalF: {ev['global_f']}}},")
    lines.append("} as const;")
    lines.append("")
    for ev in data["events"]:
        lines.append(f"export const {ts_id(ev['id'])}_F = "
                     f"{ev['global_f']};")
    lines.append("")
    out = os.path.join(proj, "src", "audio-times.generated.ts")
    with open(out, "w") as f:
        f.write("\n".join(lines))
    return out


def sync_project(project):
    return sync_project_dir(project_dir(project))


# ---------------- CLI ----------------

def main(argv=None):
    ap = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("measure", help="medir una palabra en un clip")
    p.add_argument("--project", required=True)
    p.add_argument("--clip", required=True,
                   help="ruta relativa al proyecto")
    p.add_argument("--word", required=True)
    p.add_argument("--language", default="en")
    p.add_argument("--offset-s", type=float, default=0.0,
                   help="colocación global del clip (s)")
    p.add_argument("--after-s", type=float, default=0.0,
                   help="buscar solo a partir de este tiempo del clip")
    p.add_argument("--event-id", help="id del evento (con --append)")
    p.add_argument("--label", default="")
    p.add_argument("--global-f", type=int,
                   help="fotograma de colocación (por defecto, "
                   "round(global_t_s * fps))")
    p.add_argument("--append", action="store_true",
                   help="registrar/actualizar el evento en "
                   "research/audio-times.json")

    p = sub.add_parser("check", help="validar audio-times.json")
    p.add_argument("--project", required=True)

    p = sub.add_parser("sync", help="generar src/audio-times.generated.ts")
    p.add_argument("--project", required=True)

    args = ap.parse_args(argv)
    proj = project_dir(args.project)
    if not os.path.isdir(proj):
        print(f"proyecto desconocido: {args.project}", file=sys.stderr)
        return 2

    if args.cmd == "measure":
        try:
            ev = measure_event(args.project, args.clip, args.word,
                               args.language, args.offset_s, args.after_s)
        except ValueError as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 1
        fps = 30
        tp = times_path(args.project)
        if os.path.isfile(tp):
            with open(tp) as f:
                fps = json.load(f).get("fps", 30)
        ev["global_f"] = args.global_f if args.global_f is not None \
            else round(ev["global_t_s"] * fps)
        if args.append:
            if not args.event_id:
                print("ERROR: --append exige --event-id",
                      file=sys.stderr)
                return 2
            ev = {"id": args.event_id, "label": args.label, **ev}
            if os.path.isfile(tp):
                with open(tp) as f:
                    data = json.load(f)
            else:
                data = {"version": 1, "project": args.project,
                        "fps": fps, "events": []}
            data["events"] = [e for e in data["events"]
                              if e["id"] != args.event_id]
            data["events"].append(ev)
            os.makedirs(os.path.dirname(tp), exist_ok=True)
            with open(tp, "w") as f:
                json.dump(data, f, ensure_ascii=False, indent=1)
                f.write("\n")
            print(f"evento {args.event_id} registrado en {tp}")
        print(json.dumps(ev, ensure_ascii=False, indent=1))
        return 0

    if args.cmd == "check":
        errors, warnings, n = check_project(args.project)
        for w in warnings:
            print(f"WARN: {w}")
        for e in errors:
            print(f"ERROR: {e}")
        print(f"audio-times: {args.project}: {n} eventos, "
              f"{len(errors)} errores, {len(warnings)} advertencias")
        return 1 if errors else 0

    if args.cmd == "sync":
        out = sync_project(args.project)
        print(f"generado {out}")
        return 0
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
