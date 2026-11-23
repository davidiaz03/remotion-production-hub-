#!/usr/bin/env python3
"""Suite de pruebas de la fuente única de tiempos (audio-times.py, P0-5).

Ejecutar desde la raíz del repo:

    ~/workspace/remotion-hub/.venv/bin/python -m unittest \\
        scripts.test_audio_times -v

Dos niveles (mismo patrón que scripts/test_ghost_frames.py):
* Sintéticos (siempre corren): un proyecto temporal con un clip
  sinusoidal y un audio-times.json mínimo; cada inconsistencia que
  el check debe cazar (fotograma, offset, clip ausente/fuera de
  rango, cross_check obsoleto, referencia de composición rota) y el
  sync a TypeScript.
* Integración (se saltan si faltan los clips, que son salidas de
  render no versionadas): medir «Period.» en panel-t2.mp4 debe dar
  4,58 s (p >= 0,9) y el check del proyecto real debe pasar con
  0 errores y 5 eventos.
"""
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, ".."))
sys.path.insert(0, HERE)

_spec = importlib.util.spec_from_file_location(
    "audio_times", os.path.join(HERE, "audio-times.py"))
at = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(at)

NEG = os.path.join(REPO, "projects", "negacion-embargo")
PANEL_T2 = os.path.join(NEG, "public", "video", "panel-t2.mp4")


def base_event(**over):
    ev = {"id": "ev1", "label": "evento de prueba",
          "clip": "public/audio/clip.wav",
          "clip_t_s": 0.5, "clip_t_end_s": 0.8,
          "offset_s": 1.0, "global_t_s": 1.5, "global_f": 45,
          "method": "test", "prob": 0.99, "word": "x",
          "measured_at": "2026-11-23"}
    ev.update(over)
    return ev


class TmpProject(unittest.TestCase):
    def setUp(self):
        self.td = tempfile.TemporaryDirectory()
        self.proj = self.td.name
        os.makedirs(os.path.join(self.proj, "research"))
        os.makedirs(os.path.join(self.proj, "public", "audio"))
        os.makedirs(os.path.join(self.proj, "src"))
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi",
                        "-i", "sine=frequency=440:duration=2.0",
                        "-ac", "1", "-ar", "48000",
                        os.path.join(self.proj,
                                     "public", "audio", "clip.wav")],
                       check=True)

    def tearDown(self):
        self.td.cleanup()

    def write_times(self, events):
        with open(os.path.join(self.proj, "research",
                               "audio-times.json"), "w") as f:
            json.dump({"version": 1, "project": "tmp", "fps": 30,
                       "events": events}, f)

    def check(self, events):
        self.write_times(events)
        return at.check_project_dir(self.proj)


