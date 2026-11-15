# EDIT_NOTES.md — Reel Marabana V1.2

Notas de edición para quien retome este proyecto (el usuario graba su voz,
o se hace una V2). Todo lo reproducible está en `scripts/`; este documento
dice QUÉ hacer y en QUÉ orden.

## V1.2 — identidad negra + auditoría final (15-nov-2026, ~17:30)

Máster cerrado para la directora Suleris (CON voz de IA; la definitiva se
graba tras su visto bueno). Duración: 47,97 s = 1.439 fotogramas.
Seis frentes, en orden de trabajo:

1. **Marca de agua NEGRA (manual págs. 11 y 13).** La marca roja
   transparente flotando sobre el video era uso incorrecto: el manual
   exige el identificador SIEMPRE sobre un área de color sólida (rojo
   corporativo, o negro en versión monocromática). Construcción:
   `scripts/make-logo-black.py` desde
   `MARCA_AGUA_OFICIAL_MEMORIAL.png` (573×907): estrella roja→blanca por
   rojez con umbral suave (smoothstep 25–90) + puerta de luminancia
   (60–140; la salpicadura negra queda intacta), sobre placa negra sólida
   con margen de seguridad del 15% por lado (86 px), esquinas rectas.
   Resultado `public/img/logo-black.png` (745×1079). En `Video.tsx`:
   150 px de ancho en la esquina superior derecha (top 54, right 40),
   opacidad 1, sin sombra, f30–1349. Quedan 32 px de rojo oscuro junto a
   la salpicadura, invisibles a tamaño de pantalla.
2. **Sting NEGRO.** `scripts/make-sting-black.py`: extrae los 144
   fotogramas del sting oficial (720×1280, 24 fps, 6 s), recolorea la
   estrella roja a blanca (v3: rojez smoothstep(15,70) × puerta de
   luminancia smoothstep(40,120) + neutralización del residuo rojizo a
   gris por luminancia — la v1 dejaba un halo rojo oscuro en los bordes)
   y re-codifica `public/video/sting-black.mp4` (audio del disparo
   copiado sin tocar) + `sting-black-2x.mp4` (3 s, `setpts=0.5*PTS`).
   QA: 0 píxeles rojos en 8 fotogramas muestreados; bordes limpios en
   zoom; salpicadura negra intacta. Se usa en la composición manteniendo
   la velocidad 2x de V1.1.
3. **Bucle abierto (línea nueva de VO).** «Quédate hasta el final. Hay
   una historia que lo resume todo.» (2,867 s, Piper ald-medium,
   length_scale 0,75), empalmada en 13,224 s tras la pausa del giro, con
   0,2 s de respiración después (`scripts/splice-open-loop.py`): solo se
   sintetizó el fragmento nuevo y se igualó su RMS al de las líneas
   vecinas (−3,08 dB); **Piper NO es determinista: nunca regenerar la VO
   completa**. D = +3,067 s (+92 f). La VO pasa de 41,443 a 44,511 s.
   Re-transcripción con `scripts/transcribe-vo.py` (12 fragmentos, 30
   chunks, 132 palabras); la línea nueva es el índice 4 (chunks
   (0,4,{0,3}) y (4,11,{6}); palabras clave QUÉDATE / FINAL. / HISTORIA).
   Re-timing en `src/timeline.ts`: el beat del giro se alarga 44→136 f
   (decisión de director: no había foto libre para un beat nuevo — los
   `cn360-1..10.jpg` son placeholders); todos los beats desde la salida
   se desplazan +92 f; el corte salida→número cae en «casi» según la
   transcripción V1.2 (17,80 s = f534, salida de 45 f, número de 155 f);
   BASTON_FRAME = 1186; TOTAL_FRAMES = 1439; CONTENT_END = 1349.
   `project.json` durationInFrames = 1439. Copia de seguridad de la VO
   V1.1 en `public/audio/vo-preview-v11.wav`.
4. **Música remezclada (NO regenerada).** `scripts/remix-music-v12.py`:
   A igual (0–13,27); B estirada con atempo 0,9122 (22,94→25,13 s,
   ~9% más lenta, misma melodía aprobada) para cubrir 11,77–36,916;
   C recortada a 9,15 s (35,416–44,57, crossfade centrado en Ernesto
   como en V1.1); crossfades de 1,5 s; fade-out de 1 s; mezcla a
   −16 LUFS exactos. Copia de seguridad en
   `public/audio/music-ai-v11.wav`. El ducking se calcula desde
   VO_LINES (actualizar `timeline.ts` basta).
