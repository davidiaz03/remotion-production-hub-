# Hub v6 — andamiaje, puerta de pre-vuelo, presets y ganchos (21-nov-2026)

Rama `work/hub-v6-2026-11-21`, sobre `work/hub-speed-v5` (`3119aef`).
Noche de ecosistemas: el usuario veía el hub «bastante completo», así
que el trabajo fue arrancar reels nuevos más rápido, cablear la regla
que faltaba y adaptar la salida a las redes de hoy — no reescribir lo
que ya funcionaba.

## Auditoría: qué faltaba

1. **Arrancar un reel nuevo era manual**: crear el proyecto, escribir
   `Video.tsx`, transcribir la VO, alinear captions, armar el plan de
   edición, el manifiesto de pre-vuelo y el runbook — cada paso a mano.
2. **La puerta del pre-vuelo era solo una regla** en AGENTS.md:
   nada impedía renderizar un máster sin pre-vuelo PASS.
3. **Sin adaptación por plataforma**: un solo tamaño de caption y
   ninguna zona segura; cada reel reinventaba el cierre.
4. **Sin forma barata de probar ganchos**: el primer render útil era
   el borrador completo.
5. **Huecos encontrados durante la verificación** (no en la auditoría
   inicial): Whisper puentea pausas y el alineador no lo cazaba; el
   karaoke pegajoso invadía el cierre; `research/captions.json`
   quedaba con tiempos pre-alineación.

## Lo construido

### (a) Andamiaje de reel nuevo — `scripts/new-reel.mjs`
`node scripts/new-reel.mjs <slug> --title "..." --script GUION.md --vo vo.wav [--platform ...] [--karaoke classic|pill] [--key-words a,b] [--handle @x] [--captions caps.json | --timings estimate]`

Genera el proyecto completo: `src/Video.tsx` (1 escena por línea del
guion como tarjeta de storyboard sobre degradados de marca, VO,
karaoke cableado, `ClosingCard` de 2,5 s, guía de zonas seguras con
`debugSafeZones`), `src/captions.ts`, `research/edit-plan.json`,
`research/hooks.json` (variante 0 = primera línea), `preflight-scenes.json`,
`GUION.md` y `RUNBOOK.md` con los comandos exactos del flujo (alinear →
pre-vuelo → borrador → ganchos → máster → auditoría). Duración = VO + 75 f.
Nunca sobrescribe un proyecto existente.

Captions: por defecto Whisper + alineación al guion
(`scripts/audio/transcribe-vo-file.py`, el caso que `transcribe-vo.py`
no cubre: VO de un solo archivo sin `vo-lines.json` — un
SequenceMatcher sobre todo el documento + interpolación, informe de
anclas por línea, chunks de ≤4 palabras con cortes tras puntuación
fuerte). `--captions` acepta un JSON CapSegment[] validado;
`--timings estimate` reparte uniforme y lo marca ESTIMADO.

### (b) Puerta del pre-vuelo — `scripts/preflight-gate.mjs`
`render-chunks.mjs` exige un informe de pre-vuelo válido ANTES de
renderizar (también en `--draft`): sin informe, con bloqueantes, de
otro proyecto/composición o caducado, bloquea con código 2 y el
comando exacto para repetir el pre-vuelo. `--skip-preflight` salta la
puerta (solo iteración rápida, nunca un máster) y queda registrado en
`resumeCommand`. Frescura por `generatedAt` del informe (no por mtime
del archivo, que mentiría ante una copia) contra el input de layout
más reciente: `src/` excepto captions, `shared/`, `project.json`,
`preflight-scenes.json`, imágenes de `public/`; `out/` excluido
(circular). El informe lleva `reportVersion`, `project`,
`composition` y `generatedAt`.

### (c) Presets por plataforma — `shared/platforms.ts`
`instagram-reels`, `facebook-reels`, `tiktok`, `youtube-shorts`
(todos 1080×1920): zona segura de anuncios (números publicados),
zona orgánica medida, tamaño de caption, duración máxima/recomendada
y corte de alcance. Números verificados en la web el 21-nov-2026
(Sprout Social actualizada 2026-11-02, Shotstack, Hootsuite, Mark
Studios); fuentes citadas en la cabecera del módulo. Meta: zona
segura 14%/35%/6% (269/672/65/65 px). TikTok: plantilla 240/660/
120/120 (carril derecho 300 px bajo y=840). Shorts: 288/672/48/192.
Duraciones: IG Reels 20 min máx pero >3 min sin recomendación a
no-seguidores; TikTok 60 min subida / 10 min en app; Shorts 3 min;
FB Reels sin límite en app (API 3–90 s).

