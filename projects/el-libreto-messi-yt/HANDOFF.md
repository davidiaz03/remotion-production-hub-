# El Libreto — Messi nunca dijo esto sobre Cuba (YouTube)

Identificador: `el-libreto-messi-yt`

Objetivo: El Libreto — Messi nunca dijo esto sobre Cuba (YouTube)

Leer CREATIVE_BRIEF.md y docs/CREATIVE_DIRECTION_PROTOCOL.md: ChatGPT debe investigar, proponer sus prompts y estrategia, ejecutar y auditar con iniciativa propia.
Ver STATE.json y PROJECTS.json.
No hay revisiones aprobadas.

## Estado 23-nov ~18:10 (hora del sistema) — v1 TERMINADA (REEL_OK)

- **REEL_OK** 23-nov 18:06. Máster `out/MASTER-v1.mp4` (1080×1920, 43,0 s,
  1290 f, 7.054.525 B, SHA-256
  `3625586f509ef37e2b57492dc001fd76c482f5f4c85d5cc50cbbcf785f248f77`,
  −16,4 LUFS, TP −4,8 dBTP) y ligera `out/LIGERA-v1.mp4` (720×1280,
  2.243.685 B, SHA-256
  `bea0d063aea9dc02a0c579307b966621ced5482e193e3e3a002c08e6fbfdec51`,
  −16,5 LUFS, TP −4,2 dBTP). **NADA publicado** (paso deliver omitido:
  sin `--deliver` no hay subida a Drive ni a Muse storage).
- Cama Flow nueva `libreto-messi-desmentido`: NCC **1,000** en la mezcla
  (puerta run-mix.py, umbral 0,99). Mix SHA-256
  `26990cff8715c63f47ae52320dcc811eceeb8dbff9b862d2361749403b82098d`.
- QA técnico PASSED (0 warnings, 0 failures; drift 0; sin agujeros ni
  intervalos de silencio/negro). Auditoría de audio final: **WARN,
  0 FAIL, 70 WARN, 13 PASS, 38 INFO** (`research/audit-v1/`): 64
  captions cortos sin efecto visual en karaoke, bombeo del ducking
  11,9 dB (mismo H10 del FB v1, WARN) y 5 desvíos karaoke/máster
  medidos por Whisper sobre la mezcla (sesgo conocido; alineación
  sobre voz limpia máx. 0,07 s, dentro del SYNC_MAX 0,15 s).
- Ghost adjudicado a mano (ver `reports/ghost-adjudicacion-v1.md`,
  no versionado: `reports/` está en .gitignore): 3 GHOST + 22 REVISAR,
  todos benignos — f663 primer fotograma del barrido T1, f973 inicio
  del fundido T2, f1215–f1216 primeros fotogramas de la disolución
  diseñada de la end card (0,3 s, `cardOpacity` 0→1 en 40,5–40,8 s),
  f390 animación de entrada de la comparación. Ningún corte real
  afectado; reanudación con `--skip-ghost`.
- Revisión visual del máster a ojo: 8 fotogramas (f0, f669, f800,
  f978, f1110, f1218, f1250, f1289) + 13 stills de pre-vuelo. El loop
  funciona: f1289 disuelve la end card hacia la captura del post, el
  mismo momento que f0. Video real de Casa Blanca en marcha (f800),
  end card limpia sin logo duplicado (f1250).
- Cambios v1 respecto a 0db7c23: H1 video real Casa Blanca (sin audio,
  640×360, fondo difuminado); H3 karaoke oculto en 5 beats más; H4
  contador aparece a 3,52 s; H5 placa debajo de la imagen; H6 cierre
  rediseñado (marca de agua se desvanece 40,5–40,8 s; end card con
  SUSCRÍBETE + puente + fuentes en y 1500; disolución de loop
  42,7–43,0 s); H7 push-in del veredicto; H8 pop karaoke 1,15 +
  fusión de micropalabras; H9 transiciones T1 (barrido) y T2
  (fundido). VO NO tocada (la verificación de oído de «creyó» sigue
  pendiente del usuario).
- Lección del orquestador (23-nov ~17:41): un informe de puerta
  FALLIDA cuenta como «fresco» (el paso preflight declara solo su
  informe como artefacto, sin entradas); tras corregir, reanudar con
  `--force` o borrar el informe.
- Pendiente: visto bueno del usuario sobre la v1; verificación de
  oído de «creyó» en la VO; entrega (subida) cuando lo ordene.

## Estado 23-nov ~17:15 (hora del sistema) — EN PAUSA antes del render

- Audio, mezcla intermedia (solo tono de sala + 9 SFX), audit-inputs y
  pre-auditoría pasados: WARN, 0 FAIL, 65 WARN benignos, 9 PASS.
- Pre-vuelo visual: 15 stills, REEL_OK, 0 bloqueantes (tras corregir
  Trío, resaltado José Forever y sello del cierre). Revisión a ojo
  completa, incluida la lupa Gemini (marca legible, verificada).
- CAMBIO DE DIRECCIÓN 23-nov: el reel SÍ lleva música de Flow Music.
  La mezcla final y el render esperan la cama (archivo + identidad
  verificada) y la dirección del cierre nuevo. NO renderizar v1 sin
  música. Al llegar la cama: scan-bed.py → bed.id en timeline.json →
  bed_identity.py → rehacer mezcla → render → master → qa → ghost →
  audit. Detalle en CREATIVE_BRIEF.md.
