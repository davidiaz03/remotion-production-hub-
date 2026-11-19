#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Construcción de VO sin microcortes (módulo compartido).

Sustituye el patrón de `build-vo-real-v23.py` (`edit_line` +
`fade_edges`) por una ruta que no introduce los defectos que
`microcut.py` detecta:

* El patrón viejo aplica un fundido de SALIDA de 5 ms al final de
  cada segmento y uno de ENTRADA de 5 ms al inicio del siguiente.
  Eso NO es un crossfade: entre ambos fundidos queda un hueco de
  ~10 ms que baja a -85 dBFS en tono de sala (medido en V2.3: huecos
  de 13-33 dB en los 7 empalmes internos, check (i1)). Aquí los
  empalmes son CROSSFADES DE IGUAL POTENCIA (seno/coseno) sobre
  material solapado del original: la potencia se mantiene
  constante a través del empalme y no hay hueco.
* Los cortes se ajustan al CRUCE POR CERO más cercano (±2 ms), para
  que ningún empalme empiece o termine en un valor de muestra
  distinto de cero (salto de muestra = clic o discontinuidad de
  fase, check (i1)).
* Ningún corte puede caer DENTRO de una palabra: los intervalos a
  eliminar se validan contra los timestamps de Whisper con un
  margen de seguridad de 30 ms alrededor de cada borde de fonema
  (los timestamps de Whisper derivan ±10-20 ms; sin margen, un
  trim «en la pausa» puede morder el ataque o la cola de un
  fonema, check (i2)). Un corte que no cabe en un hueco seguro se
  reduce al hueco o se abandona con advertencia — nunca se recorta
  dentro de una palabra.
* Regla de pausa (18-nov-2026, check (c) §4 de audit-audio.py):
  ninguna pausa intra-línea natural puede quedar por debajo de
  0,25 s ni perder más del 50%. `adjust_cuts_to_word_gaps`
  respeta ese suelo: el intervalo eliminado nunca deja una pausa
  residual menor que max(0,25 s, 50% de la pausa original).

Uso típico (sustituye a `edit_line`):

    from vo_build import edit_line_safe
    audio, segs, report = edit_line_safe(
        x, SR, head, tail, cuts, words,
        xf_ms=10.0, margin_s=0.03)
    for w in report["warnings"]:
        print("AVISO:", w)

`words` son los timestamps de Whisper de la línea en tiempo del
ORIGINAL: [{"w": str, "s": float, "e": float}, ...].

