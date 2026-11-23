#!/usr/bin/env python3
"""Construye la tabla de FRASES (oraciones) de la VO editada con tiempos
reales, a partir de las 31 líneas del guion y la transcripción por línea
con word_timestamps.

Motivo: scenes.json referencia "líneas" 1-94 de una numeración provisional
que no corresponde ni a las 31 líneas del guion ni a los 94 segmentos
Whisper (verificado 23-nov-2026). Las fronteras de escena caen a veces
DENTRO de una línea (p. ej. la verificación elTOQUE/InfoVeritas es la
última frase de la línea 3), así que la timeline se construye a
granularidad de frase (128 frases) con tiempos de los word_timestamps.

Método: por línea, divide el texto del guion en frases (regex sobre
[.!?…] + espacio), normaliza los tokens con la misma lógica de
verify-vo-lines.py (norm_word + collapse_numbers, igual que
vo-segment-lines.py) y alinea con difflib contra las palabras ASR de
la línea. La frontera de cada frase es el fin de su última palabra
alineada. Validación: tiempos monótonos, dentro del rango de la línea,
sin huecos.

Salida: research/sentences.json
  [{n, line, chapter, text, start, end, fallback}]
Uso: python3 build-sentence-table.py [--force]
"""
import difflib
import importlib.util
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(os.path.dirname(HERE))

_spec = importlib.util.spec_from_file_location(
    "verify_vo_lines",
    os.path.expanduser("~/workspace/remotion-hub/repo/scripts/audio/"
                       "verify-vo-lines.py"))
vvl = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(vvl)
norm_word = vvl.norm_word


def norm_tokens(words):
    """Igual que vo-segment-lines.py: normaliza y colapsa números,
    devolviendo (tokens, mapa token->índices de palabra)."""
    raw = [norm_word(w) for w in words]
    out = []
    mapping = []
    i = 0
    nw = vvl._NUM_WORDS
    tens = vvl._TENS
    units = vvl._UNITS
    while i < len(raw):
        w = raw[i]
        if (w in tens and i + 1 < len(raw) and raw[i + 1] == "y"
                and i + 2 < len(raw) and raw[i + 2] in units):
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


SENT_RE = re.compile(r"(?<=[.!?…])\s+")


def split_sentences(text):
    parts = [p.strip() for p in SENT_RE.split(text) if p.strip()]
    return parts


def tokenize(text):
    return [t for t in re.split(r"\s+", text.strip()) if t]


