# Iconos — Lucide (ISC)

31 iconos SVG de [Lucide](https://lucide.dev) (licencia ISC, ver
`LICENSE-ISC.txt`), descargados 17-nov-2026 desde el repositorio oficial
(`lucide-icons/lucide`, `main/icons/*.svg`).

Uso en plantillas: `{{icon:nombre}}` — el motor incrusta el SVG con
`width`/`height` al 100%; el tamaño lo fija el CSS del elemento padre
(clase `.icon`). El trazo usa `currentColor`: el color lo fija el CSS.

## Inventario

| Icono | Uso típico |
|---|---|
| quote | Tarjetas de cita, comillas |
| calendar, clock | Fechas, horarios de eventos |
| map-pin | Dirección, lugares |
| eye | Testimonios, «ver» |
| megaphone | Anuncios, convocatorias |
| book-open | Documentos, archivo, lectura |
| newspaper | Prensa, crónicas |
| camera | Fotos, galería |
| play | Vídeo, reel |
| arrow-right, arrow-up-right, chevron-right | «Desliza», enlaces, navegación |
| check | Confirmación, listas |
| info | Notas, datos |
| heart | Solidaridad (con moderación) |
| share-2 | Compartir |
| globe | Internacional, web |
| users | Colectivo, participantes |
| mic, audio-lines | Voz, audio, testimonios grabados |
| image | Imagen, galería |
| external-link | Enlaces externos |
| star, flag | Símbolos, efemérides |
| landmark | Institución, museo |
| scale | Justicia, denuncia |
| shield | Protección, defensa |
| flame | Urgencia, memoria viva |
| file-text | Expedientes, documentos |
| siren | Alerta, denuncia urgente |

## Añadir un icono

```bash
cd content/lib/icons
curl -sL --fail -o <nombre>.svg \
  "https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/<nombre>.svg"
```

Comprobar que el archivo es un SVG válido (`head -3`) y añadirlo a la
tabla de arriba. Nombres en kebab-case, como en lucide.dev. (Nota:
algunos nombres cambian entre versiones: `triangle-alert` y
`alert-triangle` no existían como archivo en nov-2026; se usó `siren`.)
