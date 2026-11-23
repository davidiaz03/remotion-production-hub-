# Pipeline de reels — mejoras P0 (repaso de lecciones v4)

Fuente: `projects/negacion-embargo/LESSONS-v4.md` (repaso del reel
«Dicen que no hay bloqueo», v4, 22-nov-2026). Pack→entrega: 9 h 08 min;
camino crítico limpio ~4 h 05 min; re-trabajo evitable ~3 h 40 min (46%).
Las 5 mejoras P0 atacan ese 46%. Las plantillas P1-6 NO están aplicadas
(decisión del usuario, 22-nov-2026).

## P0-1 — Orquestador `scripts/reel.mjs`

Un comando para todo el reel, modelado en `scripts/pipeline.mjs` (video
largo). Configuración por proyecto en `projects/<id>/reel.json` (plantilla
en `templates/reel/reel.json`).

```bash
node scripts/reel.mjs negacion-embargo --tag v5 --estimate   # estimar
node scripts/reel.mjs negacion-embargo --tag v5 --to pre-audit
node scripts/reel.mjs negacion-embargo --tag v5 --deliver     # entrega real
node scripts/reel.mjs negacion-embargo --tag v5 --from render # reanudar
```

Pasos: `audio, mix, audit-inputs, pre-audit, preflight, render, master,
qa, ghost, audit, deliver`. Cada paso salta si sus artefactos existen y
son más recientes que sus entradas (artefactos y entradas pueden ser
carpetas: vale el archivo más antiguo / más reciente dentro). `--force`
rehace desde `--from`. El progreso vive en `reports/reel-progress.md`
(+ `.json`).

Puertas duras (FAIL = parada, no entrega):

- `pre-audit`: 0 FAIL sobre insumos antes de renderizar (P0-2).
- `preflight`: un fotograma bloqueante para el pipeline.
- `qa`: `qa-media --mode full` sobre el máster (exit 1 = fallo). La
  ligera se verifica con sonda ffprobe + decodificación completa, sin
  puerta de sonoridad: su audio se re-codifica a AAC 128k y la puerta
  (-16,5..-12 LUFS) tiene solo 0,3 LUFS de margen sobre el máster v4
  (-16,2); un FAIL ahí sería un falso positivo de re-codificación.
- `ghost`: un GHOST o REVISAR en un corte para el pipeline (P0-4).
  Tras revisar las tiras, `--skip-ghost` reanuda.
- `audit`: 0 FAIL sobre el máster (AGENTS.md: ningún reel se entrega
  sin pasar la auditoría).

La entrega (`deliver`) NUNCA corre sola: exige `--deliver` en cada
corrida (sube a Drive con `drive-upload.mjs` y publica enlaces Muse
con `remote-storage`; los enlaces son públicos). Es reanudable: si un
archivo ya está en Drive (entrega parcial anterior), se reutiliza y se
toma su enlace en vez de re-subir. El informe queda en
`reports/delivery-<tag>.json` (con los enlaces Muse y de Drive).

Reglas que el orquestador hace cumplir:

- `--tag vN` es obligatorio cuando el rango incluye `master` o pasos
  posteriores (el tag entra en los nombres de archivo).
- `--video-only` solo si TODO el audio del reel está en la mezcla. En
  negacion-embargo es `false`: el audio del panel vive en la
  composición (OffthreadVideo + `<Audio>`), así que los tramos llevan
  audio PCM y el máster no muxea `--mix`.
- Una carpeta-artefacto debe ser de uso EXCLUSIVO del paso (el paso
  produce TODOS sus archivos y limpia los rancios al correr). La
  excepción que lo demostró: `sfx-mix/` mezclaba 14 archivos de
  `build-audio.sh` con 15 copias a mano y un `--force` las borró.
- Los cambios en los scripts del proyecto NO invalidan la frescura:
  tras editar un script, correr con `--force` el rango afectado.

Hallazgo del smoke test (23-nov): `build-audio.sh` tenía una lista
fija de 14 SFX con uvo, pero la timeline tiene 29 underVO (con su
`uvo_db` en la tabla SFX_SYNC de `build-timeline.py`). Los otros 15
solo existían por copias a mano. El script ahora genera los 29 desde
`timeline.json` y limpia el directorio primero. Las 14 ganancias fijas
coincidían exactamente con `uvo_db` (verificado).

