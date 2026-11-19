# Licencias

## Plantillas (`templates/images/`)

Las 100 plantillas proceden de la API pública de Imgflip
(`api.imgflip.com/get_memes`, sin clave). Son imágenes subidas por usuarios
de Imgflip a partir de fotogramas de cine, televisión y fotos virales; sus
derechos pertenecen a sus autores originales y **no son de dominio público**.

Uso previsto aquí: **personal y humorístico**, sin fines comerciales, en el
espíritu del uso transformativo del meme (recontextualización con texto
propio). No se venden, no se presentan como obra propia y cada entrada del
catálogo (`templates/catalog.json`) conserva su URL de origen en Imgflip.
Si una plantilla se usa fuera de este contexto personal, corresponde
revisar su licencia.

## Plantillas de vídeo (`video-templates/clips/`)

Clips virales descargados de sus fuentes públicas —MemeScreens (19),
Memeboat (3), CreatorSet (2), greenscreenmemes.com (1), memes.co.in (1)
y un YouTube Short (1)—, siempre sin marca de agua y en la mejor calidad
disponible (las versiones «template / green screen / sin texto» cuando
existen). Como las plantillas de imagen, **no son de dominio público**:
sus derechos pertenecen a sus autores originales. Uso previsto: **personal
y humorístico**, sin fines comerciales, en el espíritu del uso
transformativo del meme (recontextualización con texto propio). Cada
entrada del catálogo (`video-templates/catalog.json`) conserva su URL de
origen y su URL de archivo. Si una plantilla se usa fuera de este contexto
personal, corresponde revisar su licencia.

## Fuente (`assets/fonts/ArchivoBlack-Regular.ttf`)

Archivo Black, Copyright 2017 The Archivo Black Project Authors.
**SIL Open Font License 1.1** — libre para usar, modificar y redistribuir.
Sustituta de Impact (tipografía propietaria, no incluida).

## SFX (`assets/sfx/`)

Del SFX Kit de Wyzowl (`github.com/wyzowl/sfx-kit`), **CC0 1.0** (dominio
público): sin atribución obligatoria. Archivos incluidos: `move-spring.wav`,
`cinematic-slam-big.wav`, `pop-large-bubble.wav`, `move-zoom-in.wav` y,
desde el 19-nov-2026, `vine-boom.wav` (boom-hit-strong),
`metal-pipe.wav` (cinematic-metal-big), `dramatic-sting.wav`
(sting-bold-short), `fail-womp.wav` (notification-failure-wobble),
`error-chime.wav` (notification-error-clear), `ping.wav`
(notification-message-in-clear), `applause.wav`
(celebration-applause-small), `riser.wav` (riser-2s-strong), `bonk.wav`
(notification-failure-thud), `bass-drop.wav` (bass-808-short),
`glitch.wav` (digital-glitch-clear), `deflate.wav` (transform-deflate),
`coin.wav` (money-coin-drop), `thunder.wav` (cinematic-thunder-big) y
`alarm.wav` (digital-breach). El pack completo (320 sonidos) vive en
`~/workspace/remotion-hub/assets/sfx/`.

`airhorn.wav`, `record-scratch.wav`, `sad-trombone.wav`,
`censor-beep.wav` y `wrong-buzzer.wav` son **sintetizados con ffmpeg**
(`scripts/synth-sfx.py`, reproducible a partir de osciladores y ruido): no
contienen ninguna grabación ajena, por lo que son **CC0 por construcción**.
Se sintetizaron porque no se encontró material limpio y con licencia clara
en Wikimedia Commons ni en SoundBible, y Freesound/Zapsplat exigen cuenta.
El trombón triste reproduce la frase musical estándar de 4 notas
descendentes (Sib–La–Lab–Sol), un cliché musical sin grabación ajena.

**No incluidos**: «bruh» (voz de una grabación con copyright), el sonido
de error de Windows y el ping de Discord (sonidos de marca). `error-chime`
y `ping` son equivalentes genéricos del SFX Kit.

## Música (`assets/music/`)

Cuatro pistas de Kevin MacLeod (incompetech.com), **CC BY 4.0** — uso libre
con atribución al autor:

- `sneaky-snitch.mp3` — «Sneaky Snitch» (2015)
- `monkeys-spinning.mp3` — «Monkeys Spinning Monkeys» (2015)
- `carefree.mp3` — «Carefree» (2015)
- `fluffing-a-duck.mp3` — «Fluffing a Duck» (2015)

Atribución al publicar: «Música: Kevin MacLeod (incompetech.com), CC BY
4.0». Son extractos de 60 s con fundido final, codificados a MP3 128k.

Tres pistas de **Flow Music** (generadas con Lyria 3.5 en flowmusic.app
con la cuenta del usuario, plan Plus): `shadows-evidence.mp3`,
`historical-investigation.mp3`, `weight-of-memory.mp3`. Generadas por el
usuario para sus proyectos; **antes de publicar, leer los términos de
Google sobre derechos comerciales de las pistas Flow** (mismo pendiente
que en los reels del hub). No usar fuera de los proyectos del usuario sin
revisar esos términos.

## Imágenes generadas con IA (`assets/ai/`, `examples/demo-ia-paloma.png`)

Generadas con Pollinations (modelo flux) vía el gateway del hub. Sin marca
de agua. Su licencia sigue los términos de Pollinations; se usan como
material propio para memes personales. Al publicar, aplica la etiqueta de
contenido IA de la plataforma, igual que con los reels del hub.
