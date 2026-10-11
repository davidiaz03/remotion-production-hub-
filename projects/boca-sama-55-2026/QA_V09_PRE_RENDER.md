# Auditoría adversarial y controles prerender — V09

## Conclusión editorial
El contenedor vertical 1080×1920 es correcto, pero usar **ocho ventanas horizontales idénticas** provocaba fatiga y redundancia. El archivo 640×360 debe conservar proporciones 16:9; las fotografías documentales pueden ocupar más superficie. La fuerza procede de alternar escalas y tipos de evidencia, no de efectos arbitrarios.

## Defectos V08 y solución implementada
1. **Mismo título arriba/abajo**: eliminado. V09 usa un solo titular central por segmento, con una pequeña etiqueta que añade información, nunca lo duplica.
2. **Monotonía de plantillas**: apertura documental, contexto satelital, documento fotográfico, retratos y balance humano, dos testimonios, conmemoración; mezclamos tratamiento de imagen a pantalla amplia con entrevistas en marco 16:9.
3. **Foto del monumento repetida**: imagen de 2025 retirada de la escaleta V09; plano documental de conmemoración de la fuente del aniversario, distinto del material usado en las cifras.
4. **Rutas cartográficas falsas**: no hay trayectoria reconstruida del ataque; la ubicación regional se explica con imagen aérea y texto cautelar.
5. **Sensacionalismo**: música atmosférica elegida, sin SFX de disparos ni explosiones inventadas.
6. **Registro de víctimas**: se presentan las cifras usadas por las fuentes cubanas de trabajo, pero nombres/citas y atribución se reservan para verificación final.
7. **Tipografía**: manual Memorial 2012 especifica Amplitude Condensed y Amplitude; archivo original comercial no disponible/licenciado en el runner, CSS usa fallback Arial Narrow/Arial **sólo temporal**.
8. **Marca**: manual indica identificador blanco sobre área roja en aplicaciones sobre imágenes (o negro monocromático), con protección. Las tres animaciones originales no fueron localizadas en carpeta Drive revisada. No se recrea logo, no se genera watermark imaginaria. El proyecto no está listo para publicar.

## Subtítulos — componente real
`CaptionTrack` añadido en `src/Editorial.tsx`. Cada caption `{from,to,words,verified}` se muestra SOLO cuando `verified=true`; posiciones arriba de la UI inferior de Instagram, tamaño 50 px, 2 líneas sugeridas, sin caja, sombra/contorno discretos. En V09 la lista está vacía **adrede**: no hay voz final ni frases literales verificadas, por tanto NO se promete sincronía falsamente.
Requisitos de admisión: texto transcrito palabra por palabra; tiempo de inicio y salida auditado a fotograma; 1–2 líneas, no invadir caras/rótulos; no poner “subtítulo” de guion ficticio sobre labios de un testigo.

## Archivos reales derivados
Tres PNGs extraídos con ffmpeg del archivo original `Aniversario_52_del_criminal_atentado_al_poblado_Boca_de_Samá(360p).mp4`, en t=13,30 s, 21,30 s y 31,00 s; almacenados en Drive `assets/`; metadatos exactos en manifest SHA256. NO son fotografías tomadas de cámara de 1971: son **reproducciones de fotogramas de documental**. Derechos/autoría de fotografías subyacentes siguen por identificar.

## Revisión funcional
- Proyecto fijo: 1650 fotogramas / 30 fps / 1080x1920; 8 escenas 120+180+210+210+300+270+180+180=1650.
- Música `Weight of Memory` de Flow, amplitud atenuada por curva. Testimonios origen muteados mientras no se evalúe la integridad semántica del audio.
- Mantener text overlay `BORRADOR · NO PUBLICAR`; logo final como placeholder rotulado.
- Verificar transiciones activas frame a frame: el primer frame de cada secuencia revela imagen gradualmente, sin fade del fotograma anterior; no presumir match cut sin comprobarlo.
- PR #7 en borrador. CI de GitHub verifica pruebas del repositorio, **no compila ni renderiza TSX**; un estado CI verde no es un render validado.
- Un primer render nativo sólo puede salir del workflow manual `01 - Remotion quick preview`; conector GitHub disponible aquí **no presenta acción workflow_dispatch**, y el contenedor carece de node_modules/Remotion y de red para instalarlos. No activar render indirecto ni eludir la restricción manual del repositorio. Elegir preview 0–89 frames en Actions desde su interfaz móvil y auditar artifact. NO render full/master sin aprobación.

## Riesgos abiertos
La exposición de solo 30 fotogramas de cada escena no valida labios ni frases. Plan siguiente: preview nativa, corrección de fuentes temporales, confrontación de nombre de víctimas, localizar logos, escuchar testigos y añadir títulos reales y subs adaptados a voz definitiva.
