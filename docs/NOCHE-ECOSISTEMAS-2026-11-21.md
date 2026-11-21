# Noche de ecosistemas — sábado 21-nov-2026

Mientras dormías, seis trabajadores auditaron y mejoraron los cinco
ecosistemas y construyeron uno nuevo. Todo lo que sigue está
**verificado** (con renders, audios, piezas o tests reales) y guardado
en ramas `work/*` con push verificado. Nada se publicó, posteó,
borró ni compró. El reel Martí-Fidel (rama `work/marti-fidel-v3`) no
se tocó.

## Resumen

| Ecosistema | Estado | Lo principal |
|---|---|---|
| Memes (prioridad) | Mejorado | Ideas tema→meme, packs por lotes, tira cómica, 3 fuentes, 6 clips nuevos, 22 plantillas con cajas |
| Video / hub Remotion | Mejorado | `new-reel` (guion+VO→proyecto), puerta de pre-vuelo en código, presets por plataforma, probador de ganchos |
| Podcast | Mejorado + versionado | Notas con puntos clave, modo resumen, `list`, verificación con sonoridad; el módulo ya está en git |
| Videos largos | Reparado + mejorado | El pipeline estaba roto tras la fusión v5 (3 bugs, corregidos); orquestador de 13 pasos, capítulos YouTube, ingesta de camas Flow |
| Contenido estático | Mejorado | 4 plantillas nuevas (10 total), constructor de carrusel desde texto, QA automático de marca, galería |
| **Noticias → contenido (NUEVO)** | **v1 funcional** | Noticia → borradores validados (reel, post, meme) + puente al render de memes |

## 1. Memes — la prioridad (`work/meme-v2-2026-11-21`, `924be39`)

**Auditoría:** sin lotes (las tandas de 33 piezas se hacían a mano),
sin generador de ideas, solo 12/100 plantillas con cajas, una sola
fuente, sin tira cómica, sin borrador rápido de vídeo, y el refresco
semanal descargaba relleno y detectaba mal el green screen.

**Construido:**
- `scripts/meme-ideas.py` + `templates/roles.json` — tema → ideas con
  plantilla + textos (16 roles de imagen + 5 de vídeo, deterministas).
- `scripts/meme-pack.py` — manifiesto JSON → pack completo en un
  comando (imagen, vídeo, texto, cómic, chat, rejilla) + hoja de
  contacto. Verificado con un pack real de 8 piezas sobre «el apagón»:
  8/8 OK.
- 10 plantillas más con cajas medidas (22 total): Gru, Expanding
  Brain, Buff Doge, Boardroom, Balloon, X Everywhere, Skeleton,
  Boromir, Disaster Girl, Ancient Aliens.
- `--comic` (tira vertical), `--font` (Archivo Black + Anton +
  Bangers, todas OFL), `--draft` en vídeo (540p, 2,4 s).
- 6 plantillas de vídeo nuevas (33 total, 22 green screen).
- Refresco con `--only` y detección green por píxeles (antes por HTML).

**Corrección del coordinador (verificación del puente de noticias):**
las cajas de Two Buttons cubrían el rectángulo del botón, no la cara
blanca: con textos largos el texto se salía a la pared azul. Cajas
re-medidas por píxeles (rectángulos blancos inscritos sobre cada botón
rojo) + 2 pruebas de regresión. El meme de Riemann quedó con ambos
textos dentro de cada botón.

**Suite: 47/47 en verde.** Cómo se usa:
```bash
cd ~/workspace/remotion-hub/worktrees/meme-v2/memes
python3 scripts/meme-ideas.py "el apagón" --n 8 --json pack-apagon.json
python3 scripts/meme-pack.py pack-apagon.json --sheet
```

**Pendiente:** carrusel de Instagram (4:5) no implementado; 78
plantillas sin cajas (las 22 cubren las más usadas); vídeo con IA
sigue bloqueado por pago (Pollinations $0).

## 2. Video / hub Remotion (`work/hub-v6-2026-11-21`, `f9d2387`)

Construye sobre hub-speed-v5 (no lo rehace). **Auditoría:** faltaba
arrancar un reel sin hacerlo todo a mano, la puerta del pre-vuelo era
solo regla, no había adaptación por plataforma ni forma barata de
probar ganchos.

**Construido:**
- `scripts/new-reel.mjs` — guion + VO → proyecto completo (composición,
  captions con Whisper + alineación, plan de edición, ganchos,
  manifiesto de pre-vuelo, RUNBOOK).
- Puerta del pre-vuelo **cableada** en `render-chunks.mjs` (era el
  pendiente de hub-speed-v5): sin informe, con bloqueantes o caducado
  → exit 2 con el comando exacto; `--skip-preflight` registrado.
- `shared/platforms.ts` — Reels/Facebook/TikTok/Shorts con zonas
  seguras verificadas en web, `SafeZoneOverlay`, `ClosingCard`
  reutilizable, karaoke variante `pill`.
