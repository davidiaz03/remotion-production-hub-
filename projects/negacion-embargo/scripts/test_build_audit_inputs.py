#!/usr/bin/env python3
"""Tests de P0-2: validación dura de insumos + pre-auditoría.

Uso: HUB_PY projects/negacion-embargo/scripts/test_build_audit_inputs.py -v
(Los scripts tienen guiones en el nombre y no se pueden importar con
`python -m unittest`; se cargan por ruta con importlib.)

- validate_voice_orig (build-audit-inputs.py): con wavs sintéticos
  generados con ffmpeg (siempre corren) y con los archivos reales del
  proyecto (se saltan si no están en disco: public/ no se commitea).
- build_args (run-audit.py): con pre=True no se pasa --master ni
  --expected-frames y sí --no-master; sin pre, lo contrario.
"""
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
VO_DIR = os.path.join(PROJ, "research", "vo")
LINES_DIR = os.path.join(PROJ, "public", "audio", "real", "lines")


def load_script(name):
    spec = importlib.util.spec_from_file_location(
        name, os.path.join(HERE, f"{name}.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


bai = load_script("build-audit-inputs")
ra = load_script("run-audit")


def sine_wav(path, seconds, channels=1, rate=48000):
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi",
                    "-i", f"sine=frequency=440:duration={seconds}",
                    "-ac", str(channels), "-ar", str(rate), path],
                   check=True)


def concat_wavs(paths, out):
    with tempfile.NamedTemporaryFile("w", suffix=".txt",
                                     delete=False) as f:
        for p in paths:
            f.write(f"file '{p}'\n")
        lst = f.name
    try:
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat",
                        "-safe", "0", "-i", lst, "-c:a", "pcm_s16le",
                        out], check=True)
    finally:
        os.remove(lst)


class TestValidateVoiceOrig(unittest.TestCase):
    def setUp(self):
        self.td = tempfile.TemporaryDirectory()
        self.d = self.td.name
        self.lines = []
        for i, dur in enumerate([0.5, 1.0, 1.5], start=1):
            p = os.path.join(self.d, f"L{i}.wav")
            sine_wav(p, dur)
            self.lines.append(p)
        self.orig = os.path.join(self.d, "voice-orig.wav")
        concat_wavs(self.lines, self.orig)

    def tearDown(self):
        self.td.cleanup()

    def test_ok_concat_valido(self):
        expected, actual = bai.validate_voice_orig(self.orig, self.lines)
        self.assertAlmostEqual(expected, 3.0, places=2)
        self.assertAlmostEqual(actual, 3.0, places=2)

    def test_falla_si_la_duracion_no_cuadra(self):
        # El bug del 22-nov: el concat salió con duración distinta a la
        # suma de líneas (116,71 s en vez de 61,78 s).
        trunc = os.path.join(self.d, "trunc.wav")
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", self.orig,
                        "-t", "2.0", trunc], check=True)
        with self.assertRaises(ValueError) as ctx:
            bai.validate_voice_orig(trunc, self.lines)
        self.assertIn("3.00", str(ctx.exception))
        self.assertIn("2.00", str(ctx.exception))

    def test_falla_si_no_es_mono(self):
        stereo = os.path.join(self.d, "stereo.wav")
        sine_wav(stereo, 3.0, channels=2)
        with self.assertRaises(ValueError) as ctx:
            bai.validate_voice_orig(stereo, self.lines)
        self.assertIn("canales", str(ctx.exception))

    def test_falla_si_falta_una_linea(self):
        with self.assertRaises(ValueError):
            bai.validate_voice_orig(
                self.orig, self.lines + [os.path.join(self.d, "L9.wav")])

    @unittest.skipUnless(
        os.path.isfile(os.path.join(VO_DIR, "voice-orig.wav"))
        and all(os.path.isfile(os.path.join(LINES_DIR, f"L{n}.wav"))
                for n in range(1, 9)),
        "faltan los archivos reales de VO en disco (public/ no se commitea)")
    def test_archivos_reales_del_proyecto(self):
        orig = os.path.join(VO_DIR, "voice-orig.wav")
        lines = [os.path.join(LINES_DIR, f"L{n}.wav") for n in range(1, 9)]
        expected, actual = bai.validate_voice_orig(orig, lines)
        # Valores medidos en la v4: 61,78 s.
        self.assertAlmostEqual(expected, 61.78, delta=0.15)
        self.assertAlmostEqual(actual, 61.78, delta=0.15)


