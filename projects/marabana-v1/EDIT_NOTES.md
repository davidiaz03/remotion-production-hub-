# EDIT_NOTES.md — Reel Marabana V1.1

Notas de edición para quien retome este proyecto (el usuario graba su voz,
o se hace una V2). Todo lo reproducible está en `scripts/`; este documento
dice QUÉ hacer y en QUÉ orden.

## V1.1 — correcciones de auditoría (15-nov-2026, ~17:00)

El usuario pidió aplicar la auditoría contra reels modernos («Aplica»).
Seis cambios, en orden de prioridad:

1. **Gancho nuevo (frame 1):** el beat 1 lleva el rótulo «EE.UU. PROHIBIÓ
   QUE SUS CORREDORES VINIERAN A MARABANA» (Archivo Black 62 px, PROHIBIÓ
   en rojo #ED1C24, 3 líneas, tercio superior sobre el cielo del amanecer)
   con opacidad 1 desde el fotograma 0 — fuera del fade de entrada del
   beat, que se eliminó para el gancho (el primer fotograma del reel no
   tiene nada desde lo que fundir). La VO sigue con la pregunta
   «¿Sabías que...?» como eco retórico. Sin foto de cara disponible para
   el gancho: el texto compensa esa carencia.
2. **Sting a 3 s (decisión de director: acelerar 2x).** Medido en el sting
   original de 6 s: disparo a ~1,3 s; «MEMORIAL DE LA» a ~3,0 s; logotipo
   completo resuelto a ~4,0 s; aguante estático ~2 s. A 2x: disparo a
   ~0,65 s, logo completo a ~1,75 s, ~1,25 s de aguante. Se descartó la
   alternativa (fotograma final estático + disparo) porque pierde la
   animación oficial, que es la identidad del cierre. Activos
   pre-procesados: `public/video/sting-2x.mp4` (ffmpeg
   `setpts=0.5*PTS`, 3,08 s) + `public/audio/sting-2x.wav` (ffmpeg
   `atempo=2.0`, 3,0 s). Los originales de 6 s se conservan en `public/`.
   Duración total: 44,9 s (dentro del punto dulce 15–45 s).
3. **Ganadores sin vacío:** las filas de 21K y la foto de los tuneros
   entran a ~0,5 s del beat (antes a 2,6 s). Coste aceptado: se pierde
   un poco la sincronía con la frase «Y en la media…» (la tarjeta se
   completa antes de que la VO llegue a esa frase).
4. **Sin rótulos duplicados:** fuera el titular «PERO A PESAR DE ELLO…»
   del giro (la foto sube a top 300 y crece a 980 px de alto para llenar
   el cuadro) y fuera «COMPLETÓ LOS 10K» de Ernesto (quedan el nombre,
   la foto, «CON UN BASTÓN» con la pausa dramática y el dorsal 5766).
5. **«cuarenta» → «cuadragésima» (línea 5 de la VO).** Solo se regeneró
   esa línea: **Piper NO es determinista entre ejecuciones** (al regenerar
   la VO completa, las demás líneas variaban ±0,2 s — frag 0: −0,151 s;
   frag 10: −0,198 s —, lo que habría desplazado todos los beats y el
   sello). Procedimiento: sintetizar solo el fragmento 4 con
   `gen-vo-piper.py` (texto ya corregido en el script), extraerlo del
   WAV crudo, igualar su nivel al del fragmento viejo por RMS (−1,69 dB),
   empalmarlo en el WAV de V1 (48 kHz, −14 LUFS) entre los silencios de
   0,45 s (antes) y 0,2 s (después). La línea nueva dura 6,466 s frente
   a 5,909 s (+0,557 s): los beats desde la 5K en adelante se desplazan
   +17 fotogramas; el corte salida→número cae en «casi» (14,98 s, frame
   449); `STAMP_FRAME` no cambia (133); `BASTON_FRAME` pasa a 1094.
   `src/captions.ts` regenerado con `transcribe-vo.py` (verificado:
   CUADRAGÉSIMA en 17,80 s). **Consecuencia en la música:** la pista IA
   dura 41,5 s y el contenido ahora 41,90 s — los últimos 0,4 s antes
   del sting quedan sin música (silencio antes del disparo: funciona
   como pausa dramática, no como hueco); el crossfade B→C (32,35 s)
   queda 0,56 s antes del beat de Ernesto (32,90 s), dentro del
   crossfade de 1,5 s: imperceptible.
6. **Techo de true peak:** el máster V1 medía +1,31 dBTP. La concatenación
   de V1.1 añade `alimiter=limit=0.84:attack=5:release=50` (≈ −1,5 dBFS)
   en el paso de audio. La música sigue en mono (decisión documentada
   en V1, no se regeneró).
7. **Sincronía del disparo (QA del render final):** el pipeline por tramos
   deriva el audio respecto al vídeo: +0,05 s al inicio, **+0,31 s al
   final** (medido con el pico del disparo en el máster: caía en sting
   +0,99 s en vez de +0,68 s; V1 tenía la misma deriva, +0,33 s). La VO
   deriva igual (el karaoke adelanta hasta ~0,3 s al final), pero es
   tolerable y V1 se entregó así. El disparo, en cambio, es el
   transitorio más sensible a la sincronía: la Sequence `sting-audio`
   en `Video.tsx` arranca 9 fotogramas (0,30 s) antes de `CONTENT_END`
   para compensar la deriva acumulada en el tramo 6. El audio del sting
   empieza con ~0,65 s de silencio, así que el adelanto no mete sonido
   audible en la cola del contenido. **Lección para futuros proyectos:**
   medir la deriva de audio en el máster concatenado antes de dar por
   bueno un transitorio sincronizado con imagen.

## Pistas de audio (separadas, por diseño)

| Pista | Archivo | Contenido | Nivel |
|---|---|---|---|
| Voz en off (PREVIEW) | `public/audio/vo-preview.wav` | Narración Piper (es_MX-ald-medium), **41,44 s** (V1.1: línea 5 «cuadragésima» empalmada) | −14 LUFS, 48 kHz estéreo |
| Música original IA | `public/audio/music-ai.wav` | MusicGen-small, 3 secciones, 41,5 s | −16 LUFS, 48 kHz |
| Música Flow (fallback) | `public/audio/music.wav` | Flow editado, 40 s | −14 LUFS, 48 kHz |
| Audio del sting | `public/audio/sting-2x.wav` | Disparo del cierre oficial **a 2x**, 3 s (V1.1) | Original |
| Audio del sting (6 s) | `public/audio/sting.wav` | Disparo original, 6 s (conservado) | Original |

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
- V1.1 — Máster: `out/REEL_MARABANA_V1.1_ALBERTO_20261115_MASTER.mp4`
  (1080×1920, CRF 19, H.264+AAC, faststart, limiter −1,5 dBFS;
  **14.535.677 bytes**, 1.347 fotogramas, 44,9 s). Drive:
  `1vmmAoJ9QE-jamol5e3rjL85BfgtzCVWq`.
- V1.1 — Ligera: `out/REEL_MARABANA_V1.1_ALBERTO_20261115_LIGERO.mp4`
  (720×1280, un solo paso de ffmpeg desde el máster; **3.124.555
  bytes**). Drive: `1LBPS9IlQxoWE1f_bqhgQW_CPtzwxIbV3`.
- V1 (conservada, no se borra): `out/REEL_MARABANA_V1_ALBERTO_20261115_MASTER.mp4`
  y `..._LIGERO.mp4`.
- Ambas versiones V1.1 + `STRATEGY.md` + este archivo están en la carpeta
  de Drive del reel `1L374oa6XKnlENwy3Xb_54TQ-04t2OnEy` (misma carpeta que
  V1). La ligera es la que se adjunta en el chat; el máster va por Drive.
- **QA V1.1 (render final):** fotogramas exactos (filtro `select`, no
  `-ss` — el seek de ffmpeg se desvía varios fotogramas): f1 gancho OFAC
  ✓; f133 sello CANCELADO en «CANCELÓ» ✓; f546 «EN LA CUADRAGÉSIMA» ✓;
  f855/f870 ganadores (tarjeta completa + foto tuneros a ~1 s del beat)
  ✓; f1100 «CON UN BASTÓN» ✓; f449/f450 corte de tramo sin salto ✓;
  f1330 sting con logotipo completo ✓. Audio: disparo a sting +0,69 s
  (objetivo +0,68 s) ✓; true peak −1,25 dBTP (V1: +1,31) ✓; −13,98 LUFS;
  decodificación completa sin errores en ambas; cero fotogramas negros.
  Whisper en la mezcla final (17–20 s) oye «cuadrafésima» (error del
  modelo pequeño por «cuadragésima», confirmado en el fragmento fuente y
  en el subtítulo).
