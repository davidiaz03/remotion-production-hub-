#!/usr/bin/env python3
"""Verifica líneas de voz grabadas contra el guion CONOCIDO.

Compara la transcripción ASR (faster-whisper) de cada línea con el
texto del guion usando alineación difusa (difflib) y clasifica cada
línea como:

  MATCH        — la transcripción coincide con el guion (tras
                  normalizar puntuación, mayúsculas y números).
  INCIERTO     — hay una discrepancia de UNA sola palabra, una palabra
                  de baja probabilidad ASR, o una fusión/tragado
                  sospechosa. Acción: «verificar de oído». NUNCA es
                  un veredicto de regrabar por sí solo.
  DISCREPANCIA — palabras faltantes o sobrantes CLARAS (2+ palabras,
                  o una palabra de contenido larga con contexto ASR
                  de alta confianza). Acción: revisar de oído con
                  prioridad; el humano decide si se regraba.

LECCIÓN DEL 18-nov-2026 (caso Martí-Fidel, NO olvidar):
  Faster-whisper (small y base) y la transcripción automática
  coincidieron en TRES errores que NO existían en la grabación:
    - «advertencia» oído como «pertenencia» / «vertencia» /
      «tendencia» (habla rápida cubana: «a'vertencia» con d suave);
    - «un pueblo» oído como «el pueblo»;
    - la «a» de «condenado a volverla» tragada entre palabras.
  El usuario escuchó los audios y las dos líneas estaban BIEN.
  El acuerdo entre sistemas ASR NO es evidencia de error real:
  todos comparten los mismos sesgos ante el habla rápida.
  REGLA: la verificación por transcripción contra un guion conocido
  solo señala SOSPECHAS. El oído humano es el desempate.

Uso:
  python3 verify-vo-lines.py --script <vo-lines.json|vo-captions-v2.json>
      --transcription <vo-real-transcripts-*.json> [--out informe.json]
  python3 verify-vo-lines.py --self-test   # casos de regresión 18-nov

Código de salida: 0 si no hay DISCREPANCIA; 2 si alguna línea es
DISCREPANCIA (bandera para revisión humana, NO un auto-FAIL de la
toma). INCIERTO nunca cambia el código de salida.
"""

import argparse
import difflib
import importlib.util
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

# Reutiliza la normalización de la auditoría (norm_word + WHISPER_FIX).
_spec = importlib.util.spec_from_file_location(
    "audit_audio", os.path.join(HERE, "audit-audio.py"))
audit = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(audit)
norm_word = audit.norm_word

# Umbrales (conservadores: ante la duda, INCIERTO, no DISCREPANCIA).
LOW_PROB = 0.50       # probabilidad ASR por debajo = sospechosa
HIGH_PROB = 0.80      # contexto ASR por encima = «alta confianza»
CLOSE_RATIO = 0.50    # ratio difflib para «fonéticamente cercana»
CONTENT_LEN = 5       # palabra de >= N letras = «de contenido»

# Números en español 0-99 (Whisper escribe los números como palabras).
_UNITS = {"cero": 0, "uno": 1, "una": 1, "dos": 2, "tres": 3, "cuatro": 4,
          "cinco": 5, "seis": 6, "siete": 7, "ocho": 8, "nueve": 9,
          "diez": 10, "once": 11, "doce": 12, "trece": 13, "catorce": 14,
          "quince": 15}
_TEENS = {"dieciséis": 16, "dieciseis": 16, "diecisiete": 17,
          "dieciocho": 18, "diecinueve": 19}
_TWENTIES = {"veinte": 20, "veintiuno": 21, "veintiuna": 21,
             "veintidós": 22, "veintidos": 22, "veintitrés": 23,
             "veintitres": 23, "veinticuatro": 24, "veinticinco": 25,
             "veintiséis": 26, "veintiseis": 26, "veintisiete": 27,
             "veintiocho": 28, "veintinueve": 29}
