# Remotion Production Hub — estado verificado de la plataforma

**Última auditoría:** 2026-10-10. Documento GLOBAL: ningún reel de prueba se considera tarea pendiente para otros chats. **Antes de operar, confirmar `main`, PRs y resultados de Actions en tiempo real.**

## Propósito y fuentes de verdad

- Código TSX/Remotion, versiones Git, pruebas, plantillas y procedimientos: `davidiaz03/remotion-production-hub-`.
- Material audiovisual pesado y másteres: Google Drive `Remotion Production/projects/<id>/{assets,masters,qa,scratch}`. En Git solo referencias, hashes SHA-256 y código; NO secretos ni binarios privados.
- Estado del sistema: `START_HERE.md`, `AGENTS.md`, `docs/SYSTEM_AUTOMATION.md` y ESTE documento.
- Estado de un proyecto solicitado explícitamente: `PROJECTS.json`, `projects/<id>/STATE.json`, `HANDOFF.md`, código `src/`, revisiones y aprobaciones. No abrir el último piloto de forma automática.

## Pruebas verificadas al 10 de octubre de 2026

| Componente | Evidencia concreta | Estado |
|---|---|---|
| Guardado remoto Android con checkpoint | Commit remoto confirmado, `verifiedRemoteSha` 51131c38…; estado limpio | VALIDADO para demo |
| Recuperación histórica aislada | 3 revisiones reales; Actions [38074798345](https://github.com/davidiaz03/remotion-production-hub-/actions/runs/38074798345) | VALIDADO |
| Suite del sistema | 24 de 24 pruebas; Actions [38085459397](https://github.com/davidiaz03/remotion-production-hub-/actions/runs/38085459397) | VALIDADO; no equivale a render |
| Studio/controles Android | Demo abierta; tareas 00, 03 y 04 sin diálogos | VALIDADO para controles probados |
| Render nativo corto | 59 fotogramas; Actions [37991845049](https://github.com/davidiaz03/remotion-production-hub-/actions/runs/37991845049) | VALIDADO solo para demo |
| GitHub Actions → Drive (lectura) | `read_verified`; Actions [38084894131](https://github.com/davidiaz03/remotion-production-hub-/actions/runs/38084894131) | VALIDADO |
| GitHub Actions → Drive (escritura y relectura) | Archivo 104 bytes, SHA-256 verificado; Actions [38085770087](https://github.com/davidiaz03/remotion-production-hub-/actions/runs/38085770087) | VALIDADO para archivo pequeño |
| Codespaces → Drive directamente | No se han probado sus credenciales por separado | PENDIENTE |
| Proyecto NUEVO, música/assets y preview con QA | Falta una prueba integral reproducible | PENDIENTE |
| Máster Remotion completo, aprobación, QA y entrega a Drive | No existe aún evidencia completa de ejecución | PENDIENTE |

## Flujo diario previsto para cada proyecto NUEVO

1. Usuario encarga proyecto y define objetivo/duración/formato. Crear ID y rama de trabajo nuevos sin tocar otros proyectos.
2. Subir medios originales autorizados a Drive; guardar tamaño y SHA-256 en `asset-manifest.json` de Git.
3. Escribir escenas/composición editable React/TSX Remotion, reutilizando plantillas; revisar Studio desde Android cuando convenga.
4. Guardar: `npm run save -- <id> --note "cambio"`; comprueba push y SHA remoto. `npm run publish -- <id>` reanuda una publicación interrumpida. **Guardar no es aprobar ni renderizar**.
5. Ejecutar tests y preview nativo manual (hasta 90 fotogramas); revisar MP4/contact sheet y QA, corregir.
6. Usuario aprueba explícitamente una revisión concreta, nunca por guardado automático.
7. Usuario autoriza full master manual; source commit exacto + assets con SHA-256 + QA + copia verificada en Drive. **Paso implementado pero aún pendiente de prueba integral**.
8. Registrar decisiones/estado de ESE proyecto. Las mejoras del motor se documentan en scripts/plantillas/guías universales; detener Codespace cuando no se use.

## Límites

- ChatGPT con GitHub puede crear commits y revisar Actions, pero esta conexión NO ofrece control directo de la terminal del Codespace.
- Actions cuenta con un secreto `RCLONE_CONFIG_B64` probado para Drive. NO compartir el contenido en chats ni en Git público; el OAuth puede tener más alcance que la carpeta de trabajo.
- No hay garantía universal de gratuidad: monitorear minutos de Codespaces/Actions, cuotas, tamaño de medios y límite de renders.
- Un MP4 exportado nunca sustituye el código editable, y QA técnico nunca sustituye revisión artística humana.

**Próximo ensayo:** `docs/END_TO_END_VALIDATION.md`, solo con un proyecto desechable y sin retomar los reels del Memorial o del Che.