### (d) Probador de ganchos — `scripts/hook-test.mjs`
`node scripts/hook-test.mjs <proyecto> [--seconds 3] [--variants 0,1] [--out out/hooks] [--scale 0.5] [--dry-run] [--force]`
Renderiza los primeros N segundos por variante de
`research/hooks.json` (540p, CRF 23, veryfast) en
`out/hooks/variant-NN.mp4` + `index.json`. La composición debe leer
la prop `hookVariant` (el esqueleto de `new-reel` ya lo hace); si no
la menciona, se niega salvo `--force`. No adquiere el candado de
render: quien lo llama envuelve con `flock` + `render-lock.sh`.

### (e) Tarjeta de cierre + karaoke píldora
`shared/ClosingCard.tsx`: cierre reutilizable (logotipo completo,
título Archivo Black, regla roja, subtítulo, píldora del handle,
degradado azul noche; `sequenceFrames` controla el fade de salida).
`BottomKaraoke` acepta `variant="pill"` (palabra actual en píldora
roja) además de `classic` (por defecto, sin cambios para proyectos
existentes). `shared/SafeZoneOverlay.tsx`: guía visual de estudio
(solo con `show=true`).

### (f) Alineador: pausas puenteadas + `--json-out`
Whisper a veces termina la palabra anterior tarde Y empieza esta
pronto: el inicio cae dentro de la cola de la palabra anterior y el
criterio de silencio previo no dispara. Caso real E2E: «MARTÍ» a
3,66 s con la voz real en 4,12 s (silencio digital 3,7–4,1 s); la
primera corrida decía VERIFY PASS con un error de 0,46 s sin
detectar. Segunda oportunidad (`envelope.onset_after_silence`:
primer ataque sostenido tras una racha de silencio ≥0,15 s, dentro
del fin de la palabra — la guarda del fin impide robar el onset de
la palabra siguiente); el informe marca `bridged: true`.
`align-captions.py --json-out` exporta los captions corregidos en
JSON plano HubCaption (el que lee `audit-audio.py`); sin él,
`research/captions.json` quedaba con tiempos pre-alineación.

### (g) Karaoke solo durante la VO
BottomKaraoke es pegajoso: sin una `Sequence` que lo apague, el
último chunk queda visible sobre la tarjeta de cierre (visto en el
still CLOSING del pre-vuelo E2E). El esqueleto lo monta dentro de
`Sequence(0, CLOSING_FROM)`.

## Verificación (proyecto `hub-v6-e2e`, guion 3 líneas, VO Kokoro 10,61 s)

- `new-reel` (ruta Whisper): 3 segmentos, 8 chunks, 26 palabras;
  anclas 11/12 + 5/6 + 8/8. Whisper: 9 s. Pared 7m38s (casi todo
  espera del candado pesado compartido con los demás trabajadores).
- `tsc --noEmit`: limpio (incluido el proyecto generado).
- Alineación: LEER 7,32→7,45 y PENSAR 8,72→8,78 (criterio clásico);
  MARTÍ 3,66→4,12 y EN 5,06→5,34 `[puenteada]` (segunda oportunidad);
  desvío máx 0,46→0,01 s; sobre el umbral 2→0; VERIFY PASS.
- Puerta: `render-chunks` sin informe → exit 2 `missing`, sin crear
  `out/`; tras editar `src/Video.tsx` → exit 2 `stale` nombrando el
  archivo y las marcas (05:35:19 > 05:34:36).
- Pre-vuelo `--stills`: 60,6 s; 0 bloqueantes, 4 avisos (dead-frame
  en las 4 tarjetas — esperado: degradados planos — y duplicado
  S3↔CLOSING por pHash, mismo motivo). Stills revisados a ojo: S1
  con la tarjeta y la píldora «AÑOS,» correcta; CLOSING con título,
  regla roja y `@memorialdenuncia` (sin karaoke tras la corrección).
- Render + máster: cadena completa (align idempotente + pre-vuelo
  fresco + render + máster) 5m35s pared. Render 1080p: 3 tramos,
  394/394 fotogramas verificados, concat OK. Máster 13,133 s,
  1080×1920, 1.080.909 B; ligera 398.099 B; −25,9 LUFS, TP −8,0
  dBTP (VO sola, sin cama ni etapa de ganancia). Fotogramas del
  máster revisados a ojo: f128 muestra «MARTÍ» en la píldora a
  4,28 s (el tiempo corregido; con el tiempo puenteado habría
  aparecido a 3,66 s); f356 (cierre) limpio, sin karaoke.
  Lección: el render corrió SIN candado de render porque el
  `source scripts/render-lock.sh` dentro de `flock -c` (dash) no
  existe — sin daño (el flock pesado sí serializaba), pero el
  runbook documentaba el patrón roto. Corregido a `.` POSIX y
  verificado con ciclo adquirir/liberar bajo dash; aviso añadido
  a `docs/HUB-SPEED-V5-LOCK.md`.
