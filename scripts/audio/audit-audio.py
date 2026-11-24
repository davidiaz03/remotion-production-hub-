#!/usr/bin/env python3
"""Auditoría completa de audio para reels del hub (V1.5).

El módulo que faltaba: las mediciones anteriores (RMS global,
silencedetect, escaneo de clics por umbral) NO detectaban lo que el
oído sí capta (microcortes, pausas inesperadas, frases incompletas).
Este módulo audita el audio en profundidad, con timestamps exactos, y
es OBLIGATORIO antes de entregar cualquier reel (ver repo/AGENTS.md).

Chequeos (cada uno PASS/WARN/FAIL con timestamps):
  a) Guion <-> karaoke: cada palabra del guion aparece en karaoke
     exactamente 1 vez, en orden (faltantes/duplicadas/fuera de orden).
  b) Tiempos de caption: duración mínima, solapes, huecos (clasificados
     contra el mapa de silencios de la VO y, si este no cubre, contra
     la fracción de VOZ en el hueco — un tono de sala de -41 dB no es
     silencio para el detector pero tampoco es voz), duración de
     VISUALIZACIÓN (inicio a inicio: lo que BottomKaraoke realmente
     muestra — el componente solo lee `s`, nunca `e`), inicios no
     monótonos, fin de caption vs fin acústico de la palabra.
  c) Integridad de la VO vs el original: energía en el LADO DESCARTADO
     de cada corte, clasificada por RMS + ARMONICIDAD (solo la voz
     sonora descartada es FAIL; respiros y clics son INFO), duración
     ACÚSTICA por palabra vs original/factor, onsets tardíos con
     análisis de rampa (salto brusco = cabeza cortada; rampa gradual =
     onset natural silencioso), discontinuidades SOLO en los empalmes
     (método por borde), y preservación de pausas naturales
     intra-línea (original vs editada: FAIL si la editada queda
     < 0,25 s o pierde > 50% de su duración).
  d) Artefactos de time-stretch: flujo espectral en las uniones de
     segmentos con tempo vs uniones SIN stretch (misma posición: inicio
     de segmento tras silencio), y periodicidad WSOLA (autocorrelación
     del flujo 8-30 ms) vs baseline sin stretch.
  e) Mapa de silencios: pausas >=0,25 s clasificadas (dramática /
     frontera de línea / inesperada en medio de frase). La tolerancia
     de inicio (0,35 s) cubre el keep de cola de los segmentos.
  f) Música: curva RMS en ventanas de 0,25 s (suelo -32 dBFS fuera de
     pausas dramáticas y de pasajes donde la propia cama está por
     debajo del suelo), análisis del crossfade entre secciones,
     recuperación del ducking tras cada frase (<=6 dB del nivel sin
     ducking a los 0,25 s) y bombeo (variación de ganancia del
     sidechain dentro de cada frase).
  g) Máster: loudness/TP, silencedetect, onset de voz vs t=0,
     alineación karaoke vs ONSETS ACÚSTICOS de la VO editada
     (autoritaria) y vs voz del máster (Whisper, con su sesgo
     conocido), y detección de fallos de transcripción (Whisper vs
     predicción analítica).
  h) Espectrogramas (completo + por línea) para revisión visual.
  i) Microcortes de voz a nivel de forma de onda (microcut.py):
     calidad de cada empalme (saltos de muestra, DC, distancia
     espectral, hueco del fundido), dips dentro de palabras
     (editada vs original con alineación por palabra — los
     cierres de oclusiva naturales aparecen en ambos y no se
     marcan), contigüidad de segmentos (cada segmento editado
     debe ser un trozo contiguo del original) y SFX que entierran
     el ataque de una palabra en la mezcla. Las pausas
     recortadas las cubre (c) §4 con la misma regla, así que (i3)
     no se repite aquí.

Entradas (rutas por defecto dentro del proyecto):
  public/audio/vo-lines.json (dict con clave `lines`)
  public/audio/captions.json
  public/audio/vo-definitiva.wav (o --voice-orig)
  public/audio/vo-definitiva-editada.wav (o --voice-edited)
  public/audio/vo-definitiva-transcripcion.json (Whisper, original)
  public/audio/vo-editada-transcripcion.json (Whisper, editada)
  research/vo-editada-prediccion.json (tiempos analíticos)
  research/edit-plan-vXX.json (fronteras de edición; --edit-plan)
  public/audio/mix.wav (o --mix)
  out/*_MASTER.mp4 (o --master)
  --section ARCHIVO@INICIO@FIN (música, formato de mix.py)

Uso:
  python3 scripts/audio/audit-audio.py --project projects/marti-fidel \\
      --master projects/marti-fidel/out/marti-fidel_MASTER.mp4 \\
      --edit-plan projects/marti-fidel/research/edit-plan-v14.json \\
      --section assets/music/flow/shadows.wav@0@27 \\
      --section assets/music/flow/weight.wav@25.5@50.23 \\
      --out-dir projects/marti-fidel/reports

Salida: reporte JSON + Markdown en --out-dir (o <proyecto>/reports).
Código de salida: 0 si no hay FAIL, 1 si hay al menos un FAIL.

LECCIONES codificadas aquí (verificadas 17-nov-2026):
  - `alimiter=limit=X` con el `level` por defecto (auto-level=true)
    aplica una ganancia de maquillaje de 1/X (+2,05 dB con X=0,79):
    NO es un limitador de techo. Un techo real es
    `alimiter=limit=X:level=false` (verificado: pico 0,841 -> 0,790).
  - Whisper sobre la MEZCLA tiene un sesgo sistemático (~+0,2 s) en
    los inicios de palabra; la alineación autoritativa es contra la
    VO limpia, no contra el máster.
  - BottomKaraoke solo lee los inicios (`s`) de cada palabra: la
    duración (e-s) NO afecta a la visualización; lo que importa es
    la duración de visualización (inicio a inicio).
  - Una pausa natural recortada suena a palabra cortada aunque el
    empalme caiga en silencio y no haya clic: L2 «recuento,» -> «y»
    (18-nov-2026) pasó de 0,42 s a 0,22 s y el usuario lo oyó como
    microcorte al principio del reel. El check (c) §4 compara las
    pausas acústicas original vs editada por línea (FAIL si la
    editada queda < 0,25 s o pierde > 50%).
  - La V2.3 pasó (c) con 0 FAIL y el usuario TODAVÍA oyó
    microcortes: la causa no estaba en la VO (empalmes limpios a
    nivel de muestra, sin dips dentro de palabras) sino en la
    MEZCLA — SFX que entierran el ataque de palabras (+22 a +29 dB
    sobre la voz en los primeros 30 ms: «pensar.» 37,05 s, «Leer.»
    43,17 s, «Pensar.» 44,43 s) — y en huecos de fundido de 13-33 dB
    en los empalmes (el patrón fade-out + fade-in no es un
    crossfade). La sección (i) mide ambas cosas; `vo_build.py`
    previene los huecos con crossfades de igual potencia.
"""
import argparse
import difflib
import hashlib
import json
import math
import os
import re
import subprocess
import sys
import tempfile

import numpy as np

# ---------------- umbrales (ver docstring) ----------------
MIN_CAPTION_S = 0.18       # (b) duración mínima de caption (WARN)
MIN_DISPLAY_S = 0.10       # (b) duración mínima de visualización (WARN)
GAP_CLASSIFY_S = 0.35      # (b) hueco entre captions a clasificar
SYNC_MAX_S = 0.15          # (b,g) desvío máximo karaoke/voz (FAIL)
RMS_FLOOR_DBFS = -32.0     # (f) suelo de música en la mezcla (FAIL)
DUCK_RECOVERY_DB = 6.0     # (f) recuperación del ducking (FAIL)
DUCK_PUMP_DB = 6.0         # (f) bombeo dentro de una frase (WARN)
XFADE_DIP_DB = 6.0         # (f) caída en el crossfade (WARN)
SPLICE_RATIO = 3.0         # (c) discontinuidad en empalme (FAIL)
WORD_SQUEEZE = 0.80        # (c) palabra comprimida de más (FAIL)
PAUSE_MIN_S = 0.25         # (c) pausa intra-línea mínima tras editar (FAIL)
PAUSE_MAX_LOSS = 0.50      # (c) pérdida máxima de pausa natural (FAIL)
SILENCE_MIN_S = 0.25       # (e) pausa mínima a clasificar
SILENCE_THRESH_DB = -45.0  # (e) umbral de silencio
SR = 48000
WHISPER_VENV = os.path.expanduser(
    "~/workspace/.stt-env/bin/python")
WHISPER_MODEL = os.path.expanduser(
    "~/workspace/.stt-models/faster-whisper-small")

# Erratas sistemáticas de Whisper en este proyecto (normalización para
# alinear transcripciones con el guion).
WHISPER_FIX = {
    "extensiones": "abstenciones", "marty": "martí",
    "auno": "onu", "favores": "favor",
}


def norm_word(w: str) -> str:
    w = w.lower().strip()
    w = re.sub(r"[^a-záéíóúñü0-9]", "", w)
    return WHISPER_FIX.get(w, w)


# ---------------- utilidades de audio ----------------

def load_audio(path: str, sr: int = SR, mono: bool = True) -> np.ndarray:
    """Decodifica cualquier audio (wav/mp4/aac) a float32 [-1, 1].

    Usa ffmpeg -> f32le; mono promedia canales.
    """
    cmd = ["ffmpeg", "-v", "error", "-i", path, "-vn", "-ar", str(sr),
           "-ac", "1" if mono else "2", "-f", "f32le", "-"]
    out = subprocess.run(cmd, capture_output=True, check=True).stdout
    a = np.frombuffer(out, dtype=np.float32)
    if not mono:
        a = a.reshape(-1, 2)
    return a


def load_wav_fast(path: str, sr: int = SR) -> np.ndarray:
    """WAV PCM16 mono rápido (sin ffmpeg) si coincide el sample rate."""
    import wave
    with wave.open(path, "rb") as w:
        if (w.getframerate() != sr or w.getsampwidth() != 2):
            return load_audio(path, sr=sr, mono=True)
        n, ch = w.getnframes(), w.getnchannels()
        a = np.frombuffer(w.readframes(n), dtype=np.int16).astype(
            np.float32) / 32768.0
    if ch > 1:
        a = a.reshape(-1, ch).mean(axis=1)
    return a


