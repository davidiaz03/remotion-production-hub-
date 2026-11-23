#!/usr/bin/env python3
"""Aplica los dips de cama de research/timeline.json a un stem WAV.

Uso: python3 scripts/apply-bed-dips.py <in.wav> <out.wav>
Lee timeline.json -> bed.dips: [{t0, t1, gain_db, ramp_s}]. Las
transiciones son de coseno alzado (sin clics). Los dips NUNCA llegan
a silencio digital: el check (g) de la auditoría falla con >=0,3 s
bajo -45 dB.

Este reel no tiene dips (bed.dips está vacío): el paso deja el stem
intacto. El outro sube por el ducking (la VO termina a 25,12 s).
"""
import json
import os
import sys
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
SR = 48000


def main() -> int:
    if len(sys.argv) != 3:
        print("uso: apply-bed-dips.py <in.wav> <out.wav>", file=sys.stderr)
        return 2
    timeline = json.load(open(os.path.join(PROJ, "research/timeline.json")))
    dips = timeline["bed"]["dips"]
    with wave.open(sys.argv[1], "rb") as w:
        assert w.getframerate() == SR and w.getnchannels() == 1, \
            "el stem debe ser WAV mono 48 kHz"
        n = w.getnframes()
        a = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float64)
    t = np.arange(n) / SR
    # Segmentos de nivel (tiempo -> ganancia), derivados de los dips:
    # se ordenan los bordes y cada borde define UN nivel (el del tramo
    # que empieza ahí); los dips adyacentes (panel -> giro en 23,5 s)
    # comparten borde sin pasar por 1,0.
    points = [(0.0, 1.0)]
    for d in dips:
        points.append((d["t0"], 10 ** (d["gain_db"] / 20)))
        points.append((d["t1"], 1.0))
    # Rampa por borde: la del dip que empieza (t0) o termina (t1) ahí;
    # si dos dips comparten borde, manda la rampa mayor.
    ramps = {}
    for d in dips:
        ramps[d["t0"]] = max(ramps.get(d["t0"], 0.0), d["ramp_s"])
        ramps[d["t1"]] = max(ramps.get(d["t1"], 0.0), d["ramp_s"])
    # Ordenar SOLO por tiempo (sort estable): en un borde compartido
    # (panel -> giro en 23,5 s) el orden de inserción decide — el dip
    # que EMPIEZA (t0) debe quedar después del que TERMINA (t1) para
    # que el colapso se quede con su nivel. Un sort por (tiempo,
    # ganancia) pondría (23,5, 0,25) antes que (23,5, 1,0) y el dip
    # del giro se perdería (bug cazado 22-nov al verificar el stem).
    points.sort(key=lambda p: p[0])
    # Colapsar bordes duplicados: queda el último nivel en ese tiempo.
    merged = []
    for tm, g in points:
        if merged and merged[-1][0] == tm:
            merged[-1] = (tm, g)
        else:
            merged.append((tm, g))
    gain = np.ones(n)
    for (t0, g0), (t1, _g1) in zip(merged, merged[1:] + [(n / SR, 1.0)]):
        gain[(t >= t0) & (t < t1)] = g0
    # Una rampa de coseno alzado por borde (centrada en el borde).
    for (t0, g0), (t1, g1) in zip(merged, merged[1:]):
        if g0 == g1 or t1 <= 0:
            continue
        ramp = ramps.get(t1, 0.3)
        m = (t >= t1 - ramp / 2) & (t <= t1 + ramp / 2)
        x = (t[m] - (t1 - ramp / 2)) / ramp
        gain[m] = g0 + (g1 - g0) * 0.5 * (1 - np.cos(np.pi * x))
    out = np.clip(a * gain, -32768, 32767).astype(np.int16)
    with wave.open(sys.argv[2], "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(out.tobytes())
    print(f"dips aplicados ({len(dips)} tramos) -> {sys.argv[2]} "
          f"({n / SR:.1f} s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
