# QA V07 — prueba editorial real, NO render nativo Remotion
Fecha: 2026-10-10/11. Archivo de trabajo verificado en Drive: https://drive.google.com/file/d/1mh55e4R7Vjhg1q7ymoYtZr4n_u51nW3T/view

Producción local FFmpeg + Python usando fuentes descargadas de Drive. Archivo MP4 H264/AAC, **540 × 960**, **30 fps**, **55.000 segundos**, 16,798,297 bytes; 14 fotogramas clave de revisión inspeccionados. El código Remotion de V06 sigue separado y NO se ha renderizado de forma nativa. No tratar esta prueba como máster ni publicarla.

Fuente musical: Weight of Memory (el usuario proporcionó original, duplicado en Drive). La pista se atenuó a 30% en una mezcla instrumental y se usaron fades de entrada 0,4 s y salida 2,5 s; falta medir picos y LUFS del render final. La voz definitiva NO se ha creado. No se fabricaron testimonios.

Planos usados: Aniversario 52 (1s, 4s), satélite NASA (4–10), Muerte en Boca (~119s), monumento foto 2025, Nancy (~253s) y Carlos (~99s) en Boca de Samá monumento, monumento 2025. Las entrevistas están MUY comprimidas: ventanas 16:9; no cropear/estirar a vertical. La cartografía/ubicación es ilustrativa; no recrear ruta armada supuesta.

## Hallazgos QA
- Los títulos verticales son legibles en varias posiciones. El formato en 540 × 960 es correcto para avance ligero.
- Composición todavía demasiado basada en ventanas horizontales + bandas de texto. Para revisión institucional se necesitan transiciones visuales más orgánicas, variación espacial, movimientos en máscara/capa y audio testimonial auténtico.
- El archivo de Aniversario 52 tiene gráficos sobreimpresos y la fuente Muerte en Boca presenta bordes y letras de origen, verificar composición y licencias antes de difusión.
- Nancy (~253s) y Carlos (~99s) están visualmente identificables en sus respectivas escenas. **No usar citas inventadas**.
- La escena 49–55 usa caja identificada como logo oficial PENDIENTE, no recreación institucional.
- La foto documental/monumento está repetida en dos escenas; buscar variantes para reducir repetición en V08.
- Hay que preservar marca de agua solo cuando dispongamos del último frame alfa exacto del logo animado original; sus archivos siguen no identificados.
- Los fragmentos de narración guionizados no están subtitulados porque aún no existe locución. El artefacto es una prueba de ritmo visual y música, no un documental completo.
- Urge revisar los 55 segundos completos, niveles y transiciones; hoja de contacto temporal local confirma muestras, no QA frame a frame.

## Siguiente iteración
1. Arreglar punto de inicio fuente de Muerte en Boca para no llevar título ajeno innecesario. Animar documentos con evidencia trazable.
2. Revisar legalidad/voz Nancy-Carlos y preparar extracción de cita exacta. Incluir sólo tras escuchar íntegro y aprobar significado.
3. Sincronizar recursos desde manifest y disparar UN preview de 1–90 frames con workflows existentes si un disparador seguro está disponible; no usar un máster.
4. Registrar renders, resultados y correcciones en STATE/HANDOFF. Conservar la prueba V07 en scratch; no mover a masters.
