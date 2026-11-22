# Handoff — «Dicen que no hay bloqueo» (negacion-embargo)

22-nov-2026. **PRODUCCIÓN EN CURSO** (fase `edit`, ya no bloqueada):
Suleris dio el visto bueno final y el usuario ordenó proceder
(~12:36); VO de Adriana completa 8/8 y verificada.

## Hitos de producción (22-nov, en curso)

- [ ] 1. Composición construida
- [ ] 2. Pre-vuelo visual superado
- [x] 3. Cama lista y escaneada — HECHO 22-nov ~13:20. Cama nueva de
      Flow Music «Memorial de la Denuncia — Cama documental» (Lyria
      3.5, 112 BPM, 117,38 s), ventana limpia 8–98 s (90 s; scan PASS
      0 VOICE / 0 UNCERTAIN), registrada como
      `memorial-cama-documental`. Stem 77,5 s a nivel nativo + dips
      horneados (panel −6 dB, giro −12 dB). MEZCLA FINAL con
      fixed-gain lineal (+3,21 dB): PASS_REAL −16,2 LUFS / TP −1,9;
      dips verificados en la mezcla. `documentary-flow-a` queda como
      RESPALDO (stem y mezcla temporal guardados). El render de
      validación usa directamente la mezcla FINAL.
- [ ] 4. Render terminado
- [ ] 5. Auditoría de audio superada
- [ ] 6. Máster + ligera entregados

Se marcan en este archivo y en `STATE.json` (`milestones`) a medida
que se completan.

## Dónde está todo

- Brief creativo: `CREATIVE_BRIEF.md` (concepto, guion, plan por escena).
- Manifiesto: `asset-manifest.json` (13 archivos, 546 MB, con SHA256,
  fuente, licencia y escena que sirve cada uno).
- Estrategia aprobada: `preprod/propuestas/2026-11-22/roi-rena-cuba-nunca-a-tenido-embargo/estrategia-video-1.md`
- Dossier: `preprod/investigacion/negacion-del-embargo/dossier.md`

## Lo conseguido

- **Panel completo con metraje real**: Rubio 20-may (corte 10,05 s),
  Waltz 7-jul «It's fake» (corte 17,02 s, UN Web TV 99.ª plenaria),
  Waltz 27-oct «There is no blockade» (UNifeed soundbite 33, 26,6 s),
  Waltz 16-nov Fox News (foto real). Todo verificado por
  transcripción local y/o a ojo.
- **Respaldo y fuentes de edición**: ventanas UN Web TV completas
  (julio 331,8 s; octubre 90,5 s + 80,1 s — la de 90,5 s incluye la
  cifra de 876 M con la voz de Waltz, útil para L6), paquetes UNifeed
  completos, original de Rubio completo.
- **Documentos reales**: capturas de state.gov «Cuba Sanctions» y
  comunicado del 5-nov (ambas 1920×1080, texto clave verificado
  legible a ojo por dos agentes). Método CDP + relay CONNECT local
  (ver `research/capturas-state-gov-metodo.md`).
- **Archivo del Memorial buscado** (13 términos): solo 2 piezas
  útiles, en Drive sin descargar (imagen satelital NOAA/CIRA de
  Cuba a oscuras; fuente cruda del reel de Bruno ONU) — ver
  `referenced` en el manifiesto. Nada de puerto/petróleo/barcos/
  Habana/Malecón.

## Lo que falta

- Visto bueno FINAL de Suleris (puerta dura).
- Cama Flow Music (elegir ventana limpia + `scan-bed.py`).
- VO: Adriana graba la definitiva (guion entregado 22-nov; sin
  audio de referencia por decisión del usuario).
- Si se usa la imagen satelital de Cuba a oscuras: descargarla de
  Drive (`Cuba_blackout_NOAA_CIRA_2026.png`) y verificar el crédito
  NOAA/CIRA.

## Avisos para la edición

1. El video de Rubio lleva **subtítulos quemados en inglés** (sin
   fotograma limpio): recortar el tercio inferior o cubrir con la
   banda de la cita.
2. El corte «It's fake» empieza con una cola «aid.» de ~0,3 s:
   recortar el inicio; la frase empieza a ~0,3 s.
3. Las frases de las tarjetas 2–3 con voz original duran 5–6 s:
   decidir si el panel se estira a 14–16 s o se queda en 3 s por
   tarjeta con cita completa como texto (ver CREATIVE_BRIEF.md §5).
4. La foto de Fox News es 1280×720 (no hay mayor resolución en el
   artículo); verificar su crédito original al publicar.
