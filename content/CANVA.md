# Ruta Canva

Canva es la vía **editable por el usuario en el teléfono**: lo que se crea
aquí él lo puede abrir, retocar y publicar desde la app. Las plantillas de
código son la vía de **precisión y reproducibilidad** (ver `GUIDE.md`).

## Estado de la conexión (verificado 17-nov-2026, solo lecturas)

- Conector conectado y autenticado; 39 herramientas; CLI
  `/opt/hatch/bin/canva` (doc: `/opt/hatch/connectors/canva/CONNECTOR.md`).
- Diseños reales visibles: Memorial Raúl Castro 19-oct, Che en Bolivia,
  Vallegrande, «ataques a diplomáticos».
- La cuenta tiene **1 brand kit** (`kAGc8fG0VOs`) y **0 brand templates**
  (verificado con `list-brand-kits` y `search-brand-templates`).
- Formatos de exportación verificados en un diseño real: pdf, jpg, png,
  pptx, gif, mp4.
- **No se creó ningún diseño durante la construcción del hub** (regla del
  encargo). La primera creación real debe verificar de extremo a extremo
  que el brand kit se aplica.

## Qué puede hacer el conector (esquemas verificados en vivo)

| Operación | Herramienta | Parámetros clave | Notas |
|---|---|---|---|
| Crear diseño | `create-design` | `brief` (obligatorio), `format`, `brand_kit_id`, `references`, `outline` | Genera desde un brief; devuelve `job_id` + `continuation_token` (asíncrono: hay que sondear `get-create-design-async-job`). El `brief` debe llevar TODOS los hechos y el texto exacto: la herramienta no hereda el contexto de la conversación. |
| Editar diseño | `edit-design` | `transaction_id`, `operations`, `page_index`, `finalize` (`commit`/`cancel`/`keep_open`) | Revisa texto, sustituye/recorta/coloca imágenes. `commit` guarda; nunca commitear solo para previsualizar. |
| Generar imagen | `generate-image` | `prompt`, `aspectRatio`, `imageReferences` | Imagen suelta (no diseño editable). Para imágenes protagonistas o estilo exacto, preferir Gemini Pro (ver `GUIDE.md`). |
| Quitar fondo | `remove-background` | `sourceMedia` | Solo sobre imágenes ya subidas a su cuenta de Canva. Alternativa local: `scripts/cutout.py` (rembg). |
| Exportar | `export-design` | `design_id`, `format` | Comprobar antes con `get-export-formats` (necesita `design_id`). |
| Buscar diseños | `search-designs` | `query`, `continuation` | Sin `query` lista los diseños; seguir los tokens de continuación. |
| Subir archivo | `upload-file` | `--file`, `--user-intent` | Hasta 256 MiB. Una subida NO coloca el medio en un diseño. |
| Plantillas de marca | `search-brand-templates`, `create-design-from-brand-template`, `autofill-design` | — | Hoy no hay brand templates en la cuenta: esta ruta está vacía hasta que el usuario cree plantillas de marca en Canva. |

## Corrección al doc del conector (17-nov-2026)

El doc (`CONNECTOR.md`) dice que `create-design` «no aplica brand kits».
El esquema **en vivo** sí trae el parámetro `brand_kit_id`, y la
descripción de la herramienta promete diseños «in the user's brand
colours, fonts and logo». El doc puede estar desactualizado: al crear el
primer diseño real, pasar `brand_kit_id: "kAGc8fG0VOs"` y verificar el
resultado visualmente antes de darlo por bueno.

Igual con los assets: `create-design` no tiene entrada directa de assets,
pero acepta `references` (diseños, plantillas o assets subidos, por id).
Flujo: `upload-file` primero, luego `create-design` con su id en
`references`. Sin verificar de extremo a extremo todavía.

## Límites reales

- **Sin control preciso**: no se puede colocar cada elemento en coordenadas
  exactas ni garantizar una maquetación al píxel. Para identidad estricta
  y datos exactos, plantillas de código.
- **La generación varía**: el mismo brief puede dar diseños distintos. Si el
  resultado no sirve, NO crear otro diseño para corregirlo sin autorización
  explícita del usuario: reportar y compartir el enlace para corregir en
  el editor.
- Algunas herramientas necesitan Canva Pro, Enterprise o créditos de IA.
  No se verificó si la cuenta es Pro: si una operación falla por plan,
  decirlo tal cual.
- Los comentarios y respuestas son visibles para colaboradores: solo
  comentar cuando el usuario lo pida.

## Reglas de uso

1. Crear un diseño en su cuenta es una **escritura**: solo con el encargo
   explícito del usuario para esa pieza (igual que publicar).
2. Un encargo = un diseño. El número de creaciones pedido es un límite duro.
3. Cada diseño creado se registra en el `brief.md` de la pieza (enlace de
   Canva + `design_id`).
4. Si el usuario quiere editarlo después en el teléfono, Canva es la ruta
   correcta aunque el código dé más control: la editabilidad manda.
