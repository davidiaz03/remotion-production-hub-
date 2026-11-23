# CREATIVE BRIEF — El Libreto: Messi nunca dijo esto sobre Cuba (YouTube Short)

Proyecto: `el-libreto-messi-yt` · Rama: `work/preprod-2026-11-21` · 23-nov-2026

## Objetivo

Primer video de El Libreto en YouTube (segundo video del Día 1 en ese
canal; el primero en producirse porque su voz ya llegó aprobada).
Formato 3 — Desmentido: demostrar con el documento que el post viral
de Messi sobre Cuba es falso, sin comentar la situación: el video
ENSEÑA la prueba en pantalla.

- Título (no se dice en voz alta): «El Post de Messi que Engañó a
  62.000 Personas» (Title Case en YouTube).
- Guion: 113 palabras, 9 líneas de VO, 38,1 s de voz; Short de 43 s
  (1290 fotogramas), dentro del spec del formato (30–45 s).
- Dossier R31: `~/workspace/marketing/research/dossiers/messi-desmentido-p1/`
  (8 hechos VERIFICADO, 1 NO VERIFICADO). Veredicto: FALSO.

## Estructura (cortes por fotograma)

| Escena | Fotogramas | Tiempo | Beat |
|---|---|---|---|
| Gancho | 0–80 | 0–2,7 s | Título palabra a palabra: MESSI NUNCA LO DIJO |
| Contador | 81–167 | 2,7–5,6 s | 62.000 reacciones (píldora elTOQUE) |
| La página | 168–389 | 5,6–13,0 s | Zoom al encabezado, píldora 750.000, resaltado «José Forever», aclaración Taiger |
| Comparación | 390–668 | 13,0–22,3 s | Slide-in, sello 2022, círculo + punch-in a la bandera, lupa Gemini, checklist de ausencia |
| Pregunta | 669–719 | 22,3–24,0 s | Tarjeta a pantalla completa: «¿Por qué se lo creyó tanta gente?» |
| Casa Blanca | 720–896 | 24,0–29,9 s | Foto DT-1261 entera, glow en Messi, placa, negación |
| Trío | 897–977 | 29,9–32,6 s | Bukele / Musk / Bad Bunny: el mismo patrón |
| Veredicto | 978–1109 | 32,6–37,0 s | Sello FALSO + «El mensaje no existe. La foto está editada.» |
| Cierre | 1110–1289 | 37,0–43,0 s | Pregunta de marca, sello a la esquina, píldora de fuente, end card SUSCRÍBETE + puente al largo |

## Decisiones (heredadas del corte FB + nuevas de YouTube)

- La composición reutiliza la del FB (`el-libreto-messi-fb`, commit
  `69d1a4d`, v1 REEL_OK): mismos assets, mismos colores de marca,
  mismo karaoke estilo Diplomacia (Papel sobre banda Tinta, keyword
  con fondo Resaltador, «FALSO.» en Lápiz rojo).
- YouTube añade los beats que el guion largo permite: lupa sobre la
  marca de agua de Gemini (T2), checklist de ausencia (T8), tarjeta
  de pregunta (T15), resaltado suave sobre Messi, y las dos líneas
  del veredicto en pantalla.
- La marca de agua de Gemini (destello blanco de 4 puntas) está
  localizada en la foto manipulada: centro (479, 671) en coords de
  imagen (1113×713). La lupa la amplía 4×. PENDIENTE DE PRE-VUELO:
  verificar que se lea en el still f570; si no se lee, ajustar el
  zoom, no inventar la marca.
- La foto de la Casa Blanca se muestra ENTERA con fondo difuminado
  (condiciones EXIF: periodística permitida, no manipular, nada
  comercial). El glow sobre Messi es radial y suave, centrado en su
  torso (350, 950), sin tocar su cara.
- NINGÚN gráfico sobre la cara de una persona. La captura del post va
  recortada (solo encabezado + texto) en el gancho y el cierre para
  que la banda de karaoke no tape las caras de la foto.

## Sonido

- Sin música. 9 SFX underVO (ver `research/timeline.json` §5) + tono
  de sala en bucle (amb-room-tone, 30 s, repetido para cubrir 43 s;
  corte duro en 30 s — la muestra inicial y final son 0,0).
- El sello de goma del veredicto golpea 60 ms DESPUÉS del onset de
  «FALSO» (32,87 s), no antes: el sonido sigue a la palabra.
- La mezcla se verifica por identidad de tono de sala (hash PCM en
  dos tramos) antes de mezclar.

## Voz

- `vo-yt-limpia-clean.wav`: 38,1 s, −18,7 LUFS, TP −2,0, SNR 36,6 dB,
  preset clean, aprobada 23-nov 11:31. Ritmo efectivo 184 ppm.
- Onsets medidos a −40 dB (el suelo de la limpia, −50,7 dBFS, falsea
  la medición a −50 dB): 10 correcciones aplicadas en captions y
  auditoría (máx. 0,29 s, en «Messi» inicial: 0,30 → 0,53).
- Sospecha ASR pendiente de verificar de oído por el usuario: Whisper
  oyó «dio» en «¿Por qué se lo creyó tanta gente?» (p=0,0). El guion
  dice «creyó» y el caption también.

## Fuentes y licencias

- Post falso: captura de la página «José Forever - El Taiger»
  (748.000–756.000 seguidores), documentado por elTOQUE (17-mar-2026)
  y Cuballama. Foto original: Instagram de Antonela Roccuzzo,
  4-dic-2022 (documentada por InfoVeritas, 19-mar-2026).
