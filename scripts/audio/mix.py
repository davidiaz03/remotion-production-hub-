#!/usr/bin/env python3
"""Mezcla compartida del hub: VO + música (con ducking) + SFX opcionales
-> WAV 48 kHz con sonoridad controlada, medido sobre el resultado.

Adapta modules/mix_audio.py del Studio (ducking sidechain + loudnorm) con
tres cambios:

1) CALIBRACIÓN REAL: el objetivo final por defecto es I=-14.5 LUFS
   (no el -16 teórico del Studio). Los másteres reales miden: Marabana
   V1.3 -14,28 LUFS, V1.2 -14,02 LUFS, referente Maxi Rubio -14,33 LUFS.
   Un objetivo de -16 dejaría los reels ~1,5 LUFS por debajo de nuestros
   mejores másteres. El gate de QA (scripts/qa-media.mjs) acepta
   [-16,5, -12,0] LUFS.
2) Música por secciones: --section ARCHIVO@INICIO@FIN (repetible) con
   crossfades, o un único --music ya mezclado (p. ej. la salida de
   gen-music.py o una pista de Flow Music).
3) SFX opcionales: --sfx ARCHIVO@SEGUNDO (repetible); los SFX NO se
   duckean (son acentos) y entran a pleno nivel en su punto de sincronía.

Cadena (ffmpeg, dos pases: mezcla en filter_complex + normalización de
duración en cadena de una sola entrada — ver nota en el código):
  VO:    aresample 48k -> highpass 70 Hz -> loudnorm I=-18 TP=-2 LRA=9
         -> asplit (mezcla + sidechain)
  música: aresample 48k -> volume 0.32 -> [sidechaincompress bajo la VO:
         threshold 0.018, ratio 7, attack 20 ms, release 420 ms por
         defecto (--duck-release lo ajusta; 150-200 ms para que la
         música vuelva antes tras cada frase)]
  mezcla: amix (VO + música duckeada + SFX) -> alimiter 0.89
         -> loudnorm I=-14.5 TP=-1.5 LRA=8 -> WAV 48 kHz s16le

LOUDNORM DINÁMICO vs DIPS (22-nov-2026, negacion-embargo): el
loudnorm de un solo pase es DINÁMICO: sube los pasajes tranquilos
para alcanzar el objetivo. Si la cama lleva dips horneados (panel
-6 dB, giro -12 dB), el loudnorm los DESHACE en la mezcla (medido:
el giro de -12 dB quedó en 0 dB netos; el panel de -6 dB en 0-3 dB).
--two-pass (loudnorm LINEAL) solo funciona si el objetivo es
alcanzable linealmente (ganancia necesaria <= TP_objetivo - TP_entrada);
si no, ffmpeg vuelve a modo dinámico aunque se pida linear=true
(medido: con TP de entrada -0,82 y objetivo -14,5, el two-pass salió
dinámico y los dips se borraron igual). La vía fiable cuando los
picos de SFX impiden el lineal es --fixed-gain: mide la mezcla,
aplica una ganancia CONSTANTE (objetivo - I_entrada) y un limitador
de seguridad (0,8, level=false). Ganancia constante = dips exactos;
el limitador solo toca los transitorios de SFX que excedan el techo.
Verificado en negacion-embargo: con --fixed-gain los dips medidos en
la mezcla coinciden con los horneados.

Salida: WAV + informe JSON (LUFS/TP medidos con ebur128, SHA256 de
entradas y salida, comando ffmpeg). Por defecto se niega a sobrescribir
(como el Studio); --force lo permite.

Si la mezcla sale en silencio digital (VO y música silenciosas), NO se
aborta: se escribe el WAV y el informe con ``silent: true``,
``status: PASS_SILENT`` e ``integrated_lufs``/``true_peak_dbtp`` en
null, y un aviso por stderr. (Antes, ebur128() lanzaba RuntimeError al
no encontrar el pico "-inf" y el informe no se escribía.)

Uso:
  .venv/bin/python scripts/audio/mix.py --voice public/audio/vo.wav \\
      --music public/audio/music-ai.wav --seconds 47.97 \\
      --out public/audio/mix.wav
  .venv/bin/python scripts/audio/mix.py --voice vo.wav \\
      --section A.wav@0@13.27 --section B.wav@11.77@36.9 \\
      --sfx sting.wav@44.9 --seconds 48 --out mix.wav --report mix.json
"""
import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import time