def rms_windows(a: np.ndarray, sr: int, win_s: float = 0.25) -> list:
    """RMS en dBFS por ventanas consecutivas de win_s."""
    win = max(1, int(win_s * sr))
    out = []
    for k in range(0, len(a) // win):
        seg = a[k * win:(k + 1) * win]
        out.append((k * win_s,
                    20 * math.log10(float(np.sqrt((seg ** 2).mean()))
                                    + 1e-9)))
    return out


def find_silences(a: np.ndarray, sr: int,
                  thresh_db: float = SILENCE_THRESH_DB,
                  min_s: float = SILENCE_MIN_S) -> list:
    """Pausas (inicio, fin, duración) con RMS < thresh en ventanas de 10 ms."""
    win = int(0.01 * sr)
    n = len(a) // win
    quiet = np.zeros(n, dtype=bool)
    for k in range(n):
        seg = a[k * win:(k + 1) * win]
        quiet[k] = (20 * math.log10(
            float(np.sqrt((seg ** 2).mean())) + 1e-9) < thresh_db)
    out = []
    k = 0
    while k < n:
        if quiet[k]:
            j = k
            while j < n and quiet[j]:
                j += 1
            dur = (j - k) * 0.01
            if dur >= min_s:
                out.append((round(k * 0.01, 2), round(j * 0.01, 2),
                            round(dur, 2)))
            k = j
        else:
            k += 1
    return out


def energy_db(a: np.ndarray, sr: int, t0: float, t1: float) -> float:
    i0, i1 = max(0, int(t0 * sr)), min(len(a), int(t1 * sr))
    if i1 <= i0:
        return -120.0
    seg = a[i0:i1]
    return 20 * math.log10(float(np.sqrt((seg ** 2).mean())) + 1e-9)


def peak_db(a: np.ndarray, sr: int, t0: float, t1: float) -> float:
    i0, i1 = max(0, int(t0 * sr)), min(len(a), int(t1 * sr))
    if i1 <= i0:
        return -120.0
    return 20 * math.log10(float(np.abs(a[i0:i1]).max()) + 1e-9)


def harmonicity(a: np.ndarray, sr: int, t0: float, t1: float) -> float:
    """Armonicidad (0-1) del tramo: >0,4 = voz sonora, <0,4 = ruido.

    Máxima autocorrelación normalizada en lags de 3-12 ms (periodo de
    pitch). Distingue voz descartada (FAIL) de respiros/clics (INFO).
    """
    seg = a[int(t0 * sr):int(t1 * sr)].astype(np.float64)
    if len(seg) < 500:
        return 0.0
    seg = seg - seg.mean()
    if float(np.sqrt((seg ** 2).mean())) < 1e-4:
        return 0.0
    ac = np.correlate(seg, seg, mode="full")[len(seg) - 1:]
    ac /= (ac[0] + 1e-12)
    return float(ac[int(0.003 * sr):int(0.012 * sr) + 1].max())


def acoustic_span(a: np.ndarray, sr: int, t0: float, t1: float,
                  thresh_db: float = -40.0) -> tuple:
    """(onset, offset) acústicos dentro de [t0, t1] en ventanas de 10 ms.

    El onset exige 2 ventanas CONSECUTIVAS sobre el umbral (20 ms
    sostenidos): un blip aislado (chasquido de boca, respiración) no
    es un onset. Devuelve (None, None) si no hay energía sostenida.
    """
    win = int(0.01 * sr)
    i0, i1 = max(0, int(t0 * sr)), min(len(a), int(t1 * sr))
    k0, k1 = i0 // win, max(i0 // win + 1, i1 // win)
    above = []
    for k in range(k0, k1):
        seg = a[k * win:(k + 1) * win]
        db = 20 * math.log10(float(np.sqrt((seg ** 2).mean())) + 1e-9)
        above.append(db >= thresh_db)
    on = off = None
    for j in range(len(above) - 1):
        if above[j] and above[j + 1]:
            on = (k0 + j) * 0.01
            break
    for j in range(len(above) - 1, 0, -1):
        if above[j] and above[j - 1]:
            off = (k0 + j + 1) * 0.01
            break
    return on, off


def voiced_span(a: np.ndarray, sr: int, t0: float, t1: float,
                thresh_db: float = -40.0, harm_min: float = 0.4,
                loud_db: float = -28.0) -> tuple:
    """(onset, offset) de voz dentro de [t0, t1], en ventanas de 20 ms.

    Una ventana cuenta como voz si RMS > thresh_db Y (armonicidad >
    harm_min O RMS > loud_db): los respiros entre palabras superan
    -40 dB (hasta -34 dB, armonicidad hasta 0,32) pero no son voz, y
    medir la pausa con energía pura los cuenta como fin de pausa (la
    pausa «Hoy,» -> «en» mide 0,24 s en vez de 0,35 s); la rama
    «fuerte» (RMS > -28 dB) rescata colas de vocal que decaen con
    armonicidad oscilante (0,31-0,58 en «para», L5) sin rescatar
    respiros (siempre por debajo de -34 dB). Solo cuentan las
    ventanas cuyo CENTRO cae dentro de [t0, t1]: sin esto, la rejilla
    de 20 ms filtra la cola de la palabra anterior en la ventana de
    onset (hasta 20 ms de fuga). El onset exige 2 ventanas
    consecutivas; el offset es el fin de la última ventana sonora
    con vecina sonora. Devuelve (None, None) si no hay voz
    sostenida. Caveat: un inicio de palabra sordo (fricativa /
    plosiva) retrasa el onset hasta la primera vocal (hasta
    ~0,05 s), así que la pausa medida puede sobreestimar la real
    en ese margen; el criterio de pérdida (>50%) no se ve afectado
    porque el sesgo aplica igual al original y a la editada.
    """
    win = int(0.02 * sr)
    i0, i1 = max(0, int(t0 * sr)), min(len(a), int(t1 * sr))
    k0, k1 = i0 // win, max(i0 // win + 1, i1 // win)
    voiced = []
    starts = []
    for k in range(k0, k1):
        center = (k + 0.5) * 0.02
        if center < t0 or center > t1:
            continue
        seg = a[k * win:(k + 1) * win]
        db = 20 * math.log10(float(np.sqrt((seg ** 2).mean())) + 1e-9)
        if db <= thresh_db:
            voiced.append(False)
        elif db > loud_db:
            voiced.append(True)
        else:
            voiced.append(harmonicity(a, sr, k * 0.02, (k + 1) * 0.02)
                          > harm_min)
        starts.append(k * 0.02)
    on = off = None
    for j in range(len(voiced) - 1):
        if voiced[j] and voiced[j + 1]:
            on = starts[j]
            break
    for j in range(len(voiced) - 1, 0, -1):
        if voiced[j] and voiced[j - 1]:
            off = starts[j] + 0.02
            break
    return on, off


def voiced_fraction(a: np.ndarray, sr: int, t0: float, t1: float,
                    thresh_db: float = -40.0, harm_min: float = 0.4,
                    loud_db: float = -28.0) -> float:
    """Fracción de ventanas de 20 ms con voz dentro de [t0, t1].

    Misma regla que voiced_span (RMS > thresh_db y armonicidad >
    harm_min o RMS > loud_db). Sirve para decidir si en un hueco
    entre captions hay voz real o solo tono de sala/respiros.
    """
    win = int(0.02 * sr)
    i0, i1 = max(0, int(t0 * sr)), min(len(a), int(t1 * sr))
    k0, k1 = i0 // win, max(i0 // win + 1, i1 // win)
    n = v = 0
    for k in range(k0, k1):
        center = (k + 0.5) * 0.02
        if center < t0 or center > t1:
            continue
        n += 1
        seg = a[k * win:(k + 1) * win]
        db = 20 * math.log10(float(np.sqrt((seg ** 2).mean())) + 1e-9)
        if db <= thresh_db:
            continue
        if db > loud_db or harmonicity(a, sr, k * 0.02,
                                       (k + 1) * 0.02) > harm_min:
            v += 1
    return v / n if n else 0.0


def stft_mag(a: np.ndarray, sr: int, nperseg: int = 2048,
             hop: int = 512) -> np.ndarray:
    """Magnitud del STFT (frecuencias x tramas), ventana Hann."""
    from scipy.signal import stft as _stft
    _f, _t, z = _stft(a, fs=sr, window="hann", nperseg=nperseg,
                      noverlap=nperseg - hop, boundary=None, padded=False)
    return np.abs(z)


def spectral_flux(mag: np.ndarray) -> np.ndarray:
    """Flujo espectral por trama (suma de incrementos positivos)."""
    d = np.diff(mag, axis=1)
    return np.sqrt((np.maximum(d, 0) ** 2).sum(axis=0))


def ebur128(path: str) -> tuple:
    out = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", path,
         "-af", "ebur128=peak=true", "-f", "null", "-"],
        capture_output=True, text=True, check=True, timeout=300).stderr
    summary = out[out.rfind("Summary:"):]
    def val(key):
        m = re.search(key + r"\s*:\s*(-inf|[-+]?[\d.]+)", summary)
        return float(m.group(1)) if m else float("nan")
    return val("I"), val("Peak")


def ffprobe_json(path: str) -> dict:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-count_frames",
         "-show_entries",
         "stream=codec_type,codec_name,width,height,nb_read_frames",
         "-show_entries", "format=duration", "-of", "json", path],
        capture_output=True, text=True, check=True, timeout=300).stdout
    return json.loads(out)


def transcribe_whisper(wav16k: str, model: str = WHISPER_MODEL) -> list:
    """Transcribe con faster-whisper (venv) -> [{w, s, e}].
    Con vad_filter=True: sin VAD, un segmento vacío (cola de tono de
    sala del máster) rompe la alineación DTW de word_timestamps
    (IndexError en find_alignment, faster-whisper) y la auditoría
    final cae. El VAD descarta el no-habla y los tiempos se mapean
    de vuelta a la línea de tiempo original."""
    script = (
        "import json, sys\n"
        "from faster_whisper import WhisperModel\n"
        "m = WhisperModel(sys.argv[1], device='cpu', compute_type='int8',\n"
        "                 local_files_only=True)\n"
        "segs, _ = m.transcribe(sys.argv[2], language='es',\n"
        "                       word_timestamps=True, vad_filter=True)\n"
        "words = []\n"
        "for s in segs:\n"
        "    for w in s.words:\n"
        "        words.append({'w': w.word.strip(), 's': round(w.start, 3),\n"
        "                      'e': round(w.end, 3)})\n"
        "json.dump(words, open(sys.argv[3], 'w'), ensure_ascii=False)\n"
    )
    with tempfile.TemporaryDirectory() as td:
        sp = os.path.join(td, "tw.py")
        op = os.path.join(td, "words.json")
        open(sp, "w").write(script)
        subprocess.run([WHISPER_VENV, sp, model, wav16k, op],
                       check=True, capture_output=True, timeout=600)
        return json.load(open(op))


def load_whisper_file(path: str) -> list:
    """Lee una transcripción con word_timestamps (tolera cabecera)."""
    raw = open(path, encoding="utf-8").read()
    segs = json.loads(raw[raw.index("["):])
    words = []
    for s in segs:
        for w in s["words"]:
            words.append({"w": w["w"], "s": w["s"], "e": w["e"]})
    return words


# ---------------- informe ----------------

class Report:
    def __init__(self, project: str):
        self.project = project
        self.findings = []  # {check, sev, t, msg}
        self.metrics = {}

    def add(self, check: str, sev: str, msg: str, t=None):
        assert sev in ("PASS", "WARN", "FAIL", "INFO")
        self.findings.append({"check": check, "sev": sev, "t": t,
                              "msg": msg})

    def counts(self):
        c = {"PASS": 0, "WARN": 0, "FAIL": 0, "INFO": 0}
        for f in self.findings:
            c[f["sev"]] += 1
        return c

    def overall(self):
        c = self.counts()
        if c["FAIL"]:
            return "FAIL"
        if c["WARN"]:
            return "WARN"
        return "PASS"


# ---------------- chequeos ----------------

def check_a_script_karaoke(rep: Report, vo_lines: list, captions: list):
    """(a) Cada palabra del guion aparece en karaoke 1 vez, en orden."""
    expected = []
    for ln in vo_lines:
        for tok in ln["text"].split():
            expected.append(tok)
    got = [c["text"].strip() for c in captions]
    exp_n = [norm_word(t) for t in expected]
    got_n = [norm_word(t) for t in got]
    rep.metrics["a_script_words"] = len(expected)
    rep.metrics["a_caption_words"] = len(got)
    sm = difflib.SequenceMatcher(a=exp_n, b=got_n, autojunk=False)
    n_bad = 0
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            continue
        n_bad += (i2 - i1) + (j2 - j1)
        if tag == "delete":
            for k in range(i1, i2):
                rep.add("a", "FAIL",
                        f"palabra del guion FALTANTE en karaoke: "
                        f"{expected[k]!r} (línea {k})")
        elif tag == "insert":
            for k in range(j1, j2):
                rep.add("a", "FAIL",
                        f"palabra en karaoke SIN guion (duplicada o extra): "
                        f"{got[k]!r} @ {captions[k]['startMs'] / 1000:.2f}s",
                        t=captions[k]["startMs"] / 1000)
        else:  # replace: fuera de orden o texto distinto
            rep.add("a", "FAIL",
                    f"desajuste guion<->karaoke: guion "
                    f"{expected[i1:i2]} vs karaoke {got[j1:j2]} "
                    f"@ {captions[j1]['startMs'] / 1000:.2f}s"
                    if j1 < len(captions) else "al final",
                    t=(captions[j1]["startMs"] / 1000
                       if j1 < len(captions) else None))
    if n_bad == 0:
        rep.add("a", "PASS",
                f"guion<->karaoke 1:1 en orden ({len(expected)} palabras)")


