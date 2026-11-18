# Edición en papel + plantilla tranquila

Sistema para reels de **material grabado** (testimonios, entrevistas,
eventos, grabaciones del teléfono): el usuario elige el montaje leyendo
una transcripción con tiempos — como la «edición en papel» de los
documentalistas — y el hub arma el corte, lo viste con la plantilla
tranquila (QuietReel) y lo audita antes de entregar.

No necesita historial de chat: todo lo que hace falta está en este
repo (scripts, plantillas, activos de marca) y en este documento.

## Guía de decisión — qué usar según el tipo de edición

| Tipo de reel | Señales | Herramienta / plantilla | Entrada |
|---|---|---|---|
| **Motion graphics animado** | Datos, mapas, citas, cifras, explicación visual; el material es texto/datos, no una persona hablando | Proyecto Remotion estándar (`templates/reel` o `templates/motion-reel`); VO guionizada o sintetizada; karaoke; SFX | Guion + estrategia en `CREATIVE_BRIEF.md` |
| **Edición seria de grabaciones** | Una persona hablando a cámara, testimonio, entrevista, evento; el material manda y los gráficos estorban | **Este sistema**: `paper-edit.py` → selección → `assemble-cut.py` → plantilla `quiet-reel` | La grabación (Drive «Videos oficiales») |
| **Híbrido** | Grabación + momentos que piden gráfico (un dato, un mapa, una cita en pantalla) | Base con este sistema (rough cut) y luego un proyecto Remotion estándar que usa el rough cut como plano base e intercala escenas gráficas | La grabación + el guion de los insertos |

Regla práctica: si lo que se dice importa más que lo que se ve en
pantalla, papel + QuietReel. Si lo que se ve (datos, mapas) importa
más que quién lo dice, motion graphics. En duda, preguntar al usuario
con un ejemplo de cada uno — no adivinar.

## Flujo completo (edición seria de grabaciones)

### 1. Grabar (usuario)
- Teléfono en vertical, 1080×1920, 30 fps si es posible, buena luz en
  la cara, teléfono cerca para el audio (el micrófono Bluetooth solo
  funciona bien en llamadas; para grabar, cerca y sin viento).
- Grabar de más: mejor cortar después que lamentar un plano que falta.

### 2. Subir (usuario)
- Subir el video a Drive, carpeta **«Videos oficiales»** (raíz de
  Drive). Avisar cuando esté subido.

### 3. Transcribir — el papel (agente)
```bash
~/workspace/.stt-env/bin/python scripts/editing/paper-edit.py \
    --input <video> --out-dir projects/<slug>/research/paper
```
Produce `paper.md` (legible, frases numeradas con tiempos) y
`paper.json` (lo que lee el montaje). Entregar el `paper.md` al
usuario para que elija.

### 4. Selección (usuario)
El usuario escribe los números de frase en el orden que quiera:
`3, 5-8, 12`. También valen rangos de tiempo (`00:12-00:34`) o una
mezcla. No hace falta que justifique nada: el orden que escribe es
el orden del montaje.

### 5. Montaje — rough cut (agente)
```bash
python3 scripts/editing/assemble-cut.py --video <video> \
    --paper projects/<slug>/research/paper/paper.json \
    --select "3,5-8,12" --xfade 0.3 \
    --lower-third "1:Nombre Apellido|Cargo o contexto" \
    --project projects/<slug> --out-dir projects/<slug>/research/cut
```
- `--xfade 0.3`: crossfade de video Y audio entre segmentos.
  `0` = corte directo (defecto; lo normal en testimonios).
- Produce `rough-cut.mp4` + `edl.json` (lista de corte reproducible:
  re-ejecutar con `--edl` reproduce el mismo montaje) +
  `captions.json` y `vo-lines.json` remapeados + `src/cut.ts`.
  **Para reproducir un corte CON subtítulos hay que pasar `--edl` Y
  `--paper` juntos** (`--edl` solo reproduce el video: las palabras
  viven en el papel, no en la EDL).
- Con `--project`, instala todo en el proyecto y actualiza
  `project.json` (`durationInFrames`). También genera los archivos
  que necesita la auditoría de audio (paso 8): `research/edit-plan.json`,
  `research/vo-editada-prediccion.json`,
  `research/transcription-selected.json`,
  `public/audio/voice-orig.wav` y `public/audio/voice-edited.wav`.
- Cada frase lleva un colchón automático porque los bordes de Whisper
  desvían 50–100 ms y sin colchón se truncan colas de palabras
  (lección 17-nov-2026): AMBOS bordes caen en SILENCIO REAL (50 ms
  por debajo de −45 dBFS) — el inicio busca hacia atrás hasta 0,5 s,
  el final hacia adelante hasta 1,0 s (`--pad-start-max` /
  `--pad-end-max`); si no hay silencio en la ventana, cae el colchón
  fijo (+0,15/−0,05 s). Ningún borde invade la frase vecina. El corte
  acústico puede incluir una vocalización breve sin transcribir tras
  la frase (un «gracias», un filler): suena natural.

