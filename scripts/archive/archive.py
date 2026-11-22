#!/usr/bin/env python3
"""Archivo propio indexado del Memorial de la Denuncia.

Es un ÍNDICE, no una reorganización: en Drive no se mueve, renombra
ni borra nada. El script solo lista carpetas con el CLI de Google
Drive (`hatch_gws_cli drive files list`) y construye
`archive/index.json` con una entrada por archivo: título, tipo,
proyecto, grupo, file_id de Drive, tamaño, fecha, etiquetas, notas
y estado (disponible/pendiente).

Subcomandos:
  index   construye/refresca el índice desde Drive (lee las fuentes
          de `archive/sources.json`) y regenera
          `archive/pendiente-suleris.md`.
  search  busca en el índice por texto (nombre, etiqueta, proyecto,
          tipo, notas) con filtros --proyecto/--tipo/--estado.
  pending lista el material pendiente; --escribir-md regenera la
          lista para Suleris sin reindexar.
  check   valida la estructura del índice (campos, duplicados,
          coherencia de totales).

Las entradas pendientes (material que no está en Drive) se curan a
mano en `archive/pending.json` y `index` las fusiona en cada
refresco: nunca se pierden al reindexar.

Correcciones al inventario del 21-nov-2026 (verificadas en Drive
al sembrar el índice): los másters de Pilar V30 y de Marabana SÍ
están en Drive (en sus carpetas de proyecto, no en la de másters);
la carpeta 12_RECURSOS_MIAMI tiene 7 fotos, no 2; la carpeta FANCA
tiene 34 DNG crudos además de los finales. El índice es la fuente
de verdad; el informe quedó como documento histórico.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import time
import unicodedata
from datetime import datetime, timezone

CLI_DEFECTO = "/opt/hatch/bin/hatch_gws_cli"
TIPOS_VALIDOS = {"video crudo", "máster", "foto", "audio", "documento", "gráfico"}
ESTADOS_VALIDOS = {"disponible", "pendiente"}

EXT_VIDEO = {".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v"}
EXT_FOTO = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".dng", ".bmp", ".gif"}
EXT_GRAFICO = {".svg", ".ai", ".eps", ".psd", ".xd", ".fig"}
EXT_AUDIO = {".mp3", ".wav", ".ogg", ".flac", ".m4a", ".aac"}

# Un vídeo es máster cuando es una versión/entrega; es crudo cuando es
# material de origen (archivo, referencia, documental, fuente).
RE_MASTER = re.compile(r"MASTER|_V\d|_v\d|^REEL_|APPROVED", re.I)
RE_CRUDO = re.compile(r"ARCHIVE|REFERENCE|DOCUMENTAL|^source-|_ORIGINAL", re.I)
SUBCARPETAS_CRUDAS = {"assets", "references", "reference-only", "recursos"}
SUBCARPETAS_MASTER = {"renders"}

REGLAS_ETIQUETAS = [
    (re.compile(r"(?:^|[^a-z])logo(?:[^a-z]|$)|MARCA_AGUA|CIERRE_ANIMADO", re.I), ["marca", "logo"]),
    (re.compile(r"MASTER", re.I), ["máster"]),
    (re.compile(r"LIGERO", re.I), ["ligero"]),
    (re.compile(r"\.dng$", re.I), ["crudo", "dng"]),
    (re.compile(r"APPROVED", re.I), ["aprobado"]),
    (re.compile(r"ARCHIVE", re.I), ["archivo"]),
    (re.compile(r"REFERENCE", re.I), ["referencia"]),
    (re.compile(r"QA|VALIDATION|AUDITORIA", re.I), ["qa"]),
    (re.compile(r"\.(srt|ass)$", re.I), ["subtítulos"]),
    (re.compile(r"\.zip$", re.I), ["paquete"]),
]


def raiz_repo():
    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def normalizar(texto):
    """Minúsculas sin acentos, para búsquedas insensibles a ambos."""
    sin_acentos = "".join(
        c for c in unicodedata.normalize("NFKD", texto or "") if not unicodedata.combining(c)
    )
    return sin_acentos.lower()


def clasificar(nombre, mime, grupo, subgrupo):
    """Tipo de archivo por extensión, nombre y carpeta.

    - Vídeo: máster si es versión/entrega (MASTER, _V<n>, REEL_,
      APPROVED, carpeta renders); crudo si es material de origen
      (ARCHIVE, REFERENCE, DOCUMENTAL, source-, carpeta assets).
    - Imagen con LOGO/MARCA_AGUA/CIERRE: gráfico; el resto, foto.
    - Audio por extensión; todo lo demás (docs, zips, scripts,
      subtítulos, archivos de Google): documento.
    """
    ext = os.path.splitext(nombre)[1].lower()
    if ext in EXT_VIDEO or mime.startswith("video/"):
        # Las marcas del nombre mandan sobre la carpeta: un vídeo
        # APPROVED o MASTER en assets sigue siendo una entrega.
        if RE_MASTER.search(nombre) or subgrupo in SUBCARPETAS_MASTER:
            return "máster"
        if RE_CRUDO.search(nombre) or subgrupo in SUBCARPETAS_CRUDAS:
            return "video crudo"
        if grupo in {"pilar-recursos", "onu-cuba"}:
            return "video crudo"
        return "máster"
    if ext in EXT_GRAFICO:
        return "gráfico"
    if ext in EXT_FOTO or mime.startswith("image/"):
        # «logo» como palabra (no dentro de «diálogo»): límites no alfabéticos.
        if re.search(r"(?:^|[^a-z])logo(?:[^a-z]|$)|MARCA_AGUA|CIERRE_ANIMADO", nombre, re.I):
            return "gráfico"
        return "foto"
    if ext in EXT_AUDIO or mime.startswith("audio/"):
        return "audio"
    return "documento"


def etiquetas_de(nombre, etiquetas_fuente):
    etiquetas = list(etiquetas_fuente or [])
    for patron, tags in REGLAS_ETIQUETAS:
        if patron.search(nombre):
            for tag in tags:
                if tag not in etiquetas:
                    etiquetas.append(tag)
    return sorted(etiquetas)


def ejecutar_cli(cli, params):
    """Una llamada a `drive files list` con los parámetros dados.

    Un reintento ante un fallo transitorio del CLI; si el segundo
    intento también falla, el error sube y `index` se detiene antes
    de escribir un índice incompleto.
    """
    cmd = [cli, "drive", "files", "list", "--params", json.dumps(params)]
    ultimo_error = None
    for intento in range(2):
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if r.returncode == 0:
            try:
                return json.loads(r.stdout)
            except json.JSONDecodeError as exc:
                ultimo_error = f"respuesta no JSON: {exc} ({r.stdout[:200]})"
        else:
            ultimo_error = f"Drive CLI falló ({r.returncode}): {r.stderr.strip()[:300]}"
        if intento == 0:
            time.sleep(2)
    raise RuntimeError(ultimo_error)


def listar_carpeta(cli, folder_id):
    """Todos los archivos de una carpeta (sigue pageToken)."""
    archivos = []
    token = None
    while True:
        params = {
            "q": f"'{folder_id}' in parents and trashed=false",
            "pageSize": 100,
            "fields": "files(id,name,mimeType,size,modifiedTime,webViewLink),nextPageToken",
        }
        if token:
            params["pageToken"] = token
        datos = ejecutar_cli(cli, params)
        archivos.extend(datos.get("files", []))
        token = datos.get("nextPageToken")
        if not token:
            return archivos


def recorrer_fuente(cli, fuente, vistas, entradas):
    """Lista una fuente hasta su profundidad; añade entradas.

    `vistas` es el conjunto de file_id ya indexados (dedupe entre
    fuentes: la primera fuente gana; las etiquetas se fusionan en
    la entrada existente).
    """
    carpeta_raiz = fuente["nombre"]
    cola = [(fuente["folder_id"], "", 1)]
    while cola:
        folder_id, ruta, nivel = cola.pop(0)
        for f in listar_carpeta(cli, folder_id):
            nombre = f["name"]
            ruta_rel = f"{ruta}/{nombre}" if ruta else nombre
            if f["mimeType"] == "application/vnd.google-apps.folder":
                if nivel < fuente["profundidad"]:
                    cola.append((f["id"], ruta_rel, nivel + 1))
                continue
            file_id = f["id"]
            subgrupo = ruta.split("/")[0] if ruta else ""
            proyecto = fuente["proyecto"]
            grupo = fuente["grupo"]
            # Regla de ruta: la subcarpeta de Marabana vive dentro del
            # proyecto Pilar, pero es proyecto propio.
            if "MARABANA" in ruta_rel.upper():
                proyecto, grupo = "marabana", "marabana"
            tipo = clasificar(nombre, f.get("mimeType", ""), grupo, subgrupo)
            etiquetas = etiquetas_de(nombre, fuente.get("etiquetas"))
            if file_id in vistas:
                # Duplicado entre fuentes: fusiona etiquetas y conserva
                # la primera entrada.
                for vieja in entradas:
                    if vieja["file_id"] == file_id:
                        vieja["etiquetas"] = sorted(
                            set(vieja["etiquetas"]) | set(etiquetas)
                        )
                        break
                continue
            fecha = (f.get("modifiedTime") or "")[:10]
            entrada = {
                "id": f"drive:{file_id}",
                "titulo": nombre,
                "tipo": tipo,
                "proyecto": proyecto,
                "grupo": grupo,
                "subgrupo": subgrupo,
                "carpeta": f"{carpeta_raiz}/{ruta}" if ruta else carpeta_raiz,
                "ruta": ruta_rel,
                "file_id": file_id,
                "enlace": f.get("webViewLink"),
                "tamano_bytes": int(f["size"]) if f.get("size") else None,
                "fecha": fecha or None,
                "etiquetas": etiquetas,
                "notas": "",
                "estado": "disponible",
            }
            vistas.add(file_id)
            entradas.append(entrada)
    return entradas


def cargar_json(ruta):
    with open(ruta, encoding="utf-8") as fh:
        return json.load(fh)


def cargar_pendientes(dir_archivo):
    ruta = os.path.join(dir_archivo, "pending.json")
    if not os.path.exists(ruta):
        return []
    datos = cargar_json(ruta)
    pendientes = []
    for p in datos.get("pendientes", []):
        pendientes.append(
            {
                "id": p["id"],
                "titulo": p["titulo"],
                "tipo": p["tipo"],
                "proyecto": p["proyecto"],
                "grupo": p["grupo"],
                "subgrupo": "",
                "carpeta": None,
                "ruta": None,
                "file_id": None,
                "enlace": None,
                "tamano_bytes": None,
                "fecha": None,
                "etiquetas": sorted(p.get("etiquetas", [])),
                "notas": p.get("notas", ""),
                "estado": "pendiente",
            }
        )
    return pendientes


def contar(entradas):
    totales = {
        "disponibles": 0,
        "pendientes": 0,
        "por_proyecto": {},
        "por_grupo": {},
        "por_tipo": {},
    }
    for e in entradas:
        totales["disponibles" if e["estado"] == "disponible" else "pendientes"] += 1
        for clave, campo in (
            ("por_proyecto", "proyecto"),
            ("por_grupo", "grupo"),
            ("por_tipo", "tipo"),
        ):
            totales[clave][e[campo]] = totales[clave].get(e[campo], 0) + 1
    totales["total"] = totales["disponibles"] + totales["pendientes"]
    return totales


def fecha_local(iso):
    """Fecha del timestamp en la hora oficial de Cuba (America/Puerto_Rico)."""
    try:
        from zoneinfo import ZoneInfo

        dt = datetime.fromisoformat(iso).astimezone(ZoneInfo("America/Puerto_Rico"))
        return dt.date().isoformat()
    except Exception:
        return (iso or "")[:10]


def generar_pendiente_md(indice, ruta_salida):
    pendientes = [e for e in indice["entradas"] if e["estado"] == "pendiente"]
    lineas = [
        "# Material pendiente — para pedirle a Suleris",
        "",
        f"Generado desde el archivo indexado el {fecha_local(indice['generado'])}. "
        "Material que NO está en Drive y hace falta para los próximos reels.",
        "",
    ]
    for i, p in enumerate(pendientes, 1):
        lineas.append(f"## {i}. {p['titulo']}")
        lineas.append("")
        lineas.append(f"- **Tipo:** {p['tipo']} · **Proyecto:** {p['proyecto']}")
        if p["notas"]:
            lineas.append(f"- {p['notas']}")
        lineas.append("")
    lineas.extend(
        [
            "---",
            "",
            "Nota: los másters de Pilar V30 y de Marabana SÍ están en Drive "
            "(en sus carpetas de proyecto), por eso no aparecen en esta lista.",
            "",
        ]
    )
    with open(ruta_salida, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lineas))
    return len(pendientes)


def cmd_index(args):
    dir_archivo = args.dir
    fuentes = cargar_json(args.fuentes).get("fuentes", [])
    cli = args.drive_cli or os.environ.get("ARCHIVE_DRIVE_CLI", CLI_DEFECTO)
    vistas = set()
    entradas = []
    for fuente in fuentes:
        antes = len(entradas)
        recorrer_fuente(cli, fuente, vistas, entradas)
        print(
            f"{fuente['nombre']}: {len(entradas) - antes} archivos nuevos",
            file=sys.stderr,
        )
    entradas.extend(cargar_pendientes(dir_archivo))
    entradas.sort(key=lambda e: (e["proyecto"], e["grupo"], e["titulo"].lower()))
    indice = {
        "generado": datetime.now(timezone.utc).isoformat(),
        "fuentes": [f["nombre"] for f in fuentes],
        "totales": contar(entradas),
        "entradas": entradas,
    }
    os.makedirs(dir_archivo, exist_ok=True)
    ruta_indice = os.path.join(dir_archivo, "index.json")
    with open(ruta_indice, "w", encoding="utf-8") as fh:
        json.dump(indice, fh, ensure_ascii=False, indent=2)
    n_pend = generar_pendiente_md(
        indice, os.path.join(dir_archivo, "pendiente-suleris.md")
    )
    t = indice["totales"]
    print(
        f"Índice: {t['total']} entradas "
        f"({t['disponibles']} disponibles, {t['pendientes']} pendientes) "
        f"en {len(fuentes)} fuentes; lista para Suleris: {n_pend} ítems."
    )
    return 0


def buscar(entradas, texto, proyecto=None, tipo=None, estado=None):
    aguja = normalizar(texto)
    resultados = []
    for e in entradas:
        if proyecto and e["proyecto"] != proyecto:
            continue
        if tipo and e["tipo"] != tipo:
            continue
        if estado and e["estado"] != estado:
            continue
        haystack = normalizar(
            " ".join(
                [
                    e["titulo"],
                    e["proyecto"],
                    e["grupo"],
                    e["tipo"],
                    e.get("carpeta") or "",
                    " ".join(e["etiquetas"]),
                    e.get("notas") or "",
                ]
            )
        )
        if not aguja or aguja in haystack:
            resultados.append(e)
    return resultados


def cmd_search(args):
    indice = cargar_json(os.path.join(args.dir, "index.json"))
    resultados = buscar(
        indice["entradas"],
        args.texto,
        proyecto=args.proyecto,
        tipo=args.tipo,
        estado=args.estado,
    )
    if args.json:
        print(json.dumps(resultados[: args.limite], ensure_ascii=False, indent=2))
        return 0
    if not resultados:
        print("Sin resultados.")
        return 0
    for e in resultados[: args.limite]:
        marca = "PENDIENTE" if e["estado"] == "pendiente" else e["tipo"]
        print(f"- {e['titulo']} [{marca} · {e['proyecto']}/{e['grupo']}]")
        if e.get("carpeta"):
            print(f"  {e['carpeta']}")
    if len(resultados) > args.limite:
        print(f"… y {len(resultados) - args.limite} más (usa --limite).")
    print(f"{len(resultados)} resultado(s).")
    return 0


def cmd_pending(args):
    indice = cargar_json(os.path.join(args.dir, "index.json"))
    pendientes = [e for e in indice["entradas"] if e["estado"] == "pendiente"]
    if args.escribir_md:
        n = generar_pendiente_md(
            indice, os.path.join(args.dir, "pendiente-suleris.md")
        )
        print(f"Lista para Suleris regenerada: {n} ítems.")
        return 0
    if not pendientes:
        print("No hay material pendiente.")
        return 0
    for i, p in enumerate(pendientes, 1):
        print(f"{i}. {p['titulo']} ({p['tipo']} · {p['proyecto']})")
        if p["notas"]:
            print(f"   {p['notas']}")
    return 0


CAMPOS_OBLIGATORIOS = {
    "id",
    "titulo",
    "tipo",
    "proyecto",
    "grupo",
    "estado",
    "etiquetas",
}


def validar_indice(indice):
    errores = []
    if "entradas" not in indice or "totales" not in indice:
        return ["El índice no tiene 'entradas' ni 'totales'."]
    vistos = set()
    for i, e in enumerate(indice["entradas"]):
        donde = f"entrada {i} ({e.get('id', '?')})"
        for campo in CAMPOS_OBLIGATORIOS:
            if campo not in e:
                errores.append(f"{donde}: falta el campo '{campo}'")
        if e.get("tipo") not in TIPOS_VALIDOS:
            errores.append(f"{donde}: tipo inválido '{e.get('tipo')}'")
        if e.get("estado") not in ESTADOS_VALIDOS:
            errores.append(f"{donde}: estado inválido '{e.get('estado')}'")
        if e.get("id") in vistos:
            errores.append(f"{donde}: id duplicado")
        vistos.add(e.get("id"))
        if e.get("estado") == "disponible" and not e.get("file_id"):
            errores.append(f"{donde}: disponible sin file_id")
        if e.get("estado") == "pendiente" and e.get("file_id"):
            errores.append(f"{donde}: pendiente con file_id")
    reales = contar(indice["entradas"])
    if reales != indice["totales"]:
        errores.append(
            f"totales incoherentes: declarados {indice['totales']}, "
            f"reales {reales}"
        )
    return errores


def cmd_check(args):
    indice = cargar_json(os.path.join(args.dir, "index.json"))
    errores = validar_indice(indice)
    if errores:
        print(f"ÍNDICE INVÁLIDO ({len(errores)} errores):")
        for err in errores[:20]:
            print(f"  - {err}")
        return 1
    t = indice["totales"]
    print(f"Índice válido: {t['total']} entradas, sin errores.")
    return 0


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Archivo propio indexado del Memorial (solo lectura en Drive)."
    )
    parser.add_argument(
        "--dir",
        default=os.path.join(raiz_repo(), "archive"),
        help="Carpeta del archivo (index.json, pending.json).",
    )
    parser.add_argument(
        "--fuentes",
        default=os.path.join(raiz_repo(), "archive", "sources.json"),
        help="JSON con las carpetas de Drive a indexar.",
    )
    parser.add_argument(
        "--drive-cli",
        default=None,
        help="CLI de Drive (por defecto, el conector; en tests, un stub).",
    )
    sub = parser.add_subparsers(dest="comando", required=True)
    sub.add_parser("index", help="Construye/refresca el índice desde Drive.")
    p_buscar = sub.add_parser("search", help="Busca en el índice.")
    p_buscar.add_argument("texto", nargs="?", default="")
    p_buscar.add_argument("--proyecto")
    p_buscar.add_argument("--tipo")
    p_buscar.add_argument("--estado")
    p_buscar.add_argument("--limite", type=int, default=20)
    p_buscar.add_argument("--json", action="store_true")
    p_pend = sub.add_parser("pending", help="Lista el material pendiente.")
    p_pend.add_argument(
        "--escribir-md",
        action="store_true",
        help="Regenera archive/pendiente-suleris.md sin reindexar.",
    )
    sub.add_parser("check", help="Valida la estructura del índice.")
    args = parser.parse_args(argv)
    if args.comando == "index":
        return cmd_index(args)
    if args.comando == "search":
        return cmd_search(args)
    if args.comando == "pending":
        return cmd_pending(args)
    return cmd_check(args)


if __name__ == "__main__":
    sys.exit(main())