_TENS = {"treinta": 30, "cuarenta": 40, "cincuenta": 50, "sesenta": 60,
         "setenta": 70, "ochenta": 80, "noventa": 90}
_NUM_WORDS = {**_UNITS, **_TEENS, **_TWENTIES, **_TENS}


def collapse_numbers(words):
    """Colapsa secuencias de palabras-número («treinta y tres») a
    su forma numérica («33») para alinear con guiones que usan dígitos."""
    out = []
    i = 0
    while i < len(words):
        w = words[i]
        if w in _TENS and i + 2 < len(words) + 1 and i + 1 < len(words) \
                and words[i + 1] == "y" and i + 2 < len(words) \
                and words[i + 2] in _UNITS:
            out.append(str(_TENS[w] + _UNITS[words[i + 2]]))
            i += 3
        elif w in _NUM_WORDS:
            out.append(str(_NUM_WORDS[w]))
            i += 1
        else:
            out.append(w)
            i += 1
    return out


def load_script(path):
    """Acepta vo-lines.json (lista) o vo-captions-v2.json (fragments)."""
    data = json.load(open(path, encoding="utf-8"))
    lines = []
    if isinstance(data, dict) and "fragments" in data:
        for i, frag in enumerate(data["fragments"], 1):
            lines.append({"linea": i,
                          "text": " ".join(frag["words"])})
    elif isinstance(data, list):
        for item in data:
            n = item.get("line", item.get("linea"))
            lines.append({"linea": n, "text": item["text"]})
    else:
        raise ValueError(f"formato de guion no reconocido: {path}")
    return lines


def load_transcription(path):
    """Formatos aceptados:
    - vo-real-transcripts: dict {nombre_wav: {text, duration, words}}
      con words [{w, s, e}] (sin probabilidad); la línea es el número
      inicial del nombre de archivo («1.1_0_8puo.wav» -> línea 1).
    - Lista con linea/texto/palabras (palabra, inicio, fin,
      probabilidad opcional).
    Sin probabilidad disponible se usa 1.0 (desconocida): la vía de
    «baja probabilidad» solo actúa cuando el ASR la proporciona.
    """
    data = json.load(open(path, encoding="utf-8"))
    items = []
    if isinstance(data, dict) and not ("lineas" in data
                                       or "lines" in data):
        for key, val in data.items():
            m = re.match(r"(\d+)", key)
            n = int(m.group(1)) if m else None
            items.append({"linea": n, "texto": val.get("text", ""),
                          "palabras": val.get("words", [])})
    else:
        if isinstance(data, dict):
            data = data.get("lineas", data.get("lines", []))
        items = data
    lines = []
    for item in items:
        n = item.get("linea", item.get("line"))
        words = []
        for w in item.get("palabras", item.get("words", [])):
            words.append({
                "text": w.get("palabra", w.get("w", w.get("word", ""))),
                "s": w.get("inicio", w.get("s", w.get("start", 0.0))),
                "e": w.get("fin", w.get("e", w.get("end", 0.0))),
                "p": w.get("probabilidad",
                           w.get("probability", w.get("p", 1.0))),
            })
        if not words and item.get("texto"):
            words = [{"text": t, "s": 0.0, "e": 0.0, "p": 1.0}
                     for t in item["texto"].split()]
        lines.append({"linea": n, "words": words,
                      "text": item.get("texto", "")})
    return lines


def _fusion_ratio(a_words, b_words):
    """Ratio difflib entre las formas concatenadas (detecta fusiones
    tipo «Martí ya» -> «Martilla» o «Y en» -> «yen»)."""
    a = "".join(a_words)
    b = "".join(b_words)
    if not a or not b:
        return 0.0
    return difflib.SequenceMatcher(a=a, b=b, autojunk=False).ratio()


