# hub-speed-v5 — Pipeline de render (21-nov-2026)

Mejora del pipeline de render del ecosistema Remotion: tramos sin audio +
mezcla en el máster, tramos incrementales por hash y modo borrador.
Rama: `work/hub-speed-v5-render`. Proyecto de referencia para todas las
mediciones: marti-fidel V5 (2077 f, 69,233 s, 1080×1920, 30 fps, 14 tramos
de 150 f).

## Resumen de resultados

| Pieza | Antes (V5) | Después | Ahorro |
|---|---|---|---|
| 1. Cambio de mezcla (audio) | re-render 14 tramos (~14 min) + máster (~2 min) | solo máster con `--mix` (~1,7 min) | ~14 min por iteración de audio |
| 2. Cambio de 1 caption | re-render 14 tramos (~13 min) | solo el tramo afectado: 91 s | ~12 min (88%) |
| 3. Borrador completo 540p | — (no existía; un 1080p son ~13 min) | render 6 min 23 s + máster 9 s = ~6,5 min | ~2× más rápido que 1080p |

Tiempos medidos en esta caja (1,5 CPU efectivas, 7,7 GB RAM, sin GPU),
con el candado de render y sin nada más corriendo.

---

## Pieza 1 — Tramos sin audio + mezcla en el máster

### Problema

`render-chunks.mjs` muxaba el audio en cada tramo, así que cualquier cambio
de mezcla (un SFX, un nivel, un ducking) obligaba a re-renderizar TODO el
vídeo. En V4.1 un cambio de audio de 20 ms + ducking costó un re-render
completo de 85 min.

### Cambios

**`scripts/render-chunks.mjs` — `--video-only`**

Con `--video-only` los tramos salen SIN pista de audio (`.mkv` solo vídeo).
Implementación: NO usa `--muted`. Renderiza el audio a PCM-16 con
`--separate-audio-to <temporal>` y descarta el temporal tras cada tramo
(se borra en `finally`). Motivo (medido, ver § Verificación): el camino
`--muted` produce píxeles distintos del camino con audio; el camino
`--separate-audio-to` produce los mismos píxeles que el render con audio
muxado, dentro del ruido propio del pipeline (ver § No-determinismo).

- `--video-only` + `--audio-codec` → error (el audio se renderiza siempre
  a PCM-16 separado).
- En el manifest: `audioCodec` es el códec de render (`pcm-16`) y
  `videoOnly: true` marca que el archivo del tramo no lleva audio.
- `--draft` implica `--video-only`.

**`scripts/audio/master.py` — `--mix <wav>` (+ `--gain-db`, `--no-light`, `--draft`)**

- `--mix <wav>`: el audio del máster viene de la mezcla, no del render. Si
  el vídeo de entrada lleva audio, se ignora con un aviso.
- Con `--mix`, la cadena es limpia por defecto (sin trim, sin boost,
  atempo 1.0) salvo que se pase explícitamente `--trim-start`, `--atempo`
  o `--boost-db`. (Los defaults de esos tres flags pasaron a `None` y se
  resuelven tras el parseo: mezcla → 0/1.0/0; vía legacy → 0.04/1.0/6.0.)
- Tratamiento de la mezcla (medido, no asumido): se sondea el wav; si la
  frecuencia de muestreo ≠ 48 kHz se remuestrea (`aresample=48000`); si es
  mono se duplica a estéreo a −3,01 dB/canal
  (`pan=stereo|c0=0.70710678*c0|c1=0.70710678*c0`), reproduciendo el
  tratamiento que Remotion aplica al muxar; si tiene >2 canales, error.
  Después `apad=whole_dur=<dur_video>` + `atrim=0:<dur_video>` (la
  duración del vídeo sale del probe de `--input` o de la suma de
  duraciones de los tramos con `--chunks-dir`: el demuxer concat NO
  reporta duración total, por eso existen `format_duration()` y
  `concat_duration()`).