# Objetivos calibrados con los másteres reales (ver cabecera).
DEFAULT_TARGET_LUFS = -14.5
DEFAULT_TARGET_TP = -1.5
DEFAULT_TARGET_LRA = 8
DEFAULT_VOICE_LUFS = -18.0
DEFAULT_MUSIC_VOLUME = 0.32
DEFAULT_DUCK_RELEASE = 420  # ms; V1.4 del reel marti-fidel usa 180 ms
DEFAULT_DUCK_THRESHOLD = 0.018  # Studio; marti-fidel V1.5 usa 0.08
DEFAULT_DUCK_RATIO = 7.0  # Studio; marti-fidel V1.5 usa 5
DEFAULT_XFADE = 1.5  # s, crossfade entre secciones de música
DEFAULT_LIMITER = 0.89


def sha256(path: str) -> str:
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


def parse_section(spec: str) -> tuple[str, float, float]:
    """ARCHIVO@INICIO@FIN (segundos)."""
    try:
        path, start, end = spec.rsplit("@", 2)
        return path, float(start), float(end)
    except ValueError:
        raise argparse.ArgumentTypeError(
            f"sección inválida {spec!r}: formato ARCHIVO@INICIO@FIN"
        )


def parse_sfx(spec: str) -> tuple[str, float]:
    """ARCHIVO@SEGUNDO."""
    try:
        path, at = spec.rsplit("@", 1)
        return path, float(at)
    except ValueError:
        raise argparse.ArgumentTypeError(
            f"SFX inválido {spec!r}: formato ARCHIVO@SEGUNDO"
        )


