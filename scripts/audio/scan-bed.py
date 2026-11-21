#!/usr/bin/env python3
"""Escanea una cama musical «instrumental» en busca de voces fantasma.

Uso: ~/workspace/.stt-env/bin/python scripts/audio/scan-bed.py \
       --in cama.mp3 [--start 88 --duration 69.23] [--out scan.json]

REGLA PERMANENTE (21-nov-2026, V5 marti-fidel): toda cama generada
se escanea con Whisper ANTES de usarla. La pista «instrumental» de
Google Flow Music («Documentary underscore», 20-nov-2026) llevaba
texturas vocales fantasma en 60-88 s que Whisper transcribe como
frases («¡Claro que no está en el cuerpo de nadie!», 80,69-87,99 s):
la ventana V4.1 (72-141,23 s) empezaba dentro de esa zona y los
primeros ~16 s del reel llevaban susurros bajo la VO. El escaneo
habría cazado la contaminación antes de mezclar.

Método (calibrado 21-nov-2026 con faster-whisper small, es):
  - Dos pasadas sobre el audio (16 kHz mono): CON filtro VAD
    (Silero, pasada primaria) y SIN VAD (pasada de registro).
  - Clasificación por segmento:
      HALLUCINATION: texto degenerado (un solo carácter, solo
        puntuación), patrón conocido de alucinación de Whisper
        sobre música/silencio («...Amara.org...») o segmento que
        empieza más allá de la duración del audio (relleno del
        decodificador). Whisper alucina «Subtítulos realizados por
        la comunidad de Amara.org» sobre música limpia: NO es voz.
      VOICE: palabras reales con no_speech_prob < 0,5 (frase de 2+
        palabras) o < 0,3 (una sola palabra). La zona contaminada
        60-88 s da frases con nsp 0,224 (VAD) y «¡Suscríbete!» con
        nsp 0,106 (sin VAD).
      UNCERTAIN: palabras reales con nsp por encima del umbral
        (escuchar de oído).
  - Veredicto: FAIL si hay algún segmento VOICE en cualquiera de
    las dos pasadas; PASS en caso contrario (las alucinaciones y
    los UNCERTAIN se listan como INFO, sin tumbar el veredicto).
  - OJO: la decodificación de Whisper NO es determinista entre
    corridas (el texto alucinado y la segmentación varían: la zona
    60-88 s dio «¡Claro que no está en el cuerpo de nadie!» en una
    corrida y «Cuanto bien mi hija celebra la enserciación...» en
    otra). Lo estable es el VEREDICTO, no el texto: nunca citar el
    texto de un segmento como evidencia, solo la clase y el nsp.

Controles de calibración (pista Flow, faster-whisper small):
  0-60 s    -> PASS (0 segmentos en ambas pasadas)
  60-88 s   -> FAIL (VAD: frases 80,69-88,49 s, nsp 0,224;
                     sin VAD: «¡Suscríbete!» 60-62 s, nsp 0,106)
  88-157,23 -> PASS (VAD: 0; sin VAD: «i»/«...»/«Música» degenerados)
  88-179,56 -> PASS (VAD: 0)
  cama v5 0-20 s -> PASS (solo Amara.org, HALLUCINATION)

Salida: informe JSON (si --out) + resumen por stdout.
Código: 0 = PASS, 1 = FAIL (voz detectada), 2 = error.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import tempfile

# Patrones de alucinación conocidos de Whisper sobre música/silencio.
HALLUCINATION_PATTERNS = [
    r'amara\.org',
    r'subt.tulos realizados por la comunidad',
    r'subt.tulos por la comunidad',
    # Etiqueta genérica de música («Música», «[Música]», «♪»): Whisper
    # reconoce el contenido como música, no como voz. Apareció en la
    # ventana limpia 88-157,23 s (nsp 0,589) y tumbaba el veredicto.
    r'^\s*\[?m.sica\]?\s*\.?\s*$',
    r'^\s*♪+\s*$',
]

# Umbrales calibrados 21-nov-2026. La zona contaminada da frases con
# nsp 0,106-0,224; la música limpia da «Música» con nsp 0,589 y «i»
# con 0,589. Una sola palabra necesita nsp muy bajo para ser VOICE
# («¡Suscríbete!», 0,106, en la zona contaminada); una frase de 2+
# palabras admite hasta 0,5.
NSP_VOICE_MAX = 0.5
NSP_VOICE_SINGLE_WORD_MAX = 0.3


def classify(text, nsp, start, duration):
    """Clasifica un segmento de Whisper. Devuelve (clase, motivo)."""
    t = text.strip()
    if start >= duration - 0.01:
        return 'HALLUCINATION', 'empieza más allá del audio (relleno)'
    if len(t) <= 1:
        return 'HALLUCINATION', 'carácter único degenerado'
    if not re.search(r'[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]', t):
        return 'HALLUCINATION', 'sin letras (puntuación/ruido)'
    for pat in HALLUCINATION_PATTERNS:
        if re.search(pat, t, re.IGNORECASE):
            return 'HALLUCINATION', 'patrón conocido de alucinación'
    n_words = len(re.findall(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+", t))
    limit = (NSP_VOICE_SINGLE_WORD_MAX if n_words <= 1
             else NSP_VOICE_MAX)
    if nsp < limit:
        return 'VOICE', f'palabras reales, no_speech_prob {nsp:.3f}'
    return 'UNCERTAIN', f'palabras reales pero nsp {nsp:.3f} (oír)'


def to_wav_16k(src, start, duration, tmpdir):
    """Convierte (una ventana de) el audio a WAV 16 kHz mono."""
    out = os.path.join(tmpdir, 'scan-16k.wav')
    cmd = ['ffmpeg', '-v', 'error', '-y']
    if start:
        cmd += ['-ss', str(start)]
    cmd += ['-i', src, '-map', '0:a:0']
    if duration:
        cmd += ['-t', str(duration)]
    cmd += ['-ac', '1', '-ar', '16000', out]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f'ffmpeg falló: {r.stderr.strip()}')
    return out


def transcribe(model, wav, vad):
    from faster_whisper import WhisperModel  # noqa: F401 (re-export p.)  # pylint: disable=unused-import
    kwargs = {'language': 'es'}
    if vad:
        kwargs['vad_filter'] = True
        kwargs['vad_parameters'] = {'min_silence_duration_ms': 500}
    segments, _ = model.transcribe(wav, **kwargs)
    return [{'start': round(s.start, 2), 'end': round(s.end, 2),
             'text': s.text.strip(),
             'no_speech_prob': round(s.no_speech_prob, 3),
             'avg_logprob': round(s.avg_logprob, 3)}
            for s in segments]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--in', dest='inp', required=True,
                    help='Audio a escanear (cualquier formato ffmpeg)')
    ap.add_argument('--start', type=float, default=0.0,
                    help='Inicio de la ventana en segundos (defecto 0)')
    ap.add_argument('--duration', type=float, default=None,
                    help='Duración de la ventana en segundos (defecto: todo)')
    ap.add_argument('--model', default=os.path.expanduser(
        '~/workspace/.stt-models/faster-whisper-small'),
        help='Modelo faster-whisper (defecto: small local)')
    ap.add_argument('--out', default=None, help='Informe JSON (opcional)')
    args = ap.parse_args()

    if not os.path.exists(args.inp):
        print(f'ERROR: no existe {args.inp}', file=sys.stderr)
        return 2
    os.environ.setdefault('NO_PROXY', 'localhost,127.0.0.1')
    os.environ.setdefault('no_proxy', 'localhost,127.0.0.1')

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print('ERROR: faster-whisper no está instalado en este Python; '
              'ejecutar con ~/workspace/.stt-env/bin/python',
              file=sys.stderr)
        return 2

    with tempfile.TemporaryDirectory(prefix='scan-bed-') as td:
        try:
            wav = to_wav_16k(args.inp, args.start, args.duration, td)
        except RuntimeError as e:
            print(f'ERROR: {e}', file=sys.stderr)
            return 2
        probe = subprocess.run(
            ['ffprobe', '-v', 'error', '-show_entries',
             'format=duration', '-of', 'csv=p=0', wav],
            capture_output=True, text=True)
        dur = float(probe.stdout.strip())
        model = WhisperModel(args.model, device='cpu',
                             compute_type='int8', local_files_only=True)
        report = {'input': args.inp, 'window_start_s': args.start,
                  'window_duration_s': round(dur, 2), 'passes': {}}
        verdict = 'PASS'
        for vad in (True, False):
            name = 'vad' if vad else 'raw'
            segs = transcribe(model, wav, vad)
            classified = []
            for s in segs:
                cls, why = classify(s['text'], s['no_speech_prob'],
                                    s['start'], dur)
                s['class'] = cls
                s['reason'] = why
                # Timestamps absolutos (ventana + offset).
                s['start_abs'] = round(args.start + s['start'], 2)
                s['end_abs'] = round(args.start + s['end'], 2)
                classified.append(s)
                if cls == 'VOICE':
                    verdict = 'FAIL'
            report['passes'][name] = classified
        report['verdict'] = verdict

    if args.out:
        with open(args.out, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=1)
    n_voice = sum(1 for p in report['passes'].values()
                  for s in p if s['class'] == 'VOICE')
    n_unc = sum(1 for p in report['passes'].values()
                for s in p if s['class'] == 'UNCERTAIN')
    print(f"{report['verdict']} {args.inp} "
          f"(ventana {args.start}-{args.start + dur:.2f} s): "
          f"{n_voice} segmentos VOICE, {n_unc} UNCERTAIN")
    for name, segs in report['passes'].items():
        for s in segs:
            print(f"  [{name}] {s['start_abs']:.2f}-{s['end_abs']:.2f} "
                  f"{s['class']} (nsp {s['no_speech_prob']}) "
                  f"{s['text']!r} — {s['reason']}")
    return 0 if verdict == 'PASS' else 1


if __name__ == '__main__':
    raise SystemExit(main())
