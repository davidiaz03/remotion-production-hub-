# Video largo — 5 mejoras P0 de agilidad (23-nov-2026)

Mismo enfoque que `docs/REEL-PIPELINE-P0.md` en el repo principal:
medir los tiempos reales del primer video largo, atacar los cuellos
de botella con cambios en el pipeline (no con un informe), verificar
cada cambio y documentar el ahorro esperado para el segundo largo.
**Sin bajar la calidad**: cada cambio conserva las puertas duras
(pre-vuelo, auditoría, QA técnico).

Orden del usuario (23-nov 17:57): «Ojalá el proceso se pudiera hacer
más ágil, hay que trabajar en eso».

## 1. Tiempos reales del primer largo

Proyecto `libreto-pagina-62mil` («La página que engañó a 62.000
personas», 9:08, 28 escenas, 16.449 f). El coordinador arrancó a las
21:34 UTC con la orden «Procede»; máster a las 23:22 UTC; entrega
23:49 UTC. Total del coordinador: **~2 h 15 min**.

Los tiempos se reconstruyeron de los mtimes de los artefactos y del
historial del coordinador: `reports/pipeline-progress.json` solo
guardaba la ÚLTIMA corrida (rango chapters→qa), así que los tiempos
de la corrida completa se perdieron (§5 corrige esto).

| Paso | Real | Nota |
|---|---|---|
| VO editar + verificar (pre-pipeline) | ~23 min | recurrente por video |
| Camas: scan/import (pre-pipeline) | ~21 min | + ~25 min de generación en navegador |
| Preparar assets (public/) | ~2 min | |
| **Biblioteca de componentes (21 archivos)** | **~19 min — COSTO ÚNICO** | el 2º largo la reutiliza |
| Captions (Whisper) | ~3 min | 0,3x sobre 545 s |
| Align | ~1–2 min | |
| SFX + cama + mezcla | ~5 min | music-bed 22:08, mix 22:10 |
| **Pre-vuelo (3 corridas + correcciones)** | **~33 min pared** | corrida 1 FAIL (2 BLOCK); correcciones ~15–18 min; corridas 2–3 PASS. Cómputo ~13–15 min; cada corrida ~4–5 min |
| **Render** | **~30 min** | 19 tramos × 900 f, concurrencia 2, **0,109 s/f** |
| Máster | ~5 min | incl. SIGTERM ~23:18 + reanudación; ~1–2 min perdidos |
| Encode | **563 s exactos** | 720p 374 s + 360p 189 s = 9,4 min (1,03x) |
| Chapters | ~0 s | |
| **QA** | **763 s = 12,7 min** | qa-media ~2–3 min; auditoría de audio ~10 min, de los cuales Whisper ~6–8 min |
| Checklist / commit / entrega | ~2 min | |

**Estimaciones vs real (tasas viejas):** render est. 21:56 vs 30 min
(+37%); QA est. 8:49 vs 12:43 (+44%); encode est. 6 min (0,66x) vs
9,4 min (1,03x, +56%); máster est. 6,5 vs ~5 min (en objetivo);
pre-vuelo est. 20 s/escena vs ~9,6 s/escena reales (2x de
sobre-estimación).

**Mediciones de esta revisión:**
- Whisper sobre el máster: **RTF 0,885** (muestra de 120 s, 23-nov,
  bajo contención con un render de reels — cota superior). La pasada
  Whisper de la auditoría sobre 548 s ≈ 485 s ≈ 8 min.
- `vo-full.wav` es **byte-idéntico** a `vo-edited-clean.wav` (sha256
  `42e06970…`): la preparación de VO ya transcribió esa misma VO con
  word_timestamps y la verificó contra el guion; el paso captions la
  re-transcribía.
- Arranque de tramo ~18 s (medido 19-nov): con 19 tramos son ~3 min
  de arranque; subir a tramos de 1800 f ahorraría solo ~1,5 min y
  empeora la granularidad de reanudación.

## 2. Cuellos de botella y cambios

### 2.1 Render, 30 min — suelo de hardware, solo recalibrar

