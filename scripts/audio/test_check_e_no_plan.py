#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Pruebas del chequeo (e) (mapa de silencios) sin plan de edición.

Sin --edit-plan, la auditoría marcaba como FAIL todas las pausas
entre líneas de un proyecto TTS (longform-smoke: 33 FAIL, todos
falsos positivos): las pausas pause_after del guion no estaban en
ningún plan. Desde longform-v2, sin plan los huecos entre líneas de
VO son las pausas diseñadas y las pausas DENTRO de una línea son
prosodia (la línea se sintetizó de una pieza: no hay cortes dentro
de ella). Con plan, el comportamiento no cambia.

Ejecutar desde la raíz del repo:

    ~/workspace/remotion-hub/.venv/bin/python -m unittest \
        scripts.audio.test_check_e_no_plan -v
"""

import importlib.util
import os
import sys
import unittest

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

_spec = importlib.util.spec_from_file_location(
    "audit_audio", os.path.join(HERE, "audit-audio.py"))
audit = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(audit)

SR = 16000
RNG = np.random.default_rng(7)


def make_vo():
    """10 s: 3 líneas con 2 huecos entre líneas (0,5 s) y 1 pausa
    prosódica intra-línea (0,3 s tras dos puntos)."""
    vo = np.zeros(int(10 * SR), dtype=np.float32)

    def speech(t0, t1):
        a, b = int(t0 * SR), int(t1 * SR)
        vo[a:b] = RNG.normal(0, 0.1, b - a).astype(np.float32)

    speech(0.0, 2.0)    # línea 1
    # hueco entre líneas 2,0-2,5
    speech(2.5, 3.5)    # línea 2, primera parte
    # pausa prosódica intra-línea 3,5-3,8
    speech(3.8, 5.0)    # línea 2, segunda parte
    # hueco entre líneas 5,0-5,5
    speech(5.5, 9.0)    # línea 3
    # silencio final 9,0-10,0 (outro: INFO, no FAIL)
    return vo


VO_LINES = [
    {"text": "Línea uno.", "start": 0.0, "end": 2.0},
    {"text": "Línea dos: primera parte, segunda parte.",
     "start": 2.5, "end": 5.0},
    {"text": "Línea tres.", "start": 5.5, "end": 9.0},
]

PLAN = {"lines": [
    {"linea": 1, "segs": [{"edited_start": 0.0, "edited_end": 2.0}]},
    {"linea": 2, "segs": [{"edited_start": 2.5, "edited_end": 5.0}]},
    {"linea": 3, "segs": [{"edited_start": 5.5, "edited_end": 9.0}]},
]}


def run_check_e(plan):
    rep = audit.Report("test-e")
    audit.check_e_silences(rep, make_vo(), SR, plan, VO_LINES)
    return rep


def sev_counts(rep, check="e"):
    out = {}
    for f in rep.findings:
        if f["check"] == check:
            out[f["sev"]] = out.get(f["sev"], 0) + 1
    return out


class TestCheckENoPlan(unittest.TestCase):
    def test_sin_plan_no_hay_fail(self):
        rep = run_check_e(None)
        counts = sev_counts(rep)
        self.assertEqual(counts.get("FAIL", 0), 0,
                         [f for f in rep.findings if f["sev"] == "FAIL"])
        self.assertEqual(counts.get("PASS", 0), 1)

    def test_sin_plan_clasifica_huecos_y_prosodia(self):
        rep = run_check_e(None)
        msgs = [f["msg"] for f in rep.findings if f["check"] == "e"]
        disenadas = [m for m in msgs if "entre-líneas" in m]
        prosodicas = [m for m in msgs if "prosódica" in m]
        self.assertEqual(len(disenadas), 2)
        self.assertEqual(len(prosodicas), 1)

    def test_con_plan_la_intra_linea_sigue_siendo_fail(self):
        # Con plan de edición, el comportamiento no cambia: la pausa
        # intra-línea que no está en el plan es un FAIL.
        rep = run_check_e(PLAN)
        counts = sev_counts(rep)
        self.assertEqual(counts.get("FAIL", 0), 1)
        fail = next(f for f in rep.findings if f["sev"] == "FAIL")
        self.assertIn("INESPERADA", fail["msg"])
        self.assertAlmostEqual(fail["t"], 3.5, delta=0.05)


if __name__ == "__main__":
    unittest.main()
