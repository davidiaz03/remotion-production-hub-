#!/usr/bin/env python3
"""Detección de onsets por envolvente (hub-speed-v5, audio).

Módulo compartido por `align-captions.py` y `audit-audio.py` (check
(g)). Nace de la adjudicación V5 de marti-fidel (21-nov-2026):

* Los tiempos de palabra de Whisper adelantan sistemáticamente los
  bordes tras pausa (mediana firmada −0,21 s; hasta −0,56 s). La
  única alineación autoritativa karaoke/voz es la ACÚSTICA: la
  envolvente de la VO en ventanas de 10 ms.
* El detector viejo (`acoustic_span`, umbral absoluto −50 dBFS)
  ACERTABA en los 9 casos V5: los onsets son bruscos y reales, no
  un artefacto del umbral. Este módulo lo reimplementa vectorizado
  (misma semántica, mismo umbral) y añade las variantes que se
  probaron y se RECHAZARON con medidas (ver abajo): el backlog V4
  pedía «envolvente/correlación en vez de umbral crudo» asumiendo
  que el umbral era el problema; la V5 demostró que no lo era.

Detector principal: `envelope_onset` — primera ventana de 10 ms
que inicia una racha de 2 ventanas consecutivas sobre −50 dBFS.
El umbral −50 caza fricativas y glides; el tono de sala de este
pipeline queda por debajo salvo excursiones de UNA ventana, que
la regla de racha descarta. Validado contra `acoustic_span(-50)`
sobre los 17 captions tras silencio de marti-fidel V5: acuerdo
EXACTO en los 17 (ver `test_align_audit.py`).

Alternativas probadas y rechazadas (medidas en la VO v41):

* Umbral RELATIVO al suelo local (mediana de los 0,35 s previos
  + 5 dB): dispara en falso sobre la deriva del tono de sala
  (MARTÍ 5,60 en vez de 5,90; UN 12,76 en vez de 13,37; CUANDO
  53,04 en vez de 53,58; ¡QUE 64,02 en vez de 64,43). El tono de
  sala fluctúa ±7 dB entre segmentos (cada línea tiene su propia
  ganancia) y el onset de «EL» es de solo +8 dB: no hay margen
  que separe deriva de onset.
* Umbral con puerta de ARMONICIDAD (RMS > −55 dB y harm > 0,4):
  el tono de sala de esta grabación ES armónico (harm 0,45–0,53
  en silencio puro: zumbido/reverberación de cola) y dispara en
  falso (MARTÍ 5,72; ¡QUE 64,02); además PIERDE «UN» entero (el
  ataque de /u/ no sostiene harm > 0,4 en 2 ventanas de 20 ms).
* `rise_onset` (máxima subida de envolvente / correlación con un
  escalón): encuentra el ataque MÁS FUERTE de la ventana, no el
  PRIMERO. En «EL» (L6) devuelve 26,23–26,31 s (el ataque de
  «GIGANTE») en vez del onset real de «EL» a 25,91 s (una /e/
  quieta a −47 dBFS). Se conserva como utilidad de contraste y
  para ataques en medio de frase, donde no hay silencio previo
  que delimite la búsqueda.

Además: `line_peak_db` — pico robusto (p95 de la envolvente RMS
de 20 ms) de una línea, base de los umbrales relativos de
`voiced_span` en (c) §4 (la ganancia por línea sesgaba la medida
absoluta de pausas; ver `audit-audio.py`).
"""

import math

import numpy as np

WIN_S = 0.01          # ventana de la envolvente (10 ms, como el auditor V5)
ONSET_THRESH_DB = -50.0   # umbral de onset (vindicado en V5; caza fricativas)
ONSET_SUSTAIN = 2     # ventanas consecutivas sobre el umbral (20 ms)


