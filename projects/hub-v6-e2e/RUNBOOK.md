# RUNBOOK — Prueba hub-v6 (`hub-v6-e2e`)

Esqueleto generado por `scripts/new-reel.mjs` el 2026-11-21T05:26:20.847Z.
Plataforma: **instagram-reels** · karaoke: **pill** · VO: 10.61 s · total: 394 f (0:13.1).

Captions: captions transcritos con Whisper y alineados al guion.

## 1. Sustituir las tarjetas por assets reales

Cada escena de `src/Video.tsx` es una tarjeta con su línea del guion.
Sustituir por foto (`KenBurnsStill`), vídeo o motion graphics, una
escena cada vez. El plan está en `research/edit-plan.json`.
Sin marca de agua: copia el logotipo completo a `public/img/logo-white.png` y añade `<BrandFrame logo="img/logo-white.png" />` en `Video.tsx` (la regla del Memorial: logotipo COMPLETO, nunca solo la estrella).

## 2. Alinear los captions con la voz (obligatorio antes del render)

Los tiempos de Whisper adelantan los bordes tras pausa (hasta 0,56 s):

```bash
~/workspace/.stt-env/bin/python scripts/audio/align-captions.py \
  --voice projects/hub-v6-e2e/public/audio/vo.wav \
  --captions projects/hub-v6-e2e/src/captions.ts \
  --out projects/hub-v6-e2e/src/captions.ts --verify \
  --json-out projects/hub-v6-e2e/research/captions.json \
  --report projects/hub-v6-e2e/research/align-report.json
```

`--json-out` mantiene `research/captions.json` (el que lee la
auditoría) sincronizado con los captions corregidos; sin él, la
auditoría auditaría los tiempos pre-alineación.

## 3. Pre-vuelo visual (obligatorio: el render lo exige)

```bash
flock /tmp/noche-ecosistemas-heavy.lock -c '~/workspace/remotion-hub/.venv/bin/python scripts/visual-preflight.py --stills --project hub-v6-e2e --manifest projects/hub-v6-e2e/preflight-scenes.json --out projects/hub-v6-e2e/out/preflight.json'
```

Sin bloqueantes, el render se desbloquea. Con bloqueantes: corregir el
layout y repetir el pre-vuelo.

## 4. Borrador 540p (revisión creativa)

```bash
flock /tmp/noche-ecosistemas-heavy.lock -c '. scripts/render-lock.sh && render_lock_acquire && node scripts/render-chunks.mjs hub-v6-e2e --draft --resume; render_lock_release'
```

## 5. Probar ganchos (opcional)

Añade variantes en `research/hooks.json` y renderiza los primeros 3 s
de cada una:

```bash
node scripts/hook-test.mjs hub-v6-e2e --seconds 3
```

## 6. Máster (render completo + mezcla + auditoría)

Render vídeo-solo (la mezcla se hace en el máster, no en los tramos):

```bash
flock /tmp/noche-ecosistemas-heavy.lock -c '. scripts/render-lock.sh && render_lock_acquire && node scripts/render-chunks.mjs hub-v6-e2e --video-only --resume; render_lock_release'
```

Mezcla: VO + cama (la cama, escaneada con `scan-bed.py` y con
ventana elegida con `select-bed-window.py`; sin cama, `--mix` puede
ser la VO sola). Máster + ligera:

```bash
~/workspace/remotion-hub/.venv/bin/python scripts/audio/master.py \
  --chunks-dir projects/hub-v6-e2e/out/chunks \
  --mix projects/hub-v6-e2e/public/audio/mix.wav \
  --out-master projects/hub-v6-e2e/out/MASTER.mp4 \
  --out-light projects/hub-v6-e2e/out/LIGERO.mp4 \
  --report projects/hub-v6-e2e/research/master-report.json
```

Auditoría de audio (obligatoria antes de entregar):

```bash
~/workspace/remotion-hub/.venv/bin/python scripts/audio/audit-audio.py \
  --project projects/hub-v6-e2e \
  --master projects/hub-v6-e2e/out/MASTER.mp4 \
  --captions projects/hub-v6-e2e/research/captions.json \
  --out-dir projects/hub-v6-e2e/reports
```
