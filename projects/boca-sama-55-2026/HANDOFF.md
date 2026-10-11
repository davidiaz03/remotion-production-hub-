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

## CHECKPOINT PARA MAÑANA — V28 render auditado (11 oct 2026 UTC)

**Fuente de verdad actual:** rama `work/boca-sama-55-2026-research`, PR #7 draft, 55 s/1650 frames/1080×1920. Nunca considerar el texto V05 del inicio como estado vigente. Leer `QA_NATIVE_PREVIEW_V28_NANCY.md`, `QA_V28_TRANSCRIPT_CUTS.md` y `STATE.json`. No fusionar, exportar master ni publicar.

- CI V28 **SUCCESS** run `38111579311` commit `706bfe0cfd43eea8c448ae76a786adfff51a1d5e`.
- **PREVIEW NATIVA TERMINADA** run `38111670265`, fotogramas 720–789, 70/70, 1080×1920, video y audio decodificados, 0 intervalos negros inesperados, voz Nancy correcta correlación ~0.995 con nuevo WAV, media -24.2 dBFS, pico -9.4 dBFS. La revisión visual de la hoja de contactos confirma cara, marca de agua y ondas legibles. **Solo están comprobados 2,33 s de los 5,3 s propuestos para Nancy**.
- Respaldo permanente Drive: [video](https://drive.google.com/file/d/19WFrMqJGWwzGIGp2pI9E5rlrjTXo91mX/view), [contactos](https://drive.google.com/file/d/1Blu_-KF8dQrW4kb3-6pzKUjdePXi_e5r/view), [QA JSON](https://drive.google.com/file/d/1BhW-jGP16VMQg3nHhVxdZudS9Ivb7899/view). Artefacto Actions temporal: `11691672427`, caduca en 1 día.
- WAV V28 Nancy y Carlos están hasheados y en Drive. La transcripción de Gemini **NO está ratificada mediante escucha precisa**. `TestimonyCaptionsV28.ts` conserva `verified:false`; por ello NO hay subtítulos activos. La voz de Carlos V28 NO tiene render verificado aún; la voz/narración institucional tampoco existe. Quedan consentimiento/derechos y cotejo histórico.
- Problemas para mañana: revisar el final de la cita Nancy y el corte hacia B-roll, auditar Carlos con nueva intervención completa, ajustar sincronía real de cada palabra, garantizar que la onda no impida subtítulos, preparar locución y luego evaluar los 55s completos. No repetir renders ya realizados por hábito.
- El workflow Whisper opcional NO fue publicado en GitHub debido a bloqueo del conector; ZIP técnico quedó en Drive. No afecta los recursos de producción.
- **Siguiente acción concreta:** inspeccionar nuevas transcripciones o pedir revisión humana auditiva; si necesitamos vista previa útil elegir 852–906 (final de Nancy), NO gastar de nuevo 720–789 salvo cambio de código.

## Checkpoint 2026-10-11 V29 — Hacemos Cuba (nuevos videos)

Tres MP4 nuevos en Drive (WA0006/0007/0008) examinados técnicamente: total ~56 min, 256×144. Se muestrearon 111 fotogramas y guardaron contactos en Drive. Las imágenes muestran a oficiales, armas, tablas de municiones, lanchas y mapas de un incidente de febrero de 2026; ninguna imagen inspeccionada demuestra el ataque de Boca de Samá de 1971. **NO incluir esas imágenes como archivo de 1971** ni afirmar que el audio no contiene referencias sin escucharlo; podría haber citas retrospectivas. Ver `QA_HACEMOS_CUBA_2026.md`.

V29 solamente corrige una animación de rótulo de voz original para que permanezca durante la declaración de Carlos; no modifica otros clips y no ha sido renderizada todavía. Se actualizó `STATE.json`. CI después del último commit por verificar. Mantener el máster bloqueado y subtítulos Gemini con `verified:false`.

Próximo trabajo: confirmar CI; auditar final de Nancy t~28.4-30.2s (global 852-906 frames) y Carlos completo; transcribir/escuchar antes de utilizar audio de Hacemos Cuba. No iniciar otro render sin necesidad.

## V30 actualizado — 11 octubre 2026, edición recuperable

Se auditó nuevamente el metraje de apoyo para Carlos (original t353.5–359); muestra cambios de plano (estudio + costas) que perjudican el clímax de su testimonio. **V30 lo sustituye por fotografía auténtica del monumento de Boca de Samá**, derivada de fuente documental, en frame global 1205, con voz de Carlos prolongada hasta ~1272. Archivo autenticado por SHA y añadido al manifest. Código modificado en `Editorial.tsx` y `Video.tsx`. No render V30 todavía.

`EDITORIAL_V30_STORY_AND_VOICEOVER.md` establece secuencia y guion provisional condensado para locutora del Memorial en 4–24 s, respetando voces de testigos sin encimarlas. Logos oficiales y watermark continúan sin alterarse. Los tres videos de `Hacemos Cuba` son material de 2026, no evidencia de imagen de 1971; la escucha completa de casi 56 minutos todavía queda pendiente.

**Próxima acción**: CI del último commit; preview manual Carlos frames 1195–1265, revisar foto, audio y transición; revisar fin Nancy frames 852–906. Subtítulos Gemini continúan `verified:false`. Máster bloqueado.

## Checkpoint V32 — revisión integral, subtítulos y TTS

- La V30 tiene preview nativa comprobada, run 38141945427, con foto monumento auténtica de época posterior y entrada demasiado lenta. V31 editó esa entrada a 9 fotogramas; CI success 38142369938. **V31/V32 todavía no tienen render visual nativo nuevo**.
- V32 mejora tipografía móvil de captions 46px, saltos por palabra y divide frase larga de Carlos. `src/TestimonyCaptionsV28.ts` continúa TODO `verified:false`; no hay falso subtítulo publicado.
- Microsoft `es-CU-BelkysNeural`/`es-CU-ManuelNeural`: workflow manual Azure listo en rama; **no existe WAV ni credenciales Azure confirmadas**. No activar facturación ni generar con otras apps que cobren créditos sin consentimiento. Incluso si hay workflow, puede no ser visible por GitHub UI sin rama default; NO fusionar rama para arreglarlo sin autorización.
- Revisión editorial en `QA_V32_ALL_FRONTS.md`. Los clips de Hacemos Cuba 2026 no son archivo de 1971. Archivo original, logo Memorial y score conservados.
- Siguiente paso útil: CI V32, único preview V32 Carlos 1195–1265, verifi car final narrativo. Después voz sintética provisional solo si autorizada, transcripciones exactas y subtítulos finalizados y vista previa total. Master NO APROBADO.