def ebur128(path: str) -> tuple[float, float]:
    """(LUFS integrados, true peak dBTP) medidos con ebur128.

    En silencio digital, ffmpeg imprime ``Peak: -inf dBFS`` (y la I
    queda en el suelo de medida, -70,0 LUFS): se devuelve
    ``float('-inf')`` para el pico en vez de lanzar RuntimeError; el
    llamador decide cómo registrarlo (ver ``main``).
    """
    out = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", path,
         "-af", "ebur128=peak=true", "-f", "null", "-"],
        capture_output=True, text=True, check=True, timeout=120,
    ).stderr
    summary = out[out.rfind("Summary:"):]
    def val(key: str) -> float:
        m = re.search(key + r"\s*:\s*(-inf|[-+]?[\d.]+)", summary)
        if not m:
            raise RuntimeError(f"ebur128: no se encontró {key} en {path}")
        return float(m.group(1))
    return val("I"), val("Peak")


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--voice", required=True, help="VO (WAV)")
    p.add_argument("--music", help="Música ya mezclada (un solo archivo)")
    p.add_argument("--section", action="append", default=[],
                   type=parse_section,
                   help="Sección de música ARCHIVO@INICIO@FIN (repetible)")
    p.add_argument("--sfx", action="append", default=[], type=parse_sfx,
                   help="SFX ARCHIVO@SEGUNDO (repetible, sin ducking)")
    p.add_argument("--seconds", type=float, required=True,
                   help="Duración de la mezcla en segundos")
    p.add_argument("--out", required=True, help="WAV de salida (48 kHz)")
    p.add_argument("--report", help="Informe JSON (por defecto <out>.json)")
    p.add_argument("--target-lufs", type=float, default=DEFAULT_TARGET_LUFS)
    p.add_argument("--target-tp", type=float, default=DEFAULT_TARGET_TP)
    p.add_argument("--target-lra", type=float, default=DEFAULT_TARGET_LRA)
    p.add_argument("--voice-lufs", type=float, default=DEFAULT_VOICE_LUFS)
    p.add_argument("--music-volume", type=float, default=DEFAULT_MUSIC_VOLUME)
    p.add_argument("--duck-release", type=float, default=DEFAULT_DUCK_RELEASE,
                   help="Release del ducking sidechain en ms (420 = Studio; "
                   "150-200 ms devuelve la música antes tras cada frase y "
                   "evita el agujero percibido en las pausas)")
    p.add_argument("--duck-threshold", type=float,
                   default=DEFAULT_DUCK_THRESHOLD,
                   help="Umbral del ducking sidechain (0.018 = Studio; "
                   "subirlo a 0.05-0.08 reduce el bombeo silábico: con "
                   "0.018 la música varía ~20 dB dentro de cada frase; "
                   "con 0.08, ~9 dB — verificado en marti-fidel V1.5)")
    p.add_argument("--duck-ratio", type=float, default=DEFAULT_DUCK_RATIO,
                   help="Ratio del ducking sidechain (7 = Studio; 4-5 "
                   "suaviza la profundidad del ducking)")
    p.add_argument("--xfade", type=float, default=DEFAULT_XFADE,
                   help="Crossfade entre secciones (s)")
    p.add_argument("--end-fade", type=float, default=0.0,
                   help="Fade-out al final de la última sección (s, 0 = ninguno)")
    p.add_argument("--limiter", type=float, default=DEFAULT_LIMITER)
    p.add_argument("--two-pass", action="store_true",
                   help="Loudnorm final LINEAL en dos pases (mide y "
                   "aplica con linear=true): conserva los dips de la "
                   "cama y la dinámica intencional. Solo funciona si "
                   "el objetivo es alcanzable linealmente; si no, "
                   "ffmpeg vuelve a dinámico (ver cabecera).")
    p.add_argument("--fixed-gain", action="store_true",
                   help="Normalización final por GANANCIA CONSTANTE "
                   "en vez de loudnorm: mide la mezcla, aplica "
                   "volume=(objetivo - I_entrada) y un limitador de "
                   "seguridad (0,8, level=false). Conserva los dips "
                   "y la dinámica exactamente; el limitador solo "
                   "toca los transitorios que excedan el techo. "
                   "Tiene prioridad sobre --two-pass.")
    p.add_argument("--force", action="store_true",
                   help="Sobrescribir salida e informe si existen")
    a = p.parse_args()

    if a.music and a.section:
        p.error("--music y --section son excluyentes")
    if not a.music and not a.section:
        p.error("falta la música: --music o al menos un --section")
    if a.seconds < 2 or a.seconds > 1800:
        p.error("seconds fuera de rango (2-1800)")
    for f in [a.voice, a.music] + [s[0] for s in a.section] + [s[0] for s in a.sfx]:
        if f and not os.path.isfile(f):
            p.error(f"falta el archivo {f}")
    report = a.report or (a.out + ".json")
    if not a.force and (os.path.exists(a.out) or os.path.exists(report)):
        p.error("la salida ya existe; usa --force para sobrescribir")

    t0 = time.perf_counter()
    inputs = ["-i", a.voice]
    filt = []
    # NOTA: apad lleva whole_dur={seconds} (no apad solo): sin whole_dur,
    # apad deja de rellenar ~89 ms antes del final (propagación de EOF del
    # grafo tras loudnorm; verificado 15-nov-2026). El atrim posterior
    # recorta las entradas más largas que --seconds.
    # VO (entrada 0): limpieza + nivel + split para el sidechain.
    filt.append(
        f"[0:a]aresample=48000,highpass=f=70,"
        f"loudnorm=I={a.voice_lufs}:TP=-2:LRA=9,"
        f"apad=whole_dur={a.seconds},atrim=0:{a.seconds},asplit=2[v][side]"
    )
    # Música: índice 1..N según secciones o archivo único.
    idx = 1
    music_labels = []
    if a.music:
        inputs += ["-i", a.music]
        filt.append(
            f"[{idx}:a]aresample=48000,volume={a.music_volume},"
            f"apad=whole_dur={a.seconds},atrim=0:{a.seconds}[m]"
        )
        music_labels.append("m")
        idx += 1
    else:
        for j, (path, start, end) in enumerate(a.section):
            inputs += ["-i", path]
            label = f"sec{j}"
            # adelay al inicio + fades en los bordes (crossfade de xfade s
            # con la sección vecina). La primera sección no tiene fade-in
            # y la última no tiene fade-out.
            chain = f"[{idx}:a]aresample=48000,adelay={int(start * 1000)}"
            if start > 0:
                chain += f",afade=t=in:st={start}:d={a.xfade}"
            if j < len(a.section) - 1:
                chain += f",afade=t=out:st={end - a.xfade}:d={a.xfade}"
            elif a.end_fade > 0:
                chain += f",afade=t=out:st={end - a.end_fade}:d={a.end_fade}"
            chain += f",apad=whole_dur={a.seconds},atrim=0:{a.seconds}[{label}]"
            filt.append(chain)
            music_labels.append(label)
            idx += 1
        if len(music_labels) > 1:
            joined = "".join(f"[{lb}]" for lb in music_labels)
            filt.append(
                f"{joined}amix=inputs={len(music_labels)}:duration=first:normalize=0,"
                f"volume={a.music_volume}[m]"
            )
        else:
            filt.append(f"[{music_labels[0]}]volume={a.music_volume}[m]")
    # Ducking de la música bajo la VO (Studio: threshold 0.018, ratio 7).
    filt.append(
        "[m][side]sidechaincompress="
        f"threshold={a.duck_threshold}:ratio={a.duck_ratio}:"
        f"attack=20:release={a.duck_release}[duck]"
    )
    # SFX: adelay a su punto de sincronía, sin ducking.
    sfx_labels = []
    for j, (path, at) in enumerate(a.sfx):
        inputs += ["-i", path]
        label = f"sfx{j}"
        filt.append(
            f"[{idx}:a]aresample=48000,adelay={int(at * 1000)},"
            f"apad=whole_dur={a.seconds},atrim=0:{a.seconds}[{label}]"
        )
        sfx_labels.append(label)
        idx += 1
    # Mezcla final: VO + música duckeada + SFX -> limiter -> loudnorm.
    mix_inputs = "[v][duck]" + "".join(f"[{lb}]" for lb in sfx_labels)
    n_mix = 2 + len(sfx_labels)
    loudnorm_single = (f"loudnorm=I={a.target_lufs}:TP={a.target_tp}:"
                       f"LRA={a.target_lra}")
    # alimiter con level=false (sin auto-level): con el default
    # (level=true) el limitador aplica ganancia de compensación y
    # devuelve los picos hacia 0 dBFS — con limit=0,65 se midió
    # TP 0,00 en vez de -3,7, y la mezcla salía MÁS alta con el
    # limitador más bajo. Sin auto-level el limitador limita de
    # verdad (misma lección que en audit-audio.py).
    filt.append(
        f"{mix_inputs}amix=inputs={n_mix}:duration=first:normalize=0,"
        f"alimiter=limit={a.limiter}:level=false,atrim=0:{a.seconds},"
        f"{loudnorm_single},"
        f"apad=whole_dur={a.seconds},atrim=0:{a.seconds}[mix]"
    )
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    tmp_out = a.out + ".tmp.wav"
    norm_info = {"mode": "single-pass (dynamic)"}
    if a.two_pass or a.fixed_gain:
        # Pase de medida: mismo grafo, loudnorm con print_format=json
        # a null. Necesita -v info (con -v error no se imprime el
        # bloque Parsed_loudnorm).
        loudnorm_measure = loudnorm_single + ":print_format=json"
        filt_measure = ";".join(
            filt[:-1] + [filt[-1].replace(loudnorm_single,
                                          loudnorm_measure)])
        meas = subprocess.run(
            ["ffmpeg", "-y", "-hide_banner", "-v", "info", "-nostdin",
             *inputs, "-filter_complex", filt_measure, "-map", "[mix]",
             "-f", "null", "-"],
            capture_output=True, text=True, check=True, timeout=600)
        m = re.search(r'\{[^{}]*"input_i"[^{}]*\}', meas.stderr)
        if not m:
            print("AVISO: no se pudo medir el loudnorm; se usa el "
                  "pase único (dinámico).", file=sys.stderr)
        elif a.fixed_gain:
            # Ganancia constante = objetivo - I_entrada, + limitador
            # de seguridad 0,8 (-1,94 dBFS; deja margen intermuestra
            # para TP <= -1,5). El limitador solo toca los
            # transitorios que la ganancia empuja sobre el techo.
            d = json.loads(m.group(0))
            gain_db = a.target_lufs - float(d["input_i"])
            norm_info = {
                "mode": "fixed-gain (linear)",
                "measured_input_i": d["input_i"],
                "measured_input_tp": d["input_tp"],
                "gain_db": round(gain_db, 2),
                "safety_limiter": 0.8,
            }
            fixed = (f"volume={gain_db:.2f}dB,"
                     f"alimiter=limit=0.8:level=false")
            filt = filt[:-1] + [filt[-1].replace(loudnorm_single, fixed)]
        else:
            d = json.loads(m.group(0))
            norm_info = {
                "mode": "two-pass (linear)",
                "measured_input_i": d["input_i"],
                "measured_input_tp": d["input_tp"],
                "measured_input_lra": d["input_lra"],
                "measured_input_thresh": d["input_thresh"],
                "target_offset": d["target_offset"],
                "normalization_type": d["normalization_type"],
            }
            loudnorm_linear = (
                f"{loudnorm_single}:"
                f"measured_I={d['input_i']}:"
                f"measured_TP={d['input_tp']}:"
                f"measured_LRA={d['input_lra']}:"
                f"measured_thresh={d['input_thresh']}:"
                f"offset={d['target_offset']}:linear=true")
            filt = filt[:-1] + [filt[-1].replace(loudnorm_single,
                                                 loudnorm_linear)]
    filt_str = ";".join(filt)
    cmd = ["ffmpeg", "-y", "-hide_banner", "-v", "error", "-nostdin", *inputs,
           "-filter_complex", filt_str, "-map", "[mix]",
           "-c:a", "pcm_s16le", tmp_out]
    subprocess.run(cmd, check=True, timeout=600)
    # Segundo pase — normalización de duración (cadena de UNA sola
    # entrada): dentro del filter_complex multi-entrada, apad=whole_dur
    # no alcanza la duración exacta (~89 ms corto: el grafo termina al
    # agotarse las entradas y la cola de silencio de apad no se consume
    # entera). En una cadena de una sola entrada es exacto (verificado
    # 15-nov-2026). PCM->PCM: sin pérdida, solo añade silencio al final.
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-v", "error", "-nostdin",
                    "-i", tmp_out, "-af",
                    f"apad=whole_dur={a.seconds},atrim=0:{a.seconds}",
                    "-c:a", "pcm_s16le", a.out],
                   check=True, timeout=600)
    os.remove(tmp_out)

    lufs, tp = ebur128(a.out)
    # Silencio digital: ebur128 devuelve Peak=-inf y la I queda en el
    # suelo de medida (-70,0 LUFS), que no es una medida real. La mezcla
    # es un WAV válido (p. ej. un tramo sin VO ni música todavía), así
    # que NO se aborta: se escribe el informe con LUFS/TP en null y el
    # aviso explícito, y se sale con código 0. Antes de este fix,
    # ebur128() lanzaba RuntimeError y no se escribía el informe.
    silent = tp == float("-inf")
    if silent:
        print("AVISO: la mezcla es silencio digital (VO y música en "
              "silencio); LUFS/TP sin medida. Se escribe el WAV y el "
              "informe con silent=true.", file=sys.stderr)
    dur = float(json.loads(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "json", a.out]))["format"]["duration"])
    res = {
        "status": "PASS_SILENT" if silent else "PASS_REAL",
        "silent": silent,
        "mix_seconds": a.seconds,
        "duration_observed": dur,
        "integrated_lufs": None if silent else lufs,
        "true_peak_dbtp": None if silent else tp,
        "target_lufs": a.target_lufs,
        "target_tp": a.target_tp,
        "normalization": norm_info,
        "voice_sha256": sha256(a.voice),
        "music_sha256": [sha256(s[0]) for s in a.section] if a.section
                        else sha256(a.music),
        "sfx_sha256": [sha256(s[0]) for s in a.sfx],
        "output_sha256": sha256(a.out),
        "elapsed_seconds": round(time.perf_counter() - t0, 3),
        "command": cmd,
        "editorial_listening": "PENDING",
    }
    os.makedirs(os.path.dirname(os.path.abspath(report)), exist_ok=True)
    with open(report, "w", encoding="utf-8") as f:
        json.dump(res, f, indent=2, ensure_ascii=False)
    print(json.dumps({k: v for k, v in res.items() if k != "command"}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
