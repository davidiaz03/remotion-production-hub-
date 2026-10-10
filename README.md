# Remotion Production Hub — producción audiovisual universal

**Inicio para cualquier nuevo chat:** [START_HERE.md](START_HERE.md) · [AGENTS.md](AGENTS.md) · [Protocolo creativo autónomo](docs/CREATIVE_DIRECTION_PROTOCOL.md) · [Estado verificado](docs/PLATFORM_STATUS.md).

Esta plataforma sirve a **muchos proyectos nuevos**, no para reanudar automáticamente el último reel de prueba. Los originales y assets pesados pertenecen a Drive; el montaje editable permanece en Git como Remotion React/TSX y se conserva con revisiones.

## Roles: el usuario aporta ideas; ChatGPT dirige

El usuario puede dar un concepto muy corto y sus archivos. **ChatGPT debe investigar activamente cuando sea útil, estudiar producciones profesionales y su mercado/nicho, elegir referencias, crear su propia estrategia, guion, storyboard y prompts técnicos**, implementar en Remotion, auditar errores y mejorar antes de solicitar aprobación. Puede pedir al usuario reels/videos de profesionales concretos para análisis si no son accesibles directamente. No copiar material ajeno, inventar datos ni exceder permisos. Cada proyecto nuevo nace con `CREATIVE_BRIEF.md` para documentarlo todo.

## Flujo de herramientas

`ChatGPT (investigación + dirección + código) → GitHub (TSX y versiones) → Google Drive (assets) → Remotion (Studio/Actions) → QA + revisión humana → Drive (máster autorizado)`.

## Guías

- [Normas universales y roles](docs/SYSTEM_AUTOMATION.md)
- [Autonomía creativa, investigación, prompts y auditoría](docs/CREATIVE_DIRECTION_PROTOCOL.md)
- [Estado probado y límites pendientes](docs/PLATFORM_STATUS.md)
- [Protocolo E2E siguiente](docs/END_TO_END_VALIDATION.md)
- [Android y guardado de versiones](docs/ANDROID_AUTOMATION.md)
- [Persistencia y aprobación](docs/PERSISTENCE.md)
- [Drive, credenciales y entrega](docs/DRIVE.md)
- [Componentes compartidos](docs/COMPONENTS.md)

## Lo probado al 2026-10-10

- Guardado remoto y recuperación de versiones desde Android.
- Preview Remotion corto de 59 frames y batería de 24/24 pruebas.
- GitHub Actions ↔ Drive: lectura y escritura+relectura SHA-256 de un archivo de 104 bytes.
- **Pendiente:** prueba completa de nuevo proyecto, descarga de assets, render/audio/QA de máster autorizado y entrega Drive con checksum. No confundir la prueba pequeña con máster final.

## Controles

Usar rama `work/*` y proyectos explícitos; `npm run create -- <id>`, `npm run use -- <id>`, `npm run save -- <id> --note "..."`, `npm run publish -- <id>`. Guardar no aprueba ni exporta. El máster requiere revisión aprobada y autorización humana `EXPORTAR-MASTER`. No publicar medios privados ni secretos en este repositorio público. Un conector GitHub en ChatGPT no controla por sí solo la terminal de Codespaces.
