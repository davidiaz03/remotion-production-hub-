# Dirección creativa — El Libreto: Messi nunca dijo esto sobre Cuba (Facebook)

**Proyecto:** `el-libreto-messi-fb` · **Rama:** `work/preprod-2026-11-21`
**Formato:** Reel Facebook, 30 s, 1080×1920, 30 fps, 900 fotogramas.
**Fecha:** 23-nov-2026. **Estado:** en producción (v1).

## Encargo
Primer video producido de El Libreto (marca personal sin rostro del
usuario: «Geopolítica con las fuentes delante»). Segundo video del Día 1
en Facebook; primero en producirse porque su voz llegó aprobada.
Desmentido P1, formato 3 de la marca. Objetivo: demostrar con el
documento en pantalla que Messi nunca dijo nada sobre Cuba — el post
viral es falso. NO publicar: la entrega va al usuario para visto bueno.

## Hechos verificados (dossier R31)
Dossier: `~/workspace/marketing/research/dossiers/messi-desmentido-p1/`
- Post falso del 16-mar-2026, página «José Forever - El Taiger»
  (creada 10-nov-2024, La Habana; 748.000–756.000 seguidores):
  62.000+ reacciones, 3.300 compartidos, ~5.400 comentarios
  (elTOQUE, 17-mar-2026). Veredicto: FALSO.
- La foto es de diciembre de 2022, sin bandera (Instagram de Antonela
  Roccuzzo, 4-dic-2022); la bandera se añadió después; lleva marca de
  agua de Gemini (InfoVeritas, 19-mar-2026).
- Núcleo real: el 5-mar-2026 Trump recibió al Inter Miami en la Casa
  Blanca; Messi estuvo y no habló de Cuba (foto oficial DT-1261).
- Patrón documentado (5+ casos): la misma página fabricó citas de
  Bukele, Musk, Daddy Yankee, Bad Bunny, Bebeshito.

## Guion y voz (66 palabras, 7 líneas)
Guion aprobado 23-nov 09:57 (`guion-borrador.md`, versión Facebook).
Voz del usuario, grabada en el celular, auditada y APROBADA
(`vo/VO_AUDIT_FB.md`). Toma limpia `vo-fb-limpia-clean.wav` (27,5 s,
−18,8 LUFS, TP −2,0, SNR 41,1 dB; preset clean: el preset phone
recortaba 2 pausas). Tiempos medidos con faster-whisper small +
onsets acústicos a −50 dB (9 correcciones, máx. 0,18 s — Whisper pone
«Messi» a 0,00 s; el onset real es 0,18 s).
CORRECCIÓN a VO_AUDIT_FB.md: la «pausa de 1,16 s tras FALSO» era
silencio de COLA tras «libreto?» (25,12–26,30 s); la pausa real entre
FALSO y «¿Quién» es de 0,48 s y NO se toca. La edición solo recorta
la cola (la toma termina en 25,70 s + pad hasta 30 s).

## Escaleta (tiempos reales de la VO)
| Escena | Tiempo | Contenido |
|---|---|---|
| 1 Gancho | 0–2,7 s | Captura del post (recortada: encabezado + texto), punch-in, título «MESSI NUNCA LO DIJO» palabra a palabra, píldora «DESMENTIDO #1» |
| 2 El dato | 2,7–5,6 s | Contador animado 0→62.000 (aterriza a 4,94 s), fuente elTOQUE |
| 3 La página | 5,6–10,3 s | Zoom al encabezado, resaltado amarillo en «José Forever» (8,7 s), píldora «750.000 SEGUIDORES» (7,0 s), aclaración sobre El Taiger (9,6 s) |
| 4 La comparación | 10,3–15,2 s | Corte duro; mitades que entran de lados opuestos; sello «2022» (12,4 s); placa con la fuente; punch-in a la bandera + círculo rojo (13,9–14,4 s); píldora «Marca de agua de Gemini» (14,5 s) |
| 5 Núcleo real | 15,2–19,5 s | Foto DT-1261 ENTERA con fondo difuminado, zoom lento 100→108%; negación: foto oscurecida + «PERO NO HABLÓ DE CUBA» (18,54 s) |
| 6 El trío | 19,5–22,6 s | Tres mini-capturas que aparecen una a una (Bukele 20,18; Musk 21,12; Bad Bunny 21,94) |
| 7 Veredicto | 22,6–25,15 s | Pausa dramática; sello «FALSO» a pantalla completa sobre papel (23,15 s) |
| 8 Cierre | 25,15–30 s | La captura vuelve atenuada; mini-sello en la esquina; «¿QUIÉN ESCRIBIÓ EL LIBRETO?»; fuente; end card con logo + «COMPARTE» (27,5 s) |