- `--gain-db`: ganancia general antes del limitador. Reproduce el paso
  manual no documentado de V5 (+0,6 dB sobre el concat, ver § Hallazgos).
- `--no-light`: hace opcional la versión ligera (`--out-light`); error si
  se pasan ambos o ninguno. `--draft` = `--no-light`.
- El informe JSON añade `mix`, `mix_info`, `gain_db` y `audio_source`
  (`mix`/`input`/`none`); `light: null` cuando se omite.

### Uso

```bash
# Tramos vídeo-solo (una sola vez; se reutilizan en cada iteración de audio)
node scripts/render-chunks.mjs marti-fidel --composition MainReelV5 \
  --frames 0-2076 --chunk 150 --video-only --out out/chunks-vo --no-concat

# Máster con la mezcla (cada iteración de audio: solo esto)
python scripts/audio/master.py --chunks-dir projects/marti-fidel/out/chunks-vo \
  --mix projects/marti-fidel/public/audio/v5/mix-v5.wav --gain-db 0.6 \
  --out-master projects/marti-fidel/out/marti-fidel-v5_MASTER.mp4 --no-light --force
```

### Verificación (21-nov-2026)

**Render vídeo-solo completo:** 14 tramos, 2077 f, **13 min 9 s** (789 s;
el tramo 1 se saltó por hash, ver pieza 2; sin salto serían ~14 min, igual
que el render V5 con audio: el modo vídeo-solo no es más lento).

**Vídeo — framemd5 por fotograma contra los tramos V5:**

| Tramo | Idénticos | Distintos |
|---|---|---|
| 01–05, 07–09, 11–13 | 150/150 | 0 |
| 06 | 0/150 | 150 |
| 10 | 3/150 | 147 |
| 14 | 126/127 | 1 |
| **Total** | **1779/2077** | **298** |

Los 298 fotogramas distintos NO son un defecto del modo vídeo-solo: son el
ruido propio del pipeline (ver § No-determinismo). Medición perceptual:

| Comparación | PSNR medio | PSNR Y | SSIM |
|---|---|---|---|
| Vídeo-solo ch06 vs V5 | 55,24 dB | 53,77 dB | 0,9979 |
| Vídeo-solo ch10 vs V5 | 44,69 dB | 43,26 dB | 0,9853 |
| Vídeo-solo ch14 vs V5 | 108,41 dB | 106,90 dB | — |
| **CONTROL: re-render PCM-muxado ch06 vs V5** | **55,24 dB** | **53,77 dB** | — |
| **CONTROL: dos renders del mismo comando (c1a vs c1b)** | **55,32 dB** | **53,85 dB** | — |

El vídeo-solo se desvía de V5 **exactamente lo mismo** que el flujo actual
de producción re-renderizado (PSNR idéntico hasta el 6º decimal: 55,238324
dB en ambos casos) y lo mismo que dos renders del mismo comando entre sí.
El modo vídeo-solo introduce **cero desviación adicional**. Las diferencias
son sub-visuales (media <0,5/255, solo plano Y, en regiones de gradientes
apilados), invisibles a ojo (SSIM ≥0,985).

**Máster de prueba** (`chunks-vo-mix_MASTER.mp4`, desde tramos vídeo-solo
+ `--mix` + `--gain-db 0.6`, 103 s): **2077 f, −15,90 LUFS, TP −4,30 dBTP**
(V5: −15,9/−4,2). Vídeo: 1779/2077 idénticos al máster V5 (los 298
distintos son exactamente los de los tramos; el ensamblado no añade
desviación). Fotogramas decodificados: 2077, sin drops.

