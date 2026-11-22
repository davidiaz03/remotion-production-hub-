# Archivo propio indexado del Memorial de la Denuncia

Un ÍNDICE de todo el material del Memorial que vive en Google Drive:
820 archivos disponibles + 3 pendientes, en 18 carpetas. El archivo
no mueve, renombra ni borra nada en Drive: solo lista y clasifica.

## Qué hay

| Proyecto | Archivos | Qué es |
|---|---:|---|
| pilar | 363 | Recursos del caso Pilar (19) + versiones V1–V30 del reel (343) + 1 pendiente |
| che | 160 | Renders del reel del Che (85) + assets (70) + notas y referencias |
| carruseles | 104 | Waltz, Ben Rhodes, Salud, FANCA (34 DNG crudos incluidos) |
| recorrido | 73 | Fotos del recorrido del museo (3-sep-2026) |
| onu-cuba | 33 | Kit de trabajo ONU Cuba 2026 + producciones V01–V03 |
| estrategia | 24 | Estrategia Digital + referencias de edición de reels virales |
| bruno-onu | 24 | Reel Bruno ONU 2026 (renders, assets, notas) |
| marabana | 16 | Másters V1–V1.3 + escaparate del reel Marabana |
| diaz-canel | 8 | Prueba 01 (3 renders + zips + contactos) |
| marti-fidel | 7 | Másters V4–V6.1 del reel Martí-Fidel |
| otros | 7 | Fotos de memoriales en EE. UU. (Miami) |
| marca | 2 | Marca de agua oficial + cierre animado (los demás logos se etiquetan por nombre: 13 en total) |
| bandeja | 0 | «Videos oficiales»: vacía; el material nuevo entra aquí |
| general | 2 | Pendientes (archivo histórico, testimonios de otras víctimas) |

## Cómo buscar

```bash
cd ~/workspace/remotion-hub/repo

# Por texto (nombre, etiqueta, proyecto, tipo, notas; sin acentos)
python3 scripts/archive/archive.py search bosch
python3 scripts/archive/archive.py search logo --tipo gráfico

# Por proyecto o tipo
python3 scripts/archive/archive.py search "" --proyecto pilar --tipo máster
python3 scripts/archive/archive.py search "" --estado pendiente

# Salida JSON para procesar
python3 scripts/archive/archive.py search pilar --tipo máster --json
```

## Cómo refrescar

```bash
# Reindexa desde Drive (solo lectura) y regenera la lista para Suleris
python3 scripts/archive/archive.py index

# Valida la estructura del índice
python3 scripts/archive/archive.py check

# Solo la lista de pendientes (sin reindexar)
python3 scripts/archive/archive.py pending
python3 scripts/archive/archive.py pending --escribir-md
```

## Procedimiento de entrada de material nuevo

1. **Subir a Drive** en la carpeta que corresponda (la bandeja
   «Videos oficiales» para material crudo sin clasificar; la carpeta
   del proyecto si ya tiene una). No hace falta avisar al archivo.
2. **Refrescar el índice:** `python3 scripts/archive/archive.py index`.
   El material nuevo aparece con su proyecto, grupo y tipo. Si la
   carpeta no está en `archive/sources.json`, añadirla antes (una
   fuente por carpeta: `folder_id`, proyecto, grupo, profundidad).
3. **Etiquetar:** las etiquetas salen del nombre y de la fuente
   (logo, máster, ligero, crudo, aprobado, archivo, referencia,
   qa, subtítulos, paquete). Si un archivo necesita una etiqueta
   que el nombre no da, se añade a mano en `archive/index.json`
   y se documenta aquí; el próximo `index` la conserva solo si la
   regla vive en `scripts/archive/archive.py` (mejor: añadir la
   regla al script y un test).
4. **Pendientes:** si llega material que estaba pendiente, borrar
   su entrada de `archive/pending.json` y reindexar; si falta algo
   nuevo, añadirlo a `pending.json` (sin `file_id`) y regenerar
   la lista con `pending --escribir-md`.

## Notas y correcciones al inventario del 21-nov-2026

El informe `preprod/research/inventario-drive-2026-11-21.md` contó
249 archivos porque no recorrió las subcarpetas por completo. El
índice es la fuente de verdad; las diferencias verificadas:

- Los másters de **Pilar V30 y de Marabana SÍ están en Drive**, en
  sus carpetas de proyecto (`PROYECTO_UNICO_PILAR_LIBRO_BOMBA_…/
  REEL_PILAR_V30_…` y `…/REEL_MARABANA_V1_…`), no en la carpeta de
  másters. Por eso no están en la lista para Suleris.
- **12_RECURSOS_MIAMI tiene 7 fotos**, no 2.
- La carpeta **FANCA tiene 34 DNG crudos** además de los finales.
- La carpeta del **carrusel Bruno Rodríguez está vacía** (0 archivos).
- El proyecto **Che** tiene 70 archivos en `assets` además de los
  85 renders; el proyecto **Pilar** tiene 343 archivos en sus
  carpetas de versiones además de los 19 recursos.
- Los 5 grupos que el informe contó con exactitud cuadran con el
  índice: másters 7, renders del Che 85, Díaz-Canel 8, recursos
  del caso Pilar 19, fotos del recorrido 73.

## Archivos

- `archive/index.json` — el índice (generado por `index`).
- `archive/sources.json` — las 18 carpetas de Drive que se indexan.
- `archive/pending.json` — material pendiente, curado a mano.
- `archive/pendiente-suleris.md` — lista para pedirle a Suleris
  (generada desde el índice).
- `scripts/archive/archive.py` — el CLI (solo stdlib).