El mayor paso único, pero **no se toca a ciegas**: la caja tiene 1,5
CPU y el render es cómputo puro. Cambiar chunk o concurrencia sin
medir puede empeorarlo. Lo que se hizo:
- Tasa recalibrada en `scripts/pipeline.mjs`: `renderPerFrameS`
  0,08 → **0,11** (el `--estimate` de libreto ahora da 30 min 09 s;
  el real fue 30 min).
- **Plan de experimento** (pendiente, §6): A/B en
  `projects/longform-smoke/` con chunk 900 vs 1800 y concurrencia
  2 vs 1, en caja tranquila, criterio PSNR ≥40 dB / SSIM ≥0,98.

### 2.2 Pre-vuelo, 33 min pared — pre-vuelo incremental

El cómputo (~13–15 min en 3 corridas) se repite entero aunque solo
cambien 2 escenas. `scripts/visual-preflight.py` ahora acepta
**`--incremental`**: calcula un hash de entrada por escena
(manifiesto + entrada de timeline + componente + hash compartido de
`src/` + captions del rango + assets referenciados + opciones de
logo/caras) y re-renderiza solo las escenas cuyo hash cambió. La
caché vive en `.preflight-cache.json` junto a los stills; ante
cualquier duda (componente ausente, asset ausente, sin captions) el
hash es `None` y la escena se re-renderiza siempre. El still
reutilizado se valida por sha256 (un still manipulado se descarta).
Los flags de duplicado se recalculan cada corrida (la caché se
guarda ANTES de ese chequeo).

El pipeline pasa `--incremental` solo si `pipeline.json` trae
`preflight.incremental === true` (**opt-in hasta verificar E2E**);
`--force` del pipeline limpia la caché. Ahorro esperado por
re-corrida: re-renderizar 2 de 28 escenas en vez de 28 (~5 min por
re-corrida en el caso libreto).

Verificación: 10 tests nuevos `TestIncremental` en
`scripts/test_visual_preflight.py` (determinismo del hash; cambio de
componente → solo ese tipo; cambio compartido → todas; cambio de
entrada de timeline → solo esa escena; caption dentro/fuera del
rango; componente/asset ausente → `None`; partición con caché y
stills falsos; still manipulado rechazado). **E2E en
`longform-smoke/` pendiente**: los reels del 156,8M estaban
renderizando en la VM y no se fuerza un render paralelo (§6).

### 2.3 QA, 12,7 min — auditoría sin Whisper por defecto

La pasada Whisper de la auditoría (~8 min, RTF 0,885) aportó **60/60
WARN de ruido de sesgo Whisper** sobre la mezcla en este video: la
alineación autoritativa es la acústica (align + check (g)), no la
transcripción de la mezcla. El pipeline ahora pasa `--no-whisper` a
`audit-audio.py` **salvo que `pipeline.json` traiga
`qa.auditWhisper === true`** (activar solo con VO nueva o líneas en
disputa). Ahorro esperado: **~6 min por largo**.

Además, el QA ahora audita también el **720p** (antes solo máster y
360p): nuevo artefacto `technical-qa-720p.json` con `--expect
1280x720` (o `720x1280` si vertical). La tasa de auditoría se
recalibró: `auditPerAudioS` 0,3 → **0,9** (ruta con Whisper) y nueva
`auditNoWhisperPerAudioS: 0.2`.

### 2.4 Captions re-transcribe, ~3 min — reutilizar la transcripción verificada

`scripts/audio/transcribe-vo.py` acepta **`--transcript <ruta>`**:
salta Whisper y alinea el guion sobre una transcripción con
word_timestamps ya verificada (la de la preparación de VO). Acepta
la forma `{"segments": [{"words": [{"word","start","end"}]}]}` y la
forma `[{"words": [{"w","s","e"}]}]` (la de
`audit-audio.load_whisper_file`); valida que la duración declarada
coincida con el fin de la última línea de `vo-lines.json` (±5 s).
El pipeline la pasa si `pipeline.json` trae
`captions.transcript`, y la añade a los inputs de frescura.
Ahorro esperado: **~3 min por largo** (la corrida pasa de ~3 min a
~1 s de cómputo + align).

