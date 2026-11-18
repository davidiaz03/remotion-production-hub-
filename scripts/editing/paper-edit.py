#!/usr/bin/env python3
"""Edición en papel, paso 1: transcribe una grabación y produce el «papel».

El papel es el documento que el usuario lee para elegir el montaje: la
transcripción completa de la grabación, dividida en frases numeradas con
tiempos de inicio/fin legibles. El usuario selecciona por número de frase
(p. ej. ``3, 5-8, 12``) o por rango de tiempo (``00:12-00:34``) y el paso 2
(``assemble-cut.py``) arma el corte.

Salidas en --out-dir:
  paper.md    — documento legible (frases numeradas, agrupadas por párrafo)
  paper.json  — {source, duration, phrases: [{id, start, end, text,
                words: [{word, start, end}]}]} — lo que lee assemble-cut.py

Uso:
  ~/workspace/.stt-env/bin/python scripts/editing/paper-edit.py \\
      --input video.mp4 --out-dir projects/mi-reel/research/paper

Lecciones codificadas (17-nov-2026, reel marti-fidel V1.5):
  - Los bordes de palabra de Whisper se desvían 50-100 ms; las frases del
    papel conservan los tiempos de Whisper, pero assemble-cut.py aplica
    un colchón (+0,15 s al final, -0,05 s al inicio) para no truncar
    colas de palabras. NO recortar el papel a mano con esos tiempos.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import tempfile

from faster_whisper import WhisperModel

DEFAULT_MODEL = "/home/hatch/workspace/.stt-models/faster-whisper-small"

# Una frase termina cuando una palabra termina en estos signos...
END_PUNCT = ".!?…"
# ...o cuando hay una pausa larga entre palabras (nueva idea).
PAUSE_SPLIT_S = 1.0
# Seguridad: una frase no supera estas cotas (se parte en el límite).
MAX_WORDS = 30
MAX_SECONDS = 15.0
# Un párrafo nuevo empieza cuando la pausa entre frases supera esto.
PARAGRAPH_GAP_S = 1.5


def fmt_time(t: float) -> str:
    """Segundos -> MM:SS.s legible."""
    m = int(t // 60)
    s = t - m * 60
    return f"{m:02d}:{s:04.1f}"


def probe_duration(path: str) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", path],
        capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def extract_audio(src: str, tmp: str) -> str:
    """Extrae audio 16 kHz mono para Whisper (funciona con video y audio)."""
    out = os.path.join(tmp, "paper-16k.wav")
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", src, "-vn",
         "-ar", "16000", "-ac", "1", out],
        check=True)
    return out


def split_phrases(words):
    """Agrupa palabras en frases numeradas.

    Cada frase: {id, start, end, text, words}. Los cortes se hacen en
    puntuación final, pausa larga o cota de seguridad.
    """
    phrases = []
    cur = []

    def flush():
        nonlocal cur
        if not cur:
            return
        phrases.append({
            "id": len(phrases) + 1,
            "start": round(cur[0]["start"], 3),
            "end": round(cur[-1]["end"], 3),
            "text": " ".join(w["word"] for w in cur).strip(),
            "words": cur,
        })
        cur = []

    prev_end = None
    for w in words:
        if cur and prev_end is not None:
            gap = w["start"] - prev_end
            too_long = (len(cur) >= MAX_WORDS
                        or w["end"] - cur[0]["start"] > MAX_SECONDS)
            if gap > PAUSE_SPLIT_S:
                flush()
            elif too_long:
                # La cota de seguridad no debe partir a mitad de cláusula:
                # buscar la última coma de la segunda mitad y partir ahí.
                cut = None
                for i in range(len(cur) - 1, len(cur) // 2, -1):
                    if cur[i]["word"] and cur[i]["word"][-1] in ",;:":
                        cut = i
                        break
                if cut is not None and cut < len(cur) - 1:
                    head, cur = cur[:cut + 1], cur[cut + 1:]
                    phrases.append({
                        "id": len(phrases) + 1,
                        "start": round(head[0]["start"], 3),
                        "end": round(head[-1]["end"], 3),
                        "text": " ".join(x["word"] for x in head).strip(),
                        "words": head,
                    })
                else:
                    flush()
        cur.append(w)
        prev_end = w["end"]
        if w["word"] and w["word"][-1] in END_PUNCT:
            flush()
    flush()
    return phrases


def group_paragraphs(phrases):
    """Agrupa frases en párrafos por pausas largas entre ellas."""
    paras = []
    cur = []
    prev_end = None
    for ph in phrases:
        if cur and prev_end is not None and ph["start"] - prev_end > PARAGRAPH_GAP_S:
            paras.append(cur)
            cur = []
        cur.append(ph)
        prev_end = ph["end"]
    if cur:
        paras.append(cur)
    return paras


def write_markdown(path, src, duration, phrases, paras, model):
    n_words = sum(len(p["words"]) for p in phrases)
    lines = [
        f"# Papel — {os.path.basename(src)}",
        "",
        f"- Fuente: `{src}`",
        f"- Duración: {fmt_time(duration)} ({duration:.1f} s) · "
        f"{n_words} palabras · {len(phrases)} frases",
        f"- Modelo: `{model}` (faster-whisper, español, word_timestamps)",
        "",
        "## Cómo seleccionar el montaje",
        "",
        "Escribe los números de frase en el orden que quieras, por ejemplo:",
        "",
        "    3, 5-8, 12",
        "",
        "También puedes dar rangos de tiempo (`00:12-00:34`) o mezclar "
        "ambos. Cada frase lleva sus tiempos de inicio y fin.",
        "",
        "> Nota: los tiempos vienen de Whisper y pueden desviarse unas "
        "décimas; el montaje aplica un colchón automático para no cortar "
        "palabras por la mitad.",
        "",
    ]
    for pi, para in enumerate(paras, 1):
        lines.append(f"## Párrafo {pi}")
        lines.append("")
        for ph in para:
            lines.append(
                f"**[{ph['id']}]** {fmt_time(ph['start'])}–"
                f"{fmt_time(ph['end'])} — {ph['text']}")
        lines.append("")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    return path


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--input", required=True, help="Video o audio a transcribir")
    p.add_argument("--out-dir", required=True, help="Carpeta de salida")
    p.add_argument("--model", default=DEFAULT_MODEL)
    p.add_argument("--language", default="es")
    p.add_argument("--force", action="store_true")
    a = p.parse_args()

    if not os.path.exists(a.input):
        p.error(f"no existe: {a.input}")
    md_path = os.path.join(a.out_dir, "paper.md")
    json_path = os.path.join(a.out_dir, "paper.json")
    if os.path.exists(md_path) and not a.force:
        p.error(f"la salida ya existe: {md_path} (usa --force)")
    os.makedirs(a.out_dir, exist_ok=True)

    duration = probe_duration(a.input)
    print(f"Fuente: {a.input} ({duration:.1f} s)")

    with tempfile.TemporaryDirectory(prefix="paper-edit-") as tmp:
        audio = extract_audio(a.input, tmp)
        model = WhisperModel(a.model, device="cpu", compute_type="int8",
                             local_files_only=True)
        segments, _ = model.transcribe(audio, language=a.language,
                                       word_timestamps=True)
        words = []
        for seg in segments:
            seg_words = getattr(seg, "words", None) or []
            if seg_words:
                words.extend({"word": w.word.strip(), "start": round(w.start, 3),
                              "end": round(w.end, 3)}
                             for w in seg_words if w.word.strip())
            else:
                # Sin word_timestamps: reparte el segmento por igual
                # (aproximación, marcada en el papel).
                toks = seg.text.split()
                if not toks:
                    continue
                step = (seg.end - seg.start) / len(toks)
                words.extend({"word": t, "start": round(seg.start + i * step, 3),
                              "end": round(seg.start + (i + 1) * step, 3)}
                             for i, t in enumerate(toks))
    if not words:
        print("ERROR: Whisper no detectó habla en la grabación.", file=sys.stderr)
        return 1
    print(f"Whisper: {len(words)} palabras")

    phrases = split_phrases(words)
    paras = group_paragraphs(phrases)
    print(f"Frases: {len(phrases)} en {len(paras)} párrafos")

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"source": os.path.abspath(a.input), "duration": round(duration, 3),
                   "model": a.model, "language": a.language,
                   "phrases": phrases}, f, ensure_ascii=False, indent=1)
    write_markdown(md_path, a.input, duration, phrases, paras, a.model)
    print(f"OK {md_path}")
    print(f"OK {json_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
