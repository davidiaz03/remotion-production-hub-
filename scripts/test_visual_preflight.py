#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Suite de pruebas del pre-vuelo visual (`visual-preflight.py`).

Ejecutar desde la raíz del repo:

    ~/workspace/remotion-hub/.venv/bin/python -m unittest \\
        scripts.test_visual_preflight -v

o desde scripts/:

    ~/workspace/remotion-hub/.venv/bin/python -m unittest \\
        test_visual_preflight -v

Dos niveles (mismo patrón que scripts/audio/test_microcut.py):
* Sintéticos (siempre corren, sin archivos externos): imágenes
  generadas en el test con el defecto inyectado. Cada chequeo debe
  cazar su defecto y no marcar la imagen limpia equivalente.
* Integración (se saltan si faltan los fotogramas V4.1, que son
  salidas de render no versionadas): los casos reales f020 (muerto),
  f016 (punto recortado), f001 (limpio) y f069 (sting, sin chequeo
  de logo). Ruta por defecto: el worktree principal
  ~/workspace/remotion-hub/repo/projects/marti-fidel/out/frames-v41
  (variable PREFLIGHT_FRAMES_V41 para otra).
"""
import importlib.util
import os
import sys
import unittest

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
REPO = os.path.abspath(os.path.join(HERE, ".."))

# visual-preflight.py lleva guion (CLI, como audit-audio.py): se carga
# por ruta, no por import.
_spec = importlib.util.spec_from_file_location(
    "visual_preflight", os.path.join(HERE, "visual-preflight.py"))
vp = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(vp)

try:
    import cv2
except ImportError:
    cv2 = None

FRAMES_V41 = os.environ.get(
    "PREFLIGHT_FRAMES_V41",
    os.path.expanduser(
        "~/workspace/remotion-hub/repo/projects/marti-fidel/out/frames-v41"))
LOGO_REF = os.path.join(FRAMES_V41, "f001.jpg")
MANIFEST = os.path.join(REPO, "tests", "fixtures",
                        "preflight-scenes-marti-fidel.json")

W, H = 540, 960  # lienzo sintético (mitad del real, misma proporción)
LOGO_ZONE = vp.LOGO_ZONE_DEFAULT


def gray_of(bgr):
    return cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)


def dark_frame():
    """Fondo oscuro liso con leve ruido (foto de estudio oscura)."""
    rng = np.random.default_rng(1)
    img = np.full((H, W, 3), 35, np.uint8)
    img = np.clip(img.astype(int) + rng.integers(-4, 5, img.shape),
                  0, 255).astype(np.uint8)
    return img


def paper_frame():
    """Fondo claro con textura cálida (papel viejo): el enemigo del
    chequeo de borde por su moteado rojizo."""
    rng = np.random.default_rng(2)
    base = np.full((H, W, 3), (170, 175, 200), np.uint8)  # BGR cálido
    noise = rng.integers(-25, 26, (H, W, 3))
    img = np.clip(base.astype(int) + noise, 0, 255).astype(np.uint8)
    # motas rojizas
    for _ in range(40):
        x, y = rng.integers(0, W), rng.integers(0, H)
        cv2.circle(img, (int(x), int(y)), int(rng.integers(3, 9)),
                   (60, 70, 130), -1)
    return img


@unittest.skipUnless(cv2, "cv2 solo existe en el venv del hub")
class TestPhash(unittest.TestCase):
    def test_identical_zero(self):
        g = np.random.default_rng(0).integers(0, 255, (200, 200),
                                              dtype=np.uint8)
        self.assertEqual(vp.hamming(vp.phash(g), vp.phash(g)), 0)

    def test_different_large(self):
        rng = np.random.default_rng(0)
        a = rng.integers(0, 255, (200, 200), dtype=np.uint8)
        b = rng.integers(0, 255, (200, 200), dtype=np.uint8)
        self.assertGreater(vp.hamming(vp.phash(a), vp.phash(b)), 12)

    def test_regrade_small(self):
        g = np.random.default_rng(0).integers(0, 255, (200, 200),
                                              dtype=np.uint8)
        g2 = cv2.convertScaleAbs(g, alpha=1.05, beta=8)
        self.assertLessEqual(vp.hamming(vp.phash(g), vp.phash(g2)), 6)


@unittest.skipUnless(cv2, "cv2 solo existe en el venv del hub")
class TestDeadFrame(unittest.TestCase):
    def test_blank_is_dead(self):
        g = np.full((H, W), 40, np.uint8)
        e = cv2.Canny(g, 50, 150)
        self.assertGreaterEqual(vp.check_dead_frame(g, e), 0.99)

    def test_textured_is_alive(self):
        rng = np.random.default_rng(0)
        g = rng.integers(0, 255, (H, W), dtype=np.uint8)
        e = cv2.Canny(g, 50, 150)
        self.assertLess(vp.check_dead_frame(g, e), 0.10)

    def test_quarter_content_is_alive(self):
        # Contenido solo en el cuarto superior: 75% vacío -> muerto.
        g = np.full((H, W), 40, np.uint8)
        rng = np.random.default_rng(0)
        g[:H // 4, :] = rng.integers(0, 255, (H // 4, W), dtype=np.uint8)
        e = cv2.Canny(g, 50, 150)
        self.assertGreaterEqual(vp.check_dead_frame(g, e), 0.70)


@unittest.skipUnless(cv2, "cv2 solo existe en el venv del hub")
class TestEdgeClipped(unittest.TestCase):
    def test_red_dot_on_dark_is_flagged(self):
        bgr = dark_frame()
        # Punto rojo tenue (como el de «EN VIVO» a medio fundir) junto
        # al borde izquierdo, banda superior.
        cv2.circle(bgr, (28, 35), 7, (37, 27, 50), -1)
        hits = vp.check_edge_clipped(bgr, gray_of(bgr), LOGO_ZONE)
        self.assertEqual(len(hits), 1)
        self.assertIn("izquierdo", hits[0])

    def test_red_dot_on_paper_is_not_flagged(self):
        bgr = paper_frame()
        cv2.circle(bgr, (28, 35), 7, (37, 27, 50), -1)
        hits = vp.check_edge_clipped(bgr, gray_of(bgr), LOGO_ZONE)
        self.assertEqual(hits, [])  # el anillo claro lo descarta

    def test_clean_dark_frame_no_flags(self):
        bgr = dark_frame()
        hits = vp.check_edge_clipped(bgr, gray_of(bgr), LOGO_ZONE)
        self.assertEqual(hits, [])

    def test_bright_touching_edge_is_flagged(self):
        bgr = dark_frame()
        # Rectángulo blanco tocando el borde derecho, sobre fondo oscuro.
        bgr[400:450, W - 20:W] = 240
        hits = vp.check_edge_clipped(bgr, gray_of(bgr), LOGO_ZONE)
        self.assertEqual(len(hits), 1)
        self.assertIn("derecho", hits[0])

    def test_bright_island_on_paper_is_not_flagged(self):
        bgr = paper_frame()
        # Isla clara (205) sobre papel claro (~182): contraste ~23 < 40,
        # como las islas de papel reales de S3 (f010-f012).
        bgr[400:450, W - 20:W] = 205
        hits = vp.check_edge_clipped(bgr, gray_of(bgr), LOGO_ZONE)
        self.assertEqual(hits, [])  # sin contraste con el entorno


@unittest.skipUnless(cv2, "cv2 solo existe en el venv del hub")
class TestLogo(unittest.TestCase):
    def _logo_frame(self):
        bgr = dark_frame()
        x0, y0, x1, y1 = (int(LOGO_ZONE[0] * W), int(LOGO_ZONE[1] * H),
                          int(LOGO_ZONE[2] * W), int(LOGO_ZONE[3] * H))
        # Estrella simplificada: rectángulo blanco + texto.
        cv2.rectangle(bgr, (x0 + 20, y0 + 10), (x0 + 60, y0 + 60),
                      (255, 255, 255), -1)
        cv2.rectangle(bgr, (x0 + 10, y0 + 70), (x0 + 70, y0 + 78),
                      (255, 255, 255), -1)
        return bgr, (x0, y0, x1, y1)

    def test_logo_present_scores_high(self):
        bgr, (x0, y0, x1, y1) = self._logo_frame()
        mask = gray_of(bgr)[y0:y1, x0:x1] > vp.LOGO_BRIGHT
        score, _bg = vp.check_logo(gray_of(bgr), mask, (x0, y0, x1, y1))
        self.assertGreater(score, 0.9)

    def test_logo_dimmed_still_scores_high(self):
        bgr, (x0, y0, x1, y1) = self._logo_frame()
        mask = gray_of(bgr)[y0:y1, x0:x1] > vp.LOGO_BRIGHT
        dim = (bgr.astype(float) * 0.5).astype(np.uint8)  # etalonaje oscuro
        score, _bg = vp.check_logo(gray_of(dim), mask, (x0, y0, x1, y1))
        self.assertGreater(score, 0.9)  # el fondo local lo salva

    def test_logo_missing_scores_zero(self):
        bgr, (x0, y0, x1, y1) = self._logo_frame()
        mask = gray_of(bgr)[y0:y1, x0:x1] > vp.LOGO_BRIGHT
        blank = dark_frame()
        score, _bg = vp.check_logo(gray_of(blank), mask, (x0, y0, x1, y1))
        self.assertLess(score, 0.1)


@unittest.skipUnless(cv2, "cv2 solo existe en el venv del hub")
class TestTextOnFace(unittest.TestCase):
    def _face(self):
        return [(200, 300, 120, 160, 0.92)]  # cara sintética

    def test_text_over_face_flagged(self):
        bgr = dark_frame()
        cv2.putText(bgr, "TEXTO", (200, 400), cv2.FONT_HERSHEY_SIMPLEX,
                    1.6, (0, 0, 0), 10, cv2.LINE_AA)
        cv2.putText(bgr, "TEXTO", (200, 400), cv2.FONT_HERSHEY_SIMPLEX,
                    1.6, (255, 255, 255), 5, cv2.LINE_AA)
        hits = vp.check_text_on_face(bgr, gray_of(bgr), self._face(),
                                     LOGO_ZONE)
        self.assertEqual(len(hits), 1)

    def test_text_away_from_face_clean(self):
        bgr = dark_frame()
        cv2.putText(bgr, "TEXTO", (200, 800), cv2.FONT_HERSHEY_SIMPLEX,
                    1.6, (0, 0, 0), 10, cv2.LINE_AA)
        cv2.putText(bgr, "TEXTO", (200, 800), cv2.FONT_HERSHEY_SIMPLEX,
                    1.6, (255, 255, 255), 5, cv2.LINE_AA)
        hits = vp.check_text_on_face(bgr, gray_of(bgr), self._face(),
                                     LOGO_ZONE)
        self.assertEqual(hits, [])

    def test_no_faces_no_flags(self):
        bgr = dark_frame()
        cv2.putText(bgr, "TEXTO", (200, 400), cv2.FONT_HERSHEY_SIMPLEX,
                    1.6, (255, 255, 255), 5, cv2.LINE_AA)
        hits = vp.check_text_on_face(bgr, gray_of(bgr), [], LOGO_ZONE)
        self.assertEqual(hits, [])


@unittest.skipUnless(cv2, "cv2 solo existe en el venv del hub")
class TestFaceFilter(unittest.TestCase):
    def test_low_score_dropped(self):
        faces = [(100, 100, 50, 60, 0.31)]
        good, dub = vp.filter_faces(faces, W, H, LOGO_ZONE)
        self.assertEqual(good, [])
        self.assertEqual(len(dub), 1)

    def test_logo_zone_face_dropped(self):
        x = int(0.85 * W)
        y = int(0.06 * H)
        faces = [(x, y, 90, 100, 0.92)]
        good, dub = vp.filter_faces(faces, W, H, LOGO_ZONE)
        self.assertEqual(good, [])
        self.assertEqual(len(dub), 1)

    def test_real_face_kept(self):
        faces = [(200, 300, 120, 160, 0.92)]
        good, dub = vp.filter_faces(faces, W, H, LOGO_ZONE)
        self.assertEqual(len(good), 1)
        self.assertEqual(dub, [])


@unittest.skipUnless(cv2, "cv2 solo existe en el venv del hub")
class TestIntegrationV41(unittest.TestCase):
    """Casos reales V4.1; se saltan si los fotogramas no están."""

    @classmethod
    def setUpClass(cls):
        cls.available = (os.path.isdir(FRAMES_V41)
                         and os.path.exists(LOGO_REF)
                         and os.path.exists(MANIFEST))
        cls.logo_mask = cls.logo_box = None
        if cls.available:
            cls.logo_mask, cls.logo_box = vp.build_logo_mask(
                LOGO_REF, LOGO_ZONE)

    def setUp(self):
        if not self.available:
            self.skipTest(f"sin fotogramas V4.1 en {FRAMES_V41}")

    def _analyse(self, name, skip_faces=True):
        path = os.path.join(FRAMES_V41, name)
        flags, metrics = vp.analyse_frame(
            path, "?", self.logo_mask, self.logo_box, LOGO_ZONE,
            skip_faces=skip_faces, skip_logo=False)
        return {c: (s, d) for c, s, d in flags}, metrics

    def test_f020_dead_frame(self):
        flags, m = self._analyse("f020.jpg")
        self.assertIn("dead-frame", flags)
        self.assertGreaterEqual(m["grid_empty"], 0.70)

    def test_f016_edge_clipped(self):
        flags, _m = self._analyse("f016.jpg")
        self.assertIn("edge-clipped", flags)

    def test_f001_clean(self):
        flags, m = self._analyse("f001.jpg")
        self.assertEqual(flags, {})
        self.assertGreater(m["logo_score"], 0.9)

    def test_f068_logo_dimmed_still_present(self):
        flags, m = self._analyse("f068.jpg")
        self.assertNotIn("logo-missing", flags)
        self.assertGreater(m["logo_score"], 0.9)

    def test_f011_masthead_not_detectable(self):
        # Documenta el límite: f011 NO se marca (el masthead tapado es
        # layout relativo, no píxeles). Si algún día se marca, este test
        # avisa de que la documentación quedó desactualizada.
        flags, _m = self._analyse("f011.jpg")
        self.assertEqual(flags, {})


if __name__ == "__main__":
    unittest.main()
