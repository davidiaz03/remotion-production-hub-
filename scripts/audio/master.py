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

Audio PCM (V4.1, 20-nov-2026): desde que render-chunks.mjs usa
--audio-codec pcm-16 por defecto, el concat de tramos es exacto a la
muestra (deriva 0 ms, sin agujeros de frontera) y el máster NO
necesita ni recorte inicial (no hay priming AAC), ni atempo (no hay
deriva), ni realce de arranque (no hay fade-in del AAC): usar
--clean-audio (equivale a --no-trim --no-boost, sin --atempo).
Con tramos AAC antiguos (.mp4) la receta V1.3 sigue vigente (trim
0,04 + atempo medido + boost), PERO el máster resultante conserva
los agujeros de frontera de 34-55 ms que el AAC inyecta en cada
tramo (13 en marti-fidel V4, medidos 20-nov-2026): no usar AAC para
renders nuevos.

Mezcla externa (hub-speed-v5, 21-nov-2026): con --mix <wav> el audio
del máster NO sale del render sino de la mezcla indicada (típico:
tramos vídeo-solo de render-chunks --video-only). La mezcla es
fresca (sin priming ni deriva de tramos), así que --mix aplica por
defecto la cadena limpia (sin trim, sin atempo, sin boost; solo el
limitador), igual que --clean-audio; --trim-start/--atempo/--boost-db
explícitos siguen funcionando si se necesitan. La mezcla se ajusta
a la duración del video (apad+atrim: si es más corta se rellena con
silencio, si es más larga se recorta). Si la entrada de video trae
audio, se ignora (aviso) y manda --mix.
TRATAMIENTO DE LA MEZCLA (medido, no asumido — marti-fidel V5):
Remotion convierte una mezcla MONO en estéreo dual-mono a −3,01 dB
por canal (×0,7071; L==R bit a bit) y remuestrea a 48 kHz; --mix
reproduce ese tratamiento exacto (pan con 1/√2 + aresample 48k),
así que el máster con --mix suena igual que el de tramos con audio.
Una mezcla estéreo pasa tal cual. La V5 además llevaba +0,6 dB de
ganancia manual (marti-fidel-v5-chunks-gain.mkv, paso no documentado
en el proyecto; medido: concat-gain = concat × +0,60 dB): --gain-db
lo reproduce en un solo paso, sin archivo intermedio.
Verificación en docs/HUB-SPEED-V5-RENDER.md: el máster con --mix
reproduce el audio del máster V5 (misma mezcla, mismo limitador)
con lag 0 y sin deriva; el limitador retrasa el audio 5 ms
constantes (attack=5) en AMBAS vías, igual que en V5.

--no-light / --draft: omite la ligera (útil para borradores y para
másters de prueba; la ligera se puede generar después desde el
máster con encode-delivery.mjs).

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
               "stream=codec_type,codec_name,width,height,avg_frame_rate,nb_read_frames,channels,sample_rate",
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


def format_duration(path: str) -> float:
    """Duración (s) de un archivo, sin contar fotogramas (rápido)."""
    out = run(["ffprobe", "-v", "error",
               "-show_entries", "format=duration",
               "-of", "json", path]).stdout
    return float(json.loads(out)["format"]["duration"])


