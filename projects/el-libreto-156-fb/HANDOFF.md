# HANDOFF — el-libreto-156-fb

## v3 (ENTREGADA 23-nov-2026, ~22:25 hora oficial)

- **Motivo:** auditoría del padre sobre la v2
  (`AUDITORIA-ALBERTO-v2.md`): BLOQUEANTE 1 — el karaoke decía
  «llevó» y el guion dice «llegó» (el usuario lo confirmó de oído);
  BLOQUEANTE 2 — el gancho cortaba a media letra la línea roja del
  gráfico viral por el borde inferior. Nits: «CON» sola 0,18 s;
  ~1 s casi vacío en la transición sello → tarjeta final.
- **«llegó»:** corregido en TODA la cadena (captions.ts, vo-lines.json,
  timeline.json, TEXT_FIXES de build-audit-inputs.py, CREATIVE_BRIEF.md,
  generador `~/workspace/.tmp/gen-156-data.py`). Causa raíz: la
  transcripción base decía «lleva» y otra pasada ASR dio «llevó»;
  el check (a) compara contra vo-lines.json (ASR), no contra el
  guion — por eso dio PASS. Regla permanente: el oído del usuario
  manda sobre el ASR (AGENTS.md del repo). Verificado EN PANTALLA:
  el chunk «LLEGÓ AL GOBIERNO.» (18,32–18,78) está oculto por
  HIDE_RANGES pero reaparece en su cola normal de 0,4 s
  (18,78–19,18); fotograma del máster a 19,0 s: «LLEGÓ AL GOBIERNO.»
  limpio. Pre-vuelo: still f570 («Buque — karaoke LLEGÓ en cola
  0,4 s (v3)»). Check (a): 69/69 PASS.
- **Gancho:** ventana 920 → 776 de alto (inner 0–800; la pregunta
  queda fuera al inicio con 82 px de margen) + paneo −320 → −500.
  Medido con PIL: titular L4 («enero y julio de 2026.») inner
  400–487; pregunta roja 882–1219. Con −430 la L4 quedaba cortada
  a media letra en el reposo del paneo (cazado en el still f162
  del primer pre-vuelo v3); con −500 queda 13 px por encima del
  borde y la pregunta entera display 775–1102. Verificado en el
  máster a 1 fps (0–5 s): ningún texto cortado a medias en reposo
  (durante el paneo 4,48–5,2 s las líneas cruzan el borde, propio
  del movimiento). Pre-vuelo v3: 0 bloqueantes (2ª corrida; la 1ª
  murió por SIGTERM del runtime a los 678 s sin consumir CPU).
- **Nits:** (1) «CON»: REVERTIDO — retrasar su `s` (15,4 → 15,58)
  dio FAIL en el check (g) de la auditoría v3 (desvío karaoke/voz
  clean +0,20 s); vuelve a aparecer sola 0,18 s como en v1/v2
  (constancia en la cabecera de captions.ts). (2) Cierre: la
  tarjeta entra en fundido 22,2–22,68 (antes 22,68–22,83); a 22,4 s
  ya se lee a media opacidad y el hueco queda cubierto.
- **Mezcla:** sin cambios (la v2: cama `libreto-156-combustible`,
  music_volume 0.32, ducking 0.15/1.3/250 ms). Puerta §5 en la
  auditoría v3: pausas −23,6, mediana bajo la voz −33,0, p10 −38,6
  — PASS.
- **Entregables:** `out/MASTER-v3.mp4` (6.374.166 B, SHA-256
  `0236a3a05d44e5071d767d96552f23b5f9855ea0851f7ecc6c866d2ecf0837c8`,
  1080×1920, 27,5 s, −15,8 LUFS, TP −4,2) y `out/LIGERA-v3.mp4`
  (1.801.650 B, SHA-256
  `483813f64921845a1b39d9c6739c14842c3331d94a95149487cbed3e0bb211c7`).
  La v2 queda intacta (`MASTER-v2.mp4`, 6.312.571 B).
- **Puertas:** pre-vuelo 0 bloqueantes; render completo (codeHash
  global); QA passed; ghost 0 GHOST, 4 REVISAR f374–377 (el mismo
  desliz de entrada de la pág. 3 de v1/v2, adjudicado a ojo;
  reanudado con --skip-ghost); auditoría final WARN — 0 FAIL
  (47 WARN, 13 PASS, 18 INFO; (g) clean máx 0,04 s).