5. **SFX sintetizados.** `scripts/make-sfx-v12.py` (numpy, sin fuentes
   externas): golpe seco/grave en el sello (4,42 s, seno 70→45 Hz +
   click, −18 dBFS), whoosh en el whip (11,77 s, ruido con barrido de
   banda 400→2500 Hz, 0,5 s, −20 dBFS) y riser antes de Ernesto
   (34,17–35,97 s, seno 180→880 Hz + ruido, crescendo a −22 dBFS).
   Pista única `public/audio/sfx.wav` (48 kHz estéreo, 44,97 s) como
   Audio independiente en `Video.tsx`. La deriva del pipeline por
   tramos (~+0,3 s al final) los desplaza igual que a la VO: el golpe
   y el whoosh caen en los primeros 12 s (deriva < 0,1 s) y el riser
   es gradual — no se pre-compensa. El disparo del sting no se toca.
6. **Segunda ventana de video + CTA + 2 menores.**
   - 5K: la tarjeta se divide — foto nocturna (local 0–38 f) y fundido
     de 8 f a video real de Canal Caribe (`public/video/runners-5k.mp4`,
     escena 6, 51,0–53,8 s: corredores bajo el arco de salida, 2,63 s,
     solo video, sin audio). El video va en una Sequence anidada
     (`layout="none"`) para que arranque en el local 38 y no se agote
     el clip (2,77 s). La etiqueta cambia FOTO → VIDEO a mitad del
     fundido. Sondeo de escenas: se revisaron 14 escenas del noticiero;
     las demás eran presentador/reporter/entrevistas con rótulos, o
     estudio/otros deportes. El recuadro de lengua de señas y el bug
     «N» son parte de la emisión y ya estaban en la primera ventana
     (V1); teleSUR sigue EXCLUIDO.
   - CTA: «COMPARTE SI CREES QUE EL DEPORTE NO TIENE BLOQUEO» en texto
     (Condensed 700, 40 px, COMPARTE en rojo), una línea en top 1440,
     últimos 60 f del cierre, sin tocar la VO ni alargar la duración.
   - Gancho: titular subido de top 300 a top 190 (no cruza el pelo de
     la corredora en el fotograma 1).
   - Copy: primera línea de STRATEGY.md §12 con el dato OFAC («EE. UU.
     prohibió que sus corredores vinieran a Marabana.»).

**Render V1.2:** `render-chunks.sh` con rangos nuevos (6 tramos de ~240 f:
0-239, 240-479, 480-719, 720-959, 960-1199, 1200-1438) — borrar
`out/chunks/` antes de re-renderizar. Mismo limiter −1,5 dBFS en la
concatenación. Salida: `REEL_MARABANA_V1.2_ALBERTO_20261115_MASTER.mp4`
+ `…_LIGERO.mp4`.

**QA V1.2 (verificado en el máster final, fotogramas exactos con
`select`):** gancho f1 (titular subido, sin cruzar el pelo de la
corredora); marca negra f40 sobre foto clara y f600 sobre fondo oscuro
(legible en ambos; sobre fondo oscuro la placa se funde con la tinta
pero la estrella y el texto blancos se leen perfectos); sello f133
(golpe del SFX medido por correlación cruzada en 4,48 s, +0,05 s del
objetivo 4,43 s); 5K f760 (segunda ventana de Canal Caribe en la
tarjeta, etiqueta «VIDEO: CANAL CARIBE»); bastón f1210 («CON UN
BASTÓN» resuelto + dorsal 5766); cierre f1300 (CTA en una línea, sin
chocar con la tarjeta ni el karaoke); sting f1420 (logotipo blanco
resuelto, sin halos ni rojo). Audio: −14,02 LUFS, true peak −1,76 dBTP
(con el limiter a 0,79; con 0,84 medía −1,27 dBTP); disparo del sting
en +0,63 s (objetivo +0,68 s, desviación de 1,5 f); whoosh medido en
11,86 s (+0,09 s); riser en 34,39 s (+0,22 s, la deriva lineal del
pipeline — imperceptible al ser gradual). Decodificación completa sin
errores (máster y ligera). Duración de contenedor 48,234 s = 47,97 s
de video + 0,27 s de padding AAC (mismo patrón que V1.1).

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