5. **Regla de Suleris**: en la voz del Memorial, BLOQUEO, nunca
   «embargo» («embargo» solo en citas textuales de EE. UU., L4).
6. Licencias: ONU © (crédito «Imágenes: UN Web TV / Naciones
   Unidas»); Dept. de Estado = dominio público; Fox News = cita
   editorial con atribución.

## 22-nov ~15:05 — Composición v2 recibida + re-mezcla v2 (hitos 1–2)

- Composición MainReel v2 (commit `1cab80d`): reencuadre Rubio, regla de
  caras, L4 T1–T5, 8 técnicas, gancho video real, auditoría 18 puntos,
  investigación 3. Borrador v2 540p; puerta QA visual PASS (0 negros).
- Pre-vuelo: 70 stills del subagente + 16/16 críticos verificados por mí
  (S1, L6, S9, gancho, L4, T3/T4, wipe, sello fantasma, freeze).
- Re-mezcla v2: 43 SFX (+4 risers sync 0,982, obturador 18,40 s −6 dB,
  marcador 36,58 s −1 dB); J-cut L8 (VO 69,0→68,5 s); PUNTO. 13,32 s;
  contador 48,81 s. Mix −16,43 LUFS / TP −1,94.
- NO re-ejecutar `scripts/build-timeline.py` sin restaurar `src/captions.ts`
  después (regenera los onsets y destruye las correcciones manuales + el
  desplazamiento L8). Trampa documentada por el subagente de composición.
- Pendiente: render de validación (run-render.sh) + QA + auditoría + entrega.

## 22-nov ~15:20 — Feedback 15:10 + Investigación 4 (en curso)

- **Frame de Bruno — LOCALIZADO Y CORREGIDO.** Verificado por extracción densa fotograma a fotograma (15,4–15,8 s, 13 fotogramas): Bruno Rodríguez en f465–f468 (15,50–15,63 s), primeros 4 fotogramas de T3 — cola del plano anterior (Bruno sentado en la Asamblea General) en el soundbite UNifeed; Waltz desde f469. La ventana 13,5–14,5 s que el usuario pidió verificar está limpia (sin Bruno; la subida gradual de diferencias es el push-in + el slam «PUNTO.»). Corrección en MainReel.tsx: `startFrom={5}` en ambos OffthreadVideo de T3 (principal + backdrop difuminado) + freeze de local 87 a local 82 (disolución 82–88, push [82,120]). El freeze aterriza en **f547 = 18,23 s** (antes f552 = 18,40 s); el SFX de obturador se mueve a 18,23 s en la re-mezcla v3. `tsc --noEmit` limpio. Pendiente: verificación con extracción densa (15,4–15,8 s) sobre el borrador v3 (f465 debe ser Waltz).
- **Subtítulo del cordón militar ELIMINADO** (línea en cursiva de T3). La tarjeta Fox T4 sigue en la composición: su retirada + el reemplazo de la 4ª declaración esperan al padre; NO re-timar el panel.
- **Bug de ruta del render (aviso de la vigilancia 15:13) — DIAGNOSTICADO Y CORREGIDO.** Causa: `render-chunks.mjs` resuelve `--out` respecto a `home` de `loadProject()` = el dir del proyecto (`scripts/lib.mjs:12`), pero `run-render.sh` pasaba una ruta relativa a la raíz del repo → los tramos iban a `projects/negacion-embargo/projects/negacion-embargo/out/chunks/` (chunk_01 15:08, chunk_02 15:10) y el `--resume` no los encontraba. `run-render.sh` ahora pasa `out/chunks` + `out/negacion-embargo-chunks.mkv` (relativos al proyecto). Los 2 tramos anidados eran rancios (composición cambiada) y se eliminaron. No hay proceso de render activo (el de validación se mató ~15:11 por el feedback). **NO se reanuda el render hasta la composición v3** (cualquier render ahora sería sobre una composición que va a cambiar).
- **NOAA «before» NO disponible en esta sesión.** Entrada CIRA «Nighttime View of Power Blackouts in Cuba» existe (antes 15-feb-2026 06:58 UTC «Standard Nighttime Lights», después 17-mar-2026 07:06 UTC — el par es feb→mar; la nota «06:56» estaba 2 min desviada). La página CIRA devolvió 403 en `browser.open` (no reintentable por otra vía por instrucción del runtime); no hay URL directa del PNG ni archivo 2026 en Commons. Se aplica el **fallback** de la investigación 4: zoom lento + rótulo en español + círculo en La Habana. Si el padre baja el PNG «before» en su navegador, el wipe es un seguimiento de ~30 min.
- **Investigación 4 — subagente de composición lanzado ~15:20** (técnicas visuales: T2 glitch RGB, T3 match cuts, T4 NOAA fallback, T6 shake, T7 micro-animación de texto, T8 rima de bucle visual, título del gancho — v0.5: el título cubre boca/barbilla de Waltz en v2; verificar/aplicar el título fantasma). El audio (T1 capas SFX, T5 micro-drops, disparo CC0) lo hago yo tras la composición. T4 se corta; si el panel queda en 3 tarjetas, los ~4 s liberados van al giro o a L4, no al logo (re-timing EN ESPERA del reemplazo).
- **Pendiente mío (mientras el subagente compone):** buscar el disparo CC0 en freesound.org (verificar licencia CC0, escanear como asset nuevo; sync: grieta de impacto en la estrella del logo; fallback boom-hit-strong) + localizar el momento exacto del impacto en el sting del logo.

