#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Suite de pruebas de `enhance-voice.py` (mejora de voz de celular).

Ejecutar desde la raíz del repo:

    ~/workspace/remotion-hub/.venv/bin/python -m unittest \\
        scripts.audio.test_enhance_voice -v

o desde scripts/audio/:

    ~/workspace/remotion-hub/.venv/bin/python -m unittest \\
        test_enhance_voice -v

Dos niveles (misma convención que test_microcut.py):
* Sintéticos (siempre corren, sin archivos externos): voz
  sintética con pausas conocidas; degradación inyectada (ruido
  rosa + eco) que el preset `phone` debe recuperar.
* Integración (se saltan si faltan los audios, que son salidas de
  build no versionadas): líneas reales de Adriana del proyecto
  negacion-embargo (L1 mono, L3, L4 estéreo) como referencia de
  audio limpio, y L1 degradada a propósito.
"""

import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import unittest
import zlib

import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
LINES = os.path.join(REPO, "projects", "negacion-embargo",
                     "public", "audio", "real", "lines")

# El script usa guion (convención del repo: scan-bed.py,
# gen-vo-kokoro.py...) y no se puede importar con `import`;
# se carga por ruta.
_spec = importlib.util.spec_from_file_location(
    "enhance_voice", os.path.join(HERE, "enhance-voice.py"))
ev = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ev)

SR = 48000
PY = os.path.expanduser("~/workspace/remotion-hub/.venv/bin/python")
RNG = np.random.default_rng(11)


# ---------------- voz sintética ----------------

def voiced(dur, f0=130.0, level=0.16):
    """Tramo sonoro: suma de armónicos con AM lenta, ~-16 dBFS."""
    t = np.arange(int(dur * SR)) / SR
    s = sum(np.sin(2 * np.pi * f0 * k * t + 0.3 * k) / k
            for k in range(1, 6))
    s *= (0.7 + 0.3 * np.sin(2 * np.pi * 4 * t))
    return (s / np.abs(s).max() * level).astype(np.float32)


def room(n, level_dbfs=-62.0):
    """Tono de sala: ruido rosa suave."""
    w = RNG.standard_normal(n)
    pink = np.cumsum(w)
    pink -= np.linspace(pink[0], pink[-1], n)
    pink /= np.abs(pink).max()
    return (pink * 10 ** (level_dbfs / 20)).astype(np.float32)


def three_words(gap=0.45):
    """Tres «palabras» de 1,2 s con pausas de `gap` s y tono de sala.

    Las pausas son el caso que la regla del 18-nov-2026 protege:
    deben sobrevivir intactas al procesado.
    """
    w = voiced(1.2)
    g = room(int(gap * SR))
    lead = room(int(0.3 * SR))
    tail = room(int(0.3 * SR))
    return np.concatenate([lead, w, g, w, g, w, tail])


def degrade(x, noise_dbfs=-28.0, echo=((60, 0.25), (120, 0.12))):
    """Degrada a propósito: ruido rosa de habitación + eco.

    Simula grabar con el celular en una habitación ruidosa con
    reverberación (SNR de entrada ~10-15 dB).
    """
    x = np.asarray(x, dtype=np.float64)
    y = x.copy()
    for delay_ms, g in echo:
        d = int(delay_ms * SR / 1000)
        y[d:] += g * x[:-d]
    n = len(x)
    w = RNG.standard_normal(n)
    pink = np.cumsum(w)
    pink -= np.linspace(pink[0], pink[-1], n)
    pink /= np.abs(pink).max()
    y = y + pink * 10 ** (noise_dbfs / 20)
    y = y / np.abs(y).max() * 0.5
    return y.astype(np.float32)


def hf_noise_db(samples, sr):
    """Energía media 6-12 kHz en tramos de voz (dBFS).

    Mide el ruido DURANTE la voz: el expansor solo limpia las
    pausas, así que la SNR estimada (voz vs suelo de pausa) no
    distingue afftdn de off; esta métrica sí (afftdn baja el ruido
    rosa dentro de la palabra ~14 dB, off apenas lo toca).
    """
    segs = ev.speech_segments(samples, sr)
    n = int(0.04 * sr)
    powers = []
    for a, b in segs:
        i0, i1 = int(a * sr), int(b * sr)
        for i in range(i0, max(i0, i1 - n), n):
            f = samples[i:i + n] * np.hanning(n)
            spec = np.fft.rfft(f)
            freqs = np.fft.rfftfreq(n, 1 / sr)
            m = (freqs >= 6000) & (freqs <= 12000)
            powers.append(np.mean(np.abs(spec[m]) ** 2))
    return 10 * np.log10(np.mean(powers) + 1e-12)


def write(tmp, name, samples):
    path = os.path.join(tmp, name)
    sf.write(path, samples, SR)
    return path


class EnhanceCase(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        # Cada test con su propia realización de ruido, derivada de
        # su id (crc32, determinista): independiente del orden de
        # ejecución. Sin esto, añadir un test que consuma RNG cambia
        # el ruido de todos los siguientes y rompe tests sensibles
        # como test_real_degraded_recovers (23-nov-2026: los tests
        # de TestPro desplazaron el stream compartido y ese test
        # falló sin que nadie tocara el preset phone).
        global RNG
        RNG = np.random.default_rng(zlib.crc32(self.id().encode()))

    def enhance(self, in_path, preset="phone", **kw):
        out = os.path.join(self.tmp.name, "out.wav")
        report = ev.enhance(in_path, out, preset=preset, **kw)
        return out, report


# ---------------- sintéticos ----------------

class TestTargets(EnhanceCase):
    def test_phone_hits_loudness_target(self):
        src = write(self.tmp.name, "in.wav", three_words())
        _, r = self.enhance(src, preset="phone")
        self.assertEqual(r["verdict"], "PASS", r["verdict_reasons"])
        self.assertAlmostEqual(r["output"]["lufs"], -18.0, delta=1.0)
        self.assertLessEqual(r["output"]["true_peak_dbtp"], -1.7)
        self.assertEqual(r["loudnorm"]["mode"], "two-pass (linear)")

    def test_clean_hits_loudness_target(self):
        src = write(self.tmp.name, "in.wav", three_words())
        _, r = self.enhance(src, preset="clean")
        self.assertEqual(r["verdict"], "PASS", r["verdict_reasons"])
        self.assertAlmostEqual(r["output"]["lufs"], -18.0, delta=1.0)

    def test_duration_preserved_both_presets(self):
        src = write(self.tmp.name, "in.wav", three_words())
        for preset in ("phone", "clean"):
            _, r = self.enhance(src, preset=preset)
            self.assertAlmostEqual(r["output"]["duration_s"],
                                  r["input"]["duration_s"], delta=0.01)

    def test_output_format_mono_48k(self):
        src = write(self.tmp.name, "in.wav", three_words())
        out, _ = self.enhance(src, preset="phone")
        sr, ch, _ = ev.probe(out)
        self.assertEqual((sr, ch), (48000, 1))
        info = sf.info(out)
        self.assertEqual(info.subtype, "PCM_16")


class TestPauses(EnhanceCase):
    def test_pauses_preserved_phone(self):
        src = write(self.tmp.name, "in.wav", three_words(gap=0.45))
        _, r = self.enhance(src, preset="phone")
        self.assertTrue(r["pauses"]["ok"], r["pauses"]["findings"])
        self.assertEqual(r["verdict"], "PASS", r["verdict_reasons"])

    def test_pauses_preserved_clean(self):
        src = write(self.tmp.name, "in.wav", three_words(gap=0.45))
        _, r = self.enhance(src, preset="clean")
        self.assertTrue(r["pauses"]["ok"], r["pauses"]["findings"])

    def test_short_pause_boundary(self):
        # Pausa de 0,30 s (cerca del mínimo de 0,25 s): debe pasar.
        src = write(self.tmp.name, "in.wav", three_words(gap=0.30))
        _, r = self.enhance(src, preset="phone")
        self.assertTrue(r["pauses"]["ok"], r["pauses"]["findings"])

    def test_vad_tolerates_20ms_shift(self):
        # Misma tolerancia de medida que el check por envolventes:
        # 0,26 → 0,24 s es desplazamiento de borde, no recorte.
        orig = three_words(gap=0.26)
        out = three_words(gap=0.24)
        ok, findings, reliable, stats = ev.check_pauses(
            orig, out, SR)
        self.assertTrue(reliable)
        self.assertTrue(ok, findings)


class TestQuality(EnhanceCase):
    def test_clean_keeps_clean_audio(self):
        # Audio ya limpio + preset clean: la SNR estimada no debe
        # caer más de 3 dB ni bajar de 35 dB absolutos.
        src = write(self.tmp.name, "in.wav", three_words())
        _, r = self.enhance(src, preset="clean")
        self.assertGreaterEqual(r["output"]["snr_db"], 35.0)
        self.assertGreaterEqual(
            r["output"]["snr_db"] - r["input"]["snr_db"], -3.0)

    def test_phone_does_not_wreck_clean_audio(self):
        # El preset phone sobre audio limpio puede mover la SNR un
        # poco (el compresor levanta el suelo), pero no más de 2 dB.
        src = write(self.tmp.name, "in.wav", three_words())
        _, r = self.enhance(src, preset="phone")
        self.assertGreaterEqual(
            r["output"]["snr_db"] - r["input"]["snr_db"], -2.0)

    def test_phone_recovers_degraded_audio(self):
        clean = three_words()
        src = write(self.tmp.name, "deg.wav", degrade(clean))
        out, r = self.enhance(src, preset="phone")
        self.assertEqual(r["verdict"], "PASS", r["verdict_reasons"])
        gain = r["output"]["snr_db"] - r["input"]["snr_db"]
        self.assertGreaterEqual(gain, 3.0,
                                f"mejora de SNR insuficiente: {gain:+.1f} dB")
        # El check de pausas del informe no es fiable con entrada
        # ruidosa (se marca reliable=False); la verificación real
        # es contra el original limpio conocido.
        self.assertFalse(r["pauses"]["reliable"])
        rec, sr = sf.read(out, always_2d=False)
        ok, findings, reliable, stats = ev.check_pauses(clean, rec, sr)
        self.assertTrue(reliable)
        self.assertTrue(ok, findings)

    def test_denoiser_afftdn_cleans_in_speech_noise(self):
        # afftdn limpia el ruido DURANTE la voz; con denoiser=off
        # el ruido dentro de la palabra sobrevive (el expansor solo
        # limpia pausas). Diferencia medida: ~12 dB; umbral 5 dB.
        src = write(self.tmp.name, "deg.wav", degrade(three_words()))
        out_on = os.path.join(self.tmp.name, "on.wav")
        out_off = os.path.join(self.tmp.name, "off.wav")
        ev.enhance(src, out_on, preset="phone", denoiser="afftdn")
        ev.enhance(src, out_off, preset="phone", denoiser="off")
        s_on, sr = sf.read(out_on, always_2d=False)
        s_off, _ = sf.read(out_off, always_2d=False)
        gap = hf_noise_db(s_off, sr) - hf_noise_db(s_on, sr)
        self.assertGreaterEqual(
            gap, 5.0, f"afftdn no limpia el ruido en voz: {gap:.1f} dB")


class TestPro(EnhanceCase):
    """Preset `pro` (DeepFilterNet + cadena pulida, 23-nov-2026).

    Los tests de audio se saltan si falta el binario (la VM de CI
    puede no tenerlo); el test de cadena y el de binario ausente
    corren siempre.
    """

    def test_pro_chain_has_no_expander(self):
        chain = ev.build_chain("pro")
        self.assertFalse(any("compand" in f for f in chain),
                         "el preset pro no lleva expansor (DF ya "
                         "limpia las pausas; el compand recortó "
                         "pausas en la VO de Messi FB)")
        comp = [f for f in chain if f.startswith("acompressor")]
        self.assertEqual(len(comp), 1)
        self.assertIn("ratio=2", comp[0])
        self.assertIn("makeup=2", comp[0])

    def test_pro_missing_binary_raises(self):
        src = write(self.tmp.name, "in.wav", three_words())
        out = os.path.join(self.tmp.name, "out.wav")
        with self.assertRaises((ValueError, RuntimeError)):
            ev.enhance(src, out, preset="pro",
                       deepfilter_bin="/no/existe/deep-filter")

    @unittest.skipUnless(ev.find_deepfilter() is not None,
                         "falta el binario deep-filter")
    def test_pro_runs_on_synthetic(self):
        # Humo de la ruta DF sobre señal sintética: solo verifica
        # que la ruta corre de punta a punta, que el informe
        # registra DeepFilterNet y que la duración se preserva
        # (el relleno de cola). NO verifica sonoridad ni pausas:
        # la voz sintética (armónicos perfectamente estacionarios)
        # NO es voz real y DF la trata como ruido estacionario y
        # la atenúa (medido 23-nov-2026: la salida se apaga tras
        # ~1 s). La calidad del preset pro se verifica sobre
        # voz REAL en TestProReal.
        src = write(self.tmp.name, "in.wav", three_words())
        _, r = self.enhance(src, preset="pro")
        self.assertIsNotNone(r.get("deepfilter"))
        self.assertIn("deep_filter", r["deepfilter"]["version"])
        self.assertAlmostEqual(r["output"]["duration_s"],
                              r["input"]["duration_s"], delta=0.01)


class TestEnvelopeCheck(EnhanceCase):
    """check_pauses_envelope: verificación de pausas del preset pro."""

    def test_envelope_finds_pauses(self):
        x = three_words(gap=0.45)
        ok, findings, reliable, stats = ev.check_pauses_envelope(
            x, x, SR)
        self.assertTrue(reliable)
        self.assertTrue(ok, findings)
        self.assertEqual(stats["verified_gaps"], 2)

    def test_envelope_detects_cut_pause(self):
        # Rellenar la segunda pausa con voz: el check debe fallar
        # con exactamente 1 hallazgo.
        w = voiced(1.2)
        g = room(int(0.45 * SR))
        lead = room(int(0.3 * SR))
        tail = room(int(0.3 * SR))
        orig = np.concatenate([lead, w, g, w, g, w, tail])
        cut = np.concatenate([lead, w, g, w, voiced(0.45), w, tail])
        ok, findings, reliable, stats = ev.check_pauses_envelope(
            orig, cut, SR)
        self.assertTrue(reliable)
        self.assertFalse(ok)
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0]["out_s"], 0.0)

    def test_envelope_ignores_short_gaps(self):
        # Pausas de 0,20 s (< 0,25): no son pausas naturales
        # verificables; fiable=False y no se falla.
        x = three_words(gap=0.20)
        ok, findings, reliable, stats = ev.check_pauses_envelope(
            x, x, SR)
        self.assertFalse(reliable)
        self.assertTrue(ok, findings)
        self.assertEqual(stats["verified_gaps"], 0)

    def test_envelope_tolerates_20ms_shift(self):
        # Una pausa de 0,26 s medida como 0,24 s es desplazamiento
        # de borde por el cambio de perfil energético, no un
        # recorte (caso real: VO de Messi FB, 23-nov-2026). La
        # tolerancia de medida (0,02 s) lo acepta.
        orig = three_words(gap=0.26)
        out = three_words(gap=0.24)
        ok, findings, reliable, stats = ev.check_pauses_envelope(
            orig, out, SR)
        self.assertTrue(reliable)
        self.assertTrue(ok, findings)


class TestLoudnormFallback(EnhanceCase):
    """Fallback a loudnorm dinámico cuando el lineal no alcanza."""

    def test_high_crest_falls_back_to_dynamic(self):
        # Ráfagas cortas y fuertes con mucho silencio: factor de
        # cresta alto, como la salida de DeepFilterNet. Con objetivo
        # −14 LUFS el lineal no puede llegar sin superar el TP (el
        # techo deja solo 12 dB de cresta); run_chain debe repetir
        # en dinámico y alcanzar el objetivo. Con −18 el lineal sí
        # llega (el gating excluye el silencio de la medida), así
        # que el disparo del fallback se verifica a −14.
        burst = voiced(0.1, level=0.5)
        sil = np.zeros(int(0.9 * SR), dtype=np.float32)
        x = np.concatenate([burst, sil] * 10)
        src = write(self.tmp.name, "bursts.wav", x)
        out = os.path.join(self.tmp.name, "out.wav")
        mode, _ = ev.run_chain(src, out, ["aresample=48000"],
                               -14.0, -2.0, 9.0)
        self.assertIn("dynamic", mode)
        info = ev.analyze(out)
        self.assertAlmostEqual(info["lufs"], -14.0, delta=1.0)
        self.assertLessEqual(info["true_peak_dbtp"], -1.7)


class TestModes(EnhanceCase):
    def test_compare_mode_writes_ab(self):
        src = write(self.tmp.name, "in.wav", three_words())
        out, r = self.enhance(src, preset="phone", compare=True)
        ab = r.get("compare_ab")
        self.assertTrue(ab and os.path.isfile(ab))
        _, _, dur_ab = ev.probe(ab)
        _, _, dur_in = ev.probe(src)
        # antes + 0,5 s de silencio + después
        self.assertAlmostEqual(dur_ab, 2 * dur_in + 0.5, delta=0.05)

    def test_dry_run_writes_nothing(self):
        src = write(self.tmp.name, "in.wav", three_words())
        out = os.path.join(self.tmp.name, "out.wav")
        p = subprocess.run(
            [PY, os.path.join(HERE, "enhance-voice.py"),
             "--in", src, "--out", out, "--dry-run"],
            capture_output=True, text=True, timeout=120)
        self.assertEqual(p.returncode, 0, p.stderr)
        self.assertFalse(os.path.exists(out))
        self.assertIn("afftdn", p.stdout)

    def test_cli_exit_zero_on_pass(self):
        src = write(self.tmp.name, "in.wav", three_words())
        out = os.path.join(self.tmp.name, "out.wav")
        p = subprocess.run(
            [PY, os.path.join(HERE, "enhance-voice.py"),
             "--in", src, "--out", out, "--force"],
            capture_output=True, text=True, timeout=300)
        self.assertEqual(p.returncode, 0, p.stdout + p.stderr)
        self.assertIn("Veredicto: PASS", p.stdout)
        rep = json.load(open(out + ".json"))
        self.assertEqual(rep["verdict"], "PASS")


# ---------------- integración: líneas reales ----------------

def _lines_exist():
    return all(os.path.isfile(os.path.join(LINES, f))
               for f in ("L1.wav", "L3.wav", "L4.wav"))


@unittest.skipUnless(_lines_exist(),
                     "faltan las líneas de VO reales (no versionadas)")
class TestRealLines(EnhanceCase):
    def test_real_line_phone_pass(self):
        _, r = self.enhance(os.path.join(LINES, "L1.wav"),
                            preset="phone")
        self.assertEqual(r["verdict"], "PASS", r["verdict_reasons"])
        self.assertAlmostEqual(r["output"]["lufs"], -18.0, delta=1.0)
        self.assertAlmostEqual(r["output"]["duration_s"],
                              r["input"]["duration_s"], delta=0.01)

    def test_real_line_stereo_phone_pass(self):
        # Regresión 22-nov-2026: L4 (estéreo) daba FAIL de pausas
        # espurio porque el VAD por energía sola contaba el tono de
        # sala subido por el loudnorm como voz. Con periodicidad
        # debe pasar.
        _, r = self.enhance(os.path.join(LINES, "L4.wav"),
                            preset="phone")
        self.assertEqual(r["verdict"], "PASS", r["verdict_reasons"])
        self.assertTrue(r["pauses"]["ok"], r["pauses"]["findings"])

    def test_real_line_clean_keeps_snr(self):
        _, r = self.enhance(os.path.join(LINES, "L3.wav"),
                            preset="clean")
        self.assertEqual(r["verdict"], "PASS", r["verdict_reasons"])
        self.assertGreaterEqual(
            r["output"]["snr_db"] - r["input"]["snr_db"], -3.0)

    def test_real_degraded_recovers(self):
        clean, _ = sf.read(os.path.join(LINES, "L1.wav"),
                           always_2d=False)
        src = write(self.tmp.name, "deg.wav", degrade(clean))
        out, r = self.enhance(src, preset="phone")
        self.assertEqual(r["verdict"], "PASS", r["verdict_reasons"])
        gain = r["output"]["snr_db"] - r["input"]["snr_db"]
        self.assertGreaterEqual(gain, 3.0,
                                f"mejora de SNR insuficiente: {gain:+.1f} dB")
        # Verificación de pausas contra el original limpio (el
        # check del informe no es fiable con entrada ruidosa).
        rec, sr = sf.read(out, always_2d=False)
        ok, findings, reliable, stats = ev.check_pauses(clean, rec, sr)
        self.assertTrue(reliable)
        self.assertTrue(ok, findings)


@unittest.skipUnless(_lines_exist() and ev.find_deepfilter() is not None,
                     "faltan las líneas de VO reales o el binario "
                     "deep-filter")
class TestProReal(EnhanceCase):
    """Calidad del preset `pro` sobre voz REAL (líneas de Adriana).

    DF es un modelo de voz: sobre la señal sintética (armónicos
    estacionarios) la atenúa como si fuera ruido, así que la
    sonoridad, las pausas y la recuperación solo se verifican
    aquí, con voz real.
    """

    def test_real_line_pro_pass(self):
        _, r = self.enhance(os.path.join(LINES, "L1.wav"),
                            preset="pro")
        self.assertEqual(r["verdict"], "PASS", r["verdict_reasons"])
        self.assertAlmostEqual(r["output"]["lufs"], -18.0, delta=1.0)
        self.assertLessEqual(r["output"]["true_peak_dbtp"], -1.7)
        self.assertAlmostEqual(r["output"]["duration_s"],
                              r["input"]["duration_s"], delta=0.01)
        self.assertTrue(r["pauses"]["ok"], r["pauses"]["findings"])

    def test_real_line_stereo_pro_pass(self):
        _, r = self.enhance(os.path.join(LINES, "L4.wav"),
                            preset="pro")
        self.assertEqual(r["verdict"], "PASS", r["verdict_reasons"])
        self.assertTrue(r["pauses"]["ok"], r["pauses"]["findings"])

    def test_real_degraded_pro_recovers(self):
        clean, _ = sf.read(os.path.join(LINES, "L1.wav"),
                           always_2d=False)
        src = write(self.tmp.name, "deg.wav", degrade(clean))
        out, r = self.enhance(src, preset="pro")
        self.assertEqual(r["verdict"], "PASS", r["verdict_reasons"])
        gain = r["output"]["snr_db"] - r["input"]["snr_db"]
        self.assertGreaterEqual(gain, 3.0,
                                f"mejora de SNR insuficiente: {gain:+.1f} dB")
        # Verificación de pausas contra el original limpio (el
        # check del informe no es fiable con entrada ruidosa).
        rec, sr = sf.read(out, always_2d=False)
        ok, findings, reliable, stats = ev.check_pauses(clean, rec, sr)
        self.assertTrue(reliable)
        self.assertTrue(ok, findings)


if __name__ == "__main__":
    unittest.main()
