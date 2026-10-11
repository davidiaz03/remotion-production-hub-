# Auditoría audiovisual inicial verificada — Boca de Samá
**10 octubre 2026 | investigación visual, NO versión de difusión.** PR #7, rama work/boca-sama-55-2026-research.

## Alcance y método real
La carpeta Drive `00_MATERIALES_PARA_EDICION` contiene **24 archivos** (contados mediante list_folder): 21 MP4 y 3 imágenes. En esta pasada se descargaron y analizaron técnicamente **8 MP4**, 3 imágenes, con ffprobe y hojas de contacto tomadas del metraje original (16 o 18 muestras por fuente). No equivale a visión exhaustiva frame por frame ni a transcripción íntegra de diálogos. Las cifras son datos de ffprobe, no estimaciones deducidas del sufijo "(360p)". Las transcripciones literales, condiciones legales y decisiones de audio permanecen **pendientes**. Originales en Drive intactos.

| Fuente | Duración | Vídeo real | Hallazgos de visionado visual |
|---|---:|---|---|
| Entrevista Nancy Pavón (ICAP/Cubainformación) | 216.25 s | **428×240, 25 fps** | Cartela: coloquio Holguín noviembre de **2011**, desde ~24 s entrevista continua a Nancy, plano de pecho en exterior; poco b-roll. |
| Entrevista Carlos Escalante (ICAP/Cubainformación) | 491.40 s | **428×240, 25 fps** | ~45–480 s conversación en jardín, alterna plano de Carlos, dos personas y entrevistadora. Apertura de multitud (~0–35 s) no es el ataque de 1971. |
| Boca de Samá, monumento contra el terrorismo en Cuba | 375.05 s | **640×360, 30 fps** | Carlos con mar y costa ~75–230 s, rótulo con nombre ~80 s; Nancy en interior ~235–298 s, rótulo visible ~246 s; detalle del monumento y testimonio ~305–340 s. **Fuente audiovisual más sólida visualmente para montaje variado.** |
| Boca de Samá no olvida (documental) | 966.88 s | **640×360, 30 fps** | Ubicación/placa introductoria 0–60 s; mapas gráficos y rutas ~70–120 s; otras entrevistas, costa ~380–410 s; fotografías examinadas en escena ~680–720 s. La cartografía animada ajena se estudiará, no se copiará. |
| Muerte en Boca | 331.84 s | **640×360, 25 fps** | Vida cotidiana actual 0–40 s; casa y testimonios ~45–80 s; costa ~85–110 s; foto archivada ~130–145 s; monumento/placa ~207–225 s; recortes de archivo ~250–270 s. |
| Recuerdos de Samá | 337.80 s | **640×360, 25 fps** | Testimonio hombre con sombrero en interior ~30–140 s; revisión de fotos ~145–250 s; continúa entrevista ~260–310 s. |
| Reel institucional, mujer dentro del Memorial (AQO72...) | **97.30 s** | **360×640, 30 fps** | Presentadora, varios puntos del museo, cambios de escala, tipografía roja de gran jerarquía, subtítulos blancos, documentos reales de exhibición, cierre con logo (NO archivo original aislado). |
| Reel institucional, dos presentadoras en exterior (AQO7z...) | **72.50 s** | **360×640, 24 fps** | Alterna diálogo a dos, individuales y plano abierto; collage de documentos, acentos tipográficos rojos, subtítulos blancos; aparece discusión sobre «amenaza». Por contexto corresponde probablemente a «Cuba y la amenaza», **falta confirmar mediante URL del post**. |

**Nota sobre viralidad:** no tenemos reproducciones, impresiones, watch-time, retención ni datos de distribución. El recurso que más puede transferirse es la sucesión deliberada de informantes, cambios de escala visual y rótulos que aclaran el contenido sin audio. No se puede concluir causalmente que esas técnicas originaron viralidad. Los reels contienen 24/30 fps; cualquier interpolación a 30 fps debe verificar artefactos.

## Imagen, tratamiento ético y derechos
- Entrevistas 428×240: presentar en ventana horizontal de archivo (sin estirar al 9:16); se puede envolver con fondo de color/textura derivada del MISMO plano, márgenes, fechas y rótulos; nunca inventar detalle mediante «upscale» agresivo.
- Material 640×360: crop vertical solo cuando el sujeto permanezca dentro; preferir ventana de archivo 16:9 y mapa/documento/espacio negativo cuando se pierda información.
- `Boca de Samá no olvida` y documentales: agua de marca ajena y derechos de audio/imagen **no liberados** para un reel institucional. Análisis/preview privado de trabajo únicamente; no presuponer que al cortar 3 s desaparecen los derechos.
- La foto 2025 del monumento (`Ataque_boca_de_sama_002.jpg`) es un recurso posterior al ataque, **CC BY-SA 4.0** según su ficha Wikimedia: crédito, enlace y condiciones derivadas por revisar. NASA/ISS imagen actual del litoral; no es documentación directa de 1971. Mapa de Banes indica municipio, **no sitúa con exactitud Boca de Samá**.
- Nombres de fallecidos y hermana de Nancy, y atribución operacional del ataque, pendientes de cotejo con inscripción / registro primario. No generar reconstrucción fotográfica de 1971.
- Todavía no se han encontrado las tres animaciones oficiales originales del logo. La carpeta Drive llamada `Logos` examinada devolvió 0 archivos; las búsquedas por nombre no hallaron el trío. **No extraer logo de reels ni redibujarlo para sustituir el master oficial**.

## Referentes / lecciones
En los reels revisados hay: subtítulos sin cajas, titular rojo de impacto, situar locutor en exterior/museo antes de B-roll histórico, cambios de perspectiva físicos y música secundaria. Para Boca de Samá: adoptar *claridad de información y variación audiovisual*, no imitar entrevistas ficticias con presentadoras.
Remotion: `Sequence` + `interpolate` para ritmo audiovisual de fuente real; J/L-cuts solo cuando se haya confirmado frase y sus puntos de corte. No encadenar wipes prediseñados en todos los cortes. `@remotion/transitions` puede usarse puntualmente para cartografía/archivo, pero la intención editorial manda.

## Próxima auditoría verificable
1. Auditar las 13 fuentes audiovisuales restantes, en especial tutoriales/otros reportajes; registrar hashes, duración, resolución y mejores cortes reales.
2. Transcribir / escuchar completos los tramos de voz seleccionados de Carlos (fuente costa 75–230) y Nancy (fuente interior 235–298) y revisar exactitud y permiso.
3. Conseguir originales 3 logos y autorización tipográfica/uso de marca.
4. Preparar composición editable, *preview interno* de 1–90 fotogramas máximo en Actions y verificar resultados antes de afirmar render realizado.
