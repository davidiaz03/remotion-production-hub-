# Ecosistema de memes rápidos

El tercer ecosistema del hub, junto al de vídeo (Remotion) y el de contenido
estático (`content/`). Para hacer memes en un comando: imagen, vídeo, o
ambos. **Uso personal, no del Memorial: sin logo ni marca institucional.**

## Arranque rápido

```bash
cd memes
python3 scripts/meme.py --list            # ver las 100 plantillas
```

## Meme de imagen — `scripts/meme.py`

```bash
# Clásico superior/inferior
python3 scripts/meme.py --template one-does-not-simply \
    --top "UNO NO SIMPLEMENTE" --bottom "HACE UN MEME EN UN COMANDO"

# Texto por panel (Drake: imagen a la izquierda, texto a la derecha)
python3 scripts/meme.py --template drake-hotline-bling \
    --texts "DORMIR 8 HORAS|PENSAR EN PECES"

# Etiquetas lado a lado (Distracted Boyfriend)
python3 scripts/meme.py --template distracted-boyfriend \
    --texts "EL WIFI|YO|MI NOVIA"

# Sobre una foto propia (+ pie en barra inferior)
python3 scripts/meme.py --image ~/fotos/gato.jpg --top "YO" --bottom "A LAS 3 AM"

# Solo texto (fondo blanco + texto negro, chiste de una línea)
python3 scripts/meme.py --text-only "si los zombies comen cerebros, un apagón es su ayuno intermitente"

# Rejilla 2x2 (4 imágenes, etiquetas opcionales con --texts)
python3 scripts/meme.py --grid a.jpg,b.jpg,c.jpg,d.jpg --texts "LUNES|MARTES|MIÉRCOLES|YO"

# Chat falso (yo: = derecha/verde; otro nombre = izquierda/blanco)
python3 scripts/meme.py --fake-chat "yo: oye viste el meme|María: cuál|yo: el del pez"

# Deep-fry (imagen frita, estilo dank) — combina con cualquier modo
python3 scripts/meme.py --template disaster-girl --top "YO" --deep-fry
```

Salida por defecto: `memes/out/<base>-<fecha-hora>.jpg`. Con `--png`, PNG.
Texto blanco con borde negro en Archivo Black (sustituta libre de Impact),
tamaño ajustado automáticamente.

### Cajas de texto por plantilla

`--texts` mapea cada texto a una caja medida sobre la plantilla real
(`templates/boxes.json`, coordenadas normalizadas 0–1): cada texto va
DENTRO de su zona — los botones de Two Buttons, los paneles derechos de
Drake, la banda blanca de Woman Yelling at Cat — con su color (negro
sobre superficies claras) y su alineación vertical. Textos de más se
ignoran con un aviso. Las 12 plantillas con cajas: two-buttons,
uno-draw-25-cards, left-exit-12-off-ramp, change-my-mind,
distracted-boyfriend, drake-hotline-bling, woman-yelling-at-cat,
always-has-been, anakin-padme-4-panel, batman-slapping-robin,
bernie-i-am-once-again-asking-for-your-support, mocking-spongebob.
Las plantillas SIN cajas usan el reparto apilado de siempre
(`--boxes-dir v|h`, `--text-region left|right|full`). Las cajas se
midieron a mano para su plantilla y no se desplazan por caras (el
texto de Anakin va sobre la frente por diseño del formato).

## Meme de vídeo — `scripts/meme-video.py`

Los 4 movimientos clásicos: captions grandes + zoom punch en la reacción +
SFX en el golpe + freeze en el remate. Todo con ffmpeg.

