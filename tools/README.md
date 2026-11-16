# Herramientas del hub (`tools/`)

Scripts Python que se ejecutan con el venv del hub:

```bash
~/workspace/remotion-hub/.venv/bin/python tools/<script>.py ...
```

## `bg-remove.py` — quitar fondo en IMÁGENES

Recorte por lotes con rembg (MIT) → PNG con canal alfa. Para
ilustraciones y fotos que flotan sobre el escenario (GlowStage,
PhoneFrame...). Modelo `u2net` por defecto (~176 MB, cacheado en
`<hub>/.u2net/` — el script fija `U2NET_HOME` ahí para que la caché
sobreviva a un reemplazo de VM, en vez del `~/.u2net/` por defecto
de rembg); `--alpha-matting` para bordes finos (pelo) y, sobre
todo, para fotos con gente de fondo: elimina el fantasma tenue
que u2net deja en multitudes (verificado 16-nov-2026: 15,1% →
0,0% de píxeles fantasma). Usarlo SIEMPRE en fotos de grupo.

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

---

## Recetas ffmpeg (R13) — estabilizar, etalonar, limpiar audio

Scripts bash sobre el ffmpeg 8.1.2 del sistema (ya trae `vidstab`,
`lut3d` y `afftdn`; no hay nada que instalar). Todas las recetas se
verificaron en muestras reales el 16-nov-2026 (ver «Verificación»
de cada una).

### `stabilize.sh` — estabilizar video

```bash
# Método por defecto (deshake): determinista, sin saltos
tools/stabilize.sh temblor.mp4 estable.mp4

# Método vidstab: corrección más fuerte, NO determinista (ver abajo)
tools/stabilize.sh temblor.mp4 estable.mp4 --method vidstab [shakiness] [smoothing]
```

`shakiness` (1–10, defecto 5) y `smoothing` (fotogramas, defecto 30)
solo afectan a vidstab. El audio se copia sin recodificar.

**Por qué deshake es el método por defecto (hallazgo 16-nov-2026):**
vidstab es **NO DETERMINISTA en este ffmpeg 8.1.2**. Medido:
`vidstabdetect` dos veces sobre el mismo clip produce `.trf`
distintos; `vidstabtransform` dos veces con el MISMO `.trf` produce
103/120 fotogramas distintos (clip sintético con temblor) y 95/120
en metraje real (toma de Pilar, 540×960). No es threading de
filtros: persiste con `-filter_threads 1 -filter_complex_threads 1`.
En el clip con temblor, vidstab deja la mediana residual en 0,17 px
(excelente) PERO 34/119 pares de fotogramas con saltos >10 px
(fotogramas individuales desplazados ~20 px, visibles). El barrido
de parámetros (shakiness 8/10, smoothing 10/15/60, optalgo 0/1/2,
optzoom 0/1, maxshift, tripod, interpol, FFV1) no elimina los
saltos. deshake, en el mismo clip, es **bit-idéntico entre corridas**
y baja la mediana de 7,07 px a 2,68 px (2,6×) sin saltos (solo
1/119 pares >10 px). Regla: deshake primero (fiable); vidstab solo
cuando la corrección máxima compense, verificando visualmente y
quedándose con la mejor de dos corridas. El script imprime una
advertencia cada vez que se usa vidstab.

**Reglas de uso (ambos métodos):**
- **NUNCA estabilizar cruzando un corte de escena**: la ventana de
  suavizado mezcla los dos planos y corrompe los fotogramas cercanos
  al corte (verificado: un clip telesur con corte a t≈4,44 s salió
  con fotogramas bloqueados/corruptos alrededor del corte). Cortar
  primero por escenas, p. ej. detectando cortes con
  `ffmpeg -i x.mp4 -vf "select='gt(scene,0.4)',showinfo" -f null -`.
- Los paneos intencionados rápidos se suavizan: baja `smoothing` a
  10–15 si el paneo debe sentirse.
- Ningún método arregla temblor extremo ni rolling shutter. Ambos
  recortan los bordes (vidstab con `optzoom=1` hace zoom dinámico,
  típico 5–15%; deshake rellena con `edge=clamp`).
- Material con fotogramas duplicados (p. ej. contenido ~25 fps en
  contenedor 29,97 fps, como el telesur) confunde a vidstab: el
  video estabilizado puede cambiar MÁS entre fotogramas que el
  original (medido: diff media 18,76 frente a 8,36).

**Verificación (16-nov-2026):** clip controlado = plano estático del
presentador de Canal Caribe (640×360, 4 s) + temblor sinusoidal
sintético (±12 px horizontal, ±9 px vertical, 2,3/3,9 Hz). Jitter
medido por correlación de fase en región estática. Tiempos: deshake
2,7 s y vidstab 3,2 s para el clip de 4 s a 580×300; vidstab 20,8 s
para un clip telesur de 5 s a 720×1280.

