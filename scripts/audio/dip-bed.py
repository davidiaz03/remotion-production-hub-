#!/usr/bin/env python3
"""Aplica un silencio (dip a cero) a una cama musical en un tramo.

Uso: dip-bed.py --in cama.wav --out cama-dipped.wav \
       --silence 31.01 36.45 [--fade 0.5]

La envolvente es 1,0 hasta START-FADE, baja linealmente a 0 en START,
se mantiene en 0 hasta END y vuelve linealmente a 1,0 en END+FADE.
Sirve para dejar la voz sola en un pasaje (p. ej. la tesis de un reel)
sin tocar el mezclador: mix.py sigue recibiendo un único --music.

La salida conserva el formato de la entrada (misma frecuencia de
muestreo, mismo número de canales, WAV float).
"""
import argparse
import os
import sys

import numpy as np
import soundfile as sf


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--in', dest='inp', required=True, help='WAV de entrada')
    ap.add_argument('--out', required=True, help='WAV de salida')
    ap.add_argument('--silence', nargs=2, type=float, required=True,
                    metavar=('START', 'END'),
                    help='Tramo en silencio, en segundos')
    ap.add_argument('--fade', type=float, default=0.5,
                    help='Duración de cada rampa en segundos (defecto 0,5)')
    ap.add_argument('--force', action='store_true')
    args = ap.parse_args()

    start, end = args.silence
    if not 0 <= start < end:
        print('ERROR: --silence START END debe cumplir 0 <= START < END',
              file=sys.stderr)
        return 2
    if os.path.exists(args.out) and not args.force:
        print(f'ERROR: {args.out} ya existe (usa --force)', file=sys.stderr)
        return 2

    data, sr = sf.read(args.inp, always_2d=True)
    n = data.shape[0]
    dur = n / sr
    if end > dur:
        print(f'ERROR: END {end} s supera la duración {dur:.2f} s',
              file=sys.stderr)
        return 2

    t = np.arange(n) / sr
    env = np.ones(n, dtype=np.float64)
    # Rampa de bajada: START-FADE .. START.
    down = (t >= start - args.fade) & (t < start)
    env[down] = 1.0 - (t[down] - (start - args.fade)) / args.fade
    # Silencio: START .. END.
    env[(t >= start) & (t < end)] = 0.0
    # Rampa de subida: END .. END+FADE.
    up = (t >= end) & (t < end + args.fade)
    env[up] = (t[up] - end) / args.fade

    out = data * env[:, None]
    sf.write(args.out, out, sr, subtype='FLOAT')
    print(f'OK {args.out} — silencio {start:.2f}-{end:.2f} s '
          f'(rampas {args.fade} s), {dur:.2f} s, {sr} Hz')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
