#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Suite de pruebas del detector de microcortes (`microcut.py`) y
del constructor de VO sin microcortes (`vo_build.py`).

Ejecutar desde la raíz del repo:

    ~/workspace/remotion-hub/.venv/bin/python -m unittest \
        scripts.audio.test_microcut -v

o desde scripts/audio/:

    ~/workspace/remotion-hub/.venv/bin/python -m unittest \
        test_microcut -v

Dos niveles:
* Sintéticos (siempre corren, sin archivos externos): voz
  sintética con microcortes inyectados de duración conocida.
  El detector debe cazarlos todos y no marcar la voz limpia.
* Integración (se saltan si faltan los archivos de audio, que
  son salidas de build no versionadas): el caso malo real V2.2
  (6 pausas), el caso V2.3 (solo hallazgos reales) y el baseline
  limpio (originales sin editar, 0 hallazgos). Los edit-plan y
  predicciones están vendorizados en tests/fixtures/ porque los
  originales viven fuera del repo (research/).
"""

import json
import os
import re
import sys
import unittest

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
FIXTURES = os.path.join(HERE, "tests", "fixtures")
PROJ = os.path.join(REPO, "projects", "marti-fidel")

import microcut as mc  # noqa: E402
import vo_build as vb  # noqa: E402

SR = 48000
RNG = np.random.default_rng(3)


# ---------------- voz sintética ----------------

def voiced(dur: float, f0: float = 120.0) -> np.ndarray:
    """Tramo sonoro: suma de armónicos con AM lenta, ~-18 dBFS."""
    t = np.arange(int(dur * SR)) / SR
    s = sum(np.sin(2 * np.pi * f0 * k * t + 0.3 * k) / k
            for k in range(1, 6))
    s *= (0.7 + 0.3 * np.sin(2 * np.pi * 4 * t))
    return (s / np.abs(s).max() * 0.13).astype(np.float32)


def room(n: int) -> np.ndarray:
    """Tono de sala: ruido COLOREADO a ~-50 dBFS (paso bajo).

    El tono de sala real no es blanco: dominan las bajas
    frecuencias y el espectro es estable entre ventanas vecinas.
    Con ruido blanco, la distancia espectral de (i1) entre dos
    tramos independientes es ~1,0 por construcción y el check
    marcaría WARN espurio en cualquier empalme limpio.
    """
    w = RNG.normal(0, 1.0, n)
    # Paso bajo de un polo (suaviza el espectro).
    y = np.empty(n)
    acc = 0.0
    for i in range(n):
        acc += 0.08 * (w[i] - acc)
        y[i] = acc
    y /= (np.abs(y).max() + 1e-9)
    return (y * 0.004).astype(np.float32)


def three_words():
    """Tres palabras de 0,4 s con pausas de 0,2 s.

    Devuelve (audio, words, tmap_identidad).
    """
    orig = np.concatenate([room(int(0.1 * SR)), voiced(0.4),
                           room(int(0.2 * SR)), voiced(0.4),
                           room(int(0.2 * SR)), voiced(0.4),
                           room(int(0.1 * SR))])
    words = [{"w": "UNO", "s": 0.1, "e": 0.5},
             {"w": "DOS", "s": 0.7, "e": 1.1},
             {"w": "TRES", "s": 1.3, "e": 1.7}]
    tmap = [(0.0, len(orig) / SR, 0.0, 1.0)]
    return orig, words, tmap


def inject_hole(a: np.ndarray, center_s: float,
                hole_ms: float) -> np.ndarray:
    """Silencia `hole_ms` alrededor de `center_s` (tono de sala)."""
    ed = a.copy()
    c = int(center_s * SR)
    h = int(hole_ms / 1000 * SR)
    ed[c - h // 2:c + h // 2] = room(h)
    return ed


# ---------------- (i2) dips dentro de palabras ----------------

class TestWordDips(unittest.TestCase):
    def test_holes_caught(self):
        """Huecos de 5/10/20/30/50 ms dentro de una palabra."""
        orig, words, tmap = three_words()
        for hole_ms in (5, 10, 20, 30, 50):
            ed = inject_hole(orig, 0.9, hole_ms)
            dips = mc.word_dips(ed, orig, SR, words, words, tmap)
            hit = [d for d in dips if d["word"] == "DOS"]
            self.assertEqual(
                len(hit), 1,
                f"hueco de {hole_ms} ms no detectado: {dips}")
            self.assertGreaterEqual(hit[0]["dip_edited_db"], 10.0)

    def test_clean_is_clean(self):
        orig, words, tmap = three_words()
        self.assertEqual(mc.word_dips(orig, orig, SR, words,
                                      words, tmap), [])

    def test_hole_in_pause_ignored(self):
        """Un hueco en la pausa (sin voz original ahí) no es dip."""
        orig, words, tmap = three_words()
        ed = inject_hole(orig, 0.6, 30)
        self.assertEqual(mc.word_dips(ed, orig, SR, words,
                                      words, tmap), [])

    def test_natural_closure_not_flagged(self):
        """Un cierre de oclusiva presente en AMBOS audios no es
        defecto (el caso «recuento»/«gigante» de V2.3)."""
        orig, words, tmap = three_words()
        # Cierre de 45 ms dentro de DOS, en el original y la editada.
        orig_c = inject_hole(orig, 0.9, 45)
        ed = inject_hole(orig_c, 0.9, 45)
        self.assertEqual(mc.word_dips(ed, orig_c, SR, words,
                                      words, tmap), [])

    def test_closure_shifted_by_warp_not_flagged(self):
        """El mismo cierre desplazado 10 ms por el warp del atempo
        tampoco es defecto (el mínimo sobre ±10 ms lo absorbe)."""
        orig, words, tmap = three_words()
        orig_c = inject_hole(orig, 0.9, 45)
        ed = inject_hole(orig, 0.91, 45)
        self.assertEqual(mc.word_dips(ed, orig_c, SR, words,
                                      words, tmap), [])

    def test_short_word_silent_margins_gain_not_flagged(self):
        """Palabra corta (120 ms) con márgenes silenciosos y
        ganancia constante entre editada y original: SIN dips.

        Regresión V4.1 (caso «EL» L6): la mediana del original se
        calculaba sobre la ventana con márgenes de ±60 ms, que en
        palabras cortas dominan la mediana y sesgaban d ~-13 dB,
        marcando 3 FAIL espurios donde la editada era el crudo +
        7,4 dB constantes. La mediana debe tomarse sobre el tramo
        de la palabra (envolvente mapeada). El fixture reproduce
        la geometría real: el span de Whisper adelanta 40 ms al
        onset acústico y la vocal tiene rugosidad glotal (sin el
        transitorio de onset, la racha sesgada supera 80 ms y el
        tope de duración la oculta)."""
        t = np.arange(int(0.08 * SR)) / SR
        word = (voiced(0.08)
                * (0.55 + 0.45 * np.sin(2 * np.pi * 120 * t))
                * 3.0).astype(np.float32)
        orig = np.concatenate([room(int(0.5 * SR)),
                               room(int(0.04 * SR)), word,
                               room(int(0.5 * SR))])
        words = [{"w": "EL", "s": 0.5, "e": 0.62}]
        tmap = [(0.0, len(orig) / SR, 0.0, 1.0)]
        ed = (orig * 10 ** (7.4 / 20)).astype(np.float32)
        self.assertEqual(mc.word_dips(ed, orig, SR, words,
                                      words, tmap), [])


# ---------------- (i1) calidad de empalme ----------------

class TestSplice(unittest.TestCase):
    def test_abrupt_splice_fails(self):
        """Empalme sin crossfade dentro de voz: salto de muestra."""
        t = np.arange(int(0.5 * SR)) / SR
        # A termina en pico positivo, B empieza en pico negativo.
        a = (0.13 * np.sin(2 * np.pi * 120 * t + np.pi / 2))
        b = (0.13 * np.sin(2 * np.pi * 120 * t - np.pi / 2))
        x = np.concatenate([a, b]).astype(np.float32)
        rep = mc.splice_report(x, SR, 0.5)
        self.assertEqual(rep["verdict"], "FAIL")
        self.assertGreater(rep["jump_ratio"], mc.SPLICE_JUMP_RATIO)

    def test_equal_power_splice_passes(self):
        """Empalme con crossfade de igual potencia: sin hueco."""
        x = np.concatenate([voiced(0.5), room(int(0.6 * SR)),
                            voiced(0.5)])
        words = [{"w": "A", "s": 0.05, "e": 0.45},
                 {"w": "B", "s": 1.15, "e": 1.55}]
        out, segs, _rep = vb.edit_line_safe(
            x, SR, 0.0, 1.6, [(0.55, 0.85)], words)
        # Un solo empalme interno.
        self.assertEqual(len(segs), 2)
        rep = mc.splice_report(out, SR, segs[1][2])
        self.assertEqual(rep["verdict"], "PASS", rep)
        self.assertLess(rep["dip_db"], mc.XFADE_DIP_WARN_DB)

    def test_old_fade_pattern_warns(self):
        """El patrón viejo (fade-out + fade-in, sin solape) deja
        el hueco de ~10 ms que (i1) debe marcar."""
        x = np.concatenate([voiced(0.5), room(int(0.6 * SR)),
                            voiced(0.5)])
        fade_n = int(0.005 * SR)
        ramp = 0.5 - 0.5 * np.cos(np.pi * np.arange(fade_n) / fade_n)
        s1 = x[int(0.0 * SR):int(0.55 * SR)].copy()
        s2 = x[int(0.85 * SR):int(1.6 * SR)].copy()
        s1[-fade_n:] *= ramp[::-1]
        s2[:fade_n] *= ramp
        out = np.concatenate([s1, s2])
        rep = mc.splice_report(out, SR, 0.55)
        self.assertEqual(rep["verdict"], "WARN")
        self.assertGreater(rep["dip_db"], mc.XFADE_DIP_WARN_DB)


# ---------------- (i3) pausas recortadas ----------------

class TestGaps(unittest.TestCase):
    def _two_words(self, gap_ed: float):
        """Original con pausa de 0,4 s; editada con `gap_ed`."""
        orig = np.concatenate([room(int(0.1 * SR)), voiced(0.4),
                               room(int(0.4 * SR)), voiced(0.4),
                               room(int(0.1 * SR))])
        ed = np.concatenate([room(int(0.1 * SR)), voiced(0.4),
                             room(int(gap_ed * SR)), voiced(0.4),
                             room(int(0.1 * SR))])
        w_o = [{"w": "UNO", "s": 0.1, "e": 0.5},
               {"w": "DOS", "s": 0.9, "e": 1.3}]
        w_e = [{"w": "UNO", "s": 0.1, "e": 0.5},
               {"w": "DOS", "s": 0.5 + gap_ed, "e": 0.9 + gap_ed}]
        spans = [(0.0, 0.9 + gap_ed, 1)]
        return ed, orig, w_e, w_o, spans

    def test_squeezed_pause_fails(self):
        """Pausa 0,40 -> 0,15 s: FAIL (el caso V2.2)."""
        ed, orig, w_e, w_o, spans = self._two_words(0.15)
        gaps = mc.gap_report(ed, orig, SR, w_e, w_o, spans)
        self.assertEqual(len(gaps), 1)
        self.assertEqual(gaps[0]["words"], "UNO -> DOS")
        self.assertLess(gaps[0]["edited_s"], 0.25)

    def test_intact_pause_passes(self):
        ed, orig, w_e, w_o, spans = self._two_words(0.40)
        self.assertEqual(mc.gap_report(ed, orig, SR, w_e, w_o,
                                       spans), [])

    def test_mild_trim_passes(self):
        """Pausa 0,40 -> 0,30 s: dentro de la regla (>=0,25 s y
        pérdida del 25%)."""
        ed, orig, w_e, w_o, spans = self._two_words(0.30)
        self.assertEqual(mc.gap_report(ed, orig, SR, w_e, w_o,
                                       spans), [])


# ---------------- (i4) contigüidad de segmentos ----------------

class TestContiguity(unittest.TestCase):
    def _glide(self, dur=1.2):
        """Voz con pitch en glissando 100->160 Hz y AM de 3 Hz:
        dos posiciones distintas no correlacionan entre sí, y la
        envolvente tiene estructura (sin AM, la envolvente es
        plana y la correlación de (i4) con stretch no tiene de
        qué agarrarse)."""
        t = np.arange(int(dur * SR)) / SR
        f0 = 100 + 60 * t / dur
        phase = 2 * np.pi * np.cumsum(f0) / SR
        s = (np.sin(phase) + 0.5 * np.sin(2 * phase)
             + 0.33 * np.sin(3 * phase))
        s *= (0.6 + 0.4 * np.sin(2 * np.pi * 3 * t))
        return (s / np.abs(s).max() * 0.13).astype(np.float32)

    def test_clean_segment_ok(self):
        orig = self._glide()
        tmap = [(0.0, 1.2, 0.0, 1.0)]
        res = mc.segment_contiguity(orig, orig, SR, tmap)
        self.assertTrue(res[0]["ok"], res)
        self.assertGreater(res[0]["median_corr"], 0.9)

    def test_mismapped_segment_fails(self):
        """Segmento cuyo audio viene de otra posición del original
        (mapa incorrecto): correlación mediana baja."""
        orig = self._glide()
        ed = np.concatenate([orig[int(0.6 * SR):],
                             orig[:int(0.6 * SR)]])
        tmap = [(0.0, 1.2, 0.0, 1.0)]
        res = mc.segment_contiguity(ed, orig, SR, tmap)
        self.assertFalse(res[0]["ok"], res)
        self.assertLess(res[0]["median_corr"], mc.CONTIG_MIN_CORR)

    def test_stretched_segment_ok(self):
        """Segmento con stretch 1,10x (resampleo lineal): la
        envolvente correlaciona y no hay saltos de lag."""
        orig = self._glide()
        # Estirar: el original de 1,2 s pasa a 1,2/1,1 s editados.
        n_ed = int(len(orig) / 1.1)
        t_old = np.arange(len(orig))
        t_new = np.arange(n_ed) * 1.1
        ed = np.interp(t_new, t_old, orig).astype(np.float32)
        tmap = [(0.0, len(ed) / SR, 0.0, 1.1)]
        res = mc.segment_contiguity(ed, orig, SR, tmap)
        self.assertTrue(res[0]["ok"], res)


# ---------------- (i5) enmascaramiento por SFX ----------------

class TestSfxMasking(unittest.TestCase):
    def _words_quiet_onset(self):
        """Como three_words, pero DOS arranca con ataque sordo
        (rampa de 50 ms): el onset real de una palabra es quieto
        (~-40 dBFS) y ahí es donde un SFX lo entierra."""
        orig, words, tmap = three_words()
        i0 = int(0.7 * SR)
        ramp = np.linspace(0.05, 1.0, int(0.05 * SR))
        orig = orig.copy()
        orig[i0:i0 + len(ramp)] *= ramp.astype(np.float32)
        return orig, words

    def test_loud_sfx_on_onset_fails(self):
        """Boom de -10 dBFS sobre el ataque de una palabra a -40 dBFS."""
        voice, words = self._words_quiet_onset()
        mix = voice.copy()
        # Boom de 100 ms a -10 dBFS sobre el onset de DOS (0,7 s).
        i0 = int(0.7 * SR)
        burst = (0.3 * np.sin(2 * np.pi * 60 *
                              np.arange(int(0.1 * SR)) / SR)
                 * np.exp(-np.arange(int(0.1 * SR)) / (0.02 * SR)))
        mix[i0:i0 + len(burst)] += burst.astype(np.float32)
        res = mc.sfx_masking(mix, voice, SR, [0.7], words)
        self.assertEqual(len(res), 1)
        self.assertEqual(res[0]["word"], "DOS")
        self.assertEqual(res[0]["sev"], "FAIL")

    def test_sfx_away_from_onsets_ignored(self):
        orig, words, _t = three_words()
        mix = orig.copy()
        i0 = int(0.6 * SR)  # en la pausa entre UNO y DOS
        burst = 0.3 * np.sin(2 * np.pi * 60 *
                             np.arange(int(0.1 * SR)) / SR)
        mix[i0:i0 + len(burst)] += burst.astype(np.float32)
        self.assertEqual(mc.sfx_masking(mix, orig, SR, [0.6],
                                        words), [])

    def test_quiet_sfx_ignored(self):
        orig, words, _t = three_words()
        mix = orig.copy()
        i0 = int(0.7 * SR)
        burst = 0.005 * np.sin(2 * np.pi * 60 *
                               np.arange(int(0.1 * SR)) / SR)
        mix[i0:i0 + len(burst)] += burst.astype(np.float32)
        self.assertEqual(mc.sfx_masking(mix, orig, SR, [0.7],
                                        words), [])


# ---------------- vo_build: prevención ----------------

class TestVoBuild(unittest.TestCase):
    def test_cut_inside_word_abandoned(self):
        words = [{"w": "A", "s": 0.3, "e": 0.8},
                 {"w": "B", "s": 1.2, "e": 1.7}]
        cuts, adj = vb.adjust_cuts_to_word_gaps([(0.5, 0.6)], words)
        self.assertEqual(cuts, [])
        self.assertEqual(len(adj), 1)
        self.assertIsNone(adj[0]["ajustado"])

    def test_cut_invading_margin_trimmed(self):
        words = [{"w": "A", "s": 0.3, "e": 0.8},
                 {"w": "B", "s": 1.2, "e": 1.7}]
        cuts, _adj = vb.adjust_cuts_to_word_gaps([(0.95, 1.20)],
                                                 words)
        self.assertEqual(cuts, [(0.95, 1.17)])

    def test_pause_floor_enforced(self):
        """Pausa de 0,40 s: el corte no puede dejar menos de 0,25 s."""
        words = [{"w": "A", "s": 0.3, "e": 0.8},
                 {"w": "B", "s": 1.2, "e": 1.7}]
        cuts, adj = vb.enforce_pause_floor([(0.85, 1.15)], words)
        self.assertEqual(len(adj), 1)
        self.assertAlmostEqual(cuts[0][1] - cuts[0][0], 0.15,
                               places=2)

    def test_zero_crossing_snap(self):
        t = np.arange(int(0.2 * SR)) / SR
        x = np.sin(2 * np.pi * 120 * t).astype(np.float32)
        idx = int(0.1 * SR) + 37  # punto arbitrario, no cruce
        j = vb.nearest_zero_crossing(x, idx, int(0.002 * SR))
        self.assertLessEqual(abs(j - idx), int(0.002 * SR))
        self.assertLess(abs(x[j]), 0.05)

    def test_edit_preserves_duration(self):
        # Pausa original 0,60 s; corte 0,30 s -> residual 0,30 s,
        # justo en el suelo (max(0,25, 50% de 0,60) = 0,30): el
        # corte se aplica entero. 1,6 - 0,3 = 1,3 s exactos
        # (salvo ±2 ms por el ajuste a cruces por cero).
        x = np.concatenate([voiced(0.5), room(int(0.6 * SR)),
                            voiced(0.5)])
        words = [{"w": "A", "s": 0.05, "e": 0.45},
                 {"w": "B", "s": 1.15, "e": 1.55}]
        out, segs, _rep = vb.edit_line_safe(x, SR, 0.0, 1.6,
                                            [(0.55, 0.85)], words)
        self.assertEqual(len(segs), 2)
        self.assertAlmostEqual(len(out) / SR, 1.3, delta=0.005)


# ---------------- integración: casos reales ----------------

def _load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _sfx_times_from_sh(path):
    """Tiempos de SFX del script de mezcla (mix-v2.3.sh)."""
    times = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            m = re.search(r"--sfx\s+\"[^\"]+@([\d.]+)\"", line)
            if m:
                times.append(float(m.group(1)))
    return times


def _audio_paths(version):
    """Rutas de audio de una versión ('real' = V2.2, 'real23')."""
    d = os.path.join(PROJ, "public", "audio", version)
    return {
        "edited": os.path.join(d, "vo-real.wav"),
        "orig": os.path.join(d, "vo-real-raw.wav"),
        "trans": os.path.join(d, "vo-real-transcripcion-orig.json"),
        "mix": os.path.join(d, "mix-v2.2.wav" if version == "real"
                            else "mix-v2.3.wav"),
    }


def _real_files_present(version, need_mix=False):
    paths = _audio_paths(version)
    ok = all(os.path.exists(paths[k])
             for k in ("edited", "orig", "trans"))
    if need_mix:
        ok = ok and os.path.exists(paths["mix"])
    return ok


def _run_detect(version, use_mix=False):
    """detect_all sobre una versión real (usa fixtures vendorizados)."""
    paths = _audio_paths(version)
    tag = "v2.2" if version == "real" else "v2.3"
    plan = _load_json(os.path.join(FIXTURES,
                                   f"edit-plan-{tag}.json"))
    words_ed = _load_json(
        os.path.join(FIXTURES,
                     f"vo-real-prediccion-{tag}.json"))["palabras"]
    words_orig = mc.load_whisper_file(paths["trans"])
    edited = mc.load_wav_fast(paths["edited"])
    orig = mc.load_wav_fast(paths["orig"])
    mix, sfx = None, None
    if use_mix:
        mix = mc.load_wav_fast(paths["mix"])
        sfx = _sfx_times_from_sh(os.path.join(PROJ,
                                              f"mix-{tag}.sh"))
    return mc.detect_all(edited, orig, SR, plan, words_ed,
                         words_orig, mix=mix, sfx_times=sfx)


def _problems(res, check=None):
    """Hallazgos FAIL/WARN (los PASS confirman un check limpio)."""
    return [f for f in res["findings"]
            if f["sev"] in ("FAIL", "WARN")
            and (check is None or f["check"] == check)]


@unittest.skipUnless(_real_files_present("real"),
                     "faltan los audios V2.2 (salidas de build)")
class TestIntegrationV22(unittest.TestCase):
    def test_six_bad_pauses_flagged(self):
        """El defecto conocido de V2.2: las 6 pausas malas (i3)."""
        res = _run_detect("real")
        i3 = _problems(res, "i3")
        pairs = set()
        for f in i3:
            m = re.search(r"pausa recortada (.+?): original",
                          f["msg"])
            self.assertIsNotNone(m, f)
            pairs.add(m.group(1))
        expected = {"1891, -> MARTÍ", "RECUENTO, -> Y",
                    "HOY, -> EN", "AMÉRICA, -> EL",
                    "CAMBIÓ: -> DIECINUEVE", "LEER. -> PENSAR."}
        self.assertEqual(pairs, expected, i3)

    def test_no_word_dips(self):
        """V2.2 no tiene dips dentro de palabras (i2 limpio)."""
        res = _run_detect("real")
        self.assertEqual(_problems(res, "i2"), [])


@unittest.skipUnless(_real_files_present("real23", need_mix=True),
                     "faltan los audios V2.3 / mezcla (salidas de build)")
class TestIntegrationV23(unittest.TestCase):
    def test_only_real_findings(self):
        """V2.3: (i2), (i3) e (i4) limpios; (i5) marca los 3 SFX
        que entierran ataques; (i1) solo WARN de fundido."""
        res = _run_detect("real23", use_mix=True)
        self.assertEqual(_problems(res, "i2"), [])
        self.assertEqual(_problems(res, "i3"), [])
        self.assertEqual(_problems(res, "i4"), [])
        i5 = _problems(res, "i5")
        self.assertEqual(len(i5), 3)
        words = set()
        for f in i5:
            m = re.search(r"el ataque de '([^']+)'", f["msg"])
            self.assertIsNotNone(m, f)
            words.add(m.group(1))
        self.assertEqual(words, {"PENSAR.", "LEER."})
        self.assertTrue(all(f["sev"] == "FAIL" for f in i5))
        i1 = _problems(res, "i1")
        self.assertTrue(len(i1) >= 1)
        self.assertTrue(all(f["sev"] == "WARN" for f in i1),
                        i1)


@unittest.skipUnless(_real_files_present("real23"),
                     "faltan los audios V2.3 (salidas de build)")
class TestIntegrationBaseline(unittest.TestCase):
    def test_originals_are_clean(self):
        """Los 9 audios VO originales sin editar: 0 hallazgos."""
        paths = _audio_paths("real23")
        plan = _load_json(os.path.join(FIXTURES,
                                       "edit-plan-v2.3.json"))
        # Plan identidad: editado == original en cada segmento.
        base = {"version": "baseline", "lines": []}
        for ln in plan["lines"]:
            segs = [{"orig_start": s["orig_start"],
                     "orig_end": s["orig_end"],
                     "edited_start": s["orig_start"],
                     "edited_end": s["orig_end"]}
                    for s in ln["segs"]]
            base["lines"].append({"linea": ln["linea"],
                                  "factor_uniforme": 1.0,
                                  "segs": segs})
        words = mc.load_whisper_file(paths["trans"])
        raw = mc.load_wav_fast(paths["orig"])
        res = mc.detect_all(raw, raw, SR, base, words, words)
        self.assertEqual(_problems(res), [])


@unittest.skipUnless(_real_files_present("real23"),
                     "faltan los audios V2.3 (salidas de build)")
class TestIntegrationVoBuildL3(unittest.TestCase):
    def test_rebuilt_l3_splices_pass(self):
        """L3 reconstruida con vo_build: los 3 empalmes PASS
        (el patrón viejo daba WARN de 17,6 dB en el primero)."""
        paths = _audio_paths("real23")
        plan = _load_json(os.path.join(FIXTURES,
                                       "edit-plan-v2.3.json"))
        ln = [x for x in plan["lines"] if x["linea"] == 3][0]
        segs_p = ln["segs"]
        head, tail = segs_p[0]["orig_start"], segs_p[-1]["orig_end"]
        cuts = [(segs_p[i]["orig_end"], segs_p[i + 1]["orig_start"])
                for i in range(len(segs_p) - 1)]
        trans = _load_json(paths["trans"])
        words = trans[2]["words"]
        raw = mc.load_wav_fast(paths["orig"])
        out, segs, rep = vb.edit_line_safe(raw, SR, head, tail,
                                           cuts, words)
        self.assertEqual(rep["warnings"], [])
        self.assertEqual(len(segs), 4)
        for _a, _b, c, _d in segs[1:]:
            r = mc.splice_report(out, SR, c)
            self.assertEqual(r["verdict"], "PASS", r)


if __name__ == "__main__":
    unittest.main(verbosity=2)
