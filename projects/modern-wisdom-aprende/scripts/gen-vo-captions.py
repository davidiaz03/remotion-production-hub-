#!/usr/bin/env python3
"""Genera vo-captions.json para scripts/audio/transcribe-vo.py desde
vo-script.json (373 fragmentos).

- words: el fragmento partido por espacios (como src/karaoke.ts).
- chunks: trozos de 6 palabras como máximo, cortando por la coma/punto y
  coma/dos puntos más cercana al límite cuando la hay (MISMA lógica que
  splitWords() en src/karaoke.ts, para que el karaoke real agrupe igual
  que el placeholder).
- keywords: como máximo UNA por chunk, la primera palabra del chunk que
  esté en KEY_TERMS (términos-concepto que el usuario debe recordar).
  El brief pide máx. 1 keyword por frase; aquí es máx. 1 por chunk
  (un chunk es media frase o menos).

Uso: python3 scripts/gen-vo-captions.py   (desde la raíz del proyecto)
Salida: vo-captions.json
"""
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAX_WORDS = 6

# Términos-concepto (normalizados: minúsculas, sin acentos ni puntuación).
KEY_TERMS = {
    # 0 Apertura
    "estudiar", "accion", "actuado", "capitulos",
    # 1 El podcast
    "filtro", "podcast", "episodios",
    # 2 No-necesidad
    "nonecesidad", "necesidad", "metrica",
    # 3 Confianza
    "confianza", "evidencia", "segundo", "rasgo", "estado",
    # 4 Ansiedad
    "exposicion", "ansiedad", "verguenza", "jerarquia", "muletas",
    # 5 Conversar
    "looping", "conversar", "carisma", "silencio", "preguntas",
    # 6 Conectar
    "conocido", "validar", "celebrar", "extrovertida", "amado",
    # 7 Sin mitos
    "mitos", "limerencia", "desprecio", "validacion", "claridad",
    "chad", "looksmaxxing", "mogging",
    # 8 Manosfera
    "manosfera", "pickup", "criterio", "venenoso",
    # 9 Mentalidad
    "estoicismo", "estatus", "creacion", "atencion", "manana",
    # 10 Filtro crítico
    "solido", "broscience", "estudio", "revista",
    # 11 Traducción cubana
    "terceros", "espacios", "friccion", "redes", "terapia",
    # 12 Advertencia
    "hiperrespondedores", "atlas", "procrastinacion",
    "input", "output", "outcome",
    # 13 Plan
    "plan", "habitos", "semanas",
    # 14 Cierre
    "pagina",
}


def norm(w: str) -> str:
    w = w.lower()
    w = unicodedata.normalize("NFKD", w).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]", "", w)


def split_words(words: list) -> list:
    """Réplica de splitWords() en src/karaoke.ts."""
    chunks = []
    rest = list(words)
    while len(rest) > MAX_WORDS:
        cut = MAX_WORDS
        best = -1
        best_dist = float("inf")
        for i, w in enumerate(rest[:MAX_WORDS + 2]):
            if re.search(r"[,;:]$", w):
                d = abs(i + 1 - cut)
                if d < best_dist:
                    best_dist = d
                    best = i + 1
        if best > 0:
            cut = best
        chunks.append(rest[:cut])
        rest = rest[cut:]
    if rest:
        chunks.append(rest)
    return chunks


def main() -> None:
    script = json.loads((ROOT / "vo-script.json").read_text(encoding="utf-8"))
    fragments = []
    n_kw = 0
    for frag in script["fragments"]:
        words = [w for w in frag["text"].split() if w]
        chunks = []
        pos = 0
        for chunk in split_words(words):
            kws = []
            for j, w in enumerate(chunk):
                if norm(w) in KEY_TERMS:
                    kws = [pos + j]
                    n_kw += 1
                    break  # máx. 1 keyword por chunk
            chunks.append([pos, pos + len(chunk), kws])
            pos += len(chunk)
        fragments.append({"words": words, "chunks": chunks})
    out = ROOT / "vo-captions.json"
    out.write_text(json.dumps({"fragments": fragments}, ensure_ascii=False),
                   encoding="utf-8")
    n_chunks = sum(len(f["chunks"]) for f in fragments)
    print(f"OK {out}: {len(fragments)} fragmentos, {n_chunks} chunks, "
          f"{n_kw} keywords")


if __name__ == "__main__":
    main()