class TestCheck(TmpProject):
    def test_ok(self):
        errors, warnings, n = self.check([base_event()])
        self.assertEqual(errors, [])
        self.assertEqual(warnings, [])
        self.assertEqual(n, 1)

    def test_global_f_inconsistente(self):
        errors, _, _ = self.check([base_event(global_f=50)])
        self.assertEqual(len(errors), 1)
        self.assertIn("global_f", errors[0])

    def test_global_f_tolerancia_1_fotograma(self):
        # 1,5 s × 30 = 45; 46 pasa (colocación ±1 f, caso PUNTO. f423).
        errors, _, _ = self.check([base_event(global_f=46)])
        self.assertEqual(errors, [])

    def test_offset_inconsistente(self):
        # global_t_s 1,7 con global_f 51 (1,7*30): solo falla el offset.
        errors, _, _ = self.check(
            [base_event(global_t_s=1.7, global_f=51)])
        self.assertEqual(len(errors), 1)
        self.assertIn("offset_s", errors[0])

    def test_clip_ausente(self):
        errors, _, _ = self.check(
            [base_event(clip="public/audio/nope.wav")])
        self.assertEqual(len(errors), 1)
        self.assertIn("no encontrado", errors[0])

    def test_clip_t_fuera_del_clip(self):
        errors, _, _ = self.check(
            [base_event(clip_t_s=5.0, global_t_s=6.0, global_f=180)])
        self.assertEqual(len(errors), 1)
        self.assertIn("fuera del clip", errors[0])

    def test_prob_baja_avisa_pero_no_falla(self):
        errors, warnings, _ = self.check([base_event(prob=0.4)])
        self.assertEqual(errors, [])
        self.assertEqual(len(warnings), 1)
        self.assertIn("probabilidad baja", warnings[0])

    def test_cross_check_obsoleto(self):
        with open(os.path.join(self.proj, "research",
                               "timeline.json"), "w") as f:
            json.dump({"panel": {"t2": {"punto_s": 13.32}}}, f)
        ev = base_event(cross_check={
            "file": "research/timeline.json",
            "path": "panel.t2.punto_s", "tolerance_s": 0.1})
        errors, _, _ = self.check([ev])
        self.assertEqual(len(errors), 1)
        self.assertIn("cross_check", errors[0])
        self.assertIn("13.32", errors[0])

    def test_composition_ref_slams(self):
        with open(os.path.join(self.proj, "src",
                               "MainReel.tsx"), "w") as f:
            f.write("const SLAMS = [9, 423];\n")
        ok = base_event(composition_ref=[
            {"file": "src/MainReel.tsx", "const": "SLAMS",
             "contains": 423}])
        errors, _, _ = self.check([ok])
        self.assertEqual(errors, [])
        bad = base_event(composition_ref=[
            {"file": "src/MainReel.tsx", "const": "SLAMS",
             "contains": 999}])
        errors, _, _ = self.check([bad])
        self.assertEqual(len(errors), 1)
        self.assertIn("no contiene 999", errors[0])

    def test_composition_ref_valor_mas_base(self):
        with open(os.path.join(self.proj, "src",
                               "MainReel.tsx"), "w") as f:
            f.write("const PUNTO_AT = 126;\n")
        ok = base_event(global_f=423, composition_ref=[
            {"file": "src/MainReel.tsx", "const": "PUNTO_AT",
             "value": 126, "base_f": 297}])
        # global_t_s 1,5 no cuadra con global_f 423: ajustar el evento
        # para aislar el chequeo de composición.
        ok["global_t_s"] = 14.1
        ok["offset_s"] = 13.6
        errors, _, _ = self.check([ok])
        self.assertEqual(errors, [])


class TestSync(TmpProject):
    def test_genera_ts(self):
        self.write_times([base_event(), base_event(
            id="ev-dos", clip_t_s=1.0, global_t_s=2.0, global_f=60)])
        out = at.sync_project_dir(self.proj)
        with open(out) as f:
            src = f.read()
        self.assertIn('"ev1": {clipT: 0.5, globalT: 1.5, globalF: 45}',
                      src)
        self.assertIn("export const EV1_F = 45;", src)
        self.assertIn("export const EV_DOS_F = 60;", src)
        self.assertIn("DO NOT EDIT", src)


class TestReal(unittest.TestCase):
    @unittest.skipUnless(os.path.isfile(PANEL_T2),
                         "falta panel-t2.mp4 en disco")
    def test_measure_period_4_58(self):
        ev = at.measure_event("negacion-embargo",
                              "public/video/panel-t2.mp4", "Period.",
                              language="en", offset_s=9.5)
        self.assertAlmostEqual(ev["clip_t_s"], 4.58, delta=0.2)
        self.assertAlmostEqual(ev["global_t_s"], 14.08, delta=0.2)
        self.assertGreaterEqual(ev["prob"], 0.9)

    @unittest.skipUnless(
        os.path.isfile(os.path.join(NEG, "research", "audio-times.json"))
        and os.path.isfile(PANEL_T2),
        "faltan los archivos reales en disco")
    def test_check_proyecto_real(self):
        errors, warnings, n = at.check_project("negacion-embargo")
        self.assertEqual(errors, [])
        self.assertEqual(n, 5)
        data = at.load_times("negacion-embargo")
        t2 = [e for e in data["events"]
              if e["id"] == "panel-t2-period"][0]
        self.assertEqual(t2["global_f"], 423)
        self.assertEqual(t2["clip_t_s"], 4.58)


if __name__ == "__main__":
    unittest.main()
