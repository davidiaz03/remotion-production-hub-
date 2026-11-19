#!/usr/bin/env python3
"""Regresión del check (b) de audit-audio.py: huecos de karaoke.

modern-wisdom-aprende (19-nov-2026) dio 10 FAIL (b) por huecos de
0,36-0,70 s tras comas/dos puntos «con voz encima». Análisis por
ventanas de 50 ms: 9 eran falsos positivos (colas de la palabra
anterior — vocales que decaen, /s/ finales planas, respiros — o la
palabra siguiente empezando ~0,1 s antes de su caption, jitter de
Whisper) y 1 era REAL (ROBERTSON empieza 0,23 s antes de su caption,
con un silencio limpio de por medio).

El check actual estima el inicio acústico de la palabra siguiente
(valle >=10 dB bajo su nivel de arranque) y solo da FAIL si empieza
>0,20 s antes de su caption. Estos tests verifican ambas caras con
los datos reales del proyecto (se saltan si faltan los audios, que
son salidas de build no versionadas).

Uso: .venv/bin/python scripts/audio/test_check_b_gaps.py
"""
import copy
import importlib.util
import json
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
MW = os.path.join(REPO, "projects", "modern-wisdom-aprende")
VO = os.path.join(MW, "public", "audio", "vo-full.wav")
CAPS = os.path.join(MW, "src", "captions.json")

spec = importlib.util.spec_from_file_location(
    "audit_audio", os.path.join(HERE, "audit-audio.py"))
aa = importlib.util.module_from_spec(spec)
spec.loader.exec_module(aa)


def _real_files_present():
    return os.path.exists(VO) and os.path.exists(CAPS)


@unittest.skipUnless(_real_files_present(),
                     "faltan los datos reales de modern-wisdom-aprende")
class CheckBGapsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.vo = aa.load_wav_fast(VO)
        cls.sr = aa.SR
        with open(CAPS, encoding="utf-8") as f:
            cls.captions = json.load(f)
        cls.silences = aa.find_silences(cls.vo, cls.sr)

    def _run_check_b(self, captions):
        rep = aa.Report("test-check-b")
        aa.check_b_caption_timing(rep, captions, self.vo, self.sr,
                                  self.silences)
        return rep

    def test_nine_false_positives_gone_one_real_fail_kept(self):
        rep = self._run_check_b(self.captions)
        fails = [x for x in rep.findings if x["sev"] == "FAIL"]
        self.assertEqual(len(fails), 1,
                         f"se esperaba exactamente 1 FAIL real: {fails}")
        self.assertIn("ROBERTSON", fails[0]["msg"])
        self.assertGreaterEqual(
            rep.metrics["b_gaps_tail_or_jitter"], 9,
            "los 9 huecos falsos deben clasificarse como colas/jitter")
        warns = [x for x in rep.findings if x["sev"] == "WARN"]
        self.assertLessEqual(len(warns), 5, "WARNs sin agregar")

    def test_shifted_caption_still_fails(self):
        caps2 = copy.deepcopy(self.captions)
        idx = None
        for i in range(len(caps2) - 2):
            c, n, nn = caps2[i], caps2[i + 1], caps2[i + 2]
            gap = n["startMs"] - c["endMs"]
            room = nn["startMs"] - n["startMs"]
            if 0 < gap < 300 and room > 800 and not c.get("pageBreakAfter"):
                idx = i
                break
        self.assertIsNotNone(idx, "sin candidato para el test sintético")
        shifted = caps2[idx + 1]["text"].strip()
        caps2[idx + 1]["startMs"] += 400
        rep = self._run_check_b(caps2)
        fails = [x for x in rep.findings if x["sev"] == "FAIL"]
        self.assertTrue(
            any("CON VOZ ENCIMA" in x["msg"] and shifted in x["msg"]
                for x in fails),
            f"el gate debe detectar {shifted!r} sonando en el hueco")


if __name__ == "__main__":
    unittest.main(verbosity=2)
