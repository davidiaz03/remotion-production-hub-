#!/usr/bin/env python3
"""Edición de la VO del video largo: corta las mejores tomas del
original y las ensambla en vo-edited.wav.

Plan de cortes (tiempos en el ORIGINAL, refinados con la envolvente
RMS a 10 ms — ver vo-cut-analysis.py):

  R1  90.34-94.78  fuera intento 1 «la página se llamaba José Forever»
                   (incompleto); se conserva el intento 2 (94.80+).
  R2  219.44-225.18 fuera intento 1 del tuit en inglés (prob. ASR
                   bajas, pronunciación atropellada); intento 2 más
                   lento y claro (prob. 0.63-0.98).
  R3  392.73-395.79 fuera «y eso es lo que hace peligroso» (falta el
                   segundo «lo»); intento 2 completo, igual al guion.
  R4  418.75-421.63 fuera «la confirmación» (arranque en falso);
                   intento 2 completo («la confirmación llegó...»).
  R5  495.90-502.00 fuera intento 1 de «por eso tres comprobaciones
                   tardan menos de un minuto»; intento 2 igual y
                   más asentado (regla: ante dos buenos, el último).
  R6  518.01-520.05 fuera «segundo» (corrección en vivo a «segunda»).
  R7  555.85-561.09 fuera intento 1 («una imagen que aparece que
                   parece», trabado) e intento 2 (bueno pero se
                   repite); se conserva el intento 3 (último bueno).
  R8  564.55-567.67 fuera intento 2 («la» + 1,3 s de duda + «única
                   defensa...»); se conserva el intento 1, completo
                   y fluido. Se inserta 0,35 s de tono de sala del
                   propio original (7.00-7.35) como pausa [P].

Pausas: cada empalme conserva la pausa del guion ([P] 0,35 s,
[P+] 0,5-0,7 s, 0 s a mitad de frase). El empalme del Acto 1->2
queda en 1,01 s (pausa real de la grabación: respiración + silencio;
cambio de acto). Ninguna pausa intra-línea se toca.
Fades de 8 ms en cada empalme (inaudibles; impiden clics) y
fade-out de 0,4 s al final.
"""
import json
import os
import subprocess
import sys

VO_DIR = os.path.dirname(os.path.abspath(__file__))
ORIG = os.path.join(VO_DIR, "vo-original.m4a")
TMP = os.path.expanduser("~/workspace/.tmp/vo-edit")
OUT = os.path.join(VO_DIR, "vo-edited.wav")

# (inicio, fin, etiqueta) en segundos del original
SEGMENTS = [
    (8.92, 89.67, "acto1 + pausa cambio de acto (1,01 s)"),
    (94.78, 219.44, "acto2 inicio - 'Starlink en Cuba'"),
    (225.18, 392.73, "tuit inglés intento 2 - 'era deseable'"),
    (395.79, 418.75, "'Y eso es lo que lo hace peligroso' - '10 de julio'"),
    (421.63, 495.90, "'La confirmación llegó' - 'Ahora cuesta segundos' + [P]"),
    (502.00, 518.01, "'Por eso, tres comprobaciones' intento 2 - 'el caso se cae'"),
    (520.05, 555.85, "'Segunda: revisa' - 'un texto que quieres creer'"),
    (561.09, 562.60, "'y una imagen que parece real' intento 3"),
    (562.60, 564.55, "'La única defensa es la verificación' intento 1"),
    (7.00, 7.35, "tono de sala (pausa [P] 0,35 s)"),
    (567.67, 587.15, "'Y la verificación empieza por ti' - cierre + fade-out"),
]

FADE = 0.008
FINAL_FADE = 0.4


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print("FALLO:", " ".join(cmd), file=sys.stderr)
        print(r.stderr[-2000:], file=sys.stderr)
        sys.exit(1)


def main():
    os.makedirs(TMP, exist_ok=True)
    parts = []
    total = 0.0
    for i, (a, b, label) in enumerate(SEGMENTS):
        dur = b - a
        total += dur
        seg_wav = os.path.join(TMP, f"seg{i:02d}.wav")
        fade_out = FINAL_FADE if i == len(SEGMENTS) - 1 else FADE
        af = (f"afade=t=in:st=0:d={FADE},"
              f"afade=t=out:st={dur - fade_out:.3f}:d={fade_out}")
        run(["ffmpeg", "-v", "error", "-y",
             "-ss", f"{a:.2f}", "-i", ORIG, "-t", f"{dur:.2f}",
             "-af", af, "-ar", "48000", "-ac", "2",
             "-c:a", "pcm_s16le", seg_wav])
        parts.append(seg_wav)
        print(f"seg{i:02d} [{a:7.2f}-{b:7.2f}] {dur:6.2f}s  {label}")
    print(f"duración total estimada: {total:.2f}s ({total/60:.2f} min)")

    lst = os.path.join(TMP, "concat.txt")
    with open(lst, "w") as f:
        for p in parts:
            f.write(f"file '{p}'\n")
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0",
         "-i", lst, "-c:a", "pcm_s16le", OUT])
    print("escrito:", OUT)

    plan = {"source": "vo-original.m4a",
            "segments": [{"start": a, "end": b, "label": lab}
                         for a, b, lab in SEGMENTS],
            "total_duration_s": round(total, 2)}
    with open(os.path.join(VO_DIR, "edit-plan.json"), "w") as f:
        json.dump(plan, f, ensure_ascii=False, indent=1)
    print("plan guardado: edit-plan.json")


if __name__ == "__main__":
    main()