## 22-nov ~15:28 — 4ª declaración verificada + disparo CC0 (la espera del panel se levanta)

- **4ª DECLARACIÓN VERIFICADA (commit f2da904, pusheado).** Waltz 28-oct-2026, explicación de voto de EE. UU. ante la AGNU (28.ª plenaria), justo después de la votación. Triple verificación (video UN Web TV + transcripción oficial USUN AS DELIVERED + Whisper local, palabra por palabra). **L2 «Cuatro veces» SE MANTIENE — no hay que regrabar.**
  - Corte principal: `public/video/waltz-28oct-no-blockade-eov.mp4` (12,913 s, 1080p, 29,97 fps, 6,9 MB) — «…the world finding out once and for all that there is no blockade.» Frase clave «that there is no blockade» en 10,2–12,8 s del corte; cierra limpio tras «blockade». Still: `public/img/real-un/waltz-28oct-eov.jpg`.
  - Alternativo: `waltz-28oct-fake-phony-blockade.mp4` (13,8 s, «fake, phony, made-up blockade») — respaldo, no usar salvo que el principal no encaje.
  - Plano SENTADO (escaño, micrófono de cuello de cisne, placa «UNITED STATES»); crop 9:16 centrado en Waltz (el delegado del borde izquierdo queda fuera); mirada baja en varios fotogramas = lectura, NO defecto; sin subtítulos quemados; rótulo «WALTZ · ONU 28-OCT»; crédito «Imágenes: UN Web TV / Naciones Unidas».
  - Panel final: Rubio 20-may → Waltz 7-jul → Waltz 27-oct → Waltz 28-oct. **OJO barra de tiempo:** 27 y 28-oct están a un día — ajustar el espaciado de los nodos para que no se solapen.
  - Handoff completo leído: `HANDOFF-4TA-TARJETA-28OCT.md` (incluye los descartados re-verificados: Waltz X 19-nov, Rubio Al Jazeera 30-mar, soundbites UNifeed 11 y 13, Trump — ninguno califica).
- **Subagente de composición ACTUALIZADO (~15:28, mensaje enviado, pendiente de aplicación):** la instrucción «no tocar T4» queda sustituida — reemplaza S4 (Fox + parallax + «CORDON») por la tarjeta de video Waltz 28-oct en el slot 585–705 f (ventana ~4 s terminando en «blockade» 12,8 s; audio normalizado a −16 LUFS, video re-codificado crf 18); NO cambia la duración total (2325 f); match cuts ahora en 3 fronteras (T3→T4 19,5 s incluida); glitch se queda en 3 usos (sin 4º para la tarjeta nueva); barra de tiempo con 27/28-oct sin solape.
- **Disparo CC0 — VERIFICADO, MEDIDO Y ESCANEADO.** Freesound 844540 «Gun (Pistol) Shot» por synth2, licencia CC0 verificada en la página (uso comercial sin permiso). Preview HQ descargada (0,746 s; media −29,7 dB; pico −7,9 dB; pico a 0,0567 s → sync 0,057 s); Whisper+VAD: 0 segmentos, sin voz (PASS). Canónico en `public/audio/sfx/weapons/gunshot-pistol-cc0.wav`. **Sync medido en el sting:** la grieta aparece en 0,733–0,750 s del sting (primer fotograma con grieta = f2257 = 75,23 s global; el sting arranca en 74,5 s). Evento T = 75,23 s; `at` = 75,176 s; ganancia 1. Fallback: boom-hit-strong. Detalle en `research/sfx/gunshot-pistol-cc0.md`.
- **Pendiente mío (tras la composición v3):** re-mezcla v3 (obturador 18,23 s + disparo 75,23 s + capas SFX técnica 1 + micro-drops técnica 5) → render de validación (ruta corregida) → QA + auditoría → entrega.