**Audio del máster vs máster V5** (correlación por ventanas de 5 s):
RMS idéntico (−18,81/−18,81 dBFS), lag **+0,00 ms en las 13 ventanas**,
corr 0,9999–1,0000, diff RMS **−58,98 dBFS** (suelo de ruido de la
re-codificación AAC), ganancia 1,0001 (0,00 dB). **Sync A/V perfecto, sin
deriva.** La mezcla V5 es mono 192 kHz; el tratamiento mono→estéreo de
`--mix` reproduce el de Remotion (concat = mezcla × 0,7071, lag 0,00 ms,
diff −98,09 dBFS tras compensar ganancia).

**Auditoría** (`audit-audio.py`, espejo de `audit-v5.sh` con tag `v5mix`,
sobre el máster de prueba, 4 min 16 s): veredicto FAIL — 11 FAIL, 73 WARN,
12 PASS, 51 INFO, **idéntico al de la auditoría V5** (11 FAIL, 74 WARN, 12
PASS, 51 INFO; los 11 FAIL son los mismos conocidos de V5: desajustes
karaoke/onset de 0,20–0,56 s y un hueco de caption en 36,63 s; la única
diferencia es un WARN menos y dos desvíos karaoke/voz que cambian en
centésimas por el jitter de detección de onsets de Whisper sobre el audio
re-codificado). **(g) agujeros: PASS** («sin agujeros de frontera en el
máster (escaneo a 1 ms)», `g_master_holes: 0`). **(i) microcortes: PASS.**
TP −4,3 vs −4,2 dBTP en V5 (0,1 dB, misma diferencia del smoke test).

### No-determinismo del render (±1 nivel) — hallazgo

El render Remotion + Chromium en esta caja **no reproduce fotogramas
bit-idénticos entre corridas** en escenas con gradientes semitransparentes
apilados y blend modes (S5 tarjeta, S8 pantallas, S11). Evidencia
(21-nov-2026, tramo 06, f750–899):

- El flujo ACTUAL (PCM muxado, mismo comando que V5) dio la variante A
  dos veces y la variante B una vez.
- Dos renders del MISMO comando (`--concurrency 1`) difieren en 150/150
  fotogramas entre sí; a concurrencia 1 los fotogramas individuales
  cambian de variante (f0–f2 = A, f3 = B, …).
- Ni `--concurrency 1`, ni rutas relativas/absolutas, ni el orden de los
  argumentos, ni `--muted`/`--separate-audio-to` determinan la variante.
  (Se probaron 17 renders del tramo 06; las hipótesis de ruta y de orden
  de argumentos se refutaron con contraejemplos.)
- No hay `Math.random`/`Date.now`/`performance.now` en `src/` ni en
  `shared/`; la composición es determinista en JS. La no-determinismo está
  en la pila de render (rasterización de Chromium), no en el código.
- La diferencia se localiza en el tercio inferior del fotograma (tarjeta
  de la cita + gradientes apilados + grano `overlay` + viñeta): media
  0,14–0,43/255, máx 45, solo plano Y. El resto del fotograma es
  EXACTAMENTE idéntico (media 0,00).

**Consecuencia: la identidad bit a bit NO es un criterio válido para
verificar re-renders.** El criterio correcto es perceptual:
PSNR ≥ 40 dB y SSIM ≥ 0,98 contra la referencia (o, mejor, contra el
control del flujo actual). Este doc y la verificación de la pieza 1 usan
ese criterio.

### Hallazgos secundarios (pieza 1)

- **El paso +0,6 dB de V5 no está documentado en ningún sitio.** El
  archivo `marti-fidel-v5-chunks-gain.mkv` es el concat × +0,60 dB
  (diff −101,7 dBFS tras compensar). Solo existe la evidencia del archivo
  y la medición. `--gain-db 0.6` lo reproduce en el flujo `--mix`.
- **El limitador añade +5 ms constantes** (lookahead attack=5) en ambas
  vías (V5 y `--mix`): es comportamiento preexistente de V5, sub-fotograma,
  no una regresión.