def concat_duration(chunks: list[str]) -> float:
    """Duración total (s) de una lista de tramos.

    El demuxer concat no reporta duración total (ffprobe no devuelve
    format.duration sobre la lista), así que se suman las duraciones
    de cada tramo (probe ligero, sin contar fotogramas).
    """
    return sum(format_duration(c) for c in chunks)


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    src = p.add_mutually_exclusive_group(required=True)
    src.add_argument("--input", help="Video renderizado (un solo archivo)")
    src.add_argument("--chunks-dir",
                     help="Carpeta con chunk_*.mp4 o chunk_*.mkv "
                     "(render por tramos)")
    p.add_argument("--mix",
                   help="Mezcla externa (WAV) para el máster: el audio "
                   "NO sale del render sino de este archivo (para "
                   "tramos vídeo-solo de render-chunks --video-only). "
                   "Cadena limpia por defecto (sin trim/atempo/boost).")
    p.add_argument("--out-master", required=True)
    p.add_argument("--out-light",
                   help="Ligera 720p (obligatoria salvo --no-light "
                   "o --draft)")
    p.add_argument("--no-light", action="store_true",
                   help="No generar la ligera (solo máster)")
    p.add_argument("--draft", action="store_true",
                   help="Borrador: equivale a --no-light")
    p.add_argument("--report", help="Informe JSON (por defecto <máster>.json)")
    p.add_argument("--limiter", type=float, default=DEFAULT_LIMITER,
                   help="alimiter limit (0.79 calibrado, V1.2)")
    p.add_argument("--trim-start", type=float, default=None,
                   help="Recorte de silencio inicial en s (defecto: "
                   "0.04 sin --mix; 0.0 con --mix o --clean-audio)")
    p.add_argument("--atempo", type=float, default=None,
                   help="Factor atempo para compensar la deriva A/V del "
                   "render por tramos (1.0 = sin cambio; tempo > 1 = más "
                   "rápido = más corto; marti-fidel V2.3: 1.0082 medido "
                   "por correlación de forma de onda en 8 puntos — el lag "
                   "audio-vídeo crecía ~0,0082 s/s hasta +0,35 s al final; "
                   "defecto 1.0 con --mix o --clean-audio)")
    p.add_argument("--boost-db", type=float, default=None,
                   help="Realce inicial en dB (defecto: 6.0 sin --mix; "
                   "0.0 con --mix o --clean-audio)")
    p.add_argument("--boost-ms", type=float, default=DEFAULT_BOOST_MS,
                   help="Duración del realce inicial en ms")
    p.add_argument("--gain-db", type=float, default=0.0,
                   help="Ganancia global en dB antes del limitador "
                   "(p. ej. 0.6 para reproducir el paso manual "
                   "chunks-gain de marti-fidel V5)")
    p.add_argument("--no-trim", action="store_true",
                   help="Sin recorte de 40 ms (render de un solo pase)")
    p.add_argument("--no-boost", action="store_true",
                   help="Sin realce de arranque")
    p.add_argument("--clean-audio", action="store_true",
                   help="Audio sin priming AAC (tramos PCM de "
                   "render-chunks o mezcla fresca): sin recorte "
                   "inicial ni realce de arranque; no combinar con "
                   "--atempo distinto de 1.0 (no hay deriva que "
                   "compensar)")
    p.add_argument("--light-crf", type=int, default=DEFAULT_LIGHT_CRF)
    p.add_argument("--light-width", type=int, default=DEFAULT_LIGHT_WIDTH)
    p.add_argument("--force", action="store_true")
    a = p.parse_args()

    # Resolución de la cadena de audio: los defectos dependen de la
    # fuente (una mezcla fresca no tiene priming ni deriva que
    # corregir; el audio de tramos AAC sí). --no-trim/--no-boost
    # fuerzan 0 aunque se haya pasado un valor explícito.
    if a.draft:
        a.no_light = True
    if a.no_light and a.out_light:
        p.error("--no-light/--draft no admite --out-light")
    if not a.no_light and not a.out_light:
        p.error("--out-light es obligatorio salvo --no-light o --draft")
    if a.mix and not os.path.isfile(a.mix):
        p.error(f"falta la mezcla {a.mix}")
    if a.clean_audio and a.atempo not in (None, 1.0):
        p.error("--clean-audio no admite --atempo distinto de 1.0 "
                "(con audio PCM no hay deriva que compensar)")
    if a.clean_audio:
        a.trim_start = 0.0
        a.boost_db = 0.0
        a.atempo = 1.0
    elif a.mix:
        # Mezcla externa fresca: cadena limpia salvo valores explícitos.
        if a.trim_start is None:
            a.trim_start = 0.0
        if a.boost_db is None:
            a.boost_db = 0.0
        if a.atempo is None:
            a.atempo = 1.0
    else:
        if a.trim_start is None:
            a.trim_start = DEFAULT_TRIM_START
        if a.boost_db is None:
            a.boost_db = DEFAULT_BOOST_DB
        if a.atempo is None:
            a.atempo = 1.0
    if a.no_trim:
        a.trim_start = 0.0
    if a.no_boost:
        a.boost_db = 0.0
    outs = [a.out_master] + ([] if a.no_light else [a.out_light])
    for out in outs:
        if os.path.exists(out) and not a.force:
            p.error(f"la salida ya existe: {out} (usa --force)")
        os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    report = a.report or (a.out_master + ".json")

    # Entrada: concat de chunks o archivo único.
    concat_list = None
    video_duration = None
    if a.chunks_dir:
        chunks = sorted(
            glob.glob(os.path.join(a.chunks_dir, "chunk_*.mp4"))
            + glob.glob(os.path.join(a.chunks_dir, "chunk_*.mkv")))
        if not chunks:
            p.error(f"sin chunk_*.mp4 ni chunk_*.mkv en {a.chunks_dir}")
        concat_list = os.path.join(a.chunks_dir, "list.txt")
        with open(concat_list, "w", encoding="utf-8") as f:
            for c in chunks:
                f.write(f"file '{os.path.abspath(c)}'\n")
        src_args = ["-f", "concat", "-safe", "0", "-i", concat_list]
        print(f"{len(chunks)} chunks -> máster")
        input_has_audio = has_audio(chunks[0])
        if a.mix:
            video_duration = concat_duration(chunks)
    else:
        if not os.path.isfile(a.input):
            p.error(f"falta el archivo {a.input}")
        src_args = ["-i", a.input]
        input_has_audio = has_audio(a.input)
        if a.mix:
            video_duration = float(probe(a.input)["format"]["duration"])
    # Fuente de audio: la mezcla externa manda sobre el audio del
    # render (típico: tramos vídeo-solo). Sin --mix ni audio en la
    # entrada, el máster es mudo (proyecto sin audio, deliberado).
    if a.mix and input_has_audio:
        print("AVISO: la entrada trae audio; se ignora y se usa --mix")
    audio_source = "mix" if a.mix else ("input" if input_has_audio else "none")
    if audio_source == "none":
        print("Entrada SIN audio: máster y ligera mudos (sin cadena de "
              "audio; el informe lo declarará)")
    elif audio_source == "mix":
        print(f"Audio desde la mezcla: {a.mix} "
              f"(video {video_duration:.3f} s)")

    # Cadena de audio del máster (receta V1.3). Solo si hay audio.
    af = []
    mix_info = None
    if audio_source == "mix":
        # Tratamiento de la mezcla = el que Remotion aplica al
        # renderizarla en los tramos (medido en marti-fidel V5):
        # remuestreo a 48 kHz + mono -> estéreo dual-mono a -3,01 dB
        # por canal (x 0,7071 = 1/sqrt(2); L==R bit a bit). Sin este
        # paso el máster saldría mono (la mezcla V5 es mono 192 kHz)
        # y 3 dB más bajo por canal que el máster de tramos.
        mix_probe = probe(a.mix)
        mix_audio = next((s for s in mix_probe.get("streams", [])
                          if s.get("codec_type") == "audio"), None)
        if mix_audio is None:
            p.error(f"la mezcla no tiene pista de audio: {a.mix}")
        mix_ch = int(mix_audio.get("channels", 0))
        mix_sr = int(mix_audio.get("sample_rate", 0))
        if mix_ch > 2:
            p.error(f"mezcla con {mix_ch} canales: no soportada "
                    "(bajar a estéreo o mono antes)")
        mix_info = {"channels": mix_ch, "sample_rate": mix_sr}
        print(f"Mezcla: {mix_ch} canal(es), {mix_sr} Hz")
        if mix_sr != 48000:
            af.append("aresample=48000")
        if mix_ch == 1:
            af.append("pan=stereo|c0=0.70710678*c0|c1=0.70710678*c0")
        # La mezcla se ajusta a la duración del video: si es más
        # corta se rellena con silencio (la mezcla V5 dura 69,23 s
        # y el video 69,233 s: 3 ms de cola); si es más larga se
        # recorta para no alargar el máster.
        af.append(f"apad=whole_dur={video_duration:.3f}")
        af.append(f"atrim=0:{video_duration:.3f}")
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
    if a.gain_db != 0.0:
        af.append(f"volume={a.gain_db}dB")
    af.append(f"alimiter=limit={a.limiter}:attack=5:release=50:level=false")
    af_str = ",".join(af)

    master_cmd = ["ffmpeg", "-y", "-v", "error", *src_args]
    if audio_source == "mix":
        master_cmd += ["-i", a.mix]
    master_cmd += ["-c:v", "copy"]
    if audio_source == "mix":
        master_cmd += ["-map", "0:v", "-af", af_str, "-map", "1:a",
                       "-c:a", "aac", "-b:a", "192k", "-ar", "48000"]
    elif audio_source == "input":
        master_cmd += ["-af", af_str, "-c:a", "aac", "-b:a", "192k",
                       "-ar", "48000"]
    master_cmd += ["-movflags", "+faststart", a.out_master]
    run(master_cmd)
    print(f"MÁSTER: {a.out_master} ({os.path.getsize(a.out_master)} bytes)")

    if not a.no_light:
        light_h = a.light_width * 16 // 9  # 720 -> 1280 (vertical 9:16)
        light_cmd = ["ffmpeg", "-y", "-v", "error", "-i", a.out_master,
                     "-vf", f"scale={a.light_width}:{light_h}",
                     "-c:v", "libx264", "-crf", str(a.light_crf),
                     "-preset", "medium", "-pix_fmt", "yuv420p"]
        if audio_source != "none":
            light_cmd += ["-c:a", "aac", "-b:a", "128k", "-ar", "48000"]
        light_cmd += ["-movflags", "+faststart", a.out_light]
        run(light_cmd)
        print(f"LIGERA: {a.out_light} ({os.path.getsize(a.out_light)} bytes)")

    res: dict = {"master": a.out_master,
                 "light": a.out_light if not a.no_light else None,
                 "limiter": a.limiter, "trim_start": a.trim_start,
                 "atempo": a.atempo, "boost_db": a.boost_db,
                 "clean_audio": a.clean_audio,
                 "mix": a.mix,
                 "mix_info": mix_info,
                 "gain_db": a.gain_db,
                 "audio_source": audio_source,
                 "audio": "present" if audio_source != "none" else "absent"}
    outs = [("master", a.out_master)]
    if not a.no_light:
        outs.append(("light", a.out_light))
    for key, path in outs:
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
