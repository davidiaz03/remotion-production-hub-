#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Suite de pruebas de la verificación de identidad de cama
(`bed_identity.py`).

Regresión del incidente 23-nov-2026 (negacion-embargo V4): la
configuración pedía `memorial-cama-documental` pero el stem se
construyó desde `documentary-flow-a` y ningún chequeo lo detectó.
Estas pruebas fijan que la verificación caza ese caso.

Ejecutar desde la raíz del repo:

    ~/workspace/remotion-hub/.venv/bin/python -m unittest \\
        scripts.audio.test_bed_identity -v

o desde scripts/audio/:

    ~/workspace/remotion-hub/.venv/bin/python -m unittest \\
        test_bed_identity -v

Todas las pruebas son sintéticas (camas de ruido en tmp, sin
archivos externos): un stem es una copia escalada de su cama con
dips después de la ventana limpia, igual que lo construye
`bed-loop.py` + `apply-bed-dips.py`.
"""

import json
import os
import shutil
import sys
import tempfile
import unittest
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bed_identity

SR = 48000


def write_wav(path, audio):
    pcm = (np.clip(audio, -1.0, 1.0) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


class BedIdentityTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="bed-identity-test-")
        self.beds_dir = os.path.join(self.tmp, "beds")
        os.makedirs(self.beds_dir)
        rng = np.random.default_rng(42)
        # Dos camas distintas (ruido blanco filtrado, 20 s).
        self.bed_a = rng.standard_normal(20 * SR).astype(np.float64) * 0.3
        self.bed_b = rng.standard_normal(20 * SR).astype(np.float64) * 0.3
        write_wav(os.path.join(self.beds_dir, "cama-a.wav"), self.bed_a)
        write_wav(os.path.join(self.beds_dir, "cama-b.wav"), self.bed_b)
        registry = {"beds": [
            {"id": "cama-a", "file": "cama-a.wav"},
            {"id": "cama-b", "file": "cama-b.wav"},
        ]}
        with open(os.path.join(self.beds_dir, "registry.json"), "w") as f:
            json.dump(registry, f)
        # Timeline con el primer dip a 5,7 s (como negacion-embargo).
        self.timeline = os.path.join(self.tmp, "timeline.json")
        with open(self.timeline, "w") as f:
            json.dump({"bed": {"id": "cama-a", "dips": [
                {"t0": 5.7, "t1": 23.5, "gain_db": -6, "ramp_s": 0.3},
            ]}}, f)
        # Stem desde cama-a: copia escalada (ganancia lineal, como el
        # --target-lufs de bed-loop.py) + dip a 5,7 s.
        stem = self.bed_a[:10 * SR] * 0.5
        stem[int(5.7 * SR):] *= 10 ** (-6 / 20)
        self.stem_a = os.path.join(self.tmp, "stem-a.wav")
        write_wav(self.stem_a, stem)

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_stem_correcto_verifica(self):
        r = bed_identity.verify_bed_stem(
            self.stem_a, "cama-a", self.timeline, self.beds_dir)
        self.assertTrue(r["ok"])
        self.assertGreater(r["ncc"], 0.99)

    def test_cama_equivocada_falla(self):
        # Regresión del V4: stem construido desde A, config pide B.
        r = bed_identity.verify_bed_stem(
            self.stem_a, "cama-b", self.timeline, self.beds_dir)
        self.assertFalse(r["ok"])
        self.assertLess(abs(r["ncc"]), 0.05)

    def test_ganancia_no_afecta(self):
        # NCC invariante a ganancia: el stem a 0,1x sigue siendo A.
        quiet = os.path.join(self.tmp, "stem-quiet.wav")
        write_wav(quiet, self.bed_a[:10 * SR] * 0.05)
        r = bed_identity.verify_bed_stem(
            quiet, "cama-a", self.timeline, self.beds_dir)
        self.assertTrue(r["ok"])

    def test_ventana_respeta_los_dips(self):
        # Con el primer dip a 3,0 s la ventana termina antes (2,65 s
        # con rampa 0,2 y margen 0,25) y el stem sigue verificando.
        tl = os.path.join(self.tmp, "timeline-early.json")
        with open(tl, "w") as f:
            json.dump({"bed": {"id": "cama-a", "dips": [
                {"t0": 3.0, "t1": 4.0, "gain_db": -6, "ramp_s": 0.2},
            ]}}, f)
        r = bed_identity.verify_bed_stem(
            self.stem_a, "cama-a", tl, self.beds_dir)
        self.assertTrue(r["ok"])
        self.assertAlmostEqual(r["window_s"], 2.65, places=2)

    def test_dip_demasiado_pronto_error(self):
        tl = os.path.join(self.tmp, "timeline-too-early.json")
        with open(tl, "w") as f:
            json.dump({"bed": {"id": "cama-a", "dips": [
                {"t0": 1.0, "t1": 2.0, "gain_db": -6, "ramp_s": 0.2},
            ]}}, f)
        with self.assertRaises(ValueError):
            bed_identity.verify_bed_stem(
                self.stem_a, "cama-a", tl, self.beds_dir)

    def test_cama_no_registrada_error(self):
        with self.assertRaises(ValueError):
            bed_identity.verify_bed_stem(
                self.stem_a, "cama-inexistente", self.timeline,
                self.beds_dir)

    def test_sin_timeline_usa_ventana_de_5s(self):
        r = bed_identity.verify_bed_stem(
            self.stem_a, "cama-a", None, self.beds_dir)
        self.assertTrue(r["ok"])
        self.assertAlmostEqual(r["window_s"], 5.0)


if __name__ == "__main__":
    unittest.main()