Verificación: `tests/reel-orchestrator.test.mjs` (6 tests: dry-run,
estimate, validación, frescura E2E con proyecto sintético, marcador
ghost, marcador deliver). Smoke real 23-nov (`--to pre-audit
--force`): audio 25 s, mix 25 s, audit-inputs 32 s, pre-audit 13 s,
veredicto WARN 0 FAIL / 49 WARN / 9 PASS / 43 INFO — idéntico al
smoke de P0-2 (la cadena regenerada reproduce el estado de v4).

## P0-2 — Pre-auditoría obligatoria + validación de insumos

El bug del 22-nov (111 de los 119 FAIL de v3 eran artefactos): L1 es
mono y L2–L8 estéreo; el concat `-c copy` no convertía y
`voice-orig.wav` salió con 116,71 s en vez de 61,78 s.

- `build-audit-inputs.py`: `validate_voice_orig()` — la VO original
  debe ser mono 48 kHz y su duración la suma de las líneas (±0,1 s).
  Si falla, borra el archivo corrupto y aborta ANTES de generar un
  solo insumo.
- `run-audit.py --pre`: auditoría sobre insumos (sin `--master` ni
  `--expected-frames`, tag `pre`). `audit-audio.py --no-master` evita
  que la pre-auditoría recoja un `out/*_MASTER.mp4` viejo.
- El orquestador corre la pre-auditoría como puerta dura antes del
  render: un FAIL aquí cuesta minutos; después del render, horas.

Verificación: `projects/negacion-embargo/scripts/test_build_audit_inputs.py`
(11 tests, incluidos 4 de P0-1). Smoke real `--tag pre-p02-smoke`:
0 FAIL, 49 WARN, 9 PASS, 43 INFO, ~13 s.

## P0-3 — Invalidación de tramos por hash

Cherry-pick de hub-speed-v5 (commit `7e206ba`): `render-chunks.mjs
--resume` salta los tramos cuyo `inputHash` no cambió. El hash (esquema
v2, en `manifest.json`) cubre parámetros + código + assets
referenciados + captions del tramo. Conservador: ante la duda se
re-renderiza. Un cambio de caption re-renderiza solo los tramos que
muestran esa palabra (karaoke pegajoso). En modo vídeo-solo los audios
no entran en el hash (un cambio de mezcla no invalida vídeo).

También cherry-pick `2294cee`: `render-chunks --lock` (candado único
de render en Node, `scripts/render-lock.mjs`) + `HUB` real en
`lib.mjs` (el orquestador lo necesita para localizar `.venv`).

Verificación: `tests/render-chunks-hash.test.mjs` (6 escenarios,
~92 s) + `tests/render-lock.test.mjs` (4 tests). Marcadores de log:
`sin cambios (N f, hash xxx) — salto` /
`entradas cambiadas (hash xxx → yyy) — re-render`.

## P0-4 — Pre-vuelo automatizado + fotogramas fantasma

- `scripts/visual-preflight.py --stills` (cherry-pick `ee721ff`):
  1 still por escena con Remotion (sin renderizar el vídeo) + 5
  chequeos por píxeles: fotograma muerto (AVISO), elemento recortado
  por el borde (AVISO), texto sobre cara (BLOQUEANTE), imagen
  duplicada entre escenas (BLOQUEANTE), logotipo ausente (BLOQUEANTE,
  solo con `--logo-ref`). El manifiesto de escenas vive en el proyecto
  (`preflight-scenes.json`). El ojo humano solo ve los marcados + 1
  fotograma limpio por escena (la muestra sugerida del informe).
- `scripts/ghost-frames.py` (nuevo): extracción densa de UNA pasada
  alrededor de cada corte + MAD en COLOR BGR contra la mediana previa
  (B−6..B−3) y la nueva (B+4..B+7); examina B..B+3. Veredictos: OK
  (d_nueva < 0,07), GHOST (d_previa < 0,03 y d_nueva ≥ 0,07), REVISAR
  (ajeno a ambas — el caso real de Bruno f465–468 era la cola del clip
  fuente, no la escena anterior). Informe JSON + tiras PNG
  [fotograma | ref previa | ref nueva]. Salida 1 si hay hallazgos.
