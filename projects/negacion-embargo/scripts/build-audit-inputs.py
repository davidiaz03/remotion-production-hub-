#!/usr/bin/env python3
"""Entradas para scripts/audio/audit-audio.py.

La VO «original» son los 8 archivos L1–L8 tal como los grabó Adriana;
la «editada» es public/audio/voice-placed.wav (las mismas líneas con
recorte de sala + colocación en la línea de tiempo; NINGÚN corte
dentro de una línea, NINGÚN stretch).

Salidas (research/vo/):
  voice-orig.wav              — L1–L8 concatenados sin huecos (la línea
                                de tiempo original).
  vo-orig-transcription.json  — palabras en tiempo original (segmentos).
  vo-editada-prediccion.json  — {palabras: [{w, s, e}]} en tiempo editado
                                (predicción analítica PRE-alineación: los
                                tiempos de Whisper + offsets; la
                                alineación por onsets es corrección del
                                karaoke, no de la predicción).
  edit-plan.json              — un segmento por línea (factor 1.0).
  captions-audit.json         — palabras planas desde src/captions.ts
                                (ALINEADAS) con pageBreakAfter al final
                                de cada chunk.
  vo-edited-transcription.json — transcripción de voice-placed.wav con
                                faster-whisper (flag --transcribe-edited,
                                P0-1: antes se generaba ad-hoc en v4 sin
                                script) + corrección de snaps de frontera
                                con fix_snaps() (abajo).

Snaps de segmento: faster-whisper asigna a la primera palabra de cada
segmento el inicio del segmento cuando el borde VAD es impreciso
("Esta" salió a 28,40 s, 0,60 s antes de su onset real 29,16 s). Sin
corregirlo, el check (g) paso 1 haría FAIL por «fallo de
transcripción». La corrección usa la predicción analítica (medida
independiente por línea) solo para primeras palabras de segmento con
desvío >0,15 s; en esta VO fueron 4 palabras (El, Cuatro, Esta, un).
"""
import json
import os
import re
import subprocess
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
VO_DIR = os.path.join(PROJ, "research", "vo")
FPS = 30
# faster-whisper vive en el venv STT, no en el del hub (mismo patrón
# que scripts/audio/audit-audio.py).
WHISPER_VENV = os.path.expanduser("~/workspace/.stt-env/bin/python")
WHISPER_MODEL = os.path.expanduser(
    "~/workspace/.stt-models/faster-whisper-small")


def load_words():
    words = {}
    l1 = json.load(open(os.path.join(VO_DIR, "l1-words-small.json")))
    words[1] = [{"t": w["w"], "s": w["s"], "e": w["e"]} for w in l1]
    vo = json.load(open(os.path.join(VO_DIR, "vo-transcription-small.json")))
    for line in vo:
        words[line["linea"]] = [
            {"t": w["palabra"], "s": w["inicio"], "e": w["fin"]}
            for w in line["palabras"]]
    return words


def file_dur(path: str) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", path], capture_output=True, text=True,
        check=True).stdout.strip()
    return float(out)


def probe_audio(path: str):
    """(canales, sample_rate, duración) de un audio con ffprobe."""
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries",
         "stream=channels,sample_rate", "-show_entries",
         "format=duration", "-of", "json", path],
        capture_output=True, text=True, check=True).stdout
    d = json.loads(out)
    st = d["streams"][0]
    return int(st["channels"]), int(st["sample_rate"]), \
        float(d["format"]["duration"])


