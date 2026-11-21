#!/usr/bin/env python3
"""Selecciona automáticamente la mejor ventana de una cama musical.

Uso: ~/workspace/.stt-env/bin/python scripts/audio/select-bed-window.py \\
       --in cama.mp3 --duration 69.23 [--step 1.0] [--out report.json]

Problema (V4.1/V5 marti-fidel, 20-nov-2026): la pista «instrumental»
de Google Flow Music («Documentary underscore», 179,56 s) llevaba
texturas vocales fantasma en 60-88 s; la ventana V4.1 (72-141,23 s)
empezaba dentro de esa zona y los primeros ~16 s del reel llevaban
susurros bajo la VO. La V5 tuvo que mover la ventana A MANO a
88-157,23 s. Este selector automatiza esa decisión: dada una pista y
una duración objetivo, elige la mejor ventana sin intervención.

Método (diseño eficiente — UN solo escaneo):
  1. Una sola decodificación a WAV 16 kHz mono, que sirve para todo.
  2. Una sola pasada Whisper (faster-whisper small + VAD, más pasada
     sin VAD de registro, igual que `scan-bed.py`) sobre TODA la
     pista; los segmentos se clasifican con `scan-bed.classify`.
  3. Curva RMS por segundo (numpy) sobre el mismo WAV.
  4. Las ventanas candidatas (paso `--step`, por defecto 1 s) se
     puntúan a partir de ese único escaneo — NUNCA un Whisper por
     ventana.

Rechazo duro (la ventana no se puede usar):
  - VOZ (VAD): algún segmento VOICE de la pasada con VAD solapa la
    ventana ≥ `--voice-overlap-min` (defecto 1,0 s). El VAD es el
    discriminador (ver `scan-bed.py`): la música limpia da 0
    segmentos con VAD. El solape mínimo de 1 s existe porque una
    frase puede terminar justo dentro de la ventana: la frase
    fantasma 80,69-88,49 s termina 0,49 s dentro de la ventana V5
    (88-157,23 s) y el escaneo de esa ventana dio 0 segmentos con
    VAD — un resto < 1 s no es voz usable.
  - AGUJERO: algún bin de 1 s cae más de `--hole-depth-db`
    (defecto 14 dB) por debajo de la mediana RMS de la ventana.
    Calibración Flow: la ventana 0-69,23 s tiene un agujero de
    -44,9 dBFS a los 10 s (17,2 dB bajo su mediana) y la V5 tiene
    un respiro de frase de -29,8 dBFS (10,6 dB bajo su mediana);
    14 dB separa ambos con ~3 dB de margen a cada lado.

Puntuación (base 100, más es mejor):
  - Ataque al inicio: el primer segundo por encima de la mediana
    +3 dB penaliza 2 pt/dB (la pista Flow arranca con un ataque).
  - Inicio fuerte: la media de los primeros 5 s por encima de la
    mediana +1 dB penaliza 2 pt/dB (se busca arco calmado).
  - Crecimiento al cierre: (mediana de los últimos 10 s - mediana
    de los primeros 10 s); crecimiento hasta +3 dB suma 1 pt/dB,
    descenso resta 1 pt/dB con suelo en -12. Se mide con MEDIANAS
    de 10 s (no medias de 5 s) para que un solo respiro de frase
    no distorsione el cierre: la ventana V5 (88-157,23 s) tiene su
    respiro de -29,8 dBFS en el segundo 154, dentro de sus últimos
    5 s, y con media de 5 s perdía 1 dB espurio. En la pista Flow
    NINGUNA ventana limpia crece al cierre (la segunda mitad
    desciende hacia el fade-out); la V5 desciende 5,7 dB y aun así
    es la referencia, por eso el peso es suave (1 pt/dB).
  - Respiro profundo: profundidad de agujero entre 8 y 14 dB
    penaliza 1 pt/dB.
  - Voz sin VAD (pasada de registro): -30 pt si un segmento VOICE
    sin VAD solapa ≥1 s. No es rechazo duro: el VAD es el
    discriminador y la pasada sin VAD es de registro (ver
    `scan-bed.py`); con `--strict` sí rechaza.
  - UNCERTAIN: -10 pt por segmento que solape ≥1 s.

Desempate: entre las ventanas aceptadas a menos de `--tie-band`
(defecto 3 pt) de la mejor puntuación, gana la MÁS TEMPRANA.
Diferencias < 3 pt en una escala heurística de 100 no son
significativas; la más temprana reproduce la decisión V5 (primera
ventana limpia tras la contaminación).

Salida: informe JSON (si `--out`) con el escaneo completo, la curva
RMS, TODAS las candidatas con puntuación y motivo de rechazo, y la
ventana elegida; resumen por stdout (elegida + top 10 + rechazadas
agrupadas por motivo; `--show START` detalla candidatas concretas).
Código: 0 = ventana elegida, 1 = ninguna ventana pasa (p. ej. pista
entera contaminada), 2 = error.

`--scan-json` reutiliza un escaneo previo (informe de este script o
de `scan-bed.py` sobre la pista completa) y salta el Whisper: útil
para re-puntuar con otros parámetros sin gastar CPU. El escaneo
Whisper toma el candado compartido /tmp/hub-speed-v5-render.lock
(ver `--lock` / `--no-lock`); la puntuación no lo necesita.

Calibración (21-nov-2026, pista Flow, faster-whisper small):
  ver docs/HUB-SPEED-V5-BED.md.
"""
import argparse
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import time

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))

