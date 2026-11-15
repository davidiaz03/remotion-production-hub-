# EDIT_NOTES.md — Reel Marabana V1

Notas de edición para quien retome este proyecto (el usuario graba su voz,
o se hace una V2). Todo lo reproducible está en `scripts/`; este documento
dice QUÉ hacer y en QUÉ orden.

## Pistas de audio (separadas, por diseño)

| Pista | Archivo | Contenido | Nivel |
|---|---|---|---|
| Voz en off (PREVIEW) | `public/audio/vo-preview.wav` | Narración Piper (es_MX-ald-medium), 40,89 s | −14 LUFS, 48 kHz estéreo |
| Música original IA | `public/audio/music-ai.wav` | MusicGen-small, 3 secciones, 41,5 s | −16 LUFS, 48 kHz |
| Música Flow (fallback) | `public/audio/music.wav` | Flow editado, 40 s | −14 LUFS, 48 kHz |
| Audio del sting | `public/audio/sting.wav` | Disparo del cierre oficial, 6 s | Original |

La VO y la música son pistas SEPARADAS en la composición (`VoiceOverInner` y
`MusicInner` en `src/Video.tsx`). Al sustituir la VO no hay que regenerar
nada de música: solo la pista de voz y su temporización. El ducking
(`musicVolume` en `Video.tsx`, a partir de `VO_LINES` en `src/timeline.ts`)
baja la música a 0,25 mientras habla la voz.

## Sustituir la VO de previsualización por la grabación del usuario

**La grabación del usuario es la voz DEFINITIVA.** La de Piper es solo un
placeholder para previsualizar ritmo y montaje. Procedimiento exacto:

### 1. Grabar
- Guion en `VO_SCRIPT.md` (10 líneas, tono conversacional, pausas marcadas
  con `…` en las líneas 4 y 9). Leer a ritmo natural de reel: objetivo
  ~40 s. No hace falta claqueta: los silencios entre líneas los marca el
  montaje, pero conviene dejar ~0,3 s de aire entre frases.
- Grabar en un lugar silencioso, teléfono cerca de la boca, formato WAV o
  MP3 (da igual: se convierte). Si hay ruido de fondo, limpiarlo con
  DeepFilterNet como en Pilar V30 (ver `remotion-hub/README.md`).

### 2. Sustituir el archivo
```bash
# Convertir la grabación a WAV 48 kHz estéreo y normalizarla a -14 LUFS
# (mismo tratamiento que la preview; el script prep-vo.sh trabaja sobre
# public/audio/vo-preview.wav, así que primero se copia encima):
cp <grabacion-del-usuario> public/audio/vo-preview.wav
bash scripts/prep-vo.sh   # mide, normaliza a -14 LUFS, pasa a 48 kHz
```
Si `prep-vo.sh` deja la sonoridad en −13,65 LUFS (por el paso mono→estéreo),
aplicar el ajuste fino documentado en el propio script (`volume=-0,35dB`)
y verificar con loudnorm que queda en −14,00.

### 3. Re-transcribir y regenerar los subtítulos (OBLIGATORIO)
Los subtítulos karaoke están sincronizados con el AUDIO REAL de la VO
(`src/captions.ts`). Si la grabación del usuario dura distinto (lo normal),
hay que re-transcribir:

