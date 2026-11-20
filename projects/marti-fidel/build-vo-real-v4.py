#!/usr/bin/env python3
"""Construye la VO real del reel marti-fidel V4 (locutora Adriana, 11 líneas).

V4 = guion V4.3 definitivo. La VO llegó en 11 archivos .aac (uno por línea),
convertidos a wav 16 kHz en research/vo-v43/wav/ y transcritos con
faster-whisper (vo-real-transcripts-v43.json, con word_timestamps y
speech_span por línea).

Diferencias con V2.5: NO hay cortes intra-línea ni time-stretch — cada línea
se recorta solo por cabeza/cola (silencio antes/después del speech_span, con
margen acústico), así que TODAS las pausas naturales intra-línea quedan
intactas (regla permanente: ninguna <0,25 s ni perder >50% — aquí no se toca
ninguna). La alineación ASR->guion corrige los artefactos conocidos del ASR
ante el habla rápida cubana (ver informe-verificacion-v43.json): «33» se
reparte en «treinta y tres», «Martín»->«Martí», «Adeptio»->«advirtió», la «a»
tragada de L9 se repone en el hueco acústico, «rodillarse»->«arrodillarse»,
«no sube»->«nos ve». El texto de captions ES EL GUION, no la transcripción.

Flujo: limpia cada línea con edit_line_safe (crossfades de igual potencia)
-> lines/L{N}.wav (48 kHz, highpass 70 Hz + loudnorm I=-18); ensambla la VO
editada (slots con pausas diseñadas) y la VO cruda (concatenación sin
solapes); emite vo-lines.json, captions.json/.ts, transcripciones,
predicción, edit-plan, manifiesto, anclas de SFX y TIMELINE-V4.md.

Uso:
  python3 build-vo-real-v4.py [--force]
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

SR = 48000
FADE_S = 0.005  # fundido en cada empalme (5 ms, coseno alzado)
HANDLE = 0.08   # margen cabeza/cola alrededor del speech_span (s)
LEAD = 0.25     # silencio inicial antes de L1
# Pausas diseñadas entre líneas (tras L1..L10). La de L8->L9 (1,00 s) es
# el silencio diseñado antes de la tesis (estrategia V4, S9).
GAPS = [0.40, 0.40, 0.50, 0.45, 0.45, 0.50, 0.45, 1.00, 0.45, 0.40]
TAIL_VIDEO = 1.50  # cola de vídeo tras el fin de la VO (logo + CTA)
HUB = os.path.expanduser("~/workspace/remotion-hub")
PROJ = os.path.join(HUB, "repo/projects/marti-fidel")
RES = os.path.join(HUB, "projects/marti-fidel/research")
VO43 = os.path.join(RES, "vo-v43")
V4 = os.path.join(PROJ, "public/audio/v4")
LINES_DIR = os.path.join(V4, "lines")
MANIFEST = os.path.join(PROJ, "vo-real-manifest-v4.json")

# Guion V4.3, palabra por palabra (el texto de captions es ESTE).
SCRIPT = {
    1: "Por primera vez en treinta y tres años, el Caribe dejó de votar unido.",
    2: "Martí lo vio venir en 1891.",
    3: "Es la hora del recuento, y de la marcha unida.",
    4: "Un primer ministro lo contó en la radio: Washington lo llamó para que cambiara su voto.",
    5: "Ya lo había dicho Martí: ¡los árboles se han de poner en fila, para que no pase el gigante de las siete leguas!",
    6: "El gigante, advirtió Martí, es el poderío económico y militar de Estados Unidos, que amenaza con extender su dominio sobre Nuestra América.",
    7: "En 2005, Fidel lo dijo con una claridad que estremece: No es lo mismo estar desinformado que haber perdido la capacidad de pensar.",
    8: "Hoy los medios del imperio crean reflejos condicionados: muchos repiten lo que oyen y dejan de pensar.",
    9: "Cuando un pueblo olvida su historia, está condenado a volverla a vivir.",
    10: "Leer para no olvidar. Pensar para no arrodillarse ante ese imperio que nos ve como su patio trasero.",
    11: "¡Que no pase el gigante! ¡Que los árboles se pongan en fila!",
}

# Chunks de karaoke por línea: (inicio, fin_exclusivo, {índices kw}).
# Índices de palabra dentro de la línea (0-based). Los kw van en rojo.
CHUNKS = {
    1: [(0, 4, {1}), (4, 8, {7}), (8, 11, {9}), (11, 14, {13})],
    2: [(0, 4, {0}), (4, 6, {5})],
    3: [(0, 5, {4}), (5, 10, {8})],
    4: [(0, 3, {2}), (3, 7, {6}), (7, 10, {7}), (10, 16, {13})],
    5: [(0, 5, {4}), (5, 9, {6}), (9, 13, {12}), (13, 17, {16}),
        (17, 23, {19})],
    6: [(0, 4, {1}), (4, 7, {6}), (7, 11, {9}), (11, 15, {12}),
        (15, 22, {21})],
    7: [(0, 5, {2}), (5, 10, {9}), (10, 14, {13}), (14, 16, {15}),
        (16, 19, {18}), (19, 23, {22})],
    8: [(0, 5, {4}), (5, 8, {7}), (8, 13, {12}), (13, 17, {16})],
    9: [(0, 4, {3}), (4, 8, {7}), (8, 12, {11})],
    10: [(0, 4, {3}), (4, 8, {7}), (8, 11, {10}), (11, 18, {16, 17})],
    11: [(0, 5, {4}), (5, 12, {7, 11})],
}

sys.path.insert(0, os.path.join(HUB, "repo/scripts/audio"))
from vo_build import edit_line_safe  # noqa: E402


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def load_mono_f32(path):
    out = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-vn", "-ac", "1",
         "-ar", str(SR), "-f", "f32le", "-"],
        capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype=np.float32)


def write_wav_s16(path, a):
    a16 = np.clip(np.round(a * 32767), -32768, 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(a16.tobytes())


def acoustic_bounds(x, thresh_db=-45.0):
    """Primer/último instante con energía SOSTENIDA por encima del umbral.

    Ventanas de 10 ms, RMS; exige 3 ventanas consecutivas por encima del
    umbral (30 ms) para no disparar por un clic aislado. Devuelve
    (onset, offset) en segundos o (None, None).
    """
    win = int(0.01 * SR)
    n = len(x) // win
    if n == 0:
        return None, None
    rms = np.sqrt(np.mean(
        x[:n * win].reshape(n, win).astype(np.float64) ** 2, axis=1))
    db = 20 * np.log10(np.maximum(rms, 1e-9))
    hot = db > thresh_db
    # 3 consecutivas
    sus = np.convolve(hot.astype(int), np.ones(3, dtype=int),
                      mode="valid") == 3
    idx = np.nonzero(sus)[0]
    if len(idx) == 0:
        return None, None
    return idx[0] * 0.01, (idx[-1] + 3) * 0.01


def ffmpeg_normalize(in_wav, out_wav):
    """highpass 70 Hz + loudnorm I=-18 (sin stretch en V4)."""
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", in_wav, "-af",
         "highpass=f=70,loudnorm=I=-18:TP=-2:LRA=9",
         "-ar", str(SR), "-ac", "1", out_wav],
        check=True)


def measure_loudness(path):
    r = subprocess.run(
        ["ffmpeg", "-v", "info", "-i", path, "-af",
         "loudnorm=I=-18:TP=-2:LRA=9:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True, check=True)
    txt = r.stderr
    js = txt[txt.index("{"):txt.rindex("}") + 1]
    d = json.loads(js)
    return float(d["input_i"]), float(d["input_tp"])


def align_words(n, asr_words):
    """Alinea las palabras ASR con las del guion V4.3.

    Devuelve [(texto_guion, s, e)] en coords del archivo original.
    Casos especiales: L1 («33» -> «treinta y tres»), L5 («Martín»,
    «leiguas»), L6 («Adeptio»), L9 («a» tragada, repuesta en el hueco),
    L10 («rodillarse», «no sube»).
    """
    script_words = SCRIPT[n].split()
    aw = [(w["w"].strip(), w["s"], w["e"]) for w in asr_words]
    out = []
    if n == 1:
        assert len(aw) == 12, f"L1: {len(aw)} palabras ASR"
        # «33» (índice 4) se reparte en treinta/y/tres: 42/16/42%.
        s33, e33 = aw[4][1], aw[4][2]
        d = e33 - s33
        splits = [(s33, s33 + 0.42 * d), (s33 + 0.42 * d, s33 + 0.58 * d),
                  (s33 + 0.58 * d, e33)]
        j = 0
        for i, sw in enumerate(script_words):
            if sw in ("treinta", "y", "tres"):
                s, e = splits[["treinta", "y", "tres"].index(sw)]
                out.append((sw, s, e))
            else:
                out.append((sw, aw[j][1], aw[j][2]))
                j += 1
            if sw == "en":
                j += 1  # saltar el «33» ASR tras consumir «en»
        return out
    if n == 9:
        # La «a» tras «condenado» no la oyó el ASR: se repone centrada
        # en el hueco acústico entre «condenado» y «volverla» (0,08 s).
        assert len(aw) == 11, f"L9: {len(aw)} palabras ASR"
        j = 0
        for sw in script_words:
            if sw == "a" and j < len(aw) and aw[j][0].lower() != "a":
                s0, e0 = aw[j - 1][2], aw[j][1]
                mid = (s0 + e0) / 2
                out.append(("a", mid - 0.04, mid + 0.04))
            else:
                out.append((sw, aw[j][1], aw[j][2]))
                j += 1
        return out
    assert len(aw) == len(script_words), (
        f"L{n}: {len(aw)} palabras ASR != {len(script_words)} del guion")
    return [(sw, aw[i][1], aw[i][2]) for i, sw in enumerate(script_words)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()
    os.makedirs(LINES_DIR, exist_ok=True)

    trans = json.load(open(os.path.join(VO43, "vo-real-transcripts-v43.json")))
    assert set(SCRIPT) == set(range(1, 12))
    spec_a = importlib.util.spec_from_file_location(
        "audit", os.path.join(HUB, "repo/scripts/audio/audit-audio.py"))
    audit = importlib.util.module_from_spec(spec_a)
    spec_a.loader.exec_module(audit)

    # ---- 1. recorte por línea ----
    lines = []  # dicts con file/head/tail/words/start/out_dur...
    results = []
    for n in range(1, 12):
        fn = f"{n:02d}.wav"
        src = os.path.join(VO43, "wav", fn)
        x = load_mono_f32(src)
        tr = trans[fn]
        words = align_words(n, tr["words"])
        ss, se = tr["speech_span"]
        onset, offset = acoustic_bounds(x)
        # Cabeza/cola: el borde acústico manda sobre Whisper (sin tope:
        # recortar voz real es FAIL de auditoría; conservar tono de sala
        # extra solo alarga la línea unos ms). La L2 lo demostró: Whisper
        # cierra «1891.» en 3,88 s pero la voz decae hasta ~4,30 s.
        head = ss - HANDLE
        if onset is not None:
            head = min(head, onset - 0.03)
        head = max(head, 0.0)
        tail = se + HANDLE
        if offset is not None:
            tail = max(tail, offset + 0.03)
        tail = min(tail, len(x) / SR)
        # Corrección de bordes de la primera/última palabra: si el borde
        # acústico difiere >0,08 s de Whisper y la zona es voz armónica,
        # la palabra se extiende hasta el borde acústico (la predicción
        # es la referencia acústica de la auditoría, como en V3).
        w0, s0, e0 = words[0]
        if onset is not None and onset < s0 - 0.08:
            h = audit.harmonicity(x, SR, onset, s0)
            if h > 0.4:
                words[0] = (w0, round(onset, 2), e0)
                print(f"L{n}: inicio «{w0}» corregido {s0:.2f} -> "
                      f"{onset:.2f} (armónico {h:.2f})")
        wL, sL, eL = words[-1]
        if offset is not None and offset > eL + 0.08:
            h = audit.harmonicity(x, SR, eL, offset)
            if h > 0.4:
                words[-1] = (wL, sL, round(offset, 2))
                print(f"L{n}: fin «{wL}» corregido {eL:.2f} -> "
                      f"{offset:.2f} (armónico {h:.2f})")
        assert head <= words[0][1] and words[-1][2] <= tail, (
            f"L{n}: palabra fuera de [head, tail]")
        edited, segs, safe_report = edit_line_safe(
            x, SR, head, tail, [], words=None)
        kept_dur = segs[-1][3] if segs else 0.0
        for w in safe_report["warnings"]:
            print(f"L{n}: AVISO vo_build: {w}")
        tmp = os.path.join(LINES_DIR, f"_tmp_L{n}.wav")
        write_wav_s16(tmp, edited)
        out_wav = os.path.join(LINES_DIR, f"L{n}.wav")
        ffmpeg_normalize(tmp, out_wav)
        os.remove(tmp)
        y = load_mono_f32(out_wav)
        out_dur = len(y) / SR
        lufs, tp = measure_loudness(out_wav)
        peak = float(np.abs(y).max())
        lines.append({"linea": n, "file": fn, "head": head, "tail": tail,
                      "words": words, "segs": segs, "src_dur": len(x) / SR,
                      "speech_span": [ss, se]})
        results.append({"linea": n, "wav": out_wav, "kept_dur": kept_dur,
                        "out_dur": out_dur, "lufs": lufs, "true_peak": tp,
                        "peak_lin": peak, "sha256": sha256(out_wav)})
        print(f"L{n}: [{head:.2f}-{tail:.2f}] kept {kept_dur:.3f}s -> "
              f"out {out_dur:.3f}s LUFS {lufs:.1f} TP {tp:.1f}")

    # ---- 2. slots en la línea de tiempo ----
    start = LEAD
    for ln, res in zip(lines, results):
        ln["start"] = round(start, 3)
        start += res["out_dur"] + (GAPS[ln["linea"] - 1]
                                   if ln["linea"] <= 10 else 0.0)
    vo_end = lines[-1]["start"] + results[-1]["out_dur"]
    video_dur = vo_end + TAIL_VIDEO
    total_frames = int(math.ceil(video_dur * 30))
    video_dur = total_frames / 30.0
    print(f"\nVO: {LEAD:.2f}s -> {vo_end:.2f}s "
          f"(habla {sum(r['out_dur'] for r in results):.2f}s + "
          f"pausas {sum(GAPS):.2f}s)")
    print(f"Video: {video_dur:.2f}s = {total_frames} frames @30fps")

    # ---- 3. ensamblaje: VO editada + VO cruda ----
    canvas_dur = vo_end + 0.10
    canvas = np.zeros(int(math.ceil(canvas_dur * SR)), dtype=np.float32)
    raw_parts, raw_offsets = [], {}
    raw_pos = 0
    for ln, res in zip(lines, results):
        y = load_mono_f32(res["wav"])
        i0 = int(round(ln["start"] * SR))
        canvas[i0:i0 + len(y)] = y
        xr = load_mono_f32(os.path.join(VO43, "wav", ln["file"]))
        raw_offsets[ln["linea"]] = raw_pos / SR
        raw_parts.append(xr)
        raw_pos += len(xr)
    raw_canvas = np.concatenate(raw_parts)
    vo_path = os.path.join(V4, "vo-real-v4.wav")
    raw_path = os.path.join(V4, "vo-real-v4-raw.wav")
    write_wav_s16(vo_path, canvas)
    write_wav_s16(raw_path, raw_canvas)
    vo_peak = float(np.abs(canvas).max())
    print(f"VO editada: {vo_path} ({len(canvas) / SR:.2f}s, pico {vo_peak:.3f})")
    print(f"VO cruda:   {raw_path} ({len(raw_canvas) / SR:.2f}s)")

    # ---- 4. tiempos finales por palabra ----
    def map_time(t, ln):
        return ln["start"] + (t - ln["head"])

    final_words, orig_words = {}, {}
    vo_lines_out = []
    for ln, res in zip(lines, results):
        n = ln["linea"]
        fw = [(w, map_time(s, ln), map_time(e, ln))
              for w, s, e in ln["words"]]
        ow = [(w, raw_offsets[n] + s, raw_offsets[n] + e)
              for w, s, e in ln["words"]]
        final_words[n] = fw
        orig_words[n] = ow
        vo_lines_out.append({
            "index": n - 1, "text": SCRIPT[n],
            "start": round(ln["start"], 3),
            "end": round(ln["start"] + res["out_dur"], 3),
            "duration": round(res["out_dur"], 3),
        })
    vo_lines = {"sample_rate": SR, "voice": "real-locutora-adriana",
                "speed": 1.0, "peak": round(vo_peak, 4),
                "total_duration": round(len(canvas) / SR, 3),
                "lines": vo_lines_out}
    json.dump(vo_lines, open(os.path.join(V4, "vo-lines.json"), "w"),
              ensure_ascii=False, indent=1)

    # ---- 5. captions.json (HubCaption[]) + captions.ts ----
    caps = []
    first = True
    for n in range(1, 12):
        fw = final_words[n]
        chunk_end = {c[1] - 1 for c in CHUNKS[n]}
        kw_idx = {k for c in CHUNKS[n] for k in c[2]}
        for i, (w, s, e) in enumerate(fw):
            txt = w.upper() if first else " " + w.upper()
            first = False
            cap = {"text": txt, "startMs": int(round(s * 1000)),
                   "endMs": int(round(e * 1000)),
                   "timestampMs": int(round(s * 1000)),
                   "confidence": None}
            if i in kw_idx:
                cap["kw"] = True
            if i in chunk_end:
                cap["pageBreakAfter"] = True
            caps.append(cap)
    json.dump(caps, open(os.path.join(V4, "captions.json"), "w"),
              ensure_ascii=False, indent=1)

    seg_strs = []
    for n in range(1, 12):
        fw = final_words[n]
        dur = results[n - 1]["out_dur"]
        frames = int(math.floor(dur * 30 + 0.5))
        chunk_strs = []
        for c0, c1, kws in CHUNKS[n]:
            words = fw[c0:c1]
            w_strs = [f'{{"t": "{w.upper()}", "s": {s:.3f}, '
                      f'"e": {e:.3f}, "kw": '
                      f'{"true" if (c0 + j) in kws else "false"}}}'
                      for j, (w, s, e) in enumerate(words)]
            chunk_strs.append(
                f'{{"start": {words[0][1]:.3f}, '
                f'"end": {words[-1][2]:.3f}, '
                f'"words": [{", ".join(w_strs)}]}}')
        seg_strs.append(
            f'{{"id": {n}, "start": {lines[n - 1]["start"]:.3f}, '
            f'"frames": {frames}, "chunks": [{", ".join(chunk_strs)}]}}')
    ts = ("// Auto-generated by build-vo-real-v4.py (V4, voz real Adriana). "
          "Do not edit by hand.\n"
          "// Texto = guion V4.3; tiempos = faster-whisper alineados al "
          "guion (ver vo-real-manifest-v4.json).\n"
          "export type CapWord = {t: string; s: number; e: number; "
          "kw: boolean};\n"
          "export type CapChunk = {start: number; end: number; "
          "words: CapWord[]};\n"
          "export type CapSegment = {id: number; start: number; "
          "frames: number; chunks: CapChunk[]};\n"
          "export const CAPTIONS: CapSegment[] = ["
          + ", ".join(seg_strs) + "];\n")
    open(os.path.join(V4, "captions.ts"), "w").write(ts)
    open(os.path.join(PROJ, "src/captions-v4.ts"), "w").write(ts)

    # ---- 6. transcripciones orig / editada ----
    def segs_json(words_by_line):
        return [{"words": [{"w": w.upper(), "s": round(s, 3),
                            "e": round(e, 3)}
                           for w, s, e in words_by_line[n]]}
                for n in range(1, 12)]
    json.dump(segs_json(orig_words),
              open(os.path.join(V4, "vo-real-transcripcion-orig.json"), "w"),
              ensure_ascii=False, indent=1)
    json.dump(segs_json(final_words),
              open(os.path.join(V4, "vo-real-transcripcion-editada.json"), "w"),
              ensure_ascii=False, indent=1)

    # ---- 7. predicción + edit-plan ----
    palabras = [{"w": w.upper(), "s": round(s, 3), "e": round(e, 3)}
                for n in range(1, 12) for w, s, e in final_words[n]]
    tabla = [{"linea": ln["linea"], "slot": ln["start"],
              "original_s": round(ln["tail"] - ln["head"], 3),
              "editada_s": round(res["out_dur"], 3),
              "factor_v2": 1.0, "inicio_video": ln["start"],
              "fin_video": round(ln["start"] + res["out_dur"], 3),
              "fin_segmento_video": round(ln["start"] + res["out_dur"], 3),
              "fusiones": []}
             for ln, res in zip(lines, results)]
    json.dump({"version": "V4 (voz real Adriana, guion V4.3)",
               "tabla": tabla, "palabras": palabras},
              open(os.path.join(RES, "vo-real-prediccion-v4.json"), "w"),
              ensure_ascii=False, indent=1)

    plan_lines = []
    for ln, res in zip(lines, results):
        n = ln["linea"]
        ro = raw_offsets[n]
        segs_out = []
        for (a, b, _es, _ee) in ln["segs"]:
            es = map_time(a, ln)
            ee = map_time(b, ln)
            ws_in = [(w, s, e) for w, s, e in ln["words"]
                     if s >= a - 1e-9 and e <= b + 1e-9]
            ows = ro + (ws_in[0][1] if ws_in else a)
            owe = ro + (ws_in[-1][2] if ws_in else b)
            segs_out.append({
                "orig_start": round(ro + a, 3),
                "orig_end": round(ro + b, 3),
                "orig_word_start": round(ows, 3),
                "orig_word_end": round(owe, 3),
                "edited_start": round(es, 3),
                "edited_end": round(ee, 3),
                "head_keep": round(ows - (ro + a), 3),
                "tail_keep": round((ro + b) - owe, 3),
                "merged_subphrases": None,
            })
        merged = []
        ws = ln["words"]
        for i in range(len(ws) - 1):
            g0 = map_time(ws[i][2], ln)
            g1 = map_time(ws[i + 1][1], ln)
            if g1 - g0 >= 0.20:
                merged.append([round(g0, 3), round(g1, 3)])
        plan_lines.append({
            "linea": n, "slot": ln["start"], "factor_uniforme": 1.0,
            "gaps": [], "segs": segs_out, "merged_gaps": merged,
        })
    json.dump({"version": "V4 (voz real Adriana, guion V4.3)",
               "total": round(len(canvas) / SR, 3),
               "pad": 0.03, "fade": FADE_S, "lines": plan_lines},
              open(os.path.join(RES, "edit-plan-v4.json"), "w"),
              ensure_ascii=False, indent=1)

    # ---- 8. manifiesto + anclas SFX + TIMELINE ----
    manifest = {
        "version": "V4",
        "voice": "Adriana (real, 11 líneas .aac)",
        "video": {"duration_s": video_dur, "frames": total_frames,
                  "fps": 30, "width": 1080, "height": 1920},
        "vo": {"lead_s": LEAD, "gaps_s": GAPS, "end_s": round(vo_end, 3),
               "path": vo_path, "raw_path": raw_path,
               "sha256": sha256(vo_path), "peak": round(vo_peak, 4)},
        "lines": [{
            "linea": ln["linea"], "file": ln["file"],
            "text": SCRIPT[ln["linea"]],
            "head": round(ln["head"], 3), "tail": round(ln["tail"], 3),
            "speech_span": ln["speech_span"],
            "start": ln["start"],
            "end": round(ln["start"] + res["out_dur"], 3),
            "out_dur": round(res["out_dur"], 3),
            "lufs": round(res["lufs"], 1),
            "true_peak": round(res["true_peak"], 1),
            "sha256": res["sha256"],
            "words": [[w, round(s, 3), round(e, 3)]
                      for w, s, e in ln["words"]],
        } for ln, res in zip(lines, results)],
    }
    json.dump(manifest, open(MANIFEST, "w"), ensure_ascii=False, indent=1)

    anchors = {}
    for n in range(1, 12):
        for w, s, e in final_words[n]:
            key = w.upper()
            anchors.setdefault(key, []).append(
                {"linea": n, "s": round(s, 3), "e": round(e, 3)})
    json.dump(anchors,
              open(os.path.join(V4, "sfx-anchors-v4.json"), "w"),
              ensure_ascii=False, indent=1)

    tl = ["# TIMELINE V4 — Martí-Fidel (voz real Adriana, guion V4.3)",
          "",
          f"Video: {video_dur:.2f} s = {total_frames} frames @30fps, "
          f"1080×1920. VO: {LEAD:.2f}–{vo_end:.2f} s. "
          f"Cola tras VO: {video_dur - vo_end:.2f} s.",
          "",
          "| L | Escena | Slot VO (s) | Habla (s) | Pausa tras (s) |",
          "|---|--------|-------------|-----------|----------------|"]
    scenes = ["S1 gancho mapa", "S2 1891", "S3 cita recuento",
              "S4 evidencia Browne", "S5 árboles", "S6 gigante",
              "S7 Fidel 2005", "S8 medios/interrupt", "S9 tesis",
              "S10 leer/pensar", "S11 grito + logo"]
    for ln, res in zip(lines, results):
        n = ln["linea"]
        gap = GAPS[n - 1] if n <= 10 else None
        tl.append(f"| L{n} | {scenes[n - 1]} | "
                  f"{ln['start']:.2f}–{ln['start'] + res['out_dur']:.2f} | "
                  f"{res['out_dur']:.2f} | "
                  f"{gap if gap is not None else '— (fin)'} |")
    tl += ["",
           "Pausas intra-línea naturales (NO tocar, ya conservadas):"]
    for n in range(1, 12):
        ws = lines[n - 1]["words"]
        for i in range(len(ws) - 1):
            g = ws[i + 1][1] - ws[i][2]
            if g >= 0.25:
                tl.append(f"- L{n}: «{ws[i][0]}» → «{ws[i + 1][0]}»: "
                          f"{g:.2f} s")
    tl += ["",
           "Palabras clave (kw, rojo) por línea: ver CHUNKS en "
           "build-vo-real-v4.py y captions-v4.ts.",
           "",
           "Escenas (estrategia V4): cada línea = una escena; la escena "
           "empieza en el slot de la línea (con disolución de 12 f desde "
           "la anterior, salvo el corte duro S7→S8) y se extiende hasta "
           "el slot de la siguiente línea. S11 se extiende hasta el fin "
           "del video (cola de logo + CTA)."]
    open(os.path.join(RES, "TIMELINE-V4.md"), "w").write("\n".join(tl) + "\n")

    # ---- 9. validación ----
    errors, warnings = [], []
    for ln, res in zip(lines, results):
        if abs(res["lufs"] - (-18.0)) > 1.5:
            warnings.append(f"L{ln['linea']}: LUFS {res['lufs']:.1f} "
                            f"(objetivo -18)")
        if res["true_peak"] > -1.5:
            warnings.append(f"L{ln['linea']}: TP {res['true_peak']:.1f}")
        if res["peak_lin"] >= 0.999:
            errors.append(f"L{ln['linea']}: clipping (pico 1.0)")
    ends = [(ln["start"], ln["start"] + res["out_dur"])
            for ln, res in zip(lines, results)]
    for i in range(10):
        gap = ends[i + 1][0] - ends[i][1]
        if gap < 0.15:
            errors.append(f"hueco L{i + 1}->L{i + 2} demasiado corto: "
                          f"{gap:.2f}s")
    starts = [c["startMs"] for c in caps]
    if starts != sorted(starts):
        errors.append("captions no monótonos")
    total_words = sum(len(SCRIPT[n].split()) for n in range(1, 12))
    if len(caps) != total_words:
        errors.append(f"captions: {len(caps)} palabras, se esperaban "
                      f"{total_words}")
    # Puntos de corte: criterio de la auditoría (c) sobre la VO cruda.
    raw = audit.load_audio(raw_path, sr=SR, mono=True)
    for ln in lines:
        n = ln["linea"]
        ro = raw_offsets[n]
        for label, t0, t1 in (
                ("inicio", ro + ln["head"] - 0.05, ro + ln["head"]),
                ("fin", ro + ln["tail"], ro + ln["tail"] + 0.05)):
            r = audit.energy_db(raw, SR, max(0.0, t0), t1)
            h = audit.harmonicity(raw, SR, max(0.0, t0), t1)
            if r > -45.0 and h > 0.4:
                errors.append(
                    f"L{n} corte {label} @ {t0 + 0.05:.2f}s: VOZ "
                    f"descartada (RMS {r:.1f}, harm {h:.2f})")
            elif r > -45.0:
                warnings.append(
                    f"L{n} corte {label}: respiro/ruido descartado "
                    f"(RMS {r:.1f}, harm {h:.2f})")
    report = {
        "lines": [{k: (round(v, 4) if isinstance(v, float) else v)
                   for k, v in res.items()}
                  for res in results],
        "vo_real": {"path": vo_path, "dur_s": round(len(canvas) / SR, 3),
                    "peak": round(vo_peak, 4), "sha256": sha256(vo_path)},
        "video": {"duration_s": video_dur, "frames": total_frames},
        "errors": errors, "warnings": warnings,
    }
    json.dump(report, open(os.path.join(V4, "build-report-v4.json"), "w"),
              ensure_ascii=False, indent=1)
    print(f"\nValidación: {len(errors)} errores, {len(warnings)} avisos")
    for w in warnings:
        print(f"  AVISO: {w}")
    for e in errors:
        print(f"  ERROR: {e}")
    if errors:
        print("BUILD CON ERRORES — revisar antes de mezclar/renderizar")
        return 1
    print("OK — listo para mezclar y renderizar")
    return 0


if __name__ == "__main__":
    sys.exit(main())