def check_b_caption_timing(rep: Report, captions: list, edited_vo,
                           sr: int, silences: list):
    """(b) Tiempos de caption: duraciones, solapes, huecos, visualización.

    NOTA: BottomKaraoke solo lee los inicios (`s`); la duración (e-s)
    NO afecta a la visualización. Las duraciones cortas se reportan
    como WARN (importan para SRT/otros consumidores), no como FAIL.
    Lo que sí es defecto visual: inicios no monótonos y palabras cuya
    visualización (inicio a inicio) es <0,10 s (el pop de 0,1 s se
    corta) o cuyo inicio no coincide con el onset acústico.
    """
    n_short = n_overlap = n_disp = 0
    prev_s = -1.0
    for i, c in enumerate(captions):
        s, e = c["startMs"] / 1000, c["endMs"] / 1000
        dur = round(e - s, 3)  # redondeo a ms (evita 0,1799999 < 0,18)
        if s < prev_s - 1e-6:
            rep.add("b", "FAIL",
                    f"inicio NO monótono: {c['text'].strip()!r} @ {s:.2f}s "
                    f"antes que la palabra anterior",
                    t=s)
        prev_s = s
        if dur < MIN_CAPTION_S:
            n_short += 1
            rep.add("b", "WARN",
                    f"caption corto ({dur:.3f}s < {MIN_CAPTION_S}s): "
                    f"{c['text'].strip()!r} @ {s:.2f}s "
                    f"[sin efecto visual en BottomKaraoke; importa en SRT]",
                    t=s)
        if i + 1 < len(captions):
            ns = captions[i + 1]["startMs"] / 1000
            if e > ns + 1e-6:
                n_overlap += 1
                rep.add("b", "WARN",
                        f"solape {e - ns:.3f}s: {c['text'].strip()!r} "
                        f"(fin {e:.2f}s) con "
                        f"{captions[i + 1]['text'].strip()!r} "
                        f"(inicio {ns:.2f}s)",
                        t=s)
            disp = ns - s
            if disp < MIN_DISPLAY_S:
                n_disp += 1
                rep.add("b", "WARN",
                        f"visualización corta ({disp:.3f}s): "
                        f"{c['text'].strip()!r} @ {s:.2f}s — el pop "
                        f"de 0,1 s se corta antes de terminar",
                        t=s)
            gap = ns - e
            if gap > GAP_CLASSIFY_S:
                # Hueco ENTRE chunks (fin de línea visible): el karaoke
                # NO se apaga — BottomKaraoke es «pegajoso» y la línea
                # anterior queda visible hasta que empieza la siguiente.
                # Solo es defecto un hueco DENTRO de un chunk.
                if c.get("pageBreakAfter"):
                    rep.add("b", "INFO",
                            f"hueco {gap:.2f}s entre chunks: "
                            f"{c['text'].strip()!r} -> "
                            f"{captions[i + 1]['text'].strip()!r} "
                            f"({e:.2f}-{ns:.2f}s): cambio de línea, "
                            f"la anterior queda visible (pegajoso)",
                            t=e)
                    continue
                # ¿El hueco está cubierto por silencio de VO? Se exige
                # que el silencio cubra >=70% del hueco (los bordes de
                # Whisper y del detector difieren ~0,05-0,08 s). Si el
                # mapa de silencios (-45 dB) no lo cubre, se comprueba
                # si hay VOZ real en el hueco: un tono de sala de
                # -41 dB no es silencio para el detector pero tampoco
                # es voz (L9 V2.3: hueco LEER.->PENSAR. con 0% de
                # cobertura y 0% de voz — la pregunta del check es si
                # suena voz mientras el karaoke está quieto, no si el
                # tono de sala supera -45 dB).
                overlap = 0.0
                for gs, ge, _ in silences:
                    overlap += max(0.0, min(ge, ns) - max(gs, e))
                if overlap >= 0.7 * gap:
                    rep.add("b", "INFO",
                            f"hueco {gap:.2f}s entre "
                            f"{c['text'].strip()!r} y "
                            f"{captions[i + 1]['text'].strip()!r} "
                            f"({e:.2f}-{ns:.2f}s): en pausa de VO, esperado",
                            t=e)
                    continue
                vf = voiced_fraction(edited_vo, sr, e, ns)
                if vf <= 0.30:
                    rep.add("b", "INFO",
                            f"hueco {gap:.2f}s entre "
                            f"{c['text'].strip()!r} y "
                            f"{captions[i + 1]['text'].strip()!r} "
                            f"({e:.2f}-{ns:.2f}s): en pausa de VO "
                            f"(sin voz: solo {vf:.0%} sonoro; el tono "
                            f"de sala supera -45 dB pero no hay voz)",
                            t=e)
                    continue
                rep.add("b", "FAIL",
                        f"hueco {gap:.2f}s entre "
                        f"{c['text'].strip()!r} y "
                        f"{captions[i + 1]['text'].strip()!r} "
                        f"({e:.2f}-{ns:.2f}s) CON VOZ ENCIMA "
                        f"(solo {overlap / gap:.0%} cubierto por "
                        f"silencio; voz en el {vf:.0%} del hueco): "
                        f"el karaoke se apaga en medio de la frase",
                        t=e)
    # Fin de caption vs fin acústico de la palabra (VO editada).
    n_end_off = 0
    for i, c in enumerate(captions):
        s, e = c["startMs"] / 1000, c["endMs"] / 1000
        nxt = (captions[i + 1]["startMs"] / 1000
               if i + 1 < len(captions) else e + 0.4)
        _on, off = acoustic_span(edited_vo, sr, s, min(nxt, e + 0.3))
        if off is not None and abs(off - e) > SYNC_MAX_S:
            n_end_off += 1
            rep.add("b", "WARN",
                    f"fin de caption {e:.2f}s vs fin acústico "
                    f"{off:.2f}s ({off - e:+.2f}s): "
                    f"{c['text'].strip()!r}",
                    t=s)
    rep.metrics["b_short_captions"] = n_short
    rep.metrics["b_overlaps"] = n_overlap
    rep.metrics["b_short_display"] = n_disp
    rep.metrics["b_end_mismatch"] = n_end_off
    if n_short == 0 and n_overlap == 0 and n_disp == 0:
        rep.add("b", "PASS", "tiempos de caption sin incidencias")


