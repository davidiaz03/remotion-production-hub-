#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Suite de pruebas de la alineación acústica de captions
(`align-captions.py` + `envelope.py`) y de las correcciones V1.6
de la auditoría (`audit-audio.py`): mapa karaoke, umbrales
relativos de pausas (c) §4, suelo de audibilidad en empalmes
(c) §2 y onsets por envolvente.

Ejecutar desde la raíz del repo:

    ~/workspace/remotion-hub/.venv/bin/python -m unittest \
        scripts.audio.test_align_audit -v

o desde scripts/audio/:

    ~/workspace/remotion-hub/.venv/bin/python -m unittest \
        test_align_audit -v

Dos niveles:
* Sintéticos (siempre corren, sin archivos externos).
* Integración (se saltan si faltan los archivos V5 de
  marti-fidel, que son salidas de build no versionadas): la
  alineación de los 9 desvíos V5 y la auditoría (b)/(g) con el
  mapa karaoke. El proyecto se busca en REPO/projects/marti-fidel
  o en $MARTI_FIDEL_PROJ (útil en worktrees, donde public/ no
  existe porque está en .gitignore).
"""

import importlib.util
import json
import os
import sys
import tempfile
import unittest

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
PROJ = os.environ.get("MARTI_FIDEL_PROJ",
                      os.path.join(REPO, "projects", "marti-fidel"))
KMAP = os.path.join(REPO, "projects", "marti-fidel", "research",
                    "karaoke-map-v5.json")

import envelope as env  # noqa: E402

_spec = importlib.util.spec_from_file_location(
    "audit_audio", os.path.join(HERE, "audit-audio.py"))
audit = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(audit)

_spec_ac = importlib.util.spec_from_file_location(
    "align_captions", os.path.join(HERE, "align-captions.py"))
ac = importlib.util.module_from_spec(_spec_ac)
_spec_ac.loader.exec_module(ac)

SR = 48000
RNG = np.random.default_rng(3)


# ---------------- voz sintética ----------------

def voiced(dur: float, f0: float = 120.0, level: float = 0.13
           ) -> np.ndarray:
    """Tramo sonoro: suma de armónicos con AM lenta (~-18 dBFS)."""
    t = np.arange(int(dur * SR)) / SR
    s = sum(np.sin(2 * np.pi * f0 * k * t + 0.3 * k) / k
            for k in range(1, 6))
    s *= (0.7 + 0.3 * np.sin(2 * np.pi * 4 * t))
    return (s / np.abs(s).max() * level).astype(np.float32)


def room(n: int, level: float = 0.004) -> np.ndarray:
    """Tono de sala: ruido COLOREADO a ~-50 dBFS (paso bajo)."""
    w = RNG.normal(0, 1.0, n)
    y = np.empty(n)
    acc = 0.0
    for i in range(n):
        acc += 0.08 * (w[i] - acc)
        y[i] = acc
    y /= (np.abs(y).max() + 1e-9)
    return (y * level).astype(np.float32)


def three_words():
    """Tres palabras de 0,4 s con pausas de 0,2 s."""
    a = np.concatenate([room(int(0.1 * SR)), voiced(0.4),
                        room(int(0.2 * SR)), voiced(0.4),
                        room(int(0.2 * SR)), voiced(0.4),
                        room(int(0.1 * SR))])
    words = [{"w": "UNO", "s": 0.1, "e": 0.5},
             {"w": "DOS", "s": 0.7, "e": 1.1},
             {"w": "TRES", "s": 1.3, "e": 1.7}]
    return a, words


# ---------------- onsets por envolvente ----------------

class TestEnvelopeOnset(unittest.TestCase):
    def test_onsets_found(self):
        """Onsets de las 3 palabras a ±20 ms del inicio real."""
        a, words = three_words()
        for w in words:
            on = env.envelope_onset(a, SR, w["s"] - 0.05, w["s"] + 0.6)
            self.assertIsNotNone(on, w)
            self.assertAlmostEqual(on, w["s"], delta=0.02)

    def test_single_blip_rejected(self):
        """Un blip aislado de 10 ms a -20 dBFS en la pausa no es onset."""
        a, _w = three_words()
        i0 = int(0.6 * SR)
        a = a.copy()
        a[i0:i0 + int(0.01 * SR)] = 0.1  # blip de 10 ms
        on = env.envelope_onset(a, SR, 0.65, 1.3)
        self.assertAlmostEqual(on, 0.7, delta=0.02)

    def test_quiet_word_found(self):
        """Palabra quieta (RMS ~-48 dBFS, como «EL» L6 de V5) tras silencio."""
        a = np.concatenate([room(int(0.5 * SR)),
                            voiced(0.4, level=0.009),
                            room(int(0.5 * SR))])
        on = env.envelope_onset(a, SR, 0.45, 1.1)
        self.assertIsNotNone(on)
        self.assertAlmostEqual(on, 0.5, delta=0.03)

    def test_silence_has_no_onset(self):
        a = room(int(1.5 * SR))
        self.assertIsNone(env.envelope_onset(a, SR, 0.1, 1.4))

    def test_rise_onset_finds_loudest_not_first(self):
        """rise_onset devuelve el ataque MÁS FUERTE, no el primero:
        palabra quieta a 0,5 s y palabra fuerte a 0,9 s — el rise
        apunta a la fuerte. Por eso NO se usa para primeras
        palabras tras silencio (caso «EL» -> «GIGANTE» de V5)."""
        a = np.concatenate([room(int(0.5 * SR)),
                            voiced(0.3, level=0.009),
                            room(int(0.1 * SR)),
                            voiced(0.4, level=0.13),
                            room(int(0.5 * SR))])
        on = env.rise_onset(a, SR, 0.45, 1.35)
        self.assertIsNotNone(on)
        self.assertAlmostEqual(on, 0.9, delta=0.05)

    def test_line_peak_db(self):
        a, _w = three_words()
        peak = env.line_peak_db(a, SR, 0.0, 1.8)
        # Voz a -18 dBFS aprox (p95 de ventanas de 20 ms).
        self.assertLess(peak, -10.0)
        self.assertGreater(peak, -25.0)
        # +12 dB de ganancia -> pico 12 dB mayor.
        peak2 = env.line_peak_db(a * 10 ** (12 / 20), SR, 0.0, 1.8)
        self.assertAlmostEqual(peak2 - peak, 12.0, delta=0.5)


# ---------------- align-captions ----------------

class TestAlignCaptions(unittest.TestCase):
    def _caps(self, starts):
        return [{"text": w, "startMs": int(s * 1000),
                 "endMs": int((s + 0.4) * 1000),
                 "timestampMs": int(s * 1000)}
                for w, s in starts]

    def _long_pause_voice(self):
        """Tres palabras de 0,4 s con pausas de 0,6 s: un caption
        0,3 s adelantado sigue teniendo 0,15 s de silencio previo
        (el criterio de 'tras silencio' de align-captions)."""
        return np.concatenate([room(int(0.1 * SR)), voiced(0.4),
                               room(int(0.6 * SR)), voiced(0.4),
                               room(int(0.6 * SR)), voiced(0.4),
                               room(int(0.1 * SR))])
        # Onsets reales: UNO 0,1; DOS 1,1; TRES 2,1.

    def test_realigns_post_silence_words(self):
        """Captions 0,3 s adelantados tras silencio -> onsets reales;
        palabras en medio de habla continua NO se tocan."""
        a = self._long_pause_voice()
        caps = self._caps([("UNO", 0.1), ("DOS", 0.8), ("TRES", 1.8)])
        flat = ac.flatten_words(caps, "json")
        rep = ac.align(flat, a, SR)
        self.assertEqual(rep["n_corrected"], 2)
        by_word = {w["word"]: w for w in rep["words"]}
        self.assertAlmostEqual(by_word["DOS"]["s_new"], 1.1, delta=0.02)
        self.assertAlmostEqual(by_word["TRES"]["s_new"], 2.1,
                               delta=0.02)
        self.assertFalse(by_word["UNO"]["corrected"])

    def test_monotonicity_clamp(self):
        """La corrección no cruza el inicio de la palabra anterior."""
        a, _w = three_words()
        # DOS con inicio adelantado a 0,45 s (antes del fin de UNO,
        # 0,5 s): el onset real es 0,7 s, sin conflicto; pero si el
        # caption de UNO se corrigiera tarde, DOS se acotaría.
        caps = self._caps([("UNO", 0.1), ("DOS", 0.45)])
        flat = ac.flatten_words(caps, "json")
        rep = ac.align(flat, a, SR)
        starts = [w["s_new"] for w in rep["words"]]
        self.assertLess(starts[0], starts[1])

    def test_ts_roundtrip(self):
        """TS: se mueve el `s` de la palabra y el `start` del chunk
        si es la primera; el resto queda byte-idéntico."""
        a = self._long_pause_voice()
        ts = ("// cabecera\n"
              "export type CapWord = {t: string; s: number; e: number};\n"
              "export const CAPTIONS = [{\"id\": 1, \"start\": 0.1, "
              "\"frames\": 10, \"chunks\": [{\"start\": 0.8, "
              "\"end\": 1.5, \"words\": [{\"t\": \"DOS\", \"s\": 0.8, "
              "\"e\": 1.5, \"kw\": false}]}]}];\n")
        with tempfile.TemporaryDirectory() as td:
            p = os.path.join(td, "c.ts")
            open(p, "w").write(ts)
            fmt, data, raw = ac.load_captions(p)
            self.assertEqual(fmt, "ts")
            flat = ac.flatten_words(data, fmt)
            rep = ac.align(flat, a, SR)
            self.assertEqual(rep["n_corrected"], 1)
            out = os.path.join(td, "o.ts")
            ac.write_captions(out, fmt, data, raw)
            new = open(out).read()
            _f, data2, _r = ac.load_captions(out)
        self.assertTrue(new.startswith("// cabecera\n"
                                      "export type CapWord"))
        ch = data2[0]["chunks"][0]
        self.assertAlmostEqual(ch["words"][0]["s"], 1.1, delta=0.02)
        self.assertEqual(ch["start"], ch["words"][0]["s"])
        self.assertEqual(ch["end"], 1.5)
        self.assertEqual(data2[0]["start"], 0.1)  # slot sin tocar


# ---------------- mapa karaoke ----------------

class TestKaraokeMap(unittest.TestCase):
    def test_load_v5_map(self):
        kmap = audit.load_karaoke_map(KMAP)
        self.assertEqual(kmap["card_lines"], {3, 5, 7})
        self.assertEqual(kmap["handwritten_lines"], {9})
        self.assertEqual(kmap["blank_windows"],
                         [(15.71, 18.29), (47.52, 49.22)])

    def test_caption_line_no(self):
        lines = [{"start": 0.25, "end": 5.17},
                 {"start": 5.57, "end": 8.57}]
        self.assertEqual(audit.caption_line_no(0.33, lines), 1)
        self.assertEqual(audit.caption_line_no(5.65, lines), 2)
        self.assertIsNone(audit.caption_line_no(20.0, lines))

    def test_is_karaoke_caption(self):
        kmap = audit.load_karaoke_map(KMAP)
        self.assertFalse(audit.is_karaoke_caption(9.05, 3, kmap))
        self.assertFalse(audit.is_karaoke_caption(53.09, 9, kmap))
        self.assertFalse(audit.is_karaoke_caption(15.71, 4, kmap))
        self.assertTrue(audit.is_karaoke_caption(12.81, 4, kmap))
        # El fin de la ventana es exclusivo: a 49,22 el karaoke vuelve.
        self.assertTrue(audit.is_karaoke_caption(49.22, 8, kmap))
        self.assertFalse(audit.is_karaoke_caption(47.52, 8, kmap))
        self.assertTrue(audit.is_karaoke_caption(9.05, 3, None))

    def _gap_case(self):
        """Dos captions con hueco de 0,5 s CON VOZ encima.
        Sin mapa es FAIL; con mapa y línea en tarjeta es INFO."""
        a = np.concatenate([room(int(0.1 * SR)), voiced(1.5),
                            room(int(0.1 * SR))])
        caps = [{"text": "A", "startMs": 100, "endMs": 500},
                {"text": "B", "startMs": 1000, "endMs": 1400}]
        return a, caps, []

    def test_check_b_card_gap_is_info(self):
        a, caps, sil = self._gap_case()
        kmap = audit.load_karaoke_map(KMAP)
        # Las líneas 1-2 lejos; la 3 (tarjeta) cubre los captions.
        lines3 = [{"start": 5.0, "end": 6.0},
                  {"start": 6.0, "end": 7.0},
                  {"start": 0.1, "end": 1.6}]
        rep = audit.Report("t")
        audit.check_b_caption_timing(rep, caps, a, SR, sil,
                                     vo_lines=lines3, kmap=kmap)
        fails = [f for f in rep.findings if f["sev"] == "FAIL"]
        self.assertEqual(fails, [], rep.findings)
        infos = [f for f in rep.findings
                 if "sin karaoke" in f["msg"]]
        self.assertEqual(len(infos), 1)

    def test_check_b_karaoke_gap_still_fails(self):
        a, caps, sil = self._gap_case()
        lines = [{"start": 0.1, "end": 1.6}]
        rep = audit.Report("t")
        audit.check_b_caption_timing(rep, caps, a, SR, sil,
                                     vo_lines=lines, kmap=None)
        fails = [f for f in rep.findings if f["sev"] == "FAIL"]
        self.assertEqual(len(fails), 1)
        self.assertIn("CON VOZ ENCIMA", fails[0]["msg"])


# ---------------- (c) §4: pausas relativas ----------------

def _pause_case(gap_ed: float, gain_db: float = 12.0,
                burst_db: float = None):
    """Original: 2 palabras con pausa de 0,40 s; editada: misma
    pausa recortada a `gap_ed` y con `gain_db` más de ganancia.

    Devuelve (edited, orig, orig_words, pred_words, plan). Si
    `burst_db` se da, el ORIGINAL lleva un respiro fuerte
    (inharmónico, `burst_db` dBFS) en medio de la pausa.
    """
    orig = np.concatenate([room(int(0.3 * SR)), voiced(0.4),
                           room(int(0.4 * SR)), voiced(0.4),
                           room(int(0.3 * SR))])
    if burst_db is not None:
        i0 = int(0.9 * SR)
        n = int(0.04 * SR)
        orig = orig.copy()
        orig[i0:i0 + n] = (RNG.normal(0, 1, n)
                           * 10 ** (burst_db / 20)).astype(np.float32)
    ed = np.concatenate([room(int(0.3 * SR)), voiced(0.4),
                         room(int(gap_ed * SR)), voiced(0.4),
                         room(int(0.3 * SR))])
    ed = (ed * 10 ** (gain_db / 20)).astype(np.float32)
    w_o = [{"w": "UNO", "s": 0.3, "e": 0.7},
           {"w": "DOS", "s": 1.1, "e": 1.5}]
    w_e = [{"w": "UNO", "s": 0.3, "e": 0.7},
           {"w": "DOS", "s": 0.7 + gap_ed, "e": 1.1 + gap_ed}]
    plan = {"pad": 0.03, "lines": [{
        "linea": 1, "factor_uniforme": 1.0,
        "segs": [{"orig_start": 0.0, "orig_end": 1.8,
                  "edited_start": 0.0,
                  "edited_end": 1.4 + gap_ed}]}]}
    return ed, orig, w_o, w_e, plan


class TestRelativePauses(unittest.TestCase):
    def _run_c(self, gap_ed, **kw):
        ed, orig, w_o, w_e, plan = _pause_case(gap_ed, **kw)
        rep = audit.Report("t")
        audit.check_c_vo_integrity(rep, orig, ed, SR, w_o, w_e, plan)
        return rep

    def test_gain_invariant_legal_trim_passes(self):
        """Pausa 0,40 -> 0,30 s con +12 dB de ganancia en la editada:
        legal (>=0,25 s, pérdida 25%) y la ganancia no debe sesgar
        la medida: 0 FAIL de pausas."""
        rep = self._run_c(0.30)
        self.assertEqual(rep.metrics["c_pause_fails"], 0, rep.findings)

    def test_illegal_trim_still_fails(self):
        """Pausa 0,40 -> 0,15 s con +12 dB: FAIL (regla permanente)."""
        rep = self._run_c(0.15)
        self.assertEqual(rep.metrics["c_pause_fails"], 1, rep.findings)

    def test_loud_breath_does_not_bridge_pause(self):
        """Regresión L7 QUE->HABER (V5): un respiro fuerte
        (-29 dBFS, inarmónico) en medio de la pausa del ORIGINAL
        no debe contarse como voz y colapsar la pausa medida: con
        la pausa editada recortada a 0,15 s (ilegal), el check
        debe seguir marcando FAIL (si el respiro puentease la
        pausa original, o_gap sería ~0 y el par no se evaluaría).
        El respiro está por encima de pico-12 (-30 dB) pero por
        debajo del suelo absoluto -28 dB: sin el suelo, la rama
        loud lo rescataría."""
        rep = self._run_c(0.15, burst_db=-29.0)
        self.assertEqual(rep.metrics["c_pause_fails"], 1, rep.findings)


# ---------------- (c) §2: suelo de audibilidad ----------------

class TestSpliceFloor(unittest.TestCase):
    def _run_c_with_step(self, step: float):
        """VO con un paso de `step` en el empalme entre dos
        segmentos, en silencio (pausa de 0,4 s)."""
        seg1 = np.concatenate([room(int(0.3 * SR)), voiced(0.4),
                               room(int(0.2 * SR))])
        seg2 = np.concatenate([room(int(0.2 * SR)), voiced(0.4),
                               room(int(0.3 * SR))])
        ed = np.concatenate([seg1, seg2])
        # Paso en la frontera (muestra 0,9 s): desplazar seg2.
        i = len(seg1)
        ed = ed.copy()
        ed[i:] += step
        orig = ed.copy()
        w = [{"w": "UNO", "s": 0.3, "e": 0.7},
             {"w": "DOS", "s": 1.1, "e": 1.5}]
        plan = {"pad": 0.03, "lines": [{
            "linea": 1, "factor_uniforme": 1.0,
            "segs": [{"orig_start": 0.0, "orig_end": 0.9,
                      "edited_start": 0.0, "edited_end": 0.9},
                     {"orig_start": 0.9, "orig_end": 1.8,
                      "edited_start": 0.9, "edited_end": 1.8}]}]}
        rep = audit.Report("t")
        audit.check_c_vo_integrity(rep, orig, ed, SR, w, w, plan)
        return rep

    def test_tiny_step_in_silence_is_info(self):
        """Paso 0,0098 (caso V5 @ 5,17 s) en silencio: INFO, no FAIL."""
        rep = self._run_c_with_step(0.0098)
        fails = [f for f in rep.findings
                 if f["sev"] == "FAIL" and "empalme" in f["msg"]]
        self.assertEqual(fails, [], rep.findings)

    def test_loud_click_still_fails(self):
        """Paso 0,1 en el empalme: FAIL (en los dos lados de la
        frontera: fin del segmento 1 e inicio del segmento 2)."""
        rep = self._run_c_with_step(0.1)
        fails = [f for f in rep.findings
                 if f["sev"] == "FAIL" and "empalme" in f["msg"]]
        self.assertEqual(len(fails), 2, rep.findings)
        self.assertTrue(all(f["t"] == 0.9 for f in fails))


# ---------------- integración: V5 real ----------------

def _v5_paths():
    d = os.path.join(PROJ, "public", "audio", "v41")
    return {
        "voice": os.path.join(d, "vo-real-v41.wav"),
        "captions": os.path.join(d, "captions-v41.json"),
        "vo_lines": os.path.join(d, "vo-lines-v41.json"),
        "master": os.path.join(PROJ, "out",
                               "marti-fidel-v5_MASTER.mp4"),
    }


def _v5_present():
    return (all(os.path.exists(p) for p in _v5_paths().values())
            and os.path.exists(KMAP))


@unittest.skipUnless(_v5_present(),
                     "faltan los archivos V5 (salidas de build)")
class TestIntegrationV5Align(unittest.TestCase):
    def test_nine_deviations_corrected(self):
        """Los 9 desvíos del hallazgo V5 quedan < 0,15 s tras
        alinear (los 4 reales del karaoke + los 5 de tarjeta/
        manuscrita; todos se corrigen en el archivo de captions)."""
        p = _v5_paths()
        voice = ac.load_audio_fast(p["voice"])
        caps = json.load(open(p["captions"]))
        flat = ac.flatten_words(caps, "json")
        rep = ac.align(flat, voice, SR)
        by_word = {}
        for w in rep["words"]:
            if w["dev_before"] is not None:
                by_word.setdefault(w["word"], []).append(w)
        nine = {"MARTÍ": -0.25, "ES": -0.42, "UN": -0.56,
                "WASHINGTON": -0.23, "YA": -0.20, "EL": -0.22,
                "EN": -0.29, "CUANDO": -0.49, "¡QUE": -0.48}
        for word, dev in nine.items():
            got = [w for w in by_word.get(word, [])
                   if abs(w["dev_before"] - dev) < 0.02]
            self.assertEqual(len(got), 1, (word, by_word.get(word)))
            self.assertLess(abs(got[0]["dev_after"]), 0.15)
        n_bad_after = sum(1 for w in rep["words"]
                          if w["dev_after"] is not None
                          and abs(w["dev_after"]) > 0.15)
        self.assertEqual(n_bad_after, 0)


@unittest.skipUnless(_v5_present(),
                     "faltan los archivos V5 (salidas de build)")
class TestIntegrationV5Audit(unittest.TestCase):
    def _load(self):
        p = _v5_paths()
        caps = json.load(open(p["captions"]))
        vo_lines = json.load(open(p["vo_lines"]))["lines"]
        kmap = audit.load_karaoke_map(KMAP)
        voice = audit.load_wav_fast(p["voice"])
        return p, caps, vo_lines, kmap, voice

    def test_check_b_no_fail_with_map(self):
        """Con el mapa, el hueco falso @36,63 s (L7, tarjeta) es
        INFO: (b) sin FAIL."""
        _p, caps, vo_lines, kmap, voice = self._load()
        sil = audit.find_silences(voice, SR)
        rep = audit.Report("v5")
        audit.check_b_caption_timing(rep, caps, voice, SR, sil,
                                     vo_lines=vo_lines, kmap=kmap)
        fails = [f for f in rep.findings if f["sev"] == "FAIL"]
        self.assertEqual(fails, [], rep.findings)

    def test_check_b_fail_without_map(self):
        """Sin mapa, el comportamiento histórico se mantiene: (b)
        marca el hueco @36,63 s como FAIL (regresión de la
        semántica vieja)."""
        _p, caps, _vl, _k, voice = self._load()
        sil = audit.find_silences(voice, SR)
        rep = audit.Report("v5")
        audit.check_b_caption_timing(rep, caps, voice, SR, sil)
        fails = [f for f in rep.findings if f["sev"] == "FAIL"]
        self.assertEqual(len(fails), 1)
        self.assertAlmostEqual(fails[0]["t"], 36.63, delta=0.05)

    def test_check_g_only_four_real_advances(self):
        """Con el mapa, (g) acústico marca SOLO los 4 adelantos
        reales del karaoke (MARTÍ, UN, EL, ¡QUE); los 5 de
        tarjeta/manuscrita/ventana desaparecen."""
        p, caps, vo_lines, kmap, voice = self._load()
        pred = [{"w": c["text"].strip(), "s": c["startMs"] / 1000,
                 "e": c["endMs"] / 1000} for c in caps]
        rep = audit.Report("v5")
        audit.check_g_master(rep, p["master"], caps, [], pred, voice,
                             SR, 2077, False, audit.WHISPER_MODEL,
                             mix=None, vo_lines=vo_lines, kmap=kmap)
        fails = [f for f in rep.findings
                 if f["sev"] == "FAIL" and "onset acústico" in f["msg"]]
        words = sorted(set(f["msg"].split("de ")[1].split(" @")[0]
                           .strip("'") for f in fails))
        self.assertEqual(words, ["EL", "MARTÍ", "UN", "¡QUE"], fails)
        self.assertEqual(len(fails), 4)

    def test_check_g_clean_with_realigned_captions(self):
        """Con los captions re-temporizados por align-captions.py,
        (g) acústico da 0 FAIL: la corrección del punto 1 elimina
        los 4 adelantos reales."""
        p, caps, vo_lines, kmap, voice = self._load()
        flat = ac.flatten_words(caps, "json")
        ac.align(flat, voice, SR)  # corrige `caps` in situ
        pred = [{"w": c["text"].strip(), "s": c["startMs"] / 1000,
                 "e": c["endMs"] / 1000} for c in caps]
        rep = audit.Report("v5.1")
        audit.check_g_master(rep, p["master"], caps, [], pred, voice,
                             SR, 2077, False, audit.WHISPER_MODEL,
                             mix=None, vo_lines=vo_lines, kmap=kmap)
        fails = [f for f in rep.findings
                 if f["sev"] == "FAIL" and "onset acústico" in f["msg"]]
        self.assertEqual(fails, [], rep.findings)


if __name__ == "__main__":
    unittest.main(verbosity=2)
