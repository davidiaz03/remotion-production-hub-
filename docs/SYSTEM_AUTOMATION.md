# Automatización universal del sistema audiovisual

**Esta documentación corresponde a la PLATAFORMA, no al proyecto del Memorial, ni a demo ni a un proyecto del Che.** Los pilotos se utilizan para probar funciones, no para convertirse en la misión de futuros chats.

## Fuentes de verdad

**GitHub:** motor Remotion, plantilla, código, historial y pruebas. Compartidos entre proyectos: `scripts/`, `shared/`, `templates/`, `.github/` y `docs/`. Código editorial en `projects/<id>/` solo cuando se encarga ese proyecto.

**Google Drive:** `Remotion Production/projects/<id>/assets`, `masters`, `qa` y `scratch` para binarios. Sus recursos se identifican por hash SHA-256. ChatGPT, Codespaces y GitHub Actions son tres clientes distintos y necesitan permisos propios.

**Remotion + GitHub Actions:** React/TSX para composición editable. Preview y pruebas técnicas independientes; exportación de master únicamente tras aprobación, con QA y verificación de entrega.

Consulta primero `docs/PLATFORM_STATUS.md` (evidencia real) y `docs/END_TO_END_VALIDATION.md` (próxima prueba). El Memorial y otros pilotos NO son tareas futuras.

## Ciclo que debe funcionar para cada trabajo nuevo

1. Crear ID y rama `work/*` únicos. Jamás modificar un piloto anterior por accidente.
2. Crear desde plantilla, identificar y organizar recursos en Drive, calcular hashes, previsualizar en Studio.
3. Edición y guardados mediante commits+checkpoints con SHA remoto verificado.
4. Probar recuperación de una revisión en Git separado y comprobar CI.
5. Render preview nativo sin aprobación y revisar imagen, audio y legibilidad.
6. Aprobar editorialmente una revisión específica (no por efecto de guardar).
7. Con credenciales Drive verificadas, exportar un master de la revisión aprobada y hacer QA + upload con checksum.
8. Convertir errores detectados en una mejora universal con test, cambios en scripts/plantillas y documentación. No pedir a un chat siguiente retomar el video piloto.

## Límites reales del acceso

El conector GitHub desde ChatGPT puede editar/consultar el repositorio y revisar resultados de Actions; **no maneja directamente el terminal del Codespace abierto**. Para trabajos ejecutados se necesitan workflows autorizados, herramientas de ejecución disponibles o acciones específicas del usuario.

**Drive:** conector ChatGPT comprobado en la carpeta `Remotion Production/projects`. **Lectura verificada** en GitHub Actions (run `38084894131`, 2026-10-10): se instaló `RCLONE_CONFIG_B64` como secret de repositorio; el job ejecutó el remoto `media:` con salida `read_verified` y se completó sin renderizar ni subir archivos. **Se probó la escritura y relectura con SHA-256 de un archivo de 104 bytes** en run `38085770087`. **NO se ha probado entrega de un máster audiovisual ni Drive desde Codespaces**. Las credenciales temporales del runner se borran al terminar. Para cada proyecto nuevo, validar manifest SHA-256, aprobación y destino antes de un master.

## Seguridad y trazabilidad

No incluir OAuth, tokens, archivos institucionales privados, MP4 binarios o datos sensibles en GitHub público. Nunca pedir secretos en el chat. Revisar cada paso antes de declarar completada una exportación; distinguir código, tests, render, QA, revisión humana y entrega Drive. No forzar pushes ni borrar versiones.
