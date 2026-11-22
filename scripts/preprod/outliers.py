#!/usr/bin/env python3
"""Escáner de outliers para la preproducción del Memorial.

Reemplazo gratis de vidIQ para la búsqueda semanal de outliers: para
cada cuenta de referencia, compara la señal de cada publicación con
la mediana de la cuenta y marca las que rinden muy por encima de lo
normal (outlier >= 3x, breakout >= 10x). El escaneo semanal de
tendencias (ver preprod/README.md) empieza con este comando.

Tres plataformas (`--platform youtube|instagram|facebook|all`):

- YouTube: señal = vistas. Dos backends, selección automática:
  `api` (YouTube Data API v3, variable YOUTUBE_API_KEY; ~3 unidades
  por canal; nunca usa la búsqueda de la API, cuyo bucket aparte
  está limitado a 100 llamadas/día) o `ytdlp` (yt-dlp local, sin
  clave; ~2-3 min por canal).
- Instagram: señal = LIKES. El conector de Instagram no expone las
  vistas de las publicaciones de otras cuentas (solo likes y
  comentarios), así que los likes son la señal principal y los
  comentarios la secundaria. Backend: `instagram-cli` (lectura de
  publicaciones públicas; filtra las colaboraciones de otros
  autores). La cuenta propia se resuelve por flag
  `--instagram-account-id`, variable INSTAGRAM_ACCOUNT_ID o
  autodetección (`instagram-cli accounts`); el ID nunca se guarda
  en el repo ni se imprime.
- Facebook: señal = REACCIONES. El conector de Facebook NO lista
  las publicaciones de una Página (verificado 21-nov-2026), así que
  el escaneo parte de una LISTA DE URLs: `--fb-urls FICHERO` (una
  URL de post por línea) más el descubrimiento automático desde los
  digests recientes del radar (`--digest-dir`, `--digest-days`, por
  defecto 7 días). Cada URL se enriquece con `facebook-cli post
  read` + `post reactions read` (con el post_id que devuelve el
  primero, no con el ID de la URL). La muestra es la lista
  recogida, no el historial de la Página: la mediana es
  conservadora y el informe avisa cuando la base es pequeña
  (n_base < 5).

La matemática es la misma en las tres plataformas: mediana solo
sobre publicaciones de más de 7 días (las recientes aún no
acumularon señal); solo esas se clasifican; una publicación
reciente con multiplicador alto va a «Recientes a vigilar», sin
clasificar.

La clave de YouTube solo se lee de la variable de entorno
YOUTUBE_API_KEY: nunca se guarda en archivos ni se imprime.

Las estadísticas son una instantánea semanal: la API de YouTube
no permite almacenar estadísticas más de 30 días; la cadencia
semanal (un informe por escaneo, sin acumular históricos) lo
resuelve.

Ante un 429 / rate limit de un proveedor, el escaneo se DETIENE
en ese proveedor, escribe el informe parcial con lo recogido y no
reintenta por otra vía.

Este script solo lee datos públicos y escribe informes en
preprod/research/. No produce video, no edita y no publica nada.
"""

import argparse
import json
import os
import re
import statistics
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone

# --- Constantes ------------------------------------------------------

OUTLIER_MIN = 3.0      # multiplicador mínimo para marcar outlier
BREAKOUT_MIN = 10.0    # multiplicador mínimo para marcar breakout
RECIENTE_DIAS = 7      # una publicación con <= 7 días no entra en la
                       # mediana ni se clasifica: aún no acumuló señal
DEFAULT_MAX = 50       # publicaciones recientes por cuenta
                       # (los escaneos semanales de IG/FB usan --max 30)
DEFAULT_CUOTA = 500    # tope de unidades de la API por corrida
YTDLP_BIN_DEFECTO = os.path.expanduser(
    "~/workspace/lmd-forms-work/.venv/bin/yt-dlp")
YTDLP_ARGS = "youtube:player_client=android"
API_BASE = "https://www.googleapis.com/youtube/v3"
TOP_GLOBAL = 3         # outliers destacados al inicio del informe
INSTAGRAM_BIN_DEFECTO = "instagram-cli"
FACEBOOK_BIN_DEFECTO = "facebook-cli"
DIGEST_DIR_DEFECTO = os.path.expanduser(
    "~/workspace/goals/resumen-diario-de-redes-sociales/hidden_files/")
DIGEST_DIAS_DEFECTO = 7  # días de digests para descubrir URLs de FB
PAUSA_FB_SEG = float(os.environ.get("OUTLIERS_PAUSA_FB", "1.0"))
                       # pausa entre URLs de Facebook (uso cortés)
BASE_MINIMA_FIABLE = 5  # n_base menor -> aviso de mediana poco fiable
MIN_BASE = 10          # base mínima que el escaneo de Instagram
                       # intenta completar paginando (las cuentas que
                       # publican mucho cubren <7 días con --max 30)

