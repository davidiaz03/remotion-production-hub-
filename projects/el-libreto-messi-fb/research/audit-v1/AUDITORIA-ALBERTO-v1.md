# Auditoría rigurosa del máster v1 — el-libreto-messi-fb (por Alberto)

**Fecha:** 23-nov-2026, 13:00–13:10 (hora oficial La Habana).
**Máster auditado:** `out/MASTER-v1.mp4` — SHA-256
`a04fc03408f0ed64e7838ad1f13ef51517ab048355e645fa7e61083d26d6a9a3`,
1080×1920, 30,0 s, −16,5 LUFS, TP −4,7 dBTP.
**Método:** 18 fotogramas revisados a ojo (0,5 / 1 / 3 / 5 / 8 / 10 / 12 /
13,2 / 15 / 17 / 19 / 21 / 22 / 23,4 / 24 / 25,5 / 26 / 27 / 28 / 29,5 s),
lectura completa de `src/MainReel.tsx` y del informe
`research/audit-v1/audio-audit-v1.md` (WARN, 0 FAIL, 34 WARN).
Fotogramas en `~/workspace/.tmp/messi-fb-check/`.

## Veredicto

Técnicamente sólido (0 FAIL, VO íntegra, sin microcortes, sin deriva),
pero con huecos reales de calidad creativa que la v2 debe cerrar. El
usuario ordenó la v2 con música de Flow Music creada para este proyecto,
cierre rediseñado, transiciones mejores, cuidado con la superposición y
**recursos de video reales** (la v1 es 100% imágenes fijas).

## HALLAZGOS

### H1 — CRÍTICO: la v1 no usa ningún recurso de video (orden del usuario)
Todas las escenas son imágenes fijas con zoom/pan (captura del post,
foto de la comparación, foto DT-1261, tarjetas del trío). Se siente
presentación, no video.
**V2:** usar los clips reales del dossier (dominio público, Casa Blanca):
- `casa-blanca-bienvenida-messi-15s.mp4` (15,2 s, 640×360): la escena de
  la Casa Blanca (15,2–19,5 s) pasa a VIDEO con este corte (el momento
  de Messi en la bienvenida). OJO: 640×360 — usar con fondo difuminado,
  no estirar a pantalla completa.
- `casa-blanca-postcard-38s.mp4` (37,3 s, 480×360): reserva; solo si un
  plano concreto aporta (resolución baja).
La foto DT-1261 puede quedar como plano de apoyo dentro de la misma
escena, pero el beat principal es video en movimiento.

### H2 — El outro es aire muerto (audio + visual)
La VO termina a los 25,12 s; de 25,12 a 30 s solo hay tono de sala a
−37…−55 dBFS (casi silencio digital). Son ~5 s, 1/6 del video, sin voz
y sin música.
**V2:** la cama de Flow Music cubre todo el reel y SUBE en el outro
(la voz ya no compite). El cierre visual debe moverse durante esos 5 s
(ver H6).

### H3 — Duplicación sistemática título/karaoke
En cada beat con texto grande, el karaoke repite las mismas palabras a
la vez: título «MESSI NUNCA LO DIJO» (0–2,7 s), contador «62.000
REACCIONES» (2,7–5,6 s), píldora «750.000 SEGUIDORES» (7–10,3 s),
sello «FALSO» (23,15–25,15 s). Se ve en los fotogramas 0,5 / 1 / 3 / 5 /
8 / 24 s.
**V2:** ocultar el karaoke durante los beats en los que un texto grande
YA ES el caption (el patrón ya existe en el beat de la negación,
18,54–19,5 s, donde el karaoke se oculta y funciona bien).

### H4 — El contador muestra «0 REACCIONES» (3 s)
La caja del contador aparece a los 2,7 s pero el conteo empieza a los
3,66 s: un «0» gigante queda ~0,7 s en pantalla. Ver fotograma 3 s.
**V2:** sincronizar la aparición de la caja con el inicio del conteo.

### H5 — La placa tapa la etiqueta «Original» (12,8–13,9 s)
Confirmado en el fotograma 13,2 s: la placa «4-DIC-2022 · INSTAGRAM DE
ANTONELA ROCCUZZO» cubre parcialmente la píldora «Original» de la
imagen fuente (solo se ve su borde inferior).
**V2:** mover la placa (debajo de la imagen, o a la izquierda, fuera de
la zona de la píldora) para que «Original» quede íntegra.

### H6 — El cierre necesita rediseño (orden del usuario)
Problemas del cierre actual (25,15–30 s), ver fotogramas 26 / 28 /
29,5 s:
- **Logo duplicado:** la marca de agua (arriba-izquierda) y el logo
  grande de la end card dicen LIBRETO dos veces en el mismo fotograma.
- **Tercio inferior muerto:** de y~1300 a 1920 no hay nada (solo fondo
  tinta y la barra de progreso). La composición es pesada arriba y
  vacía abajo.
- **Estático:** tras la escala del logo (0,3 s), los últimos ~2 s son
  un fotograma congelado.
- **CTA débil:** solo «COMPARTE», sin motivo ni siguiente paso.
- La pregunta «¿QUIÉN ESCRIBIÓ EL LIBRETO?» sobre el post atenuado
  (26 s) es texto-sobre-texto; legible por la sombra, pero es la
  superposición que el usuario pidió cuidar.
