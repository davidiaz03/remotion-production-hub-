# Boca de Samá · Handoff de producción 2026-10-10

**Estado REAL:** existe prototipo TSX v0.3 de 55 s con timeline audiovisual y ventanas 16:9 de archivo, no existe preview renderizado ni máster, no está listo para publicar. PR #7 en borrador. Propuesta voluntaria, NO encargo institucional. Mantener originales intactos.

## Recuperación verificable
- 24 recursos en Drive `assets/00_MATERIALES_PARA_EDICION`: 21 videos, 3 imágenes.
- Ocho MP4 descargados y auditados técnicamente con ffprobe, 16–18 fotogramas de muestreo por archivo. Ver `AUDIOVISUAL_AUDIT_V01.md`.
- Shotlist por segundos y timecodes tentativos en `SHOTLIST_V03.md`.
- Manual de identidad original (2012) hallado y leído: Amplitude Condensed, #ED1C24, negro #000000, gris #77787B.
- Se confirmó que carpeta externa llamada `Logos` está vacía y búsqueda de tres logos originales falló.
- `src/Video.tsx` EDITADO con secuencias de archivo y cierre provisional claramente etiquetado, NO equivalente a composición verificada.
- Las cuatro referencias TSX fueron sustituidas por los nombres originales del material presente en Drive, en `public/00_MATERIALES_PARA_EDICION/`. Se registraron tamaño y SHA-256 medidos de dos MP4 y dos imágenes en `asset-manifest.json`. **Aún no se ha ejecutado la sincronización en runner ni comprobado render**, aunque las rutas ahora concuerdan con `scripts/sync-assets.mjs` (desde `drivePath/assets/`). Verificar que `rclone` con credenciales actuales pueda leer los cuatro assets antes de preview.

## Puntos críticos siguientes
1. Rutas Drive actuales: material en `assets/00_MATERIALES_PARA_EDICION/<filename>` y manifiesto actualizado con las cuatro rutas y SHA exactos. Verificar `rclone` en runner y sincronizar antes de render.
2. No usar sonido de los vídeos hasta comprobar/cortar frases reales, permiso y contextualización; el código actual declara vídeos muteados.
3. Integrar UNA animación original de cierre, usar su frame final alfa como marca de agua, retirar placeholder.
4. Auditar restante metraje, terminar derechos/cotejo nombres. Usar controles de recursos del repo; preview sólo hasta 90 frames y sin concurrencia, no exportar full sin aprobación.
5. Actualizar STATE/HANDOFF con pruebas verificables; nunca declarar completo lo que solo está escrito.

**Fuentes Drive:** https://drive.google.com/drive/folders/12TTLdHbtbvW_sooBfDcTeCjsK4NbD89H
**PR:** https://github.com/davidiaz03/remotion-production-hub-/pull/7


## Checkpoint 2026-10-10 — Corte V05
- Código TSX realmente modificado: `src/Editorial.tsx` contiene componentes de video/foto/entrada, y `src/Video.tsx` contiene ocho escenas con fecha, ruta gráfica, cifras, testimonios y cierre reservado. El diseño NO se ha renderizado/QA todavía. Código no constituye máster.
- `SCRIPT_AND_AUDIO_V05.md` contiene texto de VO provisional, segundos narrativos y mapa de sustitución posterior por voz real del equipo Memorial.
- Nuevo reportaje `Aniversario_52...` añadido a `asset-manifest.json` con SHA256 medido `330ffb8f314e382322d3ace565bd457e774c03cf806302abd6e6a96a13e463eb`.
- Originales permanecen en Drive; el nuevo MP4 facilitado por la directora también quedó allí, conservando copia previa.
- Falta render nativo de este commit, cortes audibles y permisos; no lanzar máster. Las animaciones originales oficiales aún no han sido identificadas entre los 25 archivos listados. Mantener placeholder de logo solo en preview.
- Atención QA: el mapa usa **trayecto gráfico ilustrativo**, NO una ruta comprobada; aunque rotulado, preferible reemplazar por zoom neutro y ubicación regional antes de publicar.
- GitHub Actions code checks se activaron automáticamente por los commits. Consultar estado más reciente, no confundir tests con preview o máster.

## Checkpoint V28 — candidatos de declaraciones completas (2026-10-11)

**Esta sección reemplaza el estado obsoleto de V05 de arriba.** Existen previews parciales nativas hasta V26, identidad gráfica original integrada y cierre parcial V21 auditado. La pieza completa aún no tiene máster ni autorización editorial.

- Gemini transcribió dos clips de 25 s, con errores e incertidumbres explícitas. El productor suministró el texto; su literalidad todavía requiere cotejo auditivo directo. Las antiguas intervenciones V24 cortaban palabras/frases a mitad.
- Se eligieron provisionalmente declaraciones más autónomas: Nancy fuente t50.0–54.8, Carlos fuente t203.8–211.8. Los nuevos WAV incluyen márgenes, archivo Nancy 49.833–55.133 (5.3 s), Carlos 203.633–212.033 (8.4 s), sin recrear voces.
- WAVs V28 cargados y hasheados en Drive; `asset-manifest.json` actualizado; `src/Video.tsx` y `src/Editorial.tsx` usan estos recursos, cambian el video de primer plano y prolongan audio de Carlos sobre planos del entorno. Música atenuada hasta fin de declaración y onda recalculada.
- `src/TestimonyCaptionsV28.ts` registra cuatro frases con tiempos GLOBALES a 30 fps y `verified:false`; no aparecen como subtítulos reales hasta verificar y aprobar. Ver `QA_V28_TRANSCRIPT_CUTS.md` para hipótesis y riesgos.
- La última CI anterior a V28 falló porque el comentario `NO PUBLICAR` desapareció en V27. V28 lo ha restituido; **comprobar la CI actual antes de cualquier preview**. Conector GitHub no dispone de consola Codespaces ni workflow_dispatch nativo.
- El intento de nuevo workflow de Whisper quedó bloqueado por el conector. Existe solo paquete ZIP de respaldo en Drive; no sostener que fue instalado.
- Próximo paso: escucha humana con originales y cotejo textual, una preview manual de la nueva toma al superar CI, revisión de subtítulos/música y locución institucional. No renderizar máster completo sin permiso explícito.
