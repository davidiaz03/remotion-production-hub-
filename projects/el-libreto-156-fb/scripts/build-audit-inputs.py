"""Entradas para scripts/audio/audit-audio.py (El Libreto, 156,8M FB).

La VO «original» es UNA toma continua (vo-fb-limpia-clean.wav, 24,02 s);
la «editada» es public/audio/voice-placed.wav (la misma toma recortada
a 24,02 s + pad de silencio hasta 27,5 s; NINGÚN corte dentro de una
línea, NINGÚN stretch, edited time = original time).

Salidas (research/vo/):
  voice-orig.wav              — la VO limpia en mono 48 kHz.
  vo-orig-transcription.json  — palabras en tiempo original (segmentos
                                de faster-whisper small, 69 tokens).
  vo-editada-prediccion.json  — {palabras: [{w, s, e}]} en tiempo editado
                                (69 tokens Whisper con texto corregido
                                según lo dicho y 1 onset corregido por
                                medición acústica a -50 dB).
  edit-plan.json              — 11 segmentos, 1 cada uno (factor 1.0),
                                contiguos, sin prosody_gaps. Las 13
                                líneas de VO se agrupan en 11 segmentos:
                                L1+L2 y L7+L8 van fusionadas (sin ningún
                                límite limpio entre ellas; la toma es
                                continua y nada se descarta).
  captions-audit.json         — palabras planas desde src/captions.ts
                                (ALINEADAS) con pageBreakAfter al final
                                de cada chunk.
  vo-edited-transcription.json — transcripción de voice-placed.wav con
                                faster-whisper (flag --transcribe-edited)
                                + corrección de snaps con fix_snaps().

DIFERENCIA con negacion-embargo: allí la predicción llevaba tiempos
Whisper crudos porque venía de transcripciones por línea (medidas
independientes, ya precisas). Aquí la predicción viene de UNA sola
transcripción de la toma completa, con un snap conocido (Whisper pone
«Este» a 0,00 s; el onset acústico real es 0,20 s). La predicción
lleva el tiempo CORREGIDO: así fix_snaps() endereza la primera
palabra de la transcripción editada y el check (g) compara el karaoke
contra onsets reales, no contra el snap de Whisper. La corrección es
1 onset (0,20 s) + 1 texto (lleva->llevó: Whisper oyó «lleva», el
usuario dice «llevó» y lo aprobó tal cual, 23-nov-2026). El karaoke
sigue lo DICHO, no el guion: «combustibles» y «licencias especiales»
en plural (pasadas ASR, VO_EDIT_REPORT_156.md).
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
WHISPER_VENV = os.path.expanduser("~/workspace/.stt-env/bin/python")
WHISPER_MODEL = os.path.expanduser(
    "~/workspace/.stt-models/faster-whisper-small")
CLEAN_VO = os.path.join(PROJ, "public/audio/real/vo-fb-limpia-clean.wav")

# Correcciones a la transcripción Whisper (índice en la lista plana de
# 69 tokens -> (token esperado, nuevo inicio s)). Medición acústica a
# -50 dB, 23-nov-2026. Se verifica el token antes de corregir: si la
# transcripción cambia, el script falla en voz alta en vez de
# corregir la palabra equivocada.
TIME_FIXES = {
    0: ("Este", 0.20),   # Whisper pone el inicio del segmento (0,00)
}
# Correcciones de texto según lo dicho (el conteo no cambia).
TEXT_FIXES = {
    53: ("lleva", "llevó"),
}


def file_dur(path: str) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", path], capture_output=True, text=True,
        check=True).stdout.strip()
    return float(out)


def probe_audio(path: str):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries",
         "stream=channels,sample_rate", "-show_entries",
         "format=duration", "-of", "json", path],
        capture_output=True, text=True, check=True).stdout
    d = json.loads(out)
    st = d["streams"][0]
    return int(st["channels"]), int(st["sample_rate"]), \
        float(d["format"]["duration"])


def validate_voice_orig(orig_path: str, clean_path: str, tol: float = 0.1):
    """Validación dura de la VO original (P0-2, adaptada a toma única).

    voice-orig.wav debe ser mono 48 kHz y durar lo mismo que la VO
    limpia (±tol). Si no cuadra, se aborta ANTES de generar insumos:
    nada aguas abajo debe comparar contra un original corrupto.
    """
    channels, rate, actual = probe_audio(orig_path)
    if channels != 1:
        raise ValueError(
            f"voice-orig.wav corrupta: {channels} canales (debe ser mono)")
    if rate != 48000:
        raise ValueError(f"voice-orig.wav a {rate} Hz (debe ser 48000)")
    expected = file_dur(clean_path)
    if abs(actual - expected) > tol:
        raise ValueError(
            f"voice-orig.wav corrupta: duración {actual:.2f} s, VO limpia "
            f"{expected:.2f} s (desvío {actual - expected:+.2f} s, "
            f"tolerancia ±{tol} s). No se generan insumos de auditoría.")
    return expected, actual


def main():
    timeline = json.load(open(os.path.join(PROJ, "research/timeline.json")))
    place = timeline["vo_placement"]
    segs = json.load(open(os.path.join(
        VO_DIR, "vo-transcription-small.json")))
    flat = [w for s in segs for w in s["words"]]
    if len(flat) != 69:
        raise SystemExit(f"la transcripción Whisper tiene {len(flat)} "
                         f"palabras, se esperaban 69")

    # 1) VO original: la toma limpia en mono 48k.
    orig_path = os.path.join(VO_DIR, "voice-orig.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", CLEAN_VO,
                    "-ac", "1", "-ar", "48000", orig_path], check=True)
    try:
        expected, actual = validate_voice_orig(orig_path, CLEAN_VO)
    except ValueError as exc:
        os.remove(orig_path)
        raise SystemExit(f"ERROR: {exc}")
    print(f"VO original validada: {actual:.2f} s "
          f"(VO limpia {expected:.2f} s, mono 48k)")

    # 2) Transcripción original (segmentos Whisper, tiempo original).
    json.dump(segs, open(os.path.join(
        VO_DIR, "vo-orig-transcription.json"), "w"),
        ensure_ascii=False, indent=1)

    # 3) Predicción analítica (tiempo editado = tiempo original).
    pred = []
    for i, w in enumerate(flat):
        text = w["w"]
        start = w["s"]
        if i in TIME_FIXES:
            exp, new_s = TIME_FIXES[i]
            if w["w"] != exp:
                raise SystemExit(
                    f"TIME_FIXES[{i}]: se esperaba {exp!r}, la "
                    f"transcripción tiene {w['w']!r}; la transcripción "
                    f"cambió, revisar las correcciones")
            start = new_s
        if i in TEXT_FIXES:
            exp, new_t = TEXT_FIXES[i]
            if w["w"] != exp:
                raise SystemExit(
                    f"TEXT_FIXES[{i}]: se esperaba {exp!r}, la "
                    f"transcripción tiene {w['w']!r}")
            text = new_t
        pred.append({"w": text, "s": round(start, 3),
                     "e": round(w["e"], 3)})
    json.dump({"palabras": pred},
              open(os.path.join(VO_DIR, "vo-editada-prediccion.json"), "w"),
              ensure_ascii=False, indent=1)

    # 4) Plan de edición (11 segmentos, 1 cada uno, factor 1.0).
    # Los segmentos son contiguos y se colocan en su trim_start (sin
    # offsets): edited time = original time.
    prosody = {}
    pg_path = os.path.join(VO_DIR, "prosody-gaps.json")
    if os.path.isfile(pg_path):
        for ln_no, gs, ge in json.load(open(pg_path)):
            prosody.setdefault(ln_no, []).append([gs, ge])
    lines = []
    for n, p in enumerate(place, start=1):
        seg_dur = p["trim_end_s"] - p["trim_start_s"]
        lines.append({
            "linea": n, "slot": p["trim_start_s"], "factor_uniforme": 1.0,
            "gaps": [],
            "prosody_gaps": prosody.get(n, []),
            "segs": [{
                "orig_start": p["trim_start_s"],
                "orig_end": p["trim_end_s"],
                "orig_word_start": p["speech_start_s"],
                "orig_word_end": round(
                    p["trim_end_s"] - p["tail_keep_s"], 3),
                "edited_start": p["trim_start_s"],
                "edited_end": round(p["trim_start_s"] + seg_dur, 3),
                "head_keep": p["head_keep_s"],
                "tail_keep": p["tail_keep_s"],
                "merged_subphrases": None,
            }],
            "merged_gaps": [],
        })
    plan = {"version": "el-libreto-156-fb v1 (VO toma única, 11 segmentos; "
                       "solo recorte de cola, sin stretch)",
            "total": timeline["duration_s"], "pad": 0.03, "fade": 0.005,
            "lines": lines}
    json.dump(plan, open(os.path.join(VO_DIR, "edit-plan.json"), "w"),
              ensure_ascii=False, indent=1)

    # 5) Captions para la auditoría (desde src/captions.ts, ALINEADOS).
    ts = open(os.path.join(PROJ, "src/captions.ts"), encoding="utf-8").read()
    segments = json.loads(re.search(
        r"export const CAPTIONS[^=]*= (\[.*\]);", ts, re.S).group(1))
    flat_c = []
    for seg in segments:
        for chunk in seg["chunks"]:
            for i, w in enumerate(chunk["words"]):
                flat_c.append({"text": w["t"],
                               "startMs": int(round(w["s"] * 1000)),
                               "endMs": int(round(w["e"] * 1000)),
                               "pageBreakAfter": i == len(chunk["words"]) - 1})
    json.dump(flat_c, open(os.path.join(VO_DIR, "captions-audit.json"), "w"),
              ensure_ascii=False, indent=1)
    print(f"predicción: {len(pred)} palabras; captions: {len(flat_c)} "
          f"palabras; plan: {len(lines)} líneas")
    print("Falta: vo-edited-transcription.json (generar con "
          "--transcribe-edited)")


def transcribe_edited(voice_path, out_path, model=WHISPER_MODEL,
                      stt_py=WHISPER_VENV):
    """Transcribe la VO editada (voice-placed.wav) con faster-whisper.

    Escribe segmentos [{text, start, end, words: [{w, s, e}]}].
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
    vo-edited-transcription.json.

    faster-whisper asigna a la primera palabra de cada segmento el
    inicio del segmento cuando el borde VAD es impreciso («Messi»
    sale a 0,00 s, 0,18 s antes de su onset real). La corrección usa
    la predicción analítica solo para primeras palabras de segmento
    con desvío >0,15 s.
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
