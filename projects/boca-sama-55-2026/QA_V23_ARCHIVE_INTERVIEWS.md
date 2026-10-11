# V23 · Archivo de las entrevistas originales y control de montaje

## Hallazgo
Dos entrevistas independientes existentes en la carpeta original de Drive, no incorporadas hasta la V22:
- Nancy Pavón, video 216.247s, 428x240, 25 fps, 10,881,073 bytes, SHA256 7921813ba41b121f5c50482912b20166492af2c7e8b3f96d1eda0ccb7c260dc1.
- Carlos Escalante, video 491.404s, 428x240, 25 fps, 18,993,573 bytes, SHA256 0cb774f97cf910a17e388ee14124252ae9e64ddf0d241588e1a78e6b8508dfdc.
Ambos se inspeccionaron en 17 y 20 muestras cronológicas, respectivamente, con hojas de contacto. Son entrevistas de archivo posteriores al ataque, NO imágenes de cámara de 1971 ni recreaciones. Los originales no se modificaron.

## V23 implementada
Se registraron en el manifest de recursos con SHA medido, y en el diccionario de assets. Cada bloque testimonial ahora alterna primer plano de la entrevista independiente por 76 frames, otro fragmento del documental de monumento hasta el final de la mitad testimonial y por último B-roll auténtico del entorno. Nancy: original t60s, documental t255s, B-roll t324.6s; Carlos: original t210s, documental t89s, B-roll t354.7s. Ambos clips antiguos son 428x240 y **se muestran en ventana horizontal 16:9, no pantalla completa**; su interpolación vertical requiere QA. El audio en TSX sigue muteado.

## Riesgos que deben auditarse
- La discontinuidad entre distintas épocas de entrevista puede resultar brusca. Etiquetar temporalmente los fragmentos cuando la fuente permita corroborar la fecha de grabación. No inventar el año exacto.
- No sincronizar audio/visemas de clips diferentes sin cita auténtica seleccionada. Las fuentes de 25fps se interpretan por Remotion a 30fps de composición.
- Los clips cortos no prueban permiso, ni contienen transcripciones exactas. El entorno no dispone de motor de ASR verificado; se extrajeron WAV para escucha editorial y NO se han transcrito artificialmente.
- Subtítulos `CaptionTrack` siguen desactivados hasta voz aprobada. Sigue sin existir máster ni corte V23 completo renderizado.

## Recomendación de producción
Tras CI, hacer una sola preview de **frames 720–795**, primera aparición de Nancy y cambio a su otra entrevista en frame 796. Para inspeccionar esa transición en una sola prueba más eficiente usar **755–824** (70 frames). Evitar renders repetitivos de cierre ya aprobado. Confirmar contexto de citas y publicar solo con permiso y aprobación del equipo.
