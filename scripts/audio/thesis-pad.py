#!/usr/bin/env python3
"""Sustituye un tramo de cama musical por un pad grave tenido.

Uso: thesis-pad.py --in cama.wav --out cama-padded.wav \
       --pad 53.01 57.04 --source 20.0 4.0 [--fade 0.5] \
       [--lowpass 300] [--target-rms-db -17.8]

Motivo (V5 marti-fidel, 21-nov-2026): `dip-bed.py` llevaba la música
a SILENCIO TOTAL en la tesis y el usuario lo sentía como un agujero,
no como drama. Este script mantiene una presencia baja sostenida: un
pad grave, construido a partir de un pasaje limpio de la propia cama,
que cubre el tramo con crossfades de igual potencia.

Construcción del pad:
  1. Se extrae el pasaje fuente (--source START DUR, segundos de la
     propia cama) y se repite en bucle con crossfades de igual
     potencia de 0,5 s en cada empalme, hasta cubrir el tramo + los
     dos fades.
  2. Se pasa por un lowpass Butterworth (defecto 300 Hz, filtfilt)
     para quedarse solo con el grave.
  3. Se normaliza a --target-rms-db (RMS del tramo tenido, sin fades).
  4. Crossfade de igual potencia con la cama: la cama baja a 0 en
     [START-FADE, START] mientras el pad sube, y viceversa en
     [END, END+FADE]. Dentro de [START, END] solo suena el pad.

Calibración del nivel (marti-fidel V5): el pad debe quedar ~-20 dB
bajo los picos de VO en la MEZCLA FINAL. NO fiarse del cálculo
teórico: la primera calibración (-17,8 dBFS, suponiendo ducking
-4 dB) midió -14,3 dB bajo los picos en la mezcla real (el ducking
con threshold 0,12 apenas muerde: la VO ronda el umbral). La
transferencia MEDIDA cama->mezcla para el pad es -6,8 dB (volume
0,38 + ducking efectivo + ganancia del loudnorm final). Con picos
de VO (RMS 50 ms) a -10,25 dBFS en la mezcla, el pad debe medir
-30,25 dBFS solo: -30,25 + 6,8 = -23,5 dBFS en la cama. Verificar
siempre en la mezcla final (RMS del pad solo, por resta de
energías contra la pausa de la VO, vs picos de VO) y ajustar si
difiere >2 dB.

La salida conserva el formato de la entrada (misma frecuencia de
muestreo, mismo número de canales, WAV float).
"""
import argparse
import json
import os
import sys

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfiltfilt

JOIN_XFADE = 0.5  # crossfade de igual potencia en cada empalme del bucle


def rms_db(x):
    r = float(np.sqrt(np.mean(np.asarray(x, dtype=np.float64) ** 2)))
    return 20 * np.log10(r) if r > 0 else -120.0


