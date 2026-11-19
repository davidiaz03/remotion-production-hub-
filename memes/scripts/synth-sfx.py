#!/usr/bin/env python3
"""
Sintetiza con ffmpeg los SFX que faltaban en el pack CC0 del hub:
bocina de aire (air horn), rayadura de vinilo (record scratch),
trombón triste (sad trombone), pitido de censura (censor beep) y
zumbador de error (wrong buzzer).

Por qué sintetizar: no hay grabaciones limpias y libres en Wikimedia
Commons (lo que hay es multitud + bocinas, o bocinas de tren/niebla), y
Freesound/Zapsplat exigen cuenta. Al generarlos aquí no hay problema de
licencia: son CC0 por construcción (ver LICENSES.md).

Uso:
  python3 synth-sfx.py            # regenera los WAV en ../assets/sfx/
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


def notes_expr(notes, glide_last=0.0):
    """Expresión aevalsrc para notas seguidas [(freq_hz, dur_s), ...].

    Fase continua: la fase es la integral de f(t), así no hay clics en
    los cambios de nota. Onda diente de sierra + 2º armónico (timbre
    metálico, tipo trombón/zumbador) y un hueco de articulación en cada
    frontera. glide_last: caída de pitch en Hz/s durante la última nota
    (el trombón que se desinfla).
    """
    total = sum(d for _, d in notes)
    starts, acc = [], 0.0
    for _, d in notes:
        starts.append(acc)
        acc += d
    # Fase en ciclos: suma de f_i * tiempo_transcurrido_en_la_nota_i.
    terms = []
    for (f, d), s in zip(notes, starts):
        terms.append(f"{f}*min(max(t-{s},0),{d})")
    if glide_last:
        f_last, d_last = notes[-1]
        s_last = starts[-1]
        # La caída lineal de pitch añade -glide/2 * tau^2 a la fase.
        terms.append(f"({-glide_last}/2)*pow(min(max(t-{s_last},0),{d_last}),2)")
    phase = '+'.join(terms)
    tone = (f"(0.55*(2*({phase}-floor({phase}+0.5)))"
            f"+0.28*(2*(2*({phase})-floor(2*({phase})+0.5))))")
    env = f"min(1,t/0.015)*min(1,({total}-t)/0.12)"
    for s in starts[1:]:
        env += f"*(1-0.45*exp(-pow((t-{s})/0.012,2)))"
    return f"{tone}*{env}"


# Trombón triste: el cliché «wah wah wah wahhh» — Sib3, La3, Lab3, Sol3
# (tres cortas + una larga que se desinfla). Frase musical estándar, sin
# grabación ajena: CC0 por construcción.
TROMBONE_NOTES = [(233.08, 0.32), (220.00, 0.32), (207.65, 0.32),
                  (196.00, 0.95)]
TROMBONE_EXPR = notes_expr(TROMBONE_NOTES, glide_last=25.0)
TROMBONE_DUR = sum(d for _, d in TROMBONE_NOTES)

# Pitido de censura: seno puro a 1000 Hz, 0,5 s, fundidos de 5 ms.
CENSOR_EXPR = "0.8*sin(2*PI*1000*t)*min(1,t/0.005)*min(1,(0.5-t)/0.005)"

# Zumbador de error (tipo concurso): dos notas bajas y ásperas.
BUZZER_NOTES = [(160.0, 0.35), (110.0, 0.55)]
BUZZER_EXPR = notes_expr(BUZZER_NOTES)
BUZZER_DUR = sum(d for _, d in BUZZER_NOTES)


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"falló: {' '.join(cmd[:4])}…\n{r.stderr[-1200:]}")
    return r


def synth(expr, dur, out, lowpass=5000):
    cmd = ['ffmpeg', '-y', '-v', 'error', '-f', 'lavfi',
           '-i', f"aevalsrc='{expr}':s=48000:d={dur}",
           '-af', f'lowpass=f={lowpass},volume=0.9,alimiter=limit=0.95:level=false',
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
    ap = argparse.ArgumentParser(
        description='Sintetiza SFX CC0: air horn, record scratch, '
                    'sad trombone, censor beep, wrong buzzer')
    ap.add_argument('--check', action='store_true',
                    help='solo verifica los WAV existentes')
    args = ap.parse_args()
    os.makedirs(SFX_DIR, exist_ok=True)
    # (archivo, expresión, duración, lowpass)
    targets = [('airhorn.wav', HORN_EXPR, '1.0', 5000),
               ('record-scratch.wav', SCRATCH_EXPR, '0.6', 5000),
               ('sad-trombone.wav', TROMBONE_EXPR, str(TROMBONE_DUR), 1200),
               ('censor-beep.wav', CENSOR_EXPR, '0.5', 5000),
               ('wrong-buzzer.wav', BUZZER_EXPR, str(BUZZER_DUR), 800)]
    for name, expr, dur, lp in targets:
        path = os.path.join(SFX_DIR, name)
        if not args.check:
            synth(expr, dur, path, lowpass=lp)
        if not os.path.exists(path):
            sys.exit(f'falta {path} (corre sin --check para generarlo)')
        st = stats(path)
        print(f'{name}: {os.path.getsize(path) // 1024} KB, '
              f"RMS {st.get('mean_volume')}, pico {st.get('max_volume')}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