- **Estado:** v3 terminada y verificada en fotogramas desde el
  máster. NADA publicado. El usuario ve el video y decide.

## v2 (ENTREGADA 23-nov-2026, 21:14 hora oficial)

- **Motivo:** el usuario oyó la v1 sin música de fondo («nunca se te
  puede olvidar, eso es clave») y vio superposiciones. Reglas
  permanentes nuevas: (1) TODO video lleva música CLARAMENTE AUDIBLE;
  (2) CADA VIDEO lleva SU PROPIA cama generada en Flow (nunca
  reutilizar entre temas). La v2 es AUDIO + VISUAL.
- **Cama nueva:** `libreto-156-combustible` («¿Quién compra el
  combustible de Cuba?», Flow Lyria 3.5, 90 BPM, ventana 0–60 s,
  −19,63 LUFS, scan PASS 0 VOICE). Stem verificado NCC 1.000.
- **Mezcla v2:** `music_volume 0.32`, ducking thr 0.15 / ratio 1.3 /
  release 250 ms (v1: 0.4 / 0.08 / 1.5 / 400 ms). Niveles medidos
  (puerta §5 del check (f)): pausas −23,7 dBFS (v1: −26,1); bajo la
  voz mediana −33,0 (v1: −31,1), p10 −38,6 (v1: −49,7 — la puerta da
  FAIL en la v1 y PASS en la v2); brecha voz–cama mediana ~12 dB.
  El primer intento a 0.4 quedó demasiado alto (pausas −21,9; la
  cama superaba a la voz en el 23,5% de las ventanas de habla) y se
  bajó a 0.32. Mezcla −16,4 LUFS, TP −1,9. Pre-auditoría v2: WARN,
  0 FAIL (45 WARN, mismos que la v1).
- **Visual v2:** (1) Gancho: punch eliminado (era el que recortaba
  el texto por el borde izquierdo) + viewport insertado 16 px/lado
  (left 16, top 404, 1048×920) y paneo −320: el titular ya no toca
  el borde y la marca de agua no tapa la línea superior.
  (2) Cierre: fondo Tinta sólido (sin el gráfico del gancho de
  fondo); karaoke apagado durante la tarjeta «¿QUIÉN ESCRIBIÓ EL
  LIBRETO?» (rangos [19,2, 22,68] y [22,68, 27,5]); la fuente
  aparece solo en la end card (24,5 s). (3) Pre-vuelo v2: 0
  bloqueantes (el primer intento dio 2 BLOQ «duplicate» por el
  still f30, idéntico a f134 sin punch — still eliminado del
  manifiesto); 3 AVISOS benignos (barra de progreso ×2, metraje del
  buque ×1). Stills revisados a ojo: gancho f162, cierre f700/f776,
  buque f544.
- **Render:** completo (el codeHash global invalida todos los
  tramos; el re-render parcial por código es imposible).
- **Puerta §5:** `scripts/audio/audit-audio.py`, check (f) §5: FAIL
  si la cama duckeada queda < −30 dBFS en pausas, < −34 de mediana
  bajo la voz o < −40 en p10 bajo la voz. Bug corregido durante la
  validación: la media energética de pausas usaba 20·log10 en vez
  de 10·log10 (daba −52,3 en vez de −26,1). Informes de validación
  FAIL-v1 en `~/workspace/.tmp/bed-gate-v1/`.
- **Entregables v2:** `out/MASTER-v2.mp4` (6.312.571 B, SHA-256
  `f3b5c241fe0a4a8bb0b2963ec35112866afddda0a143e00eb84f5e2691d9e962`,
  −15,8 LUFS, TP −4,2) y `out/LIGERA-v2.mp4` (1.820.578 B, SHA-256
  `455fb55681a1ab72236fa0d88d69ab77a7889688bbdea4eeed02637a038f94ad`,
  −16,0 LUFS, TP −4,0). QA passed; ghost 0 GHOST, 4 REVISAR
  f374–377 (adjudicados); auditoría final WARN — 0 FAIL (13 PASS,
  47 WARN, 18 INFO). Muestra de audio de 15 s del máster
  (6,25–21,25 s): `~/workspace/.tmp/muestra-fb-v2-15s.mp3`.
- **Estado:** v2 entregada 21:14. La v1 queda intacta
  (`out/MASTER-v1.mp4`, `LIGERA-v1.mp4`). NADA publicado.
  Superada por la v3 (ver arriba).

