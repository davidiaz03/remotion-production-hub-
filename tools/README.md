# Herramientas del hub (`tools/`)

Scripts Python que se ejecutan con el venv del hub:

```bash
~/workspace/remotion-hub/.venv/bin/python tools/<script>.py ...
```

## `bg-remove.py` — quitar fondo en IMÁGENES

Recorte por lotes con rembg (MIT) → PNG con canal alfa. Para
ilustraciones y fotos que flotan sobre el escenario (GlowStage,
PhoneFrame...). Modelo `u2net` por defecto (~176 MB, cacheado en
`~/.u2net/`); `--alpha-matting` para bordes finos (pelo).

```bash
~/workspace/remotion-hub/.venv/bin/python tools/bg-remove.py \
    ilustracion.png -o public/img/
```

NO usar `@imgly/background-removal-node`: es AGPL-3.0 y está prohibido
por la política del hub (auditoría 15-nov-2026, §0).

## `video-bg-remove.py` — quitar fondo en VIDEO

Recorte de personas en movimiento con Robust Video Matting (RVM),
modelo MobileNetV3 en ONNX + onnxruntime. A diferencia de aplicar
rembg foto a foto, RVM es recurrente: el mate es temporalmente
estable, sin parpadeo grave entre fotogramas.

```bash
# Video con alfa (WebM VP9, usable en Remotion como video transparente)
~/workspace/remotion-hub/.venv/bin/python tools/video-bg-remove.py \
    clip.mp4 -o clip-alpha.webm --mode alpha

# Fondo sustituido por un color o una imagen
~/workspace/remotion-hub/.venv/bin/python tools/video-bg-remove.py \
    clip.mp4 -o clip-verde.mp4 --mode replace --bg-color 00FF00
~/workspace/remotion-hub/.venv/bin/python tools/video-bg-remove.py \
    clip.mp4 -o clip-fondo.mp4 --mode replace --bg-image fondo.jpg

# Solo el mate (gris) para control de calidad
~/workspace/remotion-hub/.venv/bin/python tools/video-bg-remove.py \
    clip.mp4 -o clip-mate.mp4 --mode matte
```

Pesos: `~/workspace/remotion-hub/assets/models/rvm/rvm_mobilenetv3_fp32.onnx`
(14 MB). Si no están, el script los descarga solo del release oficial
v1.0.0 de RVM. Los pesos viven FUERA del repo (el repo es público).

### Licencia (verificado 16-nov-2026)

El código de RVM es **GPL-3.0, NO MIT** (el encargo original asumía
MIT por error). Por eso esta herramienta NO copia ni importa código
de RVM: la inferencia es código propio sobre onnxruntime (MIT) y los
pesos se usan solo como entrada local de procesado, igual que ffmpeg
(también GPL) como herramienta. Nada de RVM entra en el repo público.

### Rendimiento medido (16-nov-2026, VM 4 hilos)

Clip Canal Caribe 640×360, 4 s, 120 fotogramas, `--width 640`,
`--downsample-ratio 1` (ver abajo por qué 1):

- `replace` (verde): **104 s** (1,15 fps), alfa medio 7,4%.
- `alpha` (WebM VP9): **91 s** (1,32 fps), 0,5 MB.

- `--width 480`: más rápido, bordes algo más blandos (vale para preview).
- **downsample-ratio distinto de 1 es patológicamente lento** en este
  modelo ONNX con onnxruntime CPU: a 640×352, d=4 tarda 11–30 s por
  fotograma frente a 0,6–0,7 s con d=1 (a 448×256: 5–10 s frente a
  0,15–0,18 s). El defecto es 1, que además da el mejor borde.
- La arena de onnxruntime se desactiva en el script: sin eso, el
  proceso llega a 3,2 GB de RAM con este grafo; con la arena
  desactivada queda en ~0,5–1 GB.
- El audio del clip se copia tal cual a la salida (en WebM se
  recodifica a Opus, porque WebM no admite AAC).

### OJO: ffprobe dice que el WebM no tiene alfa (y sí lo tiene)

El decodificador VP9 *nativo* de este ffmpeg (el que usa ffprobe por
defecto) ignora el canal alfa y reporta `yuv420p`. El alfa SÍ está en
el archivo: para verificarlo, decodifica con libvpx:

```bash
ffmpeg -c:v libvpx-vp9 -i clip-alpha.webm -frames:v 1 frame.png
# frame.png sale RGBA si el alfa está presente
```

Chromium (y por tanto Remotion) decodifica VP9 con libvpx, así que el
alfa funciona donde importa. Verificación 16-nov-2026: fotograma del
WebM decodificado con libvpx → PNG RGBA, alfa opaco 7,1%,
transparente 92,1%, recorte limpio sobre fondo magenta.

### Límites conocidos (verificados 16-nov-2026)

- **Personas pequeñas o lejanas**: en un plano general de multitud
  (salida de Marabana, Canal Caribe t=40 s) el mate sale casi vacío
  (alfa medio ~0%). RVM está entrenado para una persona prominente
  en plano; no es un detector de multitudes.
- **Pelo fino / bordes con movimiento rápido**: algo de sangrado de
  color. El foreground del modelo ya viene descontaminado, pero no
  es perfecto; en primer plano con pelo suelto, revisar el mate.
- **Varias personas**: las recorta a todas, sin distinguir sujetos.
  No hay selección de «la persona principal».
- **Personas en pantallas o carteles** dentro del fondo: el modelo
  puede recortarlas también (p. ej. el intérprete de lengua de señas
  en recuadro de Canal Caribe aparece en el mate).
- **Arranque**: el estado recurrente empieza en cero; el mate se
  estabiliza en ~0,5 s. Si el primer medio segundo se nota, córtalo.
- **Resolución**: el modelo procesa a `--width` (640 por defecto) y
  el mate se reescala al tamaño original; en 1080p el borde es algo
  más blando que a resolución nativa. Para máster 1080p, sube
  `--width` a 960–1280 (más lento) o acepta el borde.

### Verificación (16-nov-2026)

Clip: presentador de estudio de Canal Caribe (15-nov-2026), 4 s,
640×360, 120 fotogramas. Modos `replace` (fondo verde) y `alpha`
(WebM) procesados; fotogramas revisados visualmente (inicio, medio
y final): silueta limpia, sin parpadeo grave entre fotogramas. El
intérprete de lengua de señas del recuadro inferior derecho también
sale recortado (el modelo no distingue sujetos: ver límites).