- Hook-test: 2 variantes, 3 s, 540p, en 39 s junto con el still
  de zonas seguras. `variant-00.mp4` (173.141 B) y `variant-01.mp4`
  (176.655 B) difieren (SHA distintos; el fotograma de v1 muestra
  el texto alternativo «TREINTA AÑOS DE VOTO UNIDO. Y UN DÍA, EL
  CARIBE SE PARTIÓ.» con el mismo karaoke de la VO). `index.json`
  con textos y rutas.
- SafeZoneOverlay: still a f45 con `debugSafeZones` — rectángulos
  en la geometría correcta (segura roja 65/672/269 px, orgánica
  ámbar 60/420/220 px) con etiquetas legibles. Observación: el
  karaoke de la casa (bottom 235) queda POR DEBAJO de la zona
  orgánica (420) — la guía muestra la tensión; el preset ofrece
  `bottomStrict` y `new-reel --caption-safe` para quien lo quiera
  dentro de la zona.
- Auditoría de audio del máster: FAIL explicado, no defecto de
  hub-v6. 1 FAIL = 3 intervalos de silencio ≥0,3 s: las 2 pausas
  naturales entre líneas (3,73–4,13 y 7,06–7,46, 0,40 s cada una)
  y la cola del cierre sin cama (10,31–13,14). 2 WARN: loudness
  −25,9 LUFS (VO sola, sin etapa de ganancia) y desvío Whisper
  +0,30 s en «en» (sesgo propio de Whisper sobre la mezcla: la
  alineación acústica por envolvente dice 5,34 con desvío 0,00;
  la mediana firmada del máster es 0,0). El E2E no es un
  entregable (sin cama ni loudness), así que el FAIL no bloquea
  nada; cada flag tiene explicación medida.

## Tests

- Node: 73 tests (`node --test --test-concurrency=1 tests/*.test.mjs`):
  51 de base + 10 puerta + 6 plataformas + 3 new-reel + 3 hook-test.
- Python: `scripts.test_visual_preflight`, `scripts.audio.test_microcut`,
  `scripts.audio.test_align_audit` (29 tests: +5 hub-v6 — 2 envelope,
  2 align puenteada, 1 json-out), `scripts.audio.test_select_bed_window`,
  `scripts.audio.test_transcribe_vo_file` (11 tests).
- Corrección de base: la suite de Node fallaba 4 tests en el HEAD de
  partida por estado demo commiteado (`approvedRevision:
  demo-persisted-v1`); los tests ahora afirman el estado heredado en
  vez de suponer demo sin aprobar. `persistence.test.mjs` copiaba el
  `.git` archivo de los worktrees y creaba commits espurios en el
  repo real; el filtro lo excluye.

## Notas operativas

- Worktrees: `node_modules` NO viene con el worktree; enlazar
  `ln -s ~/workspace/remotion-hub/repo/node_modules node_modules`
  (el `.gitignore` lo cubre). Re-verificarlo antes de suites/renders.
- `TMPDIR=~/workspace/.tmp` para trabajo pesado: `/tmp` es un tmpfs
  de 512 MB y ya se llenó una noche (además, la celda puede
  reiniciarse y vaciarlo).
- La evidencia durable del E2E vive en el proyecto
  `projects/hub-v6-e2e/` (commiteado): captions, informes de
  alineación/máster, pre-vuelo y `index.json` de ganchos. Los MP4 y
  JPG son salidas de build (gitignore) y no se versionan. Los
  informes que las herramientas escriben en `out/` o `reports/`
  (gitignore) se copiaron a `research/` como instantáneas
  (`preflight.json`, `hooks-index.json`, `audit-report.json/.md`)
  para que la evidencia sobreviva.

## Pendiente

- `new-reel.mjs --help`: hoy `--help` se trata como slug y tira
  error de uso. Añadir ayuda real (3 líneas, sin tocar el parseo
  testeado más que para interceptarlo).
- El pre-vuelo no detecta el masthead tapado (límite conocido desde
  hub-speed-v5; requeriría OCR): la revisión humana sigue siendo
  obligatoria.
- El alineador solo corrige inicios; los fines de palabra de Whisper
  quedan como están (el check (b) de fin es WARN, no FAIL).
