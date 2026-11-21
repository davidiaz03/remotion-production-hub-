#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Suite de pruebas del selector de ventana de cama
(`select-bed-window.py`).

Ejecutar desde la raíz del repo:

    ~/workspace/remotion-hub/.venv/bin/python -m unittest \\
        scripts.audio.test_select_bed_window -v

o desde scripts/audio/:

    ~/workspace/remotion-hub/.venv/bin/python -m unittest \\
        test_select_bed_window -v

Dos niveles (ninguno necesita Whisper ni audio real: la puntuación
es pura a partir de la curva RMS y de un escaneo ya clasificado):
* Sintéticos: curvas RMS y escaneos construidos a mano — rechazo
  por voz VAD, cola de frase < 1 s, agujero vs respiro, penalización
  por voz sin VAD / UNCERTAIN, arco (ataque, crecimiento), desempate
  por antigüedad y caso sin ventana.
* Regresión Flow: la curva RMS real de la pista «Documentary
  underscore» (vendorizada en tests/fixtures/flow-rms-curve.json,
  179 bins) + el escaneo calibrado (tests/fixtures/flow-scan.json).
  El selector debe elegir 88,00-157,23 s (la ventana V5), rechazar
  la 72-141,23 s por voz VAD y la 0-69,23 s por agujero.