- `scripts/hook-test.mjs` — variantes de los primeros N segundos en
  540p (2 variantes en 39 s en la prueba).
- Alineador: corrige pausas puenteadas (Whisper puso «MARTÍ» a 3,66 s
  con la voz real en 4,12 s y el VERIFY decía PASS) + `--json-out`.
- Karaoke solo durante la VO (antes quedaba sobre el cierre).

**Verificación E2E** (proyecto `hub-v6-e2e`, guion 3 líneas, VO Kokoro
10,61 s): alineación 0,46→0,01 s de desvío máx; puerta en vivo (exit 2
`missing` y `stale`); render 394/394 fotogramas; máster 13,133 s;
fotogramas revisados a ojo. **Tests: Node 73/73, Python 117 OK.**
Evidencia en `~/workspace/hub-v6-verification/`.

**Pendiente:** `new-reel --help`; el pre-vuelo no detecta el masthead
tapado (requeriría OCR); el alineador solo corrige inicios de palabra.

## 3. Podcast (repo git local `~/workspace/remotion-hub/podcast/`, `946a09d`)

**Hallazgo estructural:** el módulo NO estaba en git (vivía fuera del
repo). Se versionó: repo git local con 72 archivos (código, docs,
guiones, notas; audios y modelos ignorados pero intactos) + copia de
seguridad previa verificada (`podcast-backup-2026-11-21-pre-v2.tar.gz`,
123 MB). Subirlo a GitHub necesita crear un repo nuevo: decisión tuya.

**Construido:**
- Notas con puntos clave (`podcast.py notes`): recap «En resumen»,
  idea de apertura y acción final por capítulo, con marcas de tiempo.
- Modo resumen (`podcast.py recap`): por CORTE del MP3 final, sin
  re-sintetizar — 14,5 min → 3,2 min en 24,5 s; 2,8 min → 1,7 min
  en 6,5 s; ambos a −16,4 LUFS.
- `podcast.py list` (estado de episodios), `verify.py` mejorado
  (sonoridad del MP3, capítulos embebidos, informe
  `final.verify.json`), `produce --verify`.
- Bug corregido: `produce` rompía con `AttributeError: keep_raw`
  después de sintetizar. RTF honesto en reanudación. Plantilla
  recalibrada (1.180 car/min medidos, no 850).

**Verificación:** episodio real «El gancho: cómo abrir un texto para
que lo lean» (2,8 min, 4 capítulos): síntesis RTF 1,69, −16,6 LUFS,
verify OK (similitud 0,977, 0 defectos). **8 pruebas, 0 fallos.**

**Experimento kokoro-onnx (medido, NO adoptado):** fp32 RTF 1,09 ≈
PyTorch 1,11 (sin ganancia); int8 RTF 3,20 (3× más lento). No hay
atajo por ONNX en esta VM; el cuello es el cómputo del modelo.

**Pendiente:** decidir el repo en GitHub; edge-tts no re-verificado
(sin indicios de cambio del entorno).

## 4. Videos largos (`work/longform-v2-2026-11-21`, `beb1174`)

**Auditoría:** el pipeline de `work/hub-speedup-2026-11-19` estaba
**roto tras la fusión con v5** (3 bugs de integración: el concat
esperaba `.mp4` pero v5 produce `.mkv`; el QA declaraba un artefacto
inexistente; el render sin `--video-only` invalidaba hashes al
cambiar la mezcla). Faltaban los pasos `timeline` y `align` (a mano),
capítulos YouTube, estimación e informe de progreso.

**Construido:**
- Orquestador v2 (`scripts/pipeline.mjs`): 13 pasos (`vo → qa`),
  reanudable por frescura, `--estimate`, informe
  `reports/pipeline-progress.json/.md`, candados para pasos pesados.
- `scripts/chapters.mjs` (capítulos YouTube), `scripts/audio/bed-import.py`
  (ingesta de camas Flow con ventana limpia Whisper+VAD).
- Cama `documentary-flow-a` registrada y verificada (ventana 89–149 s
  de la pista Flow; la zona 60–88 s tiene voces).

**Verificación E2E** (proyecto `longform-smoke`, VO 113,1 s):
**PIPELINE_OK**; auditoría 0 FAIL / 10 WARN / 5 PASS; máster
1920×1080, −15,4 LUFS, 0 s de silencio final. **Tests: 16/16 Node,
85 Python OK.** Suite completa 70/72: los 2 fallos son una carrera
preexistente (persistence↔real-recovery, fixture compartido), ajena a
estos cambios.

**Pendiente:** importar las otras 3 pistas Flow locales (~3 min cada
una); calibrar el ducking (WARN de bombeo 8,4 dB) en un video real.

## 5. Contenido estático (`work/content-hub-v2-2026-11-21`, `9a4a69f`)

**Construido:**
- 4 plantillas nuevas (10 total): `breaking` (última hora, 1:1 + 4:5),
  `stat` (tarjeta de un dato), `cover` (portada 16:9), `timeline`
  (línea de tiempo 4:5). Todas con logo completo 1× y datos reales
  verificados en los ejemplos.