def classify_opcode(tag, i1, i2, j1, j2, exp, got, got_p):
    """Clasifica UN opcode de SequenceMatcher.

    Devuelve (veredicto, detalle): veredicto en
    {"MATCH", "INCIERTO", "DISCREPANCIA"}.
    """
    exp_w = exp[i1:i2]
    got_w = got[j1:j2]
    if tag == "equal":
        return "MATCH", None
    n_exp, n_got = len(exp_w), len(got_w)
    # Probabilidad ASR mínima de las palabras implicadas (y de sus
    # vecinas inmediatas, que contextualizan una omisión).
    probs = [got_p[k] for k in range(max(0, j1 - 1),
                                     min(len(got_p), j2 + 1))]
    min_p = min(probs) if probs else 1.0
    # --- replace: palabra(s) distinta(s) ---
    if tag == "replace":
        if n_exp == 1 and n_got == 1:
            ratio = difflib.SequenceMatcher(
                a=exp_w[0], b=got_w[0], autojunk=False).ratio()
            if min_p < LOW_PROB:
                return ("INCIERTO",
                        f"{exp_w[0]!r} oído como {got_w[0]!r} "
                        f"(prob. ASR {min_p:.2f} < {LOW_PROB})")
            if ratio >= CLOSE_RATIO:
                return ("INCIERTO",
                        f"{exp_w[0]!r} oído como {got_w[0]!r} "
                        f"(fonéticamente cercana, ratio {ratio:.2f})")
            return ("INCIERTO",
                    f"{exp_w[0]!r} oído como {got_w[0]!r} "
                    f"(discrepancia de una sola palabra)")
        # Varias palabras: ¿fusión/tragado? («Fidel advirtió» ->
        # «Fidelad virtió», «Martí ya» -> «Martilla»)
        if _fusion_ratio(exp_w, got_w) >= CLOSE_RATIO:
            return ("INCIERTO",
                    f"posible fusión/tragado: guion {exp_w} vs "
                    f"ASR {got_w}")
        if min_p < LOW_PROB:
            return ("INCIERTO",
                    f"guion {exp_w} vs ASR {got_w} "
                    f"(prob. ASR {min_p:.2f} < {LOW_PROB})")
        return ("DISCREPANCIA",
                f"guion {exp_w} vs ASR {got_w} "
                f"(varias palabras distintas, prob. {min_p:.2f})")
    # --- delete: el guion tiene palabras que el ASR no oyó ---
    if tag == "delete":
        if n_exp == 1:
            w = exp_w[0]
            if len(w) < CONTENT_LEN or min_p < LOW_PROB:
                return ("INCIERTO",
                        f"palabra {w!r} no oída por el ASR "
                        f"(corta/función o prob. {min_p:.2f})")
            if min_p >= HIGH_PROB:
                return ("DISCREPANCIA",
                        f"palabra de contenido {w!r} no oída "
                        f"(contexto ASR {min_p:.2f} >= {HIGH_PROB})")
            return ("INCIERTO",
                    f"palabra {w!r} no oída (prob. {min_p:.2f})")
        if min_p < LOW_PROB:
            return ("INCIERTO",
                    f"palabras {exp_w} no oídas "
                    f"(prob. ASR {min_p:.2f} < {LOW_PROB})")
        return ("DISCREPANCIA",
                f"palabras {exp_w} no oídas por el ASR")
    # --- insert: el ASR oyó palabras que no están en el guion ---
    if tag == "insert":
        if n_got == 1:
            w = got_w[0]
            if len(w) < CONTENT_LEN or min_p < LOW_PROB:
                return ("INCIERTO",
                        f"palabra extra {w!r} en el ASR "
                        f"(corta o prob. {min_p:.2f})")
            if min_p >= HIGH_PROB:
                return ("DISCREPANCIA",
                        f"palabra extra de contenido {w!r} "
                        f"(prob. ASR {min_p:.2f} >= {HIGH_PROB})")
            return ("INCIERTO",
                    f"palabra extra {w!r} (prob. {min_p:.2f})")
        if min_p < LOW_PROB:
            return ("INCIERTO",
                    f"palabras extra {got_w} "
                    f"(prob. ASR {min_p:.2f} < {LOW_PROB})")
        return ("DISCREPANCIA",
                f"palabras extra {got_w} en el ASR")
    return "INCIERTO", f"opcode inesperado {tag}"