"""

import importlib.util
import json
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
FIXTURES = os.path.join(HERE, 'tests', 'fixtures')


def load_sbw():
    spec = importlib.util.spec_from_file_location(
        'select_bed_window',
        os.path.join(HERE, 'select-bed-window.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


SBW = load_sbw()


def flat_curve(n=180, level=-20.0):
    return [level] * n


def empty_scan():
    return {'passes': {'vad': [], 'raw': []}}


def voice_seg(start, end, nsp=0.22, cls='VOICE'):
    return {'start': start, 'end': end, 'start_abs': start,
            'end_abs': end, 'text': 'x', 'no_speech_prob': nsp,
            'class': cls, 'reason': 'sintetico'}


class TestVoiceRejection(unittest.TestCase):
    def test_vad_voice_rejects(self):
        rms = flat_curve()
        scan = {'passes': {'vad': [voice_seg(80.69, 88.49)], 'raw': []}}
        c = SBW.score_window(rms, 72.0, 69.23, scan)
        self.assertEqual(c['status'], 'rejected')
        self.assertTrue(any('voz (VAD)' in r for r in c['reasons']))

    def test_voice_tail_under_1s_accepted(self):
        # La frase termina 0,49 s dentro de la ventana: resto < 1 s,
        # no es voz usable (caso V5: 80,69-88,49 s vs ventana 88 s).
        rms = flat_curve()
        scan = {'passes': {'vad': [voice_seg(80.69, 88.49)], 'raw': []}}
        c = SBW.score_window(rms, 88.0, 69.23, scan)
        self.assertEqual(c['status'], 'accepted')

    def test_voice_tail_over_1s_rejects(self):
        rms = flat_curve()
        scan = {'passes': {'vad': [voice_seg(80.69, 88.49)], 'raw': []}}
        c = SBW.score_window(rms, 87.0, 69.23, scan)
        self.assertEqual(c['status'], 'rejected')

    def test_raw_voice_penalty_not_reject(self):
        rms = flat_curve()
        scan = {'passes': {'vad': [],
                           'raw': [voice_seg(60.0, 62.0, nsp=0.106)]}}
        c = SBW.score_window(rms, 0.0, 69.23, scan)
        self.assertEqual(c['status'], 'accepted')
        self.assertEqual(c['score'], 100.0 - SBW.RAW_VOICE_PENALTY)
        self.assertTrue(any('sin VAD' in n for n in c['notes']))

    def test_strict_rejects_raw_voice(self):
        rms = flat_curve()
        scan = {'passes': {'vad': [],
                           'raw': [voice_seg(60.0, 62.0, nsp=0.106)]}}
        c = SBW.score_window(rms, 0.0, 69.23, scan, strict=True)
        self.assertEqual(c['status'], 'rejected')
        self.assertTrue(any('--strict' in r for r in c['reasons']))

    def test_hallucination_ignored(self):
        rms = flat_curve()
        seg = voice_seg(100.0, 105.0, nsp=0.65, cls='HALLUCINATION')
        scan = {'passes': {'vad': [], 'raw': [seg]}}
        c = SBW.score_window(rms, 88.0, 69.23, scan)
        self.assertEqual(c['status'], 'accepted')
        self.assertEqual(c['score'], 100.0)

    def test_uncertain_penalty(self):
        rms = flat_curve()
        seg = voice_seg(100.0, 105.0, nsp=0.6, cls='UNCERTAIN')
        scan = {'passes': {'vad': [seg], 'raw': []}}
        c = SBW.score_window(rms, 88.0, 69.23, scan)
        self.assertEqual(c['status'], 'accepted')
        self.assertEqual(c['score'], 100.0 - SBW.UNCERTAIN_PENALTY)


class TestHoleRejection(unittest.TestCase):
    def test_deep_hole_rejects(self):
        rms = flat_curve()
        rms[10] = -44.9  # agujero Flow a los 10 s
        c = SBW.score_window(rms, 0.0, 69.23, empty_scan())
        self.assertEqual(c['status'], 'rejected')
        self.assertTrue(any('agujero' in r for r in c['reasons']))
        # Mediana -20,0 -> profundidad 24,9 dB.
        self.assertIn('-44.9', c['reasons'][0])
        self.assertIn('24.9', c['reasons'][0])

    def test_phrase_breath_accepted(self):
        rms = flat_curve()
        rms[50] = -30.6  # respiro de 10,6 dB bajo la mediana -20
        c = SBW.score_window(rms, 0.0, 69.23, empty_scan())
        self.assertEqual(c['status'], 'accepted')
        self.assertAlmostEqual(c['score'], 100.0 - 2.6, places=1)

    def test_hole_threshold_boundary(self):
        rms = flat_curve()
        rms[50] = -20.0 - SBW.HOLE_DEPTH_DB - 0.1
        c = SBW.score_window(rms, 0.0, 69.23, empty_scan())
        self.assertEqual(c['status'], 'rejected')
        rms[50] = -20.0 - SBW.HOLE_DEPTH_DB + 0.1
        c = SBW.score_window(rms, 0.0, 69.23, empty_scan())
        self.assertEqual(c['status'], 'accepted')


class TestArcScoring(unittest.TestCase):
    def test_flat_window_scores_100(self):
        c = SBW.score_window(flat_curve(), 0.0, 69.23, empty_scan())
        self.assertEqual(c['status'], 'accepted')
        self.assertEqual(c['score'], 100.0)

    def test_growth_bonus_capped(self):
        rms = flat_curve()
        for i in range(59, 69):
            rms[i] = -14.0  # +6 dB en los últimos 10 s de la ventana
        c = SBW.score_window(rms, 0.0, 69.23, empty_scan())
        # Crecimiento +6 dB -> bonus capado a +3.
        self.assertAlmostEqual(c['score'], 103.0, places=1)

    def test_descent_penalty(self):
        rms = flat_curve()
        for i in range(59, 69):
            rms[i] = -26.0  # -6 dB en los últimos 10 s de la ventana
        c = SBW.score_window(rms, 0.0, 69.23, empty_scan())
        self.assertAlmostEqual(c['score'], 94.0, places=1)

    def test_attack_penalty(self):
        rms = flat_curve()
        rms[0] = -13.0  # +7 dB sobre la mediana en el segundo 0
        c = SBW.score_window(rms, 0.0, 69.23, empty_scan())
        # Ataque (7-3)*2 = 8 pt; inicio fuerte: media 5 s -18,6,
        # (mediana -20 +1) -> (-18,6+19)*2 = 0,8 pt.
        self.assertAlmostEqual(c['score'], 100.0 - 8.0 - 0.8, places=1)

    def test_loud_start_penalty(self):
        rms = flat_curve()
        for i in range(5):
            rms[i] = -17.0  # inicio 3 dB sobre la mediana
        c = SBW.score_window(rms, 0.0, 69.23, empty_scan())
        # (3-1)*2 = 4 pt; crecimiento: mediana 10 s ini -18,5,
        # fin -20 -> -1,5 pt.
        self.assertAlmostEqual(c['score'], 100.0 - 4.0 - 1.5, places=1)


class TestRanking(unittest.TestCase):
    def test_tie_break_earliest(self):
        # Dos ventanas planas idénticas salvo el inicio: la más
        # temprana gana aunque la puntuación sea igual.
        rms = flat_curve()
        _, accepted, _, chosen = SBW.rank_candidates(
            rms, 179.56, 69.23, empty_scan(), step=10.0)
        self.assertEqual(chosen['start_s'], 0.0)
        self.assertTrue(all(c['score'] == 100.0 for c in accepted))

    def test_no_window_passes(self):
        rms = flat_curve()
        scan = {'passes': {'vad': [voice_seg(0.0, 179.0)], 'raw': []}}
        _, accepted, rejected, chosen = SBW.rank_candidates(
            rms, 179.56, 69.23, scan, step=10.0)
        self.assertEqual(chosen, None)
        self.assertEqual(accepted, [])
        self.assertTrue(len(rejected) > 0)

    def test_end_aligned_candidate(self):
        rms = flat_curve()
        cands, _, _, _ = SBW.rank_candidates(
            rms, 179.56, 69.23, empty_scan(), step=10.0)
        starts = [c['start_s'] for c in cands]
        self.assertIn(110.33, starts)  # 179,56 - 69,23


class TestFlowRegression(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(os.path.join(FIXTURES, 'flow-rms-curve.json')) as f:
            cls.rms = json.load(f)['rms_db_per_s']
        with open(os.path.join(FIXTURES, 'flow-scan.json')) as f:
            cls.scan = json.load(f)

    def test_chooses_v5_window(self):
        _, _, _, chosen = SBW.rank_candidates(
            self.rms, 179.56, 69.23, self.scan, step=1.0)
        self.assertIsNotNone(chosen)
        self.assertEqual(chosen['start_s'], 88.0)
        self.assertEqual(chosen['end_s'], 157.23)

    def test_rejects_v41_window_for_voice(self):
        c = SBW.score_window(self.rms, 72.0, 69.23, self.scan)
        self.assertEqual(c['status'], 'rejected')
        self.assertTrue(any('voz (VAD)' in r for r in c['reasons']))
        self.assertFalse(any('agujero' in r for r in c['reasons']))

    def test_rejects_window_zero_for_hole(self):
        c = SBW.score_window(self.rms, 0.0, 69.23, self.scan)
        self.assertEqual(c['status'], 'rejected')
        self.assertTrue(any('agujero' in r for r in c['reasons']))
        self.assertFalse(any('voz (VAD)' in r for r in c['reasons']))
        self.assertIn('-44.9', c['reasons'][0])

    def test_v5_window_metrics(self):
        c = SBW.score_window(self.rms, 88.0, 69.23, self.scan)
        self.assertEqual(c['status'], 'accepted')
        m = c['metrics']
        self.assertAlmostEqual(m['median_db'], -19.1, delta=0.15)
        self.assertAlmostEqual(m['min_db'], -29.8, delta=0.15)
        self.assertEqual(m['min_at_s'], 154)
        self.assertAlmostEqual(m['hole_depth_db'], 10.6, delta=0.15)
        self.assertAlmostEqual(m['start_db'], -19.2, delta=0.15)


if __name__ == '__main__':
    unittest.main()
