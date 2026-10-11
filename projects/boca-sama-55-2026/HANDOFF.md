# Boca de Samá · Handoff de producción 2026-10-10

**Estado REAL:** existe prototipo TSX v0.3 de 55 s con timeline audiovisual y ventanas 16:9 de archivo, no existe preview renderizado ni máster, no está listo para publicar. PR #7 en borrador. Propuesta voluntaria, NO encargo institucional. Mantener originales intactos.

## Recuperación verificable
- 24 recursos en Drive `assets/00_MATERIALES_PARA_EDICION`: 21 videos, 3 imágenes.
- Ocho MP4 descargados y auditados técnicamente con ffprobe, 16–18 fotogramas de muestreo por archivo. Ver `AUDIOVISUAL_AUDIT_V01.md`.
- Shotlist por segundos y timecodes tentativos en `SHOTLIST_V03.md`.
- Manual de identidad original (2012) hallado y leído: Amplitude Condensed, #ED1C24, negro #000000, gris #77787B.
- Se confirmó que carpeta externa llamada `Logos` está vacía y búsqueda de tres logos originales falló.
- `src/Video.tsx` EDITADO con secuencias de archivo y cierre provisional claramente etiquetado, NO equivalente a composición verificada.
- Las rutas TSX `public/assets/boca-monumento.mp4`, `nasa-costa.jpg`, `muerte-en-boca.mp4`, `monumento-2025.jpg` son nombres de derivados planificados, **NO archivos existentes en el repositorio o synced al runner**. No disparar Actions preview todavía: fallará al cargar estos recursos.

## Puntos críticos siguientes
1. Rutas Drive actuales: material en `assets/00_MATERIALES_PARA_EDICION/<filename>`. `scripts/sync-assets.mjs` actualmente presupone `assets/<e.path>`, por lo que hay que adaptar manifest a rutas relativas comprobadas o copiar SIN ALTERAR ORIGINALES derivados nominados a `assets/` y actualizar hashes.
2. No usar sonido de los vídeos hasta comprobar/cortar frases reales, permiso y contextualización; el código actual declara vídeos muteados.
3. Integrar UNA animación original de cierre, usar su frame final alfa como marca de agua, retirar placeholder.
4. Auditar restante metraje, terminar derechos/cotejo nombres. Usar controles de recursos del repo; preview sólo hasta 90 frames y sin concurrencia, no exportar full sin aprobación.
5. Actualizar STATE/HANDOFF con pruebas verificables; nunca declarar completo lo que solo está escrito.

**Fuentes Drive:** https://drive.google.com/drive/folders/12TTLdHbtbvW_sooBfDcTeCjsK4NbD89H
**PR:** https://github.com/davidiaz03/remotion-production-hub-/pull/7