- **Nunca mezclar tramos de distintos productores/contenedores en un
  mismo concat.** Un máster de prueba con tramos mp4 nativos de Remotion
  + tramos mp4 despojados (`-map 0:v -c:v copy`) decodificó con 1589/2077
  fotogramas perdidos (timebases distintas: 1/90000 vs 1/16000). ffprobe
  cuenta 2077 paquetes y NO detecta el fallo; solo la decodificación real
  lo revela. `master.py` no detecta este fallo con su verificación de
  conteo (limitación conocida; la QA debe verificar por decodificación).
- **Fallo transitorio EPERM** (21-nov ~02:48 UTC): un render falló a los
  8 s con `EPERM: operation not permitted, write` del hijo Remotion; el
  reintento idéntico funcionó. No se reprodujo; posible bloqueo residual
  de Chromium/bundle. Si recurre, investigar.

---

## Pieza 2 — Tramos incrementales (hash por tramo)

### Cambios (`scripts/render-chunks.mjs`)

Cada tramo lleva un `inputHash` = sha256 de sus entradas:

- `paramsHash`: composición, fps, dimensiones, chunkSize, crf, scale,
  x264Preset, audioCodec, videoOnly, versión de Remotion.
- `codeHash`: `src/` (excluyendo los archivos de captions parseados con
  éxito) + `shared/` + `project.json`.
- `assetsHash`: contenido de `public/` limitado a los assets
  REFERENCIADOS por el código (v2): `staticFile()` literales, plantillas
  `staticFile(`...${...}...`)` como globs (`img/grain/grain-*.png`), y
  literales de ruta con extensión de asset (cubren las rutas que llegan
  por variables de datos, como `v.file`/`c.file`/`c.flag` de las palmas
  y los mapas). En modo vídeo-solo se excluyen los audios
  (`.wav/.mp3/.aac/.ogg/.flac/.m4a/.opus`) para que un cambio de mezcla
  no invalide los tramos de vídeo. Un asset referenciado modificado
  invalida TODOS los tramos (no hay mapa escena→asset; decisión
  conservadora, documentada). Un archivo NUEVO no referenciado NO
  invalida nada. Si el código no referencia ningún asset, fallback a
  hashear todo `public/` (carga dinámica). Los referenciados ausentes
  entran como marcadores `MISSING:<ruta>` (añadir el archivo después
  invalida, correcto). En marti-fidel V5: 63 archivos hasheados en modo
  vídeo-solo (72 con audio) de 228 en `public/`; 320 marcadores MISSING
  (rutas SFX del catálogo de `shared/`, que viven fuera de `public/`:
  constantes, no invalidan).
- Captions por tramo: se detectan por los imports `from './captions-...'`
  del archivo de la composición (fallback: todos los `captions*.ts` de
  `src/`). El literal del array `CAPTIONS` se extrae con un escáner de
  corchetes consciente de strings y se parsea con `JSON.parse`. El
  intervalo de display de cada palabra es [s, s de la palabra siguiente]
  (karaoke pegajoso). Solo las entradas que solapan el rango temporal del
  tramo entran en su hash. Si un archivo de captions no se puede parsear,
  se avisa y su contenido íntegro entra en el `codeHash` global (fallback
  seguro: invalida todo, nunca salta un tramo cambiado).

El manifest guarda `inputHash` por tramo + `inputHashVersion: 2` +
hashes globales + `scale`/`x264Preset`/`draft`, y se reescribe tras CADA
tramo (el concat queda null hasta el final), así que un render
interrumpido conserva los hashes.

**v1 → v2 (21-nov-2026):** la v1 hasheaba TODO `public/`. Durante la
verificación, el agente de V6 añadió tres PNG (`arbol-s5-a/b/c.png`) a
`public/` y el `assetsHash` cambió: el `--resume` de prueba quiso
re-renderizar los 14 tramos en vez de 1. La v2 acota el hash a los assets
referenciados; el cambio de esquema invalida los hashes v1 una sola vez
(mensaje «esquema de hash cambiado (v1 → v2, migración) — re-render»).