def verify_line(script_text, asr_words):
    """Verifica una línea. Devuelve (veredicto, detalles, alineación)."""
    exp_raw = script_text.split()
    exp = collapse_numbers([norm_word(w) for w in exp_raw])
    got_raw = [w["text"] for w in asr_words]
    got = collapse_numbers([norm_word(w) for w in got_raw])
    got_p = [float(w.get("p", 1.0)) for w in asr_words]
    # collapse_numbers puede acortar `got`; las probabilidades se
    # alinean por posición solo si no hubo colapso de números. Para
    # no falsear, si las longitudes difieren se usa 1.0 (el colapso
    # numérico ya resolvió la alineación de esas palabras).
    if len(got_p) != len(got):
        got_p = [1.0] * len(got)
    sm = difflib.SequenceMatcher(a=exp, b=got, autojunk=False)
    verdict = "MATCH"
    details = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        v, d = classify_opcode(tag, i1, i2, j1, j2, exp, got, got_p)
        if d:
            details.append({"veredicto": v, "detalle": d,
                            "guion": exp[i1:i2], "asr": got[j1:j2]})
        if v == "DISCREPANCIA":
            verdict = "DISCREPANCIA"
        elif v == "INCIERTO" and verdict != "DISCREPANCIA":
            verdict = "INCIERTO"
    return verdict, details, {"guion": exp, "asr": got}


def run(script_path, transcription_path):
    script = load_script(script_path)
    trans = load_transcription(transcription_path)
    by_line = {t["linea"]: t for t in trans}
    results = []
    for ln in script:
        n = ln["linea"]
        t = by_line.get(n)
        if t is None:
            results.append({"linea": n, "veredicto": "DISCREPANCIA",
                            "detalles": [{"veredicto": "DISCREPANCIA",
                                          "detalle": "sin transcripción"}],
                            "guion": ln["text"], "asr": None})
            continue
        v, details, align = verify_line(ln["text"], t["words"])
        results.append({"linea": n, "veredicto": v, "detalles": details,
                        "guion": ln["text"],
                        "asr": t.get("text") or " ".join(
                            w["text"] for w in t["words"])})
    return results


SELF_TEST_CASES = [
    # (nombre, guion, palabras ASR [(texto, prob)], veredicto esperado)
    ("18-nov L1: advertencia/pertenencia",
     "Martí lo advirtió en 1891.",
     [("Martí", 0.9), ("lo", 0.9), ("pertenencia", 0.6), ("en", 0.9),
      ("1891", 0.9)], "INCIERTO"),
    ("18-nov L8: un/el pueblo",
     "Cuando un pueblo olvida su historia,",
     [("Cuando", 0.9), ("el", 0.9), ("pueblo", 0.9), ("olvida", 0.9),
      ("su", 0.9), ("historia", 0.9)], "INCIERTO"),
    ("18-nov L8: a tragada",
     "está condenado a volverla a vivir.",
     [("está", 0.9), ("condenado", 0.9), ("volverla", 0.9), ("a", 0.9),
      ("vivir", 0.9)], "INCIERTO"),
    ("fusión: Martí ya -> Martilla",
     "Martí ya lo había dicho:",
     [("Martilla", 0.7), ("lo", 0.9), ("había", 0.9), ("dicho", 0.9)],
     "INCIERTO"),
    ("fusión: Fidel advirtió -> Fidelad virtió",
     "Y en 2005, Fidel advirtió:",
     [("Y", 0.9), ("en", 0.9), ("2005", 0.9), ("Fidelad", 0.6),
      ("virtió", 0.6)], "INCIERTO"),
    ("número: 33 -> treinta y tres",
     "33 años de unanimidad caribeña",
     [("treinta", 0.9), ("y", 0.9), ("tres", 0.9), ("años", 0.9),
      ("de", 0.9), ("unanimidad", 0.9), ("caribeña", 0.9)], "MATCH"),
    ("MATCH exacto",
     "Leer. Pensar.",
     [("Leer", 0.95), ("Pensar", 0.95)], "MATCH"),
    ("DISCREPANCIA real: omisión de contenido",
     "el gigante de las siete leguas",
     [("el", 0.95), ("gigante", 0.95), ("de", 0.95), ("las", 0.95),
      ("siete", 0.95)], "DISCREPANCIA"),
    ("DISCREPANCIA real: frase distinta",
     "No es lo mismo estar desinformado",
     [("No", 0.95), ("es", 0.95), ("lo", 0.95), ("mismo", 0.95),
      ("comer", 0.95), ("pan", 0.95)], "DISCREPANCIA"),
]