Verificación sobre datos reales de libreto (salida a temp, sin
tocar el proyecto entregado): `--transcript` sobre
`research/vo/vo-edited-transcript.json` completó en **1,1 s** con
1.465 palabras y 307 chunks — texto, keywords y cortes de chunk
**idénticos** a los entregados; desvío de tiempos mediana 10 ms.
Tras aplicar el parche del proyecto
(`patch-captions-zero.py`, que se aplica igual en ambas vías: sus
tiempos absolutos vienen de la misma transcripción by-line) y el
align, la alineación acústica queda **igual o mejor**: el align
corrigió 35 palabras (2 en la vía original) y ambas vías terminan
en desvío máx 0,05 s y 0 sobre el umbral. Las 16 palabras restantes
con desvío >300 ms son jitter de borde Whisper en medio de frase
(sin onset acústico definible en ninguna vía); un caso
(«SUSCRÍBETE») quedó EN el onset acústico en la vía reutilizada
mientras la entregada lo tiene 0,58 s antes (la vía original no lo
midió: el inicio caía pegado a la palabra anterior). 8 tests nuevos
en `scripts/audio/test_transcribe_vo.py` (ambas formas de entrada,
validación de duración, cordura de `align()`).

### 2.5 SIGTERM a los 31,5 min — parada limpia por `--max-minutes`

El runtime mató el pipeline con SIGTERM a los 31,5 min durante el
máster; la reanudación manual en dos tramos costó ~5 min y riesgo
de cola. El pipeline acepta ahora **`--max-minutes N`** (null = sin
límite; 0 válido = pausa tras el primer paso): al terminar un paso,
si el reloj supera N minutos, detiene limpiamente con estado
`paused`, salida 0, e imprime `PIPELINE_PAUSED` + el comando exacto
de reanudación con `--from <siguiente>`. Para corridas largas en
esta VM, usar `--max-minutes 28` y relanzar con el comando impreso.
Verificación: tests de `--max-minutes 0` (pausa tras el primer paso,
`PIPELINE_PAUSED` + `--from merge`, salida 0) y de valor inválido
en `tests/pipeline.test.mjs`. La pausa real en mitad de una corrida
larga queda pendiente de ejercicio E2E (§6).

### 2.6 Brecha de medición — historial acumulativo de corridas

`reports/pipeline-progress.json` solo guardaba la última corrida;
los tiempos de la corrida completa del primer largo se perdieron y
hubo que reconstruirlos por mtimes. `logRun()` anexa ahora una
línea JSON por invocación a **`reports/pipeline-runs.jsonl`**
(rango, estado, segundos reales/estimados por paso); nunca rompe la
corrida; se llama en éxito, fallo y pausa; los dry-run no se
registran. La próxima revisión de agilidad leerá este archivo, no
los mtimes.

### 2.7 Tasas recalibradas (resumen)

| Tasa | Antes | Ahora | Base |
|---|---|---|---|
| `renderPerFrameS` | 0,08 | **0,11** | 16.449 f en 30 min |
| `encodePerAudioS` | 0,66 | **1,0** | 563 s sobre 548 s |
| `preflightPerSceneS` | 20 | **12** | ~9,6 s/escena reales |
| `auditPerAudioS` (con Whisper) | 0,3 | **0,9** | RTF 0,885 medido |
| `auditNoWhisperPerAudioS` | — | **0,2** | nueva (por defecto) |
| `captionsReuseFixedS` | — | **30** | nueva (con transcript) |

`--estimate` de libreto con las tasas nuevas: render 30:09 (real
30:00), encode 9:05 (real 9:23), preflight 5:36 por corrida (real
~4–5 min), QA 7:54 sin Whisper (real 12:43 con Whisper), total
1 h 19 min de pipeline propio (sin componentes, sin insumos previos,
sin re-corridas ni incidentes).

## 3. Ahorro esperado para el segundo largo (~9 min)

| Cambio | Ahorro |
|---|---|
| Biblioteca de componentes reutilizada (único) | −19 min |
| Auditoría sin Whisper por defecto | −6 min |
| Captions reutilizados | −3 min |
| Pre-vuelo incremental (1 re-corrida típica) | −5 min |
| Sin incidente SIGTERM (parada limpia) | −5 min |
| **Total** | **~38 min sobre ~135 min de coordinador (~28%)** |

