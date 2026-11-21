#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Tests de transcribe-vo-file.py (VO de un solo archivo).

Solo funciones puras (sin modelo Whisper): parseo del guion,
alineación con palabras sintéticas, chunking y construcción de
segmentos. La corrida real con Whisper se verifica a mano (ver
docs/HUB-V6.md) porque necesita el modelo y ~1 min de CPU.
"""
import importlib.util
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

_spec = importlib.util.spec_from_file_location(
    "transcribe_vo_file", os.path.join(HERE, "transcribe-vo-file.py"))
tvf = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(tvf)


def ww(words, t0=0.0, step=0.5):
    """Palabras sintéticas de Whisper: 0,5 s por palabra."""
    return [{"word": w, "start": t0 + i * step,
             "end": t0 + (i + 1) * step}
            for i, w in enumerate(words)]


class TestParseScript(unittest.TestCase):
    def test_ignora_vacias_y_comentarios(self):
        import tempfile
        with tempfile.NamedTemporaryFile("w", suffix=".md",
                                         delete=False,
                                         encoding="utf-8") as f:
            f.write("# Título del guion\n\nPrimera línea.\n\n"
                    "# nota interna\nSegunda línea.\n")
            path = f.name
        try:
            self.assertEqual(tvf.parse_script(path),
                             ["Primera línea.", "Segunda línea."])
        finally:
            os.unlink(path)

    def test_sin_lineas_falla(self):
        import tempfile
        with tempfile.NamedTemporaryFile("w", suffix=".md",
                                         delete=False,
                                         encoding="utf-8") as f:
            f.write("# solo comentarios\n\n")
            path = f.name
        try:
            with self.assertRaises(SystemExit):
                tvf.parse_script(path)
        finally:
            os.unlink(path)


class TestAlignWords(unittest.TestCase):
    def setUp(self):
        self.norm = tvf.make_norm(tvf.NUM_MAP_ES)

    def test_coincidencia_exacta(self):
        times, anchored = tvf.align_words(
            ["hola", "mundo"], ww(["hola", "mundo"]), 0.0, 1.0, self.norm)
        self.assertEqual(times, [(0.0, 0.5), (0.5, 1.0)])
        self.assertEqual(anchored, [True, True])

    def test_palabra_oida_distinto_se_interpola(self):
        # Whisper oyó "casa" donde el guion dice "cosa": sin ancla,
        # se interpola entre los vecinos (y queda marcada).
        times, anchored = tvf.align_words(
            ["la", "cosa", "grande"],
            ww(["la", "casa", "grande"]), 0.0, 1.5, self.norm)
        self.assertEqual(anchored, [True, False, True])
        self.assertEqual(times[0], (0.0, 0.5))
        self.assertEqual(times[2], (1.0, 1.5))
        # Interpolada entre los vecinos: ocupa el hueco 0,5-1,0.
        self.assertEqual(times[1], (0.5, 1.0))

    def test_numeros_del_guion_en_palabras(self):
        # Whisper dice "21", el guion "veintiuno": el mapa numérico
        # los casa (misma regla que transcribe-vo.py).
        times, anchored = tvf.align_words(
            ["veintiuno", "corrieron"],
            ww(["21", "corrieron"]), 0.0, 1.0, self.norm)
        self.assertEqual(anchored, [True, True])


class TestChunkWords(unittest.TestCase):
    def test_cuatro_por_chunk(self):
        self.assertEqual(tvf.chunk_words(9, set()),
                         [(0, 4), (4, 8), (8, 9)])

    def test_corte_tras_puntuacion(self):
        # "Hola, mundo cruel." -> corte tras "Hola," (índice 0) y al
        # final; el resto (2 palabras) en un chunk.
        self.assertEqual(tvf.chunk_words(3, {0, 2}), [(0, 1), (1, 3)])

    def test_una_palabra(self):
        self.assertEqual(tvf.chunk_words(1, {0}), [(0, 1)])


class TestBuildSegments(unittest.TestCase):
    def setUp(self):
        self.norm = tvf.make_norm(tvf.NUM_MAP_ES)

    def test_dos_lineas_dos_segmentos(self):
        lines = ["Hola mundo.", "Seguimos aquí."]
        times = [(0.0, 0.5), (0.5, 1.0), (2.0, 2.5), (2.5, 3.0)]
        segs = tvf.build_segments(lines, times, 30, 4.0, set(), self.norm)
        self.assertEqual(len(segs), 2)
        self.assertEqual(segs[0]["id"], 1)
        self.assertEqual(segs[0]["start"], 0.0)
        # El segmento 1 cubre hasta el inicio de la línea 2 (2,0 s).
        self.assertEqual(segs[0]["frames"], 60)
        # El último cubre hasta el fin de la VO (4,0 s).
        self.assertEqual(segs[1]["frames"], 60)
        # Texto en mayúsculas, como en transcribe-vo.py.
        words = [w["t"] for c in segs[0]["chunks"] for w in c["words"]]
        self.assertEqual(words, ["HOLA", "MUNDO."])

    def test_keywords_marcan_kw(self):
        lines = ["El gigante avanza."]
        times = [(0.0, 0.5), (0.5, 1.0), (1.0, 1.5)]
        segs = tvf.build_segments(lines, times, 30, 2.0,
                                  {"gigante"}, self.norm)
        kws = [w["t"] for c in segs[0]["chunks"] for w in c["words"]
               if w["kw"]]
        self.assertEqual(kws, ["GIGANTE"])

    def test_typescript_y_hub_json(self):
        lines = ["Hola mundo."]
        times = [(0.0, 0.5), (0.5, 1.0)]
        segs = tvf.build_segments(lines, times, 30, 2.0, set(), self.norm)
        ts = tvf.to_typescript(segs)
        self.assertIn("export const CAPTIONS: CapSegment[] = ", ts)
        self.assertIn('"t": "HOLA"', ts)
        caps = tvf.to_hub_captions(segs)
        self.assertEqual(caps[0]["text"], "HOLA")
        self.assertEqual(caps[1]["text"], " MUNDO.")
        self.assertTrue(caps[1]["pageBreakAfter"])


if __name__ == "__main__":
    unittest.main()
