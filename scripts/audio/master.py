#!/usr/bin/env python3
"""Máster + ligera de un reel desde el render de Remotion.

Receta probada de Marabana V1.3 (render-chunks.sh):

  MÁSTER (1080×1920, CRF 19): el video ya viene codificado a CRF 19
  desde el render, así que se COPIA sin recodificar (los chunks se
  concatenan con -c:v copy). El audio se recodifica con la cadena:
    atrim=start=0.04 + asetpts   (el render por tramos deja 40 ms de
                                  silencio digital al inicio)
    atempo=X (opcional)          (compensa la DERIVA A/V del render
                                  por tramos: cada frontera de chunk
                                  añade ~57 ms de audio — 8 fronteras
                                  en marti-fidel V2.2/V2.3 = +0,46 s
                                  al final; atempo 1,0082 lo compensa
                                  (tempo > 1 = más rápido = más corto);
                                  medir el lag por ventana antes de
                                  usarlo — ver CREATIVE_BRIEF V2.3)
    volume +6 dB -> 0 dB en los primeros 100 ms (el pipeline atenúa
                                  ~3-4 dB el arranque; sin el realce,
                                  los primeros 100 ms miden -22,4 dBFS)
    alimiter=limit=0.79          (techo de true peak CALIBRADO: con
                                  0.84 el máster V1.2 medía -1,27 dBTP
                                  porque el sobreimpulso inter-muestra
                                  del disparo supera el techo de -1,5
                                  dBTP pedido; con 0.79 queda ~-1,6 dBTP;
                                  V1.3 midió -1,99 dBTP)
    AAC 192k, 48 kHz, faststart
  LIGERA (720×1280): un solo paso desde el máster — scale 720:1280,
  libx264 CRF 26, AAC 128k, faststart. Es la que se adjunta en el chat.

Uso:
  .venv/bin/python scripts/audio/master.py --chunks-dir out/chunks \\
      --out-master out/REEL_MASTER.mp4 --out-light out/REEL_LIGERO.mp4
  .venv/bin/python scripts/audio/master.py --input render.mp4 \\
      --out-master out/MASTER.mp4 --out-light out/LIGERO.mp4 --no-trim

Verifica al final: fotogramas del máster (ffprobe) y sonoridad/true peak
(ebur128) de ambas salidas; escribe un informe JSON junto al máster.

Proyectos MUDOS (sin audio, deliberado): si la entrada no tiene pista
de audio, el máster y la ligera se escriben solo con video (sin cadena
de audio) y el informe declara `"audio": "absent"` con
`integrated_lufs`/`true_peak_dbtp` en null — sin crash en ebur128.
"""
import argparse
import glob
import json
import os
import re
import subprocess
import sys

DEFAULT_LIMITER = 0.79
DEFAULT_TRIM_START = 0.04  # s de silencio digital al inicio (chunked render)
DEFAULT_BOOST_DB = 6.0
DEFAULT_BOOST_MS = 100
DEFAULT_LIGHT_CRF = 26
DEFAULT_LIGHT_WIDTH = 720


def run(cmd: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, check=True, capture_output=True, text=True)


def probe(path: str) -> dict:
    out = run(["ffprobe", "-v", "error", "-count_frames",
               "-show_entries",
               "stream=codec_type,codec_name,width,height,avg_frame_rate,nb_read_frames",
               "-show_entries", "format=duration,size",
               "-of", "json", path]).stdout
    return json.loads(out)


def ebur128(path: str) -> tuple[float, float]:
    out = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", path,
         "-af", "ebur128=peak=true", "-f", "null", "-"],
        capture_output=True, text=True, check=True, timeout=300,
    ).stderr
    summary = out[out.rfind("Summary:"):]
    def val(key: str) -> float:
        m = re.search(key + r"\s*:\s*([-+]?[\d.]+)", summary)
        if not m:
            raise RuntimeError(f"ebur128: no se encontró {key} en {path}")
        return float(m.group(1))
    return val("I"), val("Peak")