def validate_voice_orig(orig_path: str, line_paths, tol: float = 0.1):
    """Validación dura de la VO original concatenada (P0-2).

    El bug del 22-nov (auditoría v3, 111 FAIL falsos): L1 es mono y
    L2–L8 estéreo; el concat `-c copy` no convertía y la cabecera
    declaraba mono, así que voice-orig.wav salió con 116,71 s en vez
    de 61,78 s y la auditoría comparó contra un original corrupto.
    Esta validación caza ese fallo en segundos, antes de generar un
    solo insumo de auditoría:
      - voice-orig.wav debe ser mono 48 kHz (el formato del concat);
      - su duración debe ser la suma de las líneas (±tol).
    Devuelve (esperada, real) en segundos; lanza ValueError con un
    mensaje claro si algo no cuadra.
    """
    channels, rate, actual = probe_audio(orig_path)
    if channels != 1:
        raise ValueError(
            f"voice-orig.wav corrupta: {channels} canales (debe ser mono); "
            f"probable concat sin convertir mono/estéreo")
    if rate != 48000:
        raise ValueError(
            f"voice-orig.wav a {rate} Hz (debe ser 48000)")
    expected = 0.0
    for p in line_paths:
        if not os.path.isfile(p):
            raise ValueError(f"falta la línea de VO: {p}")
        d = file_dur(p)
        if d <= 0:
            raise ValueError(f"línea de VO vacía: {p}")
        expected += d
    if abs(actual - expected) > tol:
        raise ValueError(
            f"voice-orig.wav corrupta: duración {actual:.2f} s, suma de "
            f"líneas {expected:.2f} s (desvío {actual - expected:+.2f} s, "
            f"tolerancia ±{tol} s). No se generan insumos de auditoría.")
    return expected, actual