def self_test():
    n_ok = 0
    for name, script, words, expected in SELF_TEST_CASES:
        asr = [{"text": t, "s": 0.0, "e": 0.0, "p": p}
               for t, p in words]
        v, details, _ = verify_line(script, asr)
        ok = v == expected
        n_ok += ok
        print(f"{'OK  ' if ok else 'FAIL'} {name}: {v} "
              f"(esperado {expected})"
              + ("" if ok else f"  detalles={details}"))
    print(f"\nself-test: {n_ok}/{len(SELF_TEST_CASES)}")
    return 0 if n_ok == len(SELF_TEST_CASES) else 1


def main():
    ap = argparse.ArgumentParser(
        description="Verifica líneas de voz contra el guion conocido "
                    "(MATCH / INCIERTO / DISCREPANCIA).")
    ap.add_argument("--script", help="vo-lines.json o vo-captions-v2.json")
    ap.add_argument("--transcription",
                    help="transcripción faster-whisper con palabras")
    ap.add_argument("--out", help="informe JSON de salida")
    ap.add_argument("--self-test", action="store_true",
                    help="casos de regresión (lección 18-nov-2026)")
    args = ap.parse_args()
    if args.self_test:
        return self_test()
    if not args.script or not args.transcription:
        ap.error("--script y --transcription son obligatorios "
                 "(o --self-test)")
    results = run(args.script, args.transcription)
    counts = {"MATCH": 0, "INCIERTO": 0, "DISCREPANCIA": 0}
    for r in results:
        counts[r["veredicto"]] += 1
        mark = {"MATCH": "✓", "INCIERTO": "?",
                "DISCREPANCIA": "✗"}[r["veredicto"]]
        print(f"{mark} L{r['linea']}: {r['veredicto']}")
        for d in r["detalles"]:
            print(f"    - {d['detalle']}")
    print(f"\n{counts['MATCH']} MATCH, {counts['INCIERTO']} INCIERTO, "
          f"{counts['DISCREPANCIA']} DISCREPANCIA "
          f"de {len(results)} líneas")
    if counts["INCIERTO"]:
        print("INCIERTO = verificar de oído; NUNCA un veredicto de "
              "regrabar por sí solo (lección 18-nov-2026).")
    if args.out:
        json.dump({"veredicto_global":
                   ("DISCREPANCIA" if counts["DISCREPANCIA"]
                    else "INCIERTO" if counts["INCIERTO"] else "MATCH"),
                   "resumen": counts, "lineas": results},
                  open(args.out, "w", encoding="utf-8"),
                  ensure_ascii=False, indent=1)
        print(f"informe: {args.out}")
    return 2 if counts["DISCREPANCIA"] else 0


if __name__ == "__main__":
    sys.exit(main())
