# V11 — Corrección de continuidad visual y mezcla
**Estado:** código guardado, NO existe todavía render nativo V11. La prueba anterior de Remotion cubrió solo 0–89 fotogramas en V09.

## Auditoría y solución
En V10 cada escena utilizaba `FilmWipe` dentro de su Stage opaco y los Sequence no se superponían: el comienzo de cada nueva escena hacía una revelación desde negro, NO una transición entre imágenes. Este fue un error compositivo estructural que hacía la pieza monótona y entrecortada.
En V11 `FilmWipe` se convierte en envoltura neutra de compatibilidad. Nuevo `SceneTransition` máscara/opacidad abarca el Stage ENTERO. Los Sequence se solapan 12 frames seleccionados por corte: montaje costa→mapa: apertura por máscara; mapa→documento: disolvencia; documento→retratos: máscara opuesta; entradas a Nancy y Carlos: cortes directos de testimonio; homenaje/cierre: disolvencia. No se añaden transiciones indiscriminadas ni efectos bélicos.

Las fronteras siguen: 0–120, 120–300, 300–510, 510–720, 720–1020, 1020–1290, 1290–1470 y 1470–1650. Solo algunos bloques tienen su duración extendida 12 frames hasta que entra el siguiente para que el archivo previo siga visible durante el revelado. Se conserva el total 1650 frames. Verificar en render si hubo algún flash negro de red.

Música: `Weight of Memory` a volumen uniforme .24 en preview sin voz; no crear un bache de volumen en 24–43s porque audio testimonial está deliberadamente silenciado. Tras incorporar voz del equipo o cita auténtica activar ducking real por timecodes. La pieza V11 sigue siendo instrumental.
Subtítulos: `CaptionTrack` sin cajas y lista vacía; muestra solo frases `verified` y no inventa testimonios. La grabación final se sincroniza por frame después.
Autenticidad: fotos derivadas de documental no etiquetadas como cámara original de 1971. Falta permiso/autoría. El identificador del Memorial no se recrea; animación oficial y watermark pendientes.

## Control
CI GitHub solo valida reglas y tests; no renderiza TSX ni assets. La revisión V11 necesita (1) CI aprobada; (2) vista previa nativa manual 0–89 y otra de límite/escena si se justifica; (3) revisión visual/audio. No llamarla master. Política: Actions manual, 1–90 fotogramas. La prueba 0–89 no comprueba estas transiciones, que ocurren desde frame 120: cuando se programe prueba adicional priorizar 113–175 (encuentro primera transición) o 294–355 para validar montaje documental. Una sola prueba por iteración hasta estabilizar; evitar renders repetidos.