```bash
# Caption sobre un clip (vertical 1080x1920 por defecto)
python3 scripts/meme-video.py --input clip.mp4 --top "YO" --bottom "A LAS 3 AM"

# POV
python3 scripts/meme-video.py --input clip.mp4 \
    --pov "cuando el profe dice que hay examen sorpresa"

# El combo completo: punch + SFX + freeze de 3 s en el remate
python3 scripts/meme-video.py --input clip.mp4 --top "CUANDO DICEN 'SOLO 5 MINUTOS'" \
    --punch-at 2.5 --sfx boing --freeze-end 3

# Freeze a mitad de clip: la imagen se congela 2 s en el segundo 2.5
# (el audio se pausa con la imagen; el SFX cae justo en el golpe)
python3 scripts/meme-video.py --input clip.mp4 --top "CUANDO TE DAS CUENTA" \
    --freeze-at 2.5 --freeze-dur 2 --sfx scratch --sfx-at 2.5

# Cama musical (mezcla baja, no tapa el SFX ni la voz)
python3 scripts/meme-video.py --input clip.mp4 --top "YO" \
    --music sneaky-snitch --music-volume 0.25

# Desde una plantilla o foto, con zoom lento
python3 scripts/meme-video.py --template waiting-skeleton \
    --top "YO ESPERANDO A QUE VUELVA EL WIFI" \
    --duration 6 --zoom --punch-at 3 --sfx slam --freeze-end 3

# Reacción: clip corto + caption con barra
python3 scripts/meme-video.py --input reaccion.mp4 --caption "yo viendo el grupo a las 2 AM"

# Cuadrado y más rápido
python3 scripts/meme-video.py --input clip.mp4 --top "..." --format square --speed 1.5
```

Opciones clave: `--format vertical|square|original`, `--duration` (solo para
imagen base), `--punch-at` (segundo del golpe), `--punch-scale` (def. 1.35),
`--shake` (def. 6 px), `--sfx-at` (si el SFX no va en el punch), `--speed`,
`--freeze-at` + `--freeze-dur` (def. 1,5 s), `--music` + `--music-volume`
(def. 0,25).

**Freeze a mitad de clip**: al congelar, el audio original se pausa con la
imagen (silencio durante el freeze) y retoma después; la música de fondo
sigue sonando. Si el SFX va después del punto de freeze, se desplaza
automáticamente lo que dura el freeze. Es el movimiento clásico del meme
de reacción: el golpe, el silencio, la cara congelada.

### SFX incluidos (CC0, en `assets/sfx/`)

24 efectos, todos de uso libre: del SFX Kit CC0 del hub o sintetizados
aquí con ffmpeg (`scripts/synth-sfx.py`, reproducible).

| Nombre | Archivo | Uso |
| --- | --- | --- |
| `boing` | move-spring.wav | golpe cómico, resorte |
| `slam` | cinematic-slam-big.wav | golpe seco, remate |
| `pop` | pop-large-bubble.wav | aparición, burbuja |
| `zoom` | move-zoom-in.wav | acompañar el punch |
| `airhorn` | airhorn.wav | bocina de aire (sintetizada) |
| `scratch` | record-scratch.wav | rayadura de vinilo (sintetizada) |
| `vine-boom` | vine-boom.wav | el boom grave del remate (Vine) |
| `metal-pipe` | metal-pipe.wav | golpe de metal, tubo que cae |
| `sting` | dramatic-sting.wav | sting dramático, revelación |
| `fail` | fail-womp.wav | «womp», fracaso con gracia |
| `error` | error-chime.wav | chime de error (genérico, no Windows) |
| `ping` | ping.wav | ping de mensaje entrante (genérico) |
| `applause` | applause.wav | aplausos, ironía o triunfo |
| `riser` | riser.wav | subida de tensión antes del golpe |
| `bonk` | bonk.wav | golpe hueco, «bonk» |
| `bass-drop` | bass-drop.wav | patada de bajo 808 |
| `glitch` | glitch.wav | glitch digital, corte raro |
| `deflate` | deflate.wav | globo que se desinfla, decepción |
| `coin` | coin.wav | moneda que cae, dinero |
| `thunder` | thunder.wav | trueno, dramatismo |
| `alarm` | alarm.wav | alarma de dos tonos, alerta |
| `sad-trombone` | sad-trombone.wav | trombón triste «wah wah wah» (sintetizado) |
| `censor` | censor-beep.wav | pitido de censura (sintetizado) |
| `buzzer` | wrong-buzzer.wav | zumbador de respuesta incorrecta (sintetizado) |

