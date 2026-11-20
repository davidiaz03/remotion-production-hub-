#!/usr/bin/env python3
"""Detector de microcortes de voz a nivel de forma de onda (18-nov-2026).

Por qué existe: la auditoría V2.2 dio 0 FAIL y el usuario oyó un
microcorte en L2 «del recuento» (pausa natural 0,42 s recortada a
0,22 s — cubierto desde entonces por el check (c) §4). La V2.3
también dio 0 FAIL y el usuario siguió oyendo microcortes «muy
pequeños, poco notables pero reales». Los checks (c) (cortes en
habla, clics por umbral relativo, palabras exprimidas, pausas) NO
bastan: un empalme puede ser «limpio» para el escaneo de clics y
aun así sonar cortado.

Este módulo trabaja a nivel de forma de onda y compara SIEMPRE la
editada contra el original (un hueco solo es defecto si no existe
en el original en la misma posición fonética — las oclusivas
(/p/, /t/, /k/) tienen cierres naturales de 40-80 ms y el habla
rápida cubana tiene caídas de energía que NO son cortes).

Chequeos (cada uno devuelve hallazgos con severidad y timestamp):
  (i1) Calidad de empalme: salto de muestra en el punto exacto,
       salto de DC (media 10 ms antes/después), discontinuidad
       espectral (distancia entre los espectros de 20 ms antes y
       después) y PROFUNDIDAD DEL HUECO del fundido: un fundido
       de salida + fundido de entrada (el patrón de
       build-vo-real-v*.py) deja un hueco de ~10 ms que baja a
       -85 dB en tono de sala; un crossfade de igual potencia no
       tiene hueco. WARN si el hueco supera 12 dB, FAIL si supera
       20 dB en contenido audible (flancos > -40 dBFS).
  (i2) Huecos y caídas dentro de palabras: comparación directa de
       envolventes RMS a 5 ms, editada vs original, normalizadas
       por su mediana por palabra (elimina la ganancia del
       loudnorm); alineación global por palabra (±30 ms, por
       correlación de envolvente, para absorber el warp del atempo)
       y cada ventana editada se compara contra el MÍNIMO del
       original en ±10 ms (un cierre desplazado unos ms por el
       warp no es un microcorte). Un hallazgo es una racha de
       5-80 ms con la editada >10 dB bajo el original, solo donde
       el original tiene voz CLARA sostenida (mediana en ±25 ms
       > -30 dBFS): en ataques sordos (/l/, /h/) a -35 dB la
       envolvente es ruidosa y una sola ventana puede caer 14 dB
       por azar. Los cierres de oclusiva aparecen en AMBOS audios
       y no se marcan.
  (i3) Pausas entre palabras (original vs editada, MISMA regla que
       el check (c) §4 — `voiced_span` con armonicidad — para no
       discrepar en el borde del umbral): FAIL si la editada queda
       <0,25 s o pierde >50% — caza las 6 pausas malas de V2.2.
       En audit-audio.py no se repite: lo cubre (c) §4.
  (i4) Contigüidad de segmentos: cada segmento editado debe ser un
       trozo contiguo del original. Correlación por sub-ventanas de
       100 ms CON ENERGÍA contra el original en la posición mapeada
       (forma de onda si factor ≈ 1, envolvente RMS si hay stretch,
       porque WSOLA reescribe la forma de onda): FAIL si la
       correlación mediana <0,70 o los lags locales saltan >15 ms
       (40 ms con stretch) entre ventanas consecutivas con
       correlación fiable (el segmento se armó de trozos no
       contiguos o mal mapeados). Anti-aliasing: entre lags con
       correlación casi óptima se elige el más cercano al esperado
       (un lag a un periodo de pitch es alias, no desplazamiento).
  (i5) Enmascaramiento por SFX en onsets de palabra (sobre la
       mezcla): si en los primeros 30 ms de una palabra la mezcla
       supera a la VO en >15 dB, el ataque de la palabra queda
       enterrado bajo el SFX/la música y la palabra suena cortada
       por la cabeza (V2.3: «Leer.» +28 dB, «Pensar.» +24 dB,
       «pensar.» +23 dB). FAIL >15 dB, WARN >10 dB. El SFX debe
       caer en [-40 ms, +50 ms] del onset (el boom de apertura no
       enmascara la primera palabra).

Uso standalone:
  python3 scripts/audio/microcut.py --edited VO_EDITADA.wav \\
      --orig VO_ORIGINAL.wav --edit-plan edit-plan.json \\
      --prediction prediccion.json --transcription trans-orig.json \\
      [--mix MIX.wav --sfx SFX.wav@T ...]
  Salida: JSON con hallazgos + métricas; código 1 si hay FAIL.

Uso desde audit-audio.py: `check_i_microcuts()` (sección (i)).
Uso desde tests: `detect_all(...)` con rutas o arrays.
"""
import argparse
import json
import math
import os
import subprocess
import sys

import numpy as np

SR = 48000