```bash
# 1) Transcribir la nueva VO con word_timestamps (faster-whisper):
~/workspace/.stt-env/bin/python -c "
from faster_whisper import WhisperModel
import json
m = WhisperModel('/home/hatch/workspace/.stt-models/faster-whisper-small',
                 device='cpu', compute_type='int8', local_files_only=True)
segs, _ = m.transcribe('public/audio/vo-preview.wav', language='es',
                       word_timestamps=True)
words = [{'word': w.word.strip(), 'start': w.start, 'end': w.end}
         for s in segs for w in s.words]
json.dump(words, open('/tmp/vo-user-words.json', 'w'), ensure_ascii=False)
print(len(words), 'palabras')
"
# 2) Alinear al guion y regenerar src/captions.ts: adaptar
#    scripts/transcribe-vo.py (los límites de fragmento ya no vienen de
#    vo-lines.json — la grabación es un solo archivo —: asignar las
#    palabras a las 10 líneas del guion por orden y proximidad temporal,
#    y usar los mismos cortes de chunk y keywords definidos en el script).
#    Los tiempos clave de montaje («canceló», «casi»/«tres») saldrán de
#    la nueva transcripción: actualizar STAMP_FRAME y los cortes en
#    src/timeline.ts.
```

### 4. Re-temporizar los beats (si la duración cambia)
- Medir la duración real de la nueva VO (`ffprobe`).
- Actualizar `VO_LINES` en `src/timeline.ts` con los inicios/fines reales
  de cada línea (de la transcripción).
- Mover los `BEATS` para que sigan a las líneas (misma lógica que ahora:
  cada beat empieza con su línea de VO; el corte salida→número cae en
  «tres»; el sello cae en «canceló»).
- Actualizar `CONTENT_END` (= fin de la VO + ~0,6 s de cola), `STING_FROM`,
  `TOTAL_FRAMES` (= CONTENT_END + 180) y `durationInFrames` en
  `project.json`.
- Actualizar la tabla maestra en `STRATEGY.md` §6.
- Si la duración total cambia, regenerar los rangos de `render-chunks.sh`
  (6 tramos de ~238 fotogramas que cubran el total).

### 5. Re-renderizar
```bash
bash render-chunks.sh   # máster + ligera, en out/
```

## Cambiar la música (sin tocar la VO)
- Regenerar con `scripts/gen-music.py` (cambiar prompts, seed o duraciones
  de sección) o sustituir `public/audio/music-ai.wav` por otro WAV de
  41,5 s a −16 LUFS. El ducking se calcula desde `VO_LINES`, no desde la
  música: no hay que tocar `Video.tsx`.
- **Fallback Flow:** si la música IA no convence, cambiar en `Video.tsx`
  `staticFile('audio/music-ai.wav')` por `staticFile('audio/music.wav')`
  en `MusicInner`. La pista Flow dura 40 s (frente a 41,5 s de contenido):
  el último 1,5 s quedaría sin música antes del sting — aceptable, o
  alargar con un loop/fade en ffmpeg.

## Archivos clave
- `STRATEGY.md` — estrategia completa + registro de cambios (§16).
- `VO_SCRIPT.md` — guion de la VO + notas de pronunciación + por qué
  Piper y no edge-tts.
- `CREATIVE_BRIEF.md` — registro de trabajo del repo.
- `src/timeline.ts` — beats, momentos de montaje, `VO_LINES` (ducking).
- `src/captions.ts` — karaoke (autogenerado; no editar a mano).
- `src/Video.tsx` — composición completa.
- `scripts/` — `gen-vo-piper.py`, `gen-vo.py` (edge-tts, documentado,
  no funciona tras este proxy), `prep-vo.sh`, `transcribe-vo.py`,
  `gen-music.py`, `prep-assets.py`, `prep-media.sh`.
- `public/audio/vo-lines.json` — tiempos de cada línea de la VO preview.
- `public/audio/music-sections/` — las 3 secciones de música crudas.

## Entregas
- Máster: `out/REEL_MARABANA_V1_ALBERTO_20261115_MASTER.mp4`
  (1080×1920, CRF 19, H.264+AAC, faststart).
- Ligera: `out/REEL_MARABANA_V1_ALBERTO_20261115_LIGERO.mp4`
  (720×1280, un solo paso de ffmpeg desde el máster).
- Ambas + `STRATEGY.md` + este archivo van en la carpeta de Drive del
  reel. La ligera es la que se adjunta en el chat; el máster va por Drive.