## v1
- **Estado:** ENTREGADO 23-nov-2026 ~20:20 (hora oficial). REEL_OK
  completo (audio → mix → pre-auditoría → pre-vuelo → render →
  máster → QA → ghost → auditoría). NADA publicado en redes:
  pendiente verlo el usuario y decidir la publicación.
- **Máster:** `out/MASTER-v1.mp4` — 7.180.131 B, SHA-256
  `6425417e…85112`, 1080×1920, 825 f, 27,5 s, −15,8 LUFS, TP −4,1.
  Enlace Muse (expira 26-nov ~00:20 UTC):
  https://muse.ai/files/823310194207159/28980182018319403/2af0v06yuj9j2j458nnimiyo/MASTER-v1.mp4
- **Ligera:** `out/LIGERA-v1.mp4` — 1.970.596 B, SHA-256
  `7e5ba200…9ea68`, 825 f, 27,5 s, −15,9 LUFS, TP −4,1.
  Enlace Muse (expira 26-nov ~00:20 UTC):
  https://muse.ai/files/823310194207159/1168064235772060/qqsy7ro5soaisjdb0l5l4mb6/LIGERA-v1.mp4
- **QA:** technicalStatus passed (825/825 f, 0 deriva, sin negros ni
  silencios, decode OK). **Auditoría final:** WARN — 0 FAIL, 46 WARN
  (45 check (b) + 1 check (g) «este» +0,20 s, la corrección documentada
  del onset), 13 PASS, 15 INFO. **Ghost:** 0 GHOST, 4 REVISAR (f374–377,
  desliz de entrada de la pág. 3, adjudicados benignos a ojo;
  reanudado con --skip-ghost, precedente Messi YT).
- **Entrega:** el paso --deliver del orquestador FALLA en esta VM
  (rclone no instalado, sin credenciales de Drive). La entrega se hizo
  por Muse storage (enlaces arriba). Drive pendiente del padre si
  hace falta (vía conector).
- **VO:** `public/audio/real/vo-fb-limpia-clean.wav` (24,02 s, 69 palabras).
  Informe: dossier `vo/VO_EDIT_REPORT_156.md`.
- **Cama:** `libreto-messi-desmentido` (bed.id en timeline.json, fuente única).
- **Duración:** 27,5 s / 825 f. Tag: v1.
- **Pre-auditoría:** WARN — 0 FAIL, 45 WARN (todos check (b), tiempos de
  caption por habla rápida, mismo patrón que Messi), 9 PASS, 16 INFO.
  Checks (c) VO íntegra, (d), (e), (f), (i) en PASS.
- **Correcciones aplicadas 23-nov (ver generador
  `~/workspace/.tmp/gen-156-data.py` y este MainReel):**
  - Límites de segmento MEDIDOS con las funciones exactas del check (c)
    (energía + armonicidad), no puntos medios: los puntos medios daban
    7 FAIL en (c). 11 segmentos: L1+L2 y L7+L8 fusionadas (sin ningún
    límite limpio entre ellas; la toma es continua y nada se descarta).
  - Riser recortado a 0,90 s (antes 0,982): su pico enterraba el ataque
    de «Sin» (check (i5) WARN, +11 dB). Ahora (i5) PASS.
  - Sello «SIN CONTEXTO»: fontSize 100 → 80 + `whiteSpace: nowrap` +
    alto 200 → 170 (top 955, mismo centro): a 100 px el texto se
    partía en dos líneas y desbordaba el borde. Verificado en still
    f660 (`out/preflight-stills/extra-veredicto-f660b.jpg`).
  - B-roll: clip DVIDS 900133, segundos 3–6 del corte de 15 s (proa
    con remolcador; sin nombre legible en el casco). El mismo corte
    se usa en YT (su ventana 8–11 s mostraba la popa con
    «EMPIRE STATE / WILMINGTON, DE» legible y se descartó).
- **Pre-vuelo:** 0 bloqueantes. 2 fotogramas con AVISO edge-clipped
  (fondo del gráfico viral tocando el borde + barra de progreso):
  adjudicados benignos tras revisión a ojo. Stills extra verificados:
  gancho f170 (paneo + círculo completos), veredicto f660 (sello).
- **Siguiente paso:** ninguno en producción. El usuario ve los videos
  (enlaces arriba) y decide la publicación. Al publicar, aplicar la
  regla de vista previa (verificar antes de publicar).