**Regla de salto con `--resume`:** archivo existe + conteo de fotogramas
verificado + el manifest previo tiene `inputHash` igual para ese rango →
salto («sin cambios … — salto»). Si no, se registra el motivo: incompleto /
sin hash previo (manifest legacy → re-render de migración, una sola vez) /
entradas cambiadas (muestra los prefijos viejo→nuevo). Sin `--resume`, el
comportamiento no cambia (re-renderiza todo).

Coste de cómputo de hashes (marti-fidel, 486 MB en `public/`, 228
archivos): **746–1295 ms** por corrida.

### Verificación

**Test unitario** (`/tmp/test-hash.mjs`, extrae las funciones del archivo
real): OK — detecta `captions-v41.ts`, parsea 11 segmentos. Caso A (palabra
«ÁRBOLES» s 21,08→21,18): solo el tramo 5 afectado. Caso B (palabra
«LEGUAS!» s 24,58→24,68, mostrada a caballo del límite tramo 5/6): tramos
5 y 6 (la lógica pegajosa funciona). Caso C (cambio de texto): solo el
tramo 1.

**Verificación con render** (21-nov-2026, sobre la línea base v2):
tocar UN tiempo de caption en el worktree («ÁRBOLES» s 21,08→21,18, caso
A) y `--resume`: **solo el tramo 5 se re-renderizó** («entradas cambiadas
(hash 8ac18d56a45c → 117f3eb6f7ff) — re-render», 150/150 f verificados);
los otros 13 tramos saltaron («sin cambios — salto»). Tiempo: **91 s**
frente a 789 s del re-render completo (caja tranquila): **ahorro de
~12 min (88%)**. Al revertir el caption, otro `--resume` re-renderizó
solo el tramo 5 (89 s) y su hash volvió al original (`8ac18d56a45c`).
El caption se revirtió y `git diff` quedó limpio para ese archivo
(nunca se commitean cambios al reel).

---

## Pieza 3 — Modo borrador

### Cambios

- `render-chunks.mjs --draft`: scale 0,5 (540p), preset x264 `veryfast`,
  CRF 23, vídeo-solo (separate-audio). `--scale`/`--crf`/`--x264-preset`
  explícitos anulan los defaults del borrador. Directorio por defecto
  `out/chunks-draft` (nunca pisa los tramos 1080p).
- `master.py --draft` = `--no-light`.

Receta:

```bash
node scripts/render-chunks.mjs marti-fidel --draft
python scripts/audio/master.py --chunks-dir projects/marti-fidel/out/chunks-draft \
  --mix <mezcla.wav> --draft
```

Sin auditoría (es para revisión creativa, no para entregar).

### Verificación

(21-nov-2026, con el candado, caja cargada por trabajo paralelo de V6):
borrador completo de marti-fidel: render **6 min 23 s** (383 s, 14 tramos,
2077 f, 540×960 verificado) + máster `--draft` **9 s** (2077 f, −15,90
LUFS, TP −4,30 dBTP). **Total: ~6 min 32 s.** No llega a los ~4 min
estimados: el cuello de botella es el render de fotogramas en Chromium
(React/layout/paint), que no escala linealmente con la resolución — bajar
a 540p + `veryfast` + CRF 23 aproximadamente divide por 2 el tiempo
(1080p en las mismas condiciones de carga: 25 min 6 s; en caja tranquila:
13 min 9 s). El hash de parámetros distingue borrador de 1080p
(`paramsHash` distinto), así que los tramos draft nunca colisionan con
los 1080p en el mismo `--resume` (además salen a `out/chunks-draft`).

---

## Tiempos de iteración estimados (con las 3 piezas)

- **Cambio de audio (mezcla):** solo máster `--mix` (~1,7 min medido) +
  auditoría (~12 min, sin cambios). Los tramos NO se tocan. Antes: ~14 min
  de re-render + máster.
