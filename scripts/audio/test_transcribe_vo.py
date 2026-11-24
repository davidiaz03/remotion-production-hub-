#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Pruebas de transcribe-vo.py (reutilización de transcripción).

Ejecutar desde la raíz del repo:

    python3 -m unittest scripts.audio.test_transcribe_vo -v

No necesita faster-whisper instalado: el módulo se carga con un stub
de faster_whisper (las pruebas nunca transcriben de verdad).
"""
import importlib.util
import json
import os
import sys
import tempfile
import types
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))

# Stub de faster_whisper (transcribe-vo.py lo importa en el tope del
# módulo; aquí nunca se instancia el modelo).
_fake = types.ModuleType("faster_whisper")


class _DummyModel:
    def __init__(self, *a, **k):
        raise AssertionError("el test no debe transcribir de verdad")


_fake.WhisperModel = _DummyModel
sys.modules.setdefault("faster_whisper", _fake)

_spec = importlib.util.spec_from_file_location(
    "transcribe_vo", os.path.join(HERE, "transcribe-vo.py"))
tv = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(tv)


def _tmp_json(obj):
    f = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False)
    json.dump(obj, f)
    f.close()
    return f.name


class TestLoadTranscriptWords(unittest.TestCase):
    def test_segments_word_shape(self):
        p = _tmp_json({
            "duration": 10.0, "language": "es",
            "segments": [
                {"start": 0.0, "end": 2.0, "text": " hola mundo",
                 "words": [
                     {"word": " hola", "start": 0.1, "end": 0.5,
                      "probability": 0.9},
                     {"word": " mundo", "start": 0.6, "end": 1.2,
                      "probability": 0.8},
                 ]},
            ]})
        try:
            words, duration = tv.load_transcript_words(p)
        finally:
            os.unlink(p)
        self.assertEqual(duration, 10.0)
        self.assertEqual(words, [
            {"word": "hola", "start": 0.1, "end": 0.5},
            {"word": "mundo", "start": 0.6, "end": 1.2},
        ])

    def test_list_wse_shape(self):
        # Forma de audit-audio.load_whisper_file.
        p = _tmp_json([
            {"words": [
                {"w": "hola", "s": 0.1, "e": 0.5},
                {"w": "mundo", "s": 0.6, "e": 1.2},
            ]}])
        try:
            words, duration = tv.load_transcript_words(p)
        finally:
            os.unlink(p)
        self.assertIsNone(duration)
        self.assertEqual(words, [
            {"word": "hola", "start": 0.1, "end": 0.5},
            {"word": "mundo", "start": 0.6, "end": 1.2},
        ])

    def test_malformed_words_skipped(self):
        p = _tmp_json({"segments": [
            {"words": [
                {"word": "hola", "start": 0.1, "end": 0.5},
                {"word": "sin-tiempos"},
                {"start": 0.6, "end": 1.2},
            ]}]})
        try:
            words, _ = tv.load_transcript_words(p)
        finally:
            os.unlink(p)
        self.assertEqual(len(words), 1)
        self.assertEqual(words[0]["word"], "hola")


class TestValidateTranscriptDuration(unittest.TestCase):
    LINES = [{"start": 0.0, "end": 5.0}, {"start": 5.0, "end": 10.2}]

    def test_matching_ok(self):
        tv.validate_transcript_duration(10.0, self.LINES)
        tv.validate_transcript_duration(12.0, self.LINES)

    def test_mismatch_raises(self):
        with self.assertRaises(ValueError):
            tv.validate_transcript_duration(30.0, self.LINES)

    def test_no_duration_ok(self):
        tv.validate_transcript_duration(None, self.LINES)

    def test_no_lines_ok(self):
        tv.validate_transcript_duration(30.0, [])


class TestAlignWithReusedWords(unittest.TestCase):
    def test_all_anchored(self):
        norm = tv.make_norm(tv.NUM_MAP_ES)
        script = ["Hola", "mundo", "cruel"]
        whisper = [
            {"word": "hola", "start": 0.1, "end": 0.5},
            {"word": "mundo", "start": 0.6, "end": 1.0},
            {"word": "cruel", "start": 1.1, "end": 1.6},
        ]
        times, n = tv.align(script, whisper, 0.0, 2.0, norm)
        self.assertEqual(n, 3)
        self.assertEqual(times[0], (0.1, 0.5))
        self.assertEqual(times[2], (1.1, 1.6))


if __name__ == "__main__":
    unittest.main()