def check_c_vo_integrity(rep: Report, orig_vo, edited_vo, sr: int,
                         orig_words: list, pred_words: list, plan: dict):
    """(c) Integridad de la VO editada vs la original.

    - Energía en cada frontera de edición EN EL ORIGINAL: si hay habla
      audible en el punto de corte, el corte trunca la palabra.
    - Duración acústica por palabra vs original/factor (compresión
      >20% = palabra exprimida o truncada).
    - Discontinuidades SOLO en los empalmes (método por borde: salto
      en ±3 ms vs p99,9 del entorno ±200 ms).
    """
    if plan is None:
        rep.add("c", "INFO", "sin plan de edición: se omiten las "
                "fronteras de corte y los empalmes")
        return
    pad = plan.get("pad", 0.03)
    # Factores por línea para la comparación de duraciones.
    factor_by_line = {ln["linea"]: ln["factor_uniforme"]
                      for ln in plan["lines"]}
    # 1) Energía en el LADO DESCARTADO de cada corte (tiempo original).
    # El corte de inicio está en word_start - PAD: si hay habla en los
    # 50 ms ANTES del corte, la cabeza de la palabra quedó fuera.
    # El corte de fin está en word_end + PAD: si hay habla en los 50 ms
    # DESPUÉS del corte, la cola quedó fuera. (Medir ±50 ms ALREDEDOR
    # del corte es un error: incluye la palabra dentro del segmento.)
    # La clasificación usa RMS + ARMONICIDAD: un pico alto aislado es
    # un clic (descartarlo es bueno); un respiro fuerte (RMS alto,
    # armonicidad baja) tampoco es voz. Solo la voz sonora descartada
    # (RMS > -45 dB y armonicidad > 0,4) es FAIL.
    n_cut = 0
    failed_cuts = set()  # tiempos editados de cortes con voz descartada
    for ln in plan["lines"]:
        for sg in ln["segs"]:
            for label, t0, t1, te in (
                    ("inicio", sg["orig_start"] - 0.05, sg["orig_start"],
                     sg["edited_start"]),
                    ("fin", sg["orig_end"], sg["orig_end"] + 0.05,
                     sg["edited_end"])):
                r = energy_db(orig_vo, sr, t0, t1)
                if r <= -45.0:
                    continue
                h = harmonicity(orig_vo, sr, t0, t1)
                if h > 0.4:
                    n_cut += 1
                    failed_cuts.add(round(te, 2))
                    rep.add("c", "FAIL",
                            f"corte L{ln['linea']} {label} @ orig "
                            f"{sg['orig_start'] if label == 'inicio' else sg['orig_end']:.2f}s: "
                            f"VOZ descartada (RMS {r:.1f} dBFS, "
                            f"armonicidad {h:.2f} en los 50 ms "
                            f"{'previos' if label == 'inicio' else 'siguientes'}): "
                            f"{'cabeza' if label == 'inicio' else 'cola'} "
                            f"de palabra truncada",
                            t=te)
                else:
                    rep.add("c", "INFO",
                            f"corte L{ln['linea']} {label}: se descartó "
                            f"respiro/ruido (RMS {r:.1f} dBFS, "
                            f"armonicidad {h:.2f}) — correcto, no es voz",
                            t=te)
    rep.metrics["c_cuts_inside_speech"] = n_cut
    # 2) Discontinuidades en los empalmes (tiempo editado).
    n_splice = 0
    d = np.abs(np.diff(edited_vo))
    for ln in plan["lines"]:
        for sg in ln["segs"]:
            for label, te in (("inicio", sg["edited_start"]),
                              ("fin", sg["edited_end"])):
                i = int(te * sr)
                lo, hi = max(0, i - int(0.003 * sr)), min(
                    len(d), i + int(0.003 * sr))
                blo, bhi = max(0, i - int(0.2 * sr)), min(
                    len(d), i + int(0.2 * sr))
                if hi <= lo or bhi <= blo:
                    continue
                base = np.percentile(d[blo:bhi], 99.9)
                worst = d[lo:hi].max() if hi > lo else 0.0
                if worst > SPLICE_RATIO * max(base, 1e-4):
                    n_splice += 1
                    rep.add("c", "FAIL",
                            f"discontinuidad en empalme L{ln['linea']} "
                            f"{label} @ {te:.3f}s: salto {worst:.4f} "
                            f"vs baseline p99,9 {base:.4f} "
                            f"(ratio {worst / max(base, 1e-4):.1f}x)",
                            t=te)
    rep.metrics["c_splice_clicks"] = n_splice
    # 3) Duración ACÚSTICA por palabra: editada vs original/factor.
    # Los intervalos de Whisper incluyen a menudo silencio entre
    # palabras; comparar duraciones de intervalo da falsos positivos.
    # Se mide el intervalo acústico (onset->offset a -40 dB) en AMBOS
    # audios y se compara eso.
    line_spans = []
    seg_spans = []  # (edited_start, edited_end) de cada segmento
    for ln in plan["lines"]:
        s0 = ln["segs"][0]["edited_start"]
        s1 = ln["segs"][-1]["edited_end"]
        line_spans.append((s0, s1, ln["factor_uniforme"], ln["linea"]))
        for sg in ln["segs"]:
            seg_spans.append((sg["edited_start"], sg["edited_end"]))
    n_sq = 0
    n_map = min(len(orig_words), len(pred_words))
    for i in range(n_map):
        ow, pw = orig_words[i], pred_words[i]
        f = 1.0
        for s0, s1, fac, _ln in line_spans:
            if s0 - 0.1 <= pw["s"] <= s1 + 0.1:
                f = fac
                break
        o_on, o_off = acoustic_span(orig_vo, sr, ow["s"] - 0.05,
                                    ow["e"] + 0.05)
        e_on, e_off = acoustic_span(edited_vo, sr, pw["s"] - 0.05,
                                    pw["e"] + 0.05)
        if o_on is None or e_on is None:
            rep.add("c", "WARN",
                    f"palabra sin energía acústica: {pw['w']!r} @ pred "
                    f"{pw['s']:.2f}-{pw['e']:.2f}s",
                    t=pw["s"])
            continue
        exp_dur = (o_off - o_on) / f
        ac_dur = e_off - e_on
        if ac_dur < WORD_SQUEEZE * exp_dur and exp_dur > 0.08:
            n_sq += 1
            rep.add("c", "FAIL",
                    f"palabra exprimida/truncada: {pw['w']!r} @ "
                    f"{pw['s']:.2f}s — acústica {ac_dur:.2f}s vs "
                    f"esperada {exp_dur:.2f}s (orig acústica "
                    f"{o_off - o_on:.2f}s / factor {f})",
                    t=pw["s"])
        # Onset tardío: ¿cabeza cortada o onset natural silencioso?
        # Se distingue por la RAMPA: si la energía pasa de <-55 dB a
        # >-25 dB en <20 ms (salto brusco desde silencio digital),
        # la cabeza puede estar cortada; si hay rampa gradual
        # (fricativa/glide), es onset natural. Umbral -50 dB para
        # cazar fricativas (/f/, /s/) y glides (/y/).
        on50, _off50 = acoustic_span(edited_vo, sr, pw["s"] - 0.05,
                                     pw["e"] + 0.05, thresh_db=-50.0)
        if on50 is not None and on50 - pw["s"] > 0.15:
            pre = energy_db(edited_vo, sr, on50 - 0.05, on50)
            post = energy_db(edited_vo, sr, on50, on50 + 0.02)
            if pre < -55.0 and post - pre > 15.0:
                # ¿El corte de inicio de ESTE segmento descartó voz?
                # Solo entonces el ataque brusco es sospechoso: los
                # glides (/y/) y plosivas tras una pausa atacan rápido
                # de forma natural.
                seg_start = None
                for s0, s1 in seg_spans:
                    if s0 - 0.1 <= pw["s"] <= s1 + 0.1:
                        seg_start = s0
                        break
                cut_failed = seg_start is not None and any(
                    abs(seg_start - fc) < 0.15 for fc in failed_cuts)
                if cut_failed:
                    rep.add("c", "WARN",
                            f"onset BRUSCO +{on50 - pw['s']:.2f}s: "
                            f"{pw['w']!r} @ {pw['s']:.2f}s salta de "
                            f"{pre:.0f} a {post:.0f} dBFS y el corte de "
                            f"ese segmento descartó voz — posible cabeza "
                            f"cortada (revisar el corte)",
                            t=pw["s"])
                else:
                    rep.add("c", "INFO",
                            f"onset brusco +{on50 - pw['s']:.2f}s "
                            f"(ataque rápido natural): {pw['w']!r} @ "
                            f"{pw['s']:.2f}s — el corte de ese segmento "
                            f"no descartó voz; la palabra está completa",
                            t=pw["s"])
            else:
                rep.add("c", "INFO",
                        f"onset tardío +{on50 - pw['s']:.2f}s (rampa "
                        f"natural): {pw['w']!r} @ {pw['s']:.2f}s — "
                        f"Whisper adelantó el borde; la palabra está "
                        f"completa",
                        t=pw["s"])
    rep.metrics["c_squeezed_words"] = n_sq
    # 4) Preservación de pausas naturales intra-línea (lección
    # 18-nov-2026, microcorte de L2). Por cada par de palabras
    # consecutivas de la MISMA línea: pausa original (offset ->
    # onset de VOZ SONORA, no de energía pura — los respiros
    # superan -40 dB y no son voz; ver voiced_span) vs pausa
    # editada. FAIL si la editada queda < PAUSE_MIN_S o pierde
    # > PAUSE_MAX_LOSS de su duración. Las pausas naturales ya
    # cortas (< 0,25 s en el original) no son FAIL: la regla
    # protege contra RECORTES, no contra la dicción de la locutora.
    # Las ventanas se extienden hasta 0,10 s (acotado a la mitad
    # del hueco Whisper, para no invadir la palabra vecina) porque
    # los bordes de Whisper caen dentro del intervalo acústico real.
    n_pause = 0
    # Inicios de segmento (tiempo editado): una pausa que cruza un
    # empalme NO es intra-línea. Caso 22-nov-2026 (auditoría v4-pre):
    # 'meses.'->'Vale,' cruza L2->L3 (L3 arranca 0,15 s antes de que
    # termine L2, así que 'Vale,' cae dentro de la tolerancia ±0,1 s
    # del span de L2 y el par se evalúa como intra-L2). El hueco
    # entre tomas es decisión de montaje (ritmo) — lo valida (e) como
    # pausa diseñada —, no una pausa natural que §4 deba proteger:
    # el «original» de 2,32 s incluye el lead-in de sala de la toma
    # L3 (1,1 s), que el montaje recorta por diseño.
    seg_starts = [sg["edited_start"] for ln2 in plan["lines"]
                  for sg in ln2["segs"]]
    for ln in plan["lines"]:
        s0 = ln["segs"][0]["edited_start"]
        s1 = ln["segs"][-1]["edited_end"]
        idx = [i for i in range(n_map)
               if s0 - 0.1 <= pred_words[i]["s"] <= s1 + 0.1]
        for a, b in zip(idx, idx[1:]):
            ow0, ow1 = orig_words[a], orig_words[b]
            pw0, pw1 = pred_words[a], pred_words[b]
            if any(pw0["e"] < st <= pw1["s"] for st in seg_starts):
                continue  # pausa entre tomas/segmentos, no intra-línea
            gap_o = ow1["s"] - ow0["e"]
            gap_e = pw1["s"] - pw0["e"]
            ext_o = min(0.10, max(0.0, gap_o / 2))
            ext_e = min(0.10, max(0.0, gap_e / 2))
            _on, o_off = voiced_span(orig_vo, sr, ow0["s"] - 0.05,
                                     ow0["e"] + ext_o)
            o_on, _off = voiced_span(orig_vo, sr, ow1["s"] - ext_o,
                                     ow1["e"] + 0.05)
            _on, e_off = voiced_span(edited_vo, sr, pw0["s"] - 0.05,
                                     pw0["e"] + ext_e)
            e_on, _off = voiced_span(edited_vo, sr, pw1["s"] - ext_e,
                                     pw1["e"] + 0.05)
            if None in (o_off, o_on, e_off, e_on):
                continue
            o_gap = o_on - o_off
            e_gap = e_on - e_off
            if o_gap < PAUSE_MIN_S:
                continue
            if e_gap < PAUSE_MIN_S or e_gap < (1 - PAUSE_MAX_LOSS) * o_gap:
                n_pause += 1
                rep.add("c", "FAIL",
                        f"pausa natural recortada L{ln['linea']}: "
                        f"{ow0['w']!r} -> {ow1['w']!r} — original "
                        f"{o_gap:.2f}s, editada {e_gap:.2f}s "
                        f"(pérdida {100 * (1 - e_gap / o_gap):.0f}%)",
                        t=pw0["e"])
    rep.metrics["c_pause_fails"] = n_pause
    if n_cut == 0 and n_splice == 0 and n_sq == 0 and n_pause == 0:
        rep.add("c", "PASS", "VO íntegra: cortes en silencio, empalmes "
                "limpios, sin palabras exprimidas")


def check_d_stretch(rep: Report, edited_vo, sr: int, plan: dict):
    """(d) Artefactos de time-stretch: flujo espectral en uniones."""
    if plan is None:
        rep.add("d", "INFO", "sin plan de edición: no se puede localizar "
                "los segmentos con tempo")
        return
    mag = stft_mag(edited_vo, sr)
    flux = spectral_flux(mag)
    hop_s = 512 / sr  # ~10,7 ms por trama
    stretched = [ln for ln in plan["lines"]
                 if ln["factor_uniforme"] > 1.001]
    plain = [ln for ln in plan["lines"]
             if ln["factor_uniforme"] <= 1.001]
    if not stretched:
        rep.add("d", "PASS", "ninguna línea con tempo != 1 (sin stretch)")
        return
    # Baseline de flujo dentro de segmentos SIN stretch.
    base_vals = []
    for ln in plain:
        for sg in ln["segs"]:
            a = int((sg["edited_start"] + 0.05) / hop_s)
            b = int((sg["edited_end"] - 0.05) / hop_s)
            if b > a:
                base_vals.extend(flux[a:b].tolist())
    base_med = float(np.median(base_vals)) if base_vals else 0.0
    base_p90 = float(np.percentile(base_vals, 90)) if base_vals else 0.0
    rep.metrics["d_flux_baseline_median"] = round(base_med, 4)
    rep.metrics["d_flux_baseline_p90"] = round(base_p90, 4)
    # Smearing del time-stretch: la energía en el HUECO adyacente a un
    # segmento con stretch (30 ms antes de su inicio y después de su
    # fin, sin invadir el segmento vecino) debe ser solo tono de sala
    # (<= -55 dBFS). WSOLA/atempo puede «manchar» el onset/offset más
    # allá del punto de corte. (La versión anterior medía la guarda
    # DENTRO del segmento, pero en V1.5 la guarda contiene la caída
    # natural de la palabra por diseño — no es manchado.)
    n_smear = 0
    total_len = len(edited_vo) / sr
    all_segs = [(sg["edited_start"], sg["edited_end"])
                for ln in plan["lines"] for sg in ln["segs"]]
    all_segs.sort()
    for ln in stretched:
        f = ln["factor_uniforme"]
        for sg in ln["segs"]:
            es, ee = sg["edited_start"], sg["edited_end"]
            prev_end = max([pe for _ps, pe in all_segs if pe <= es + 1e-6],
                           default=0.0)
            next_start = min([ps for ps, _pe in all_segs if ps >= ee - 1e-6],
                             default=total_len)
            w_pre = min(0.03, es - prev_end)
            w_post = min(0.03, next_start - ee)
            if w_pre >= 0.015:
                pre_db = energy_db(edited_vo, sr, es - w_pre, es)
                if pre_db > -55.0:
                    n_smear += 1
                    rep.add("d", "WARN",
                            f"manchado del stretch en el hueco PREVIO "
                            f"L{ln['linea']} @ {es:.2f}s "
                            f"(factor {f}): {pre_db:.1f} dBFS en los "
                            f"{w_pre * 1000:.0f} ms antes del segmento "
                            f"(debería ser solo tono de sala)",
                            t=es)
            if w_post >= 0.015:
                post_db = energy_db(edited_vo, sr, ee, ee + w_post)
                if post_db > -55.0:
                    n_smear += 1
                    rep.add("d", "WARN",
                            f"manchado del stretch en el hueco POSTERIOR "
                            f"L{ln['linea']} @ {ee:.2f}s "
                            f"(factor {f}): {post_db:.1f} dBFS en los "
                            f"{w_post * 1000:.0f} ms tras el segmento",
                            t=ee)
    rep.metrics["d_pad_smear"] = n_smear
    # Rugosidad global del segmento con stretch vs baseline.
    for ln in stretched:
        f = ln["factor_uniforme"]
        seg_flux = []
        for sg in ln["segs"]:
            a = int((sg["edited_start"] + 0.05) / hop_s)
            b = int((sg["edited_end"] - 0.05) / hop_s)
            if b > a:
                seg_flux.extend(flux[a:b].tolist())
        med = float(np.median(seg_flux)) if seg_flux else 0.0
        if base_med > 0 and med > 2.0 * base_med:
            rep.add("d", "WARN",
                    f"L{ln['linea']} (factor {f}): flujo espectral "
                    f"mediano {med:.2f} vs baseline sin stretch "
                    f"{base_med:.2f} ({med / base_med:.1f}x) — "
                    f"posible aspereza de time-stretch",
                    t=ln["slot"])
    # Periodicidad WSOLA: autocorrelación del flujo en 8-30 ms, con
    # baseline en segmentos SIN stretch (el habla sonora ya es
    # periódica; lo que delata a WSOLA es el EXCESO sobre el baseline).
    def periodicity(lines):
        vals = []
        for ln in lines:
            for sg in ln["segs"]:
                a = int((sg["edited_start"] + 0.05) / hop_s)
                b = int((sg["edited_end"] - 0.05) / hop_s)
                seg = flux[a:b]
                if len(seg) < 20:
                    continue
                seg = seg - seg.mean()
                ac = np.correlate(seg, seg, mode="full")[len(seg) - 1:]
                ac /= (ac[0] + 1e-12)
                lo_lag = max(1, int(0.008 / hop_s))
                hi_lag = int(0.030 / hop_s)
                vals.append(float(ac[lo_lag:hi_lag + 1].max()))
        return vals
    ac_str = periodicity(stretched)
    ac_plain = periodicity(plain)
    if ac_str:
        rep.metrics["d_wsola_periodicity_max"] = round(max(ac_str), 3)
        rep.metrics["d_wsola_periodicity_plain_max"] = round(
            max(ac_plain), 3) if ac_plain else None
        plain_max = max(ac_plain) if ac_plain else 0.0
        if max(ac_str) > 0.5 and max(ac_str) > plain_max + 0.2:
            rep.add("d", "WARN",
                    f"periodicidad de flujo 8-30 ms = {max(ac_str):.2f} "
                    f"en segmentos con stretch vs {plain_max:.2f} sin "
                    f"stretch (típico de WSOLA/atempo; Rubber Band "
                    f"debería bajarlo)")
    if n_smear == 0:
        rep.add("d", "PASS", "sin manchado del time-stretch en las "
                "guardas de los segmentos")


