# Migración y fuentes históricas

## Repositorio universal

La plataforma principal está en https://github.com/davidiaz03/remotion-production-hub- . El motor es independiente de los proyectos alojados en `projects/`. Su historia Git propia empieza al instalar el sistema universal.

## Preservación de la historia anterior

El repositorio histórico `izquierdodavid528-code/Chat-gpt-work-` permanece intacto, con su rama `work/che-october-1967-remotion-v03`. La inclusión del código de compatibilidad V42 en este monorrepositorio **no** importa ni pretende preservar por sí sola los commits antiguos. Una migración futura con historial requiere un repositorio de archivo separado y transferencia Git autenticada; nunca use `push --mirror` sobre un repositorio con contenido sin revisión previa.

## V42

Fuentes y seis ZIP originales en Google Drive: `Remotion Projects/che-october-1967-reel-2026/renders`. La corrección de Internacionalismo de 57 a 58 fotogramas y la marca institucional están separadas en un ZIP de parches; debe permanecer junto con los ZIP originales en Drive y validarse mediante los hashes declarados. No se hace render completo de V42 sin aprobación.

## Operación

La plantilla neutral `demo` es la prueba inicial del motor. No hay renders automáticos por commit. Configure secretos `RCLONE_CONFIG_B64` solo si desea recursos pesados y subida de másteres. Verifique cuotas de Actions y Codespaces en GitHub antes de utilizar la infraestructura.
