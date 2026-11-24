# Auditoría propia de Alberto — Reel 156,8M Facebook v2 (MASTER-v2.mp4)

Fecha: 23-nov-2026 ~21:20. Método: 28 fotogramas a 1 fps (hojas en `~/workspace/.tmp/audit156fbv2/`), 3 fotogramas a plena resolución (2 s, 22 s, 26 s), QA + auditoría de audio del pipeline leídas, nivel de música medido por mí, karaoke comparado palabra a palabra contra el guion original (`marketing/research/dossiers/donde-esta-el-bloqueo-156-millones/guion-borrador.md`).

## Veredicto

**NO ENTREGABLE sin corrección.** Un error de texto confirmado por el usuario + un recorte del gancho sin resolver. El resto está bien.

## 1. «llevó» debe ser «llegó» — CONFIRMADO, bloqueante

- El karaoke dice «llevó» (~18 s FB, ~27 s YT). El guion dice «llegó» (6 ocurrencias: líneas 23, 28, 44, 51, 127, 131). El usuario lo confirmó de oído: es «llegó».
- Causa raíz: `src/captions.ts` (ambos proyectos) lleva el comentario «El karaoke sigue lo que DIJO, no el guion: «llevó» (no «llegó»)» — una decisión deliberada de la v1 basada en que el ASR oyó «llevó» en las tres pasadas. El oído del usuario manda sobre el ASR (misma lección del caso Martí-Fidel).
- Agravante: la auditoría del pipeline, check (a), dio PASS «guion<->karaoke 1:1» porque compara el karaoke contra `research/vo/vo-lines.json`, que es la transcripción ASR (también dice «llevó», línea 58), NO contra el guion real. El chequeo es circular: verifica karaoke == ASR, no karaoke == guion.
- Corrección: «llevó» → «llegó» en `src/captions.ts`, `research/vo/vo-lines.json` y `research/timeline.json` de AMBOS proyectos, más los comentarios que codifican el error. Verificar en fotograma que la palabra sale como «llegó».
- Regla permanente: cuando el usuario confirma una palabra de oído, se corrige `vo-lines.json` (la fuente de verdad de la auditoría), no solo el karaoke. Las palabras INCIERTO/DISCREPANCIA del informe de VO se confirman con su oído ANTES de construir el karaoke, nunca se asumen del ASR.

## 2. El gancho sigue recortando texto — bloqueante

- Fotogramas 0–5 s: el recorte izquierdo quedó resuelto, pero la banda del gancho corta a media letra la línea roja del propio gráfico viral («¡Dónde está el bloqueo?») por el borde inferior. Visible en el fotograma a plena resolución de 2 s y en los 5 primeros fotogramas de la hoja 1.
- Corrección: reencuadrar el gancho para que ningún texto quede cortado a medias en ningún fotograma de 0–5 s (contener el gráfico entero o recortar por encima de la línea roja; la tarjeta «¿Dónde está el bloqueo?» ya lleva la pregunta a los ~5 s).

## 3. Nits (opcionales si son baratos)

- ~15 s: al cambio de línea del karaoke, la palabra «CON» aparece sola un instante, despegada de la píldora («EMPRESAS PRIVADAS» / «CON LICENCIAS ESPECIALES.»). Ya estaba en la v1; el fotograma siguiente está limpio.
- ~22 s: transición sello → tarjeta final deja ~1 s de fotograma casi vacío (fondo oscuro, marca de agua y el sello pequeño abajo a la izquierda desvaneciéndose).

## Lo verificado como bueno

- **Música (f) PASS:** cama nueva propia `libreto-156-combustible`, mediana en pausas −23,7 dBFS (objetivo ~−25), bajo la voz −33,0 dBFS; medida propia del outro: media −27,2 dB. Audible.
- **Cierre limpio:** la tarjeta «¿QUIÉN ESCRIBIÓ EL LIBRETO?» sale sobre fondo oscuro liso, sin el gráfico de fondo ni karaoke duplicado (fotogramas 22 s y 26 s a plena resolución). La fuente solo aparece en la pantalla final.
- **Sello «SIN CONTEXTO» limpio** (22 s), sin duplicados.
- **QA técnico: passed** en máster y ligera, 0 fallos, 0 warnings; 825/825 fotogramas, 27,5 s, −15,8 LUFS, TP −4,2.
- **Auditoría de audio: WARN, 0 FAIL** (47 WARN, perfil conocido de captions cortos sin efecto visual).
- Contadores 234,3 → 278,8 → 284 correctos; metraje del buque (DVIDS) con crédito en pantalla; «1 BUQUE AL GOBIERNO · DESDE ENERO» limpio.

## Acción

Reconstrucción única: FB v3 + YT v2 con las correcciones 1 y 2 (y 3–4 si son baratas), re-render solo de tramos afectados, QA + auditoría, verificación en fotogramas.