def check_e_silences(rep: Report, edited_vo, sr: int, plan: dict,
                     vo_lines: list):
    """(e) Mapa de silencios: pausas >=0,25 s clasificadas."""
    sil = find_silences(edited_vo, sr)
    rep.metrics["e_silences"] = [(s, e, d) for s, e, d in sil]
    # Intervalos de pausa DISEÑADOS: huecos entre sub-segmentos y entre
    # líneas (del plan de edición, en tiempo editado), MÁS los huecos
    # internos de los segmentos fusionados (la transición natural
    # conservada tiene su propio silencio).
    designed = []
    if plan is not None:
        for ln in plan["lines"]:
            segs = ln["segs"]
            for i in range(len(segs) - 1):
                designed.append((segs[i]["edited_end"],
                                 segs[i + 1]["edited_start"], "intra-línea"))
            if ln["linea"] > 1:
                prev = plan["lines"][ln["linea"] - 2]
                ds, de = (prev["segs"][-1]["edited_end"],
                          segs[0]["edited_start"])
                # Los segmentos pueden solaparse (L3 arranca 0,15 s antes
                # de que termine L2: intervalo invertido): normalizar.
                # Sin esto, la pausa L2->L3 (26,44 s) no casa con ningún
                # hueco diseñado y (e) da FAIL espurio (auditoría v3).
                designed.append((min(ds, de), max(ds, de), "entre-líneas"))
            for gs, ge in ln.get("merged_gaps", []):
                designed.append((gs, ge, "fusión"))
            # Pausas de prosodia: silencios de la toma única, verificados
            # en el original (no son ediciones). Ver research/vo/
            # prosody-gaps.json (auditoría v3, 22-nov-2026).
            for gs, ge in ln.get("prosody_gaps", []):
                designed.append((gs, ge, "prosodia"))
    n_unexp = 0
    total_dur = len(edited_vo) / sr
    for s, e, d in sil:
        if s <= 0.01:
            rep.add("e", "INFO",
                    f"silencio inicial {d:.2f}s @ {s:.2f}-{e:.2f}s "
                    f"(lead-in antes de la primera palabra)",
                    t=s)
            continue
        if e >= total_dur - 0.1:
            rep.add("e", "INFO",
                    f"silencio final {d:.2f}s @ {s:.2f}-{e:.2f}s "
                    f"(outro musical tras la última palabra)",
                    t=s)
            continue
        # La pausa es "diseñada" si EMPIEZA en un hueco del plan (la
        # pausa real suele durar más que el hueco diseñado porque la
        # siguiente palabra arranca tarde acústicamente — eso es un
        # desvío de onset, no una pausa inesperada; lo cubren (c)/(g)).
        # La tolerancia de inicio (0,35 s) cubre el keep de cola del
        # segmento: la palabra termina acústicamente antes del fin del
        # segmento y el resto es tono de sala bajo -45 dB, así que el
        # silencio detectado empieza hasta 0,28 s antes del hueco
        # diseñado (V2.3: keeps de cola 0,20-0,28 s; la tolerancia
        # anterior de 0,12 s daba FAIL espurio en L1->L2 y L2->L3).
        hit = None
        for ds, de, kind in designed:
            if ds - 0.35 <= s <= de + 0.05:
                hit = kind
                break
        dramatic = any(abs(s - dl["end"]) < 0.15
                       for dl in vo_lines) and d >= 0.4
        if hit:
            tag = "dramática" if dramatic else "diseñada"
            rep.add("e", "INFO",
                    f"pausa {d:.2f}s @ {s:.2f}-{e:.2f}s ({tag}, {hit})",
                    t=s)
        else:
            n_unexp += 1
            rep.add("e", "FAIL",
                    f"pausa INESPERADA {d:.2f}s @ {s:.2f}-{e:.2f}s en "
                    f"medio de frase (no está en el plan de edición)",
                    t=s)
        if d > 0.6 and not dramatic:
            rep.add("e", "WARN",
                    f"pausa larga {d:.2f}s @ {s:.2f}s sin ser dramática",
                    t=s)
    rep.metrics["e_unexpected_pauses"] = n_unexp
    if n_unexp == 0:
        rep.add("e", "PASS", f"mapa de silencios: {len(sil)} pausas, "
                "todas diseñadas")
    return sil


def build_music_bed(sections, seconds: float, music_volume: float,
                    xfade: float, end_fade: float, sr: int = SR) -> np.ndarray:
    """Reconstruye la cama musical SIN ducking (misma cadena que mix.py).

    sections: [(path, start, end), ...].
    """
    inputs, filt, labels = [], [], []
    for j, (path, start, end) in enumerate(sections):
        inputs += ["-i", path]
        lb = f"sec{j}"
        chain = (f"[{j}:a]aresample=48000,adelay={int(start * 1000)}")
        if start > 0:
            chain += f",afade=t=in:st={start}:d={xfade}"
        if j < len(sections) - 1:
            chain += f",afade=t=out:st={end - xfade}:d={xfade}"
        elif end_fade > 0:
            chain += f",afade=t=out:st={end - end_fade}:d={end_fade}"
        chain += f",apad=whole_dur={seconds},atrim=0:{seconds}[{lb}]"
        filt.append(chain)
        labels.append(lb)
    if len(labels) > 1:
        joined = "".join(f"[{lb}]" for lb in labels)
        filt.append(f"{joined}amix=inputs={len(labels)}:duration=first:"
                    f"normalize=0,volume={music_volume}[m]")
    else:
        filt.append(f"[{labels[0]}]volume={music_volume}[m]")
    cmd = ["ffmpeg", "-y", "-v", "error", "-nostdin", *inputs,
           "-filter_complex", ";".join(filt), "-map", "[m]",
           "-ar", str(sr), "-ac", "1", "-f", "f32le", "-"]
    out = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype=np.float32)


