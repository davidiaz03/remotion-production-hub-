# Activos de marca canónicos (Memorial de la Denuncia)

Estos son los ÚNICOS binarios versionados en el repo, por decisión
deliberada (17-nov-2026): cualquier chat, en cualquier momento, debe
poder construir un reel sin cazar el logo por proyectos viejos.

| Archivo | Qué es | Regla |
|---|---|---|
| `logo-white.png` | Logotipo COMPLETO blanco/transparente | Marca de agua en video: desde el fotograma 0, sin placa de fondo. Nunca solo la estrella. |
| `sting-black-2x.mp4` | Cierre animado oficial (fondo negro, 3,03 s) | Cierre de todo reel. Conserva su fondo negro. |

## Por qué están en git (excepción al .gitignore)

`.gitignore` excluye `*.png`/`*.mp4` y `**/public/*`. Estos dos archivos
se añadieron con `git add -f` porque son pequeños (320 KB en total),
públicos (logo y cierre de una página pública) y sin ellos ningún
proyecto nuevo puede cumplir la regla de marca. NO añadir más binarios
aquí sin la misma justificación: el resto de assets vive en `public/`
de cada proyecto (local, no versionado) o en `~/workspace/remotion-hub/assets/`.

## Uso

`scripts/editing/new-quiet-reel.mjs` los copia a `public/img/` y
`public/video/` de cada proyecto nuevo. Los proyectos de motion
graphics los copian igual desde aquí (no desde otro proyecto).
