#!/usr/bin/env python3
"""Tests de bed-import.py (sin Whisper: escaneo simulado con --scan-json).

La importación real con Whisper+VAD se verifica en la prueba E2E de
longform-v2 (docs/LONGFORM-V2-2026-11-21.md §3); aquí se cubre la
lógica: recorte de la ventana, registro, rechazos y re-importación.

Uso: ~/workspace/remotion-hub/.venv/bin/python scripts/audio/test_bed_import.py
"""
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location(
    "bed_import", os.path.join(HERE, "bed-import.py"))
bi = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(bi)


def gen_tone(path, seconds=70, freq=220):
    r = subprocess.run(["ffmpeg", "-y", "-v", "error",
                        "-f", "lavfi", "-i",
                        f"sine=frequency={freq}:duration={seconds}",
                        "-ar", "48000", "-ac", "1", path],
                       capture_output=True, text=True)
    assert r.returncode == 0, r.stderr


class BedImportTest(unittest.TestCase):
    def setUp(self):
        self.td = tempfile.TemporaryDirectory(prefix="bed-import-")
        self.beds = os.path.join(self.td.name, "beds")
        os.makedirs(self.beds)
        self.orig_beds, self.orig_reg = bi.BEDS_DIR, bi.REGISTRY
        bi.BEDS_DIR = self.beds
        bi.REGISTRY = os.path.join(self.beds, "registry.json")
        self.track = os.path.join(self.td.name, "track.wav")
        gen_tone(self.track, seconds=70)
        self.scan = os.path.join(self.td.name, "scan.json")
        with open(self.scan, "w", encoding="utf-8") as f:
            json.dump({"input": self.track, "track_duration_s": 70.0,
                       "target_duration_s": 60.0,
                       "chosen": {"start_s": 5.0, "end_s": 65.0,
                                  "score": 98.5, "status": "accepted"}},
                      f)
        self.orig_argv = sys.argv

    def tearDown(self):
        sys.argv = self.orig_argv
        bi.BEDS_DIR, bi.REGISTRY = self.orig_beds, self.orig_reg
        self.td.cleanup()

    def _run(self, *args):
        sys.argv = ["bed-import.py", *args]
        return bi.main()

    def _registry(self):
        with open(bi.REGISTRY, encoding="utf-8") as f:
            return json.load(f)

    def test_import_with_canned_scan(self):
        rc = self._run("--in", self.track, "--id", "test-tone",
                       "--duration", "60", "--tags", "test,sine",
                       "--title", "Tono de prueba",
                       "--scan-json", self.scan, "--no-verify")
        self.assertEqual(rc, 0)
        wav = os.path.join(self.beds, "test-tone.wav")
        self.assertTrue(os.path.exists(wav))
        self.assertAlmostEqual(bi.probe_duration(wav), 60.0, delta=0.2)
        reg = self._registry()
        self.assertEqual(len(reg["beds"]), 1)
        e = reg["beds"][0]
        self.assertEqual(e["id"], "test-tone")
        self.assertEqual(e["window"], {"start_s": 5.0, "end_s": 65.0,
                                       "score": 98.5})
        self.assertEqual(e["tags"], ["test", "sine"])
        self.assertEqual(e["sample_rate"], 48000)
        self.assertEqual(e["channels"], 1)
        self.assertEqual(e["sha256"], bi.sha256_of(wav))
        self.assertTrue(os.path.exists(
            os.path.join(self.beds, "test-tone.scan.json")))

    def test_duplicate_id_refused_without_force(self):
        self.test_import_with_canned_scan()
        with self.assertRaises(SystemExit):
            self._run("--in", self.track, "--id", "test-tone",
                      "--duration", "60", "--scan-json", self.scan,
                      "--no-verify")
        rc = self._run("--in", self.track, "--id", "test-tone",
                       "--duration", "60", "--scan-json", self.scan,
                       "--no-verify", "--force")
        self.assertEqual(rc, 0)
        self.assertEqual(len(self._registry()["beds"]), 1)

    def test_window_length_mismatch_refused(self):
        with self.assertRaises(SystemExit):
            self._run("--in", self.track, "--id", "test-tone",
                      "--duration", "30", "--scan-json", self.scan,
                      "--no-verify")
        self.assertFalse(os.path.exists(bi.REGISTRY))

    def test_missing_scan_choice_refused(self):
        bad = os.path.join(self.td.name, "bad.json")
        with open(bad, "w", encoding="utf-8") as f:
            json.dump({"chosen": None}, f)
        with self.assertRaises(SystemExit):
            self._run("--in", self.track, "--id", "test-tone",
                      "--duration", "60", "--scan-json", bad,
                      "--no-verify")


if __name__ == "__main__":
    unittest.main()
