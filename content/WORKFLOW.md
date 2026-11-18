# Flujo de trabajo — brief → borrador → revisión → exportar

## 1. Brief (`new-piece.mjs`)

```bash
node content/scripts/new-piece.mjs <slug> --template <plantilla> --title "..."
```

Crea `pieces/<slug>/` con `brief.md`, `data.json` (copia del ejemplo) y
`STATE.json` (fase `brief` en curso). Antes de renderizar, el `brief.md`
debe tener:

- **Objetivo** de la pieza y canal (Facebook, Instagram, ambos).
- **Hechos verificados con fuente**. Sin fuente no va al diseño. Las cifras
  y las citas se verifican contra la fuente primaria antes de escribirlas
  en `data.json` (misma regla que en los reels: nunca afirmar sin verificar).
- **Copy** (titular, cuerpo, CTA) respetando los límites de caracteres de
  `templates/<plantilla>/template.json`.
- **Imagen**: procedencia y licencia (foto real / generada / ninguna).

## 2. Borrador (`render.mjs`)

```bash
node content/scripts/render.mjs --piece <slug>
```

Produce en `pieces/<slug>/out/`: `<slug>.png` (máster),
`<slug>-light.jpg` (ligero) y `<slug>.html` (intermedio). Actualiza
`STATE.json`: `draft` done, `review` in_progress.

Si la plantilla es multi-página (`carousel`), produce un PNG por página
(`<slug>-p01.png`, …).

## 3. Revisión (obligatoria, visual)

**Ninguna pieza se entrega sin leer el PNG renderizado.** Checklist:

- [ ] Texto completo, sin cortes ni desbordes (sin `overflow: hidden` en
      las plantillas: si algo se desborda, se ve).
- [ ] Logo completo y legible (nunca solo la estrella; altura ≥ 120 px).
- [ ] Colores de marca (rojo `#ED1C24`, negro, blanco; sin colores fuera
      de los tokens).
- [ ] Datos y citas exactos según el brief (cifras, fechas, nombres).
- [ ] La imagen es la correcta (foto real del hecho, o ilustración
      evidente — nunca una generación presentada como foto).
- [ ] Sin artefactos (bordes del recorte, texto sobre texto, logo duplicado).

Cada vuelta de revisión se registra en el `brief.md` (tabla de revisiones)
y en `STATE.json` (`milestone`). Para comparar versiones, la hoja de
contacto: `python3 content/scripts/contact-sheet.py pieces/<slug>/out`.

## 4. Exportar

El render ya exporta las dos versiones. Si la pieza va a Canva (porque el
usuario quiere retocarla en el teléfono), subir el PNG como base o recrear
el brief con `create-design` (ver `CANVA.md`); registrar el enlace y el
`design_id` en el `brief.md`.

## 5. Entrega

- Al usuario: **enlace directo de la versión ligera** (JPG) para revisar
  en el móvil + el máster PNG cuando lo apruebe. Igual que los reels:
  enlace de Muse antes que Drive.
- Marcar en `STATE.json`: `export` done, `delivery` done.
- Si la pieza lleva imagen generada, recordar la **etiqueta de contenido
  IA de Meta** al publicar.
- La publicación la hace el usuario (o Beatriz, en la página del Memorial):
  el hub no publica solo.

## Estado de una pieza

```bash
node content/scripts/state.mjs pieces/<slug> show
node content/scripts/state.mjs pieces/<slug> milestone review "Ajuste de titular" --artifact out/x.png
```

`STATE.json` es la fuente de verdad del estado; `brief.md` es la fuente
de verdad editorial. Los renders (`out/`) y las imágenes (`img/`) son
locales y NO se versionan (`.gitignore`): lo versionado es el brief, los
datos y el estado. Para reproducir una pieza en otro checkout hacen falta
sus imágenes (re-generar con la seed del brief, o re-descargar de Drive).