def has_audio(path: str) -> bool:
    """True si el archivo tiene al menos una pista de audio."""
    pr = probe(path)
    return any(s.get("codec_type") == "audio" for s in pr.get("streams", []))


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    src = p.add_mutually_exclusive_group(required=True)
    src.add_argument("--input", help="Video renderizado (un solo archivo)")
    src.add_argument("--chunks-dir",
                     help="Carpeta con chunk_*.mp4 (render por tramos)")
    p.add_argument("--out-master", required=True)
    p.add_argument("--out-light", required=True)
    p.add_argument("--report", help="Informe JSON (por defecto <máster>.json)")
    p.add_argument("--limiter", type=float, default=DEFAULT_LIMITER,
                   help="alimiter limit (0.79 calibrado, V1.2)")
    p.add_argument("--trim-start", type=float, default=DEFAULT_TRIM_START,
                   help="Recorte de silencio inicial en s (0 para no recortar)")
    p.add_argument("--atempo", type=float, default=1.0,
                   help="Factor atempo para compensar la deriva A/V del "
                   "render por tramos (1.0 = sin cambio; tempo > 1 = más "
                   "rápido = más corto; marti-fidel V2.3: 1.0082 medido "
                   "por correlación de forma de onda en 8 puntos — el lag "
                   "audio-vídeo crecía ~0,0082 s/s hasta +0,35 s al final)")
    p.add_argument("--boost-db", type=float, default=DEFAULT_BOOST_DB,
                   help="Realce inicial en dB (0 para no realzar)")
    p.add_argument("--boost-ms", type=float, default=DEFAULT_BOOST_MS,
                   help="Duración del realce inicial en ms")
    p.add_argument("--no-trim", action="store_true",
                   help="Sin recorte de 40 ms (render de un solo pase)")
    p.add_argument("--no-boost", action="store_true",
                   help="Sin realce de arranque")
    p.add_argument("--light-crf", type=int, default=DEFAULT_LIGHT_CRF)
    p.add_argument("--light-width", type=int, default=DEFAULT_LIGHT_WIDTH)
    p.add_argument("--force", action="store_true")
    a = p.parse_args()

    if a.no_trim:
        a.trim_start = 0.0
    if a.no_boost:
        a.boost_db = 0.0
    for out in (a.out_master, a.out_light):
        if os.path.exists(out) and not a.force:
            p.error(f"la salida ya existe: {out} (usa --force)")
        os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    report = a.report or (a.out_master + ".json")

    # Entrada: concat de chunks o archivo único.
    concat_list = None
    if a.chunks_dir:
        chunks = sorted(glob.glob(os.path.join(a.chunks_dir, "chunk_*.mp4")))
        if not chunks:
            p.error(f"sin chunk_*.mp4 en {a.chunks_dir}")
        concat_list = os.path.join(a.chunks_dir, "list.txt")
        with open(concat_list, "w", encoding="utf-8") as f:
            for c in chunks:
                f.write(f"file '{os.path.abspath(c)}'\n")
        src_args = ["-f", "concat", "-safe", "0", "-i", concat_list]
        print(f"{len(chunks)} chunks -> máster")
        input_has_audio = has_audio(chunks[0])
    else:
        if not os.path.isfile(a.input):
            p.error(f"falta el archivo {a.input}")
        src_args = ["-i", a.input]
        input_has_audio = has_audio(a.input)
    if not input_has_audio:
        print("Entrada SIN audio: máster y ligera mudos (sin cadena de "
              "audio; el informe lo declarará)")

    # Cadena de audio del máster (receta V1.3). Solo si hay audio.
    af = []
    if a.trim_start > 0:
        af.append(f"atrim=start={a.trim_start},asetpts=PTS-STARTPTS")
    if a.atempo != 1.0:
        # Compensación de la deriva A/V (antes del boost/limitador:
        # el limitador va último para cazar cualquier sobreimpulso
        # del resampleo). El factor se mide por render, no es una
        # constante del pipeline (depende del nº de chunks).
        af.append(f"atempo={a.atempo}")
    if a.boost_db > 0:
        t = a.boost_ms / 1000.0
        af.append(
            f"volume='if(lt(t,{t}),pow(10,{a.boost_db}*(1-t/{t})/20),1)':eval=frame"
        )
    af.append(f"alimiter=limit={a.limiter}:attack=5:release=50:level=false")
    af_str = ",".join(af)

    master_cmd = ["ffmpeg", "-y", "-v", "error", *src_args, "-c:v", "copy"]
    if input_has_audio:
        master_cmd += ["-af", af_str, "-c:a", "aac", "-b:a", "192k",
                       "-ar", "48000"]
    master_cmd += ["-movflags", "+faststart", a.out_master]
    run(master_cmd)
    print(f"MÁSTER: {a.out_master} ({os.path.getsize(a.out_master)} bytes)")

    light_h = a.light_width * 16 // 9  # 720 -> 1280 (vertical 9:16)
    light_cmd = ["ffmpeg", "-y", "-v", "error", "-i", a.out_master,
                 "-vf", f"scale={a.light_width}:{light_h}",
                 "-c:v", "libx264", "-crf", str(a.light_crf),
                 "-preset", "medium", "-pix_fmt", "yuv420p"]
    if input_has_audio:
        light_cmd += ["-c:a", "aac", "-b:a", "128k", "-ar", "48000"]
    light_cmd += ["-movflags", "+faststart", a.out_light]
    run(light_cmd)
    print(f"LIGERA: {a.out_light} ({os.path.getsize(a.out_light)} bytes)")

    res: dict = {"master": a.out_master, "light": a.out_light,
                 "limiter": a.limiter, "trim_start": a.trim_start,
                 "atempo": a.atempo, "boost_db": a.boost_db,
                 "audio": "present" if input_has_audio else "absent"}
    for key, path in (("master", a.out_master), ("light", a.out_light)):
        pr = probe(path)
        vid = next(s for s in pr["streams"] if s["codec_type"] == "video")
        out_has_audio = any(s.get("codec_type") == "audio"
                            for s in pr["streams"])
        entry = {
            "path": path,
            "bytes": int(pr["format"]["size"]),
            "duration": float(pr["format"]["duration"]),
            "width": vid["width"],
            "height": vid["height"],
            "frames": int(vid["nb_read_frames"]),
            "has_audio": out_has_audio,
            "integrated_lufs": None,
            "true_peak_dbtp": None,
        }
        if out_has_audio:
            lufs, tp = ebur128(path)
            entry["integrated_lufs"] = lufs
            entry["true_peak_dbtp"] = tp
            print(f"  {key}: {entry['frames']} f, {lufs:.2f} LUFS, "
                  f"TP {tp:.2f} dBTP")
        else:
            print(f"  {key}: {entry['frames']} f, sin audio "
                  f"(proyecto mudo)")
        res[key] = entry
    with open(report, "w", encoding="utf-8") as f:
        json.dump(res, f, indent=2, ensure_ascii=False)
    print(f"Informe: {report}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
