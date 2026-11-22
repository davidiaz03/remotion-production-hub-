#!/usr/bin/env python3
"""Escáner de outliers de YouTube para la preproducción del Memorial.

Reemplazo gratis de vidIQ para la búsqueda semanal de outliers: para
cada canal de referencia, compara las vistas de cada video con la
mediana del canal y marca los que rinden muy por encima de lo normal
(outlier >= 3x, breakout >= 10x). El escaneo semanal de tendencias
(ver preprod/README.md) empieza con este comando.

Dos backends, selección automática:
- api: YouTube Data API v3 (variable de entorno YOUTUBE_API_KEY).
  Rápido y barato en cuota: ~3 unidades por canal (channels.list +
  playlistItems.list + videos.list en lotes de 50). Nunca usa la
  búsqueda de la API (su bucket aparte está limitado a 100
  llamadas/día).
- ytdlp: yt-dlp local, sin clave. Más lento (extracción completa
  de cada video, ~2-3 min por canal) pero sin dependencias de
  Google ni claves.

La clave solo se lee de la variable de entorno YOUTUBE_API_KEY:
nunca se guarda en archivos ni se imprime en la salida.

Las estadísticas son una instantánea semanal: la API de YouTube
no permite almacenar estadísticas más de 30 días; la cadencia
semanal (un informe por escaneo, sin acumular históricos) lo
resuelve.

Este script solo lee datos públicos de YouTube y escribe informes
en preprod/research/. No produce video, no edita y no publica nada.
"""

import argparse
import json
import math
import os
import re
import statistics
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone

# --- Constantes ------------------------------------------------------

OUTLIER_MIN = 3.0      # multiplicador mínimo para marcar outlier
BREAKOUT_MIN = 10.0    # multiplicador mínimo para marcar breakout
RECIENTE_DIAS = 7      # un video con <= 7 días no entra en la mediana
                       # ni se clasifica: aún no acumuló vistas
DEFAULT_MAX = 50       # videos recientes por canal
DEFAULT_CUOTA = 500    # tope de unidades de la API por corrida
YTDLP_BIN_DEFECTO = os.path.expanduser(
    "~/workspace/lmd-forms-work/.venv/bin/yt-dlp")
YTDLP_ARGS = "youtube:player_client=android"
API_BASE = "https://www.googleapis.com/youtube/v3"
TOP_GLOBAL = 3         # outliers destacados al inicio del informe


def hoy_pr() -> date:
    """Fecha de hoy en America/Puerto_Rico (= hora oficial de Cuba)."""
    try:
        from zoneinfo import ZoneInfo
        tz = ZoneInfo("America/Puerto_Rico")
    except Exception:
        tz = timezone.utc
    return datetime.now(tz).date()


def hoy_iso() -> str:
    return hoy_pr().isoformat()


def parse_fecha_api(valor: str | None) -> date | None:
    """publishedAt de la API (2026-11-21T08:44:12Z) -> date."""
    if not valor:
        return None
    try:
        return date.fromisoformat(valor[:10])
    except ValueError:
        return None


def parse_fecha_ytdlp(valor: str | None) -> date | None:
    """upload_date de yt-dlp (20261121) -> date."""
    if not valor or len(valor) != 8:
        return None
    try:
        return date(int(valor[:4]), int(valor[4:6]), int(valor[6:8]))
    except ValueError:
        return None


