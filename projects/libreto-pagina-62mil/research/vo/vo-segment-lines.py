#!/usr/bin/env python3
"""Segmenta la transcripción de la VO editada en las 31 líneas del
guion, para verificarla con scripts/audio/verify-vo-lines.py.

Alinea el flujo de palabras ASR con el flujo de palabras del guion
(difflib sobre palabras normalizadas con norm_word +
collapse_numbers, igual que la herramienta) y asigna cada palabra
ASR a una línea. Las palabras insertadas (ruido ASR) van a la línea
en curso. Valida que cada frontera entre líneas caiga en una pausa
real (hueco entre palabras >= 0,15 s); si no, avisa.

Salida: vo-edited-transcript-by-line.json
"""
import difflib
import importlib.util
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location(
    "verify_vo_lines",
    os.path.expanduser("~/workspace/remotion-hub/repo/scripts/audio/"
                       "verify-vo-lines.py"))
vvl = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(vvl)
norm_word = vvl.norm_word
collapse_numbers = vvl.collapse_numbers


def norm_tokens(words):
    """Normaliza y colapsa números; devuelve (tokens, mapa token->índices)."""
    raw = [norm_word(w) for w in words]
    # collapse_numbers no expone el mapa: replicar su lógica con mapa.
    out = []
    mapping = []
    i = 0
    nw = vvl._NUM_WORDS
    tens = vvl._TENS
    units = vvl._UNITS
    while i < len(raw):
        w = raw[i]
        if (w in tens and i + 2 < len(raw) + 1 and i + 1 < len(raw)
                and raw[i + 1] == "y" and i + 2 < len(raw)
                and raw[i + 2] in units):
            out.append(str(tens[w] + units[raw[i + 2]]))
            mapping.append([i, i + 1, i + 2])
            i += 3
        elif w in nw:
            out.append(str(nw[w]))
            mapping.append([i])
            i += 1
        else:
            out.append(w)
            mapping.append([i])
            i += 1
    return out, mapping


def main():
    lines = json.load(open(os.path.join(HERE, "vo-lines.json")))
    tr = json.load(open(os.path.join(HERE, "vo-edited-transcript.json")))
    twords = []
    for s in tr["segments"]:
        twords.extend(s["words"])

    # Flujo del guion con atribución de línea por palabra cruda.
    script_raw = []
    script_line_of_raw = []
    for ln in lines:
        for w in ln["text"].split():
            script_raw.append(w)
            script_line_of_raw.append(ln["line"])
    script_tok, script_map = norm_tokens(script_raw)
    script_line_of_tok = [script_line_of_raw[m[0]] for m in script_map]

    asr_raw = [w["word"] for w in twords]
    asr_tok, asr_map = norm_tokens(asr_raw)

    sm = difflib.SequenceMatcher(a=script_tok, b=asr_tok, autojunk=False)
    # token ASR -> línea
    asr_line = [None] * len(asr_tok)
    cur_line = 1
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag in ("equal", "replace"):
            for k in range(j2 - j1):
                # línea del token de guion correspondiente (o la
                # última del bloque si el ASR tiene más palabras)
                gi = min(i1 + k, i2 - 1) if i2 > i1 else i1
                ln = script_line_of_tok[gi] if i2 > i1 else cur_line
                asr_line[j1 + k] = ln
                cur_line = ln
        elif tag == "insert":
            for k in range(j1, j2):
                asr_line[k] = cur_line
        # delete: sin palabras ASR

    # Construir líneas con palabras originales (sin colapsar).
    by_line = {ln["line"]: [] for ln in lines}
    for ti, ln in enumerate(asr_line):
        if ln is None:
            continue
        for wi in asr_map[ti]:
            w = twords[wi]
            by_line[ln].append({
                "palabra": w["word"].strip(),
                "inicio": round(w["start"], 2),
                "fin": round(w["end"], 2),
                "probabilidad": round(w["probability"], 2),
            })
    out = []
    for ln in lines:
        n = ln["line"]
        ws = by_line[n]
        out.append({"linea": n,
                    "texto": " ".join(w["palabra"] for w in ws),
                    "palabras": ws})
    with open(os.path.join(HERE, "vo-edited-transcript-by-line.json"),
              "w") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)

    # Validación de fronteras.
    print(f"palabras guion: {len(script_raw)}, palabras ASR: {len(asr_raw)}")
    n_bad = 0
    for idx in range(len(out) - 1):
        a, b = out[idx], out[idx + 1]
        if not a["palabras"] or not b["palabras"]:
            print(f"FRONTERA L{a['linea']}/L{b['linea']}: línea vacía")
            n_bad += 1
            continue
        gap = b["palabras"][0]["inicio"] - a["palabras"][-1]["fin"]
        mark = "OK " if gap >= 0.15 else "!!!"
        if gap < 0.15:
            n_bad += 1
        print(f"{mark} frontera L{a['linea']:2d}/L{b['linea']:2d}: hueco "
              f"{gap:5.2f}s  ...{a['palabras'][-1]['palabra']} | "
              f"{b['palabras'][0]['palabra']}... "
              f"({a['palabras'][-1]['fin']:.2f} -> "
              f"{b['palabras'][0]['inicio']:.2f})")
    print("fronteras sospechosas:", n_bad)
    return 0 if n_bad == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