- El chequeo de logo está DESACTIVADO en el orquestador v1: la
  referencia debe tener la resolución exacta de los stills (1080×1920)
  y el único still disponible (f0.png, 540×960) no la tiene. Para
  activarlo, generar una referencia a resolución completa y pasar
  `--logo-ref` (el manifiesto ya trae `logo_skip_scenes` para las
  escenas sin marca de agua: L4, oculta durante el punch, y Logo,
  pantalla completa). Los stills se revisan a ojo igualmente.

Verificación: `scripts/test_ghost_frames.py` (12 tests: sintéticos +
caso real v2 + v4 limpio) + 25 tests del pre-vuelo. Smoke sobre 11
cortes del máster v4: OK, 0 GHOST, 0 REVISAR, 1m25s. Límite
documentado: un fantasma de 5+ fotogramas contamina la referencia
nueva (fuera de alcance).

## P0-5 — Tiempos de audio, fuente única

`scripts/audio-times.py` (`measure` / `check` / `sync`) +
`projects/negacion-embargo/research/audio-times.json`: 5 eventos
medidos con faster-whisper-small, con procedencia (archivo, offset,
probabilidad). `check` verifica estructura + consistencia
offset/fotograma (±1 f) + `cross_check` contra otros JSON +
`composition_ref` a las constantes de la composición. `sync` genera
`src/audio-times.generated.ts` para la próxima edición.

El check cazó valores obsoletos 13,32 s (corregidos a 14,08 s en
`timeline.json` y `build-timeline.py`). La composición v4 NO se tocó
(`SLAMS` y `PUNTO_AT` siguen hardcodeados; el check los verifica).

Verificación: `scripts/test_audio_times.py` (13 tests, incluida la
medición real de «Period.»: 4,58 s). Check del proyecto real: 5
eventos, 0 errores, 1 advertencia (probabilidad baja en
`panel-t1-phrase-start`).

## Ahorro esperado (próximo reel similar, ~77 s)

| Mejora | Ahorro | Cómo |
|---|---|---|
| P0-1 orquestador | ~1 h 30 min | Sin esperas entre fases ni re-lanzamientos a mano; reanudación por frescura |
| P0-2 pre-auditoría | ~1 h 00 min | Un insumo corrupto se caza en segundos, no tras render + auditoría (111 FAIL falsos en v3) |
| P0-3 hash | ~30–60 min | Un cambio de caption/guion re-renderiza 1–3 tramos, no 16 |
| P0-4 pre-vuelo + fantasma | ~30 min | Defectos visuales antes del render; el fantasma se caza en 1m25s, no a ojo sobre 2325 fotogramas |
| P0-5 tiempos | ~15 min | Sin re-medir tiempos ni cazar valores obsoletos a mano |
| **Total** | **~3 h 30 min** | De 9 h 08 min a ~5 h 30 min; el camino crítico limpio (~4 h 05 min) no cambia |

Meta del informe: próximo reel similar ~3 h–3 h 30 min con plantillas
P1-6 (no aplicadas); sin ellas, ~5 h–5 h 30 min.

## Desviaciones respecto a LESSONS-v4.md

- P0-1: el orquestador NO deriva el manifiesto de pre-vuelo de la
  timeline (como hace `pipeline.mjs`): las escenas de un reel no
  salen de `src/timeline.json` (no existe en reels) sino de
  `research/timeline.json`, con otro esquema; el manifiesto se escribe
  a mano por proyecto (12 escenas en negacion-embargo).
- P0-1: la entrega exige `--deliver` explícito en cada corrida
  (LESSONS no lo especificaba; AGENTS.md exige confirmación explícita
  para publicar).
- P0-4: chequeo de logo desactivado en el orquestador v1 (ver arriba).
- P0-5: la composición v4 no se migró al TS generado (el check
  verifica las constantes hardcodeadas; la migración es para la
  próxima edición).
- P0-1 (hallazgo, no desviación): `build-audio.sh` generaba 14 de 29
  SFX con uvo; ahora genera los 29 desde `timeline.json`.