PLATAFORMAS = {
    "youtube": {"titulo": "YouTube", "senial": "vistas",
                "prefijo": "outliers", "unidad": "canal",
                "unidades": "canales", "item": "video",
                "items": "videos",
                "escaneados": "Canales escaneados",
                "analizados": "Videos analizados",
                "omitidos": "Canales omitidos",
                "con_error": "Canales con error"},
    "instagram": {"titulo": "Instagram", "senial": "likes",
                  "prefijo": "outliers-instagram", "unidad": "cuenta",
                  "unidades": "cuentas", "item": "publicación",
                  "items": "publicaciones",
                  "escaneados": "Cuentas escaneadas",
                  "analizados": "Publicaciones analizadas",
                  "omitidos": "Cuentas omitidas",
                  "con_error": "Cuentas con error"},
    "facebook": {"titulo": "Facebook", "senial": "reacciones",
                 "prefijo": "outliers-facebook", "unidad": "página",
                 "unidades": "páginas", "item": "publicación",
                 "items": "publicaciones",
                 "escaneados": "Páginas escaneadas",
                 "analizados": "Publicaciones analizadas",
                 "omitidos": "Páginas omitidas",
                 "con_error": "Publicaciones con error"},
}
ID_CAMPO = {"youtube": "youtube_channel_id",
            "instagram": "instagram_handle",
            "facebook": "facebook_handle"}


class RateLimitError(Exception):
    """429 / rate limit de un proveedor: detener ese proveedor."""


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
    """Fecha ISO (2026-11-21T08:44:12Z, 2026-11-21 02:31:28) -> date."""
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


def titulo_desde_caption(caption: str | None, limite: int = 80) -> str:
    """Primera línea del caption como título (IG/FB no traen título).

    Recorta a `limite` caracteres y neutraliza corchetes para no
    romper el enlace Markdown del informe.
    """
    if not caption:
        return "(sin texto)"
    primera = caption.strip().splitlines()[0] if caption.strip() else ""
    primera = re.sub(r"\s+", " ", primera).strip()
    primera = primera.replace("[", "(").replace("]", ")")
    if not primera:
        return "(sin texto)"
    if len(primera) > limite:
        return primera[:limite - 1].rstrip() + "…"
    return primera


def _es_rate_limit(stdout: str, stderr: str, returncode: int) -> bool:
    """¿La llamada al CLI chocó con un rate limit (429)?

    Preciso a propósito: un «429» suelto en el stdout de una llamada
    exitosa NO es un rate limit (puede ser un contador de likes o
    parte de un ID). Solo cuentan los marcadores en stderr, o en
    stdout cuando la llamada falló (código distinto de 0).
    """
    err = (stderr or "").lower()
    if "rate limit" in err or "too many requests" in err:
        return True
    if returncode == 0:
        return False
    if re.search(r"\b429\b", stderr or ""):
        return True
    out = (stdout or "").lower()
    if "rate limit" in out or "too many requests" in out:
        return True
    return bool(re.search(r'"(?:code|status)"\s*:\s*429\b', stdout or ""))


def ejecutar_cli(cmd: list[str], timeout: int, que: str) -> str:
    """Ejecuta un CLI externo (yt-dlp, instagram-cli, facebook-cli).

    Única llamada a subprocess del script. Devuelve el stdout.
    Rate limit (429) -> RateLimitError (el llamador detiene ese
    proveedor). Cualquier otro fallo -> SystemExit con contexto.
    """
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True,
                              timeout=timeout)
    except FileNotFoundError:
        raise SystemExit(f"error: no se encontró el binario: {cmd[0]}")
    except subprocess.TimeoutExpired:
        raise SystemExit(f"error: {que} tardó más de {timeout}s")
    if _es_rate_limit(proc.stdout or "", proc.stderr or "",
                      proc.returncode):
        raise RateLimitError(f"{que}: rate limit (429)")
    if proc.returncode != 0:
        detalle = (proc.stderr or proc.stdout or "")[:200]
        raise SystemExit(
            f"error: {que} falló (código {proc.returncode}): {detalle}")
    return proc.stdout or ""


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


def canales_plataforma(canales: list[dict],
                       plataforma: str) -> tuple[list[dict], list[dict]]:
    """Separa las cuentas escaneables de una plataforma de las omitidas.

    Una cuenta se escanea si es de la plataforma pedida, está activa
    y tiene su identificador resuelto. Las cuentas de OTRAS
    plataformas no cuentan como omitidas: simplemente no aplican.
    """
    activos, omitidos = [], []
    campo = ID_CAMPO[plataforma]
    for c in canales:
        if c.get("plataforma") != plataforma:
            continue
        if c.get("estado") != "activo":
            omitidos.append({**c, "motivo": f"estado: {c.get('estado')}"})
        elif not c.get(campo):
            omitidos.append({**c, "motivo": f"sin {campo} resuelto"})
        else:
            activos.append(c)
    return activos, omitidos


def filtrar_only(cuentas: list[dict], only: list[str],
                 plataforma: str) -> list[dict]:
    """Filtra cuentas por --only (subcadena del nombre, repetible)."""
    if not only:
        return cuentas
    filtradas = [c for c in cuentas
                 if any(o.lower() in (c.get("nombre") or "").lower()
                        for o in only)]
    if not filtradas:
        raise SystemExit(
            f"error: --only no coincide con ninguna "
            f"{PLATAFORMAS[plataforma]['unidad']} de {plataforma}: {only}")
    return filtradas


# --- Selección de backend (YouTube) -------------------------------------

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