def check_f_music(rep: Report, mix, bed, edited_vo, sr: int,
                  silences: list, sections, xfade: float,
                  duck_release: float, duck_threshold: float,
                  duck_ratio: float, sfx_times: list):
    """(f) Música: suelo RMS, crossfade, recuperación y bombeo del ducking."""
    # 1) Suelo RMS de la mezcla en ventanas de 0,25 s.
    curve = rms_windows(mix, sr, 0.25)
    rep.metrics["f_mix_rms_curve"] = [(round(t, 2), round(db, 1))
                                      for t, db in curve]
    # Pausas dramáticas (exentas del suelo): tras «Ganamos» y tras
    # «Martí dijo…» (detectadas como pausas >=0,4 s en frontera de línea).
    dramatic = [(s, e) for s, e, d in silences if d >= 0.4]
    n_low = 0
    for t, db in curve:
        if t > 47.0:
            break
        if db < RMS_FLOOR_DBFS:
            in_drama = any(s - 0.1 <= t <= e + 0.1 for s, e in dramatic)
            if not in_drama:
                # ¿La cama misma está por debajo del suelo? Entonces es
                # dinámica propia de la música (un pasaje silencioso
                # del stem), no un hueco de mezcla: la mezcla no puede
                # sonar más fuerte que su propia cama (V2.3 @ 9,25 s:
                # mezcla -38,2 dBFS con la cama a -45,2 dBFS — el stem
                # tiene un pasaje casi en silencio en 9,25-9,50 s y la
                # pausa natural de voz lo deja al descubierto).
                bed_db = (energy_db(bed, sr, t, t + 0.25)
                          if bed is not None else None)
                if bed_db is not None and bed_db < RMS_FLOOR_DBFS:
                    rep.add("f", "INFO",
                            f"ventana {t:.2f}s bajo el suelo "
                            f"({db:.1f} dBFS) pero la cama también "
                            f"({bed_db:.1f} dBFS): pasaje silencioso "
                            f"del stem, no hueco de mezcla",
                            t=t)
                    continue
                n_low += 1
                rep.add("f", "FAIL",
                        f"ventana de mezcla bajo el suelo: {t:.2f}s "
                        f"RMS {db:.1f} dBFS (< {RMS_FLOOR_DBFS})",
                        t=t)
    rep.metrics["f_windows_below_floor"] = n_low
    # 2) Crossfade entre secciones (sobre la cama, sin VO ni SFX).
    if bed is not None and len(sections) > 1:
        for j in range(len(sections) - 1):
            xf_start = sections[j + 1][1]
            xf_end = xf_start + xfade
            bed_curve = rms_windows(bed, sr, 0.1)
            shoulder = [db for t, db in bed_curve
                        if xf_start - 1.0 <= t < xf_start
                        or xf_end < t <= xf_end + 1.0]
            inside = [db for t, db in bed_curve
                      if xf_start <= t <= xf_end]
            if shoulder and inside:
                sh = float(np.mean(shoulder))
                mn = min(inside)
                rep.metrics[f"f_xfade_{xf_start}_dip_db"] = round(sh - mn, 1)
                if sh - mn > XFADE_DIP_DB:
                    rep.add("f", "WARN",
                            f"crossfade @ {xf_start:.1f}-{xf_end:.1f}s: "
                            f"caída de {sh - mn:.1f} dB "
                            f"(hombros {sh:.1f} dBFS, mínimo {mn:.1f})",
                            t=xf_start)
                else:
                    rep.add("f", "INFO",
                            f"crossfade @ {xf_start:.1f}s: caída "
                            f"{sh - mn:.1f} dB (aceptable)",
                            t=xf_start)
    # 3) Recuperación del ducking tras cada frase.
    if bed is not None:
        n_slow = 0
        for s, e, d in silences:
            if d < 0.3 or s < 0.5 or s > 47.0:
                continue
            # Ventana de medida: [+0,25, +0,50] tras el fin de la frase,
            # SIN salirse del silencio (si la pausa es corta, la ventana
            # se recorta; si queda <0,15 s, no se mide).
            t0, t1 = s + 0.25, min(s + 0.5, e)
            if t1 - t0 < 0.15:
                continue
            if any(abs(x - (t0 + t1) / 2) < 0.3 for x in sfx_times):
                continue  # un SFX contamina la ventana
            mix_db = energy_db(mix, sr, t0, t1)
            bed_db = energy_db(bed, sr, t0, t1)
            rep.metrics.setdefault("f_duck_recovery", []).append(
                (round(s, 2), round(mix_db - bed_db, 1)))
            if mix_db < bed_db - DUCK_RECOVERY_DB:
                n_slow += 1
                rep.add("f", "FAIL",
                        f"ducking sin recuperar tras la frase que termina "
                        f"@ {s:.2f}s: mezcla {mix_db:.1f} dBFS vs cama "
                        f"{bed_db:.1f} dBFS "
                        f"({mix_db - bed_db:+.1f} dB a +0,25 s)",
                        t=s)
        rep.metrics["f_duck_slow_recovery"] = n_slow
        # 4) Bombeo: curva de ganancia del sidechain en aislamiento.
        gain_db = ducking_gain_curve(bed, edited_vo, sr, duck_release,
                                     duck_threshold, duck_ratio)
        if gain_db is not None:
            # Variación dentro de cada frase (entre pausas).
            bounds = [0.0] + [e for _s, e, _d in silences if e < 47.0]
            bounds += [47.0]
            worst = 0.0
            for a, b in zip(bounds[:-1], bounds[1:]):
                if b - a < 0.5:
                    continue
                seg = gain_db[int(a / 0.05):int(b / 0.05)]
                if len(seg) > 4:
                    worst = max(worst, float(seg.max() - seg.min()))
            rep.metrics["f_duck_pump_max_db"] = round(worst, 1)
            rep.metrics["f_duck_depth_mean_db"] = round(
                float(np.mean(gain_db[gain_db < -0.5])), 1) if (
                    gain_db < -0.5).any() else 0.0
            if worst > DUCK_PUMP_DB:
                rep.add("f", "WARN",
                        f"bombeo del ducking: la ganancia de la música "
                        f"varía {worst:.1f} dB dentro de una frase "
                        f"(> {DUCK_PUMP_DB} dB: la música «respira» con "
                        f"las sílabas)",
                        t=None)
    if n_low == 0:
        rep.add("f", "PASS", "música presente en toda la mezcla "
                f"(suelo {RMS_FLOOR_DBFS} dBFS respetado)")