## Decisiones de composición (con motivo)
- **Captura recortada en gancho y cierre:** las caras de la foto
  (medidas con YuNet) quedarían en y 1110–1239, justo sobre la banda
  de karaoke (1100–1240). Solo se muestra encabezado + texto; la foto
  completa se ve en la comparación. Regla permanente: nada sobre caras.
- **Foto Casa Blanca entera:** condiciones EXIF (publicación
  periodística permitida; NO manipular). Fondo difuminado detrás,
  nunca recorte dentro de la foto. El zoom 100→108% es escala, no
  recorte (plan del manifiesto).
- **Negación en y 950–1120 + karaoke oculto 18,54–19,5 s:** la foto
  tiene caras de fondo hasta y 866; el texto grande ES el caption en
  ese beat (no duplicarlo).
- **Karaoke estilo El Libreto (componente propio `LibretoKaraoke`, NO
  el BottomKaraoke del Memorial):** Noto Sans Bold, Papel #F5F1E8
  sobre banda Tinta semitransparente, keyword con fondo Resaltador
  #FFD60A, «FALSO.» con fondo Lápiz rojo #C0392B. Banda y 1100–1240
  (encima de la zona de UI inferior de Facebook, y≥1248).
- **Marca de agua:** lockup icono + wordmark, arriba-izquierda
  x=65, y=300, 100 px de alto, desde el fotograma 0 (Variante A,
  aprobada por el usuario 23-nov 11:10).
- **Barra de progreso** Resaltador de 5 px en el borde inferior.
- **Zonas seguras Meta:** texto dentro de x 65–1015, y 269–1248.
- **Tipografía:** Noto Sans Bold (karaoke, títulos, píldoras) y Noto
  Serif Display Black (sellos, pregunta de marca). Ambas instaladas
  en el sistema (verificado con fc-match).

## Sonido (SIN música)
Voz 100% + tono de sala obligatorio + 6 SFX (techo del formato):
sub-drop en el gancho (0 s), number-land al aterrizar el contador
(4,94 s), whoosh en el corte a la comparación (10,3 s), lápiz en el
círculo (13,9 s), riser en la pausa dramática (llega 22,4 s, corte
en seco), sello de goma en el veredicto. El sello golpea a 23,21 s
(60 ms DESPUÉS del onset de «FALSO» a 23,15 s): a 0 dB sobre el
ataque de la palabra daría máscara +31,9 dB (FAIL del check i5);
60 ms de offset A/V es imperceptible. Mezcla: −16 LUFS, ducking
0,08/5/250 ms, tono de sala ~23 dB bajo la VO. Detalle y mediciones
en `research/timeline.json`.

## Recursos (todos verificados, en public/)
- `img/post-messi-cuba-falso.jpg` (670×621): captura del post falso.
- `img/messi-foto-98c58e7b73.jpg` (1113×713): comparación
  manipulado/original (elTOQUE).
- `img/casa-blanca-dt1261-messi-camiseta-47.jpg` (1920×1280): foto
  oficial Casa Blanca, 5-mar-2026 (DT-1261; DT-1413 descartada).
- `img/post-bukele-1.jpg`, `img/post-musk.jpg`,
  `img/post-bad-bunny.jpg`: mini-capturas del patrón (baja
  resolución: solo mini-captura, nunca a pantalla completa).
- `img/watermark-lockup-libreto.png` (898×200): lockup de marca.
- `audio/real/vo-fb-limpia-clean.wav`: VO limpia aprobada.
- `audio/sfx/`: 6 SFX de la biblioteca (487 sonidos).
- `audio/amb-room-tone.wav`: tono de sala (biblioteca).
- La portada vertical de Gemini es la portada de la parrilla, NO el
  fotograma 0 (no se usa en el reel).

## Pipeline
Orquestador P0 (`scripts/reel.mjs el-libreto-messi-fb --tag v1`):
audio → mix → audit-inputs → pre-audit → preflight → render →
master → qa → ghost → audit. `videoOnly: true` (todo el audio está
en mix.wav). Pre-auditoría obligatoria antes de renderizar.
Pre-vuelo: 12 fotogramas fijos (`preflight-scenes.json`).

## Auditoría autónoma
- Audio: pendiente (pre-auditoría antes del render).
- Visual: pendiente (pre-vuelo con los 12 stills).
- Veredicto final: pendiente.

## Aprendizajes reutilizables
- La predicción de auditoría de una VO de toma única debe llevar los
  onsets CORREGIDOS (no los crudos de Whisper): si no, fix_snaps no
  endereza el snap de la primera palabra y el check (g) hace FAIL
  por +0,18 s sin contraste acústico disponible (el tono de sala del
  celular está por encima de −50 dB).
- Medir las caras con YuNet ANTES de fijar el layout: la captura del
  post parecía «segura» a ojo y las caras caían justo sobre el
  karaoke. El recorte vertical lo resolvió sin tocar el mensaje.