### 6. Plantilla tranquila (agente)
Crear el proyecto (una sola vez por reel):
```bash
node scripts/editing/new-quiet-reel.mjs <slug> "Título"
```
Renderizar:
```bash
npm run preview -- <slug>   # rápido (primeros 58 fotogramas)
npm run master -- <slug> --approve EXPORTAR-MASTER   # completo
```
La composición QuietReel muestra el rough cut a pantalla completa y
añade: marca de agua (logotipo completo, desde el fotograma 0),
karaoke opcional, lower-thirds y cierre con logo animado. Ver
`templates/quiet-reel/README.md`.

### 7. Música y máster (agente)
La música NO se mezcla en Remotion. Renderizar la composición,
extraer su audio como «voz» y mezclar con `mix.py`:
```bash
ffmpeg -y -i projects/<slug>/out/<slug>-full.mp4 -vn -ar 48000 -ac 2 voice.wav
python3 scripts/audio/mix.py --voice voice.wav \
    --section assets/music/flow/<pista>.wav@0@<duración> \
    --seconds <duración> --out projects/<slug>/public/audio/mix.wav \
    --music-volume 0.38 --duck-threshold 0.08 --duck-ratio 5 --duck-release 250
# Mux: video del render + mix.wav (el audio del render se sustituye)
ffmpeg -y -i projects/<slug>/out/<slug>-full.mp4 \
    -i projects/<slug>/public/audio/mix.wav \
    -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k \
    -movflags +faststart projects/<slug>/out/<slug>-MASTER.mp4
# Ligera (720×1280) para el chat
ffmpeg -y -i projects/<slug>/out/<slug>-MASTER.mp4 \
    -vf scale=720:1280 -c:v libx264 -crf 26 -c:a aac -b:a 128k \
    -movflags +faststart projects/<slug>/out/<slug>-LIGERO.mp4
```
Parámetros de ducking: los de marti-fidel V1.5 (threshold 0,08 /
ratio 5 / release 250 ms). El ducking agresivo del Studio (0,018/7)
bombea la música 20 dB dentro de cada frase. `mix.py` ya aplica la
cadena de limitación correcta (`alimiter=limit=X:level=false`); no
volver a limitar en el mux.

### 8. QA obligatorio (agente)
```bash
python3 scripts/audio/audit-audio.py \
    --project projects/<slug> --master <máster>.mp4 \
    --section assets/music/flow/<pista>.wav@0@<duración> \
    --seconds <duración> --tag v1 \
    --out-dir projects/<slug>/reports
```
Con el `python3` del sistema (tiene numpy + scipy); el módulo invoca
solo el venv de Whisper para las transcripciones. NO usar
`~/workspace/.stt-env/bin/python` para la auditoría: ese venv no
tiene scipy y el check (d) lo necesita cuando hay líneas con tempo.
Veredicto FAIL = no entregar (regla en `repo/AGENTS.md`). El módulo
levanta solo los archivos que genera `assemble-cut.py`:
`public/audio/captions.json` y `vo-lines.json` (guion↔karaoke),
`public/audio/voice-orig.wav` y `voice-edited.wav` (integridad de la
voz vs el original), `research/edit-plan.json` (un «plan» por
segmento de corte, factor 1.0: el módulo comprueba que ningún corte
trunque una palabra y que los empalmes no tengan discontinuidades),
`research/vo-editada-prediccion.json` y
`research/transcription-selected.json` (alineación karaoke/onsets
acústicos). `--section` declara la música usada para que el módulo
analice el ducking y la curva de la cama musical. El módulo lee los
parámetros reales de ducking de `public/audio/mix.wav.json` (el
informe de `mix.py`) y normaliza la voz al nivel del sidechain de la
mezcla antes de medir el bombeo: sin eso, mediría con los parámetros
agresivos del Studio (0,018/7,0/150) y la voz cruda, y el bombeo
saldría exagerado (25,9 dB en vez de los 10,0 dB reales).

## Referencia rápida