class TestRunAuditArgs(unittest.TestCase):
    def test_pre_sin_master(self):
        args, out_dir, n_sfx = ra.build_args(None, "pre", pre=True)
        self.assertIn("--no-master", args)
        self.assertNotIn("--master", args)
        self.assertNotIn("--expected-frames", args)
        self.assertTrue(out_dir.endswith("research/audit-pre"))
        self.assertEqual(n_sfx, 77)

    def test_final_con_master(self):
        args, out_dir, _ = ra.build_args("out/x_MASTER.mp4", "v4")
        self.assertIn("--master", args)
        self.assertEqual(args[args.index("--master") + 1],
                         "out/x_MASTER.mp4")
        self.assertIn("--expected-frames", args)
        self.assertEqual(args[args.index("--expected-frames") + 1], "2325")
        self.assertNotIn("--no-master", args)
        self.assertTrue(out_dir.endswith("research/audit-v4"))


class TestFixSnaps(unittest.TestCase):
    """fix_snaps() con archivos sintéticos (P0-1)."""
    def setUp(self):
        self.td = tempfile.TemporaryDirectory()
        self.d = self.td.name
        # Predicción: 4 palabras; la 3ª es primera palabra de segmento.
        self.pred = os.path.join(self.d, "pred.json")
        json.dump({"palabras": [
            {"w": "El", "s": 0.50, "e": 1.00},
            {"w": "Gobierno", "s": 1.00, "e": 1.50},
            {"w": "Esta", "s": 29.16, "e": 29.40},
            {"w": "es", "s": 29.40, "e": 29.60},
        ]}, open(self.pred, "w"))
        # Editada: "Esta" con snap a 28,40 (0,76 s antes, como en v4).
        self.ed = os.path.join(self.d, "ed.json")
        json.dump([
            {"text": "El Gobierno", "start": 0.5, "end": 1.5, "words": [
                {"w": "El", "s": 0.50, "e": 1.00},
                {"w": "Gobierno", "s": 1.00, "e": 1.50}]},
            {"text": "Esta es", "start": 28.4, "end": 29.6, "words": [
                {"w": "Esta", "s": 28.40, "e": 29.40},
                {"w": "es", "s": 29.40, "e": 29.60}]},
        ], open(self.ed, "w"))

    def tearDown(self):
        self.td.cleanup()

    def test_corrige_solo_la_primera_palabra_del_segmento(self):
        fixed = bai.fix_snaps(self.pred, self.ed)
        self.assertEqual(len(fixed), 1)
        self.assertEqual(fixed[0][0], "Esta")
        self.assertAlmostEqual(fixed[0][1], 28.40, places=2)
        self.assertAlmostEqual(fixed[0][2], 29.16, places=2)
        ed = json.load(open(self.ed))
        self.assertAlmostEqual(ed[1]["words"][0]["s"], 29.16, places=2)
        # Las demás palabras intactas.
        self.assertAlmostEqual(ed[0]["words"][0]["s"], 0.50, places=2)
        self.assertAlmostEqual(ed[1]["words"][1]["s"], 29.40, places=2)

    def test_desvio_menor_no_se_corrige(self):
        ed = json.load(open(self.ed))
        ed[1]["words"][0]["s"] = 29.10  # desvío 0,06 s < 0,15
        json.dump(ed, open(self.ed, "w"))
        fixed = bai.fix_snaps(self.pred, self.ed)
        self.assertEqual(fixed, [])

    def test_numero_de_palabras_distinto_aborta(self):
        ed = json.load(open(self.ed))
        ed[1]["words"] = ed[1]["words"][:1]  # 3 palabras en vez de 4
        json.dump(ed, open(self.ed, "w"))
        with self.assertRaises(AssertionError) as ctx:
            bai.fix_snaps(self.pred, self.ed)
        self.assertIn("3 palabras", str(ctx.exception))


class TestTranscribeEdited(unittest.TestCase):
    """transcribe_edited() sobre la VO real (P0-1). Lento (~1 min):
    corre solo si voice-placed.wav y el venv STT están en disco."""

    @unittest.skipUnless(
        os.path.isfile(os.path.join(PROJ, "public/audio/voice-placed.wav"))
        and os.path.isfile(bai.WHISPER_VENV)
        and os.path.isdir(bai.WHISPER_MODEL),
        "falta voice-placed.wav o el venv/modelo STT en disco")
    def test_transcribe_la_vo_real(self):
        with tempfile.TemporaryDirectory() as td:
            out = os.path.join(td, "vo-edited-transcription.json")
            segs = bai.transcribe_edited(
                os.path.join(PROJ, "public/audio/voice-placed.wav"), out)
            n_words = sum(len(s["words"]) for s in segs)
            # El guion tiene 125 palabras; Whisper small las transcribe
            # todas en esta VO (v4: 10 segmentos / 125 palabras).
            self.assertEqual(n_words, 125)
            self.assertGreaterEqual(len(segs), 8)
            text = " ".join(s["text"] for s in segs).lower()
            # Casing de Whisper no determinista entre corridas: comparar
            # en minúsculas.
            self.assertIn("gobierno", text)
            self.assertIn("bloqueo", text)


if __name__ == "__main__":
    unittest.main()