# --- Parámetros calibrados (ver docstring y docs/HUB-SPEED-V5-BED.md) ---
HOLE_DEPTH_DB = 14.0
HOLE_SOFT_DB = 8.0
VOICE_OVERLAP_MIN = 1.0
TIE_BAND = 3.0
RAW_VOICE_PENALTY = 30.0
UNCERTAIN_PENALTY = 10.0
DEFAULT_LOCK = '/tmp/hub-speed-v5-render.lock'
LOCK_TIMEOUT_S = 3600
LOCK_STALE_S = 7200


def load_scan_bed():
    """Carga scan-bed.py (nombre con guion, no importable directo)."""
    path = os.path.join(HERE, 'scan-bed.py')
    spec = importlib.util.spec_from_file_location('scan_bed', path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class Lock:
    """Candado compartido por mkdir (ver AGENTS del proyecto)."""

    def __init__(self, path, timeout=LOCK_TIMEOUT_S, stale=LOCK_STALE_S):
        self.path = path
        self.timeout = timeout
        self.stale = stale
        self.held = False

    def __enter__(self):
        if not self.path:
            return self
        waited = 0
        while True:
            try:
                os.mkdir(self.path)
                self.held = True
                return self
            except FileExistsError:
                pass
            try:
                age = time.time() - os.path.getmtime(self.path)
            except OSError:
                age = 0
            if age > self.stale:
                print(f'AVISO: candado {self.path} con {age:.0f} s '
                      f'(> {self.stale} s); se considera rancio y se '
                      f'libera', file=sys.stderr)
                try:
                    os.rmdir(self.path)
                except OSError:
                    pass
                continue
            if waited >= self.timeout:
                raise TimeoutError(
                    f'candado {self.path} ocupado tras {self.timeout} s')
            if waited % 60 == 0:
                print(f'... esperando candado {self.path} '
                      f'({waited} s)', file=sys.stderr)
            time.sleep(20)
            waited += 20

    def __exit__(self, *exc):
        if self.held:
            try:
                os.rmdir(self.path)
            except OSError:
                pass
            self.held = False
        return False


def probe_duration(path):
    r = subprocess.run(
        ['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
         '-of', 'csv=p=0', path], capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f'ffprobe falló: {r.stderr.strip()}')
    return float(r.stdout.strip())


def decode_16k_mono(src, tmpdir):
    """Decodifica TODA la pista a WAV 16 kHz mono (una sola vez)."""
    out = os.path.join(tmpdir, 'bed-16k.wav')
    r = subprocess.run(
        ['ffmpeg', '-v', 'error', '-y', '-i', src, '-map', '0:a:0',
         '-ac', '1', '-ar', '16000', out],
        capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f'ffmpeg falló: {r.stderr.strip()}')
    return out


def rms_curve_db(wav_path):
    """RMS por segundo en dBFS, desde un WAV 16 kHz mono."""
    import wave
    with wave.open(wav_path, 'rb') as w:
        sr = w.getframerate()
        n = w.getnframes()
        raw = w.readframes(n)
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768.0
    n_bins = int(n // sr)
    curve = []
    for i in range(n_bins):
        seg = x[i * sr:(i + 1) * sr]
        rms = float(np.sqrt(np.mean(seg ** 2))) if len(seg) else 0.0
        curve.append(20 * np.log10(rms) if rms > 0 else -120.0)
    return curve


def scan_track(wav_path, duration, model_path, scan_bed):
    """Un solo escaneo Whisper (VAD + sin VAD) de toda la pista."""
    os.environ.setdefault('NO_PROXY', 'localhost,127.0.0.1')
    os.environ.setdefault('no_proxy', 'localhost,127.0.0.1')
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print('ERROR: faster-whisper no está instalado en este Python; '
              'ejecutar con ~/workspace/.stt-env/bin/python',
              file=sys.stderr)
        raise SystemExit(2)
    model = WhisperModel(model_path, device='cpu', compute_type='int8',
                         local_files_only=True)
    passes = {}
    for vad in (True, False):
        name = 'vad' if vad else 'raw'
        segs = scan_bed.transcribe(model, wav_path, vad)
        classified = []
        for s in segs:
            cls, why = scan_bed.classify(s['text'], s['no_speech_prob'],
                                         s['start'], duration)
            s['class'] = cls
            s['reason'] = why
            s['start_abs'] = round(s['start'], 2)
            s['end_abs'] = round(s['end'], 2)
            classified.append(s)
        passes[name] = classified
    return {'passes': passes}


def load_scan_json(path):
    """Carga un escaneo previo: informe de este script (clave `scan`)
    o de scan-bed.py (clave `passes` en la raíz)."""
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    scan = data.get('scan', data)
    if 'passes' not in scan:
        raise ValueError(f'{path}: sin clave "passes" ni "scan.passes"')
    return scan


def overlap_s(seg_start, seg_end, w0, w1):
    return max(0.0, min(seg_end, w1) - max(seg_start, w0))


def seg_bounds(seg):
    """Timestamps absolutos del segmento (con fallback a relativos)."""
    s = seg.get('start_abs', seg.get('start'))
    e = seg.get('end_abs', seg.get('end'))
    return float(s), float(e)


def score_window(rms, start_s, duration_s, scan, strict=False,
                 hole_depth_db=HOLE_DEPTH_DB,
                 voice_overlap_min=VOICE_OVERLAP_MIN):
    """Puntúa UNA ventana a partir del escaneo único.

    rms: curva RMS dBFS por segundo (bin i cubre [i, i+1)).
    Devuelve dict con score, status (accepted/rejected), reasons
    (rechazo duro), notes (penalizaciones) y métricas.
    """
    w0, w1 = start_s, start_s + duration_s
    # Bins con centro dentro de la ventana.
    idx = [i for i in range(len(rms))
           if w0 <= i + 0.5 < w1]
    if not idx:
        return {'start_s': round(start_s, 2), 'end_s': round(w1, 2),
                'status': 'rejected', 'score': None,
                'reasons': ['ventana sin bins RMS'],
                'notes': [], 'metrics': {}}
    vals = np.array([rms[i] for i in idx])
    median = float(np.median(vals))
    mn = float(vals.min())
    min_at = idx[int(vals.argmin())]
    depth = median - mn
    first_bin = rms[idx[0]]
    n5 = min(5, len(vals))
    start5 = float(np.mean(vals[:n5]))
    # Crecimiento: medianas de los primeros/últimos 10 s (robustas
    # ante un respiro de frase suelto; k se adapta a ventanas cortas).
    k10 = min(10, max(1, len(vals) // 2))
    start10 = float(np.median(vals[:k10]))
    end10 = float(np.median(vals[-k10:]))
    growth = end10 - start10
    metrics = {'median_db': round(median, 1), 'min_db': round(mn, 1),
               'min_at_s': min_at, 'hole_depth_db': round(depth, 1),
               'first_bin_db': round(first_bin, 1),
               'start5_db': round(start5, 1),
               'start_db': round(start10, 1),
               'end_db': round(end10, 1),
               'growth_db': round(growth, 1)}

    reasons, notes = [], []
    score = 100.0

    # --- Rechazo duro: voz VAD ---
    for s in scan['passes'].get('vad', []):
        if s.get('class') != 'VOICE':
            continue
        ss, se = seg_bounds(s)
        ov = overlap_s(ss, se, w0, w1)
        if ov >= voice_overlap_min:
            reasons.append(
                f"voz (VAD) {ss:.2f}-{se:.2f} s solapa {ov:.1f} s "
                f"(nsp {s.get('no_speech_prob')})")
    # --- Rechazo duro: agujero ---
    if depth > hole_depth_db:
        reasons.append(
            f"agujero {mn:.1f} dBFS a los {min_at} s "
            f"({depth:.1f} dB bajo la mediana {median:.1f})")
    # --- Rechazo duro opcional: voz sin VAD ---
    raw_hits = []
    for s in scan['passes'].get('raw', []):
        if s.get('class') != 'VOICE':
            continue
        ss, se = seg_bounds(s)
        ov = overlap_s(ss, se, w0, w1)
        if ov >= voice_overlap_min:
            raw_hits.append((ss, se, ov, s.get('no_speech_prob')))
    if strict and raw_hits:
        for ss, se, ov, nsp in raw_hits:
            reasons.append(
                f"voz (sin VAD, --strict) {ss:.2f}-{se:.2f} s "
                f"solapa {ov:.1f} s (nsp {nsp})")
    elif raw_hits:
        score -= RAW_VOICE_PENALTY
        for ss, se, ov, nsp in raw_hits:
            notes.append(f"voz sin VAD {ss:.2f}-{se:.2f} s "
                         f"(-{RAW_VOICE_PENALTY:.0f} pt)")
    # --- Penalización: UNCERTAIN ---
    for pname in ('vad', 'raw'):
        for s in scan['passes'].get(pname, []):
            if s.get('class') != 'UNCERTAIN':
                continue
            ss, se = seg_bounds(s)
            if overlap_s(ss, se, w0, w1) >= voice_overlap_min:
                score -= UNCERTAIN_PENALTY
                notes.append(f"UNCERTAIN ({pname}) {ss:.2f}-{se:.2f} s "
                             f"(-{UNCERTAIN_PENALTY:.0f} pt)")

    # --- Componentes de arco (sobre la curva RMS) ---
    attack = first_bin - median
    if attack > 3:
        pen = (attack - 3) * 2
        score -= pen
        notes.append(f"ataque inicial {attack:+.1f} dB sobre la mediana "
                     f"(-{pen:.1f} pt)")
    if start5 > median + 1:
        pen = (start5 - median - 1) * 2
        score -= pen
        notes.append(f"inicio fuerte {start5:.1f} dBFS "
                     f"(-{pen:.1f} pt)")
    if growth >= 0:
        bonus = min(growth, 3.0)
        score += bonus
        if bonus:
            notes.append(f"crecimiento al cierre {growth:+.1f} dB "
                         f"(+{bonus:.1f} pt)")
    else:
        pen = min(-growth, 12.0)
        score -= pen
        notes.append(f"descenso al cierre {growth:+.1f} dB "
                     f"(-{pen:.1f} pt)")
    if depth > HOLE_SOFT_DB:
        pen = min(depth, hole_depth_db) - HOLE_SOFT_DB
        score -= pen
        notes.append(f"respiro profundo {depth:.1f} dB "
                     f"(-{pen:.1f} pt)")

    return {'start_s': round(start_s, 2), 'end_s': round(w1, 2),
            'status': 'rejected' if reasons else 'accepted',
            'score': round(score, 1),
            'reasons': reasons, 'notes': notes, 'metrics': metrics}


def rank_candidates(rms, track_dur, target_dur, scan, step=1.0,
                    strict=False, tie_band=TIE_BAND, **kw):
    """Puntúa todas las candidatas y elige (desempate: la más temprana
    entre las que están a <tie_band de la mejor)."""
    starts = []
    s = 0.0
    while s + target_dur <= track_dur + 1e-9:
        starts.append(round(s, 2))
        s += step
    end_aligned = round(track_dur - target_dur, 2)
    if end_aligned > 0 and all(abs(end_aligned - x) > 1e-6
                               for x in starts):
        starts.append(end_aligned)
    cands = [score_window(rms, st, target_dur, scan, strict=strict, **kw)
             for st in starts]
    accepted = [c for c in cands if c['status'] == 'accepted']
    accepted.sort(key=lambda c: -c['score'])
    chosen = None
    if accepted:
        best = accepted[0]['score']
        near = [c for c in accepted
                if best - c['score'] <= tie_band + 1e-9]
        chosen = min(near, key=lambda c: c['start_s'])
    rejected = [c for c in cands if c['status'] == 'rejected']
    return cands, accepted, rejected, chosen


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--in', dest='inp', required=True,
                    help='Pista a analizar (cualquier formato ffmpeg)')
    ap.add_argument('--duration', type=float, required=True,
                    help='Duración objetivo de la ventana en segundos')
    ap.add_argument('--step', type=float, default=1.0,
                    help='Paso entre candidatas en segundos (defecto 1)')
    ap.add_argument('--out', default=None, help='Informe JSON (opcional)')
    ap.add_argument('--scan-json', default=None,
                    help='Reutilizar un escaneo previo (salta Whisper)')
    ap.add_argument('--model', default=os.path.expanduser(
        '~/workspace/.stt-models/faster-whisper-small'),
        help='Modelo faster-whisper (defecto: small local)')
    ap.add_argument('--strict', action='store_true',
                    help='Rechazar también por voz sin VAD')
    ap.add_argument('--hole-depth-db', type=float, default=HOLE_DEPTH_DB)
    ap.add_argument('--voice-overlap-min', type=float,
                    default=VOICE_OVERLAP_MIN)
    ap.add_argument('--tie-band', type=float, default=TIE_BAND)
    ap.add_argument('--top', type=int, default=10,
                    help='Candidatas aceptadas a mostrar (defecto 10)')
    ap.add_argument('--show', type=float, action='append', default=[],
                    help='Detalle de la candidata que empieza en START '
                         '(repetible)')
    ap.add_argument('--lock', default=DEFAULT_LOCK,
                    help='Candado para el escaneo Whisper '
                         f'(defecto {DEFAULT_LOCK})')
    ap.add_argument('--lock-timeout', type=float, default=LOCK_TIMEOUT_S,
                    help='Segundos máximos esperando el candado '
                         f'(defecto {LOCK_TIMEOUT_S})')
    ap.add_argument('--no-lock', action='store_true',
                    help='No tomar el candado para el escaneo')
    args = ap.parse_args()

    if not os.path.exists(args.inp):
        print(f'ERROR: no existe {args.inp}', file=sys.stderr)
        return 2
    if args.duration <= 0 or args.step <= 0:
        print('ERROR: --duration y --step deben ser > 0', file=sys.stderr)
        return 2
    t0 = time.time()
    try:
        track_dur = probe_duration(args.inp)
    except RuntimeError as e:
        print(f'ERROR: {e}', file=sys.stderr)
        return 2
    if args.duration > track_dur:
        print(f'ERROR: duración objetivo {args.duration} s > duración '
              f'de la pista {track_dur:.2f} s', file=sys.stderr)
        return 2

    scan_bed = load_scan_bed()
    timings = {}
    with tempfile.TemporaryDirectory(prefix='select-bed-') as td:
        try:
            wav = decode_16k_mono(args.inp, td)
        except RuntimeError as e:
            print(f'ERROR: {e}', file=sys.stderr)
            return 2
        t_rms = time.time()
        rms = rms_curve_db(wav)
        timings['rms_s'] = round(time.time() - t_rms, 1)
        if args.scan_json:
            try:
                scan = load_scan_json(args.scan_json)
            except (OSError, ValueError, json.JSONDecodeError) as e:
                print(f'ERROR: --scan-json: {e}', file=sys.stderr)
                return 2
            timings['whisper_s'] = 0.0
            timings['scan_source'] = f'cache {args.scan_json}'
        else:
            lock_path = None if args.no_lock else args.lock
            t_w = time.time()
            try:
                with Lock(lock_path, timeout=args.lock_timeout):
                    # La espera del candado NO es tiempo de Whisper:
                    # se mide aparte (21-nov-2026: la primera versión
                    # la incluía en whisper_s y lo inflaba ~8 min).
                    timings['lock_wait_s'] = round(time.time() - t_w, 1)
                    t_scan = time.time()
                    scan = scan_track(wav, track_dur, args.model,
                                      scan_bed)
                    timings['whisper_s'] = round(time.time() - t_scan, 1)
            except TimeoutError as e:
                print(f'ERROR: {e}', file=sys.stderr)
                return 2
            timings['scan_source'] = 'whisper (VAD + sin VAD)'

    t_rank = time.time()
    cands, accepted, rejected, chosen = rank_candidates(
        rms, track_dur, args.duration, scan, step=args.step,
        strict=args.strict, tie_band=args.tie_band,
        hole_depth_db=args.hole_depth_db,
        voice_overlap_min=args.voice_overlap_min)
    timings['rank_s'] = round(time.time() - t_rank, 1)
    timings['total_s'] = round(time.time() - t0, 1)

    report = {'input': args.inp, 'track_duration_s': round(track_dur, 2),
              'target_duration_s': args.duration, 'step_s': args.step,
              'params': {'hole_depth_db': args.hole_depth_db,
                         'voice_overlap_min_s': args.voice_overlap_min,
                         'tie_band': args.tie_band,
                         'strict': args.strict},
              'scan': scan, 'rms_db_per_s': [round(v, 1) for v in rms],
              'n_candidates': len(cands),
              'n_accepted': len(accepted),
              'n_rejected': len(rejected),
              'chosen': chosen,
              'ranking_accepted': accepted,
              'rejected': rejected,
              'timings_s': timings}
    if args.out:
        with open(args.out, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=1)

    # --- Resumen por stdout ---
    n_voice = sum(1 for p in scan['passes'].values()
                  for s in p if s.get('class') == 'VOICE')
    print(f"Pista {args.inp} ({track_dur:.2f} s), objetivo "
          f"{args.duration} s, paso {args.step} s: {len(cands)} "
          f"candidatas, {len(accepted)} aceptadas, {len(rejected)} "
          f"rechazadas ({n_voice} segmentos VOICE en el escaneo)")
    lock_txt = (f", espera candado {timings['lock_wait_s']} s"
                if timings.get('lock_wait_s') else '')
    print(f"Tiempo: Whisper {timings['whisper_s']} s, RMS "
          f"{timings['rms_s']} s, puntuación {timings['rank_s']} s, "
          f"total {timings['total_s']} s [{timings['scan_source']}]"
          f"{lock_txt}")
    if chosen:
        m = chosen['metrics']
        print(f"\nELEGIDA: {chosen['start_s']:.2f}-"
              f"{chosen['end_s']:.2f} s ({chosen['score']} pt) — "
              f"mediana {m['median_db']} dBFS, inicio "
              f"{m['start_db']}, cierre {m['end_db']} "
              f"(crecimiento {m['growth_db']:+.1f} dB), respiro máx "
              f"{m['hole_depth_db']} dB")
    else:
        print("\nSIN VENTANA: ninguna candidata pasa "
              "(voz o agujero en todas)")
    print(f"\nTop {args.top} aceptadas:")
    for c in accepted[:args.top]:
        m = c['metrics']
        print(f"  {c['start_s']:7.2f}-{c['end_s']:7.2f} s  "
              f"{c['score']:6.1f} pt  med {m['median_db']:6.1f}  "
              f"ini {m['start_db']:6.1f}  fin {m['end_db']:6.1f}  "
              f"resp {m['hole_depth_db']:4.1f} dB")
    # Rechazadas agrupadas por motivo.
    from collections import Counter
    kinds = Counter()
    for c in rejected:
        for r in c['reasons']:
            kinds['voz (VAD)' if r.startswith('voz (VAD)')
                  else 'agujero' if r.startswith('agujero')
                  else 'voz (sin VAD, --strict)'] += 1
    print(f"\nRechazadas ({len(rejected)}): "
          + ', '.join(f'{k}: {v}' for k, v in kinds.items()))
    for st in args.show:
        hit = [c for c in cands if abs(c['start_s'] - st) < 1e-6]
        if not hit:
            print(f"\n--show {st}: sin candidata (fuera de rango)")
            continue
        c = hit[0]
        print(f"\n--show {st}: {c['start_s']:.2f}-{c['end_s']:.2f} s "
              f"{c['status'].upper()} ({c['score']} pt)")
        for r in c['reasons']:
            print(f"  RECHAZO: {r}")
        for n in c['notes']:
            print(f"  nota: {n}")
    return 0 if chosen else 1


if __name__ == '__main__':
    raise SystemExit(main())