- Fotos Casa Blanca: dominio público para uso periodístico con
  condiciones EXIF (mostrar tal cual, no manipular). Videos Casa
  Blanca: dominio público.
- SFX: biblioteca del hub (487 sonidos, CC0/dominio público salvo 9
  CC BY 3.0 con atribución registrada). Los 9 usados aquí son CC0 o
  dominio público.

## Entrega

Máster 1080×1920 + ligera 720×1280 en `out/`, con informe QA y
auditoría de audio. SIN `--deliver`: nada se publica; la entrega es
al usuario para su visto bueno.

## Correcciones tras la pre-auditoría (23-nov, 5 FAIL → 0)

1. **«El» faltante en karaoke (a):** Whisper oyó «Tiger,» como un solo
   token y se tragó el «El» de «El Taiger». Split en `captions.ts`:
   «EL» 10,70–10,82 + «TAIGER,» 10,82–11,02 (el /t/ entra a 10,82 s,
   medido por energía). La predicción sigue en espacio Whisper (115).
2. **«hay» 0,41 s antes (g, latente):** Whisper la pegó a «mí» (24,35);
   el silencio medido 24,45–24,76 s y el ataque a −2 dBFS en 24,76 s
   demuestran el onset real. Corregido en predicción y captions. La
   corrección expuso un artefacto del check (c) §3: la ventana del
   original (24,30–24,92) tragaba la cola de «mí» e inflaba la
   duración «esperada» a 0,62 s (FAIL espurio «palabra exprimida»).
   Fix local en `build-audit-inputs.py`: las correcciones acústicas
   se aplican también a la copia de la transcripción original (la
   cruda queda intacta en `vo-transcription-small.json`), así ambas
   ventanas miden el intervalo real de la palabra.
3. **Lead-in 0,02–0,46 s (e):** el check solo trata como lead-in el
   silencio que empieza en ≤0,01 s; el suelo de la grabación supera
   −45 dBFS en los primeros 20 ms. Documentado como hueco de
   prosodia de L1 (0,0–0,53).
4. **Pausa intra-L2 4,99–5,29 s (e):** entre «reacciones.» y «Lo»,
   omitida en la primera medición. Añadida a `prosody-gaps.json`.
5. **Pausa antes de FALSO 32,52–32,77 s (e):** el hueco entre-líneas
   del plan es de ancho cero (segmentos contiguos en 32,45) y el
   silencio caía 0,02 s fuera de tolerancia. Documentada como hueco
   de prosodia de L7 (32,21–32,81, pausa dramática real).
6. **Whoosh sobre «Mira» (i5):** el pico a 13,0 s enterraba el ataque
   (+26 dB). Movido a 12,88 s (0,14 s antes de la palabra, como en
   FB): a 0,17 s del pico el whoosh cae ~17 dB y la mezcla queda
   ~+5 dB sobre la voz.

## Correcciones tras el pre-vuelo visual (23-nov, 1 BLOQUEANTE + 2 menores)

Primera pasada (14 stills): 1 bloqueante, 10 avisos, 3 limpios.
Los 10 avisos son benignos (duplicados pHash entre beats de la misma
imagen base; edge-clipped de la captura a sangre completa y de la
barra de progreso; dead-frame de la tarjeta de pregunta, intencional).

1. **Trío: texto sobre la cara (BLOQUEANTE).** La cascada diagonal del
   YT ponía la tarjeta de Bukele (y 340-680) bajo la marca de agua
   (y 300-400): las letras LIBRETO cruzaban su cara; y la de Bad
   Bunny (y 900-1240) bajo la banda de karaoke (y 1100-1240), que
   tapaba su etiqueta. El FB no tenía este defecto porque usa fila
   horizontal. Corrección: fila como en FB (tarjetas 320x460,
   top 450, x 30/380/730), con los pops de la VO YT (30,35 / 31,07 /
   31,73) y la etiqueta «EL MISMO PATRÓN» en y 1320.
2. **Resaltado «José Forever» (menor).** El zoom al still mostró que
   la «J» de José quedaba fuera del resaltado (el nombre empieza en
   x ~111 de display, no en 124 como se midió). Resaltado 118-404
   → 108-404 (left 108, width 296).
3. **Cierre: sello FALSO tapado por la píldora (menor).** Un fotograma
   de control (f1185, 39,5 s, fuera del manifiesto) mostró que el
   sello en la esquina (y 993-1076) quedaba medio tapado por la
   píldora de fuente (top 1050). Viaje del sello: stampY 245 → 130
   (esquina en y 878-962, libre). Se añadió la escena «Cierre
   pregunta» (f1185) al manifiesto: 15 stills.

**Lupa Gemini — VERIFICADA LEGIBLE (pendiente del manifiesto,
cerrado):** el zoom al still f570 muestra el destello blanco de 4
puntas centrado en la lente (4x, 360 px), sin que la X lo tape.
No hizo falta ajustar el zoom ni inventar nada.

## Cambio de dirección (23-nov ~13:02 hora de La Habana)

Orden del usuario: el reel SÍ lleva música, creada en Google Flow
Music para este proyecto. El brief original («SIN música; tono de
sala obligatorio») queda anulado. El trabajo continúa hasta el
pre-vuelo inclusive; la mezcla final y el render esperan a la cama
de Flow (archivo + identidad verificada) y a la dirección del
cierre nuevo. La mezcla actual (solo tono de sala + SFX) es
intermedia: sirvió para la pre-auditoría y se rehace con la cama.
Al llegar la cama: escanearla con `scan-bed.py`, definirla como
`bed.id` en `timeline.json` y verificar identidad con
`bed_identity.py` antes de mezclar (regla permanente del repo).