# ---------------- umbrales ----------------
SPLICE_JUMP_RATIO = 4.0    # (i1) salto de muestra vs p99,9 local (FAIL)
SPLICE_DC_JUMP = 0.01      # (i1) salto de DC entre lados (WARN)
SPLICE_SPEC_DIST = 0.6     # (i1) distancia espectral 0-1 (WARN)
XFADE_DIP_WARN_DB = 12.0   # (i1) hueco del fundido (WARN)
XFADE_DIP_FAIL_DB = 20.0   # (i1) hueco del fundido (FAIL, si audible)
XFADE_AUDIBLE_DB = -40.0   # (i1) flanco audible para el FAIL
DIP_MIN_DB = 10.0          # (i2) caída bajo la mediana local (FAIL)
DIP_MIN_MS = 5             # (i2) duración mínima del dip (1 ventana
# de 5 ms: un hueco de 5 ms dentro de una palabra es el microcorte
# más corto que (i2) debe cazar; el mínimo sobre ±10 ms del
# original protege contra falsos positivos por desalineación)
DIP_MAX_MS = 80            # (i2) duración máxima (más es pausa, no dip)
DIP_VOICED_DB = -35.0      # (i2) solo en regiones sonoras
DIP_ORIG_MIN_DB = -30.0    # (i2) el original debe tener voz CLARA
# en la posición del dip (mediana en ±25 ms, nivel SOSTENIDO):
# en ataques sordos (/l/, /h/) a -35 dB la envolvente es ruidosa
# y la alineación pobre (corr ~0,6), y una sola ventana de 5 ms
# puede caer 14 dB por azar. La mediana (no el valor instantáneo)
# distingue un ataque sordo sostenido de una vocal fuerte, cuyas
# ventanas de 5 ms caen bajo -30 dB por fase glotal. Un hueco de
# 5 ms en un ataque a -35 dB es inaudible de todos modos.
GAP_MIN_S = 0.25           # (i3) pausa mínima tras editar (FAIL)
GAP_MAX_LOSS = 0.50        # (i3) pérdida máxima de pausa (FAIL)
CONTIG_MIN_CORR = 0.70     # (i4) correlación mediana mínima (FAIL)
CONTIG_LAG_JUMP_MS = 15.0  # (i4) salto de lag local (FAIL)
CONTIG_LAG_JUMP_STRETCH_MS = 40.0  # (i4) idem con stretch (el warp
# WSOLA mueve el lag residual; la correlación de envolvente es la
# señal autoritativa ahí, no el lag)
SFX_MASK_WARN_DB = 10.0    # (i5) mezcla sobre VO en onset (WARN)
SFX_MASK_FAIL_DB = 15.0    # (i5) mezcla sobre VO en onset (FAIL)
ALIGN_SEARCH_MS = 30.0     # (i2/i3) búsqueda de alineación local


# ---------------- utilidades ----------------

def load_audio(path: str, sr: int = SR) -> np.ndarray:
    """Decodifica cualquier audio a float32 mono [-1, 1] (ffmpeg)."""
    cmd = ["ffmpeg", "-v", "error", "-i", path, "-vn", "-ar", str(sr),
           "-ac", "1", "-f", "f32le", "-"]
    out = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype=np.float32)


def load_wav_fast(path: str, sr: int = SR) -> np.ndarray:
    """WAV PCM16 rápido (sin ffmpeg) si coincide el sample rate."""
    import wave
    with wave.open(path, "rb") as w:
        if (w.getframerate() != sr or w.getsampwidth() != 2):
            return load_audio(path, sr=sr)
        n, ch = w.getnframes(), w.getnchannels()
        a = np.frombuffer(w.readframes(n), dtype=np.int16).astype(
            np.float32) / 32768.0
    if ch > 1:
        a = a.reshape(-1, ch).mean(axis=1)
    return a


def rms_db(a: np.ndarray, sr: int, t0: float, t1: float) -> float:
    i0, i1 = max(0, int(t0 * sr)), min(len(a), int(t1 * sr))
    if i1 <= i0:
        return -120.0
    seg = a[i0:i1]
    return 20 * math.log10(float(np.sqrt((seg ** 2).mean())) + 1e-9)