### `color-grade.sh` + `make-lut.py` — corrección de color con LUT

```bash
# Etalonaje cálido con el LUT incluido (defecto)
tools/color-grade.sh clip.mp4 clip-grade.mp4

# Con otro LUT (el incluido cool-teal o uno propio)
tools/color-grade.sh clip.mp4 clip-grade.mp4 tools/luts/cool-teal.cube

# Generar un LUT propio (.cube 17x17x17)
tools/make-lut.py --saturation 1.2 --contrast 1.1 --temperature 0.05 \
    -o tools/luts/mi-lut.cube
```

LUTs incluidos (`tools/luts/`, 17³ = 4913 entradas):
- `warm-contrast.cube`: saturación 1,15, contraste 1,08,
  temperatura +0,04 (cálido). Defecto.
- `cool-teal.cube`: saturación 1,10, contraste 1,10,
  temperatura −0,05, gamma 1,05 (frío azulado).

`make-lut.py` acepta `--saturation --contrast --temperature --lift
--gain --gamma --size`. Dos detalles de implementación que costaron
bugs (16-nov-2026): el orden `.cube` debe ser R más rápido (meshgrid
con ejes B, G, R) y la temperatura debe ser multiplicativa (ganancia
por canal) para que el negro siga siendo negro. Verificado: negro →
(0,0,0), blanco cálido → (1, 1, 0,92).

**Verificación (16-nov-2026):** clip telesur Marabana 5 s, 720×1280,
con `warm-contrast.cube` (11,8 s). Antes/después medido: saturación
media 64,4 → 97,4 (+51%), R 120,3 → 126,4, B 99,4 → 86,7 (más
cálido), valor medio 123,8 → 129,5. Comparación visual de
fotogramas: rojos y tonos de piel más vivos, menos lavado. El LUT
se aplica con `lut3d` sin tocar el audio.

### `denoise-audio.sh` — reducción de ruido de audio

```bash
# Defectos: nr=12, nf=-30
tools/denoise-audio.sh voz-ruidosa.wav voz-limpia.wav
tools/denoise-audio.sh clip.mp4 clip-limpio.mp4   # video copiado, audio procesado
tools/denoise-audio.sh voz.wav out.wav 12 -25     # nf ajustado al ruido real
```

**`nf` es el parámetro que manda, no `nr`.** afftdn solo atenúa lo
que está por debajo de `nf`, así que `nf` debe estar CERCA del nivel
real del ruido. Con el valor por defecto de ffmpeg (nf=-50), afftdn
**NO HACE NADA** en grabaciones con ruido de −25 a −35 dB (medido:
0,0 dB de cambio). Regla: mide el RMS de un tramo sin voz y pon `nf`
a ese nivel o unos dB por encima; si no sabes el nivel, prueba −35,
−30, −25 y escucha. El defecto del script es nf=-30 (no −50).

**NO usar `tn=1` (track noise):** medido 16-nov-2026, el seguimiento
continuo del ruido DEBILITA la reducción (con nf=-30: −4,5 dB sin tn
frente a −1,6 dB con tn=1; con nf=-25: −9,5 dB frente a −2,2 dB).
El estimador se adapta hacia arriba hasta el nivel señal+ruido y
deja de atenuar. El script NO usa tn.

**Verificación (16-nov-2026):** voz de estudio (presentador Canal
Caribe, 4 s) + ruido blanco a −25 dB RMS + zumbido 50 Hz leve.
Reducción medida en la banda 3–8 kHz (Welch), con la banda de voz
(300 Hz–1 kHz) intacta en todos los casos:

| nf | reducción 3–8 kHz | voz 300 Hz–1 kHz |
|----|-------------------|------------------|
| −50 | 0,0 dB | intacta |
| −35 | −1,6 dB | intacta |
| −30 | −4,5 dB | intacta |
| −25 | −9,5 dB | intacta |
| −20 | −11,9 dB | −0,2 dB |

Con los defectos del script (nr=12, nf=-30): **−4,5 dB de ruido,
voz intacta**. Tiempo: 0,2 s para 4 s de audio (0,25 s para 10 s).

**Límites (medidos 16-nov-2026):**
- afftdn NO quita ruido fuerte no estacionario (multitud, música
  bajo la voz): en un clip de Canal Caribe con multitud continua a
  −13 dB RMS el cambio fue de 0,0–0,3 dB en todas las bandas. Para
  ese caso usa DeepFilterNet (ver README del hub).
- La salida sale **~25 ms ADELANTADA** respecto a la entrada
  (latencia del FFT sin compensar, medida por correlación cruzada).
  En un .wav suelto no importa; si reemplazas el audio de un video,
  el desfase A/V de 25 ms es apenas perceptible, pero para sync
  exacto retrasa el audio con `-itsoffset 0.025 -i`.
- NO sustituye a regrabar en silencio: si el ruido tapa la voz, el
  resultado seguirá sonando procesado.