## 22-nov ~16:04 — PNG «before» NOAA conseguido: el wipe sustituye al fallback (con advertencia de alineación)

- **Archivo verificado:**

- **Archivo verificado:** `public/img/Cuba_lights_before_NOAA_CIRA_2026.png` (1920×1080, 2.156.036 B, SHA256 `dd6e0b433c29ae846d5d767f9a199a50d78124bf8191a88892476212f7341732` — coincide con el del padre). «Standard Nighttime Lights», 15-feb-2026 06:58 UTC, VIIRS DNB (NOAA-20/21), entrada CIRA «Nighttime View of Power Blackouts in Cuba». Fuente: https://satlib.cira.colostate.edu/wp-content/uploads/sites/23/2026/03/202602150658_n21-snpp-n20_viirs_dnb_cubablackout_nolabels0.png
- **Verificación visual (padre + yo):** Cuba de noche con las luces encendidas (La Habana brillante al oeste, Santiago al este), logos CIRA/NOAA abajo a la derecha. Es el par correcto con el «after» actual (17-mar-2026 07:06 UTC). **NO usar el «before» de la otra entrada CIRA («Nationwide Power Blackout in Cuba», 4-dic-2024) — es de OTRO evento.**
- **ADVERTENCIA — LOS DOS PNG NO ALINEAN TAL CUAL.** Verificado antes de la composición (el padre pidió verificarlo en pre-vuelo): el «before» muestra la isla entera en diagonal y el «after» es un plano más cerrado con otro ángulo (distintas pasadas del satélite, distinta geometría de vista). Medición: correlación de gradientes (bordes/costas) **0,116** (muy baja); en una fusión 50/50 las costas se DUPLICAN. Un wipe directo mostraría un salto (la isla rotando/desplazándose en la divisoria). Sin OpenCV en esta VM ni puntos de control fiables, el registro afín manual es propenso a error — queda en manos del subagente de composición (con el diagnóstico + ancla La Habana: «before» ~x=200, y=110; «after» ~x=1630, y=430).
- **Subagente actualizado (~16:04, mensaje enviado, pendiente de aplicación):** el wipe SUSTITUYE al fallback (Cuba iluminada → divisoria vertical ~1,2 s → Cuba a oscuras; rótulos «ANTES»/«DESPUÉS» + «Cuba a oscuras · NOAA/CIRA · feb 2026»; el shimmer lo pongo yo en la mezcla). Instrucción: intentar alinear el «after» sobre el «before» (semejanza, objetivo corr >0,4, verificar con fusión 50/50) y usar el wipe SOLO si converge limpia; si no, CORTE (o fundido) con los rótulos + reportar la desviación. **OJO:** el «after» trae «After Power Outages» quemado en INGLÉS abajo al centro (y~88–95%; el «before» es nolabels): cubrir con el crédito en español o recortar — que NO se lea inglés en el reel.
- **Manifiesto:** el «before» registrado en `asset-manifest.json` (37 archivos, 602.033.301 B; la suma de `files` coincidía exactamente con el total anterior). Nota: el «after» sigue listado en `referenced` como «en Drive, NO descargado» aunque YA está en `public/img/` (inconsistencia preexistente, no reestructurada).
- **Opción si la alineación no converge:** el padre puede bajar el MP4 de la animación CIRA (sus fotogramas SÍ están reproyectados a una rejilla común) o el PNG «after» nolabels; con eso el wipe sería limpio sin registro manual.

## 22-nov ~21:30 — Composición v3: técnicas visuales + T4 28-oct + NOAA por CORTE (subagente de composición)

