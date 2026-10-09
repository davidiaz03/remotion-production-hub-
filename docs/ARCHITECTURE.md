# Arquitectura universal y contrato del proyecto

**Criterio principal:** no volver a crear scripts, dependencias o workflows por cada reel. Cada proyecto es un conjunto de fuentes, parámetros y hashes de recursos. Las llamadas al motor son parametrizadas.

```
remotion-production-hub/
├── package.json + package-lock.json (bloqueo obligatorio al arrancar)
├── shared/       Caption, AnimatedTitle, BrandFrame
├── templates/reel/  andamio neutral que crea cualquier proyecto
├── projects/
│   ├── demo/       prueba autónoma de 90 frames (sin recursos externos)
│   ├── che-v42/    compatibilidad heredada (28 clips en Drive)
│   └── <slug>/     cada proyecto nuevo; sin duplicar CI
├── scripts/      crear, validar, hidratar assets, render Remotion, QA, entrega, limpieza
├── .devcontainer/ Codespaces + Remotion Studio en puerto 3000
└── .github/workflows/
    ├── quick-preview.yml   workflow_dispatch
    ├── full-master.yml     workflow_dispatch
    └── reusable-render.yml workflow_call (una implementación)
```

## Project descriptor `projects/<slug>/project.json`

- `id`, `title`, `compositionId`, `durationInFrames`, `fps`, `width`, `height`, `crf`.
- `audioRequired`: el máster debe contener audio cuando sea `true`.
- `drivePath`: carpeta de entrega. Para proyectos nuevos, `Remotion Production/projects/<slug>`; `assets/`, `masters/`, `qa/` y `scratch/` bajo esa carpeta.
- `assets.mode=manifest`: recursos en Drive `drivePath/assets/<path>` y locales en `projects/<slug>/public/<path>`; `asset-manifest.json` declara cada SHA256 y tamaño.
- `assets.mode=archives`: compatibilidad de proyectos legados con ZIPs declarados y *patch* aprobado antes de verificar hashes.
- **Dos lugares a sincronizar manualmente al cambiar la duración/resolución:** `src/Root.tsx` y `project.json`. El render se bloquea por fallos de QA, pero la validación estática no analiza componentes arbitrarios para comparar ambos parámetros. Contrastar los dos en una revisión de código antes de aprobar el master.

## Source reproducibility

Studio and Actions both call `scripts/project.mjs` with the same `src/index.ts`, `src/Root.tsx`, `src/Video.tsx`, `shared/` and project `public/`. Both run on one root `package-lock.json`; no FFmpeg-based legacy MP4 edits are allowed to masquerade as a native Remotion render.

The default engine version is Remotion **4.0.530**, matching the historical project lock. The dependency lock is bootstrapped once from the known historical **commit SHA**, verified, committed, and then installed using `npm ci` in every future environment. Any code/dependency change is a new commit with a new corresponding checksum.

## Editorial and technical QA layers

Technical checks: MP4 decodes from start to finish; streams, dimensions, counted frames, FPS, audio presence for master, duration and sampled contact sheet. `blackdetect` creates review warnings, not claims of imperfection or perfection. Visual QA remains human-approved for narration timing, official branding, subtitle placement, cut consistency, motion and institutional requirements.

## Limits of automation

- GitHub connector currently cannot create repositories, set Actions/Codespaces account budgets or directly grant GitHub App installation access.
- Drive connector authentication in ChatGPT is **not the same as** an OAuth credential available to GitHub Actions. See Drive setup.
- No ability to guarantee that personal GitHub billing settings or any existing account restrictions are resolved simply because a connector responds.
- Costs outside standard GitHub-hosted public Actions (Codespaces compute/storage, private repo runs, non-standard runners, external services) require their own eligibility/quota checks.