def rms_envelope_db(a: np.ndarray, sr: int, win_s: float = WIN_S,
                    t0: float = 0.0, t1: float = None):
    """Envolvente RMS en dBFS por ventanas consecutivas de `win_s`.

    Devuelve (tiempos, dB): tiempos = inicio de cada ventana.
    Vectorizada (reshape): ~100x más rápida que el bucle por
    ventanas de `acoustic_span` para audios largos. La rejilla de
    ventanas es ABSOLUTA (múltiplos de `win_s` desde t=0, igual
    que `acoustic_span`), no relativa a `t0`: así los onsets
    coinciden al milisegundo con los de la auditoría.
    """
    if t1 is None:
        t1 = len(a) / sr
    win = max(1, int(win_s * sr))
    i0, i1 = max(0, int(t0 * sr)), min(len(a), int(t1 * sr))
    k0 = i0 // win
    n = (i1 - k0 * win) // win
    if n <= 0:
        return np.array([]), np.array([])
    seg = a[k0 * win:(k0 + n) * win].astype(np.float64).reshape(n, win)
    rms = np.sqrt((seg ** 2).mean(axis=1))
    db = 20 * np.log10(np.maximum(rms, 1e-9))
    times = (k0 + np.arange(n)) * win_s
    return times, db


def envelope_onset(a: np.ndarray, sr: int, t0: float, t1: float,
                   thresh_db: float = ONSET_THRESH_DB,
                   sustain: int = ONSET_SUSTAIN):
    """Primer onset acústico en [t0, t1] (o None si no hay).

    Primera ventana de 10 ms que inicia una racha de `sustain`
    ventanas consecutivas sobre `thresh_db`. Misma semántica que
    `audit-audio.acoustic_span(..., thresh_db=-50.0)` para el
    onset (acuerdo exacto en los 17 casos V5), vectorizada.
    La racha sostenida descarta blips aislados (chasquido de boca,
    respiro, excursión del tono de sala: una sola ventana alta no
    es un onset).
    """
    times, db = rms_envelope_db(a, sr, t0=t0, t1=t1)
    if len(db) < sustain:
        return None
    above = db >= thresh_db
    for j in range(len(above) - sustain + 1):
        if above[j:j + sustain].all():
            return round(float(times[j]), 3)
    return None


def rise_onset(a: np.ndarray, sr: int, t0: float, t1: float,
               win_s: float = 0.10):
    """Onset por máxima subida de envolvente (correlación escalón).

    Para cada candidato t en [t0, t1]: subida = media(env[t:t+win])
    - media(env[t-win:t]); devuelve el t de máxima subida (o None
    si la subida máxima es < 6 dB, es decir, no hay ataque claro).

    NO usar para primeras palabras tras silencio: encuentra el
    ataque más fuerte de la ventana, no el primero (caso «EL» L6
    de marti-fidel V5: devuelve el ataque de «GIGANTE»). Útil como
    contraste o para ataques en medio de frase.
    """
    times, db = rms_envelope_db(a, sr, t0=max(0.0, t0 - win_s),
                                t1=t1 + win_s)
    if len(db) == 0:
        return None
    w = max(1, int(win_s / WIN_S))
    lin = 10 ** (db / 20.0)
    best_t, best_rise = None, 6.0
    for j in range(w, len(lin) - w):
        t = float(times[j])
        if t < t0 or t > t1:
            continue
        pre = float(np.mean(lin[j - w:j])) + 1e-9
        post = float(np.mean(lin[j:j + w])) + 1e-9
        rise = 20 * math.log10(post / pre)
        if rise > best_rise:
            best_rise, best_t = rise, t
    return round(best_t, 3) if best_t is not None else None


def line_peak_db(a: np.ndarray, sr: int, t0: float, t1: float,
                 win_s: float = 0.02, pct: float = 95.0):
    """Pico robusto de una línea (dBFS): percentil `pct` de la
    envolvente RMS de `win_s` en [t0, t1].

    El p95 (no el máximo) ignora picos aislados (clics, plosivas).
    Base de los umbrales relativos de `voiced_span` en (c) §4:
    thresh = pico - 32 dB, loud = max(pico - 12 dB, -28 dBFS).
    """
    _t, db = rms_envelope_db(a, sr, win_s=win_s, t0=t0, t1=t1)
    if len(db) == 0:
        return -120.0
    return float(np.percentile(db, pct))
