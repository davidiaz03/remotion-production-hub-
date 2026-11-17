# Auditoría densa V1.1 — Reel «Martí-Fidel: leer, pensar»

**Fecha:** 17-nov-2026 (noche) · **Método:** 51 fotogramas, uno por segundo (0–50 s) en `audit-frames/v11-dense/`, revisados visualmente por Alberto. Enfocada en superposición de textos con la información y revisión general.
**Veredicto:** el usuario tenía razón — hay superposiciones reales que la auditoría V1 (17 fotogramas) no detectó. Ninguna es fatal, pero tres son visibles a simple vista y hay que corregirlas. Los datos y las citas siguen siendo correctos; los problemas son de colocación, transiciones y animaciones de números.

## 1. Superposición texto-sobre-cara: «2005» y «FIDEL ADVIRTIÓ:» sobre la frente de Fidel (35–40 s) — MEDIO/ALTO

En s_36, s_38 y s_40, la etiqueta «2005» (recuadro rojo) y el rótulo «FIDEL ADVIRTIÓ:» caen SOBRE la frente y el pelo de Fidel. Es el mismo tipo de error que la V1.1 corrigió con Martí, pero en la escena de Fidel nadie lo movió.
**Fix:** reubicar etiqueta + rótulo fuera de la cara (zona libre: tercio inferior encima de la cita, o esquina superior sobre el fondo oscuro). Verificar en fotograma que la frente queda limpia.

## 2. Fantasma de transición: la cita de Martí sobre la cara de Fidel (~34 s) — MEDIO/ALTO

En s_34, durante el fundido S7→S8, la cita «TRINCHERAS DE IDEAS…» y su atribución «— JOSÉ MARTÍ · NUESTRA AMÉRICA, 1891» aparecen semitransparentes SOBRE la foto de Fidel: las palabras de Martí se leen encima de la cara de Fidel.
**Fix:** que el texto de la cita salga (fade-out) ANTES de que empiece el fundido de la foto; o corte seco entre escenas. El texto de una escena nunca debe verse sobre la imagen de la siguiente.

## 3. Mapa: «ART. 19» y los puntos del Caribe encima de la información (~18–19 s) — MEDIO

En s_19: la etiqueta «ART. 19» + el anillo punteado caen SOBRE el mapa, tapando parte del relleno rojo de Colombia y la zona de Venezuela; el racimo de puntos grises (ausentes) se superpone al punto rojo de Trinidad y Tobago; los puntos amarillos del Caribe se funden en manchas ilegibles («OO»).
**Fix:** sacar la etiqueta «ART. 19» fuera del mapa (llamada lateral o junto al pie de página); separar los puntos del Caribe con dispersión o líneas guía; separar el racimo gris del punto rojo de Trinidad.

## 4. Tarjeta de Browne: parte el micrófono y el karaoke duplica su texto (~24–26 s) — MEDIO

En s_25 la tarjeta de evidencia cubre el centro del micrófono (se ve la cabeza arriba y el pie abajo, el cuerpo tapado) y el karaoke «QUE CAMBIARA SU VOTO.» repite las mismas palabras de la cita que la tarjeta muestra.
**Fix:** achicar/bajar la tarjeta para que el micrófono quede visible, y retrasar la tarjeta hasta después del chunk de karaoke que duplica, o suprimir ese chunk mientras la tarjeta está en pantalla.

## 5. «1891» tres veces a la vez (~28 s) — BAJO

En s_28 coinciden el «1891» gigante, la etiqueta «1891» de la línea de tiempo y el karaoke «1891,». Redundancia, no superposición física.
**Fix:** suprimir el chunk de karaoke «1891,» o la etiqueta de la línea de tiempo mientras el numeral gigante está en pantalla.

## 6. Barras: ceros falsos durante la animación (~5 s) — MEDIO

En s_5 las filas muestran «2024: 0», «2025: 0», «2026: 0» (valores reales: 187, 165, 130). En s_6 la barra 2026 marca «127» a medio contar. Quien pause el video lee datos falsos.
**Fix:** los números aparecen solo con su valor final (sin count-up), o las barras crecen con el valor final ya visible desde el primer fotograma de cada fila. Nunca mostrar 0 para un año con dato.

## 7. Contadores: el número va por detrás de la voz (~8–9 s) — MEDIO

En s_8 la tarjeta marca «55 A FAVOR» mientras el karaoke dice «CIENTO»; en s_9 marca «7 EN CONTRA» mientras el karaoke dice «DIECISIETE». Es la misma contradicción que la V1.1 corrigió en el callback, pero sigue en S3.
**Fix:** números estáticos con pop, sincronizados con el golpe de voz (130 aparece cuando la voz dice «ciento treinta», 17 con «diecisiete», 25 con «veinticinco»).

## 8. Gancho: el remate aparece antes de que la voz lo diga (~2 s) — BAJO

En s_2 ya está en pantalla «35 VOTOS MENOS QUE EN 2025» mientras la voz todavía va por «La ONU…». El giro se adelanta y pierde efecto.
**Fix:** escalonar la pila de subtítulos con los golpes de voz: primero «130 / PAÍSES A FAVOR»; «35 VOTOS MENOS QUE EN 2025» solo cuando la voz llega a «Pero con 35 votos menos».

## 9. Callback: karaoke duplica una palabra del título (~42 s) — BAJO

En s_42 el karaoke dice «EXIGEN» mientras el título muestra «PAÍSES EXIGEN EL FIN DEL BLOQUEO». Duplicación leve, mismo patrón que los títulos corregidos en V1.1.
**Fix (opcional):** suprimir ese chunk o retrasar el título. Aceptable si se deja.

## 10. Fondos: el salón ONU generado se repite en S1, S3 y S9 — MEDIO (en curso)

El mismo fondo generado (Pollinations) aparece en el gancho, los contadores y el callback. El usuario pidió diversidad con material real.
**Fix (en curso):** agente de extracción obteniendo fotogramas reales de UN Web TV de la sesión de votación del 28-oct-2026 (28ª plenaria, A/81/PV.28): plano general del salón, podio/delegados y tablero de votación, un fondo distinto por escena. Al sustituirlos, la etiqueta de contenido IA de Meta podría no aplicar ya a los fondos (sigue aplicando por la voz IA de previsualización y el micrófono generado, si se mantiene).

## Revisado y SIN problemas

- Mapa en s_13/s_15/s_17: títulos, listas y karaoke sin choques; el Pacífico limpio tras quitar Galápagos.
- Cita de Martí s_32/s_33: limpia, logo legible con el scrim.
- Cierre s_44/s_46: «130 / PAÍSES EXIGEN… / MARTÍ-FIDEL: LEER. PENSAR. / GUARDA ESTE DATO» sin choques; sin karaoke en esa zona.
- Logo animado de cierre s_48/s_50: resuelve al logotipo completo.
- Transición S5→S6 s_26: corte intencional a sepia (0,5 s, ya aceptado en QA V1).
- Etiqueta «2015 / 17 · 191»: ambigua pero correcta (191 votos en 2015 y 2017). Sugerencia: aclararla a «MÁXIMO · 191» o «2015–17».

## Estado

- Auditoría completa. Correcciones 1–9 pendientes de aplicar junto con los fondos reales (10) en la V1.2, cuando el agente de extracción entregue los fotogramas.
- Fotogramas densos: `audit-frames/v11-dense/s_0.jpg` … `s_50.jpg`.