Sin dependencias fuera de numpy. Probado en test_microcut.py.
"""

import numpy as np

DEFAULT_XF_MS = 10.0       # crossfade de igual potencia en empalmes
DEFAULT_SNAP_MS = 2.0      # búsqueda del cruce por cero
DEFAULT_MARGIN_S = 0.03    # margen de seguridad en bordes de fonema
MIN_PAUSE_S = 0.25         # suelo de pausa (regla 18-nov-2026)
MAX_PAUSE_LOSS = 0.50      # pérdida máxima de pausa (regla 18-nov)
FADE_EDGE_MS = 5.0         # fundido en los extremos de la línea
# (cabeza/cola: no son empalmes, el fundido clásico basta)


def nearest_zero_crossing(x: np.ndarray, idx: int,
                          search: int) -> int:
    """Índice del cruce por cero más cercano a `idx` (±`search`).

    Si no hay cambio de signo en la ventana, devuelve la muestra
    de menor |x| (el punto de menor salto posible).
    """
    n = len(x)
    lo = max(1, idx - search)
    hi = min(n - 1, idx + search)
    best, best_d = idx, None
    for j in range(lo, hi + 1):
        if x[j] == 0.0 or (x[j - 1] < 0) != (x[j] < 0):
            d = abs(j - idx)
            if best_d is None or d < best_d:
                best, best_d = j, d
    if best_d is not None:
        return best
    seg = np.abs(x[lo:hi + 1])
    return lo + int(np.argmin(seg))


def word_spans(words: list, margin: float) -> list:
    """Intervalos [s-margen, e+margen] de cada palabra, ordenados."""
    spans = sorted((w["s"] - margin, w["e"] + margin) for w in words)
    return spans


def adjust_cuts_to_word_gaps(cuts: list, words: list,
                             margin: float = DEFAULT_MARGIN_S) -> tuple:
    """Ajusta los intervalos a eliminar para no morder ninguna palabra.

    `cuts`: [(inicio, fin)] en segundos (tiempo del original).
    Devuelve (cuts_ajustados, ajustes) donde cada ajuste es un
    dict con el corte original, el ajustado y el motivo. Un corte
    que no cabe en ningún hueco seguro se ABANDONA (la pausa se
    conserva entera) y se reporta como advertencia: recortar
    dentro de una palabra es peor que dejar la pausa larga.
    """
    spans = word_spans(words, margin)
    out, ajustes = [], []
    for c0, c1 in cuts:
        a0, a1 = c0, c1
        for s, e in spans:
            if a0 < e and a1 > s:
                # El intervalo (ya ajustado) solapa con la palabra:
                # si empieza antes de ella, acortar su final hasta
                # el borde; si empieza dentro de ella, retrasar su
                # inicio hasta el borde final.
                if a0 < s:
                    a1 = min(a1, s)
                else:
                    a0 = max(a0, e)
        if a1 - a0 < 0.005:
            ajustes.append({"cut": (round(c0, 3), round(c1, 3)),
                            "ajustado": None,
                            "motivo": "sin hueco seguro entre "
                                      "palabras (margen %.0f ms): "
                                      "corte abandonado" %
                                      (margin * 1000)})
            continue
        if (a0, a1) != (c0, c1):
            ajustes.append({"cut": (round(c0, 3), round(c1, 3)),
                            "ajustado": (round(a0, 3), round(a1, 3)),
                            "motivo": "recortado al hueco seguro "
                                      "entre palabras"})
        out.append((a0, a1))
    return out, ajustes


def enforce_pause_floor(cuts: list, words: list,
                        margin: float = DEFAULT_MARGIN_S) -> tuple:
    """Aplica el suelo de pausa a los cortes (regla 18-nov-2026).

    Para cada corte, la pausa ORIGINAL es el hueco entre las dos
    palabras adyacentes (sin margen). El corte nunca puede dejar
    una pausa residual menor que max(0,25 s, 50% de la original).
    Devuelve (cuts_ajustados, ajustes).
    """
    spans = sorted((w["s"], w["e"]) for w in words)
    out, ajustes = [], []
    for c0, c1 in cuts:
        # Palabras adyacentes al corte.
        prev_end, next_start = None, None
        for s, e in spans:
            if e <= c0:
                prev_end = e
            elif s >= c1 and next_start is None:
                next_start = s
        if prev_end is None or next_start is None:
            out.append((c0, c1))
            continue
        pausa_orig = next_start - prev_end
        suelo = max(MIN_PAUSE_S, pausa_orig * (1.0 - MAX_PAUSE_LOSS))
        residuo = pausa_orig - (c1 - c0)
        if residuo < suelo:
            # Reducir el corte por el final (conservar el inicio
            # de la pausa, donde cae la cola del fonema anterior).
            exceso = suelo - residuo
            c1_new = c1 - exceso
            ajustes.append({"cut": (round(c0, 3), round(c1, 3)),
                            "ajustado": (round(c0, 3), round(c1_new, 3)),
                            "motivo": f"suelo de pausa: residual "
                                      f"{residuo:.3f}s < {suelo:.3f}s"})
            out.append((c0, c1_new))
        else:
            out.append((c0, c1))
    return out, ajustes


def equal_power_crossfade(a_tail: np.ndarray,
                          b_head: np.ndarray) -> np.ndarray:
    """Crossfade de igual potencia entre dos tramos de igual longitud.

    out = a * cos(pi/2 * u) + b * sin(pi/2 * u), u en 0..1.
    Potencia constante: cos² + sin² = 1. Sustituye al patrón
    fade-out + fade-in, que deja un hueco de ~10 ms a -85 dBFS.
    """
    n = min(len(a_tail), len(b_head))
    u = np.linspace(0.0, 1.0, n)
    return (a_tail[:n] * np.cos(0.5 * np.pi * u)
            + b_head[:n] * np.sin(0.5 * np.pi * u))


def splice_with_crossfade(chunks: list, sr: int,
                          xf_ms: float = DEFAULT_XF_MS) -> np.ndarray:
    """Une trozos de audio con crossfades de igual potencia.

    El crossfade SOLAPA los trozos: cada empalme consume `xf_ms`
    de la cola del trozo anterior y `xf_ms` de la cabeza del
    siguiente, y los sustituye por una única región de `xf_ms`.
    La duración total se acorta `xf_ms` por empalme. Para
    conservar duraciones exactas desde el original, usar
    `edit_line_safe` (que toma el solape del material eliminado).
    """
    if not chunks:
        return np.array([], dtype=np.float32)
    xf = int(round(xf_ms / 1000.0 * sr))
    out = np.array(chunks[0], dtype=np.float32)
    for ch in chunks[1:]:
        ch = np.asarray(ch, dtype=np.float32)
        n = min(xf, len(out), len(ch))
        if n < 2:
            out = np.concatenate([out, ch])
            continue
        x = equal_power_crossfade(out[-n:], ch[:n])
        out = np.concatenate([out[:-n], x, ch[n:]])
    return out


def edit_line_safe(x, sr: int, head: float, tail: float, cuts: list,
                   words: list = None, xf_ms: float = DEFAULT_XF_MS,
                   snap_ms: float = DEFAULT_SNAP_MS,
                   margin_s: float = DEFAULT_MARGIN_S) -> tuple:
    """Edita una línea: recorta cabeza/cola y los intervalos de
    `cuts`, con empalmes de igual potencia y cortes seguros.

    Devuelve (audio, segmentos, informe) donde segmentos son
    [(orig_ini, orig_fin, edit_ini, edit_fin)] en segundos (mismo
    formato que el `edit_line` de build-vo-real-v23.py) e informe
    es {"cuts_ajustados": [...], "warnings": [...]}.

    Los empalmes internos toman el solape del material original
    a ambos lados del corte (que existe porque los cortes caen en
    pausas), así que la duración total es EXACTAMENTE la suma de
    los intervalos conservados, igual que con el patrón viejo.
    """
    x = np.asarray(x, dtype=np.float32)
    report = {"cuts_ajustados": [], "warnings": []}
    cuts = sorted((float(a), float(b)) for a, b in cuts)
    if words:
        cuts, adj = adjust_cuts_to_word_gaps(cuts, words, margin_s)
        report["cuts_ajustados"].extend(adj)
        cuts, adj2 = enforce_pause_floor(cuts, words, margin_s)
        report["cuts_ajustados"].extend(adj2)
    # Intervalos conservados.
    bounds = [head] + [c for cut in cuts for c in cut] + [tail]
    kept = [(bounds[i], bounds[i + 1])
            for i in range(0, len(bounds), 2)]
    # Ajuste a cruces por cero (solo bordes internos; cabeza/cola
    # llevan fundido y no lo necesitan, pero no estorba).
    snap_n = int(round(snap_ms / 1000.0 * sr))
    kept_snapped = []
    for a, b in kept:
        i0 = nearest_zero_crossing(x, int(round(a * sr)), snap_n)
        i1 = nearest_zero_crossing(x, int(round(b * sr)), snap_n)
        if i1 - i0 < 2:
            report["warnings"].append(
                f"segmento {a:.3f}-{b:.3f}s demasiado corto tras "
                f"el ajuste a cruce por cero; se conserva sin ajustar")
            i0, i1 = int(round(a * sr)), int(round(b * sr))
        kept_snapped.append((i0, i1))
    # Crossfade: cada empalme solapa h muestras a cada lado del
    # corte, tomadas del original (del hueco eliminado).
    h = int(round(xf_ms / 1000.0 * sr / 2.0))
    total = sum(i1 - i0 for i0, i1 in kept_snapped)
    out = np.zeros(total, dtype=np.float32)
    segs = []
    pos = 0
    for k, (i0, i1) in enumerate(kept_snapped):
        dur = i1 - i0
        # Extensión disponible: no invadir el segmento vecino.
        h_prev = h if k > 0 else 0
        h_next = h if k < len(kept_snapped) - 1 else 0
        # Limitar el solape a la mitad del hueco eliminado real.
        if k > 0:
            gap_prev = i0 - kept_snapped[k - 1][1]
            h_prev = min(h_prev, max(0, gap_prev // 2))
        if k < len(kept_snapped) - 1:
            gap_next = kept_snapped[k + 1][0] - i1
            h_next = min(h_next, max(0, gap_next // 2))
        # El solape total no puede exceder la mitad del segmento.
        h_max = max(0, (dur - 2) // 4)
        h_prev = min(h_prev, h_max)
        h_next = min(h_next, h_max)
        # Ventana de igual potencia: seno en la cabeza solapada,
        # coseno en la cola solapada, 1.0 en el medio.
        seg = x[max(0, i0 - h_prev):i1 + h_next].copy()
        n = len(seg)
        win = np.ones(n, dtype=np.float32)
        if h_prev > 0:
            m = 2 * h_prev
            u = np.linspace(0.0, 1.0, m)
            win[:m] = np.sin(0.5 * np.pi * u)
        if h_next > 0:
            m = 2 * h_next
            u = np.linspace(0.0, 1.0, m)
            win[-m:] = np.cos(0.5 * np.pi * u)
        # Colocación: el segmento extendido empieza h_prev antes
        # de su posición nominal; el solape se SUMA (overlap-add)
        # con la cola del anterior.
        start = pos - h_prev
        out[start:start + n] += seg * win
        segs.append((i0 / sr, i1 / sr, pos / sr, (pos + dur) / sr))
        pos += dur
    # Fundido clásico en los extremos de la línea (no son empalmes).
    fe = int(round(FADE_EDGE_MS / 1000.0 * sr))
    if len(out) > 2 * fe:
        ramp = 0.5 - 0.5 * np.cos(np.pi * np.arange(fe) / fe)
        out[:fe] *= ramp
        out[-fe:] *= ramp[::-1]
    return out, segs, report