Los 5 sintetizados son **CC0 por construcción**: no se encontró nada
limpio y con licencia clara en Wikimedia Commons ni en SoundBible, y
Freesound/Zapsplat exigen cuenta. Puedes soltar tus propios WAV/MP3 en
`assets/sfx/` y referenciarlos por nombre o ruta con `--sfx`.

**No incluidos a propósito**: «bruh» (voz de una grabación con copyright),
el sonido de error de Windows y el ping de Discord (sonidos de marca).
`error` y `ping` son equivalentes genéricos del SFX Kit.

### Música (cama musical, en `assets/music/`)

| Pista | Origen | Ánimo |
| --- | --- | --- |
| `sneaky-snitch` | Kevin MacLeod (CC BY 4.0) | sigilo cómico, tensión de dibujos |
| `monkeys-spinning` | Kevin MacLeod (CC BY 4.0) | caos juguetón |
| `carefree` | Kevin MacLeod (CC BY 4.0) | ligero, despreocupado |
| `fluffing-a-duck` | Kevin MacLeod (CC BY 4.0) | bobalicón, desenfadado |
| `shadows-evidence` | Flow Music del usuario | tensión, misterio |
| `historical-investigation` | Flow Music del usuario | investigación, serio |
| `weight-of-memory` | Flow Music del usuario | emotivo, solemne |

Las de MacLeod son extractos de 60 s con fundido final; las de Flow,
completas. La pista se repite en bucle si el vídeo es más largo y se
mezcla a volumen bajo (def. 0,25) para no tapar el SFX ni la voz. El
catálogo con licencias está en `assets/music/music.json`. **No se
descargan audios trending de TikTok** (copyright): esos se añaden en la
app al publicar.

**Generar pistas nuevas con Flow Music** (flowmusic.app, cuenta del
usuario vortexPixel, plan Plus): se genera en el navegador —lo hace
Alberto—, se descarga el WAV y se guarda en
`~/workspace/remotion-hub/assets/music/flow/` con su entrada en
`catalogue.md`; desde ahí, copiar el MP3 a `assets/music/` y añadir la
entrada a `music.json`. Elegir pistas cortas y con carácter: un meme
necesita 5–15 s de cama reconocible, no una sinfonía.

### Plantillas de vídeo reales — `--video-template`

27 clips virales con movimiento (no imágenes animadas), descargados
limpios y sin marca de agua, en `video-templates/clips/` con catálogo
en `video-templates/catalog.json` (origen, uso, consejo de caption,
segundo sugerido para el punch, tendencia). Ver la lista:

```bash
python3 scripts/meme-video.py --list-video-templates
python3 scripts/meme-video.py --video-template dicaprio-pointing \
    --top "CUANDO VES EL MEME ANTES QUE TUS AMIGOS" --punch-at 0.7 \
    --sfx vine-boom --freeze-end 2
```

**Green screen**: 19 de las 27 son green screen (fondo verde para
componer). Dos formas de usarlas:

- **En CapCut o tu editor**: arrastra el clip sobre tu vídeo y quita
  el verde con la herramienta de chroma key de la app.
- **Aquí mismo, con `--chroma-key`**: quita el verde y compone sobre
  un fondo sólido (negro por defecto, `--chroma-bg` para otro color),
  y encima van los captions, el punch y el SFX de siempre:

```bash
python3 scripts/meme-video.py --video-template coffin-dance --chroma-key \
    --top "YO" --punch-at 1 --sfx vine-boom
```

Las 8 que NO son green screen (se usan tal cual): `chill-guy`,
`giga-chad`, `homer-disappears-bushes`, `primetime-tv-pattinson` (solo
la pantalla del televisor es verde, para insertar contenido),
`spongebob-1-hour-later`, `spongebob-a-few-moments-later`,
`woman-yelling-at-cat`, `explosion`.

