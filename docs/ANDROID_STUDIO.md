# Codespaces desde Android: trabajo persistente

1. Entra a `davidiaz03/remotion-production-hub-` → **Code → Codespaces**. Selecciona un Codespace de **2 nucleos, 4 GB**, si esta disponible en tu cuota. Codespaces tiene consumo separado de Actions. No uses maquinas premium ni facturacion adicional.
2. El devcontainer ejecuta `bash scripts/codespaces-setup.sh`, con npm ci y dependencia bloqueada. Comprueba `node --version` contra `.nvmrc` (22.16.0). Abre terminal VS Code Web y ejecuta `npm run studio -- demo`.
3. Abre el puerto 3000 en **Ports**, manteniendolo privado. Edita `projects/demo/src/Video.tsx`, `project.json` y `STATE.json`. Remotion Studio es la vista previa; los MP4 no son archivos fuente.
4. En la rama experimental de automatización, usa `npm run save -- demo --note "Avance de hoy"`: registra código, snapshot, estado y SHA remoto. Si se interrumpe, utiliza `npm run publish -- demo` para terminar el checkpoint, sin duplicarlo. La secuencia manual de `docs/PERSISTENCE.md` es alternativa avanzada.
5. Recupera revisiones antiguas mediante `node scripts/revisions.mjs resume --project demo --revision REVISION --execute` en un worktree separado. No uses reset --hard para cambiar una version aprobada.
6. Al terminar, **deten Codespaces manualmente**. Configura un tiempo de inactividad corto en Settings → Codespaces. La preferencia de apagado es de cuenta, no se activa automaticamente mediante devcontainer.

**Verificado 2026-10-10:** inicio real de Codespaces desde Android, `npm test` 9/9 sobre la revisión anterior, Studio y parada/reinicio manual. La detención por tiempo de inactividad configurado no se probó por separado, ni el nuevo comando de guardado.
