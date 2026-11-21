# Instrucciones para asistentes — hub de contenido estático

Módulo `content/` del Remotion Production Hub (rama
`work/content-hub-v2-2026-11-21`). Lee `content/README.md`,
`content/BRAND.md` y `content/templates/README.md` antes de operar.

## Reglas de marca (permanentes, no negociables)

- El logo es siempre el **logotipo COMPLETO** (estrella + MEMORIAL DE LA
  DENUNCIA). Nunca solo la estrella. Sobre rojo, variante blanca; sobre
  foto, pastilla roja + logo blanco. Altura mínima 120 px; una sola
  aparición por página.
- Rojo corporativo `#ED1C24`, negro `#000000`, blanco `#FFFFFF`, gris
  `#77787B`. Los valores viven en `brand/tokens.json` y `lib/base.css`:
  **nunca hex sueltos en una plantilla** (la suite lo comprueba).
- Titular nunca sobre la cara (cara en los dos tercios superiores, texto
  en el tercio inferior); titular 8–15 palabras; 1 idea por lámina;
  carruseles 4:5, 5–10 láminas.
- Datos y citas exactos y verificados contra la fuente primaria antes de
  escribirlos en `data.json`. Sin fuente no va al diseño.

## Flujo

1. Pieza nueva: `new-piece.mjs` (o `build-carousel.mjs` para carruseles
   desde texto — valida la densidad ANTES de crear la pieza).
2. Editar `brief.md` (hechos + fuentes) y `data.json`.
3. Renderizar: `render.mjs --piece <slug>` (o `--all-pieces` por lotes).
4. QA: `qa.mjs --piece <slug>` (densidad + marca + caras) **y** revisión
   visual del PNG (obligatoria; el QA automático no sustituye mirar).
5. Entrega: JPG ligero para el móvil + PNG máster. El hub no publica.

## Añadir una plantilla

Ver `templates/README.md` («Añadir una plantilla nueva»): copiar la más
parecida, editar `template.json`/`template.html`/`data.example.json`
(datos reales verificados), renderizar el ejemplo + QA visual, registrar
en la tabla, en `TEMPLATES` de `render.mjs`, en `formats` de
`tokens.json` y en `TEMPLATES` de `tests/content-hub.test.mjs`, y pasar
`brand-check.mjs --example <nueva>`.

## Verificación

- Suite: `node --test tests/content-hub.test.mjs` (incluye renders por
  CDP; en trabajo paralelo, serializar el cómputo pesado con
  `flock /tmp/noche-ecosistemas-heavy.lock`).
- Ninguna pieza se entrega sin QA visual del PNG renderizado.
- Si un paso no se ejecutó, decir **pendiente**, no «completado».

## Límites

- Rama `work/*`, sin force-push, no tocar `main` ni `work/marti-fidel-v3`.
- No publicar, no postear, no borrar originales, no copiar secretos al repo.
- Los renders (`out/`, `examples/out/`) y las imágenes de piezas (`img/`)
  son locales y no se versionan, salvo las fotos con licencia verificada
  que ya están versionadas en `trump-cuba-noviembre/img/`.
