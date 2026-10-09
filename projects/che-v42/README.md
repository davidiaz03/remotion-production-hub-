# Remotion V42 — caso de compatibilidad (NO editar editorialmente)

Importado desde los siete archivos fuente/manifest/código V42 de Google Drive; el repositorio histórico en GitHub **NO** se ha alterado.

- Total: 2418 frames, 30 fps, 1080x1920, composición `CheOctober1967V42`.
- 28 clips, WAV final, subtítulos incrustados por código (73 elementos de texto) y marca de agua.
- Se detectó `international.mp4` original de **57 fotogramas** para un segmento que requiere 58; el paquete corrector local añade el frame 58.
- Se ha preparado transparencia institucional a partir del fotograma final del logo rojo y blanco. Mantener aprobación humana antes de publicación.
- Código de V42 compuesto de clips limpios: no debe confundirse con una edición granular de sus fotos y efectos originales.

El ZIP corrector `V42_PATCH_58FRAMES_LOGO.zip` debe estar en la misma carpeta de Drive que los seis paquetes V42, sin sustituirlos.
Hasta entonces, el modo `assets:sync` fallará de forma deliberada. No se permiten renders V42 con el fallo de 57 frames.

Para compatibilidad estática: `node scripts/validate.mjs --project che-v42`.
Con archivos descargados: `node scripts/verify-assets.mjs --project che-v42`.
Cuando la infraestructura esté activada, usar **quick**, `frames=1874-1931`; jamás master sin autorización.