El catálogo marca cada clip con `green_screen: true/false` y el campo
`punch_at` con el segundo sugerido para el golpe. Las plantillas en
pico en nov-2026: `talk-to-me-doja`, `tung-tung-tung-sahur`,
`primetime-tv-pattinson`, `six-seven-67-kid`. Licencias: ver
`LICENSES.md` (uso personal transformativo, como las de imagen).

**Refresco semanal** (las tendencias cambian rápido):

```bash
python3 scripts/refresh-video-templates.py            # dry-run: qué hay nuevo
python3 scripts/refresh-video-templates.py --apply    # descarga y añade (máx. 10)
```

Consulta Know Your Meme trending y la portada de MemeScreens, compara
con el catálogo e informa de candidatos nuevos. Con `--apply`, los de
MemeScreens se descargan y se añaden con `trend: 'nuevo'` y los campos
de uso pendientes de revisar por un humano (hay que ver el clip a ojo
y completar origen/uso antes de usarlo); los de KYM casi nunca traen
vídeo directo y se informan para revisarlos a mano.

### Sonidos en tendencia (nov-2026) — solo por nombre

La música comercial con copyright **no se descarga ni se guarda** en el
ecosistema: se añade en TikTok/Reels/CapCut al publicar, desde la
biblioteca de la app. Lo que está sonando en memes ahora (investigado
19-nov-2026; ver `TRENDS.md` para el contexto de cada uno):

| Sonido | Artista | Uso |
| --- | --- | --- |
| Paper Moon Static | Marnie Cusk | Nº 1 TikTok; edits dreamy, reveals |
| You're Under Arrest | ILLIT | Challenge de baile «arresto» |
| My Moon My Man | niki (cover de Feist) | Soft launch de pareja |
| Time | Pink Floyd | «Same Spot, Years Apart», nostalgia |
| Doja | Central Cee | Cortes rápidos, drops, edits |
| Rechazame | Prince Royce | Bachata, sketches en español |
| Dame Hombro | Bulin 47, Kevin Wai | Baile de hombros (2 M+ vídeos) |
| Like That (sped-up) | Doja Cat ft. Gucci Mane | Sonido de «Talk To Me Doja» |
| Doot Doot (6 7) | Skrilla | Sonido del meme «6-7» |
| Dixie (PHONK) | K7K7 | Phonk; edits sigma/gym |
| Housewife | Tate McRae | Reveals de outfit/trabajo |
| Saxophones Getting Louder (sped up) | AntonioVivald | Escalada absurda, reveals |
| THE LAST SAHUR | DJ Tralalero Tralala | Tráilers falsos de Tung Tung Sahur |
| Noite de Esmeralda | funk/phonk brasileño | Montajes de anime, edits funk/phonk |

### El texto no tapa las caras

`meme.py` y `meme-video.py` detectan las caras de la imagen base
(`scripts/face-frame.py`, YuNet del content hub) y:

- **avisan** por stderr si un texto o la barra del caption tapa una cara;
- **desplazan el texto** al lado opuesto cuando hay un solo texto y el
  lado opuesto está libre (con varios textos, cada uno se queda en su
  lado para no cruzarse);
- **achican el texto** (80/64/50%) cuando ni siquiera el lado opuesto
  está libre.

En vídeo, la detección muestrea 3 fotogramas (10%, 50% y 90% del clip)
y une las caras: el sujeto se mueve durante el clip y un solo
fotograma no basta (el bebé 6-7 se acerca a cámara). En imagen, un
solo fotograma, que es la imagen misma.

`--no-face-check` lo desactiva; `--face-box x,y,w,h` fuerza una cara
sintética (para pruebas). **Limitación conocida de YuNet**: inestable
entre escalas —puede dar falsos positivos (detectó una cara en la calavera
de waiting-skeleton) y puede fallar con caras pequeñas o de perfil—; la
verificación visual final es obligatoria. La detección tarda ~1 s por
imagen y necesita el venv del hub (único con cv2); sin él, el generador
avisa y sigue sin chequeo.

