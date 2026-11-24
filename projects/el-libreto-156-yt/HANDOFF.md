# HANDOFF — el-libreto-156-yt

- **Estado:** ENTREGADO 23-nov-2026 ~20:20 (hora oficial). REEL_OK
  completo (audio → mix → pre-auditoría → pre-vuelo → render →
  máster → QA → ghost → auditoría). NADA publicado en redes:
  pendiente verlo el usuario y decidir la publicación.
- **Máster:** `out/MASTER-v1.mp4` — 9.597.156 B, SHA-256
  `07fc759a…9db92`, 1080×1920, 1395 f, 46,5 s, −15,9 LUFS, TP −4,2.
  Enlace Muse (expira 26-nov ~00:20 UTC):
  https://muse.ai/files/823310194207159/3342217549298848/9m8djym0inwqqmgkm7oowwef/MASTER-v1.mp4
- **Ligera:** `out/LIGERA-v1.mp4` — 2.742.550 B, SHA-256
  `7d523c58…81ba2`, 1395 f, 46,5 s, −15,9 LUFS, TP −3,9.
  Enlace Muse (expira 26-nov ~00:21 UTC):
  https://muse.ai/files/823310194207159/1445322744478083/awnw0vfd4lgcsjxe5nbhf3xj/LIGERA-v1.mp4
- **QA:** technicalStatus passed (1395/1395 f, 0 deriva, sin negros ni
  silencios, decode OK). **Auditoría final:** WARN — 0 FAIL, 64 WARN
  (61 check (b) + 3 check (g) master-Whisper), 12 PASS, 33 INFO.
  **Ghost:** OK — 7 cortes, 0 GHOST, 0 REVISAR (pase limpio).
- **Nota de auditoría (g):** la primera corrida final dio 1 FAIL
  («esa» +0,69 s): falso positivo — el karaoke coincide con el onset
  acústico (31,02 vs 31,07 s) pero la puerta de -50 dB del check
  rechazaba la pausa (tono de sala a -49,7 dB). Corregido en
  `scripts/audio/audit-audio.py` (puerta a -45 dB, la definición de
  silencio de la propia auditoría; el umbral del onset sigue en -50).
  Regresión validada: FB 156 sin cambios y Messi FB v2 / YT v1 con
  veredictos y conteos idénticos a los históricos.
- **Entrega:** el paso --deliver del orquestador FALLA en esta VM
  (rclone no instalado, sin credenciales de Drive). La entrega se hizo
  por Muse storage (enlaces arriba). Drive pendiente del padre si
  hace falta (vía conector).
- **VO:** `public/audio/real/vo-yt-limpia-clean.wav` (43,73 s, 115 palabras).
  Informe: dossier `vo/VO_EDIT_REPORT_156.md`.
- **Cama:** `libreto-messi-desmentido` (bed.id en timeline.json, fuente única).
- **Duración:** 46,5 s / 1395 f. Tag: v1.
- **Pre-auditoría:** WARN — 0 FAIL, 61 WARN (todos check (b), tiempos de
  caption por habla rápida, mismo patrón que Messi), 9 PASS, 32 INFO.
  Checks (c) VO íntegra, (d), (e), (f), (i) en PASS.
- **Correcciones aplicadas 23-nov (ver generador
  `~/workspace/.tmp/gen-156-data.py` y este MainReel):**
  - Límites de segmento MEDIDOS con las funciones exactas del check (c)
    (energía + armonicidad), no puntos medios. 17 segmentos: L1+L2 y
    L12+L13+L14+L15 fusionadas (sin ningún límite limpio entre ellas;
    la toma es continua y nada se descarta).
  - Bajo de apertura retrasado a 0,08 s (antes 0,0): en YT «Este»
    arranca en 0,00 s y el boom enterraba su ataque (check (i5) FAIL,
    +33 dB). Ahora (i5) PASS.
  - Riser recortado a 0,90 s (antes 0,982): mismo defecto que en FB
    (enterraba el ataque de «Sin»). Preventivo; verificado en (i5).
  - Sello «SIN CONTEXTO»: fontSize 100 → 80 + `whiteSpace: nowrap` +
    alto 200 → 170 (top 955, mismo centro): a 100 px el texto se
    partía en dos líneas y desbordaba el borde. Verificado en still
    f1245 (`out/preflight-stills/extra-f1245.jpg`).
  - B-roll: MISMO corte que FB (DVIDS 900133, segundos 3–6: proa con
    remolcador, sin nombre legible). La ventana original de YT (8–11 s)
    mostraba la popa con «EMPIRE STATE / WILMINGTON, DE» legible y se
    descartó (el still f816 del primer pre-vuelo lo demostró).
  - Etiqueta «$284 MILLONES» del salto: aterriza a 36,04 s (con «284»),
    no a 37,51: a 37,51 solo vivía 0,27 s y toda dentro del fundido de
    la transición T3, sin llegar a opacidad plena. El SFX
    data-number-land-2 sigue a 37,51 marcando el fin de la barra.
    Verificado en still f1100 (`extra-f1100.jpg`).
- **Pre-vuelo:** 0 bloqueantes. 3 fotogramas con AVISO edge-clipped
  (fondo del gráfico viral, contenido del video del buque y barra de
  progreso): adjudicados benignos tras revisión a ojo. Stills extra
  verificados: gancho f172 (paneo + círculo), quién-compra f560
  (círculo tachado completo), licencia f750 («APOYO AL PUEBLO CUBANO»
  + píldora «LICENCIA SCP · BIS»), buque f816 (ventana nueva),
  salto f1100/f1125 (etiqueta + barra completa), veredicto f1245.
- **Siguiente paso:** ninguno en producción. El usuario ve los videos
  (enlaces arriba) y decide la publicación. Al publicar, aplicar la
  regla de vista previa (verificar antes de publicar).