def loop_source(src, sr, needed):
    """Repite `src` (mono) hasta `needed` muestras, con crossfade de
    igual potencia en cada empalme."""
    n = len(src)
    xfade = int(JOIN_XFADE * sr)
    out = src.copy()
    while len(out) < needed:
        # Empalma otra copia: los últimos `xfade` de out se mezclan
        # con los primeros `xfade` de src (curvas de igual potencia).
        tail = out[-xfade:]
        head = src[:xfade]
        t = np.linspace(0, np.pi / 2, xfade)
        mixed = tail * np.cos(t) + head * np.sin(t)
        out = np.concatenate([out[:-xfade], mixed, src[xfade:]])
    return out[:needed]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--in', dest='inp', required=True, help='WAV de entrada')
    ap.add_argument('--out', required=True, help='WAV de salida')
    ap.add_argument('--pad', nargs=2, type=float, required=True,
                    metavar=('START', 'END'),
                    help='Tramo cubierto por el pad, en segundos')
    ap.add_argument('--source', nargs=2, type=float, required=True,
                    metavar=('START', 'DUR'),
                    help='Pasaje fuente dentro de la cama (inicio, duración)')
    ap.add_argument('--fade', type=float, default=0.5,
                    help='Duración de cada crossfade cama/pad (defecto 0,5)')
    ap.add_argument('--lowpass', type=float, default=300.0,
                    help='Frecuencia de corte del lowpass en Hz (defecto 300)')
    ap.add_argument('--target-rms-db', type=float, required=True,
                    help='RMS objetivo del pad tenido, en dBFS')
    ap.add_argument('--force', action='store_true')
    args = ap.parse_args()

    start, end = args.pad
    src_start, src_dur = args.source
    if not 0 <= start < end:
        print('ERROR: --pad START END debe cumplir 0 <= START < END',
              file=sys.stderr)
        return 2
    if src_dur <= JOIN_XFADE + 0.1:
        print(f'ERROR: la fuente debe durar más de {JOIN_XFADE + 0.1} s',
              file=sys.stderr)
        return 2
    if os.path.exists(args.out) and not args.force:
        print(f'ERROR: {args.out} ya existe (usa --force)', file=sys.stderr)
        return 2

    data, sr = sf.read(args.inp, always_2d=True)
    n = data.shape[0]
    dur = n / sr
    if end + args.fade > dur or start - args.fade < 0:
        print('ERROR: el pad + fades sale de la duración '
              f'{dur:.2f} s', file=sys.stderr)
        return 2
    if src_start + src_dur > dur:
        print('ERROR: la fuente sale de la duración '
              f'{dur:.2f} s', file=sys.stderr)
        return 2

    mono = data[:, 0].astype(np.float64)

    # 1-2. Bucle del pasaje fuente + lowpass.
    src = mono[int(src_start * sr):int((src_start + src_dur) * sr)]
    need = int((end - start + 2 * args.fade) * sr) + 1
    pad = loop_source(src, sr, need)
    sos = butter(2, args.lowpass, btype='lowpass', fs=sr, output='sos')
    pad = sosfiltfilt(sos, pad)

    # 3. Normaliza al RMS objetivo (medido en el tramo tenido).
    sus0 = int(args.fade * sr)
    sus1 = int((args.fade + (end - start)) * sr)
    cur = rms_db(pad[sus0:sus1])
    gain_db = args.target_rms_db - cur
    pad *= 10 ** (gain_db / 20.0)

    # 4. Crossfades de igual potencia cama <-> pad.
    out = data.astype(np.float64).copy()
    t = np.arange(n) / sr
    # Envolvente de la cama: 1 fuera, 0 dentro del pad.
    env_bed = np.ones(n)
    down = (t >= start - args.fade) & (t < start)
    env_bed[down] = np.cos((t[down] - (start - args.fade)) / args.fade
                           * np.pi / 2) ** 2
    env_bed[(t >= start) & (t < end)] = 0.0
    up = (t >= end) & (t < end + args.fade)
    env_bed[up] = np.sin((t[up] - end) / args.fade * np.pi / 2) ** 2
    # Envolvente del pad: complementaria (igual potencia).
    env_pad = np.zeros(n)
    env_pad[down] = np.sin((t[down] - (start - args.fade)) / args.fade
                           * np.pi / 2) ** 2
    env_pad[(t >= start) & (t < end)] = 1.0
    env_pad[up] = np.cos((t[up] - end) / args.fade * np.pi / 2) ** 2

    pad_full = np.zeros(n)
    p0 = int((start - args.fade) * sr)
    pad_full[p0:p0 + len(pad)] = pad[:n - p0]
    out[:, 0] = mono * env_bed + pad_full * env_pad
    # Si la entrada es estéreo, el pad (mono) va a ambos canales.
    for ch in range(1, data.shape[1]):
        out[:, ch] = data[:, ch] * env_bed + pad_full * env_pad

    sf.write(args.out, out, sr, subtype='FLOAT')
    report = {
        'out': args.out,
        'pad_window': [start, end],
        'source': [src_start, src_dur],
        'source_rms_dbfs': round(rms_db(src), 2),
        'pad_target_rms_dbfs': args.target_rms_db,
        'pad_measured_rms_dbfs': round(
            rms_db(out[int(start * sr):int(end * sr), 0]), 2),
        'lowpass_hz': args.lowpass,
        'fade_s': args.fade,
        'duration_s': round(dur, 2),
        'sample_rate': sr,
    }
    print(json.dumps(report, indent=1))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