### Encuadre de vídeo: sin bandas negras

Para salidas cuadrada/vertical, `meme-video.py` ya no recorta a ciegas
ni deja bandas negras muertas. La estrategia depende del clip:

- **Con cara detectada**: recorte cover centrado en la cara principal
  (la mayor), para que el sujeto llene el formato sin mutilarlo.
- **Sin cara**: fondo difuminado — una copia del clip escalada a cover,
  borrosa (sigma 30) y oscurecida, detrás del sujeto escalado para
  encajar. El Wasted cuadrado, por ejemplo, queda con un resplandor
  rojo difuminado en vez de vacío negro.
- **Tras chroma-key**: además se recorta al contenido no-fondo (la
  unión de las cajas de contenido de 5 fotogramas, con 4% de margen),
  para que el sujeto no flote en un mar de fondo sólido.
- **Formato `original` y zoom sobre imagen**: cover centrado, como antes.

### Píldora de legibilidad (`--text-bg`)

El texto sobre vídeo lleva, por defecto, una píldora semitransparente
oscura (`black@0.45`) detrás **solo cuando el fondo tras el texto es
claro**: se mide la luminancia media del fondo en el fotograma de
muestra y se activa por encima de 140. `--text-bg on` la fuerza siempre;
`--text-bg off` la quita siempre. Sobre fondo oscuro no aparece, para
no ensuciar el meme.

### Guarda green screen y chroma mejorado

Si la plantilla del catálogo es green screen —o, en un `--input` sin
catálogo, los bordes del clip son mayoritariamente verdes (más del 40%
de píxeles verde saturado en 2 fotogramas)— y se renderiza sin
`--chroma-key`, el chroma se activa automáticamente y se avisa por
stderr. `--allow-green` lo evita (para conservar el verde a propósito). El chroma lleva despill
(`mix=0.65`, `expand=1`) y suavizado del alfa (boxblur 1:1 sobre el
canal alfa) para no dejar halo verde en los bordes.

## Vía IA

### Imagen absurda con Pollinations — `scripts/gen-absurd.py`

```bash
python3 scripts/gen-absurd.py --prompt "una paloma con casco de obra mirando un plano" \
    --out assets/ai/paloma.png
# Sin --out: guarda en out/absurd-<fecha-hora>.png
```

Usa el gateway `gen.pollinations.ai` del hub (modelo flux, sin marca de
agua). El token se lee de `~/workspace/remotion-hub/.env` automáticamente.
La imagen generada entra luego a `meme.py --image …` o a `meme-video.py
--input …` como cualquier foto propia. Ver `examples/demo-ia-paloma.png`.

### Vídeo meme con IA — receta (no automatizada)

El usuario tiene autorización permanente para Gemini Pro. Flujo:

1. **Idea + referencia**: elige el formato (remake con estilo fijo + tu
   cara/mascota, animal humanizado, escena absurda). Busca un referente en
   TikTok/Reels y anota qué lo hace funcionar (gancho en el primer
   fotograma, regla de los 3 segundos).
2. **Generar el clip**: en Flow (Veo 3.1) o gemini.google.com (Gemini Omni),
   prompt corto y visual, 5–8 s, vertical. Si el formato es «remake»,
   sube la foto de referencia (cara/mascota) como imagen inicial.
3. **Rematar en el ecosistema**: el clip generado entra a `meme-video.py`
   como `--input` para añadirle caption, zoom punch, SFX, freeze y música:
   `python3 scripts/meme-video.py --input clip-ia.mp4 --top "…" --punch-at 2 --sfx boing --freeze-end 3 --music sneaky-snitch`.
4. **Etiqueta de contenido IA** al publicar, como con los reels del hub.

Por qué no está automatizado (investigado 18-nov-2026):

