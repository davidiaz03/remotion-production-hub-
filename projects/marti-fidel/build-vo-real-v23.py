#!/usr/bin/env python3
"""Construye la VO real del reel marti-fidel V2.3 (locutora, 9 líneas).

Flujo:
  1. Limpia cada línea (recorte cabeza/cola + cortes internos en pausas,
     downmix a mono, highpass 70 Hz, loudnorm I=-18 TP=-2 LRA=9, atempo
     donde el manifiesto lo pide) -> public/audio/real23/lines/L{N}.wav
  2. Ensambla la VO editada (líneas en los inicios V2, silencio digital
     entre ellas) -> public/audio/real23/vo-real.wav
  3. Ensambla la VO cruda (los 9 archivos originales CONCATENADOS en
     orden, sin solapes) -> public/audio/real23/vo-real-raw.wav
     (referencia para la auditoría, check (c): las coordenadas
     originales del edit-plan son posiciones en esta concatenación)
  4. Emite vo-lines.json, captions.json, captions.ts (public/audio/real23/
     y src/captions-real23.ts), transcripciones orig/editada, predicción,
     edit-plan, mix-v2.3.sh y el informe de deriva de sincronía
     vídeo<->voz (los reveals de texto del vídeo son fijos; la voz real
     tiene otro ritmo que la previsualización Kokoro).

Los tiempos de palabra vienen del manifiesto (Whisper corregido por
sobre acústico, texto del GUION — ver vo-real-manifest-v23.json). El vídeo
NO se re-temporiza: el audio se edita para encajar en el montaje.

Uso:
  python3 build-vo-real-v23.py [--force]
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
HUB = os.path.expanduser("~/workspace/remotion-hub")
PROJ = os.path.join(HUB, "repo/projects/marti-fidel")
RES = os.path.join(HUB, "projects/marti-fidel/research")
REAL = os.path.join(PROJ, "public/audio/real23")
LINES_DIR = os.path.join(REAL, "lines")
MANIFEST = os.path.join(PROJ, "vo-real-manifest-v23.json")
SCRIPT_JSON = os.path.join(PROJ, "vo-captions-v2.json")
V2_CAPTIONS = os.path.join(PROJ, "public/audio/v2/captions.json")
MIX_V2_SH = os.path.join(PROJ, "mix-v2.sh")

# Eventos visuales fijos del vídeo (reveal de texto) vs palabra que los
# dispara en el diseño V2. Tiempos en segundos (fotograma / 30).
VIDEO_EVENTS = [
    ("S2 l2 (2ª línea cita)", 5.23, 2, "y"),
    ("S5 tarjeta Browne", 20.43, 5, "Washington"),
    ("S6 l1 (¡LOS ÁRBOLES)", 25.03, 6, "¡los"),
    ("S6 l2 (DE PONER EN FILA)", 26.53, 6, "de"),
    ("S6 l3 (EL GIGANTE…)", 28.03, 6, "gigante"),
    ("S7 chip ADVIRTIÓ", 31.90, 7, "advirtió:"),
    ("S7 tarjeta Fidel", 32.23, 7, "No"),
    ("S7 l1 (NO ES LO MISMO)", 32.43, 7, "No"),
    ("S7 l2 (ESTAR DESINFORMADO)", 33.60, 7, "estar"),
    ("S7 l3 (HABER PERDIDO)", 34.77, 7, "haber"),
    ("S7 l4 (CAPACIDAD DE PENSAR)", 35.93, 7, "capacidad"),
    ("S8 l1 (CUANDO UN PUEBLO…)", 38.10, 8, "Cuando"),
    ("S8 l2 (SU HISTORIA…)", 39.00, 8, "su"),
    ("S8 l3 (ESTÁ CONDENADO)", 40.17, 8, "está"),
    ("S8 l4 (A VOLVERLA A VIVIR)", 41.33, 8, "volverla"),
    ("S8 título LEER", 43.07, 9, "Leer."),
    ("S8 título PENSAR", 43.37, 9, "Pensar."),
]

# SFX que siguen a palabras (los demás siguen a eventos de vídeo fijos).
MOVING_SFX = [
    ("booms-and-bass/boom-hit-soft.wav", 6, "gigante"),
    ("booms-and-bass/boom-hit-soft.wav", 7, "pensar."),
    ("pops/pop-medium-in.wav", 8, "condenado"),
    ("pops/pop-medium-in.wav", 9, "Leer."),
    ("booms-and-bass/boom-hit-soft.wav", 9, "Pensar."),
]


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def load_mono_f32(path):
    """Decodifica a float32 mono 48 kHz con ffmpeg."""
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


def fade_edges(a, fade_n):
    """Fundido de entrada/salida de medio coseno (evita clics)."""
    n = len(a)
    if n < 2 * fade_n:
        return a
    ramp = 0.5 - 0.5 * np.cos(np.pi * np.arange(fade_n) / fade_n)
    a = a.copy()
    a[:fade_n] *= ramp
    a[-fade_n:] *= ramp[::-1]
    return a


def edit_line(x, head, tail, cuts):
    """Recorta cabeza/cola y los intervalos de `cuts` (en segundos).

    Devuelve (audio editado, segmentos [(orig_ini, orig_fin,
    edit_ini, edit_fin)] en segundos, dur_total_original_kept).
    """
    bounds = [head] + [c for cut in cuts for c in cut] + [tail]
    segs = []
    out = []
    pos = 0.0
    fade_n = int(FADE_S * SR)
    for i in range(0, len(bounds), 2):
        a, b = bounds[i], bounds[i + 1]
        i0, i1 = int(round(a * SR)), int(round(b * SR))
        seg = fade_edges(x[i0:i1], fade_n)
        out.append(seg)
        dur = (i1 - i0) / SR
        segs.append((a, b, pos, pos + dur))
        pos += dur
    return np.concatenate(out), segs, pos


def ffmpeg_normalize(in_wav, out_wav, stretch):
    """atempo (si stretch != 1) + highpass 70 Hz + loudnorm I=-18."""
    filters = []
    if abs(stretch - 1.0) > 1e-9:
        filters.append(f"atempo={stretch}")
    filters.append("highpass=f=70")
    filters.append("loudnorm=I=-18:TP=-2:LRA=9")
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", in_wav, "-af",
         ",".join(filters), "-ar", str(SR), "-ac", "1", out_wav],
        check=True)


def measure_loudness(path):
    """Integrated LUFS y true peak medidos con loudnorm (modo medida)."""
    r = subprocess.run(
        ["ffmpeg", "-v", "info", "-i", path, "-af",
         "loudnorm=I=-18:TP=-2:LRA=9:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True, check=True)
    txt = r.stderr
    js = txt[txt.index("{"):txt.rindex("}") + 1]
    d = json.loads(js)
    return float(d["input_i"]), float(d["input_tp"])


def map_time(t, head, cuts, eff_stretch, start):
    """Coordenadas de archivo -> línea de tiempo final."""
    removed = sum(max(0.0, min(t, c1) - c0) for c0, c1 in cuts
                  if t > c0)
    return start + (t - head - removed) / eff_stretch


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()
    os.makedirs(LINES_DIR, exist_ok=True)
    os.makedirs(os.path.join(RES), exist_ok=True)

    manifest = json.load(open(MANIFEST))
    script = json.load(open(SCRIPT_JSON))
    v2_caps = json.load(open(V2_CAPTIONS))

    lines = manifest["lines"]
    assert len(lines) == 9, "el manifiesto debe tener 9 líneas"
    # Validación: las palabras del manifiesto = palabras del guion.
    for ln, frag in zip(lines, script["fragments"]):
        mw = [w for w, _s, _e in ln["words"]]
        assert mw == frag["words"], (
            f"L{ln['linea']}: palabras del manifiesto != guion:\n"
            f"  manifiesto: {mw}\n  guion:      {frag['words']}")

    results = []  # por línea: dict con duraciones, factores, paths
    total_dur = 0.0
    for ln in lines:
        n = ln["linea"]
        src = os.path.join(RES, ln["file"])
        x = load_mono_f32(src)
        # Ninguna palabra puede solaparse con un corte.
        for w, s, e in ln["words"]:
            for c0, c1 in ln["cuts"]:
                assert not (s < c1 and e > c0), (
                    f"L{n}: la palabra {w!r} ({s}-{e}) solapa el corte "
                    f"[{c0}, {c1}]")
            assert ln["head"] <= s and e <= ln["tail"], (
                f"L{n}: la palabra {w!r} fuera de [head, tail]")
        edited, segs, kept_dur = edit_line(
            x, ln["head"], ln["tail"], ln["cuts"])
        tmp = os.path.join(LINES_DIR, f"_tmp_L{n}.wav")
        write_wav_s16(tmp, edited)
        out_wav = os.path.join(LINES_DIR, f"L{n}.wav")
        ffmpeg_normalize(tmp, out_wav, ln["stretch"])
        os.remove(tmp)
        # Duración real tras atempo (el factor efectivo puede diferir
        # ~ms del nominal; las captions usan el efectivo).
        y = load_mono_f32(out_wav)
        out_dur = len(y) / SR
        eff = kept_dur / out_dur if out_dur > 0 else 1.0
        lufs, tp = measure_loudness(out_wav)
        peak = float(np.abs(y).max())
        results.append({
            "linea": n, "wav": out_wav, "segs": segs,
            "kept_dur": kept_dur, "out_dur": out_dur,
            "stretch_nominal": ln["stretch"], "stretch_efectivo": eff,
            "lufs": lufs, "true_peak": tp, "peak_lin": peak,
            "sha256": sha256(out_wav),
        })
        total_dur = max(total_dur, ln["start"] + out_dur)
        print(f"L{n}: kept {kept_dur:.3f}s -> out {out_dur:.3f}s "
              f"(stretch ef. {eff:.4f}) LUFS {lufs:.1f} TP {tp:.1f}")

    # ---- ensamblaje: VO editada + VO cruda ----
    # La VO cruda es la CONCATENACIÓN de los 9 archivos originales (la
    # voz tal como se grabó, sin solapes): si se colocaran en los slots,
    # las colas/cabezas con tono de sala se solaparían y la auditoría
    # (c) mediría la voz de la línea vecina en los puntos de corte.
    canvas_dur = total_dur + 0.10
    canvas = np.zeros(int(math.ceil(canvas_dur * SR)), dtype=np.float32)
    raw_parts = []
    raw_offsets = {}  # línea -> offset en la concatenación cruda
    raw_pos = 0
    for ln, res in zip(lines, results):
        y = load_mono_f32(res["wav"])
        i0 = int(round(ln["start"] * SR))
        canvas[i0:i0 + len(y)] = y
        xr = load_mono_f32(os.path.join(RES, ln["file"]))
        raw_offsets[ln["linea"]] = raw_pos / SR
        raw_parts.append(xr)
        raw_pos += len(xr)
    raw_canvas = np.concatenate(raw_parts)
    vo_path = os.path.join(REAL, "vo-real.wav")
    raw_path = os.path.join(REAL, "vo-real-raw.wav")
    write_wav_s16(vo_path, canvas)
    write_wav_s16(raw_path, raw_canvas)
    vo_peak = float(np.abs(canvas).max())
    print(f"VO editada: {vo_path} ({len(canvas) / SR:.2f}s, "
          f"pico {vo_peak:.3f})")
    print(f"VO cruda:   {raw_path} ({len(raw_canvas) / SR:.2f}s, "
          f"concatenación sin solapes)")

    # ---- tiempos finales por palabra ----
    # final_words[n] = [(texto, s_final, e_final)], orig_words[n] =
    # [(texto, s_orig, e_orig)] en coordenadas del ensamblaje crudo.
    final_words, orig_words = {}, {}
    vo_lines_out = []
    for ln, res in zip(lines, results):
        n = ln["linea"]
        eff = res["stretch_efectivo"]
        fw, ow = [], []
        for w, s, e in ln["words"]:
            fw.append((w, map_time(s, ln["head"], ln["cuts"], eff,
                                   ln["start"]),
                       map_time(e, ln["head"], ln["cuts"], eff,
                                ln["start"])))
            ow.append((w, raw_offsets[n] + s, raw_offsets[n] + e))
        final_words[n] = fw
        orig_words[n] = ow
        vo_lines_out.append({
            "index": n - 1,
            "text": " ".join(w for w, _s, _e in ln["words"]),
            "start": round(ln["start"], 3),
            "end": round(ln["start"] + res["out_dur"], 3),
            "duration": round(res["out_dur"], 3),
        })
    # El texto de vo-lines debe ser el guion exacto (con puntuación y
    # mayúsculas originales): se toma del vo-lines V2.
    v2_lines = json.load(open(
        os.path.join(PROJ, "public/audio/v2/vo-lines.json")))["lines"]
    for i, vl in enumerate(v2_lines):
        vo_lines_out[i]["text"] = vl["text"]

    vo_lines = {
        "sample_rate": SR,
        "voice": "real-locutora",
        "speed": 1.0,
        "peak": round(vo_peak, 4),
        "total_duration": round(len(canvas) / SR, 3),
        "lines": vo_lines_out,
    }
    json.dump(vo_lines, open(os.path.join(REAL, "vo-lines.json"), "w"),
              ensure_ascii=False, indent=1)

    # ---- captions.json (HubCaption[]) + captions.ts ----
    caps = []
    first = True
    for ln, frag in zip(lines, script["fragments"]):
        n = ln["linea"]
        fw = final_words[n]
        # chunk final -> pageBreakAfter; kw por índices del guion.
        chunk_end = {c[1] - 1 for c in frag["chunks"]}
        kw_idx = {k for c in frag["chunks"] for k in c[2]}
        for i, (w, s, e) in enumerate(fw):
            txt = w.upper()
            if not first:
                txt = " " + txt
            first = False
            cap = {
                "text": txt,
                "startMs": int(round(s * 1000)),
                "endMs": int(round(e * 1000)),
                "timestampMs": int(round(s * 1000)),
                "confidence": None,
            }
            if i in kw_idx:
                cap["kw"] = True
            if i in chunk_end:
                cap["pageBreakAfter"] = True
            caps.append(cap)
    json.dump(caps, open(os.path.join(REAL, "captions.json"), "w"),
              ensure_ascii=False, indent=1)

    # captions.ts (formato CapSegment de Pilar V30 / V2).
    seg_strs = []
    for ln, frag in zip(lines, script["fragments"]):
        n = ln["linea"]
        fw = final_words[n]
        dur = results[n - 1]["out_dur"]
        frames = int(math.floor(dur * 30 + 0.5))
        chunk_strs = []
        for c0, c1, kws in frag["chunks"]:
            words = fw[c0:c1]
            w_strs = []
            for j, (w, s, e) in enumerate(words):
                kw = "true" if (c0 + j) in kws else "false"
                w_strs.append(
                    f'{{"t": "{w.upper()}", "s": {s:.3f}, '
                    f'"e": {e:.3f}, "kw": {kw}}}')
            chunk_strs.append(
                f'{{"start": {words[0][1]:.3f}, '
                f'"end": {words[-1][2]:.3f}, '
                f'"words": [{", ".join(w_strs)}]}}')
        seg_strs.append(
            f'{{"id": {n}, "start": {ln["start"]:.3f}, '
            f'"frames": {frames}, "chunks": [{", ".join(chunk_strs)}]}}')
    ts = ("// Auto-generated by build-vo-real-v23.py (V2.3, voz real). "
          "Do not edit by hand.\n"
          "// Texto = guion; tiempos = faster-whisper corregidos por "
          "sobre acústico (ver vo-real-manifest-v23.json).\n"
          "export type CapWord = {t: string; s: number; e: number; "
          "kw: boolean};\n"
          "export type CapChunk = {start: number; end: number; "
          "words: CapWord[]};\n"
          "export type CapSegment = {id: number; start: number; "
          "frames: number; chunks: CapChunk[]};\n"
          "export const CAPTIONS: CapSegment[] = ["
          + ", ".join(seg_strs) + "];\n")
    open(os.path.join(REAL, "captions.ts"), "w").write(ts)
    open(os.path.join(PROJ, "src/captions-real23.ts"), "w").write(ts)

    # ---- transcripciones orig / editada (formato audit-audio) ----
    def segs_json(words_by_line):
        return [{"words": [{"w": w.upper(), "s": round(s, 3),
                            "e": round(e, 3)}
                           for w, s, e in words_by_line[n]]}
                for n in range(1, 10)]
    json.dump(segs_json(orig_words),
              open(os.path.join(REAL, "vo-real-transcripcion-orig.json"),
                   "w"), ensure_ascii=False, indent=1)
    json.dump(segs_json(final_words),
              open(os.path.join(
                  REAL, "vo-real-transcripcion-editada.json"), "w"),
              ensure_ascii=False, indent=1)

    # ---- predicción + edit-plan (research/, como en V2) ----
    palabras = [{"w": w.upper(), "s": round(s, 3), "e": round(e, 3)}
                for n in range(1, 10) for w, s, e in final_words[n]]
    tabla = []
    for ln, res in zip(lines, results):
        n = ln["linea"]
        tabla.append({
            "linea": n, "slot": ln["start"],
            "original_s": round(ln["tail"] - ln["head"], 3),
            "editada_s": round(res["out_dur"], 3),
            "factor_v2": ln["stretch"],
            "inicio_video": ln["start"],
            "fin_video": round(ln["start"] + res["out_dur"], 3),
            "fin_segmento_video": round(ln["start"] + res["out_dur"], 3),
            "fusiones": [],
        })
    json.dump({"version": "V2.3 (voz real, cortes en pausas + atempo)",
               "tabla": tabla, "palabras": palabras},
              open(os.path.join(RES, "vo-real-prediccion-v2.3.json"), "w"),
              ensure_ascii=False, indent=1)

    plan_lines = []
    for ln, res in zip(lines, results):
        n = ln["linea"]
        eff = res["stretch_efectivo"]
        segs_out = []
        for (a, b, _es, _ee) in res["segs"]:
            es = map_time(a, ln["head"], ln["cuts"], eff, ln["start"])
            ee = map_time(b, ln["head"], ln["cuts"], eff, ln["start"])
            ws_in = [(w, s, e) for w, s, e in ln["words"]
                     if s >= a - 1e-9 and e <= b + 1e-9]
            # Coordenadas ORIGINALES = concatenación cruda (sin solapes).
            ro = raw_offsets[n]
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
        # Pausas conservadas (en coords editadas) = TODOS los huecos
        # intra-línea entre palabras consecutivas >= 0,20 s: las pausas
        # naturales de fraseo de la locutora (comas, dos puntos). El
        # check (e) de la auditoría exige que toda pausa detectada
        # (>= 0,25 s) empiece en un hueco diseñado del plan; el umbral
        # 0,20 s (por debajo de 0,25 s) cubre el desliz de ~0,05 s
        # entre los bordes de Whisper y los del detector de silencio.
        # Los huecos que rodean un corte quedan incluidos por la misma
        # vía (el tiempo editado ya descuenta lo cortado).
        merged = []
        ws = ln["words"]
        for i in range(len(ws) - 1):
            g0 = map_time(ws[i][2], ln["head"], ln["cuts"], eff,
                          ln["start"])
            g1 = map_time(ws[i + 1][1], ln["head"], ln["cuts"], eff,
                          ln["start"])
            if g1 - g0 >= 0.20:
                merged.append([round(g0, 3), round(g1, 3)])
        plan_lines.append({
            "linea": n, "slot": ln["start"],
            "factor_uniforme": ln["stretch"],
            "gaps": [], "segs": segs_out, "merged_gaps": merged,
        })
    json.dump({"version": "V2.3 (voz real)",
               "total": round(len(canvas) / SR, 3),
               "pad": 0.03, "fade": FADE_S, "lines": plan_lines},
              open(os.path.join(RES, "edit-plan-v2.3.json"), "w"),
              ensure_ascii=False, indent=1)

    # ---- mix-v2.3.sh (SFX móviles re-sincronizados a la voz real) ----
    def word_onset(linea, word):
        for w, s, _e in final_words[linea]:
            if w == word:
                return s
        raise KeyError(f"palabra {word!r} no encontrada en L{linea}")

    # Lista de SFX de mix-v2.sh con los 5 tiempos móviles sustituidos
    # (los fijos se copian tal cual).
    sfx_fixed = [
        ("booms-and-bass/boom-hit-soft.wav", 0.0),
        ("whooshes/whoosh-slow-soft.wav", 3.88),
        ("pops/pop-medium-in.wav", 9.82),
        ("pops/pop-medium-in.wav", 10.89),
        ("pops/pop-medium-in.wav", 11.89),
        ("data/data-tick.wav", 12.56),
        ("data/data-number-land.wav", 14.29),
        ("booms-and-bass/boom-hit-soft.wav", 16.25),
        ("data/data-countup-medium.wav", 17.86),
        ("data/data-number-land.wav", 20.41),
        ("whooshes/whoosh-slow-soft.wav", 24.57),
        ("booms-and-bass/boom-hit-soft.wav",
         word_onset(6, "gigante")),
        ("whooshes/whoosh-medium-soft.wav", 32.20),
        ("booms-and-bass/boom-hit-soft.wav",
         word_onset(7, "pensar.")),
        ("booms-and-bass/boom-hit-soft.wav", 37.81),
        ("pops/pop-medium-in.wav", word_onset(8, "condenado")),
        ("pops/pop-medium-in.wav", word_onset(9, "Leer.")),
        ("booms-and-bass/boom-hit-soft.wav", word_onset(9, "Pensar.")),
    ]
    sh = ["#!/bin/bash",
          "# Mezcla V2.3 del reel marti-fidel (VO real + ducking V1.5).",
          "# Generado por build-vo-real-v23.py: misma música y mismos SFX",
          "# que V2, con los 5 SFX ligados a palabras re-sincronizados",
          "# a los onsets de la voz real (el resto sigue a eventos de",
          "# vídeo fijos y conserva su tiempo V2).",
          "set -e",
          "HUB=~/workspace/remotion-hub",
          "PROJ=$HUB/repo/projects/marti-fidel",
          "SFX=$HUB/assets/sfx/sounds",
          "cd $HUB/repo",
          "~/workspace/remotion-hub/.venv/bin/python scripts/audio/mix.py \\",
          "  --voice projects/marti-fidel/public/audio/real23/vo-real.wav \\",
          '  --section "$HUB/assets/music/flow/shadows-and-evidence-flow-stem.wav@0@24.11" \\',
          '  --section "$HUB/assets/music/flow/weight-of-memory-flow-stem.wav@22.61@48.23" \\']
    for name, t in sfx_fixed:
        sh.append(f'  --sfx "$SFX/{name}@{t:.2f}" \\')
    sh += ['  --sfx "$PROJ/public/audio/sting-2x.wav@45.2" \\',
           "  --seconds 48.23 \\",
           "  --duck-release 250 --duck-threshold 0.08 --duck-ratio 5 \\",
           "  --music-volume 0.38 --xfade 1.5 --end-fade 1.0 \\",
           "  --out projects/marti-fidel/public/audio/real23/mix-v2.3.wav \\",
           "  --report projects/marti-fidel/public/audio/real23/mix-v2.3.json --force"]
    open(os.path.join(PROJ, "mix-v2.3.sh"), "w").write("\n".join(sh) + "\n")
    os.chmod(os.path.join(PROJ, "mix-v2.3.sh"), 0o755)

    # ---- informe de deriva vídeo<->voz ----
    # Onsets V2 por (línea, índice de palabra) — no por texto, porque
    # hay palabras repetidas («de», «No», «su», «Pensar.»).
    v2_by_line = {}
    _i = 0
    for frag in script["fragments"]:
        v2_by_line[len(v2_by_line) + 1] = [
            v2_caps[_i + k]["startMs"] / 1000
            for k in range(len(frag["words"]))]
        _i += len(frag["words"])
    drift = []
    for label, vt, ln, w in VIDEO_EVENTS:
        rt = word_onset(ln, w)
        widx = [x for x, _s, _e in lines[ln - 1]["words"]].index(w)
        v2t = v2_by_line[ln][widx]
        drift.append({
            "evento": label, "video_s": vt, "voz_real_s": round(rt, 2),
            "deriva_s": round(rt - vt, 2),
            "voz_v2_s": v2t,
            "deriva_v2_s": round(v2t - vt, 2),
        })
    json.dump(drift, open(os.path.join(REAL, "sync-drift-v2.3.json"), "w"),
              ensure_ascii=False, indent=1)
    print("\nDeriva vídeo<->voz (reveal fijo vs onset real):")
    for d in drift:
        print(f"  {d['evento']:32s} vídeo {d['video_s']:5.2f}  "
              f"voz {d['voz_real_s']:5.2f}  deriva {d['deriva_s']:+.2f}s "
              f"(V2: {d['deriva_v2_s']:+.2f}s)")

    # ---- validación ----
    errors, warnings = [], []
    # Duraciones y niveles por línea.
    for ln, res in zip(lines, results):
        if abs(res["lufs"] - (-18.0)) > 1.5:
            warnings.append(f"L{ln['linea']}: LUFS {res['lufs']:.1f} "
                            f"(objetivo -18)")
        if res["true_peak"] > -1.5:
            warnings.append(f"L{ln['linea']}: TP {res['true_peak']:.1f}")
        if res["peak_lin"] >= 0.999:
            errors.append(f"L{ln['linea']}: clipping (pico 1.0)")
    # Solapes entre líneas y huecos.
    ends = [(ln["start"], ln["start"] + res["out_dur"])
            for ln, res in zip(lines, results)]
    for i in range(8):
        gap = ends[i + 1][0] - ends[i][1]
        if gap < 0.15:
            errors.append(f"hueco L{i + 1}->L{i + 2} demasiado corto: "
                          f"{gap:.2f}s")
        if gap < 0.25:
            warnings.append(f"hueco L{i + 1}->L{i + 2} corto: {gap:.2f}s")
    # Captions: monotonía y 1:1 con el guion.
    starts = [c["startMs"] for c in caps]
    if starts != sorted(starts):
        errors.append("captions no monótonos")
    if len(caps) != 117:
        errors.append(f"captions: {len(caps)} palabras, se esperaban 117")
    # Puntos de corte: criterio de la auditoría (c) sobre la VO cruda.
    spec = importlib.util.spec_from_file_location(
        "audit", os.path.join(HUB, "repo/scripts/audio/audit-audio.py"))
    audit = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(audit)
    raw = audit.load_audio(raw_path, sr=SR, mono=True)
    for ln in lines:
        n = ln["linea"]
        ro = raw_offsets[n]
        bounds = [ln["head"]] + [c for cut in ln["cuts"] for c in cut] \
            + [ln["tail"]]
        for i in range(0, len(bounds), 2):
            a, b = bounds[i], bounds[i + 1]
            for label, t0, t1 in (
                    ("inicio", ro + a - 0.05, ro + a),
                    ("fin", ro + b, ro + b + 0.05)):
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
                   for k, v in res.items() if k != "segs"}
                  for res in results],
        "vo_real": {"path": vo_path, "dur_s": round(len(canvas) / SR, 3),
                    "peak": round(vo_peak, 4),
                    "sha256": sha256(vo_path)},
        "errors": errors, "warnings": warnings,
    }
    json.dump(report, open(os.path.join(REAL, "build-report-v2.3.json"),
                           "w"), ensure_ascii=False, indent=1)
    print(f"\nValidación: {len(errors)} errores, {len(warnings)} avisos")
    for w in warnings:
        print(f"  AVISO: {w}")
    for e in errors:
        print(f"  ERROR: {e}")
    if errors:
        print("BUILD CON ERRORES — revisar antes de mezclar/renderizar")
        return 1
    print("OK — listo para mezclar (bash mix-v2.3.sh)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
