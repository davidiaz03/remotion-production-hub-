#!/usr/bin/env python3
"""Edición en papel, paso 2: arma el rough cut desde la selección del usuario.

Entrada: el video original + la selección (números de frase del papel
de ``paper-edit.py``, rangos de tiempo, o una EDL previa para
reproducir un corte).

Salida:
  rough-cut.mp4  — los segmentos en el orden elegido, con transiciones
  edl.json       — lista de corte reproducible (qué, en qué orden, con
                   qué transiciones; re-ejecutable con --edl)
  captions.json  — palabras del papel remapeadas a la línea de tiempo
                   del corte (CutCaption[] = HubCaption en estructura,
                   para BottomKaraoke)
  vo-lines.json  — frases remapeadas (compatible con audit-audio.py)
  cut.ts         — (opcional, --ts-out) módulo TS para QuietReel

Uso:
  python3 scripts/editing/assemble-cut.py --video grabacion.mp4 \\
      --paper research/paper/paper.json --select "3,5-8,12" \\
      --xfade 0.3 --out-dir cut/
  # Reproducir un corte anterior:
  python3 scripts/editing/assemble-cut.py --video grabacion.mp4 \\
      --edl cut/edl.json --out-dir cut2/
  # Instalar en un proyecto QuietReel (copia el rough cut, escribe
  # src/cut.ts y actualiza project.json):
  python3 scripts/editing/assemble-cut.py --video grabacion.mp4 \\
      --paper research/paper/paper.json --select "3,5-8" \\
      --project projects/mi-reel --out-dir cut/

Lecciones codificadas (17-nov-2026, reel marti-fidel V1.5):
  - Los bordes de Whisper desvían 50-100 ms y truncan colas de palabra;
    en finales de frase el desvío llega a 0,4 s (verificado: «74,»
    terminaba 0,36 s después de lo declarado). Por eso AMBOS bordes
    de cada segmento caen en SILENCIO REAL (50 ms < -45 dBFS, el umbral
    del check (c)): el inicio busca hacia atrás hasta 0,5 s
    (--pad-start-max), el final hacia adelante hasta 1,0 s
    (--pad-end-max); si no hay silencio en la ventana, cae el colchón
    fijo (+0,15/-0,05 s). Sin invadir la frase vecina. El corte
    acústico puede incluir una vocalización breve sin transcribir tras
    la frase (un «gracias», un filler): suena natural.
  - Cada caption dura hasta que empieza la palabra siguiente dentro
    de su frase: si no, los huecos entre palabras apagan el karaoke
    en medio de la frase aunque haya voz encima.
  - Los crossfades de audio se hacen AQUÍ (ffmpeg acrossfade), no en
    Remotion: Remotion no funde audio entre clips solapados y el
    resultado suena turbio.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

FPS = 30
STING_FRAMES = 91  # cierre con logo animado, 3,03 s a 30 fps
CRF = 18


def parse_time(s: str) -> float:
    """Segundos (12.5) o MM:SS(.s) -> segundos."""
    s = s.strip()
    if ":" in s:
        m, sec = s.split(":", 1)
        return int(m) * 60 + float(sec)
    return float(s)


def parse_select(spec: str):
    """'3,5-8,12' -> [3, 5, 6, 7, 8, 12] (en el orden escrito)."""
    ids = []
    for part in spec.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            a, b = part.split("-", 1)
            ids.extend(range(int(a), int(b) + 1))
        else:
            ids.append(int(part))
    return ids


def parse_ranges(spec: str):
    """'12.5-20.1,00:33-00:40' -> [(12.5, 20.1), (33.0, 40.0)]."""
    out = []
    for part in spec.split(","):
        part = part.strip()
        if not part:
            continue
        a, b = part.split("-", 1)
        out.append((parse_time(a), parse_time(b)))
    return out


def probe(path: str) -> dict:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries",
         "stream=codec_type,width,height,avg_frame_rate",
         "-show_entries", "format=duration",
         "-of", "json", path],
        capture_output=True, text=True, check=True)
    d = json.loads(r.stdout)
    info = {"duration": float(d["format"]["duration"]), "has_audio": False}
    for s in d["streams"]:
        if s["codec_type"] == "video":
            info["width"] = s["width"]
            info["height"] = s["height"]
        elif s["codec_type"] == "audio":
            info["has_audio"] = True
    return info


def probe_duration(path: str) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", path],
        capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def run(cmd):
    subprocess.run(cmd, check=True, capture_output=True, text=True)


class AudioEnvelope:
    """RMS en ventanas de 10 ms del audio fuente (cortes acústicos).

    Lección de marti-fidel V1.5: los bordes de Whisper desvían 50-100 ms
    y las colas de palabra (reverberación) se extienden más allá del fin
    declarado; cortar en un offset fijo trunca colas. El corte de fin
    debe caer en silencio real.
    """
    # Umbral de silencio: -45 dBFS, el MISMO que usa el check (c) de
    # audit-audio.py para decidir si hay voz descartada. Con -40 dBFS
    # el corte caía en una cola que el módulo aún medía por encima de
    # -45 y seguía dando FAIL (verificado en paper-edit-demo v1).
    SILENCE_DB = -45.0
    SILENCE_S = 0.05

    def __init__(self, wav16k):
        import wave
        import numpy as np
        with wave.open(wav16k, "rb") as w:
            sr = w.getframerate()
            n = w.getnframes()
            data = np.frombuffer(w.readframes(n),
                                 dtype=np.int16).astype(np.float32) / 32768.0
        hop = max(1, int(sr * 0.01))
        n_win = len(data) // hop
        trim = data[:n_win * hop].reshape(n_win, hop)
        self.rms_db = 20 * np.log10(
            np.sqrt((trim ** 2).mean(axis=1)) + 1e-12)
        self.hop_s = 0.01

    def find_silence_after(self, t, limit):
        """Primer instante >= t con 50 ms seguidos por debajo de -45 dBFS,
        sin pasar de limit. None si no lo hay."""
        i0 = int(t / self.hop_s)
        i1 = int(limit / self.hop_s)
        need = int(self.SILENCE_S / self.hop_s)
        run = 0
        for i in range(i0, min(i1, len(self.rms_db))):
            run = run + 1 if self.rms_db[i] < self.SILENCE_DB else 0
            if run >= need:
                return round((i - need + 1) * self.hop_s, 3)
        return None

    def find_silence_before(self, t, limit):
        """Fin del último silencio (50 ms < -45 dBFS) que termina en
        [limit, t]. None si no lo hay. Sirve para el corte de inicio:
        si Whisper atrasa el inicio de la palabra, el silencio anterior
        al inicio REAL queda antes, y el corte lo incluye todo."""
        i1 = int(t / self.hop_s)
        i0 = int(limit / self.hop_s)
        need = int(self.SILENCE_S / self.hop_s)
        run = 0
        # Desde la ventana que TERMINA en t (i1-1): el corte no debe
        # quedar después del inicio declarado de la palabra.
        for i in range(min(i1 - 1, len(self.rms_db) - 1),
                       max(i0, 0) - 1, -1):
            run = run + 1 if self.rms_db[i] < self.SILENCE_DB else 0
            if run >= need:
                return round((i + need) * self.hop_s, 3)
        return None


def resolve_selection(paper, select_ids, ranges, pad_start, pad_end,
                      audio_env=None, pad_end_max=1.0, pad_start_max=0.5):
    """Devuelve segmentos [{paper_ids, src_start, src_end, phrases}].

    Los bordes se alargan con el colchón anti-truncado, sin invadir la
    frase vecina en la fuente. Con envolvente acústica, AMBOS bordes
    caen en silencio real (50 ms < -45 dBFS): el inicio busca hacia
    atrás hasta pad_start_max, el final hacia adelante hasta
    pad_end_max; si no hay silencio en la ventana, cae el colchón fijo.
    El corte acústico puede incluir una vocalización breve sin
    transcribir tras la frase (un «gracias», un filler): es el precio
    de no truncar nunca una palabra, y suena natural.
    """
    phrases = {p["id"]: p for p in paper["phrases"]} if paper else {}
    ordered = sorted(paper["phrases"], key=lambda p: p["start"]) if paper else []
    segments = []

    def padded(ph):
        start = ph["start"] - pad_start
        end = ph["end"] + pad_end
        idx = ordered.index(ph)
        if idx > 0:
            start = max(start, ordered[idx - 1]["end"] + 0.02)
        if idx < len(ordered) - 1:
            end = min(end, ordered[idx + 1]["start"] - 0.02)
        # Cortes acústicos: ambos bordes en silencio real. Los fines de
        # palabra de Whisper pueden desviarse hasta 0,4 s (verificado:
        # «74,» terminaba 0,36 s después de lo declarado), así que el
        # colchón fijo no basta. Sin invadir la frase vecina.
        if audio_env is not None:
            start_limit = ph["start"] - pad_start_max
            if idx > 0:
                start_limit = max(start_limit,
                                  ordered[idx - 1]["end"] + 0.02)
            s0 = audio_env.find_silence_before(ph["start"], start_limit)
            if s0 is not None:
                start = s0
            limit = ph["end"] + pad_end_max
            if idx < len(ordered) - 1:
                limit = min(limit, ordered[idx + 1]["start"] - 0.02)
            s = audio_env.find_silence_after(ph["end"], limit)
            if s is not None:
                end = s
        return max(0.0, round(start, 3)), round(end, 3)

    for pid in select_ids:
        if pid not in phrases:
            raise ValueError(f"frase {pid} no existe en el papel "
                             f"(1-{len(phrases)})")
        ph = phrases[pid]
        s, e = padded(ph)
        segments.append({"paper_ids": [pid], "src_start": s, "src_end": e,
                         "phrases": [ph]})
    # Fusionar frases consecutivas con hueco < 0,5 s en la fuente: forman
    # un pasaje continuo y no necesitan transición entre ellas (un xfade
    # ahí sería un fundido artificial en medio de una frase).
    merged = []
    for seg in segments:
        if (merged and seg["paper_ids"] and merged[-1]["paper_ids"]
                and seg["paper_ids"][0]
                == merged[-1]["paper_ids"][-1] + 1
                and seg["phrases"] and merged[-1]["phrases"]
                and seg["phrases"][0]["start"]
                - merged[-1]["phrases"][-1]["end"] < 0.5):
            prev = merged[-1]
            prev["paper_ids"] += seg["paper_ids"]
            prev["phrases"] += seg["phrases"]
            prev["src_end"] = seg["src_end"]
        else:
            merged.append(seg)
    segments = merged
    for (s, e) in ranges:
        if e <= s:
            raise ValueError(f"rango inválido: {s}-{e}")
        # Frases del papel que caen dentro del rango (para captions).
        inside = [p for p in ordered if p["start"] >= s - 0.01 and p["end"] <= e + 0.01]
        segments.append({"paper_ids": [p["id"] for p in inside],
                         "src_start": round(s, 3), "src_end": round(e, 3),
                         "phrases": inside})
    return segments


def cut_segment(video, start, end, out, width, height, has_audio):
    """Corta un segmento con seek preciso (re-encode, params uniformes).

    Doble seek: salto rápido (keyframe) hasta 2 s antes del inicio y
    luego seek preciso; sin el salto rápido, cada corte decodifica
    desde el segundo 0 y un video largo tarda minutos por segmento.
    """
    pre = max(0.0, start - 2.0)
    cmd = ["ffmpeg", "-y", "-v", "error",
           "-ss", str(pre), "-i", video,
           "-ss", str(round(start - pre, 3)),
           "-to", str(round(end - pre, 3)),
           "-vf", f"fps={FPS},scale={width}:{height},setsar=1",
           "-c:v", "libx264", "-crf", str(CRF), "-preset", "veryfast",
           "-pix_fmt", "yuv420p"]
    if has_audio:
        cmd += ["-ar", "48000", "-ac", "2", "-c:a", "aac", "-b:a", "192k"]
    else:
        cmd += ["-an"]
    cmd += [out]
    run(cmd)


def join_hardcut(seg_files, out, has_audio):
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as f:
        for sf in seg_files:
            f.write(f"file '{os.path.abspath(sf)}'\n")
        lst = f.name
    try:
        cmd = ["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0",
               "-i", lst, "-c", "copy", "-movflags", "+faststart", out]
        run(cmd)
    finally:
        os.unlink(lst)


def join_xfade(seg_files, durations, xfade, out, has_audio):
    """Concatena con crossfade de video (xfade) y audio (acrossfade)."""
    n = len(seg_files)
    inputs = []
    for sf in seg_files:
        inputs += ["-i", sf]
    filt = []
    # Video: cadena xfade. offset_i = suma(dur 0..i-1) - i*xfade.
    vlabel = "0:v"
    offset = durations[0]
    for i in range(1, n):
        out_label = f"v{i}"
        filt.append(f"[{vlabel}][{i}:v]xfade=transition=fade:duration={xfade}"
                    f":offset={offset:.3f}[{out_label}]")
        vlabel = out_label
        offset += durations[i] - xfade
    maps = ["-map", f"[{vlabel}]"]
    if has_audio:
        alabel = "0:a"
        for i in range(1, n):
            out_label = f"a{i}"
            filt.append(f"[{alabel}][{i}:a]acrossfade=d={xfade}[{out_label}]")
            alabel = out_label
        maps += ["-map", f"[{alabel}]"]
    cmd = (["ffmpeg", "-y", "-v", "error"] + inputs +
           ["-filter_complex", ";".join(filt)] + maps +
           ["-c:v", "libx264", "-crf", str(CRF), "-preset", "veryfast",
            "-pix_fmt", "yuv420p"])
    if has_audio:
        cmd += ["-c:a", "aac", "-b:a", "192k", "-ar", "48000"]
    cmd += ["-movflags", "+faststart", out]
    run(cmd)


def build_captions(segments, edl_segments):
    """Palabras del papel remapeadas a la línea de tiempo del corte.

    Cada palabra dura hasta que empieza la siguiente DENTRO de su frase
    (regla de marti-fidel V1.5): sin esto, los huecos entre palabras
    apagan el karaoke en medio de la frase aunque haya voz encima. La
    última palabra de cada frase conserva su fin acústico.
    """
    caps = []
    for seg, edl in zip(segments, edl_segments):
        shift = edl["out_start"] - seg["src_start"]
        for ph in seg["phrases"]:
            words = ph["words"]
            for wi, w in enumerate(words):
                last_in_phrase = wi == len(words) - 1
                end = words[wi + 1]["start"] if not last_in_phrase \
                    else w["end"]
                caps.append({
                    "text": w["word"] if not caps else " " + w["word"],
                    "startMs": round((w["start"] + shift) * 1000),
                    "endMs": round((end + shift) * 1000),
                    "timestampMs": round((w["start"] + shift) * 1000),
                    "confidence": None,
                    **({"pageBreakAfter": True} if last_in_phrase else {}),
                })
    return caps


def build_vo_lines(segments, edl_segments, total):
    lines = []
    for seg, edl in zip(segments, edl_segments):
        shift = edl["out_start"] - seg["src_start"]
        for ph in seg["phrases"]:
            lines.append({"start": round(ph["start"] + shift, 3),
                          "end": round(ph["end"] + shift, 3),
                          "text": ph["text"]})
    return {"samplerate": 48000, "voice": "paper-edit",
            "source": "rough-cut", "totalDuration": round(total, 3),
            "lines": lines}


def build_prediction(segments, edl_segments):
    """Tiempos analíticos de las palabras del corte (formato audit-audio.py).

    Es la «predicción» que el módulo compara contra la transcripción de
    la VO editada: las palabras del papel remapeadas a la línea de
    tiempo del corte.
    """
    palabras = []
    for seg, edl in zip(segments, edl_segments):
        shift = edl["out_start"] - seg["src_start"]
        for ph in seg["phrases"]:
            for w in ph["words"]:
                palabras.append({"w": w["word"],
                                 "s": round(w["start"] + shift, 3),
                                 "e": round(w["end"] + shift, 3)})
    return {"palabras": palabras}


def build_edit_plan(edl_segments, segments=None, paper=None):
    """Plan de edición en el formato que lee audit-audio.py (check c/d).

    Cada segmento del corte es una «línea» con factor 1.0 (paper-edit
    no comprime tempo): el módulo comprueba energía descartada en cada
    corte, discontinuidades en los empalmes y palabras exprimidas.
    `prev/next_phrase_gap` (segundos hasta la frase vecina del papel,
    None si no la hay) le dice al módulo cuándo la voz descartada en
    un corte pertenece a la frase vecina — excluida a propósito — y no
    a una cola truncada de la frase incluida.
    """
    ordered = sorted(paper["phrases"], key=lambda p: p["start"]) \
        if paper else []
    by_id = {p["id"]: i for i, p in enumerate(ordered)}
    lines = []
    for s, seg in zip(edl_segments, segments or [None] * len(edl_segments)):
        sg = {"orig_start": s["src_start"], "orig_end": s["src_end"],
              "edited_start": s["out_start"], "edited_end": s["out_end"]}
        ids = (seg or {}).get("paper_ids") or s.get("paper_ids") or []
        if ids and ordered:
            first, last = by_id.get(ids[0]), by_id.get(ids[-1])
            sg["prev_phrase_gap"] = round(
                s["src_start"] - ordered[first - 1]["end"], 3) \
                if first is not None and first > 0 else None
            sg["next_phrase_gap"] = round(
                ordered[last + 1]["start"] - s["src_end"], 3) \
                if last is not None and last < len(ordered) - 1 else None
        lines.append({"linea": s["order"], "factor_uniforme": 1.0,
                      "segs": [sg]})
    return {"kind": "paper-edit", "pad": 0.03, "lines": lines}


def build_transcription_selected(segments):
    """Palabras seleccionadas con tiempos ORIGINALES, en orden de corte.

    Formato load_whisper_file de audit-audio.py: el módulo empareja
    estas palabras con la predicción por índice, así que van en el
    mismo orden (selección) que la predicción, no en orden de la fuente.
    """
    return [{"words": [{"w": w["word"], "s": w["start"], "e": w["end"]}
                       for ph in seg["phrases"] for w in ph["words"]]}
            for seg in segments]


def build_cut_ts(edl, captions, lower_thirds, fps):
    total_frames = round(edl["duration"] * fps) + STING_FRAMES
    cut = {
        "fps": fps,
        "roughCutFile": "video/rough-cut.mp4",
        "roughCutFrames": round(edl["duration"] * fps),
        "stingFrames": STING_FRAMES,
        "totalFrames": total_frames,
        "karaoke": bool(captions),
        "captions": captions,
        "lowerThirds": lower_thirds,
        "edl": edl,
    }
    body = json.dumps(cut, ensure_ascii=False, indent=1)
    # Sin imports: CutCaption se define inline (idéntico en estructura a
    # HubCaption de shared/captions/types.ts), así el archivo es
    # autocontenido y la copia de research/cut/ también pasa el typecheck
    # del repo (su ruta relativa a shared/ difiere de la de src/).
    return ("// Auto-generated by scripts/editing/assemble-cut.py — do not edit by hand.\n"
            "// Corte (EDL) + captions remapeados + lower-thirds para QuietReel.\n"
            "\n"
            "export type CutCaption = {text: string; startMs: number; "
            "endMs: number; timestampMs: number | null; "
            "confidence: number | null; pageBreakAfter?: boolean; "
            "kw?: boolean};\n"
            "export type CutLowerThird = {atFrame: number; frames: number; "
            "title: string; subtitle: string};\n"
            "export type CutEdlSegment = {order: number; paper_ids: number[]; "
            "src_start: number; src_end: number; out_start: number; "
            "out_end: number; transition_in: string};\n"
            "export type CutEdl = {version: number; source: string; "
            "paper: string | null; xfade: number; fps: number; width: number; "
            "height: number; segments: CutEdlSegment[]; duration: number; "
            "rough_cut: string};\n"
            "export type Cut = {fps: number; roughCutFile: string; "
            "roughCutFrames: number; stingFrames: number; totalFrames: number; "
            "karaoke: boolean; captions: CutCaption[]; "
            "lowerThirds: CutLowerThird[]; edl: CutEdl};\n"
            "\n"
            f"export const CUT: Cut = {body};\n")


def parse_lower_third(spec, edl_segments, fps):
    """'orden:título|subtítulo' -> {atFrame, frames, title, subtitle}.

    El separador título/subtítulo es '|' (los títulos pueden contener
    ':'; '|' prácticamente nunca aparece en un título).
    """
    if ":" not in spec:
        raise ValueError(f"lower-third inválido: {spec!r} "
                         "(forma: orden:título|subtítulo)")
    order_s, rest = spec.split(":", 1)
    order = int(order_s)
    if "|" in rest:
        title, subtitle = rest.split("|", 1)
    else:
        title, subtitle = rest, ""
    if order < 1 or order > len(edl_segments):
        raise ValueError(f"lower-third: orden {order} fuera de rango "
                         f"(1-{len(edl_segments)})")
    seg = edl_segments[order - 1]
    dur = seg["out_end"] - seg["out_start"]
    return {"atFrame": round(seg["out_start"] * fps),
            "frames": round(min(dur, 6.0) * fps),
            "title": title.strip(), "subtitle": subtitle.strip()}


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--video", required=True, help="Video original")
    p.add_argument("--paper", help="paper.json de paper-edit.py")
    p.add_argument("--select", default="",
                   help="Números de frase del papel: '3,5-8,12'")
    p.add_argument("--ranges", default="",
                   help="Rangos de tiempo: '12.5-20.1,00:33-00:40'")
    p.add_argument("--edl", help="EDL previa para reproducir el corte")
    p.add_argument("--xfade", type=float, default=0.0,
                   help="Crossfade entre segmentos en segundos (0 = corte directo)")
    p.add_argument("--pad-start", type=float, default=0.05,
                   help="Colchón al inicio de cada frase (anti-truncado)")
    p.add_argument("--pad-end", type=float, default=0.15,
                   help="Colchón al final de cada frase (anti-truncado)")
    p.add_argument("--pad-end-max", type=float, default=1.0,
                   help="Ventana máxima para buscar el silencio real del "
                        "corte acústico de fin (defecto 1,0 s)")
    p.add_argument("--pad-start-max", type=float, default=0.5,
                   help="Ventana máxima para buscar el silencio real del "
                        "corte acústico de inicio (defecto 0,5 s)")
    p.add_argument("--out-dir", default="cut-out", help="Carpeta de salida")
    p.add_argument("--out", help="MP4 del rough cut (defecto: <out-dir>/rough-cut.mp4)")
    p.add_argument("--lower-third", action="append", default=[],
                   help="Repetible: 'orden:título|subtítulo' para QuietReel")
    p.add_argument("--project", help="Proyecto QuietReel donde instalar el corte")
    p.add_argument("--force", action="store_true")
    a = p.parse_args()

    if not os.path.exists(a.video):
        p.error(f"no existe: {a.video}")
    paper = None
    if a.paper:
        with open(a.paper, encoding="utf-8") as f:
            paper = json.load(f)

    # Envolvente acústica para los cortes de fin (solo el camino del
    # papel la usa; --edl reproduce cortes ya decididos).
    audio_env, tmp_wav = None, None
    if paper and not a.edl and a.select:
        tmp_wav = tempfile.mktemp(suffix="-paper-16k.wav")
        run(["ffmpeg", "-y", "-v", "error", "-i", a.video, "-vn",
             "-ar", "16000", "-ac", "1", tmp_wav])
        audio_env = AudioEnvelope(tmp_wav)

    segments = None
    if a.edl:
        with open(a.edl, encoding="utf-8") as f:
            prev = json.load(f)
        if a.xfade == 0.0:
            a.xfade = prev.get("xfade", 0.0)
        segments = [{"paper_ids": s.get("paper_ids", []),
                     "src_start": s["src_start"], "src_end": s["src_end"],
                     "phrases": []} for s in prev["segments"]]
        # Las frases para captions se recuperan del papel si se pasó.
        if paper:
            by_id = {ph["id"]: ph for ph in paper["phrases"]}
            for seg in segments:
                seg["phrases"] = [by_id[i] for i in seg["paper_ids"] if i in by_id]
    else:
        select_ids = parse_select(a.select) if a.select else []
        ranges = parse_ranges(a.ranges) if a.ranges else []
        if not select_ids and not ranges:
            p.error("falta la selección: --select y/o --ranges (o --edl)")
        if select_ids and not paper:
            p.error("--select necesita --paper")
        segments = resolve_selection(paper, select_ids, ranges,
                                     a.pad_start, a.pad_end,
                                     audio_env, a.pad_end_max,
                                     a.pad_start_max)
    if tmp_wav:
        os.unlink(tmp_wav)
    if not segments:
        p.error("la selección está vacía")

    info = probe(a.video)
    print(f"Fuente: {a.video} ({info['width']}x{info['height']}, "
          f"{info['duration']:.1f} s, audio={'sí' if info['has_audio'] else 'no'})")
    print(f"Segmentos: {len(segments)}, xfade={a.xfade} s")
    for i, s in enumerate(segments, 1):
        print(f"  {i}. {s['src_start']:.2f}–{s['src_end']:.2f} s "
              f"(frases {s['paper_ids'] or '—'})")

    os.makedirs(a.out_dir, exist_ok=True)
    out_mp4 = a.out or os.path.join(a.out_dir, "rough-cut.mp4")
    if os.path.exists(out_mp4) and not a.force:
        p.error(f"la salida ya existe: {out_mp4} (usa --force)")

    with tempfile.TemporaryDirectory(prefix="assemble-cut-") as tmp:
        seg_files = []
        durations = []
        for i, s in enumerate(segments):
            sf = os.path.join(tmp, f"seg{i:02d}.mp4")
            cut_segment(a.video, s["src_start"], s["src_end"], sf,
                        info["width"], info["height"], info["has_audio"])
            d = probe_duration(sf)
            if d <= 0:
                print(f"ERROR: el segmento {i+1} salió vacío.", file=sys.stderr)
                return 1
            seg_files.append(sf)
            durations.append(d)
        if a.xfade > 0:
            if a.xfade >= min(durations):
                p.error(f"xfade {a.xfade} s supera la duración del segmento "
                        f"más corto ({min(durations):.2f} s)")
            join_xfade(seg_files, durations, a.xfade, out_mp4, info["has_audio"])
        else:
            join_hardcut(seg_files, out_mp4, info["has_audio"])

    # Línea de tiempo de salida (con solape por xfade).
    edl_segments = []
    cursor = 0.0
    for i, (s, d) in enumerate(zip(segments, durations)):
        edl_segments.append({
            "order": i + 1,
            "paper_ids": s["paper_ids"],
            "src_start": s["src_start"], "src_end": s["src_end"],
            "out_start": round(cursor, 3), "out_end": round(cursor + d, 3),
            "transition_in": "xfade" if (i > 0 and a.xfade > 0) else "cut",
        })
        cursor += d - (a.xfade if i < len(segments) - 1 else 0.0)
    total = round(cursor, 3)
    # La duración real del archivo manda sobre la calculada.
    total = round(probe_duration(out_mp4), 3)

    edl = {"version": 1, "source": os.path.abspath(a.video),
           "paper": os.path.abspath(a.paper) if a.paper else None,
           "xfade": a.xfade, "fps": FPS,
           "width": info["width"], "height": info["height"],
           "segments": edl_segments, "duration": total,
           "rough_cut": os.path.abspath(out_mp4)}
    edl_path = os.path.join(a.out_dir, "edl.json")
    with open(edl_path, "w", encoding="utf-8") as f:
        json.dump(edl, f, ensure_ascii=False, indent=1)

    captions = build_captions(segments, edl_segments)
    caps_path = os.path.join(a.out_dir, "captions.json")
    with open(caps_path, "w", encoding="utf-8") as f:
        json.dump(captions, f, ensure_ascii=False, indent=1)

    vo_lines = build_vo_lines(segments, edl_segments, total)
    vl_path = os.path.join(a.out_dir, "vo-lines.json")
    with open(vl_path, "w", encoding="utf-8") as f:
        json.dump(vo_lines, f, ensure_ascii=False, indent=1)

    # Archivos para audit-audio.py (compatibilidad total con el módulo).
    pred = build_prediction(segments, edl_segments)
    pred_path = os.path.join(a.out_dir, "vo-editada-prediccion.json")
    with open(pred_path, "w", encoding="utf-8") as f:
        json.dump(pred, f, ensure_ascii=False, indent=1)
    plan = build_edit_plan(edl_segments, segments, paper)
    plan_path = os.path.join(a.out_dir, "edit-plan.json")
    with open(plan_path, "w", encoding="utf-8") as f:
        json.dump(plan, f, ensure_ascii=False, indent=1)
    trans_sel = build_transcription_selected(segments)
    trans_path = os.path.join(a.out_dir, "transcription-selected.json")
    with open(trans_path, "w", encoding="utf-8") as f:
        json.dump(trans_sel, f, ensure_ascii=False, indent=1)

    lower_thirds = [parse_lower_third(lt, edl_segments, FPS)
                    for lt in a.lower_third]
    ts_path = os.path.join(a.out_dir, "cut.ts")
    with open(ts_path, "w", encoding="utf-8") as f:
        f.write(build_cut_ts(edl, captions, lower_thirds, FPS))

    print(f"\nOK {out_mp4} ({total:.2f} s)")
    print(f"OK {edl_path} | {caps_path} ({len(captions)} palabras) | "
          f"{vl_path} | {ts_path}")
    print(f"OK auditoría: {pred_path} | {plan_path} | {trans_path}")

    if a.project:
        proj = a.project
        pj_path = os.path.join(proj, "project.json")
        if not os.path.exists(pj_path):
            p.error(f"proyecto sin project.json: {proj}")
        os.makedirs(os.path.join(proj, "public", "video"), exist_ok=True)
        os.makedirs(os.path.join(proj, "public", "audio"), exist_ok=True)
        os.makedirs(os.path.join(proj, "research"), exist_ok=True)
        shutil.copy(out_mp4, os.path.join(proj, "public", "video", "rough-cut.mp4"))
        shutil.copy(ts_path, os.path.join(proj, "src", "cut.ts"))
        shutil.copy(caps_path, os.path.join(proj, "public", "audio", "captions.json"))
        shutil.copy(vl_path, os.path.join(proj, "public", "audio", "vo-lines.json"))
        shutil.copy(edl_path, os.path.join(proj, "research", "edl.json"))
        shutil.copy(pred_path, os.path.join(proj, "research",
                                            "vo-editada-prediccion.json"))
        shutil.copy(plan_path, os.path.join(proj, "research", "edit-plan.json"))
        shutil.copy(trans_path, os.path.join(proj, "research",
                                             "transcription-selected.json"))
        # Audios para audit-audio.py: voz original y voz editada (limpias).
        run(["ffmpeg", "-y", "-v", "error", "-i", a.video, "-vn",
             "-ar", "48000", "-ac", "1",
             os.path.join(proj, "public", "audio", "voice-orig.wav")])
        run(["ffmpeg", "-y", "-v", "error", "-i", out_mp4, "-vn",
             "-ar", "48000", "-ac", "1",
             os.path.join(proj, "public", "audio", "voice-edited.wav")])
        with open(pj_path, encoding="utf-8") as f:
            pj = json.load(f)
        pj["durationInFrames"] = round(total * FPS) + STING_FRAMES
        with open(pj_path, "w", encoding="utf-8") as f:
            json.dump(pj, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"Instalado en {proj} "
              f"(durationInFrames={pj['durationInFrames']})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
