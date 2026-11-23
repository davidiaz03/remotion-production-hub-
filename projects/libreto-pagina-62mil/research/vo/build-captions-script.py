#!/usr/bin/env python3
"""Genera vo-captions.json (guion de karaoke) desde las 31 líneas del
guion de VO.

Formato (igual que longform-smoke): {"fragments": [{"words": [...],
"chunks": [[inicio, fin, [índices_kw]], ...]}]}. Las palabras son las
del guion (transcribe-vo.py las alinea a los word_timestamps de
Whisper). Chunks de 1-6 palabras, con corte preferente en fin de frase
y tras coma/dos puntos. Keywords: cifras, nombres propios distintivos
y palabras de veredicto (se resaltan con fondo Resaltador en el
karaoke).

Uso: python3 build-captions-script.py [--force]
Salida: <proyecto>/vo-captions.json
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(os.path.dirname(HERE))

NAMES = {
    "messi", "ronaldo", "musk", "bukele", "cienfuegos", "bebeshito",
    "taiger", "gemini", "eltoque", "cuballama", "infoveritas",
    "valdés-galloso", "valdes-galloso", "dagito", "yasel", "padrón",
    "padron", "trump", "starlink", "yankee", "bunny", "oniel",
    "damián", "teresa", "cristiano", "elon", "nayib", "carlos",
}
VERDICTS = {
    "falso", "falsa", "falsos", "falsas", "fabricado", "fabricada",
    "fabricados", "fabricadas", "inventada", "inventadas", "inventado",
    "inventados", "mintiendo", "mentira", "desmentido", "desmentirlo",
    "desmontado", "desmontaron", "peligroso", "deseable",
}
STRIP = "«»\"'.,;:!?¿¡()[]—-…"


def norm(w):
    return w.strip(STRIP).lower()


def is_keyword(w):
    n = norm(w)
    if not n:
        return False
    if any(c.isdigit() for c in n):
        return True
    if n in NAMES or n in VERDICTS:
        return True
    return False


def chunk_words(words):
    """Divide una lista de palabras en chunks de karaoke (1-6)."""
    chunks = []
    cur = []
    for i, w in enumerate(words):
        cur.append(i)
        # Fin de frase: el token termina en . ! ? … (con o sin comillas).
        end_sentence = bool(re.search(r"[.!?…][»\"']?$", w))
        after_comma = bool(re.search(r"[,;:][»\"']?$", w))
        if end_sentence:
            chunks.append(cur)
            cur = []
        elif len(cur) >= 6:
            chunks.append(cur)
            cur = []
        elif after_comma and len(cur) >= 3:
            chunks.append(cur)
            cur = []
    if cur:
        chunks.append(cur)
    return chunks


def main():
    force = "--force" in sys.argv
    out_path = os.path.join(PROJ, "vo-captions.json")
    if os.path.exists(out_path) and not force:
        print(f"existe {out_path}; usa --force para sobrescribir")
        return 1
    with open(os.path.join(HERE, "vo-lines.json"), encoding="utf-8") as f:
        lines = json.load(f)
    fragments = []
    total_chunks = 0
    total_kw = 0
    for gl in lines:
        words = [w for w in re.split(r"\s+", gl["text"].strip()) if w]
        chunks = []
        for c in chunk_words(words):
            kw = [i for i in c if is_keyword(words[i])]
            chunks.append([c[0], c[-1] + 1, kw])
            total_kw += len(kw)
        total_chunks += len(chunks)
        fragments.append({"words": words, "chunks": chunks})
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({"fragments": fragments}, f, indent=2, ensure_ascii=False)
    print(f"{len(fragments)} fragmentos, {total_chunks} chunks, "
          f"{total_kw} keywords -> {out_path}")
    # Validación: chunks de 1-6 palabras, cobertura completa.
    for fi, fr in enumerate(fragments, 1):
        covered = []
        for s, e, _ in fr["chunks"]:
            assert 1 <= e - s <= 6, (fi, s, e)
            covered.extend(range(s, e))
        assert covered == list(range(len(fr["words"]))), fi
    print("validación OK: chunks 1-6 palabras, cobertura completa")
    return 0


if __name__ == "__main__":
    sys.exit(main())