def ducking_gain_curve(bed: np.ndarray, voice: np.ndarray, sr: int,
                       release_ms: float, threshold: float = 0.018,
                       ratio: float = 7.0):
    """Curva de ganancia (dB, ventanas de 50 ms) del sidechaincompress.

    Ejecuta el mismo sidechain que mix.py sobre la cama en aislamiento
    y compara entrada/salida.
    """
    try:
        with tempfile.TemporaryDirectory() as td:
            bp, vp = os.path.join(td, "bed.wav"), os.path.join(td, "vo.wav")
            for path, arr in ((bp, bed), (vp, voice)):
                import wave
                w = wave.open(path, "wb")
                w.setnchannels(1)
                w.setsampwidth(2)
                w.setframerate(sr)
                w.writeframes(np.clip(np.round(arr * 32767), -32768,
                                      32767).astype(np.int16).tobytes())
                w.close()
            cmd = ["ffmpeg", "-v", "error", "-i", bp, "-i", vp,
                   "-filter_complex",
                   "[0:a][1:a]sidechaincompress="
                   f"threshold={threshold}:ratio={ratio}:"
                   f"attack=20:release={release_ms}[d]",
                   "-map", "[d]", "-ar", str(sr), "-ac", "1",
                   "-f", "f32le", "-"]
            out = subprocess.run(cmd, capture_output=True,
                                 check=True).stdout
            ducked = np.frombuffer(out, dtype=np.float32)
    except Exception as exc:  # pragma: no cover - degradación suave
        print(f"aviso: no se pudo medir la curva de ducking: {exc}",
              file=sys.stderr)
        return None
    n = min(len(bed), len(ducked))
    win = int(0.05 * sr)
    g = []
    for k in range(0, n // win):
        b = bed[k * win:(k + 1) * win]
        d = ducked[k * win:(k + 1) * win]
        rb = float(np.sqrt((b ** 2).mean())) + 1e-9
        rd = float(np.sqrt((d ** 2).mean())) + 1e-9
        g.append(20 * math.log10(rd / rb))
    return np.array(g)


def _envelope_lag_curve(env_ref, env_test, win_s=2.0, step_s=2.0,
                          search_s=1.0, min_corr=0.8):
    """Lag test-vs-ref por ventanas (s): [(t_centro, lag_s, corr)].

    Solo ventanas fiables (corr >= min_corr): las que cruzan una
    frontera de tramo AAC no correlacionan (el salto de lag parte
    la ventana) y se descartan; el lag se interpola entre las
    vecinas fiables.
    """
    win = int(win_s / 0.005)
    step = int(step_s / 0.005)
    span = int(search_s / 0.005)
    out = []
    for c in range(0, len(env_ref) - win, step):
        seg_r = env_ref[c:c + win]
        if float(np.std(seg_r)) < 1e-6:
            continue
        best_c, best_l = -2.0, 0
        for lag in range(-span, span + 1):
            j0 = c + lag
            if j0 < 0 or j0 + win > len(env_test):
                continue
            seg_t = env_test[j0:j0 + win]
            if float(np.std(seg_t)) < 1e-6:
                continue
            cc = float(np.corrcoef(seg_r, seg_t)[0, 1])
            if not math.isnan(cc) and cc > best_c:
                best_c, best_l = cc, lag
        if best_c >= min_corr:
            out.append((c * 0.005, best_l * 0.005, best_c))
    return out


def check_g_master_holes(rep: Report, master_audio, mix, sr: int):
    """(g) Agujeros de frontera en el máster (V4.1, 20-nov-2026).

    El render por tramos con AAC inyectaba un agujero de 34-55 ms
    (hasta silencio digital) en cada frontera de tramo: 13 en el
    máster V4 de marti-fidel, que el usuario oía como microcortes y
    que la auditoría NO cazaba (el detector de silencios exige
    >=0,3 s y la (i2) solo mira la VO). Este check escanea el máster
    a 1 ms: rachas >=15 ms por debajo de -50 dBFS. Cada candidata
    se contrasta con la mezcla EN EL MISMO MOMENTO ACÚSTICO (curva
    de lag por correlación de envolventes, para absorber la deriva
    residual de la vía AAC antigua): si la mezcla ahí tiene voz o
    música (mediana >-30 dBFS en el tramo del agujero), el agujero
    es un defecto; si la mezcla también está en silencio (pausa
    entre palabras con la cama en silencio, como la tesis L9), no.
    Se excluyen los primeros 0,5 s (arranque) y los últimos 1,5 s
    (fade de salida). Con tramos PCM no debe haber ninguno.
    """
    if mix is None:
        rep.add("g", "INFO", "sin mezcla: no se buscan agujeros de "
                "frontera en el máster")
        return
    dur = len(master_audio) / sr
    win = int(0.001 * sr)
    n = len(master_audio) // win
    env_m = 20 * np.log10(np.maximum(
        np.sqrt((master_audio[:n * win].reshape(n, win).astype(
            np.float64) ** 2).mean(axis=1)), 1e-9))
    nm = len(mix) // win
    env_x = 20 * np.log10(np.maximum(
        np.sqrt((mix[:nm * win].reshape(nm, win).astype(
            np.float64) ** 2).mean(axis=1)), 1e-9))
    # Curva de lag máster-vs-mezcla (envolventes a 5 ms).
    w5 = int(0.005 * sr)
    n5 = len(master_audio) // w5
    e5_m = 20 * np.log10(np.maximum(
        np.sqrt((master_audio[:n5 * w5].reshape(n5, w5).astype(
            np.float64) ** 2).mean(axis=1)), 1e-9))
    n5x = len(mix) // w5
    e5_x = 20 * np.log10(np.maximum(
        np.sqrt((mix[:n5x * w5].reshape(n5x, w5).astype(
            np.float64) ** 2).mean(axis=1)), 1e-9))
    lag_pts = _envelope_lag_curve(e5_x, e5_m)
    i0 = int(0.5 * 1000)
    i1 = max(i0, int((dur - 1.5) * 1000))
    holes = []
    k = i0
    while k < min(i1, n):
        if env_m[k] < -50.0:
            j = k
            while j + 1 < min(i1, n) and env_m[j + 1] < -50.0:
                j += 1
            if (j - k + 1) >= 15:
                t = (k + j) / 2 / 1000
                dur_ms = j - k + 1
                if lag_pts:
                    ts = np.array([p[0] for p in lag_pts])
                    ls = np.array([p[1] for p in lag_pts])
                    lag = float(np.interp(t, ts, ls))
                else:
                    lag = 0.0
                t_mix = t + lag
                lo = max(0, int((t_mix - dur_ms / 2000 - 0.03) * 1000))
                hi = min(nm, int((t_mix + dur_ms / 2000 + 0.03) * 1000))
                mix_med = (float(np.median(env_x[lo:hi]))
                           if hi > lo else -120.0)
                holes.append((t, dur_ms,
                              float(env_m[k:j + 1].min()), mix_med))
            k = j + 1
        else:
            k += 1
    real = [h for h in holes if h[3] > -30.0]
    rep.metrics["g_master_holes"] = len(real)
    for t, ms, mn, mx in real[:10]:
        rep.add("g", "FAIL",
                f"agujero en el máster @ {t:.3f}s: {ms} ms por debajo "
                f"de -50 dBFS (mín {mn:.0f} dBFS) con la mezcla a "
                f"{mx:.0f} dBFS — frontera de tramo AAC",
                t=t)
    if len(real) > 10:
        rep.add("g", "FAIL",
                f"... y {len(real) - 10} agujeros más en el máster")
    if not real:
        rep.add("g", "PASS", "sin agujeros de frontera en el máster "
                "(escaneo a 1 ms)")


def check_g_master(rep: Report, master_path: str, captions: list,
                   edited_vo_words: list, pred_words: list,
                   edited_vo, sr: int, expected_frames: int,
                   do_whisper: bool, model: str, mix=None):
    """(g) Máster: loudness/TP, silencios, onset, alineación karaoke/voz.

    La alineación autoritativa es captions vs ONSETS ACÚSTICOS de la
    VO editada (lo que el oído percibe), no vs Whisper: Whisper
    desplaza bordes ±0,1-0,5 s (en V1.4 falló L7 entera: «Pero» a
    29,42 s en vez de 25,57 s) y sobre la mezcla tiene un sesgo
    sistemático ~+0,2 s. La comparación vs la transcripción se hace
    con los bordes CORREGIDOS por la predicción analítica (misma regla
    que el alineador: desvío >0,08 s -> predicción).
    """
    pr = ffprobe_json(master_path)
    vid = next((s for s in pr["streams"]
                if s["codec_type"] == "video"), None)
    aud = next((s for s in pr["streams"]
                if s["codec_type"] == "audio"), None)
    dur = float(pr["format"]["duration"])
    rep.metrics["g_duration"] = round(dur, 3)
    if vid is not None:
        frames = int(vid.get("nb_read_frames") or 0)
        rep.metrics["g_frames"] = frames
        if expected_frames and frames != expected_frames:
            rep.add("g", "FAIL",
                    f"fotogramas {frames} != esperados {expected_frames}")
    if aud is None:
        rep.add("g", "FAIL", "el máster NO tiene pista de audio")
        return
    lufs, tp = ebur128(master_path)
    rep.metrics["g_lufs"] = round(lufs, 1)
    rep.metrics["g_true_peak"] = round(tp, 1)
    if not (-16.5 <= lufs <= -12.0):
        rep.add("g", "WARN", f"loudness {lufs:.1f} LUFS fuera del rango "
                "de QA [-16,5, -12,0]")
    if tp > -1.0:
        rep.add("g", "FAIL", f"true peak {tp:.1f} dBTP > -1,0 dBTP")
    # Silencios en el máster.
    out = subprocess.run(
        ["ffmpeg", "-v", "info", "-i", master_path,
         "-af", "silencedetect=noise=-45dB:d=0.3", "-f", "null", "-"],
        capture_output=True, text=True).stderr
    n_sil = out.count("silence_start")
    rep.metrics["g_silence_intervals"] = n_sil
    if n_sil:
        rep.add("g", "FAIL", f"{n_sil} intervalos de silencio >=0,3 s "
                "en el máster")
    # Onset de voz vs t=0 (alineación A/V del audio).
    master_audio = load_audio(master_path, sr=SR, mono=True)
    win = int(0.01 * SR)
    onset = None
    for k in range(len(master_audio) // win):
        seg = master_audio[k * win:(k + 1) * win]
        if float(np.abs(seg).max()) > 0.01:
            onset = k * 0.01
            break
    rep.metrics["g_first_audio_s"] = onset
    # Agujeros de frontera (V4.1): el AAC por tramos los inyecta y
    # el detector de silencios (>=0,3 s) no los ve.
    check_g_master_holes(rep, master_audio, mix, sr)
    # Alineación karaoke vs voz del máster (Whisper) y vs VO limpia.
    # 1) Fallo de transcripción: Whisper vs predicción analítica.
    if edited_vo_words and pred_words \
            and len(edited_vo_words) == len(pred_words):
        n_trans_fail = 0
        for w, pw in zip(edited_vo_words, pred_words):
            if abs(w["s"] - pw["s"]) > 0.5 or abs(w["e"] - pw["e"]) > 0.5:
                n_trans_fail += 1
                rep.add("g", "FAIL",
                        f"fallo de transcripción en {w['w']!r}: Whisper "
                        f"{w['s']:.2f}-{w['e']:.2f}s vs predicción "
                        f"{pw['s']:.2f}-{pw['e']:.2f}s (la transcripción "
                        f"de la VO editada NO es fiable aquí)",
                        t=pw["s"])
        rep.metrics["g_transcription_failures"] = n_trans_fail
    # Bordes corregidos por la predicción (regla del alineador).
    corr_words = list(edited_vo_words)
    if edited_vo_words and pred_words \
            and len(edited_vo_words) == len(pred_words):
        corr_words = []
        for w, pw in zip(edited_vo_words, pred_words):
            s = pw["s"] if abs(w["s"] - pw["s"]) > 0.08 else w["s"]
            e = pw["e"] if abs(w["e"] - pw["e"]) > 0.08 else w["e"]
            corr_words.append({"w": w["w"], "s": s, "e": e})

    cap_n = [norm_word(c["text"]) for c in captions]
    cap_t = [c["startMs"] / 1000 for c in captions]

    # 2) Alineación autoritativa: captions vs ONSETS ACÚSTICOS de la VO
    # editada (umbral -50 dB para cazar fricativas y glides). SOLO tiene
    # sentido donde hay silencio previo (inicios de segmento/frase): en
    # medio de habla continua no hay onset detectable por energía.
    # Se guardan los desvíos por caption para el contraste con la
    # alineación clean: si el karaoke coincide con el onset acústico,
    # un desvío vs Whisper/predicción es error de Whisper, no de sync.
    acoustic_devs = {}
    if edited_vo is not None and pred_words:
        diffs = []
        for ci, c in enumerate(captions):
            s = c["startMs"] / 1000
            pre_db = energy_db(edited_vo, sr, max(0.0, s - 0.15), s)
            # La puerta es -45 dB, la definición de silencio de la
            # propia auditoría (find_silences, silencedetect): con
            # -50 dB, una pausa real con tono de sala a -49,7 dB
            # (caso «ESA» en el-libreto-156-yt, 23-nov-2026) quedaba
            # fuera y el contraste acústico no podía salvar el
            # desvío Whisper (+0,69 s), dando un FAIL falso aunque
            # el karaoke coincidía con el onset (31,02 vs 31,07 s).
            # El umbral del onset en sí sigue en -50 dB.
            if pre_db > -45.0:
                continue  # habla continua antes: sin onset definible
            on, _off = acoustic_span(edited_vo, sr, s - 0.05, s + 0.6,
                                     thresh_db=-50.0)
            if on is not None:
                diffs.append((s - on, c["text"].strip(), s))
                acoustic_devs[ci] = s - on
        if diffs:
            absd = [abs(d) for d, _w, _s in diffs]
            mean = float(np.mean(absd))
            med = float(np.median([d for d, _w, _s in diffs]))
            mx = max(diffs, key=lambda x: abs(x[0]))
            rep.metrics["g_align_acoustic_mean"] = round(mean, 3)
            rep.metrics["g_align_acoustic_median_signed"] = round(med, 3)
            rep.metrics["g_align_acoustic_max"] = round(abs(mx[0]), 3)
            rep.metrics["g_align_acoustic_max_word"] = mx[1]
            bad = [(d, w, s) for d, w, s in diffs
                   if abs(d) > SYNC_MAX_S]
            for d, w, s in bad:
                rep.add("g", "FAIL",
                        f"karaoke {d:+.2f}s respecto al onset acústico "
                        f"de {w!r} @ {s:.2f}s (la palabra se oye "
                        f"{'antes' if d > 0 else 'después'} de aparecer)",
                        t=s)
            if not bad:
                rep.add("g", "PASS",
                        f"alineación karaoke/onset acústico: media "
                        f"{mean:.3f}s, mediana {med:+.3f}s, máx "
                        f"{abs(mx[0]):.2f}s ({len(diffs)} palabras)")

    def align(words, label):
        w_n = [norm_word(w["w"]) for w in words]
        w_t = [w["s"] for w in words]
        sm = difflib.SequenceMatcher(a=w_n, b=cap_n, autojunk=False)
        diffs = []
        for tag, i1, i2, j1, j2 in sm.get_opcodes():
            if tag == "equal":
                for k in range(i2 - i1):
                    diffs.append((cap_t[j1 + k] - w_t[i1 + k],
                                  cap_n[j1 + k], j1 + k))
        if not diffs:
            rep.add("g", "WARN", f"alineación {label}: sin palabras "
                    "alineadas")
            return
        absd = [abs(d) for d, _w, _ci in diffs]
        mean = float(np.mean(absd))
        med = float(np.median([d for d, _w, _ci in diffs]))
        mx = max(diffs, key=lambda x: abs(x[0]))
        rep.metrics[f"g_align_{label}_mean"] = round(mean, 3)
        rep.metrics[f"g_align_{label}_median_signed"] = round(med, 3)
        rep.metrics[f"g_align_{label}_max"] = round(abs(mx[0]), 3)
        rep.metrics[f"g_align_{label}_max_word"] = mx[1]
        bad = [(d, w, ci) for d, w, ci in diffs if abs(d) > SYNC_MAX_S]
        for d, w, ci in bad:
            # Contraste con el onset acústico: si el karaoke coincide
            # con lo que se oye, el desvío es error de Whisper.
            ac = acoustic_devs.get(ci)
            if label == "clean" and ac is not None \
                    and abs(ac) <= SYNC_MAX_S:
                rep.add("g", "INFO",
                        f"desvío karaoke/Whisper {d:+.2f}s en {w!r}, "
                        f"pero el karaoke coincide con el onset "
                        f"acústico ({ac:+.2f}s): error de Whisper, "
                        f"no de sincronía",
                        t=None)
                continue
            rep.add("g", "FAIL" if label == "clean" else "WARN",
                    f"desvío karaoke/voz {label} {d:+.2f}s en {w!r}",
                    t=None)
        if not bad:
            rep.add("g", "PASS",
                    f"alineación karaoke/voz {label}: media {mean:.3f}s, "
                    f"mediana {med:+.3f}s, máx {abs(mx[0]):.2f}s "
                    f"({len(diffs)} palabras)")
        elif label == "master" and abs(med) > 0.1 and len(bad) <= 3:
            rep.add("g", "INFO",
                    f"los desvíos en el máster son un SESGO SISTEMÁTICO "
                    f"de Whisper sobre la mezcla (mediana {med:+.2f}s), "
                    f"no un defecto de sincronía: ver alineación clean")

    if corr_words:
        align(corr_words, "clean")
    if do_whisper:
        with tempfile.TemporaryDirectory() as td:
            wav16 = os.path.join(td, "master-16k.wav")
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-i",
                            master_path, "-vn", "-ar", "16000", "-ac", "1",
                            wav16], check=True)
            words = transcribe_whisper(wav16, model)
            align(words, "master")
    if not (-16.5 <= lufs <= -12.0) or tp > -1.0 or n_sil:
        pass  # ya reportado arriba
    else:
        rep.add("g", "PASS", f"máster: {lufs:.1f} LUFS, TP {tp:.1f} dBTP, "
                "sin silencios")


def check_h_spectrograms(rep: Report, mix, edited_vo, sr: int,
                         vo_lines: list, out_dir: str):
    """(h) Espectrogramas para revisión visual."""
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except Exception as exc:
        rep.add("h", "INFO", f"sin matplotlib: no hay espectrogramas ({exc})")
        return
    spec_dir = os.path.join(out_dir, "spectrograms")
    os.makedirs(spec_dir, exist_ok=True)
    files = []

    def save_spec(a, title, fname, t0=0.0):
        fig, ax = plt.subplots(figsize=(12, 3.2))
        ax.specgram(a, Fs=sr, NFFT=2048, noverlap=1536, cmap="magma",
                    vmin=-90, vmax=-20)
        ax.set_title(title)
        ax.set_xlabel("tiempo (s)")
        ax.set_ylabel("frecuencia (Hz)")
        ax.set_ylim(0, 8000)
        fig.tight_layout()
        fig.savefig(os.path.join(spec_dir, fname), dpi=90)
        plt.close(fig)
        files.append(fname)

    save_spec(mix, "Mezcla final — espectrograma completo",
              "mix-full.png")
    for i, ln in enumerate(vo_lines):
        s0, s1 = ln["start"], ln["end"]
        seg = edited_vo[int(s0 * sr):int(s1 * sr)]
        if len(seg):
            save_spec(seg, f"L{i + 1} VO editada ({s0:.1f}-{s1:.1f}s): "
                      f"{ln['text'][:45]}", f"vo-line-{i + 1:02d}.png")
    rep.metrics["h_spectrograms"] = files
    rep.add("h", "PASS", f"{len(files)} espectrogramas en "
            f"spectrograms/ (revisión visual)")