def main():
    force = "--force" in sys.argv
    out_path = os.path.join(PROJ, "research", "sentences.json")
    if os.path.exists(out_path) and not force:
        print(f"existe {out_path}; usa --force para sobrescribir")
        return 1
    with open(os.path.join(HERE, "vo-lines.json"), encoding="utf-8") as f:
        lines = json.load(f)
    with open(os.path.join(HERE, "vo-edited-transcript-by-line.json"),
              encoding="utf-8") as f:
        by_line = json.load(f)
    assert len(lines) == len(by_line) == 31

    sentences = []
    n = 0
    problems = []
    for li, (gl, al) in enumerate(zip(lines, by_line), 1):
        assert gl["line"] == al["linea"] == li
        sents = split_sentences(gl["text"])
        asr_words = [w["palabra"] for w in al["palabras"]]
        asr_tok, asr_map = norm_tokens(asr_words)
        # Tokens del guion por frase, con índice global dentro de la línea.
        gtok_all = []
        sent_spans = []  # (tok_start, tok_end_exclusive) por frase
        for s in sents:
            toks, _ = norm_tokens(tokenize(s))
            sent_spans.append((len(gtok_all), len(gtok_all) + len(toks)))
            gtok_all.extend(toks)
        sm = difflib.SequenceMatcher(a=gtok_all, b=asr_tok, autojunk=False)
        # Mapa guion_idx -> asr_idx desde los bloques coincidentes.
        g2a = {}
        for gb, ab, size in sm.get_matching_blocks():
            for k in range(size):
                g2a[gb + k] = ab + k
        # Partición POSICIONAL por pausas (23-nov-2026, v3): cada frase
        # posee un tramo contiguo de palabras ASR. Los tokens alineados
        # por difflib fijan el núcleo de cada frase; las palabras SIN
        # alinear entre dos núcleos (el ASR oyó mal la cabeza o la cola:
        # «El» -> «En», «62.000» -> «62» + «mil», «Primera» ->
        # «Primero», «Yasel Porto» -> «y hacer puto») se reparten por la
        # PAUSA MAYOR entre ambos núcleos: la frontera cae en el hueco
        # más grande, que es la pausa entre frases. La v1 (primer/último
        # token alineado) dejaba inicios hasta 1,86 s tarde (frase 107)
        # y fines hasta 0,9 s cortos (frase 90); la v2 (extensión de
        # cola) corregía los fines pero invadía la frase siguiente
        # cuando su primera palabra no alineaba (frases 67/68).
        words = al["palabras"]
        n_words = len(words)
        line_start = words[0]["inicio"]
        line_end = words[-1]["fin"]
        # Núcleo alineado por frase: [primera_palabra, última_palabra].
        cores = []
        for (gs, ge) in sent_spans:
            aligned = [g for g in range(gs, ge) if g in g2a]
            if not aligned:
                problems.append(f"L{li}: frase sin ningún token "
                                f"alineado: {sents[len(cores)][:50]!r}")
                return 2
            w0 = asr_map[g2a[aligned[0]]][0]
            w1 = asr_map[g2a[aligned[-1]]][-1]
            cores.append((w0, w1))
        for (w0a, w1a), (w0b, w1b) in zip(cores, cores[1:]):
            if w0b <= w1a:
                problems.append(f"L{li}: núcleos solapados "
                                f"({w0a}-{w1a} vs {w0b}-{w1b})")
                return 2
        # Fronteras: L[0]=0, R[-1]=última palabra; entre frases, la
        # pausa mayor en el tramo sin alinear (o la juntura directa).
        bounds_L = [0] * len(sent_spans)
        bounds_R = [0] * len(sent_spans)
        bounds_R[-1] = n_words - 1
        for si in range(len(sent_spans) - 1):
            _, w1a = cores[si]
            w0b, _ = cores[si + 1]
            best_k, best_gap = w1a, -1.0
            for k in range(w1a, w0b):
                gap = words[k + 1]["inicio"] - words[k]["fin"]
                if gap > best_gap:
                    best_gap, best_k = gap, k
            if best_gap < 0.05:
                # Sin pausa (habla continua, huecos ~0): el mayor hueco
                # no decide nada; repartir las palabras ASR sin alinear
                # en proporción a los tokens de guion sin alinear de
                # cada lado (cola de esta frase vs cabeza de la sig.).
                gs_i, ge_i = sent_spans[si]
                gs_j, ge_j = sent_spans[si + 1]
                al_i = [g for g in range(gs_i, ge_i) if g in g2a]
                al_j = [g for g in range(gs_j, ge_j) if g in g2a]
                tail_un = (ge_i - 1) - al_i[-1]
                head_un = al_j[0] - gs_j
                n_run = w0b - w1a - 1
                if tail_un + head_un > 0 and n_run > 0:
                    k = round(n_run * tail_un / (tail_un + head_un))
                    best_k = w1a + max(0, min(n_run, k))
            bounds_R[si] = best_k
            bounds_L[si + 1] = best_k + 1
        for si, (gs, ge) in enumerate(sent_spans):
            n += 1
            start = words[bounds_L[si]]["inicio"]
            end = words[bounds_R[si]]["fin"]
            if end <= start:
                problems.append(f"frase {n} (L{li}): end<=start "
                                f"({start:.2f}>={end:.2f})")
                end = start + 0.1
            if start < line_start - 0.01 or end > line_end + 0.01:
                problems.append(f"frase {n} (L{li}): fuera de línea "
                                f"({start:.2f}-{end:.2f} vs "
                                f"{line_start:.2f}-{line_end:.2f})")
            sentences.append({
                "n": n,
                "line": li,
                "chapter": gl["acto"] - 1,  # 0-based: acto 1 -> cap 0
                "text": sents[si],
                "start": round(start, 3),
                "end": round(end, 3),
                "fallback": None,
            })
    # Monotonía global.
    for a, b in zip(sentences, sentences[1:]):
        if b["start"] < a["start"] - 0.001:
            problems.append(f"no monótono: frase {a['n']} -> {b['n']}")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(sentences, f, indent=2, ensure_ascii=False)
    print(f"{len(sentences)} frases -> {out_path}")
    fb = sum(1 for s in sentences if s["fallback"])
    print(f"fallbacks: {fb}")
    if problems:
        print("PROBLEMAS:")
        for p in problems:
            print("  -", p)
        return 2
    print("validación OK: monótonas, dentro de línea, sin huecos")
    return 0


if __name__ == "__main__":
    sys.exit(main())