def rms_envelope(a: np.ndarray, sr: int, win_ms: float = 1.0,
                 t0: float = 0.0, t1: float = None) -> np.ndarray:
    """Envolvente RMS en dBFS por ventanas de win_ms."""
    w = max(1, int(win_ms / 1000 * sr))
    i0 = int(t0 * sr)
    i1 = len(a) if t1 is None else min(len(a), int(t1 * sr))
    n = max(0, (i1 - i0) // w)
    out = np.empty(n)
    for k in range(n):
        seg = a[i0 + k * w:i0 + (k + 1) * w]
        out[k] = 20 * math.log10(float(np.sqrt((seg ** 2).mean()))
                                 + 1e-9)
    return out


def best_lag(a: np.ndarray, b: np.ndarray, sr: int,
             search_ms: float = ALIGN_SEARCH_MS,
             step: int = 12, prefer_lag: int = 0) -> tuple:
    """(lag_muestras, corr) que mejor alinea `b` con `a`.

    `a` es la referencia (original), `b` el tramo a alinear (editado).
    Devuelve el lag a sumar a la posición de `b` para alinearla con
    `a` (positivo = `b` va por detrás). (0, 0.0) si no hay energía.

    Anti-aliasing: en señales periódicas (vocal sostenida) la
    correlación tiene un pico por periodo de pitch y el argmax
    salta entre ventanas vecinas (falso salto de lag en (i4)).
    Entre los lags con correlación a menos de 0,02 del máximo se
    elige el más cercano a `prefer_lag` (el lag esperado según el
    mapa editado->original, que ya es preciso a ~5 ms): un lag a
    un periodo entero del esperado es un alias, no un
    desplazamiento real.
    """
    if len(a) == 0 or len(b) == 0:
        return 0, 0.0
    if float(np.sqrt((a ** 2).mean())) < 1e-4 or \
            float(np.sqrt((b ** 2).mean())) < 1e-4:
        return 0, 0.0
    span = int(search_ms / 1000 * sr)
    scored = []
    for lag in range(-span, span + 1, step):
        # Compara a[i] con b[i - lag] en el solapamiento válido.
        i0 = max(0, lag)
        i1 = min(len(a), len(b) + lag)
        if i1 - i0 < 100:
            continue
        x = a[i0:i1]
        y = b[i0 - lag:i1 - lag]
        c = float(np.corrcoef(x, y)[0, 1])
        if not math.isnan(c):
            scored.append((c, lag))
    if not scored:
        return 0, 0.0
    best_c = max(c for c, _l in scored)
    near = [l for c, l in scored if c >= best_c - 0.02]
    best_l = min(near, key=lambda l: abs(l - prefer_lag))
    return best_l, max(best_c, 0.0)


def harmonicity(a: np.ndarray, sr: int, t0: float, t1: float) -> float:
    """Armonicidad (0-1): >0,4 = voz sonora, <0,4 = ruido/respiro.

    Máxima autocorrelación normalizada en lags de 3-12 ms (periodo
    de pitch). Port de audit-audio.py (microcut no puede importarlo
    sin crear una dependencia circular).
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


def voiced_span(a: np.ndarray, sr: int, t0: float, t1: float,
                thresh_db: float = -40.0, harm_min: float = 0.4,
                loud_db: float = -28.0) -> tuple:
    """(onset, offset) de VOZ en [t0, t1] (ventanas de 20 ms).

    Una ventana cuenta como voz si RMS > thresh_db Y (armonicidad >
    harm_min O RMS > loud_db): los respiros superan -40 dB pero no
    son voz. Port de audit-audio.py — la (i3) debe medir igual que
    el check (c) §4 para no discrepar en el borde del umbral.
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


def energy_span(a: np.ndarray, sr: int, t0: float, t1: float,
                thresh_db: float = -40.0) -> tuple:
    """(onset, offset) de energía sostenida en [t0, t1] (ventanas 10 ms).

    Sin armonicidad: el onset exige 2 ventanas consecutivas sobre
    el umbral. Para pausas, preferir voiced_span (con armonicidad).
    """
    win = int(0.01 * sr)
    i0, i1 = max(0, int(t0 * sr)), min(len(a), int(t1 * sr))
    k0, k1 = i0 // win, max(i0 // win + 1, i1 // win)
    above = []
    for k in range(k0, k1):
        seg = a[k * win:(k + 1) * win]
        above.append(20 * math.log10(
            float(np.sqrt((seg ** 2).mean())) + 1e-9) >= thresh_db)
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


# ---------------- (i1) calidad de empalme ----------------

def splice_report(a: np.ndarray, sr: int, t: float) -> dict:
    """Análisis de un empalme en `t` (tiempo editado).

    Devuelve: salto de muestra (ratio vs p99,9 local), salto de DC,
    distancia espectral entre lados, profundidad y anchura del hueco
    del fundido, y veredicto (PASS/WARN/FAIL).
    """
    i = int(round(t * sr))
    n = len(a)
    d = np.abs(np.diff(a.astype(np.float64)))
    # Salto de muestra en ±1 ms vs baseline p99,9 en ±200 ms.
    lo, hi = max(0, i - int(0.001 * sr)), min(len(d), i + int(0.001 * sr))
    blo, bhi = max(0, i - int(0.2 * sr)), min(len(d), i + int(0.2 * sr))
    base = float(np.percentile(d[blo:bhi], 99.9)) if bhi > blo else 0.0
    jump = float(d[lo:hi].max()) if hi > lo else 0.0
    ratio = jump / max(base, 1e-4)
    # Salto de DC: media de 10 ms antes vs después.
    w10 = int(0.01 * sr)
    dc_pre = float(a[max(0, i - w10):i].mean()) if i > 0 else 0.0
    dc_post = float(a[i:min(n, i + w10)].mean()) if i < n else 0.0
    dc_jump = abs(dc_post - dc_pre)
    # Distancia espectral: FFT de 20 ms antes vs después (magnitud
    # logarítmica normalizada, distancia coseno).
    w20 = int(0.02 * sr)
    spec_dist = 0.0
    if i - w20 >= 0 and i + w20 <= n:
        win = np.hanning(w20)
        s_pre = np.abs(np.fft.rfft(a[i - w20:i] * win))
        s_post = np.abs(np.fft.rfft(a[i:i + w20] * win))
        lp = np.log10(s_pre + 1e-6)
        lq = np.log10(s_post + 1e-6)
        lp -= lp.mean()
        lq -= lq.mean()
        denom = (np.linalg.norm(lp) * np.linalg.norm(lq)) + 1e-12
        spec_dist = float(1.0 - np.dot(lp, lq) / denom)
    # Hueco del fundido: envolvente a 1 ms en ±15 ms; el hueco es la
    # caída del mínimo central (±7 ms) bajo la mediana de los flancos.
    env = rms_envelope(a, sr, 1.0, t - 0.015, t + 0.015)
    dip_db = 0.0
    dip_ms = 0.0
    flank_db = -120.0
    if len(env) >= 30:
        flank = np.concatenate([env[:8], env[-8:]])
        flank_db = float(np.median(flank))
        center = env[8:22]
        dip_db = float(flank_db - center.min())
        below = center < (flank_db - 6.0)
        dip_ms = float(below.sum())  # 1 ventana = 1 ms
    verdict = "PASS"
    reasons = []
    if ratio > SPLICE_JUMP_RATIO:
        verdict = "FAIL"
        reasons.append(f"salto de muestra {ratio:.1f}x el baseline")
    if dc_jump > SPLICE_DC_JUMP:
        verdict = "FAIL" if verdict == "FAIL" else "WARN"
        reasons.append(f"salto de DC {dc_jump:.4f}")
    if spec_dist > SPLICE_SPEC_DIST:
        verdict = "FAIL" if verdict == "FAIL" else "WARN"
        reasons.append(f"distancia espectral {spec_dist:.2f}")
    if dip_db > XFADE_DIP_FAIL_DB and flank_db > XFADE_AUDIBLE_DB:
        verdict = "FAIL"
        reasons.append(f"hueco de fundido {dip_db:.0f} dB "
                       f"({dip_ms:.0f} ms) en contenido audible "
                       f"({flank_db:.0f} dBFS)")
    elif dip_db > XFADE_DIP_WARN_DB:
        verdict = "FAIL" if verdict == "FAIL" else "WARN"
        reasons.append(f"hueco de fundido {dip_db:.0f} dB "
                       f"({dip_ms:.0f} ms, flancos {flank_db:.0f} dBFS)")
    return {"t": round(t, 3), "jump_ratio": round(ratio, 2),
            "dc_jump": round(dc_jump, 4),
            "spec_dist": round(spec_dist, 2),
            "dip_db": round(dip_db, 1), "dip_ms": round(dip_ms, 0),
            "flank_db": round(flank_db, 1),
            "verdict": verdict, "reasons": reasons}


# ---------------- mapa editado -> original ----------------

def build_time_map(plan: dict, eff_stretch: dict = None) -> list:
    """Segmentos (edited_start, edited_end, orig_start, factor)."""
    out = []
    for ln in plan["lines"]:
        f = ln["factor_uniforme"]
        if eff_stretch and ln["linea"] in eff_stretch:
            f = eff_stretch[ln["linea"]]
        for sg in ln["segs"]:
            out.append((sg["edited_start"], sg["edited_end"],
                        sg["orig_start"], f))
    return out


def ed2orig(t: float, tmap: list):
    """Tiempo editado -> tiempo original (None si cae fuera de un segmento)."""
    for es, ee, os_, f in tmap:
        if es - 1e-9 <= t <= ee + 1e-9:
            return os_ + (t - es) * f
    return None


# ---------------- (i2) dips dentro de palabras ----------------

def _dips_in_envelope(env: np.ndarray, win_ms: float = 5.0) -> list:
    """Dips en una envolvente: [(índice_centro, profundidad_dB, dur_ms)].

    Un dip es una ventana >= DIP_MIN_DB bajo la mediana de la
    envolvente y >= 8 dB bajo sus vecinas a ±10 ms, con duración
    DIP_MIN_MS..DIP_MAX_MS. Utilidad para tests y diagnóstico; la
    detección de producción usa la comparación de envolventes
    (word_dips), porque esta regla de notch no detecta los cierres
    PLANOS de oclusiva (vecinos igualmente silenciosos).
    """
    out = []
    if len(env) < 8:
        return out
    med = float(np.median(env))
    if med < DIP_VOICED_DB:
        return out
    k = 2
    while k < len(env) - 2:
        if env[k] < med - DIP_MIN_DB and \
                env[k] < min(env[k - 2], env[k + 2]) - 8:
            j0 = k
            while j0 > 0 and env[j0 - 1] < med - 8:
                j0 -= 1
            j1 = k
            while j1 < len(env) - 1 and env[j1 + 1] < med - 8:
                j1 += 1
            dur_ms = (j1 - j0 + 1) * win_ms
            if DIP_MIN_MS <= dur_ms <= DIP_MAX_MS:
                out.append(((j0 + j1) // 2, float(med - env[k]),
                            int(dur_ms)))
            k = j1 + 1
        else:
            k += 1
    return out


def word_dips(edited, orig, sr: int, words_ed: list, words_orig: list,
              tmap: list) -> list:
    """Dips dentro de palabras: la editada cae donde el original no.

    Comparación DIRECTA de envolventes (5 ms), normalizadas por su
    mediana por palabra (elimina la ganancia del loudnorm): por
    palabra se busca el mejor desplazamiento global (±30 ms, por
    correlación de envolvente — absorbe el warp del atempo y el
    desliz de los timestamps), y cada ventana editada se compara
    contra el MÍNIMO del original en ±10 ms de la posición alineada
    (el original solo necesita estar silencioso EN ALGÚN punto
    cercano para vetar el hallazgo: un cierre de oclusiva
    desplazado unos ms por el warp no es un microcorte). Un
    hallazgo es una racha de 10-80 ms con d < -10 dB en región
    sonora (env editada > -35 dBFS). Los cierres de oclusiva y las
    caídas fonéticas naturales aparecen en AMBAS envolventes en la
    misma posición alineada (d ≈ 0) y no se reportan.
    """
    out = []
    for i in range(min(len(words_ed), len(words_orig))):
        w, wo = words_ed[i], words_orig[i]
        s, e = w["s"], w["e"]
        if e - s < 0.12:
            continue
        env_e = rms_envelope(edited, sr, 5.0, s, e)
        # Original con márgenes de ±60 ms para la alineación.
        o0 = max(0.0, wo["s"] - 0.06)
        env_o = rms_envelope(orig, sr, 5.0, o0, wo["e"] + 0.06)
        if len(env_e) < 8 or len(env_o) < 8:
            continue
        med_e = float(np.median(env_e))
        if med_e < DIP_VOICED_DB:
            continue
        n_e = len(env_e)
        # Envolvente original MAPEADA a coordenadas editadas (el mapa
        # del plan aplica el factor de stretch; sin esto, una palabra
        # con atempo 1,11x desalinearía hasta 50 ms en sus bordes).
        env_m = np.full(n_e, np.nan)
        for k in range(n_e):
            t_o = ed2orig(s + k * 0.005, tmap)
            if t_o is None:
                continue
            idx = (t_o - o0) / 0.005
            i0 = int(np.floor(idx))
            frac = idx - i0
            if 0 <= i0 < len(env_o) - 1:
                env_m[k] = (env_o[i0] * (1 - frac)
                            + env_o[i0 + 1] * frac)
        valid = ~np.isnan(env_m)
        if valid.sum() < 8:
            continue
        # Mediana del original SOBRE EL TRAMO DE LA PALABRA (env_m),
        # no sobre env_o: env_o incluye los márgenes de ±60 ms, que
        # en palabras cortas y rodeadas de silencio dominan la
        # mediana y sesgan d hacia abajo (V4.1: «EL» de 120 ms con
        # márgenes silenciosos daba med_o=-35 dBFS frente a
        # med_e=-14,9 dBFS: sesgo de -12,7 dB y 3 FAIL espurios
        # donde la editada era el crudo + ganancia constante).
        med_o = float(np.median(env_m[valid]))
        # Refinamiento global (±30 ms = ±6 ventanas) por correlación.
        best_c, best_sh = -2.0, 0
        for sh in range(-6, 7):
            idx = np.arange(n_e)
            j = idx + sh
            ok = valid & (j >= 0) & (j < n_e) & ~np.isnan(env_m[j.clip(0, n_e - 1)])
            if ok.sum() < 8:
                continue
            x = env_m[j[ok]]
            y = env_e[ok]
            if float(np.std(x)) < 1e-6 or float(np.std(y)) < 1e-6:
                continue
            c = float(np.corrcoef(x, y)[0, 1])
            if not math.isnan(c) and c > best_c:
                best_c, best_sh = c, sh
        # d[k] = env editada - mínimo del original (mapeado +
        # desplazamiento) en ±10 ms. El guarda de «región sonora»
        # mira el ORIGINAL alineado (ahí debe haber voz): en la
        # editada un hueco ES silencio, así que un guarda sobre
        # env_e[k] vetaría justo lo que hay que detectar.
        d = np.zeros(n_e)
        orig_aligned = np.full(n_e, np.nan)
        for k in range(n_e):
            c = k + best_sh
            lo, hi = max(0, c - 2), min(n_e, c + 3)
            seg = env_m[lo:hi]
            seg = seg[~np.isnan(seg)]
            ref = float(seg.min()) if len(seg) else med_o
            d[k] = (env_e[k] - med_e) - (ref - med_o)
            if 0 <= c < n_e:
                orig_aligned[k] = env_m[c]
        # Nivel sostenido del original: mediana en ±25 ms (11
        # ventanas) de la envolvente alineada. Una ventana suelta
        # de 5 ms puede caer bajo -30 dB por fase glotal incluso en
        # una vocal fuerte; la mediana no.
        orig_smooth = np.full(n_e, np.nan)
        for k in range(n_e):
            seg = orig_aligned[max(0, k - 5):k + 6]
            seg = seg[~np.isnan(seg)]
            if len(seg):
                orig_smooth[k] = float(np.median(seg))
        # Rachas de d < -10 dB (5-80 ms) donde el original tiene voz
        # CLARA sostenida (>-30 dBFS): ver DIP_ORIG_MIN_DB.
        k = 0
        while k < n_e:
            voiced_o = (not np.isnan(orig_smooth[k])
                        and orig_smooth[k] > DIP_ORIG_MIN_DB)
            if d[k] < -DIP_MIN_DB and voiced_o:
                j = k
                while j + 1 < n_e and d[j + 1] < -DIP_MIN_DB:
                    j += 1
                dur_ms = (j - k + 1) * 5
                if DIP_MIN_MS <= dur_ms <= DIP_MAX_MS:
                    t_ed = s + (k + j) / 2 * 0.005
                    t_o = ed2orig(t_ed, tmap)
                    out.append({"word": w["w"],
                                "t_edited": round(t_ed, 3),
                                "t_orig": (round(t_o, 3)
                                           if t_o is not None else None),
                                "dip_edited_db": round(
                                    float(-d[k:j + 1].min()), 1),
                                "dur_ms": int(dur_ms)})
                k = j + 1
            else:
                k += 1
    return out


# ---------------- (i3) pausas entre palabras ----------------

def gap_report(edited, orig, sr: int, words_ed: list, words_orig: list,
               line_spans: list) -> list:
    """Pausas entre palabras consecutivas: original vs editada.

    line_spans: [(edited_start, edited_end, linea)] para agrupar por
    línea. La pausa se mide con voiced_span (RMS + armonicidad, la
    misma regla que el check (c) §4 de audit-audio.py, para no
    discrepar en el borde del umbral): offset de voz de la palabra
    anterior -> onset de voz de la siguiente. Las ventanas se
    extienden hasta 0,10 s (acotado a la mitad del hueco Whisper)
    porque los bordes de Whisper caen dentro del intervalo real.
    FAIL si la editada queda < GAP_MIN_S o pierde > GAP_MAX_LOSS,
    cuando la original era una pausa natural (>= GAP_MIN_S).
    """
    out = []
    n = min(len(words_ed), len(words_orig))
    for i in range(n - 1):
        w0, w1 = words_ed[i], words_ed[i + 1]
        # Misma línea: ambas palabras dentro de un mismo span.
        same = any(s0 - 0.1 <= w0["s"] and w1["s"] <= s1 + 0.1
                   for s0, s1, _ln in line_spans)
        if not same:
            continue
        o0, o1 = words_orig[i], words_orig[i + 1]
        gap_o = o1["s"] - o0["e"]
        gap_e = w1["s"] - w0["e"]
        ext_o = min(0.10, max(0.0, gap_o / 2))
        ext_e = min(0.10, max(0.0, gap_e / 2))
        _on, o_off = voiced_span(orig, sr, o0["s"] - 0.05,
                                 o0["e"] + ext_o)
        o_on, _off = voiced_span(orig, sr, o1["s"] - ext_o,
                                 o1["e"] + 0.05)
        _on, e_off = voiced_span(edited, sr, w0["s"] - 0.05,
                                 w0["e"] + ext_e)
        e_on, _off = voiced_span(edited, sr, w1["s"] - ext_e,
                                 w1["e"] + 0.05)
        if None in (o_off, o_on, e_off, e_on):
            continue
        o_gap = o_on - o_off
        e_gap = e_on - e_off
        if o_gap < GAP_MIN_S:
            continue
        if e_gap < GAP_MIN_S or e_gap < (1 - GAP_MAX_LOSS) * o_gap:
            out.append({"words": f"{w0['w']} -> {w1['w']}",
                        "t_edited": round(w0["e"], 3),
                        "orig_s": round(o_gap, 3),
                        "edited_s": round(e_gap, 3),
                        "loss_pct": round(100 * (1 - e_gap / o_gap), 0)})
    return out


# ---------------- (i4) contigüidad de segmentos ----------------

def segment_contiguity(edited, orig, sr: int, tmap: list) -> list:
    """Cada segmento editado debe ser un trozo contiguo del original.

    Por sub-ventanas de 100 ms CON ENERGÍA (RMS > -30 dBFS: el tono
    de sala no correlaciona tras highpass+loudnorm y destruiría la
    mediana): correlación contra el original en la posición mapeada
    (forma de onda si el factor ≈ 1; envolvente RMS a 5 ms si hay
    stretch, porque WSOLA reescribe la forma de onda pero conserva
    la envolvente). El lag se mide RELATIVO a la posición mapeada
    (se descuenta el margen de 20 ms del tramo original). FAIL si
    la correlación mediana < CONTIG_MIN_CORR o si los lags locales
    saltan > CONTIG_LAG_JUMP_MS entre sub-ventanas consecutivas
    (el segmento se armó de trozos no contiguos o mal mapeados).
    """
    out = []
    for k, (es, ee, os_, f) in enumerate(tmap):
        dur = ee - es
        n_win = int(dur // 0.1)
        if n_win < 2:
            continue
        stretched = abs(f - 1.0) > 0.01
        corrs, lags = [], []
        for j in range(n_win):
            ts = es + j * 0.1
            to = os_ + j * 0.1 * f
            seg_e = edited[int(ts * sr):int((ts + 0.1) * sr)]
            if rms_db(seg_e, sr, 0, 0.1) < -30.0:
                continue  # tono de sala: no correlaciona
            seg_o = orig[int(max(0, to - 0.02) * sr):
                         int((to + 0.12) * sr)]
            if stretched:
                env_e = rms_envelope(seg_e, sr, 5.0)
                env_o = rms_envelope(seg_o, sr, 5.0)
                # Desliza env_e (100 ms) dentro de env_o (140 ms).
                # Anti-aliasing como en best_lag: entre desplazamientos
                # con correlación a menos de 0,02 del máximo, el más
                # cercano a 0 (off 4 = lag relativo 0).
                scored = []
                for off in range(0, len(env_o) - len(env_e) + 1):
                    x = env_o[off:off + len(env_e)]
                    y = env_e
                    if len(x) < 8 or float(np.std(x)) < 1e-6 \
                            or float(np.std(y)) < 1e-6:
                        continue
                    c = float(np.corrcoef(x, y)[0, 1])
                    if not math.isnan(c):
                        scored.append((c, off))
                if scored:
                    best_c = max(c for c, _o in scored)
                    near = [o for c, o in scored
                            if c >= best_c - 0.02]
                    best_off = min(near, key=lambda o: abs(o - 4))
                    best_l = (best_off - 4) * 5
                else:
                    best_c, best_l = 0.0, 0
                corrs.append(max(best_c, 0.0))
                lags.append(best_l)
            else:
                # seg_o empieza 20 ms antes de la posición mapeada:
                # el lag esperado es +20 ms (prefer_lag).
                lag, c = best_lag(seg_o, seg_e, sr, search_ms=20.0,
                                  step=12,
                                  prefer_lag=int(0.02 * sr))
                # El lag relativo es lag - 20 ms.
                corrs.append(c)
                lags.append(lag / sr * 1000 - 20.0)
        if len(corrs) < 3:
            out.append({"segment": k, "edited": [round(es, 3),
                                                 round(ee, 3)],
                        "orig_start": round(os_, 3),
                        "factor": round(f, 3),
                        "median_corr": None, "max_lag_jump_ms": None,
                        "stretched": stretched, "ok": True,
                        "note": "sin suficientes ventanas con energía"})
            continue
        med_corr = float(np.median(corrs))
        # Saltos de lag solo entre ventanas CONSECUTIVAS con
        # correlación fiable (>0,5): una ventana con corr baja tiene
        # un lag arbitrario y no dice nada de la contigüidad.
        max_jump = 0.0
        for (a, ca), (b, cb) in zip(zip(lags, corrs),
                                    zip(lags[1:], corrs[1:])):
            if ca > 0.5 and cb > 0.5:
                max_jump = max(max_jump, abs(b - a))
        jump_lim = (CONTIG_LAG_JUMP_STRETCH_MS if stretched
                    else CONTIG_LAG_JUMP_MS)
        ok = med_corr >= CONTIG_MIN_CORR and max_jump <= jump_lim
        out.append({"segment": k, "edited": [round(es, 3), round(ee, 3)],
                    "orig_start": round(os_, 3), "factor": round(f, 3),
                    "median_corr": round(med_corr, 3),
                    "max_lag_jump_ms": round(max_jump, 1),
                    "stretched": stretched, "ok": bool(ok)})
    return out


# ---------------- (i5) enmascaramiento por SFX ----------------

def sfx_masking(mix, voice, sr: int, sfx_times: list,
                words_ed: list) -> list:
    """SFX que entierran el ataque de una palabra.

    Por cada SFX cuyo tiempo cae en [-40 ms, +50 ms] respecto al
    onset de una palabra (el boom de apertura a 0,0 s queda fuera:
    la primera palabra arranca 160 ms después de su ataque): nivel
    de la mezcla vs nivel de la VO en los primeros 30 ms de la
    palabra. Si la mezcla supera a la VO en >15 dB, el ataque de
    la palabra queda enmascarado y la palabra suena cortada por la
    cabeza. Solo se mide si hay energía de palabra en la ventana
    (VO > -50 dBFS): sin energía no hay nada que enmascarar.
    """
    out = []
    onsets = [(w["s"], w["w"]) for w in words_ed]
    for t in sfx_times:
        near = [(s, w) for s, w in onsets if -0.04 <= t - s <= 0.05]
        if not near:
            continue
        s, w = min(near, key=lambda x: abs(x[0] - t))
        mix_db = rms_db(mix, sr, s, s + 0.03)
        vo_db = rms_db(voice, sr, s, s + 0.03)
        if vo_db < -50.0:
            continue
        mask = mix_db - vo_db
        if mask > SFX_MASK_WARN_DB:
            out.append({"sfx_t": round(t, 3), "word": w,
                        "onset_s": round(s, 3),
                        "mix_db": round(mix_db, 1),
                        "voice_db": round(vo_db, 1),
                        "mask_db": round(mask, 1),
                        "sev": ("FAIL" if mask > SFX_MASK_FAIL_DB
                                else "WARN")})
    return out


# ---------------- orquestación ----------------

def detect_all(edited, orig, sr: int, plan: dict, words_ed: list,
               words_orig: list, mix=None, sfx_times=None,
               eff_stretch: dict = None) -> dict:
    """Ejecuta (i1)-(i5) y devuelve {findings, metrics}.

    findings: [{check: 'i1'..., sev, t, msg}]. metrics: contadores.
    `edited`/`orig`/`mix` son arrays (o rutas si se pasa str).
    """
    if isinstance(edited, str):
        edited = load_wav_fast(edited, sr)
    if isinstance(orig, str):
        orig = load_wav_fast(orig, sr)
    if isinstance(mix, str):
        mix = load_audio(mix, sr)
    findings = []
    metrics = {}
    tmap = build_time_map(plan, eff_stretch)
    line_spans = [(ln["segs"][0]["edited_start"],
                   ln["segs"][-1]["edited_end"], ln["linea"])
                  for ln in plan["lines"]]

    # (i1) empalmes internos (fin de seg k = inicio de seg k+1).
    n_splice_fail = n_splice_warn = 0
    worst_dip = 0.0
    for ln in plan["lines"]:
        segs = ln["segs"]
        for i in range(len(segs) - 1):
            te = segs[i]["edited_end"]
            r = splice_report(edited, sr, te)
            worst_dip = max(worst_dip, r["dip_db"])
            if r["verdict"] == "FAIL":
                n_splice_fail += 1
                findings.append({"check": "i1", "sev": "FAIL", "t": te,
                                 "msg": f"empalme L{ln['linea']} @ "
                                        f"{te:.3f}s: "
                                        + "; ".join(r["reasons"])})
            elif r["verdict"] == "WARN":
                n_splice_warn += 1
                findings.append({"check": "i1", "sev": "WARN", "t": te,
                                 "msg": f"empalme L{ln['linea']} @ "
                                        f"{te:.3f}s: "
                                        + "; ".join(r["reasons"])})
    metrics["i1_splice_fail"] = n_splice_fail
    metrics["i1_splice_warn"] = n_splice_warn
    metrics["i1_worst_dip_db"] = round(worst_dip, 1)
    if n_splice_fail == 0 and n_splice_warn == 0:
        findings.append({"check": "i1", "sev": "PASS", "t": None,
                         "msg": "empalmes limpios (sin saltos, huecos "
                                "ni discontinuidades espectrales)"})

    # (i2) dips dentro de palabras.
    dips = word_dips(edited, orig, sr, words_ed, words_orig, tmap)
    metrics["i2_word_dips"] = len(dips)
    for d in dips:
        findings.append({"check": "i2", "sev": "FAIL", "t": d["t_edited"],
                         "msg": f"dip en {d['word']!r} @ "
                                f"{d['t_edited']:.3f}s: la editada cae "
                                f"{d['dip_edited_db']:.0f} dB "
                                f"({d['dur_ms']} ms) y el original NO "
                                f"tiene esa caída en la misma posición "
                                f"fonética — borde de fonema recortado "
                                f"o hueco de edición"})
    if not dips:
        findings.append({"check": "i2", "sev": "PASS", "t": None,
                         "msg": "sin dips dentro de palabras (toda "
                                "caída de la editada existe también en "
                                "el original)"})

    # (i3) pausas entre palabras.
    gaps = gap_report(edited, orig, sr, words_ed, words_orig, line_spans)
    metrics["i3_pause_fails"] = len(gaps)
    for g in gaps:
        findings.append({"check": "i3", "sev": "FAIL", "t": g["t_edited"],
                         "msg": f"pausa recortada {g['words']}: original "
                                f"{g['orig_s']:.2f}s, editada "
                                f"{g['edited_s']:.2f}s "
                                f"(pérdida {g['loss_pct']:.0f}%)"})
    if not gaps:
        findings.append({"check": "i3", "sev": "PASS", "t": None,
                         "msg": "pausas naturales preservadas "
                                "(original vs editada)"})

    # (i4) contigüidad de segmentos.
    cont = segment_contiguity(edited, orig, sr, tmap)
    bad = [c for c in cont if not c["ok"]]
    metrics["i4_bad_segments"] = len(bad)
    metrics["i4_segments"] = len(cont)
    for c in bad:
        findings.append({"check": "i4", "sev": "FAIL",
                         "t": c["edited"][0],
                         "msg": f"segmento {c['segment']} "
                                f"({c['edited'][0]:.2f}-"
                                f"{c['edited'][1]:.2f}s, orig "
                                f"{c['orig_start']:.2f}s, factor "
                                f"{c['factor']}): NO es un trozo "
                                f"contiguo del original (corr mediana "
                                f"{c['median_corr']:.2f}, salto de lag "
                                f"{c['max_lag_jump_ms']:.0f} ms)"})
    if not bad:
        findings.append({"check": "i4", "sev": "PASS", "t": None,
                         "msg": f"{len(cont)} segmentos verificados "
                                "como trozos contiguos del original"})

    # (i5) enmascaramiento por SFX (requiere mezcla + tiempos).
    if mix is not None and sfx_times:
        masks = sfx_masking(mix, edited, sr, sfx_times, words_ed)
        metrics["i5_sfx_masks"] = len(masks)
        for m in masks:
            findings.append({"check": "i5", "sev": m["sev"],
                             "t": m["onset_s"],
                             "msg": f"SFX @ {m['sfx_t']:.2f}s entierra "
                                    f"el ataque de {m['word']!r}: mezcla "
                                    f"{m['mix_db']:.0f} dBFS vs voz "
                                    f"{m['voice_db']:.0f} dBFS en los "
                                    f"primeros 30 ms "
                                    f"(+{m['mask_db']:.0f} dB) — la "
                                    f"palabra suena cortada por la cabeza"})
        if not masks:
            findings.append({"check": "i5", "sev": "PASS", "t": None,
                             "msg": "ningún SFX enmascara el ataque de "
                                    "una palabra"})
    else:
        findings.append({"check": "i5", "sev": "INFO", "t": None,
                         "msg": "sin mezcla o sin tiempos de SFX: no se "
                                "mide el enmascaramiento"})
    return {"findings": findings, "metrics": metrics}


def load_whisper_file(path: str) -> list:
    with open(path, encoding="utf-8") as f:
        raw = f.read()
    segs = json.loads(raw[raw.index("["):])
    words = []
    for s in segs:
        for w in s["words"]:
            words.append({"w": w["w"], "s": w["s"], "e": w["e"]})
    return words


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--edited", required=True, help="VO editada (WAV)")
    p.add_argument("--orig", required=True, help="VO original (WAV)")
    p.add_argument("--edit-plan", required=True)
    p.add_argument("--prediction", required=True,
                   help="vo-editada-prediccion.json (palabras editadas)")
    p.add_argument("--transcription", required=True,
                   help="transcripción Whisper del original")
    p.add_argument("--mix", help="mezcla final (WAV, para (i5))")
    p.add_argument("--sfx", action="append", default=[],
                   help="SFX ARCHIVO@SEGUNDO (repetible, para (i5))")
    p.add_argument("--out", help="informe JSON (por defecto stdout)")
    a = p.parse_args()

    plan = json.load(open(a.edit_plan))
    words_ed = json.load(open(a.prediction))["palabras"]
    words_orig = load_whisper_file(a.transcription)
    sfx_times = []
    for spec in a.sfx:
        _path, at = spec.rsplit("@", 1)
        sfx_times.append(float(at))
    res = detect_all(a.edited, a.orig, SR, plan, words_ed, words_orig,
                     mix=a.mix, sfx_times=sfx_times or None)
    n_fail = sum(1 for f in res["findings"] if f["sev"] == "FAIL")
    n_warn = sum(1 for f in res["findings"] if f["sev"] == "WARN")
    print(f"Microcortes: {n_fail} FAIL, {n_warn} WARN")
    for f in res["findings"]:
        if f["sev"] in ("FAIL", "WARN"):
            t = f" @ {f['t']:.2f}s" if f["t"] is not None else ""
            print(f"  [{f['check']}] {f['sev']}{t}: {f['msg']}")
    if a.out:
        json.dump(res, open(a.out, "w"), ensure_ascii=False, indent=1)
        print(f"Informe: {a.out}")
    return 0 if n_fail == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