Cómputo recurrente del pipeline (sin componentes ni insumos
previos): ~81 min.

## 4. Opciones nuevas en `pipeline.json`

```json
{
  "captions": {"transcript": "research/vo/vo-edited-transcript.json"},
  "preflight": {"incremental": true},
  "qa": {"auditWhisper": false}
}
```

- `captions.transcript`: ruta a la transcripción verificada de la
  VO (con word_timestamps). Sin ella, captions transcribe con
  Whisper como antes.
- `preflight.incremental`: pre-vuelo incremental (opt-in hasta
  verificar E2E, §6). `--force` del pipeline limpia la caché.
- `qa.auditWhisper`: `true` restaura la pasada Whisper de la
  auditoría (VO nueva o líneas en disputa). Por defecto `false`.

Ver `templates/pipeline.json`.

## 5. Verificación

- `tests/pipeline.test.mjs`: 13 tests (5 existentes + 8 nuevos:
  tasas recalibradas, `--max-minutes 0` e inválido, historial de
  corridas, `--no-whisper` por defecto y con `auditWhisper: true`,
  `--transcript`, `--incremental`). 13/13.
- `scripts/test_visual_preflight.py`: 35 tests (25 existentes + 10
  `TestIncremental`). 35/35.
- `scripts/audio/test_transcribe_vo.py`: 8 tests nuevos. 8/8.
- Suite completa node (`node --test --test-concurrency=1
  tests/*.test.mjs`, TMPDIR=`~/workspace/.tmp-test`): se corrió una
  vez con el árbol sucio y **la propia suite contaminó la rama**
  (ver §6, incidente del `.git`): los fallos de esa corrida
  (`real-recovery`, `operate`) fueron consecuencia de la
  contaminación, no de estos cambios. Re-corrida sobre el árbol
  limpio tras el commit: PENDIENTE DE CONFIRMAR EL RESULTADO FINAL
  — ver §6.
- Integración `--transcript` sobre datos reales de libreto: §2.4.
- `--estimate` y `--dry-run` con las nuevas opciones: §2.7.

## 6. Pendiente

- **Incidente de la suite (23-nov, resuelto)**: la primera corrida
  completa de la suite creó 4 commits espurios en esta rama
  («fixture: editable source», «checkpoint saved», «human confirmed
  revision», «later draft») y contaminó el índice. Causa:
  `tests/persistence.test.mjs` copia el repo a un temp con un
  filtro que excluía `/.git/` (directorio) pero no el ARCHIVO
  `.git` de un worktree enlazado; la copia heredó el `gitdir` real
  y sus `git commit` cayeron en esta rama (además barrió los
  cambios sin commitear de esta revisión y un `package-lock.json`
  mínimo de fixture). Corregido con `!src.endsWith('/.git')` en el
  filtro (el de `checkpoint.test.mjs` ya lo cubría con su regex);
  la rama se reseteó a `a09c5ad` (commits locales, sin upstream) y
  el árbol quedó solo con los cambios de esta revisión. Lección:
  **en un worktree enlazado, ningún test debe copiar `ROOT` sin
  excluir el archivo `.git`**.

- **E2E del pre-vuelo incremental en `projects/longform-smoke/`**:
  no se hizo porque los reels del 156,8M estaban renderizando en la
  VM (1,5 CPU; sin renders paralelos). Cuando la caja esté libre:
  correr el pre-vuelo incremental dos veces sobre el smoke (la 2ª
  debe reutilizar los 16 stills), tocar una escena y verificar que
  solo esa se re-renderiza. Hasta entonces, `preflight.incremental`
  sigue siendo opt-in.
- **E2E de `--max-minutes` en una corrida larga real**: solo
  verificado en dry-run. Ejercicio: correr el smoke con
  `--max-minutes 1` y relanzar con el comando impreso.
- **Experimento de render** (§2.1): chunk 900 vs 1800, concurrencia
  2 vs 1, en caja tranquila, criterio PSNR ≥40 dB / SSIM ≥0,98.
- **Suite completa node**: confirmar el resultado final tras el
  commit (el test `operate.mjs save` falla con el árbol sucio por
  diseño — no es un fallo de código; con el árbol limpio pasa).