**V2 (dirección, investigada 23-nov):**
- Un solo objetivo en el cierre y una sola acción, con motivo concreto
  (no «COMPARTE» solo). Candidatos: «Síguenos: mañana el siguiente
  desmentido» / «¿Te llegó este post? Cuéntalo en comentarios».
  El motivo manda: «síguenos para X» funciona; «síguenos» solo, no.
- Cerrar el LOOP: el último fotograma debe parecerse al primero
  (misma composición/luz) para que la repetición no se note; la música
  sigue sonando bajo el corte. El cierre no debe anunciar «se acabó».
- La end card ocupa el centro-superior (zona segura: entre y 400–800,
  lejos de los botones de la interfaz), sin duplicar el logo: la marca
  de agua se desvanece cuando entra el logo grande.
- Movimiento continuo hasta el fotograma 900 (pulso sutil en el CTA,
  deriva lenta del fondo; nada congelado más de 1 s).
- Máximo 3 s de cierre señalizado; el veredicto (FALSO) debe respirar
  antes del CTA, no quedar tapado por él.

### H7 — La escena del veredicto se congela (23,27–25,15 s)
Tras caer el sello a los 23,27 s, ~1,9 s de fotograma estático (fondo
papel + sello). Ver fotogramas 23,4 / 24 s.
**V2:** push-in lento sobre el sello + deriva sutil de la textura de
papel; o acortar el beat.

### H8 — Colisión del pop del karaoke (17 s)
En el fotograma 17 s, «MESSI ESTUVO» se lee casi como «MESSIESTUVO»:
la palabra que hace pop (escala 1,3) invade a la anterior. Relacionado
con los 11 WARN de «visualización corta» de la auditoría (pops de
0,06–0,16 s cortados antes de terminar) y los 20 captions cortos
(<0,18 s, palabras funcionales: SE, LA, ES, DE, EL, EN, CON).
**V2:** bajar el pop a ~1,15 y/o reservar espacio entre palabras;
fusionar micro-palabras con el chunk vecino (mínimo 0,18 s de
visualización); sin pop en palabras de <0,18 s.

### H9 — Transiciones: todo cortes duros
5 cortes duros entre 6 escenas, sin ninguna transición. El usuario
pidió mejorar animaciones y transiciones.
**V2:** 2–3 transiciones rápidas (0,15–0,25 s) en los cambios de escena
con más contraste: barrido/zoom-through del post a la comparación
(10,3 s), empuje rápido del trío al veredicto (22,6 s), y una entrada
con movimiento al cierre (25,15 s). Que se sientan, sin alargar el
video ni marear.

### H10 — Bombeo del ducking (audio)
La auditoría marca 12,0 dB de variación de ganancia de la «música»
(tono de sala) dentro de una frase (>6 dB: la cama «respira» con las
sílabas).
**V2:** con cama real, ducking más suave (menos profundidad, ataque y
recuperación más lentos). Verificar en la re-auditoría que el bombeo
baje de 6 dB.

### H11 — Desvío karaoke/máster +0,26 s en «la»
Un desvío puntual (auditoría §g). Re-verificar tras la re-mezcla; si
persiste, corregir ese caption.

## LO QUE ESTÁ BIEN (no tocar)
- Gancho: título palabra a palabra + captura real, funciona.
- Zoom al encabezado + resaltado sobre «José Forever» (corregido en v1,
  verificado en el fotograma 10 s).
- Comparación lado a lado con sello 2022 y círculo de la marca de
  Gemini (fotogramas 12 / 13,2 / 15 s): clara, caras libres.
- Foto de la Casa Blanca entera, sin recorte (condición EXIF).
- Trío Bukele/Musk/Bad Bunny con pops escalonados (fotogramas 21/22 s).
- Negación «PERO NO HABLÓ DE CUBA» con karaoke oculto (19 s): el mejor
  beat del reel; es el patrón a extender (H3).
- VO íntegra, sin microcortes, sin stretch; sonoridad −16,5 LUFS.
- Marca de agua desde el fotograma 0 en todas las escenas.

## PLAN V2
1. Cama Flow Music «El Libreto — Messi Desmentido» (generación nueva
   en curso, navegador; cuenta izquierdodavid528@gmail.com, perfil
   vortexPixel). Al llegar: escanear con `scan-bed.py` (Whisper+VAD,
   FAIL = otra ventana u otra pista), importar con `bed-import.py`,
   registrar `bed.id` en `research/timeline.json` (fuente única) y
   verificar identidad con `bed_identity.py` antes de mezclar
   (regla permanente 23-nov: la cama usada DEBE ser la creada en Flow
   para este proyecto, nunca una vieja de la biblioteca).
2. Aplicar H1–H11 en `src/MainReel.tsx` + `src/LibretoKaraoke.tsx` +
   `research/timeline.json` (SFX + cama).
3. Pipeline P0: `node scripts/reel.mjs el-libreto-messi-fb --tag v2`
   (pre-vuelo visual obligatorio; puertas duras).
4. Entrega: máster + ligera v2 + informe QA + revisión visual a ojo.
   NADA se publica; va al visto bueno del usuario.
