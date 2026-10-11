# Boca de Samá — V37: resultado ASR recuperado y control editorial
**BORRADOR · NO PUBLICAR — 11 octubre de 2026**

## Whisper EXISTE: resultado real previamente omitido
- GitHub run **38145606270**, SUCCESS, job 114488170680.
- Artifact **11704224976**, ZIP descargado y examinado en la sesión del 11/10. Caduca el 12/10. Contiene README y `nancy-UNVERIFIED-remotion-caption.json` (16.121 bytes).
- Modelo Whisper.cpp **base** español, **57 unidades de captions** sobre la ventana contextual de Nancy, 15 dentro del corte seleccionado, y 42 fuera.
- Especificación fuente: SHA256 de MP4 original `7921813ba41b121f5c50482912b20166492af2c7e8b3f96d1eda0ccb7c260dc1`.
- Resultado automático del corte (t 24.227–29.167 del reel): **«se ofro mucho todavía por eso, porque nunca he tenido felicidad.»**. **NO COPIAR COMO CITA:** `se ofro` es una fragmentación/hallazgo defectuoso en el principio, susceptible de corresponder a «Sufro» pero no debe corregirse sin escucha rigurosa; el borrador Gemini proponía «Sufro mucho todavía por eso. Porque nunca he tenido felicidad.»
- Riesgo técnico corregido en V36: esa ejecución V35 empezó en fuente t50.000, mientras el segmento usado empieza t49.833. La ventana ASR V36 se amplió a t47–72 para incluir el inicio y mantener 25 segundos. Nuevo resultado aún pendiente.
- Se revisó el contenido del ZIP localmente y se conserva copia en el espacio de trabajo de la conversación. Su intento de transferencia con Google Drive upload connector no fue confirmado; **NO afirmar copia en Drive**.

## Nueva ejecución V37
- Workflow `.github/workflows/boca-sama-v37-recovery.yml` lanzado por push SHA `b1bbbd9935f0573e9a6a65a1794bc5b683035273`; run **38152344025**, identificado en estado in_progress inicialmente.
- Orden: instalar herramientas; verificar Drive; intentar DESCARGAR *el mismo WAV existente* desde URL de código y guardar su SHA en Drive sin regenerar; ejecutar Whisper Nancy base; artifact UNVERIFIED.
- El respaldo de la voz es best-effort (paso continue-on-error), de modo que un resultado SUCCESS del workflow **no significa** automáticamente que WAV fue respaldado. Hay que leer logs de paso y cotejar archivo en Drive con SHA.
- Al redactar esta nota ningún WAV V34 aparecía todavía en la carpeta `assets/`. No añadirlo al manifest ni cambiar fuente en TSX hasta comprobar bytes.
- Los clips originales, WAV auténticos, storyboard, música y logo oficial continúan en Drive.
  
## Auditoría audiovisual real en entorno local
- Extraídos desde Drive: V34 preview 70 fotogramas, V32 Carlos→monumento 71 fotogramas, prueba editorial V07 1650 fotogramas en 540×960, y logo original 6s/720×1280/24fps.
- FFprobe confirma V07 55s 1650 fotogramas pero es **maqueta FFmpeg/Python anticuada**, NO exportación actual de Remotion ni máster.
- V34: 70 fotogramas 1080×1920; EBU R128 medido directamente: -15.0 LUFS y true peak -3.9 dBFS SOLO en 2.33 s; no extrapolar a reel completo.
- Visual V34: mapa satelital conservador con fotografía regional, pie informativo y branding; zona inferior de escena subaprovechada. Evitar rutas falsas y overlays que compitan con captions.
- V32 Carlos conserva entrada breve del monumento. Logo de cierre es fuente original, no redibujo.

## Bloqueos de entrega
1. Descarga/almacenamiento reproducible WAV V34 (o locución institucional auténtica recibida y verificada).
2. Segundo ASR y cotejo con oídos para Nancy y Carlos; corrección exacta de inicio Nancy.
3. Subtítulos sin fondo, verificación de cifras/nombres/permisos/autoría.
4. QA de 1650 fotogramas y audio integrado + review del cierre 49–55s; máster NO aprobado.
5. Workflow de render Quick permite 1–90 fotogramas por run. No intentar presentar fragmento como máster.

Permanecen `verified:false` todas las líneas y el PR #7 es draft.