def check_i_microcuts(rep: Report, orig_vo, edited_vo, sr: int,
                      plan: dict, orig_words: list, pred_words: list,
                      mix=None, sfx_times=None):
    """(i) Microcortes de voz a nivel de forma de onda (microcut.py).

    Delega en `microcut.detect_all`: (i1) calidad de empalme
    (saltos de muestra, DC, distancia espectral, hueco de fundido),
    (i2) dips dentro de palabras (editada vs original, con
    alineación por palabra), (i3) pausas recortadas — OMITIDO
    aquí porque (c) §4 ya lo cubre con la misma regla (evita el
    doble reporte del mismo defecto) —, (i4) contigüidad de
    segmentos (cada segmento editado debe ser un trozo contiguo
    del original) e (i5) SFX que entierran el ataque de una
    palabra en la mezcla. Los hallazgos se vuelcan con check "i"
    y el sub-check entre corchetes en el mensaje.
    """
    here = os.path.dirname(os.path.abspath(__file__))
    if here not in sys.path:
        sys.path.insert(0, here)
    import microcut as mc
    if plan is None or not orig_words or not pred_words:
        rep.add("i", "INFO", "faltan edit-plan, transcripción del "
                "original o predicción: no se auditan microcortes")
        return
    res = mc.detect_all(edited_vo, orig_vo, sr, plan, pred_words,
                        orig_words, mix=mix, sfx_times=sfx_times)
    for k, v in res["metrics"].items():
        rep.metrics[k] = v
    for f in res["findings"]:
        if f["check"] == "i3":
            continue  # cubierto por (c) §4 (misma regla)
        rep.add("i", f["sev"], f"[{f['check']}] {f['msg']}", t=f["t"])
    rep.add("i", "INFO", "pausas intra-línea: cubiertas por (c) §4 "
            "(misma regla que (i3): <0,25 s o pérdida >50%)")


# ---------------- informes ----------------

def write_reports(rep: Report, out_dir: str, tag: str):
    os.makedirs(out_dir, exist_ok=True)
    data = {"project": rep.project, "tag": tag,
            "overall": rep.overall(), "counts": rep.counts(),
            "metrics": rep.metrics, "findings": rep.findings}
    jp = os.path.join(out_dir, f"audio-audit-{tag}.json")
    json.dump(data, open(jp, "w"), ensure_ascii=False, indent=1)
    mp = os.path.join(out_dir, f"audio-audit-{tag}.md")
    with open(mp, "w", encoding="utf-8") as f:
        c = rep.counts()
        f.write(f"# Auditoría de audio — {rep.project} ({tag})\n\n")
        f.write(f"**Veredicto: {rep.overall()}** — "
                f"{c['FAIL']} FAIL, {c['WARN']} WARN, "
                f"{c['PASS']} PASS, {c['INFO']} INFO.\n\n")
        order = ["a", "b", "c", "d", "e", "f", "g", "h", "i"]
        names = {
            "a": "Guion ↔ karaoke", "b": "Tiempos de caption",
            "c": "Integridad de la VO", "d": "Artefactos de time-stretch",
            "e": "Mapa de silencios", "f": "Música y ducking",
            "g": "Máster", "h": "Espectrogramas",
            "i": "Microcortes de voz (forma de onda)"}
        for k in order:
            fs = [x for x in rep.findings if x["check"] == k]
            if not fs:
                continue
            sev = ("FAIL" if any(x["sev"] == "FAIL" for x in fs)
                   else "WARN" if any(x["sev"] == "WARN" for x in fs)
                   else "PASS")
            f.write(f"## ({k}) {names[k]} — {sev}\n\n")
            for x in fs:
                t = f" @ {x['t']:.2f}s" if x["t"] is not None else ""
                f.write(f"- **{x['sev']}**{t}: {x['msg']}\n")
            f.write("\n")
        f.write("## Métricas\n\n```json\n")
        f.write(json.dumps(rep.metrics, ensure_ascii=False, indent=1))
        f.write("\n```\n")
    return jp, mp


# ---------------- CLI ----------------

def parse_section(spec: str):
    path, start, end = spec.rsplit("@", 2)
    return path, float(start), float(end)


def parse_sfx(spec: str):
    path, at = spec.rsplit("@", 1)
    return path, float(at)


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--project", required=True,
                   help="Carpeta del proyecto")
    p.add_argument("--tag", default="vX",
                   help="Etiqueta de versión para los informes")
    p.add_argument("--master", help="MP4 del máster")
    p.add_argument("--no-master", action="store_true",
                   help="Pre-auditoría: no auditar ningún máster; "
                   "desactiva la búsqueda automática de out/*_MASTER.mp4 "
                   "(sin esto, una pre-auditoría recogería un máster "
                   "viejo de una versión anterior)")
    p.add_argument("--mix", help="WAV de la mezcla")
    p.add_argument("--voice-orig", help="VO original (WAV)")
    p.add_argument("--voice-edited", help="VO editada (WAV)")
    p.add_argument("--captions", help="captions.json")
    p.add_argument("--vo-lines", help="vo-lines.json")
    p.add_argument("--transcription", help="Whisper de la VO original")
    p.add_argument("--transcription-edited",
                   help="Whisper de la VO editada")
    p.add_argument("--prediction", help="vo-editada-prediccion.json")
    p.add_argument("--edit-plan", help="edit-plan-vXX.json")
    p.add_argument("--section", action="append", default=[],
                   type=parse_section,
                   help="Sección de música ARCHIVO@INICIO@FIN (repetible)")
    p.add_argument("--sfx", action="append", default=[], type=parse_sfx,
                   help="SFX ARCHIVO@SEGUNDO (repetible)")
    p.add_argument("--music-volume", type=float, default=0.38)
    p.add_argument("--duck-release", type=float, default=150.0)
    p.add_argument("--duck-threshold", type=float, default=0.018)
    p.add_argument("--duck-ratio", type=float, default=7.0)
    p.add_argument("--xfade", type=float, default=1.5)
    p.add_argument("--end-fade", type=float, default=1.0)
    p.add_argument("--seconds", type=float, default=50.23)
    p.add_argument("--expected-frames", type=int, default=0)
    p.add_argument("--out-dir", help="Carpeta de informes "
                   "(por defecto <proyecto>/reports)")
    p.add_argument("--whisper-model", default=WHISPER_MODEL)
    p.add_argument("--no-whisper", action="store_true",
                   help="Omitir la transcripción del máster")
    p.add_argument("--no-spectrograms", action="store_true")
    a = p.parse_args()

    proj = a.project
    audio = os.path.join(proj, "public", "audio")
    res_dir = os.path.join(proj, "research")
    out_dir = a.out_dir or os.path.join(proj, "reports")

    def pick(opt, *rel):
        if opt:
            return opt
        for r in rel:
            if os.path.isfile(os.path.join(proj, r)):
                return os.path.join(proj, r)
        return None

    captions_p = pick(a.captions, "public/audio/captions.json")
    vo_lines_p = pick(a.vo_lines, "public/audio/vo-lines.json")
    orig_p = pick(a.voice_orig, "public/audio/vo-definitiva.wav",
                  "public/audio/vo-definitiva-48k.wav")
    edited_p = pick(a.voice_edited,
                    "public/audio/vo-definitiva-editada.wav")
    mix_p = pick(a.mix, "public/audio/mix.wav")
    master_p = a.master
    if not master_p and not a.no_master:
        outs = [os.path.join(proj, "out", f)
                for f in sorted(os.listdir(os.path.join(proj, "out")))
                if f.endswith("_MASTER.mp4")] if os.path.isdir(
                    os.path.join(proj, "out")) else []
        master_p = outs[0] if outs else None
    trans_p = pick(a.transcription,
                   "public/audio/vo-definitiva-transcripcion.json")
    trans_ed_p = pick(a.transcription_edited,
                      "public/audio/vo-editada-transcripcion.json")
    pred_p = pick(a.prediction, "research/vo-editada-prediccion.json")
    plan_p = a.edit_plan

    rep = Report(os.path.basename(os.path.abspath(proj)))
    print(f"Auditoría de audio: {proj} ({a.tag})")

    # Carga de datos.
    captions = json.load(open(captions_p)) if captions_p else []
    vo_lines = (json.load(open(vo_lines_p))["lines"]
                if vo_lines_p else [])
    plan = json.load(open(plan_p)) if plan_p else None
    orig_words = load_whisper_file(trans_p) if trans_p else []
    edited_words = load_whisper_file(trans_ed_p) if trans_ed_p else []
    pred_words = (json.load(open(pred_p))["palabras"]
                  if pred_p else [])
    edited_vo = load_wav_fast(edited_p) if edited_p else None
    orig_vo = load_wav_fast(orig_p) if orig_p else None
    mix = load_audio(mix_p, sr=SR, mono=True) if mix_p else None

    silences = []
    if edited_vo is not None:
        silences = find_silences(edited_vo, SR)

    # (a) guion <-> karaoke
    if vo_lines and captions:
        check_a_script_karaoke(rep, vo_lines, captions)
    else:
        rep.add("a", "INFO", "falta vo-lines.json o captions.json")
    # (b) tiempos de caption
    if captions and edited_vo is not None:
        check_b_caption_timing(rep, captions, edited_vo, SR, silences)
    else:
        rep.add("b", "INFO", "falta captions.json o VO editada")
    # (c) integridad de la VO
    if orig_vo is not None and edited_vo is not None and orig_words \
            and pred_words:
        check_c_vo_integrity(rep, orig_vo, edited_vo, SR, orig_words,
                             pred_words, plan)
    else:
        rep.add("c", "INFO", "faltan VO original/editada, transcripción "
                "o predicción")
    # (d) time-stretch
    if edited_vo is not None:
        check_d_stretch(rep, edited_vo, SR, plan)
    # (e) silencios
    if edited_vo is not None:
        check_e_silences(rep, edited_vo, SR, plan, vo_lines)
    # (f) música
    bed = None
    if a.section:
        try:
            bed = build_music_bed(a.section, a.seconds, a.music_volume,
                                  a.xfade, a.end_fade)
        except Exception as exc:
            rep.add("f", "WARN", f"no se pudo reconstruir la cama "
                    f"musical: {exc}")
    if mix is not None:
        check_f_music(rep, mix, bed, edited_vo, SR, silences, a.section,
                      a.xfade, a.duck_release, a.duck_threshold,
                      a.duck_ratio, [t for _p, t in a.sfx])
    else:
        rep.add("f", "INFO", "falta mix.wav")
    # (g) máster
    if master_p and captions:
        check_g_master(rep, master_p, captions, edited_words,
                       pred_words, edited_vo, SR,
                       a.expected_frames, not a.no_whisper,
                       a.whisper_model, mix=mix)
    else:
        rep.add("g", "INFO", "falta el máster o captions.json")
    # (h) espectrogramas
    if not a.no_spectrograms and mix is not None \
            and edited_vo is not None and vo_lines:
        check_h_spectrograms(rep, mix, edited_vo, SR, vo_lines, out_dir)
    # (i) microcortes de voz (forma de onda)
    if orig_vo is not None and edited_vo is not None:
        check_i_microcuts(rep, orig_vo, edited_vo, SR, plan,
                          orig_words, pred_words, mix=mix,
                          sfx_times=[t for _p, t in a.sfx])
    else:
        rep.add("i", "INFO", "faltan VO original/editada")

    jp, mp = write_reports(rep, out_dir, a.tag)
    c = rep.counts()
    print(f"Veredicto: {rep.overall()} — {c['FAIL']} FAIL, "
          f"{c['WARN']} WARN, {c['PASS']} PASS, {c['INFO']} INFO")
    print(f"Informes: {jp}\n          {mp}")
    return 0 if c["FAIL"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