- **Pollinations vídeo SÍ existe** (`gen.pollinations.ai/video/<prompt>`,
  modelos veo-3.1-fast, seedance-2.5, wan, gemini-omni-1.2-flash…), y el
  token del hub ya funciona para imágenes — pero los 25 modelos de vídeo
  son `paid_only` y la cuenta tiene **saldo $0,00** (verificado: HTTP 402,
  un clip de 5 s cuesta ~$0,05). Haría falta recargar en
  enter.pollinations.ai. En cuanto haya saldo, el camino es:
  `curl 'https://gen.pollinations.ai/video/<prompt>?model=alibaba/wan-2.2-fast&duration=5&key=$POLLINATIONS_TOKEN' -o clip.mp4`.
- **API de Veo/Gemini**: sin tier gratuito para vídeo (Veo 3.1 Lite
  $0,05/s a 720p, mínimo $0,40 por clip de 8 s); necesita cuenta de
  facturación de Google Cloud.
- **La vía gratis es Flow web**: 50 créditos/día para cualquier cuenta
  (Veo 3.1 Lite = 10 créditos → 5 clips/día); con Google AI Pro, 1.000
  créditos/mes más. Es trabajo de navegador (lo hace Alberto), no de
  script. Sora está descartado: OpenAI cerró su API el 24-sep-2026.

## Biblioteca de plantillas

100 plantillas actuales de Imgflip (top 100 por uso, 18-nov-2026) en
`templates/images/`, con catálogo en `templates/catalog.json` (slug, id,
URL origen, dimensiones, nº de cajas, usos) y hoja de contacto visual en
`templates/contact-sheet.jpg`.

```bash
# Actualizar: vuelve a tirar de Imgflip, descarga las nuevas y actualiza el catálogo
python3 scripts/refresh-templates.py --contact-sheet
python3 scripts/refresh-templates.py --dry-run   # ver qué cambiaría, sin tocar nada
```

Nota: el `.gitignore` raíz excluye binarios; las imágenes nuevas que
descargue el refresh hay que añadirlas con `git add -f` (precedente del
content hub).

Las **plantillas de vídeo** (27 clips) viven en `video-templates/clips/`
con catálogo en `video-templates/catalog.json` y se refrescan con
`scripts/refresh-video-templates.py` (ver la sección «Plantillas de
vídeo reales» más arriba). Los formatos de vídeo se revisan contra
Know Your Meme trending y la portada de MemeScreens — ver `TRENDS.md`
(ppl.studio/viral-formats se probó el 19-nov-2026 y no devuelve nada
útil, así que no se usa).

## Estructura

```
memes/
  README.md            este archivo
  TRENDS.md            qué funciona hoy (nov 2026) y dónde re-chequear
  LICENSES.md          licencias de plantillas, fuente, SFX, música e IA
  templates/           biblioteca Imgflip (images/ + catalog.json + contact-sheet.jpg)
  video-templates/     27 clips virales (clips/*.mp4 + catalog.json)
  assets/fonts/        Archivo Black (OFL)
  assets/sfx/          24 SFX CC0 para el golpe (5 sintetizados)
  assets/music/        7 pistas de cama musical (music.json)
  assets/ai/           imágenes absurdas generadas (vacío; gen-absurd.py)
  scripts/             meme.py, meme-video.py, gen-absurd.py, face-frame.py,
                       synth-sfx.py, refresh-templates.py,
                       refresh-video-templates.py, contact-sheet.py
  examples/            demos de prueba (imagen, texto, vídeo, IA)
  out/                 salidas (ignorado por git)
```

## Pruebas

```bash
node --test tests/meme-ecosystem.test.mjs   # 34 pruebas (imagen + vídeo + música + caras + catálogo + plantillas de vídeo + cajas + guarda + píldora)
```

## Pendiente

- **Vídeo con IA automatizado**: bloqueado por pago (ver receta arriba).
  Pollinations vídeo necesita recarga (~$0,05/clip de 5 s); la API de Veo
  necesita facturación de Google Cloud. La vía gratis es Flow web.
