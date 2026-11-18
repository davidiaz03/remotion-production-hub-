#!/usr/bin/env python3
"""
Sintetiza con ffmpeg los dos SFX que faltaban en el pack CC0 del hub:
bocina de aire (air horn) y rayadura de vinilo (record scratch).

Por qué sintetizar: no hay grabaciones limpias y libres en Wikimedia
Commons (lo que hay es multitud + bocinas, o bocinas de tren/niebla), y
Freesound/Zapsplat exigen cuenta. Al generarlos aquí no hay problema de
licencia: son CC0 por construcción (ver LICENSES.md).

Uso:
  python3 synth-sfx.py            # regenera los dos WAV en ../assets/sfx/
  python3 synth-sfx.py --check    # solo verifica los existentes

Verificación: duración, RMS y pico (sin clipping) con volumedetect, y
forma de onda con showwavespic en /tmp.
"""
import argparse
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SFX_DIR = os.path.join(ROOT, 'assets', 'sfx')

# Bocina de aire: 4 sierras desafinadas (370/392/440/494 Hz, el clúster
# disonante de la bocina de estadio) + sub seno a 185 Hz. Envolvente:
# ataque 10 ms, caída en los últimos 80 ms.
HORN_EXPR = (
    "(0.22*(2*(370*t-floor(370*t+0.5)))"
    "+0.22*(2*(392*t-floor(392*t+0.5)))"
    "+0.22*(2*(440*t-floor(440*t+0.5)))"
    "+0.18*(2*(494*t-floor(494*t+0.5)))"
    "+0.12*sin(2*PI*185*t))"
    "*min(1,t/0.01)*min(1,(1.0-t)/0.08)"
)

# Rayadura de vinilo: tono que barre arriba/abajo 7 veces por segundo
# (el vaivén de la aguja arrastrada) + ruido de vinilo acompasado.
# Fase del warble: integral de f(t) = 900 + 700*sin(2*PI*7*t).
SCRATCH_EXPR = (
    "(0.45*sin(2*PI*900*t-100*cos(2*PI*7*t))"
    "+0.18*sin(2*PI*1800*t-200*cos(2*PI*7*t))"
    "+0.25*(random(0)*2-1)*(0.4+0.6*abs(sin(2*PI*7*t))))"
    "*min(1,t/0.005)*min(1,(0.6-t)/0.1)"
)


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"falló: {' '.join(cmd[:4])}…\n{r.stderr[-1200:]}")
    return r


def synth(expr, dur, out):
    cmd = ['ffmpeg', '-y', '-v', 'error', '-f', 'lavfi',
           '-i', f"aevalsrc='{expr}':s=48000:d={dur}",
           '-af', 'lowpass=f=5000,volume=0.9,alimiter=limit=0.95:level=false',
           '-ac', '1', out]
    run(cmd)
    return out


def stats(path):
    r = run(['ffmpeg', '-i', path, '-af', 'volumedetect', '-vn', '-sn',
             '-dn', '-f', 'null', '/dev/null'])
    out = {}
    for line in (r.stderr or '').splitlines():
        for k in ('mean_volume', 'max_volume'):
            if k in line:
                out[k] = line.split(':')[-1].strip()
    return out


def main():
    ap = argparse.ArgumentParser(description='Sintetiza air horn y record scratch')
    ap.add_argument('--check', action='store_true',
                    help='solo verifica los WAV existentes')
    args = ap.parse_args()
    os.makedirs(SFX_DIR, exist_ok=True)
    targets = [('airhorn.wav', HORN_EXPR, '1.0'),
               ('record-scratch.wav', SCRATCH_EXPR, '0.6')]
    for name, expr, dur in targets:
        path = os.path.join(SFX_DIR, name)
        if not args.check:
            synth(expr, dur, path)
        if not os.path.exists(path):
            sys.exit(f'falta {path} (corre sin --check para generarlo)')
        st = stats(path)
        print(f'{name}: {os.path.getsize(path) // 1024} KB, '
              f"RMS {st.get('mean_volume')}, pico {st.get('max_volume')}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