def main():
    words = load_words()
    timeline = json.load(open(os.path.join(PROJ, "research/timeline.json")))
    place = timeline["vo_placement"]

    # 1) VO original: concatenación sin huecos.
    # CORRECCIÓN 22-nov (auditoría v3 FAIL): L1 es MONO y L2–L8 son
    # ESTÉREO; el concat con `-c copy` no convierte y la cabecera
    # declara mono (formato de L1): las muestras estéreo de L2–L8 se
    # leen como mono intercalado (duración duplicada, 116,71 s, audio
    # inservible) y la auditoría compara contra un original corrupto.
    # Se convierte cada línea a mono 48k ANTES de concatenar.
    conv = []
    for n in range(1, 9):
        out = os.path.join(VO_DIR, f"_orig_L{n}.wav")
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i",
                        os.path.join(PROJ, "public/audio/real/lines",
                                     f"L{n}.wav"),
                        "-ac", "1", "-ar", "48000", out], check=True)
        conv.append(out)
    concat_list = os.path.join(VO_DIR, "concat-orig.txt")
    with open(concat_list, "w") as f:
        for p in conv:
            f.write(f"file '{p}'\n")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat",
                    "-safe", "0", "-i", concat_list,
                    "-c:a", "pcm_s16le",
                    os.path.join(VO_DIR, "voice-orig.wav")], check=True)
    for p in conv:
        os.remove(p)

    # Validación dura (P0-2): la duración del concat debe ser la suma
    # de las líneas (±0,1 s) y el archivo mono 48k. Si no cuadra, se
    # borra el archivo corrupto y se aborta ANTES de generar insumos:
    # nada aguas abajo debe comparar contra un original corrupto.
    orig_path = os.path.join(VO_DIR, "voice-orig.wav")
    line_paths = [os.path.join(PROJ, "public/audio/real/lines",
                               f"L{n}.wav") for n in range(1, 9)]
    try:
        expected, actual = validate_voice_orig(orig_path, line_paths)
    except ValueError as exc:
        os.remove(orig_path)
        raise SystemExit(f"ERROR: {exc}")
    print(f"VO original validada: {actual:.2f} s "
          f"(suma de líneas {expected:.2f} s, mono 48k)")

    # Offsets de cada línea en la concatenación.
    offsets, acc = {}, 0.0
    for n in range(1, 9):
        offsets[n] = acc
        acc += file_dur(os.path.join(
            PROJ, "public/audio/real/lines", f"L{n}.wav"))
    print(f"VO original: {acc:.2f} s concatenados")

    # 2) Transcripción original (segmentos por línea, tiempo original).
    segs = []
    for n in range(1, 9):
        segs.append({"words": [
            {"w": w["t"], "s": round(offsets[n] + w["s"], 3),
             "e": round(offsets[n] + w["e"], 3)} for w in words[n]]})
    json.dump(segs, open(os.path.join(VO_DIR, "vo-orig-transcription.json"),
                         "w"), ensure_ascii=False, indent=1)

    # 3) Predicción analítica (tiempo editado, PRE-alineación).
    pred = []
    for n in range(1, 9):
        p = place[f"L{n}"]
        first = words[n][0]["s"]
        for w in words[n]:
            pred.append({"w": w["t"],
                         "s": round(p["speech_start_s"] + (w["s"] - first), 3),
                         "e": round(p["speech_start_s"] + (w["e"] - first), 3)})
    json.dump({"palabras": pred},
              open(os.path.join(VO_DIR, "vo-editada-prediccion.json"), "w"),
              ensure_ascii=False, indent=1)

    # 4) Plan de edición (un segmento por línea, factor 1.0).
    # Pausas de prosodia intra-línea (research/vo/prosody-gaps.json):
    # silencios de la toma única, verificados uno a uno en el original
    # (energía -56..-61 dBFS con voz a ambos lados) — no son ediciones;
    # el check (e) las trata como diseñadas. Sin ellas, (e) da FAIL
    # espurio en cada pausa natural de Adriana (auditoría v3, 13 FAIL).
    prosody = {}
    pg_path = os.path.join(VO_DIR, "prosody-gaps.json")
    if os.path.isfile(pg_path):
        for ln_no, gs, ge in json.load(open(pg_path)):
            prosody.setdefault(ln_no, []).append([gs, ge])
    lines = []
    for n in range(1, 9):
        p = place[f"L{n}"]
        first, last = words[n][0]["s"], words[n][-1]["e"]
        seg_dur = p["trim_end_s"] - p["trim_start_s"]
        lines.append({
            "linea": n, "slot": p["adelay_s"], "factor_uniforme": 1.0,
            "gaps": [],
            "prosody_gaps": prosody.get(n, []),
            "segs": [{
                "orig_start": round(offsets[n] + p["trim_start_s"], 3),
                "orig_end": round(offsets[n] + p["trim_end_s"], 3),
                "orig_word_start": round(offsets[n] + first, 3),
                "orig_word_end": round(offsets[n] + last, 3),
                "edited_start": p["adelay_s"],
                "edited_end": round(p["adelay_s"] + seg_dur, 3),
                "head_keep": round(first - p["trim_start_s"], 3),
                "tail_keep": round(p["trim_end_s"] - last, 3),
                "merged_subphrases": None,
            }],
            "merged_gaps": [],
        })
    plan = {"version": "negacion-embargo v1 (VO real Adriana, 8 líneas; "
                       "solo recorte de sala + colocación, sin stretch)",
            "total": timeline["duration_s"], "pad": 0.03, "fade": 0.005,
            "lines": lines}
    json.dump(plan, open(os.path.join(VO_DIR, "edit-plan.json"), "w"),
              ensure_ascii=False, indent=1)

    # 5) Captions para la auditoría (desde src/captions.ts, ALINEADOS).
    ts = open(os.path.join(PROJ, "src/captions.ts"), encoding="utf-8").read()
    segments = json.loads(re.search(
        r"export const CAPTIONS[^=]*= (\[.*\]);", ts, re.S).group(1))
    flat = []
    for seg in segments:
        for chunk in seg["chunks"]:
            for i, w in enumerate(chunk["words"]):
                flat.append({"text": w["t"],
                             "startMs": int(round(w["s"] * 1000)),
                             "endMs": int(round(w["e"] * 1000)),
                             "pageBreakAfter": i == len(chunk["words"]) - 1})
    json.dump(flat, open(os.path.join(VO_DIR, "captions-audit.json"), "w"),
              ensure_ascii=False, indent=1)
    print(f"predicción: {len(pred)} palabras; captions: {len(flat)} palabras; "
          f"plan: {len(lines)} líneas")
    print("Falta: vo-edited-transcription.json (generar con "
          "--transcribe-edited)")


