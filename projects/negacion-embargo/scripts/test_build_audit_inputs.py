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


if __name__ == "__main__":
    unittest.main()