- **T4 28-oct CONSTRUIDA (reemplaza la Fox).** Ventana elegida **8,9–12,9 s** del corte EOV (4,0 s = 120 f, llena el slot 585–705): Whisper local confirma «and for all that there is no blockade» («blockade» cierra 12,6–12,8 s, sin cola). `public/video/panel-t4.mp4` (4,004 s, 1920×1080, loudnorm two-pass I=−16 TP=−2, medido **−17,03 LUFS / TP −1,76** — dentro del rango de la familia: t1 −16,13, t2 −17,70, t3 −15,68; no rehacer). `PanelT4Scene` reescrita: video con audio + backdrop difuminado + `PanelGradients` + `TimelineBar active={3}` + `DataChip` «UN WEB TV · ONU» + cita «THAT THERE IS NO BLOCKADE» / «QUE NO HAY BLOQUEO» + «MIKE WALTZ — EMBAJADOR ANTE LA ONU · 28 OCT 2026». Encuadre: escala 0,80 + translateY 235 px (origen 50% 0%): pelo ~321, mentón ~917 — bajo la barra y encima de la tarjeta; delegado fuera de cuadro; placa «UNITED STATES» solo una franja en el borde derecho. Sin parallax ni fantasma (eran solo para la foto Fox). `GRID_CARDS[3]` y `CLOSE_CARDS[3]` → still 28-oct (`waltz-28oct-eov.jpg`); `TL_DATES` → `['MAY 20', 'JUL 7', 'OCT 27', 'OCT 28']` (espaciado uniforme 90/390/690/990: OCT 27 610–770 y OCT 28 910–1070, **sin solape**).
- **Glitch RGB ×3 (solo 3 usos).** `GlitchDefs` (filtros SVG `#glitchR/G/B`) + `GlitchVideo` (base + 3 copias de canal, `mix-blend-mode: screen`, 8 f, pico en el centro, dx máx 4 px). G1 «It's fake» f302–309 (centro **f306 = 10,2 s**; medido: «fake» 10,04–10,40 s); G2 «PUNTO.» f396–403 (centro **f400 = 13,32 s**, el slam visual); G3 «There» f467–474 (centro **f471 = 15,7 s**).
- **⚠️ DISCREPANCIA PUNTO. (hallazgo crítico, decisión del padre/agente de audio).** El slam visual «PUNTO.» + SFX están en **f400 (13,32 s)**, pero el audio «Period.» MEDIDO con Whisper sobre `panel-t2.mp4` cae en **f423 (14,1 s)** — 23 f (~0,77 s) después. El push-in de T2 (local 71–115) también termina 23 f antes del fin real de la pausa (última ráfaga 4,6–5,55 s; pausa 3,14–4,58 s). La auditoría dice que «PUNTO.» entra «tras la pausa» → la colocación correcta sería f423. El glitch y el shake de PUNTO. siguen al slam visual (f400) por orden del brief; el glitch usa `PUNTO_AT` en código para que siga cualquier movimiento futuro. **Decidir: mover el slam+SFX a f423 o confirmar la anticipación deliberada.**
- **Match cuts con morph ×3** (pre-corte 12 f ease-in hasta ~80% + post-corte 24 f ease-out, ratio 1:2; wrapper exterior, nunca sobre overlays). B1 T1→T2 (corte f297): pre T1 local 114–126 (ty +60, escala 0,94, origen 540,433 — acotado para no sacar los subtítulos quemados de Rubio de la banda opaca); post T2 local 12–36 (ty −72→0, escala 1,12→1). B2 T2→T3 (corte f465): TOQUE LIGERO (T2 termina cabeza ~589, T3 entra ~852 y sube sola al hablar): pre local 168–180 (ty +24, escala 1,02), post T3 local 0–24 (ty −16→0, escala 0,98→1) — **salto residual visible, informado con honestidad**. B3 T3→T4 (corte f585): CASI PERFECTO (cabezas a 24 px y 6% de escala): pre T3 local 108–120 (ty −19, escala 1,031), post T4 local 0–24 (ty +5→0, escala 0,993→1). Sonido transform-morph + whoosh 2–3 f ANTES de cada corte (f294, f462, f582).
- **Título del gancho — FANTASMA APLICADO (y luego RETIRADO, ver sección 22:30).** Recorte u2net por lote (171 f, 13,0–18,7 s del soundbite 33; `bria-rmbg` murió por OOM — usar siempre `new_session('u2net')`); sándwich video → «BLOQUEO» gigante (230 px, rojo, opacidad 0,5, deriva ±60 px) → recorte con alfa. `public/video/hook-cutout.webm` (VP9 1920×1080, 30 fps, 5,7 s, 2,57 MB; alfa VERIFICADA por tamaño: encode yuva 449 KB vs yuv 347 KB en 30 f — ffprobe reporta `yuv420p` por el plano base y el decodificador ffmpeg de esta VM descarta el alfa al extraer, pero el alfa está en el bitstream; verificación real: stills del gancho). Línea «DICEN QUE NO HAY» (54 px, top 1020) FUERA del punch. **El sándwich FALLÓ en Remotion (el webm se renderiza OPACO y tapa la palabra) → aplicado el fallback (título en 2 líneas en zona despejada, webm fuera de HookScene). Detalle y medidas en la sección 22:30.**
- **Shake de impacto ×5** (f9, f400, f1660, f1789, f1996): patrón dt 0/1/2 → x [3,−2,1], y [2,−1,0,5] px; translate ANTES del scale(drift); grano fuera (estático).
- **Micro-animación de texto.** (a) Eslóganes L7: `LetterSlogan` letra por letra (stagger 1 f, 6 f/letra, pop con sobrepaso ~4–6%); salida con WIPE de máscara hacia arriba local 160–166 (global f1990–1996) — el eslogan 1 sale COMPLETO antes del sello (166); nunca dos eslóganes en el mismo cuadro (corrige v66.6). Entrada f1948 = 64,94 s; última letra ~local 145. (b) Odómetro $876 M: dígitos «descifran» (aleatorios deterministas `(floor(f/2)·7 + i·13 + 5) % 10`) y se asientan de izquierda a derecha en local 46/56/66 (global **f1561/f1571/f1581** = 52,03/52,37/52,70 s); ventana local 36–66. (c) Flip del «10» L5: local 264–272 (global **f1464–1472**, 48,8–49,07 s): cara «9» rotateX 0→90 (264–268), cara «10» roja rotateX −90→0 (268–272), perspective 600 px; anillo sin cambios.
- **Rima de bucle (logo).** Deceleración a hold con `startFrom` dinámico: para local f ≥ 75, `s(f) = 75 + 7·(1−(1−p)²)`, `p = (f−75)/15`; deceleración desde global **f2310 (77,0 s)**; hold total efectivo desde ~f2322. Fallback si el `startFrom` fraccionario no funciona: JPG del fotograma 82 + fundido de 4 f en local 75. Verificar con stills (local 80/85/89 ≈ fuente 82).
- **NOAA — EL WIPE NO CONVERGE → CORTE (desviación reportada).** Alineación intentada con OpenCV (instalado `opencv-python-headless` 5.1.0 en el venv STT): SIFT 38 matches buenos → solo 4 inliers (transformada absurda, corr −0,012); búsqueda en rejilla anclada en La Habana (píxel más brillante del «after» medido en **(1533, 440)**, no (1630, 430) del handoff; «before» (210, 120)): mejor semejanza por gradientes **0,249** y por bordes Canny **0,051–0,084** (ambos en extremos de rejilla, sin pico real), muy por debajo del objetivo 0,4; correlación en bruto 0,13 (reproduce el 0,116 del padre). La fusión 50/50 confirma a ojo: logos CIRA/NOAA flotando en medio de la isla, costas duplicadas. **Decisión (paso 3 del brief): CORTE duro en local 294 (global f1809 = 60,30 s)** — 20 f ANTES (15 feb 2026, isla iluminada) + 21 f DESPUÉS (17 mar 2026, a oscuras); rótulos «ANTES · 15 FEB 2026» / «DESPUÉS · 17 MAR 2026» (píldora arriba a la derecha, misma posición) + crédito POR LADO (corrección 22:30): «Cuba con luz · NOAA / CIRA · feb 2026» antes / «Cuba a oscuras · NOAA / CIRA · mar 2026» después (abajo al centro, top 1038, fondo OPACO #060C14 — **TAPA el «After Power Outages» en inglés** del «after»; glifos medidos en display y 1049–1074; el fondo semitransparente lo transparentaba). Fundido de entrada del bloque local 280–292 (completo antes del corte). El fallback anterior (zoom + círculo + «EL APAGÓN VISTO DESDE EL ESPACIO») queda SUSTITUIDO y eliminado del código. **Shimmer: va sobre el CORTE f1809 (60,30 s)** (el bloque arranca con CONTROL en f1789 = 59,63 s). No se guardó PNG alineado (no existe: la alineación no converge). Opción futura del padre: MP4 de la animación CIRA (fotogramas reproyectados) o PNG «after» nolabels.
- **Tiempos para la mezcla (re-mezcla v3):** glitch f306 (10,2 s), f400 (13,32 s), f471 (15,7 s); morph f294/f462/f582 (whoosh 2–3 f antes del corte); shimmer NOAA f1809 (60,30 s); shake f9/f400/f1660/f1789/f1996; odómetro inicio f1551, asientan f1561/f1571/f1581; flip «10» f1464–1472; eslóganes entrada f1948, salida f1990, sello f1996 (66,52 s); hold del logo desde f2310; obturador T3 f547 = 18,23 s; disparo logo 75,23 s.
- **Verificación v3 COMPLETADA (ver sección 22:30 para las correcciones finales):** `npx tsc --noEmit` limpio; 37 stills 540×960 regenerados en `out/preview/` (gancho f0/f9/f15/f60/f85, morph f296/f297/f464/f465/f584/f585, glitch f306/f400/f471, freeze f547, T4 f600/f650/f700, flip f1464/f1468/f1472, odómetro f1551/f1561/f1571/f1581, NOAA f1789/f1795/f1808/f1809/f1810/f1820, eslóganes f1948/f1990/f1996, logo f2315/f2320/f2324) — veredictos por punto en el informe final del subagente. NO hacer el render de validación ni la mezcla (otro agente).

## 22-nov ~22:30 — Correcciones antes del commit (actualización 3: revisión a ojo del padre + usuario)

- **1. NOAA — RÓTULO POR LADO (contradicción de mes corregida).** El rótulo único «Cuba a oscuras · feb 2026» contradecía el mes y la descripción de cada lado (before 15-feb, iluminada; after 17-mar, a oscuras). Ahora el crédito cambia en el corte local 294 (mismo condicional `f < 294` que el chip): lado ANTES (f≤1808) «Cuba con luz · NOAA / CIRA · feb 2026»; lado DESPUÉS (f≥1809) «Cuba a oscuras · NOAA / CIRA · mar 2026». Chips ANTES 15 FEB / DESPUÉS 17 MAR sin tocar. **CONFIRMACIÓN DEL CORTE (lo pide el padre): se usó el CORTE y no el wipe — la alineación NO convergió.** Medidas: correlación de gradientes en bruto 0,13 (reproduce el 0,116 del padre); SIFT 38 matches → 4 inliers (transformada absurda, corr −0,012); rejilla anclada en La Habana (after (1533, 440) medido, before (210, 120)): mejor semejanza **0,249** por gradientes y **0,051–0,084** por bordes Canny, ambos en extremos de rejilla sin pico real — muy por debajo del objetivo **>0,4**; fusión 50/50: costas duplicadas, logos flotando. Decisión según el paso 3 del brief: CORTE duro f1808→f1809 (fotogramas consecutivos: ANTES en 1808, DESPUÉS en 1809). Verificado a ojo en los stills regenerados: f1808 isla iluminada + «Cuba con luz · feb 2026» ✓; f1809 isla oscura + «Cuba a oscuras · mar 2026» ✓; el inglés «After Power Outages» queda totalmente tapado por la píldora opaca (verificado con zoom 3×). `asset-manifest.json` actualizado (la entrada del «before» decía «wipe» → ahora «corte», con el resultado de la alineación).
- **2. Glitch «PUNTO.» — LEGIBILIDAD (f400, 13,33 s).** Revisado EN MOVIMIENTO (stills f396–f404 + f408/f412): el problema NO es un split RGB en el texto — **el texto no lleva split RGB** (el glitch `GlitchVideo` solo afecta al vídeo; la banda de cita es texto plano). La causa real es el pop del spring de «PERIOD.» (1,8× con origen centrado): en el pico (f400) se leía «LPERIOD.» (la «IE.» tapada) y el sobrepaso del spring volvía a comerse el espacio en f~412 («LIE.PERIOD.»); en f404 se leía bien. **Corrección: `transformOrigin: 'left center'` en el span de «PERIOD.»** — el pop crece hacia la derecha, nunca sobre «LIE.»; el slam de «PUNTO.» (línea propia, 1,8×) no se toca y el glitch G2 sigue en el vídeo. Verificado: f400 y f412 regenerados — «IT'S A LIE. PERIOD.» legible con espacio intacto en ambos, «PUNTO.» contundente debajo.
- **3. Título del gancho — EL SÁNDWICH FALLA → FALLBACK APLICADO (decisión cerrada con medidas).** El fantasma «BLOQUEO» no aparece en ningún still fresco (f9/f60/f85): (a) el webm VP9 lleva el alfa en el bitstream (A/B: encode yuva 449 KB vs yuv 347 KB, +30%) pero el decodificador Chromium de Remotion lo descarta — el recorte se renderiza OPACO (la prueba con `chrome-headless-shell` directo se colgó dos veces sin escupir captura: `--virtual-time-budget` 12 min sin resultado; `--timeout` 90 s sin resultado; no insistir por esa vía); (b) geometría medida: «BLOQUEO» en Archivo Black 230 px = **1261 px de ancho** (cubre todo el ancho del cuadro); la silueta del recorte a display y 700 solo cubre x 286–663 → ~800 px de la palabra DEBERÍAN asomar a ambos lados del torso si el alfa funcionara — no asoma nada → el webm es opaco en Chromium. El webm opaco coincide píxel a píxel con el vídeo base (mismo 1920×1080, mismo fotograma 15,0 s en f60), por eso el still se ve limpio. **Fallback aplicado (según el brief):** `GhostHookWord` y `HookSmallLine` eliminados; nuevo `HookTitle` de 2 líneas FUERA del punch, top 930 («DICEN QUE NO HAY» 54 px blanca + «BLOQUEO» 140 px rojo; ~300 px bajo la barbilla, termina ~1134, 26 px sobre el karaoke 1160; misma entrada f0–12 y salida 105–113 con barrido); el `OffthreadVideo` del webm QUITADO de `HookScene` (el archivo `public/video/hook-cutout.webm` queda en disco sin usar — el recorte en sí es bueno y el sándwich podría volver si un render futuro decodifica alfa VP9). Verificado: f0 (sin título, vídeo desde el fotograma 0) ✓, f9 (entrada, cara libre) ✓, f15/f60/f85 (título asentado bajo la barbilla, sobre el pecho, karaoke despejado) ✓.
- **Verificación final v3 (COMPLETA).** `npx tsc --noEmit` limpio (corrido tras la última edición). Stills verificados a ojo, uno por uno: gancho f0/f9/f15/f60/f85 ✓; morph f296/f297/f464/f465/f584/f585 ✓ (B1/B2/B3 en pico y en corte); glitch f306 (medido por programa: pico R–B en lag +4 = 8 px a resolución completa, controles en lag 0) ✓, f400/f412 (legibilidad tras el fix) ✓, f471 ✓; freeze f547 ✓; T4 f585/f600/f650/f700 ✓; flip f1464/f1468/f1472 ✓ (9 → canto → 10 rojo); odómetro f1561 ($892 M, valor determinista esperado) / f1581 ($876 M final) ✓; NOAA f1789 (CONTROL entrando) / f1795 (CONTROL asentado) / f1808/f1809 (rótulo por lado) / f1810/f1820 (wipe S9 diseñado, 1818–1830) ✓; eslóganes f1948/f1990/f1996 + sello f2010 («ES UN DOCUMENTO OFICIAL.» asentado, eslogan fuera) ✓; logo f2315/f2320/f2324 (idénticos = hold) ✓. **Desviaciones abiertas:** (i) PUNTO. f400 visual vs f423 audio (23 f) — decisión del padre/agente de audio, sin resolver; (ii) B2 morph con salto residual (T2 termina cabeza ~589, T3 entra ~852) — informado; (iii) el sándwich fantasma queda retirado (fallback aplicado). **Commit:** `src/MainReel.tsx` + `HANDOFF.md` + `asset-manifest.json` (solo código/docs, nunca medios) en `work/preprod-2026-11-21`. NO se hizo el render de validación ni la mezcla (otro agente cuando este trabajo termine).

## 22-nov ~17:25 AST — FIX «PUNTO.» f400→f423 (agente de audio; desviación (i) RESUELTA)

- **Decisión ejecutada (coordinador):** el slam «PUNTO.» traduce «Period.» y debe caer SOBRE la palabra — 23 f de anticipación era desync, no estilo.
- **Cambios en `src/MainReel.tsx`:** `PUNTO_AT` 103→126 (PanelT2Scene, local desde f297); `SLAMS` 400→423; glitch G2 `windows at: 111`→`134` (local 134–141 en T2Video desde f285, pico local 138 = f423); comentarios actualizados en cabecera, T2Video, PanelT2Scene y shake. El push-in local 71–115 NO se mueve: completa en f400 y aguanta en 1,05 hasta el slam.
- **Verificación acústica independiente:** Whisper small sobre `panel-t2.mp4` da «Period.» 4,58–5,28 s del clip (p=0,98); pausa 1,44 s tras «lie.» (3,14 s). Energía 20 ms: inicio de palabra en 4,58–4,64 s (bump −31 dBFS sobre el suelo −36 dBFS), vocal fuerte en 5,10 s. El slam en f423 (clip 4,60 s) cae 0,02 s después del inicio de palabra. El f400 anterior (clip 3,83 s) caía en plena pausa.
- **Verificación visual:** stills f423/f400/f412 regenerados (540×960). f423: «IT'S A LIE. PERIOD.» legible con espacio intacto + «PUNTO.» rojo contundente, cara libre ✓. f400/f412: pausa limpia, sin slam ✓ (el problema del sobrepaso del spring en f~412 desaparece porque PERIOD. aún no existe).
- `npx tsc --noEmit` limpio. Commit: `src/MainReel.tsx` + `STATE.json` + `scripts/run-render.sh` (fix de ruta heredado) + `HANDOFF.md`.
- **Consecuencia para la mezcla:** el riser y el impacto «PUNTO.» se mueven a 14,1 s (at 13,118 s / 14,09 s) en la re-mezcla v3.