def transcribe_edited(voice_path, out_path, model=WHISPER_MODEL,
                      stt_py=WHISPER_VENV):
    """Transcribe la VO editada (voice-placed.wav) con faster-whisper.

    P0-1: en v4 este paso se hizo ad-hoc, sin script, y el orquestador
    no podía reproducirlo. Escribe segmentos [{text, start, end,
    words: [{w, s, e}]}] (mismo formato que el archivo de v4, 10
    segmentos / 125 palabras). Devuelve la lista de segmentos.
    """
    if not os.path.isfile(voice_path):
        raise SystemExit(f"No existe la VO editada: {voice_path} "
                         f"(primero scripts/build-audio.sh)")
    if not os.path.isfile(stt_py):
        raise SystemExit(f"No existe el venv STT: {stt_py}")
    script = (
        "import json, sys\n"
        "from faster_whisper import WhisperModel\n"
        "m = WhisperModel(sys.argv[1], device='cpu', "
        "compute_type='int8', local_files_only=True)\n"
        "segs, _ = m.transcribe(sys.argv[2], language='es', "
        "word_timestamps=True)\n"
        "out = []\n"
        "for s in segs:\n"
        "    out.append({'text': s.text.strip(), "
        "'start': round(s.start, 3), 'end': round(s.end, 3), "
        "'words': [{'w': w.word.strip(), 's': round(w.start, 3), "
        "'e': round(w.end, 3)} for w in s.words]})\n"
        "json.dump(out, open(sys.argv[3], 'w'), ensure_ascii=False, "
        "indent=1)\n"
    )
    with tempfile.TemporaryDirectory() as td:
        sp = os.path.join(td, "te.py")
        open(sp, "w").write(script)
        subprocess.run([stt_py, sp, model, voice_path, out_path],
                       check=True, capture_output=True, timeout=900)
    segs = json.load(open(out_path))
    n_words = sum(len(s["words"]) for s in segs)
    print(f"transcripción editada: {len(segs)} segmentos, {n_words} palabras")
    return segs


def fix_snaps(pred_path=None, edited_path=None):
    """Corrige los snaps de frontera de segmento en
    vo-edited-transcription.json (ver docstring del módulo).

    Las rutas son parámetros para poder testearla con archivos
    sintéticos; por defecto usa las del proyecto. Devuelve la lista
    de correcciones [(palabra, antes, después)].
    """
    pred_path = pred_path or os.path.join(
        VO_DIR, "vo-editada-prediccion.json")
    edited_path = edited_path or os.path.join(
        VO_DIR, "vo-edited-transcription.json")
    pred = json.load(open(pred_path))["palabras"]
    ed = json.load(open(edited_path))
    flat = [(wi, w) for s in ed for wi, w in enumerate(s["words"])]
    if len(flat) != len(pred):
        raise AssertionError(
            f"la transcripción editada tiene {len(flat)} palabras y la "
            f"predicción {len(pred)}: no se pueden corregir los snaps "
            f"sin alinear palabra a palabra")
    fixed = []
    for idx, (wi, w) in enumerate(flat):
        if wi == 0 and abs(w["s"] - pred[idx]["s"]) > 0.15:
            fixed.append((w["w"], w["s"], pred[idx]["s"]))
            w["s"] = pred[idx]["s"]
    json.dump(ed, open(edited_path, "w"), ensure_ascii=False, indent=1)
    print("snaps corregidos:", fixed)
    return fixed


if __name__ == "__main__":
    import sys
    if "--transcribe-edited" in sys.argv:
        transcribe_edited(
            os.path.join(PROJ, "public/audio/voice-placed.wav"),
            os.path.join(VO_DIR, "vo-edited-transcription.json"))
        fix_snaps()
    elif "--fix-snaps" in sys.argv:
        fix_snaps()
    else:
        main()