| Script | Para qué | Entrada → salida |
|---|---|---|
| `scripts/editing/paper-edit.py` | Transcribir y hacer el papel | video/audio → `paper.md` + `paper.json` |
| `scripts/editing/assemble-cut.py` | Armar el rough cut | video + papel + selección → `rough-cut.mp4` + `edl.json` + `captions.json` + `vo-lines.json` + `cut.ts` |
| `scripts/editing/new-quiet-reel.mjs` | Crear un proyecto QuietReel | slug + título → `projects/<slug>/` con marca |
| `templates/quiet-reel/` | Plantilla de acabado | rough cut → reel con marca, karaoke, cierre |
| `scripts/audio/mix.py` | Mezcla voz + música con ducking | voz + secciones de música → `mix.wav` |
| `scripts/audio/audit-audio.py` | Auditoría de audio (obligatoria) | proyecto + máster → informe PASS/WARN/FAIL |

Opcionales: `scripts/audio/beats.py` (cortes sobre el ritmo de la
música) y `scripts/audio/diarize.py` (quién habla cuándo, para
entrevistas con varios hablantes).

## Dónde vive cada cosa

```
scripts/editing/            papel, montaje, creador de proyectos (este README)
scripts/audio/              mix.py, audit-audio.py, beats.py, transcribe-vo.py
templates/quiet-reel/       plantilla tranquila (QuietReel)
templates/reel/             plantilla base de motion graphics
templates/motion-reel/      plantilla de motion graphics avanzada
shared/brand/               activos de marca canónicos (logo + cierre)
shared/captions/            BottomKaraoke, tipos y agrupación de captions
shared/LowerThird.tsx       lower-third mínimo
~/workspace/remotion-hub/assets/music/flow/   pistas Flow (biblioteca local)
```

## Lecciones codificadas en este sistema

- **Bordes de Whisper**: desvían 50–100 ms, y en finales de frase
  hasta 0,4 s (verificado: «74,» terminaba 0,36 s después de lo
  declarado); Whisper además omite vocalizaciones breves entre frases
  («gracias»). Por eso `assemble-cut.py` corta AMBOS bordes en
  silencio real (50 ms < −45 dBFS, el mismo umbral del check (c) del
  módulo de auditoría), no en un offset fijo.
- **Cada caption dura hasta la palabra siguiente** dentro de su frase:
  si no, los huecos entre palabras apagan el karaoke en medio de la
  frase aunque haya voz encima (FAIL en la auditoría).
- **Habla real ≠ VO guionizada**: en proyectos paper-edit el módulo
  de auditoría trata las pausas en medio de frase como naturales
  (WARN, no FAIL), exime del suelo RMS todas las pausas naturales y
  no penaliza la voz de la frase vecina excluida en un corte. Los
  solapes de caption de 0,1 s en las uniones con xfade son esperados
  (WARN aceptable: el cambio de línea cae dentro del fundido visual).
- **El fundido final está exento del suelo RMS** y el bombeo del
  ducking se mide solo sobre la región con voz (la liberación tras
  la última palabra no es bombeo).
- **Crossfades de audio en ffmpeg, no en Remotion**: Remotion no funde
  audio entre clips solapados.
- **BottomKaraoke solo lee los inicios (`s`)**: la duración de caption
  no afecta a la visualización; lo que importa es inicio a inicio.
- **`alimiter=limit=X` sin `level=false` NO limita**: aplica ganancia
  de maquillaje 1/X. Un techo real es `alimiter=limit=X:level=false`.
- **Whisper sobre la mezcla sesga +0,2 s** los inicios; la alineación
  autoritaria es contra la voz limpia.
- **Lower-third y karaoke no caben juntos abajo**: con karaoke
  activo el lower-third sube a `bottom: 480` (por encima de la zona
  de subtítulos); a 190 se solapa con el karaoke (verificado en la
  prueba paper-edit-demo). El separador título/subtítulo en
  `--lower-third` es `|` (`orden:título|subtítulo`): los títulos
  pueden contener `:`.
- **Marca**: logotipo COMPLETO blanco/transparente sin placa, desde el
  fotograma 0; el cierre animado conserva su fondo negro.

## Límites conocidos (a fecha de este documento)

- No hay línea de tiempo visual: el montaje se decide en el papel
  (texto + tiempos), no arrastrando clips. Para quien quiera montar a
  mano, CapCut en el teléfono sigue siendo la vía.
- Sin rutina de multicámara (se puede sincronizar por audio, pero no
  hay un flujo hecho).
- El beat-sync (`beats.py`) es manual: el agente coloca los cortes
  sobre los beats, no hay un modo automático en `assemble-cut.py`.
- La corrección de color es básica (filtros ffmpeg). Un etalonaje
  serio exigiría DaVinci Resolve en un ordenador con GPU: no hay
  conector oficial de DaVinci en Muse, Resolve no corre en esta
  máquina virtual (sin GPU ni pantalla) y nuestros reels son motion
  graphics o material grabado con luz natural, donde el etalonaje no
  es el cuello de botella. Si algún día hace falta, sería una etapa
  final fuera de este ecosistema, no una pieza de él.