- **Caras en vídeo**: la detección muestrea 3 fotogramas (10/50/90%
  del clip) y une las caras, pero entre muestras la cara puede moverse;
  la verificación visual sigue siendo obligatoria. El chequeo tampoco
  tiene en cuenta el zoom del punch: en el pico (~0,5 s) la cara crece
  y puede rozar el texto (en el demo del Día del Hombre, el llorando
  toca la frente en el pico; ojos y boca quedan visibles).
- **9 plantillas sin URL limpia** (19-nov-2026): This Is Fine, Surprised
  Pikachu, Bernie «Once Again Asking», Jesse Pinkman, Lupin Escape, «Yo
  en noviembre» (zorro), «Dame Hombro», «¿Y si sí?» y «I Got So Mad»
  (formato de frase, no de vídeo). El refresh las detectará si aparecen
  con vídeo directo en las fuentes.

## Cerrado el 19-nov-2026 (mejora de calidad del pipeline)

- ✅ **Cajas de texto por plantilla** (`templates/boxes.json`, 12
  plantillas medidas a mano): `--texts` coloca cada texto dentro de su
  zona — botones de Two Buttons, paneles de Drake, banda de Woman
  Yelling — con su color y alineación. Sin cajas, reparto apilado.
- ✅ **Texto que no tapa caras**: desplazamiento al lado opuesto y
  achicado (80/64/50%) en imagen y vídeo; en vídeo, muestreo de caras
  en 3 fotogramas (el bebé 6-7 se acerca a cámara).
- ✅ **Encuadre de vídeo sin bandas negras**: recorte cover centrado
  en la cara principal, o fondo difuminado (borroso + oscurecido) sin
  cara; recorte al contenido tras chroma-key (el WASTED cuadrado ya
  no tiene vacío negro).
- ✅ **Píldora de legibilidad** (`--text-bg auto|on|off`): respaldo
  oscuro tras el texto solo cuando el fondo es claro (luminancia > 140).
- ✅ **Guarda green screen**: chroma-key automático con aviso si la
  plantilla es green screen o los bordes son verdes; `--allow-green`
  lo evita. Chroma con despill y suavizado del alfa (sin halo verde).
- ✅ **Nombres de SFX corregidos en docs** (los reales del CLI:
  `fail`, `sting`, `censor`, `buzzer`, `error`…).
- ✅ **Tanda del Día del Hombre re-renderizada** con el pipeline
  mejorado (mismos textos): 12–17 estáticos y 18–21 vídeos.

## Cerrado el 19-nov-2026 (banco de vídeo + SFX)

- ✅ **Desbordamiento de texto corregido**: `fit_font`/`fit_text` ahora
  verifican ancho (con stroke) y alto; margen interior del 4% en paneles;
  prueba de regresión con chequeo de píxeles.
- ✅ **Banco de 27 plantillas de vídeo reales** (58 MB, todos verificados
  a ojo): `--video-template` y `--list-video-templates` en
  `meme-video.py`, `--chroma-key` para las 19 green screen, catálogo con
  origen/uso/punch_at, `refresh-video-templates.py` (KYM + MemeScreens).
- ✅ **18 SFX de memes nuevos** (15 del SFX Kit CC0 del hub + 3
  sintetizados con ffmpeg: `sad-trombone`, `censor`, `buzzer`;
  verificados por FFT). Total: 24 nombres en `meme-video.py`.
- ✅ Sonidos virales nov-2026 documentados solo por nombre (sin
  descargar música comercial con copyright).

## Cerrado el 18-nov-2026 (auditoría v1.1)

- ✅ Freeze a mitad de clip (`--freeze-at` + `--freeze-dur`, audio
  re-sincronizado: se pausa con la imagen).
- ✅ Bocina de aire y rayadura de vinilo (sintetizadas, CC0).
- ✅ Música: biblioteca de 7 pistas + `--music`/`--music-volume`.
- ✅ Detección de caras en `meme.py` y `meme-video.py` (aviso + desplazo).
- ✅ Tendencias refrescadas (ver `TRENDS.md`, 18-nov-2026).