# --- Backend API (YouTube) ----------------------------------------------

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
            vistas = int(vistas) if vistas is not None else None
            videos.append({
                "id": it["id"],
                "titulo": snip.get("title") or "(sin título)",
                "url": f"https://www.youtube.com/watch?v={it['id']}",
                "senial": vistas,
                "vistas": vistas,
                "publicado": parse_fecha_api(snip.get("publishedAt")),
                "duracion_s": duracion_iso8601(
                    (it.get("contentDetails") or {}).get("duration")),
            })
    return videos


# --- Backend yt-dlp (YouTube) -------------------------------------------

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
        vistas = int(vistas) if vistas is not None else None
        videos.append({
            "id": e["id"],
            "titulo": e.get("title") or "(sin título)",
            "url": f"https://www.youtube.com/watch?v={e['id']}",
            "senial": vistas,
            "vistas": vistas,
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
    salida = ejecutar_cli(cmd, timeout, f"yt-dlp ({canal['nombre']})").strip()
    if not salida:
        raise SystemExit(
            f"error: yt-dlp no devolvió datos para {canal['nombre']}")
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
            f"error: yt-dlp no devolvió videos para {canal['nombre']}")
    return videos


# --- Backend Instagram ---------------------------------------------------

def resolver_instagram_account_id(flag: str | None, ig_bin: str) -> str:
    """ID de la cuenta propia de Instagram para instagram-cli.

    Orden: flag --instagram-account-id, variable INSTAGRAM_ACCOUNT_ID,
    autodetección con `instagram-cli accounts` (si hay exactamente
    una cuenta). El ID nunca se guarda en el repo ni se imprime.
    """
    if flag:
        return flag
    env = os.environ.get("INSTAGRAM_ACCOUNT_ID")
    if env:
        return env
    salida = ejecutar_cli([ig_bin, "accounts"], 60,
                          "instagram-cli accounts")
    try:
        cuentas = (json.loads(salida).get("accounts") or [])
    except json.JSONDecodeError:
        raise SystemExit(
            "error: instagram-cli accounts devolvió salida no JSON")
    if len(cuentas) == 1:
        return cuentas[0]["user_fbid"]
    if not cuentas:
        raise SystemExit(
            "error: instagram-cli no devolvió cuentas; revisa la "
            "conexión de Instagram")
    raise SystemExit(
        "error: hay varias cuentas de Instagram conectadas; pasa "
        "--instagram-account-id o define INSTAGRAM_ACCOUNT_ID")


def _n_base_instagram(propios: dict[str, dict], fecha_ref: date) -> int:
    """Publicaciones propias que entrarían en la base de la mediana."""
    return sum(1 for v in propios.values()
               if v.get("senial") is not None
               and v.get("publicado") is not None
               and (fecha_ref - v["publicado"]).days > RECIENTE_DIAS)


def fetch_instagram(handle: str, max_n: int, account_id: str,
                    ig_bin: str, fecha_ref: date) -> list[dict]:
    """Publicaciones recientes de una cuenta pública vía instagram-cli.

    Señal principal: likes (el conector no expone vistas de
    publicaciones ajenas). Filtra las colaboraciones: `posts` puede
    devolver publicaciones de OTRO autor que aparecen en el perfil
    de la cuenta pedida. Pagina con --after hasta tener max_n
    publicaciones propias o agotar las páginas; si con max_n la
    base de la mediana queda por debajo de MIN_BASE (cuentas que
    publican varias veces al día), sigue paginando hasta completar
    la base, con un tope duro de 3x max_n.
    """
    propios: dict[str, dict] = {}
    tope_duro = max_n * 3
    cursor = None
    while True:
        cmd = [ig_bin, "posts", "--username", handle,
               "--account-id", account_id]
        if cursor:
            cmd += ["--after", cursor]
        salida = ejecutar_cli(cmd, 120, f"instagram-cli posts @{handle}")
        try:
            data = json.loads(salida)
        except json.JSONDecodeError:
            raise SystemExit(
                f"error: instagram-cli posts @{handle} devolvió "
                f"salida no JSON")
        for p in data.get("posts") or []:
            if (p.get("username") or "").lower() != handle.lower():
                continue  # colaboración de otro autor
            pid = p.get("post_id")
            if not pid or pid in propios:
                continue
            likes = p.get("likes")
            likes = int(likes) if likes is not None else None
            propios[pid] = {
                "id": pid,
                "titulo": titulo_desde_caption(p.get("post_caption")),
                "url": p.get("url") or f"https://www.instagram.com/p/{pid}/",
                "senial": likes,
                "likes": likes,
                "comentarios": p.get("comments"),
                "media_type": p.get("media_type"),
                "publicado": parse_fecha_api(p.get("created_at")),
            }
        cursor = data.get("next_cursor") if data.get("has_next_page") else None
        if not cursor:
            break
        if len(propios) >= tope_duro:
            break
        if (len(propios) >= max_n
                and _n_base_instagram(propios, fecha_ref) >= MIN_BASE):
            break
    items = sorted(propios.values(),
                   key=lambda v: v["publicado"] or date.min,
                   reverse=True)
    return items[:tope_duro]


# --- Backend Facebook ----------------------------------------------------

def leer_urls_fb(ruta: str) -> list[str]:
    """Lee un fichero de URLs de Facebook (una por línea).

    Ignora líneas en blanco y comentarios (#...).
    """
    try:
        with open(ruta, encoding="utf-8") as f:
            lineas = f.read().splitlines()
    except FileNotFoundError:
        raise SystemExit(
            f"error: no existe el fichero de URLs de Facebook: {ruta}")
    return [ln.strip() for ln in lineas
            if ln.strip() and not ln.strip().startswith("#")]


def _es_url_post_fb(url: str) -> bool:
    """Solo URLs que apuntan a una publicación (no a una Página).

    Los /posts/, /videos/ y /photo/ llevan el nombre de la Página
    antes (facebook.com/<Página>/posts/<id>), así que se buscan en
    cualquier punto de la ruta; los /reel/, permalink.php, /watch/
    y /share/ van justo tras el dominio.
    """
    if re.search(r"facebook\.com/(reel/|permalink\.php|watch/|share/)",
                 url):
        return True
    return "/posts/" in url or "/videos/" in url or "/photo/" in url


def descubrir_urls_digest(digest_dir: str, dias: int,
                          fecha_ref: date) -> list[str]:
    """URLs de Facebook en los digests del radar de los últimos días.

    Busca radar-YYYY-MM-DD-{digest,raw,parsed}.txt dentro del rango
    y extrae las URLs de publicaciones de Facebook. La atribución a
    Páginas la hace después `post read` (por los datos del post),
    así que aquí solo importan las URLs. Directorio ausente ->
    lista vacía (sin error: el descubrimiento es opcional).
    """
    if not os.path.isdir(digest_dir):
        return []
    desde = fecha_ref - timedelta(days=dias)
    patron = re.compile(r"https://(?:www\.)?facebook\.com/\S+")
    urls: list[str] = []
    vistos: set[str] = set()
    for nombre in sorted(os.listdir(digest_dir)):
        m = re.match(r"radar-(\d{4}-\d{2}-\d{2})-(digest|raw|parsed)\.txt$",
                     nombre)
        if not m:
            continue
        try:
            f = date.fromisoformat(m.group(1))
        except ValueError:
            continue
        if f < desde or f > fecha_ref:
            continue
        try:
            with open(os.path.join(digest_dir, nombre),
                      encoding="utf-8", errors="replace") as fh:
                texto = fh.read()
        except OSError:
            continue
        for u in patron.findall(texto):
            u = u.rstrip(").,;\"'¦")
            if not _es_url_post_fb(u):
                continue
            if u not in vistos:
                vistos.add(u)
                urls.append(u)
    return urls


def _slug_facebook(profile_url: str | None) -> str | None:
    """Slug de la Página desde profile_url (facebook.com/NTN24 -> NTN24)."""
    if not profile_url:
        return None
    m = re.search(r"facebook\.com/([^/?#]+)", profile_url)
    return m.group(1) if m else None


def fetch_facebook_post(url: str, fb_bin: str) -> dict:
    """Enriquece una URL de post de Facebook vía facebook-cli.

    `post read` devuelve comentarios, fecha, caption y el dueño;
    las reacciones salen de una segunda llamada, `post reactions
    read`, con el post_id que devuelve el primero (OJO: el ID
    numérico de la URL de un reel NO es el post_id).
    """
    salida = ejecutar_cli([fb_bin, "post", "read", "--url", url], 60,
                          f"facebook-cli post read ({url})")
    try:
        data = json.loads(salida)
    except json.JSONDecodeError:
        raise SystemExit(
            f"error: facebook-cli post read devolvió salida no JSON "
            f"para {url}")
    posts = data.get("posts") or []
    if not posts:
        raise SystemExit(f"error: facebook-cli no devolvió datos para {url}")
    p = posts[0]
    reacciones = None
    post_id = p.get("post_id")
    if post_id:
        salida2 = ejecutar_cli(
            [fb_bin, "post", "reactions", "read", "--post-id", post_id],
            60, f"facebook-cli post reactions read ({post_id})")
        try:
            data2 = json.loads(salida2)
        except json.JSONDecodeError:
            raise SystemExit(
                "error: facebook-cli post reactions read devolvió "
                f"salida no JSON para {post_id}")
        reacciones = (data2.get("summary") or {}).get("total_count")
        reacciones = int(reacciones) if reacciones is not None else None
    return {
        "id": post_id or url,
        "titulo": titulo_desde_caption(p.get("post_caption")),
        "url": p.get("url") or url,
        "senial": reacciones,
        "reacciones": reacciones,
        "comentarios": p.get("comments"),
        "media_type": p.get("media_type"),
        "publicado": parse_fecha_api(p.get("created_at")),
        "fb_username": p.get("username"),
        "fb_owner": p.get("owner_name"),
        "fb_slug": _slug_facebook(p.get("profile_url")),
        "fb_owner_id": p.get("owner_id"),
    }


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


def analizar_canal(nombre: str, items: list[dict], fecha_ref: date) -> dict:
    """Mediana y outliers de una cuenta (misma matemática, 3 plataformas).

    La señal (`senial`) es vistas en YouTube, likes en Instagram y
    reacciones en Facebook. La mediana se calcula solo con
    publicaciones de más de 7 días (las recientes aún no acumularon
    señal). Solo esas se clasifican; una publicación reciente con
    multiplicador alto va a 'recientes_a_vigilar', no a outliers.
    """
    for v in items:
        pub = v.get("publicado")
        v["edad_dias"] = (fecha_ref - pub).days if pub else None

    base = [v for v in items
            if v.get("senial") is not None
            and v.get("edad_dias") is not None
            and v["edad_dias"] > RECIENTE_DIAS]
    mediana = statistics.median([v["senial"] for v in base]) if base else None

    outliers, recientes = [], []
    for v in items:
        senial = v.get("senial")
        mult = None
        if senial is not None and mediana:
            mult = senial / mediana
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
        "n_items": len(items),
        "n_base": len(base),
        "n_sin_senial": sum(1 for v in items if v.get("senial") is None),
        "n_sin_fecha": sum(1 for v in items if v.get("publicado") is None),
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


def _num(n: int | float | None) -> str:
    if n is None:
        return "s/d"
    return f"{n:,.0f}".replace(",", ".")


def _item_md(v: dict, plataforma: str) -> str:
    fecha = v["publicado"].isoformat() if v.get("publicado") else "s/d"
    senial = _num(v.get("senial"))
    mult = f"{v['multiplicador']}x" if v.get("multiplicador") is not None else "s/d"
    clase = f" · **{v['clasificacion'].upper()}**" if v.get("clasificacion") else ""
    etiqueta = PLATAFORMAS[plataforma]["senial"]
    if plataforma == "youtube":
        return (f"- [{v['titulo']}]({v['url']}) — {senial} {etiqueta} · "
                f"{mult} · {fecha} · {_duracion_txt(v.get('duracion_s'))}{clase}")
    com = (f" · {v['comentarios']} comentarios"
           if v.get("comentarios") is not None else "")
    tipo = f" · {v['media_type']}" if v.get("media_type") else ""
    return (f"- [{v['titulo']}]({v['url']}) — {senial} {etiqueta}{com} · "
            f"{mult} · {fecha}{tipo}{clase}")


def _item_json(v: dict, plataforma: str) -> dict:
    base = {
        "titulo": v["titulo"],
        "url": v["url"],
        "multiplicador": v.get("multiplicador"),
        "clasificacion": v.get("clasificacion"),
        "publicado": v["publicado"].isoformat() if v.get("publicado") else None,
    }
    if plataforma == "youtube":
        base["vistas"] = v.get("vistas")
        base["duracion_s"] = v.get("duracion_s")
    elif plataforma == "instagram":
        base["likes"] = v.get("likes")
        base["comentarios"] = v.get("comentarios")
        base["media_type"] = v.get("media_type")
    else:
        base["reacciones"] = v.get("reacciones")
        base["comentarios"] = v.get("comentarios")
        base["media_type"] = v.get("media_type")
    return base


_NOTA_METODO = {
    "youtube": ("Mediana por canal sobre videos de más de 7 días; "
                "outlier ≥3x, breakout ≥10x. Estadísticas: instantánea "
                "semanal (la API de YouTube no permite almacenarlas más "
                "de 30 días)."),
    "instagram": ("Señal principal: likes por publicación — Instagram "
                  "no expone las vistas de las publicaciones de otras "
                  "cuentas, así que los likes son la señal disponible "
                  "(comentarios como secundaria). Mediana por cuenta "
                  "sobre publicaciones de más de 7 días; outlier ≥3x, "
                  "breakout ≥10x."),
    "facebook": ("Señal principal: reacciones por publicación. La "
                 "muestra es la lista de URLs recogida para este "
                 "escaneo (el conector de Facebook no lista las "
                 "publicaciones de una Página); la mediana es "
                 "conservadora y puede no representar el historial "
                 "completo de la Página. Mediana por Página sobre "
                 "publicaciones de más de 7 días; outlier ≥3x, "
                 "breakout ≥10x."),
}


def escribir_informe(resultados: list[dict], omitidos: list[dict],
                     fallos: list[dict], fecha: str, backend: str,
                     unidades: int, out_dir: str, plataforma: str,
                     extras: dict | None = None) -> tuple[str, str]:
    """Escribe el informe .md y .json de una plataforma en out_dir.

    YouTube: outliers-FECHA.md/.json (contrato existente).
    Instagram: outliers-instagram-FECHA.md/.json.
    Facebook: outliers-facebook-FECHA.md/.json. `extras` (solo FB):
    n_urls procesadas y páginas de referencia sin publicaciones.
    """
    extras = extras or {}
    meta = PLATAFORMAS[plataforma]
    os.makedirs(out_dir, exist_ok=True)
    base = os.path.join(out_dir, f"{meta['prefijo']}-{fecha}")

    todos = [v for r in resultados for v in r["outliers"]]
    todos.sort(key=lambda v: v["multiplicador"], reverse=True)
    top = todos[:TOP_GLOBAL]

    cabecera = (f"Backend: **{backend}** · "
                f"{meta['escaneados']}: {len(resultados)}"
                + (f" · Unidades de API gastadas: {unidades}"
                   if backend == "api" else "")
                + (f" · URLs procesadas: {extras['n_urls']}"
                   if "n_urls" in extras else "")
                + f" · Outliers: {len(todos)} "
                f"({sum(1 for v in todos if v['clasificacion'] == 'breakout')} breakout)")
    lineas = [f"# Outliers de {meta['titulo']} — {fecha}",
              "",
              cabecera,
              "",
              _NOTA_METODO[plataforma],
              ""]
    lineas.append("## Top 3 global")
    lineas.append("")
    if top:
        for v in top:
            canal = next(r["canal"] for r in resultados if v in r["outliers"])
            lineas.append(_item_md(v, plataforma) + f" · {canal}")
    else:
        lineas.append("Sin outliers esta semana.")
    lineas.append("")

    for r in resultados:
        med = _num(r["mediana"])
        aviso = (" · ⚠ mediana poco fiable "
                 f"(base de {r['n_base']} "
                 f"{_plural(r['n_base'], meta['item'], meta['items'])})"
                 if 0 < r["n_base"] < BASE_MINIMA_FIABLE else "")
        lineas.append(f"## {r['canal']}")
        lineas.append("")
        lineas.append(f"Mediana: {med} {meta['senial']} · "
                      f"{meta['analizados']}: "
                      f"{r['n_items']} (base de mediana: {r['n_base']}){aviso}")
        if r.get("configurada") is False:
            lineas.append("Página no configurada en trend-channels.json; "
                          "atribuida por los datos del post.")
        lineas.append("")
        if r["outliers"]:
            for v in r["outliers"]:
                lineas.append(_item_md(v, plataforma))
        else:
            lineas.append("Sin outliers esta semana.")
        if r["recientes_a_vigilar"]:
            lineas.append("")
            lineas.append("Recientes a vigilar (≤7 días, ≥3x, aún sin clasificar):")
            for v in r["recientes_a_vigilar"]:
                lineas.append(_item_md(v, plataforma))
        lineas.append("")

    if omitidos:
        lineas.append(f"## {meta['omitidos']}")
        lineas.append("")
        for c in omitidos:
            lineas.append(f"- {c.get('nombre')}: {c.get('motivo')}")
        lineas.append("")
    if fallos:
        lineas.append(f"## {meta['con_error']}")
        lineas.append("")
        for f in fallos:
            lineas.append(f"- {f['canal']}: {f['error']}")
        lineas.append("")
    sin_urls = extras.get("paginas_sin_urls") or []
    if sin_urls:
        lineas.append("## Páginas de referencia sin publicaciones en este escaneo")
        lineas.append("")
        for p in sin_urls:
            lineas.append(f"- {p['nombre']} (facebook.com/{p['facebook_handle']}): "
                          f"sin URLs en la lista ni en los digests; añade "
                          f"URLs con --fb-urls para incluirla.")
        lineas.append("")

    with open(base + ".md", "w", encoding="utf-8") as f:
        f.write("\n".join(lineas))

    clave_n = "n_videos" if plataforma == "youtube" else "n_publicaciones"
    canales_json = []
    for r in resultados:
        entrada = {
            "canal": r["canal"],
            "mediana": r["mediana"],
            clave_n: r["n_items"],
            "n_base": r["n_base"],
            "mediana_fiable": r["n_base"] >= BASE_MINIMA_FIABLE,
            "outliers": [_item_json(v, plataforma) for v in r["outliers"]],
            "recientes_a_vigilar": [_item_json(v, plataforma)
                                    for v in r["recientes_a_vigilar"]],
        }
        if plataforma == "facebook":
            entrada["configurada"] = r.get("configurada", True)
        canales_json.append(entrada)
    data = {
        "fecha": fecha,
        "plataforma": plataforma,
        "backend": backend,
        "unidades_api": unidades if backend == "api" else 0,
        "top_global": [_item_json(v, plataforma) for v in top],
        "canales": canales_json,
        "omitidos": [{"nombre": c.get("nombre"), "motivo": c.get("motivo")}
                     for c in omitidos],
        "fallos": fallos,
    }
    if plataforma == "facebook":
        data["paginas_sin_urls"] = sin_urls
    with open(base + ".json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    return base + ".md", base + ".json"


# --- Escaneo por plataforma --------------------------------------------

def scan_youtube(args: argparse.Namespace, canales: list[dict],
                 fecha: str, fecha_ref: date, out_dir: str) -> int:
    activos, omitidos = canales_plataforma(canales, "youtube")
    try:
        activos = filtrar_only(activos, args.only, "youtube")
    except SystemExit as e:
        print(e, file=sys.stderr)
        return 2
    if not activos:
        print("error: ningún canal escaneable por YouTube en la config",
              file=sys.stderr)
        return 1
    backend = elegir_backend(args.backend)
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
        print(f"{nombre}: {len(videos)} "
              f"{_plural(len(videos), 'video', 'videos')}, "
              f"mediana {resultados[-1]['mediana']}, "
              f"{len(resultados[-1]['outliers'])} outliers")
    if not resultados:
        print("error: ningún canal pudo escanearse", file=sys.stderr)
        return 1
    md, js = escribir_informe(resultados, omitidos, fallos, fecha,
                              backend, cuota.usadas, out_dir, "youtube")
    print(f"informe: {md}")
    print(f"datos: {js}")
    return 0


def scan_instagram(args: argparse.Namespace, canales: list[dict],
                   fecha: str, fecha_ref: date, out_dir: str) -> int:
    activos, omitidos = canales_plataforma(canales, "instagram")
    try:
        activos = filtrar_only(activos, args.only, "instagram")
    except SystemExit as e:
        print(e, file=sys.stderr)
        return 2
    if not activos:
        print("error: ninguna cuenta escaneable por Instagram en la config",
              file=sys.stderr)
        return 1
    account_id = resolver_instagram_account_id(args.instagram_account_id,
                                               args.instagram_cli)
    resultados, fallos = [], []
    for cuenta in activos:
        nombre = cuenta["nombre"]
        try:
            items = fetch_instagram(cuenta["instagram_handle"], args.max,
                                    account_id, args.instagram_cli,
                                    fecha_ref)
        except RateLimitError as e:
            # 429: detener el proveedor, informe parcial, sin reintentos.
            fallos.append({"canal": nombre, "error": f"rate limit: {e}"})
            print(f"aviso: rate limit en Instagram; escaneo parcial: {e}",
                  file=sys.stderr)
            break
        except SystemExit as e:
            fallos.append({"canal": nombre, "error": str(e)})
            print(f"aviso: {nombre}: {e}", file=sys.stderr)
            continue
        resultados.append(analizar_canal(nombre, items, fecha_ref))
        print(f"{nombre}: {len(items)} "
              f"{_plural(len(items), 'publicación', 'publicaciones')}, "
              f"mediana {resultados[-1]['mediana']} likes, "
              f"{len(resultados[-1]['outliers'])} outliers")
    if not resultados:
        print("error: ninguna cuenta de Instagram pudo escanearse",
              file=sys.stderr)
        return 1
    md, js = escribir_informe(resultados, omitidos, fallos, fecha,
                              "instagram-cli", 0, out_dir, "instagram")
    print(f"informe: {md}")
    print(f"datos: {js}")
    return 0


def _plural(n: int, singular: str, plural: str) -> str:
    return singular if n == 1 else plural


def _nombre_pagina_facebook(post: dict,
                            activos: list[dict]) -> tuple[str, bool]:
    """Nombre de una Página a partir de un post suyo.

    Si el slug coincide con una Página configurada, usa su nombre;
    si no, usa el nombre del dueño con el slug entre paréntesis
    (dos Páginas distintas pueden compartir nombre: fcbayern.en y
    fcbayern.es se llaman ambas «FC Bayern München») y la marca
    como no configurada.
    """
    slug = (post.get("fb_slug") or "").lower()
    for c in activos:
        if (c.get("facebook_handle") or "").lower() == slug:
            return c["nombre"], True
    nombre = post.get("fb_owner") or post.get("fb_username") or slug or "desconocida"
    if post.get("fb_slug"):
        nombre = f"{nombre} (facebook.com/{post['fb_slug']})"
    return nombre, False


def scan_facebook(args: argparse.Namespace, canales: list[dict],
                  fecha: str, fecha_ref: date, out_dir: str) -> int:
    activos, omitidos = canales_plataforma(canales, "facebook")
    urls: list[str] = []
    for ruta in args.fb_urls or []:
        urls += leer_urls_fb(ruta)
    if not args.no_digest:
        urls += descubrir_urls_digest(args.digest_dir, args.digest_days,
                                      fecha_ref)
    urls = list(dict.fromkeys(urls))
    if not urls:
        print("error: sin URLs de Facebook: pasa --fb-urls FICHERO "
              "(una URL de post por línea) o deja que el escaneo "
              "descubra URLs en los digests del radar (--digest-dir)",
              file=sys.stderr)
        return 1
    print(f"Facebook: {len(urls)} URLs a enriquecer")
    posts, fallos = [], []
    for url in urls:
        try:
            posts.append(fetch_facebook_post(url, args.facebook_cli))
        except RateLimitError as e:
            # 429: detener el proveedor, informe parcial, sin reintentos.
            fallos.append({"canal": url, "error": f"rate limit: {e}"})
            print(f"aviso: rate limit en Facebook; escaneo parcial: {e}",
                  file=sys.stderr)
            break
        except SystemExit as e:
            fallos.append({"canal": url, "error": str(e)})
            print(f"aviso: {url}: {e}", file=sys.stderr)
        time.sleep(PAUSA_FB_SEG)

    grupos: dict[str, list[dict]] = {}
    for p in posts:
        # owner_id es la identidad estable de la Página (el mismo
        # nombre puede ser varias Páginas: fcbayern.en y fcbayern.es).
        clave = (p.get("fb_owner_id")
                 or (p.get("fb_slug") or p.get("fb_username")
                     or p.get("fb_owner") or "desconocida").lower())
        grupos.setdefault(clave, []).append(p)
    paginas = []
    for items in grupos.values():
        nombre, configurada = _nombre_pagina_facebook(items[0], activos)
        paginas.append((nombre, configurada, items))
    paginas.sort(key=lambda t: t[0].lower())
    resultados = []
    for nombre, configurada, items in paginas:
        if args.only and not any(o.lower() in nombre.lower()
                                 for o in args.only):
            continue
        items = sorted(items, key=lambda v: v["publicado"] or date.min,
                       reverse=True)[:args.max]
        r = analizar_canal(nombre, items, fecha_ref)
        r["configurada"] = configurada
        resultados.append(r)
        print(f"{nombre}: {len(items)} "
              f"{_plural(len(items), 'publicación', 'publicaciones')}, "
              f"mediana {r['mediana']} reacciones, "
              f"{len(r['outliers'])} outliers")
    if args.only and not resultados:
        print(f"error: --only no coincide con ninguna página de "
              f"Facebook: {args.only}", file=sys.stderr)
        return 2
    if not resultados:
        print("error: ninguna publicación de Facebook pudo enriquecerse",
              file=sys.stderr)
        return 1
    claves_vistas = {(p.get("fb_slug") or p.get("fb_username")
                      or p.get("fb_owner") or "").lower() for p in posts}
    paginas_sin_urls = [{"nombre": c["nombre"],
                         "facebook_handle": c["facebook_handle"]}
                        for c in activos
                        if (c.get("facebook_handle") or "").lower()
                        not in claves_vistas]
    md, js = escribir_informe(
        resultados, omitidos, fallos, fecha, "facebook-cli", 0,
        out_dir, "facebook",
        extras={"n_urls": len(urls), "paginas_sin_urls": paginas_sin_urls})
    print(f"informe: {md}")
    print(f"datos: {js}")
    return 0


# --- CLI -----------------------------------------------------------------

def construir_cli() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="outliers.py",
        description="Escáner de outliers de YouTube, Instagram y "
                    "Facebook para preproducción (reemplazo gratis de "
                    "vidIQ).")
    sub = parser.add_subparsers(dest="comando", required=True)
    p = sub.add_parser("scan", help="escanea las cuentas de referencia "
                       "y escribe el informe de outliers")
    p.add_argument("--platform", choices=["youtube", "instagram",
                                          "facebook", "all"],
                   default="youtube",
                   help="plataforma a escanear (defecto: youtube; "
                        "all corre las tres, un informe por plataforma)")
    p.add_argument("--channels", default=None,
                   help="fichero de canales (defecto: "
                        "preprod/trend-channels.json)")
    p.add_argument("--max", type=int, default=DEFAULT_MAX,
                   help=f"publicaciones recientes por cuenta "
                        f"(defecto: {DEFAULT_MAX}; los escaneos "
                        f"semanales de IG/FB usan 30; en Instagram es "
                        f"un objetivo, no un tope estricto: el escaneo "
                        f"puede traer hasta el triple para completar "
                        f"la base de la mediana)")
    p.add_argument("--backend", choices=["api", "ytdlp", "auto"],
                   default="auto",
                   help="solo YouTube: api (YouTube Data API v3, "
                        "necesita YOUTUBE_API_KEY); ytdlp: yt-dlp local, "
                        "sin clave; auto: api si hay clave, si no ytdlp")
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
    p.add_argument("--instagram-cli", default=INSTAGRAM_BIN_DEFECTO,
                   help="binario instagram-cli (defecto: en el PATH)")
    p.add_argument("--facebook-cli", default=FACEBOOK_BIN_DEFECTO,
                   help="binario facebook-cli (defecto: en el PATH)")
    p.add_argument("--instagram-account-id", default=None,
                   help="ID de la cuenta propia de Instagram; si no se "
                        "pasa, usa INSTAGRAM_ACCOUNT_ID o autodetecta "
                        "con instagram-cli accounts")
    p.add_argument("--fb-urls", action="append", default=[],
                   help="solo Facebook: fichero con URLs de posts, una "
                        "por línea (repetible)")
    p.add_argument("--digest-dir", default=DIGEST_DIR_DEFECTO,
                   help="solo Facebook: directorio de digests del radar "
                        "para descubrir URLs")
    p.add_argument("--digest-days", type=int, default=DIGEST_DIAS_DEFECTO,
                   help="solo Facebook: días de digests hacia atrás "
                        f"(defecto: {DIGEST_DIAS_DEFECTO})")
    p.add_argument("--no-digest", action="store_true",
                   help="solo Facebook: no descubrir URLs en los digests "
                        "(solo --fb-urls)")
    p.add_argument("--only", action="append", default=[],
                   help="escanear solo las cuentas cuyo nombre contenga "
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

    canales = cargar_canales(ruta_canales)
    plataformas = (["youtube", "instagram", "facebook"]
                   if args.platform == "all" else [args.platform])
    escaneos = {"youtube": scan_youtube,
                "instagram": scan_instagram,
                "facebook": scan_facebook}
    codigo = 0
    for plat in plataformas:
        try:
            rc = escaneos[plat](args, canales, fecha, fecha_ref, out_dir)
        except SystemExit as e:
            # Error de uso de una plataforma (p. ej. api sin clave):
            # se registra y se sigue con las demás.
            print(e, file=sys.stderr)
            rc = e.code if isinstance(e.code, int) else 1
        if rc != 0:
            codigo = rc
    return codigo


def main(argv: list[str] | None = None) -> int:
    parser = construir_cli()
    args = parser.parse_args(argv)
    if args.comando == "scan":
        return cmd_scan(args)
    parser.print_help(sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
