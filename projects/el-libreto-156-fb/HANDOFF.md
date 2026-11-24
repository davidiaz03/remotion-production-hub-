# HANDOFF — el-libreto-156-fb

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