def duracion_iso8601(valor: str | None) -> int | None:
    """Duración ISO 8601 de la API (PT1H23M45S) -> segundos."""
    if not valor:
        return None
    m = re.fullmatch(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", valor)
    if not m:
        return None
    h, mn, s = (int(x) if x else 0 for x in m.groups())
    return h * 3600 + mn * 60 + s


# --- Config de canales ------------------------------------------------

def cargar_canales(ruta: str) -> list[dict]:
    """Lee preprod/trend-channels.json y devuelve la lista de canales."""
    try:
        with open(ruta, encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        raise SystemExit(f"error: no existe el fichero de canales: {ruta}")
    except json.JSONDecodeError as e:
        raise SystemExit(f"error: el fichero de canales no es JSON válido: {e}")
    canales = data.get("canales")
    if not isinstance(canales, list) or not canales:
        raise SystemExit("error: el fichero de canales no trae una lista 'canales'")
    return canales


def canales_youtube(canales: list[dict]) -> tuple[list[dict], list[dict]]:
    """Separa los canales escaneables por YouTube de los omitidos.

    Un canal se escanea si es de YouTube, está activo y tiene ID de
    canal. El resto se reporta como omitido, con su motivo.
    """
    activos, omitidos = [], []
    for c in canales:
        if c.get("plataforma") != "youtube":
            omitidos.append({**c, "motivo": "no es un canal de YouTube"})
        elif c.get("estado") != "activo":
            omitidos.append({**c, "motivo": f"estado: {c.get('estado')}"})
        elif not c.get("youtube_channel_id"):
            omitidos.append({**c, "motivo": "sin ID de canal resuelto"})
        else:
            activos.append(c)
    return activos, omitidos


# --- Selección de backend ----------------------------------------------

def elegir_backend(preferido: str) -> str:
    """'auto' -> 'api' si hay YOUTUBE_API_KEY, si no 'ytdlp'.

    Un backend explícito se respeta; 'api' sin clave es un error.
    """
    if preferido == "api":
        if not os.environ.get("YOUTUBE_API_KEY"):
            raise SystemExit(
                "error: backend 'api' pedido pero no hay YOUTUBE_API_KEY "
                "en el entorno (export YOUTUBE_API_KEY=... o usa "
                "--backend ytdlp)")
        return "api"
    if preferido == "ytdlp":
        return "ytdlp"
    # auto
    return "api" if os.environ.get("YOUTUBE_API_KEY") else "ytdlp"


# --- Backend API -------------------------------------------------------

class Cuota:
    """Contador de unidades de la API con tope por corrida."""

    def __init__(self, tope: int):
        self.tope = tope
        self.usadas = 0

    def gastar(self, unidades: int, que: str) -> None:
        if self.usadas + unidades > self.tope:
            raise SystemExit(
                f"error: tope de cuota alcanzado ({self.tope} unidades) "
                f"al pedir {que}; sube el tope con --quota-cap o baja "
                f"--max")
        self.usadas += unidades


def api_get(metodo: str, params: dict, clave: str, cuota: Cuota) -> dict:
    """Una llamada a la API (1 unidad para los métodos que usamos)."""
    cuota.gastar(1, metodo)
    params = {**params, "key": clave}
    url = f"{API_BASE}/{metodo}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detalle = e.read().decode("utf-8", "replace")[:300]
        if e.code == 403 and "quota" in detalle.lower():
            raise SystemExit(
                "error: la API de YouTube devolvió 403 por cuota "
                "agotada; la cuota diaria se reinicia a medianoche "
                "hora del Pacífico")
        raise SystemExit(f"error: la API de YouTube devolvió {e.code}: {detalle}")
    except urllib.error.URLError as e:
        raise SystemExit(f"error: no se pudo contactar la API de YouTube: {e}")


def fetch_api(channel_id: str, max_n: int, clave: str, cuota: Cuota) -> list[dict]:
    """Videos recientes de un canal vía YouTube Data API v3.

    channels.list -> playlist de uploads -> playlistItems.list
    (50/página) -> videos.list en lotes de 50 IDs.
    """
    # NUNCA search.list aquí: su bucket aparte (100 llamadas/día) no
    # se usa para listar videos de un canal.
    resp = api_get("channels.list",
                   {"part": "contentDetails", "id": channel_id},
                   clave, cuota)
    items = resp.get("items") or []
    if not items:
        raise SystemExit(f"error: la API no conoce el canal {channel_id}")
    uploads = items[0]["contentDetails"]["relatedPlaylists"]["uploads"]

    ids: list[str] = []
    page = None
    while len(ids) < max_n:
        params = {"part": "contentDetails", "playlistId": uploads,
                  "maxResults": min(50, max_n - len(ids))}
        if page:
            params["pageToken"] = page
        resp = api_get("playlistItems.list", params, clave, cuota)
        for it in resp.get("items") or []:
            ids.append(it["contentDetails"]["videoId"])
        page = resp.get("nextPageToken")
        if not page:
            break

    videos: list[dict] = []
    for i in range(0, len(ids), 50):
        lote = ids[i:i + 50]
        resp = api_get("videos.list",
                       {"part": "snippet,statistics,contentDetails",
                        "id": ",".join(lote)},
                       clave, cuota)
        for it in resp.get("items") or []:
            stats = it.get("statistics") or {}
            snip = it.get("snippet") or {}
            vistas = stats.get("viewCount")
            videos.append({
                "id": it["id"],
                "titulo": snip.get("title") or "(sin título)",
                "url": f"https://www.youtube.com/watch?v={it['id']}",
                "vistas": int(vistas) if vistas is not None else None,
                "publicado": parse_fecha_api(snip.get("publishedAt")),
                "duracion_s": duracion_iso8601(
                    (it.get("contentDetails") or {}).get("duration")),
            })
    return videos


# --- Backend yt-dlp ----------------------------------------------------

def _videos_desde_json_ytdlp(objeto: dict) -> list[dict]:
    """Extrae la lista de videos de la salida JSON de yt-dlp.

    Con -J sobre una playlist, yt-dlp vuelca UN objeto (la playlist)
    con 'entries' ya extraídas. Con URLs sueltas, cada línea es un
    video. Se aceptan ambas formas.
    """
    if isinstance(objeto, dict) and objeto.get("_type") == "playlist":
        entradas = objeto.get("entries") or []
    elif isinstance(objeto, dict) and "id" in objeto:
        entradas = [objeto]
    else:
        entradas = []
    videos = []
    for e in entradas:
        if not isinstance(e, dict) or not e.get("id"):
            continue
        vistas = e.get("view_count")
        videos.append({
            "id": e["id"],
            "titulo": e.get("title") or "(sin título)",
            "url": f"https://www.youtube.com/watch?v={e['id']}",
            "vistas": int(vistas) if vistas is not None else None,
            "publicado": parse_fecha_ytdlp(e.get("upload_date")),
            "duracion_s": e.get("duration"),
        })
    return videos


def fetch_ytdlp(canal: dict, max_n: int, ytdlp_bin: str) -> list[dict]:
    """Videos recientes de un canal vía yt-dlp (sin clave).

    Extracción completa de la playlist de uploads (UU + ID sin 'UC'):
    la lista plana no trae fechas fiables y la mediana necesita la
    edad de cada video. ~2-3 min por canal con --max 50.
    """
    cid = canal["youtube_channel_id"]
    url = f"https://www.youtube.com/playlist?list=UU{cid[2:]}"
    cmd = [ytdlp_bin, "--extractor-args", YTDLP_ARGS, "-J",
           "--ignore-errors", "--playlist-items", f"1:{max_n}", url]
    timeout = 120 + max_n * 8
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True,
                              timeout=timeout)
    except FileNotFoundError:
        raise SystemExit(f"error: no se encontró el binario yt-dlp: {ytdlp_bin}")
    except subprocess.TimeoutExpired:
        raise SystemExit(
            f"error: yt-dlp tardó más de {timeout}s con {canal['nombre']}; "
            f"baja --max o reintenta")
    salida = (proc.stdout or "").strip()
    if not salida:
        raise SystemExit(
            f"error: yt-dlp no devolvió datos para {canal['nombre']} "
            f"(stderr: {(proc.stderr or '')[:200]})")
    videos: list[dict] = []
    try:
        videos = _videos_desde_json_ytdlp(json.loads(salida))
    except json.JSONDecodeError:
        # Salida en líneas JSON (una por video).
        for linea in salida.splitlines():
            linea = linea.strip()
            if not linea:
                continue
            try:
                videos.extend(_videos_desde_json_ytdlp(json.loads(linea)))
            except json.JSONDecodeError:
                continue
    if not videos:
        raise SystemExit(
            f"error: yt-dlp no devolvió videos para {canal['nombre']} "
            f"(stderr: {(proc.stderr or '')[:200]})")
    return videos


# --- Matemática de outlier ---------------------------------------------

def clasificar(multiplicador: float | None) -> str | None:
    """'breakout' >= 10x, 'outlier' >= 3x, si no None."""
    if multiplicador is None:
        return None
    if multiplicador >= BREAKOUT_MIN:
        return "breakout"
    if multiplicador >= OUTLIER_MIN:
        return "outlier"
    return None


def analizar_canal(nombre: str, videos: list[dict], fecha_ref: date) -> dict:
    """Mediana y outliers de un canal.

    La mediana se calcula solo con videos de más de 7 días (los
    recientes aún no acumularon vistas). Solo esos videos se
    clasifican; un video reciente con multiplicador alto va a
    'recientes_a_vigilar', no a outliers.
    """
    for v in videos:
        pub = v.get("publicado")
        v["edad_dias"] = (fecha_ref - pub).days if pub else None

    base = [v for v in videos
            if v.get("vistas") is not None
            and v.get("edad_dias") is not None
            and v["edad_dias"] > RECIENTE_DIAS]
    mediana = statistics.median([v["vistas"] for v in base]) if base else None

    outliers, recientes = [], []
    for v in videos:
        vistas = v.get("vistas")
        mult = None
        if vistas is not None and mediana:
            mult = vistas / mediana
        v["multiplicador"] = round(mult, 2) if mult is not None else None
        edad = v.get("edad_dias")
        if edad is not None and edad > RECIENTE_DIAS:
            clase = clasificar(mult)
            v["clasificacion"] = clase
            if clase:
                outliers.append(v)
        elif edad is not None and edad <= RECIENTE_DIAS:
            v["clasificacion"] = None
            if mult is not None and mult >= OUTLIER_MIN:
                recientes.append(v)
        else:
            # Sin fecha: no se puede saber si es reciente; no se clasifica.
            v["clasificacion"] = None

    outliers.sort(key=lambda v: v["multiplicador"], reverse=True)
    recientes.sort(key=lambda v: v["multiplicador"], reverse=True)
    return {
        "canal": nombre,
        "mediana": mediana,
        "n_videos": len(videos),
        "n_base": len(base),
        "n_sin_vistas": sum(1 for v in videos if v.get("vistas") is None),
        "n_sin_fecha": sum(1 for v in videos if v.get("publicado") is None),
        "outliers": outliers,
        "recientes_a_vigilar": recientes,
    }


# --- Informe -------------------------------------------------------------

def _duracion_txt(seg: int | None) -> str:
    if seg is None:
        return "dur. s/d"
    if seg < 60:
        return f"{seg}s"
    if seg < 3600:
        return f"{seg // 60}m{seg % 60:02d}s"
    return f"{seg // 3600}h{(seg % 3600) // 60:02d}m"


def _video_md(v: dict) -> str:
    fecha = v["publicado"].isoformat() if v.get("publicado") else "s/d"
    vistas = f"{v['vistas']:,}".replace(",", ".") if v.get("vistas") is not None else "s/d"
    mult = f"{v['multiplicador']}x" if v.get("multiplicador") is not None else "s/d"
    clase = f" · **{v['clasificacion'].upper()}**" if v.get("clasificacion") else ""
    return (f"- [{v['titulo']}]({v['url']}) — {vistas} vistas · "
            f"{mult} · {fecha} · {_duracion_txt(v.get('duracion_s'))}{clase}")


def _video_json(v: dict) -> dict:
    return {
        "titulo": v["titulo"],
        "url": v["url"],
        "vistas": v.get("vistas"),
        "multiplicador": v.get("multiplicador"),
        "clasificacion": v.get("clasificacion"),
        "publicado": v["publicado"].isoformat() if v.get("publicado") else None,
        "duracion_s": v.get("duracion_s"),
    }


def escribir_informe(resultados: list[dict], omitidos: list[dict],
                     fallos: list[dict], fecha: str, backend: str,
                     unidades: int, out_dir: str) -> tuple[str, str]:
    """Escribe outliers-FECHA.md y outliers-FECHA.json en out_dir."""
    os.makedirs(out_dir, exist_ok=True)
    base = os.path.join(out_dir, f"outliers-{fecha}")

    todos = [v for r in resultados for v in r["outliers"]]
    todos.sort(key=lambda v: v["multiplicador"], reverse=True)
    top = todos[:TOP_GLOBAL]

    lineas = [f"# Outliers de YouTube — {fecha}",
              "",
              f"Backend: **{backend}** · Canales escaneados: {len(resultados)}"
              + (f" · Unidades de API gastadas: {unidades}" if backend == "api" else "")
              + f" · Outliers: {len(todos)} "
              f"({sum(1 for v in todos if v['clasificacion'] == 'breakout')} breakout)",
              "",
              "Mediana por canal sobre videos de más de 7 días; "
              "outlier ≥3x, breakout ≥10x. Estadísticas: instantánea "
              "semanal (la API de YouTube no permite almacenarlas más "
              "de 30 días).",
              ""]
    lineas.append("## Top 3 global")
    lineas.append("")
    if top:
        for v in top:
            canal = next(r["canal"] for r in resultados if v in r["outliers"])
            lineas.append(_video_md(v) + f" · {canal}")
    else:
        lineas.append("Sin outliers esta semana.")
    lineas.append("")

    for r in resultados:
        med = f"{r['mediana']:,.0f}".replace(",", ".") if r["mediana"] is not None else "s/d"
        lineas.append(f"## {r['canal']}")
        lineas.append("")
        lineas.append(f"Mediana: {med} vistas · Videos analizados: "
                      f"{r['n_videos']} (base de mediana: {r['n_base']})")
        lineas.append("")
        if r["outliers"]:
            for v in r["outliers"]:
                lineas.append(_video_md(v))
        else:
            lineas.append("Sin outliers esta semana.")
        if r["recientes_a_vigilar"]:
            lineas.append("")
            lineas.append("Recientes a vigilar (≤7 días, ≥3x, aún sin clasificar):")
            for v in r["recientes_a_vigilar"]:
                lineas.append(_video_md(v))
        lineas.append("")

    if omitidos:
        lineas.append("## Canales omitidos")
        lineas.append("")
        for c in omitidos:
            lineas.append(f"- {c.get('nombre')}: {c.get('motivo')}")
        lineas.append("")
    if fallos:
        lineas.append("## Canales con error")
        lineas.append("")
        for f in fallos:
            lineas.append(f"- {f['canal']}: {f['error']}")
        lineas.append("")

    with open(base + ".md", "w", encoding="utf-8") as f:
        f.write("\n".join(lineas))

    data = {
        "fecha": fecha,
        "backend": backend,
        "unidades_api": unidades if backend == "api" else 0,
        "top_global": [_video_json(v) for v in top],
        "canales": [{
            "canal": r["canal"],
            "mediana": r["mediana"],
            "n_videos": r["n_videos"],
            "n_base": r["n_base"],
            "outliers": [_video_json(v) for v in r["outliers"]],
            "recientes_a_vigilar": [_video_json(v) for v in r["recientes_a_vigilar"]],
        } for r in resultados],
        "omitidos": [{"nombre": c.get("nombre"), "motivo": c.get("motivo")}
                     for c in omitidos],
        "fallos": fallos,
    }
    with open(base + ".json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    return base + ".md", base + ".json"


# --- CLI -----------------------------------------------------------------

def construir_cli() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="outliers.py",
        description="Escáner de outliers de YouTube para preproducción "
                    "(reemplazo gratis de vidIQ).")
    sub = parser.add_subparsers(dest="comando", required=True)
    p = sub.add_parser("scan", help="escanea los canales de referencia "
                       "y escribe el informe de outliers")
    p.add_argument("--channels", default=None,
                   help="fichero de canales (defecto: "
                        "preprod/trend-channels.json)")
    p.add_argument("--max", type=int, default=DEFAULT_MAX,
                   help=f"videos recientes por canal (defecto: {DEFAULT_MAX})")
    p.add_argument("--backend", choices=["api", "ytdlp", "auto"],
                   default="auto",
                   help="api: YouTube Data API v3 (necesita "
                        "YOUTUBE_API_KEY); ytdlp: yt-dlp local, sin clave; "
                        "auto: api si hay clave, si no ytdlp")
    p.add_argument("--out", default=None,
                   help="directorio de informes (defecto: preprod/research)")
    p.add_argument("--date", default=None,
                   help="fecha del informe YYYY-MM-DD (defecto: hoy en "
                        "America/Puerto_Rico)")
    p.add_argument("--quota-cap", type=int, default=DEFAULT_CUOTA,
                   help=f"tope de unidades de la API por corrida "
                        f"(defecto: {DEFAULT_CUOTA})")
    p.add_argument("--ytdlp", default=YTDLP_BIN_DEFECTO,
                   help="ruta del binario yt-dlp")
    p.add_argument("--only", action="append", default=[],
                   help="escanear solo los canales cuyo nombre contenga "
                        "este texto (repetible)")
    return parser


def cmd_scan(args: argparse.Namespace) -> int:
    raiz = os.path.dirname(os.path.dirname(os.path.dirname(
        os.path.abspath(__file__))))
    ruta_canales = args.channels or os.path.join(
        raiz, "preprod", "trend-channels.json")
    out_dir = args.out or os.path.join(raiz, "preprod", "research")
    fecha = args.date or hoy_iso()
    try:
        fecha_ref = date.fromisoformat(fecha)
    except ValueError:
        print(f"error: --date debe ser YYYY-MM-DD, no {fecha!r}",
              file=sys.stderr)
        return 2
    if args.max < 1:
        print("error: --max debe ser >= 1", file=sys.stderr)
        return 2

    backend = elegir_backend(args.backend)
    canales = cargar_canales(ruta_canales)
    if args.only:
        canales = [c for c in canales
                   if any(o.lower() in (c.get("nombre") or "").lower()
                          for o in args.only)]
        if not canales:
            print(f"error: --only no coincide con ningún canal: {args.only}",
                  file=sys.stderr)
            return 2
    activos, omitidos = canales_youtube(canales)
    if not activos:
        print("error: ningún canal escaneable por YouTube en la config",
              file=sys.stderr)
        return 1

    clave = os.environ.get("YOUTUBE_API_KEY") or ""
    cuota = Cuota(args.quota_cap)
    resultados, fallos = [], []
    for canal in activos:
        nombre = canal["nombre"]
        try:
            if backend == "api":
                videos = fetch_api(canal["youtube_channel_id"], args.max,
                                   clave, cuota)
            else:
                videos = fetch_ytdlp(canal, args.max, args.ytdlp)
        except SystemExit as e:
            # Fallo de un canal: se registra y se sigue con el resto.
            fallos.append({"canal": nombre, "error": str(e)})
            print(f"aviso: {nombre}: {e}", file=sys.stderr)
            continue
        resultados.append(analizar_canal(nombre, videos, fecha_ref))
        print(f"{nombre}: {len(videos)} videos, "
              f"mediana {resultados[-1]['mediana']}, "
              f"{len(resultados[-1]['outliers'])} outliers")

    if not resultados:
        print("error: ningún canal pudo escanearse", file=sys.stderr)
        return 1
    md, js = escribir_informe(resultados, omitidos, fallos, fecha,
                              backend, cuota.usadas, out_dir)
    print(f"informe: {md}")
    print(f"datos: {js}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = construir_cli()
    args = parser.parse_args(argv)
    if args.comando == "scan":
        return cmd_scan(args)
    parser.print_help(sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