- `content/scripts/build-carousel.mjs` — carrusel desde texto (viñetas
  o Markdown): valida densidad ANTES de crear (titular ≤15, cuerpo
  ≤30, total ≤50; 3–8 láminas) y verifica que ningún titular cae sobre
  una cara.
- `brand-check.mjs` + `brand-pixels.py` (logo completo 1×, rojo
  `#ED1C24` presente en píxeles), `qa.mjs` (densidad + marca + caras),
  `gallery.mjs` (índice visual de las 10 plantillas), render por lotes
  (`--all-pieces`).

**Verificación:** carrusel ONU 130-17-25 de 7 láminas + 4 piezas en los
formatos nuevos + regresión v1 (trump-cuba, prueba-hero). **17/17
tests en verde.** Las 5 piezas quedan en fase `review`: falta tu visto
bueno editorial (o de Suleris) antes de publicar, como siempre.

**Pendiente:** tarjeta de evento (sin evento real próximo para
verificar el ejemplo); conversión a Canva (requiere navegador y tu
decisión); el QA visual sigue siendo obligatorio.

## 6. NUEVO: Noticias → contenido (`~/workspace/news-content/` + skill `news_to_content`)

No duplica el radar ni el feed (que ENCUENTRAN noticias): CONVIERTE
cada noticia en borradores listos. Pipeline en 4 pasos: ingesta (URL
o texto) → clasificación (radar + sección del feed) → borradores
(reel/post/meme) → validación determinista (sin PASS no se entrega).
Python stdlib, sin dependencias.

**Verificación con noticias reales del 21-nov:** 3 ítems, 3 borradores:
- Díaz-Canel ofrece diálogo a EE.UU. (AlbertoNews/EFE) → reel de 152
  palabras ≈ 61 s. Clasificación: declaración / Cuba-EE.UU.
- Venezolanos con TPS sin protecciones (CNN en Español) → post,
  titular de 12 palabras. Hecho confirmado / Venezuela-LatAm.
- Matemático de Anthropic dice haber resuelto Riemann (El País) →
  meme Two Buttons, con etiqueta PENDIENTE DE VERIFICACIÓN.
  Preliminar / IA y tecnología.
- Caminos negativos verificados (borrador sin clasificar, rumor sin
  nota, publicación citada sin fuente primaria: los 3 fallan con
  exit 2). **40 pruebas en verde.**

**Puente a memes (`news2meme.py`, del coordinador):** del borrador de
meme al meme renderizado en un comando. Verificado con el ítem
Riemann (`out/meme-2026-11-21-riemann-anthropic/01-two-buttons.jpg`).
La verificación cazó el defecto de cajas de Two Buttons (ver §1).

```bash
cd ~/workspace/news-content
python3 news.py new --id <slug> --url "<url>" --source-name "Medio"
python3 news.py fill <slug> --who ... --what ... --when ... --where ...
python3 news.py classify <slug> --class declaración --section "Cuba-EE.UU."
python3 news.py draft <slug> --type reel|post|meme
python3 news.py validate <slug>
python3 news2meme.py <slug> --render   # solo si hay borrador de meme
```

**Pendiente:** la fuente primaria del post de la Presidencia sobre
Díaz-Canel quedó `pendiente` (necesita navegador en vivo); sin
ingesta automática desde radar/feed ni cron (v2, bajo demanda por
ahora); ingesta por URL sin probar contra paywall.

## Incidentes de la noche (resueltos, sin pérdida)

- La celda se reinició ~05:10 UTC: se perdió `/tmp` (evidencia
  volátil); todo lo durable estaba en worktrees y se re-verificó.
- `/tmp` es un tmpfs de 512 MB y se llenó una vez: desde entonces el
  trabajo pesado usa `TMPDIR=~/workspace/.tmp`.
- Un EPERM transitorio al escribir un WAV y un error transitorio de
  Chrome (CDP -32000): ambos superados con reintento; la reanudación
  por manifest recuperó el audio sin re-sintetizar.

## Ramas y ubicaciones

| Ecosistema | Rama / ubicación | HEAD |
|---|---|---|
| Memes | `work/meme-v2-2026-11-21` | `924be39` |
| Video / hub | `work/hub-v6-2026-11-21` | `f9d2387` |
| Podcast | `~/workspace/remotion-hub/podcast/` (git local, sin remoto) | `946a09d` |
| Videos largos | `work/longform-v2-2026-11-21` | `beb1174` |
| Contenido estático | `work/content-hub-v2-2026-11-21` | `9a4a69f` |
| Noticias (nuevo) | `~/workspace/news-content/` + `~/workspace/custom-skills/news_to_content/` | — |
| Este informe | `work/noche-ecosistemas-2026-11-21` | — |

Todas las ramas parten de trabajo existente y no tocan
`work/marti-fidel-v3` ni `main`. Cada rama trae su propia
documentación (AGENTS.md / README / auditoría con fecha).
