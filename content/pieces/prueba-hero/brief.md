# Brief — Prueba: post con imagen generada + duotono

- **Pieza:** `prueba-hero` · plantilla `post`
- **Objetivo:** pieza de PRUEBA del hub (no para publicar): verificar el
  flujo completo imagen generada → duotono → plantilla con hero → render.
- **Hechos verificados:** texto institucional genérico (sin datos
  sensibles). La imagen es una ILUSTRACIÓN (Malecón al atardecer), no una
  foto de archivo.
- **Imagen:** `img/malecon-duo.png` — Pollinations Flux, seed 17,
  prompt «silhouette of the Havana Malecon seawall at dusk, lone figure
  walking, dramatic dark sky», style prompt sobrio del Memorial;
  duotono rojo con `scripts/duotone.py --preset red`.
  La imagen NO se versiona (`.gitignore`); reproducible con la seed.
- **Revisión:** QA visual 17-nov-2026: hero visible (tras corregir el
  degradado y el preset de duotono, que salía casi negro), titular y
  cuerpo sin cortes, logo completo en el pie.

## Registro de revisiones

| Fecha | Versión | Cambio | Aprobado por |
|---|---|---|---|
| 17-nov-2026 | v1 | Borrador inicial (hero casi negro) | — |
| 17-nov-2026 | v2 | Duotono por canal V + degradado suave; QA superado | — |
