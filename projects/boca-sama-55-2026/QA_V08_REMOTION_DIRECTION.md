# Auditoría y dirección V08 — reel vertical 55 s

## Decisión
La **obra sigue vertical 1080x1920/30 fps**. Cada fuente 16:9 360p se muestra en ventana horizontal (1000x562 sobre canvas vertical) y fondo visual texturado; encuadres conservados. NO estirar horizontal a toda la pantalla vertical. Imagen satelital y foto del monumento ocupan más espacio editorial; son fotografías actuales, no archivo de cámara de 1971.

## Defectos observados en V07 (prueba FFmpeg local)
- Títulos repetidos arriba y abajo, algunos enormes: se suprimió cabecera duplicada y pie de escena. Queda una sola etiqueta contextual roja pequeña más un SOLO titular protagonista, cuando hace falta.
- Estructura rígida parecida a diapositivas: componente `Frame` reutilizable con zoom casi imperceptible, `ImageWindow` con textura/zoom, `MoveIn` por spring para texto, `Entrance` con dos revelados selectivos.
- La ruta roja inventada en mapa anterior podía sugerir ruta de ataque sin evidencia: reemplazada por imagen satelital regional con localización escrita y aclaración de que no sitúa el punto exacto.
- La figura de Nancy estaba mal asignada en V05: vista de `Boca... monumento` ~252 s, Carlos ~82 s.
- Fuente `Muerte en Boca` ~130 s contiene gráficos previos: conservar autenticidad/revisar antes de publicación.
- La foto del monumento se repite en resultados y cierre de memoria: repetición sigue pendiente de sustitución por plano móvil diferente y derecho confirmado. Importa evitar sensación de diapositiva.

## Implementación real GitHub
Archivos `src/Editorial.tsx` y `src/Video.tsx` reemplazados en branch `work/boca-sama-55-2026-research` para V08. Ocho `Sequence` 120+180+210+210+300+270+180+180 = **1650 frames**, 55 s. Audio `Weight of Memory` separado con curvas de volumen y espacio para testimonios. Todos los clips de archivo muteados hasta validación testimonial. La voz final será sustituible. Rótulo `NO PUBLICAR` en código y `CORTE INTERNO` en fotograma.

## Referencia de audio y formato
Música disponible en Drive y manifest con SHA. No se ha generado narración IA y no se han inventado citas. Sincronía fonética subtítulos pendiente de voz oficial. **El código V08 no demuestra render nativo**: los únicos renders audiovisuales ejecutados hasta aquí fueron pruebas locales V07 con FFmpeg/Python, 540x960.

## Verificaciones posteriores obligatorias
1. CI de GitHub sobre SHA actualizado, identificar si falla proyecto u otras pruebas. Comprobar que `OffthreadVideo trimBefore` corresponde a API Remotion 4.0.530. No afirmar render hasta obtener MP4.
2. Preparar sincronización SHA manifest en Drive; `scripts/sync-assets.mjs` exige media: `assets/00_MATERIALES_PARA_EDICION/...`. Music en `assets/`.
3. Vista previa nativa corta, verificar decodificación, proporciones, títulos/seguridad móvil, picos audio y degradación de fuente.
4. Cierre oficial original y watermark de su último fotograma transparente; no sintetizar marca. Textos testimoniales literales tras escucha.
5. Licencias, consentimiento/publicación de testimonios, cifras de víctimas, nombre de autores; aprobación humana antes de master.

## Guion de imagen aprobado para iterar (NO institucional)
0–4 Boca de Samá + fecha; 4–10 región y Banes; 10–17 ataque y 1971; 17–24 balance humano; 24–34 Nancy; 34–43 Carlos; 43–49 memoria; 49–55 cierre original pendiente.
