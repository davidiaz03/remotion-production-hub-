#!/usr/bin/env python3
"""Suite de pruebas del check de fotogramas fantasma (ghost-frames.py).

Ejecutar desde la raíz del repo:

    ~/workspace/remotion-hub/.venv/bin/python -m unittest \\
        scripts.test_ghost_frames -v

Dos niveles (mismo patrón que scripts/test_visual_preflight.py):
* Sintéticos (siempre corren): videos de colores sólidos generados
  con ffmpeg con el defecto inyectado — corte limpio (OK), resto del
  plano anterior (GHOST) y contenido ajeno a ambas escenas (REVISAR,
  el caso Bruno) — más los bordes del veredicto y el SKIP sin
  referencia previa.
* Integración (se saltan si faltan los videos, que son salidas de
  render no versionadas): el borrador v2 de negacion-embargo DEBE
  marcar f465-468 (Bruno, caso real del 22-nov-2026) y el máster v4
  DEBE salir limpio en ese mismo corte.
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
    "ghost_frames", os.path.join(HERE, "ghost-frames.py"))
gf = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(gf)

NEG = os.path.join(REPO, "projects", "negacion-embargo")
DRAFT_V2 = os.path.join(NEG, "out", "draft", "mainreel-draft-v2.mp4")
MASTER_V4 = os.path.join(NEG, "out", "MASTER-v4.mp4")


def solid_video(path, segments):
    """Video de colores sólidos. segments: [(color, n_frames)]."""
    inputs = []
    filt = []
    for i, (color, n) in enumerate(segments):
        inputs += ["-f", "lavfi", "-i",
                   f"color=c={color}:s=180x320:r=30:d={n / 30}"]
        filt.append(f"[{i}:v]")
    filt = "".join(filt) + f"concat=n={len(segments)}:v=1:a=0[v]"
    subprocess.run(["ffmpeg", "-y", "-v", "error", *inputs,
                    "-filter_complex", filt, "-map", "[v]",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30",
                    path], check=True)


def run_cli(video, cuts, tmpdir):
    out = os.path.join(tmpdir, "report.json")
    r = subprocess.run(
        [sys.executable, os.path.join(HERE, "ghost-frames.py"), video,
         "--cuts", cuts, "--out", out],
        capture_output=True, text=True)
    report = None
    if os.path.isfile(out):
        with open(out) as f:
            report = json.load(f)
    return r.returncode, report


class TestVerdict(unittest.TestCase):
    def test_ok_si_parece_a_la_escena_nueva(self):
        self.assertEqual(gf.frame_verdict(0.02, 0.02), "OK")
        self.assertEqual(gf.frame_verdict(0.13, 0.022), "OK")  # morph v3

    def test_ghost_si_parece_a_la_anterior_y_no_a_la_nueva(self):
        self.assertEqual(gf.frame_verdict(0.01, 0.10), "GHOST")
        self.assertEqual(gf.frame_verdict(0.02, 0.08), "GHOST")

    def test_revisar_si_no_parece_a_ninguna(self):
        # Caso real Bruno (MAD en color): d_prev 0,141, d_new 0,141.
        self.assertEqual(gf.frame_verdict(0.141, 0.141), "REVISAR")
        self.assertEqual(gf.frame_verdict(0.04, 0.09), "REVISAR")

    def test_morph_fuerte_ok(self):
        # Morph B1 (T1→T2, el más fuerte del reel): d_new 0,065.
        self.assertEqual(gf.frame_verdict(0.16, 0.065), "OK")


class TestLoadScenes(unittest.TestCase):
    def test_formato_preflight_start_end(self):
        with tempfile.NamedTemporaryFile("w", suffix=".json",
                                         delete=False) as f:
            json.dump({"fps": 30, "scenes": [
                {"name": "S1", "start": 0, "end": 99},
                {"name": "S2", "start": 100, "end": 199}]}, f)
            path = f.name
        try:
            cuts, fps = gf.load_scenes(path)
        finally:
            os.remove(path)
        self.assertEqual(cuts, [{"cut_f": 100, "scene": "S2"}])
        self.assertEqual(fps, 30)

    def test_formato_timeline_start_f(self):
        with tempfile.NamedTemporaryFile("w", suffix=".json",
                                         delete=False) as f:
            json.dump({"scenes": [
                {"name": "A", "start_f": 0, "end_f": 50},
                {"name": "B", "start_f": 51, "end_f": 90}]}, f)
            path = f.name
        try:
            cuts, _ = gf.load_scenes(path)
        finally:
            os.remove(path)
        self.assertEqual(cuts, [{"cut_f": 51, "scene": "B"}])


class TestSynthetic(unittest.TestCase):
    def setUp(self):
        self.td = tempfile.TemporaryDirectory()
        self.d = self.td.name

    def tearDown(self):
        self.td.cleanup()

    def test_corte_limpio_ok(self):
        p = os.path.join(self.d, "clean.mp4")
        solid_video(p, [("red", 60), ("green", 60)])
        code, rep = run_cli(p, "60", self.d)
        self.assertEqual(code, 0)
        self.assertEqual(rep["verdict"], "OK")
        self.assertEqual(rep["findings"], [])

    def test_resto_del_plano_anterior_ghost(self):
        # 2 fotogramas rojos (plano anterior) al inicio de la escena verde.
        p = os.path.join(self.d, "ghost.mp4")
        solid_video(p, [("red", 60), ("red", 2), ("green", 60)])
        code, rep = run_cli(p, "60", self.d)
        self.assertEqual(code, 1)
        self.assertEqual(rep["verdict"], "GHOST")
        ghosts = [f["f"] for f in rep["findings"]
                  if f["verdict"] == "GHOST"]
        self.assertEqual(ghosts, [60, 61])

    def test_contenido_ajeno_revisar(self):
        # 3 fotogramas azules (ni rojo ni verde) al inicio de la escena.
        p = os.path.join(self.d, "foreign.mp4")
        solid_video(p, [("red", 60), ("blue", 3), ("green", 60)])
        code, rep = run_cli(p, "60", self.d)
        self.assertEqual(code, 1)
        self.assertEqual(rep["verdict"], "REVISAR")
        rev = [f["f"] for f in rep["findings"]
               if f["verdict"] == "REVISAR"]
        self.assertEqual(rev, [60, 61, 62])

    def test_corte_sin_referencia_previa_skip(self):
        p = os.path.join(self.d, "short.mp4")
        solid_video(p, [("red", 30), ("green", 30)])
        code, rep = run_cli(p, "2", self.d)
        self.assertEqual(code, 0)
        self.assertEqual(rep["boundaries"][0]["verdict"], "SKIP")


class TestReal(unittest.TestCase):
    @unittest.skipUnless(os.path.isfile(DRAFT_V2),
                         "falta el borrador v2 en disco")
    def test_borrador_v2_marca_bruno_f465_468(self):
        with tempfile.TemporaryDirectory() as d:
            code, rep = run_cli(DRAFT_V2, "465", d)
        self.assertEqual(code, 1)
        marked = [f["f"] for f in rep["findings"]]
        self.assertEqual(marked, [465, 466, 467, 468])
        self.assertTrue(all(f["verdict"] == "REVISAR"
                            for f in rep["findings"]))

    @unittest.skipUnless(os.path.isfile(MASTER_V4),
                         "falta el máster v4 en disco")
    def test_master_v4_limpio_en_f465(self):
        with tempfile.TemporaryDirectory() as d:
            code, rep = run_cli(MASTER_V4, "465", d)
        self.assertEqual(code, 0)
        self.assertEqual(rep["verdict"], "OK")


if __name__ == "__main__":
    unittest.main()
