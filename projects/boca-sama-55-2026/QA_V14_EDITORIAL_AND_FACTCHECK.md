# V14 — auditoría de ritmo, documentación y publicación
Fecha: 2026-10-10/11. NO publicar / no máster.

## Comprobado
- CI V13 aprobada: GitHub Actions 38104349109 (commit c1920e13).
- Medios originales locales: reportaje `Aniversario_52...` 640x360 29.97 fps 131.24 s; `Boca... monumento` 640x360 30fps 375.05s. No agrandar horizontal a vertical de manera indiscriminada.
- Muestreo adicional de 32 posiciones de los reportajes de monumento, aniversario y `Muerte en Boca`, revisado por hoja de contacto. Nueva selección de paisaje y monumento para variar escalas.
- Analizada pista `Weight of Memory`: ~58.5s, picos musicales alrededor de 22.7s, 26.1s, 29s, 34.4s, 40.1s, 45.1s; conviene alinear transiciones y cambios internos con acentos sin imponer un montaje frenético. La pista decodificada tiene picos >1 lineal, mantener atenuación y revisar mezcla final con limitador real.
- V14: Nancy aparece en ventana durante 5s y entra B-roll en tiempo musical ~29s; se cambia orden de dos planos del bloque conmemorativo para evitar reutilizar el mismo detalle del monumento inmediatamente después del testimonio.

## Rigor y atribución
Distinguir animación retrospectiva de imágenes auténticas: la reconstrucción del ataque de 1971 no es filmación de época. El reportaje de 52.º aniversario y el documental de testimonios contienen reutilizaciones y rótulos; atribuciones/derechos por aclarar.
Fuentes públicas consultadas muestran versiones variables de nombres y de balance de heridos. Hasta disponer de registro primario del Memorial, evitar colocar nombres de fallecidos sobre fotos y no tratar versiones periodísticas como corroboración independiente. Cifra provisional 2 fallecidos/4 heridos ya usada en borrador y sujeta a contraste formal. Los nombres Nancy Pavón y Carlos Escalante se apoyan en los rótulos originales de entrevistas.
Testimonios continúan en mute; suprimir cualquier transcripción simulada. Cuando se incorpore audio, verificar integridad semántica de cada cita y permisos. No crear testimonios sintéticos ni presentar locución IA como fuente histórica.

## Bloqueos y QA
- En este acceso no hay herramienta GitHub workflow_dispatch disponible. Los renders tienen que seguir siendo manuales bajo política del repositorio. Preview primer control pendiente 113–175 para probar superposición y música; NO full render ni máster.
- El único preview nativo comprobado continúa siendo V09 0–89 frames. CI no valida composición visual ni sonido sincronizado.
- La marca de agua debe ser el último fotograma alfa exacto de la animación oficial de cierre. No tenemos archivo oficial claramente identificado; no recrear logo.
- Subtítulos sin caja, blancos, sombra tenue, palabra por palabra y duración de 1–2 líneas. Todavía vacíos a falta de voz.
- Propuesta creativa: añadir profundidad visual a escenas de documental, mantener los cortes directos de testimonio, no acumular wipes; evaluar visualmente cada mejora con previews cortos.
