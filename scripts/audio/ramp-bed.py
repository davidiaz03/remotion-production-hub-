#!/usr/bin/env python3
"""Aplica una rampa de ganancia suave a una cama musical.

Uso: ramp-bed.py --in cama.wav --out cama-ramped.wav \
       --ramp 57.54 68.0 3.5

La ganancia sube linealmente en dB de 0 dB en START a DB dB en END
(0,33 dB/s con los valores de V5: inaudible como escalón) y se
mantiene en DB hasta el final del archivo. Antes de START el audio
queda bit a bit idéntico.

Motivo (V5 marti-fidel, 21-nov-2026): la ventana limpia 88-157,23 s
de la pista Flow termina en la coda descendente del tema (10 s
finales -24,4 dBFS, ~5 dB bajo la meseta) y la música se apagaba
bajo el clímax (S10/S11 + sting). La rampa de +3,5 dB entre 57,54 s
(fin del crossfade del pad de tesis: el pad NO sube con la rampa)
y 68,0 s (antes del fade-out final de 1 s) devuelve la coda hacia
el nivel de la meseta al llegar al cierre.

La salida conserva el formato de la entrada (misma frecuencia de
muestreo, mismo número de canales, WAV float).
"""
import argparse
import json
import os
import sys

import numpy as np
import soundfile as sf


def rms_db(x):
    r = float(np.sqrt(np.mean(np.asarray(x, dtype=np.float64) ** 2)))
    return 20 * np.log10(r) if r > 0 else -120.0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--in', dest='inp', required=True, help='WAV de entrada')
    ap.add_argument('--out', required=True, help='WAV de salida')
    ap.add_argument('--ramp', nargs=3, type=float, required=True,
                    metavar=('START', 'END', 'DB'),
                    help='Rampa: de 0 dB en START a DB dB en END (segundos)')
    ap.add_argument('--force', action='store_true')
    args = ap.parse_args()

    start, end, db = args.ramp
    if not 0 <= start < end:
        print('ERROR: --ramp START END DB debe cumplir 0 <= START < END',
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
    gain_db = np.zeros(n)
    rising = (t >= start) & (t < end)
    gain_db[rising] = db * (t[rising] - start) / (end - start)
    gain_db[t >= end] = db
    out = data * (10 ** (gain_db / 20.0))[:, None]

    sf.write(args.out, out, sr, subtype='FLOAT')
    report = {
        'out': args.out,
        'ramp': [start, end, db],
        'ramp_slope_db_per_s': round(db / (end - start), 3),
        'peak_in_dbfs': round(20 * np.log10(np.max(np.abs(data))), 2),
        'peak_out_dbfs': round(20 * np.log10(np.max(np.abs(out))), 2),
        'rms_last_10s_in_dbfs': round(
            rms_db(data[int((dur - 10) * sr):, 0]), 2),
        'rms_last_10s_out_dbfs': round(
            rms_db(out[int((dur - 10) * sr):, 0]), 2),
        'duration_s': round(dur, 2),
        'sample_rate': sr,
    }
    print(json.dumps(report, indent=1))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