- **Cambio de una escena (1 caption / 1 tramo):** re-render incremental
  ~1,5 min (medido: 91 s) + máster `--mix` ~1,7 min + auditoría (~12 min,
  sin cambios). Antes: ~13 min de re-render + máster. Un cambio de código
  o de asset referenciado invalida los 14 tramos (re-render completo,
  ~13–25 min según la carga de la caja) + máster.
- **Revisión creativa (borrador 540p):** ~6,5 min medido (render 6 min
  23 s + máster 9 s), sin auditoría. No llega a los ~4 min estimados
  (el render de fotogramas domina y no escala lineal con la resolución).

---

## Texto exacto para `repo/AGENTS.md` (lo integra el coordinador)

```md
## Tramos vídeo-solo + mezcla en el máster (21-nov-2026, hub-speed-v5)
Renderizar tramos SIN audio (`render-chunks.mjs --video-only`: audio a
PCM-16 separado con `--separate-audio-to` y descartado; NO usar `--muted`,
que produce píxeles distintos) y muxar la mezcla en el ensamblado
(`master.py --mix <wav>`). Con `--mix` la cadena es limpia por defecto
(sin trim/boost/atempo); la mezcla mono se duplica a estéreo a −3,01
dB/canal como hace Remotion. Un cambio de mezcla ya NO re-renderiza el
vídeo: solo el máster (~2 min). `--gain-db` reproduce el paso +0,6 dB de
V5 (no documentado en su momento). Nunca mezclar en un mismo concat
tramos de distintos productores/contenedores (timebases distintas →
fotogramas perdidos que ffprobe no detecta).

## Tramos incrementales (21-nov-2026, hub-speed-v5)
`render-chunks.mjs --resume` salta los tramos cuyo `inputHash` (código +
assets referenciados + captions del tramo + parámetros, en
`manifest.json`) no cambió. Un cambio de caption re-renderiza solo los
tramos que muestran esa palabra (karaoke pegajoso: [s, s siguiente)).
En modo vídeo-solo los audios no entran en el hash (un cambio de mezcla
no invalida vídeo). El hash de assets cubre solo los assets
referenciados por el código (`staticFile`, globs de plantillas y
literales de ruta): añadir archivos no referenciados a `public/` no
invalida tramos.

## Modo borrador (21-nov-2026, hub-speed-v5)
`render-chunks.mjs --draft` (540p, veryfast, CRF 23, vídeo-solo, sale a
`out/chunks-draft`) + `master.py --mix <wav> --draft`. Solo para revisión
creativa, sin auditoría; nunca para entregar.

## No-determinismo del render (21-nov-2026, hallazgo)
El render NO reproduce fotogramas bit-idénticos entre corridas en escenas
con gradientes/blends apilados (±1 nivel, PSNR ~44–55 dB, SSIM ≥0,985,
sub-visual): dos renders del MISMO comando difieren. La identidad bit a
bit NO es criterio válido para verificar re-renders; usar PSNR ≥ 40 dB /
SSIM ≥ 0,98 contra la referencia. Ver `docs/HUB-SPEED-V5-RENDER.md`.
```

## Archivos

- `scripts/render-chunks.mjs` (modo vídeo-solo, hashes incrementales,
  borrador, `--scale`/`--x264-preset`)
- `scripts/audio/master.py` (`--mix`, `--gain-db`, `--no-light`, `--draft`)
- `docs/HUB-SPEED-V5-RENDER.md` (este documento)
- `scripts/audio/README.md` (tabla de `master.py` + subsección vídeo-solo)

Scripts de verificación (fuera del repo, en
`~/workspace/hub-speed-v5-verify/`): `compare-video.sh` (framemd5 por
fotograma), `compare-av.py` (RMS/lag por ventana/diff con ganancia),
`audit-v5mix.sh` (auditoría del máster de prueba).
