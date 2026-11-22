#!/usr/bin/env python3
"""Medición semanal del contenido PROPIO para la preproducción.

El escáner de outliers (`outliers.py`) mira cuentas de REFERENCIA;
este módulo cierra el círculo: mide lo que rinde el contenido propio
de cada perfil (por defecto, el Memorial de la Denuncia) en Facebook
e Instagram y devuelve los hallazgos al ranking y a FORMATOS.md.

Núcleo general + perfiles: la matemática y el informe son genéricos
(principio de reutilización, 21-nov-2026); lo de cada proyecto vive
en `preprod/medicion-config.json` (un perfil por proyecto: cuentas,
base histórica). El Memorial es un perfil más, no el sistema entero.

Por plataforma, la señal principal es la mejor disponible:

- Facebook: REACCIONES por publicación. Vía preferida, `pages posts
  list` sobre la Página administrada (señal: interacciones
  —engagements—, la que esa vía expone); vía de trabajo, lectura
  pública por URL (`post read` + `post reactions read`, como el
  escáner). El descubrimiento de Páginas del conector devuelve
  vacío para el Memorial (verificado 21-oct y 21-nov-2026: `pages
  list` vacío, `pages access` 403), así que hoy la vía de trabajo
  es la de URLs y la vía de Páginas queda implementada y probada
  con fixtures, lista para cuando el conector descubra la Página.
  La base histórica puede sembrarse desde el CSV de la auditoría
  de octubre de 2026 (`--fb-base-csv`): 40 publicaciones de feed
  con las métricas de Meta Business Suite (las 25 Historias del
  CSV se excluyen: no son publicaciones del feed).
- Instagram: LIKES por publicación (lectura pública del perfil, con
  la cuenta personal como lectora). Las métricas propias
  (Views, Accounts reached) necesitan la sesión del Memorial
  activa: sin ella, `individual-post-insights` devuelve
  `media_not_found` y el informe registra el bloqueo con precisión
  (qué falta: código nuevo al correo del Memorial).

Matemática (mismo espíritu que `outliers.py`): mediana propia por
plataforma y por tipo (reel/carrusel/foto/post) sobre publicaciones
de más de 7 días; cada publicación de la semana (últimos 7 días) se
compara contra su mediana: DESTACADO >= 3x, FLOJO <= 0,5x. Top 3 y
bottom 3 de la semana con enlaces. El análisis de mejor hora/día
solo se emite si los datos lo sostienen (n >= 10 y grupos con n >= 3
y ratio >= 1,5x); si no, el informe dice que no hay patrón claro.
Nunca se sobre-interpretan muestras pequeñas.

Regla de retroalimentación: el módulo NUNCA edita FORMATOS.md. El
informe propone hallazgos en la sección «Hallazgos para
FORMATOS.md», cada uno con su evidencia (números y enlaces); el
agente semanal los aplica con la misma disciplina que el escaneo de
tendencias (solo lo verificado, con nota de versión). La garantía
está cubierta por tests (`tests/preprod/measure.test.mjs`):
estático (el script no menciona la edición) + ejecución (una corrida
completa no toca FORMATOS.md).

Ante un 429 / rate limit de un proveedor, la medición se DETIENE
en ese proveedor, escribe el informe parcial con lo recogido y no
reintenta por otra vía. Solo lectura: no publica, no da like, no
sigue, no comenta. Ningún secreto en el repo: el ID de la cuenta
propia de Instagram se resuelve por flag, variable o autodetección
(como en `outliers.py`) y nunca se imprime ni se guarda.
"""

import argparse
import csv
import json
import os
import re
import statistics
import sys
import time
from datetime import date, datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from outliers import (  # noqa: E402  (reutilización, no duplicación)
    BASE_MINIMA_FIABLE,
    PAUSA_FB_SEG,
    RECIENTE_DIAS,
    RateLimitError,
    descubrir_urls_digest,
    ejecutar_cli,
    fetch_facebook_post,
    fetch_instagram,
    hoy_iso,
    leer_urls_fb,
    parse_fecha_api,
    resolver_instagram_account_id,
    titulo_desde_caption,
)

# --- Constantes ------------------------------------------------------

VENTANA_DIAS = 7        # la semana medida: publicaciones con 0-7 días
DESTACADO_MIN = 3.0     # multiplicador mínimo para marcar destacado
FLOJO_MAX = 0.5         # multiplicador máximo para marcar flojo
MIN_TIPO = 3            # base mínima por tipo para calcular su mediana
MIN_HORA_DIA = 10       # publicaciones con hora para analizar hora/día
MIN_GRUPO_HORA = 3      # n mínimo por franja/día para comparar
RATIO_HORA_DIA = 1.5    # ratio mínimo entre franjas para hablar de patrón
RATIO_HALLAZGO_TIPO = 2.0  # ratio mínimo entre medianas de tipos
TOP_N = 3               # destacados y flojos destacados en el informe
MAX_INSIGHTS = 20       # tope de posts con insights propios por corrida
FACEBOOK_BIN_DEFECTO = "facebook-cli"
INSTAGRAM_BIN_DEFECTO = "instagram-cli"
DIGEST_DIR_DEFECTO = os.path.expanduser(
    "~/workspace/goals/resumen-diario-de-redes-sociales/hidden_files/")
DIGEST_DIAS_DEFECTO = 7

TIPOS = ["reel", "carrusel", "foto", "post"]
ETIQUETA_TIPO = {"reel": "reels", "carrusel": "carruseles",
                 "foto": "fotos", "post": "posts"}

FRANJAS = [("madrugada", 0, 6), ("mañana", 6, 12),
           ("tarde", 12, 18), ("noche", 18, 24)]
DIAS_SEMANA = ["lunes", "martes", "miércoles", "jueves",
               "viernes", "sábado", "domingo"]


def _num(n):
    if n is None:
        return "s/d"
    if isinstance(n, float) and n != int(n):
        return f"{n:,.1f}".replace(",", ".")
    return f"{n:,.0f}".replace(",", ".")


def _plural(n, singular, plural):
    return singular if n == 1 else plural


def parse_fecha_hora(valor):
    """Fecha+hora de los CLI ('2026-11-20 06:00:06', ISO con zona)."""
    if not valor:
        return None
    texto = str(valor).strip()
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S%z",
                "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(texto[:19]
                                     if fmt.endswith("%S") and len(texto) > 19
                                     and texto[19] in "+-"
                                     else texto, fmt)
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(texto.replace("Z", "+00:00"))
    except ValueError:
        return None


def normalizar_tipo(raw, url):
    """Tipo canónico (reel/carrusel/foto/post) desde el tipo crudo.

    En este ecosistema los videos son reels (las URLs lo confirman:
    /reel/); un video sin /reel/ se trata igual, porque la distinción
    video/reel no existe en los datos que los CLI devuelven.
    """
    r = (raw or "").lower()
    u = (url or "").lower()
    if "carrusel" in r or "carousel" in r or "varios archivos" in r:
        return "carrusel"
    if "reel" in r or "video" in r or "/reel/" in u:
        return "reel"
    if "foto" in r or "photo" in r or "image" in r or "/photo" in u:
        return "foto"
    return "post"


# --- Config de perfiles ------------------------------------------------

def cargar_perfil(ruta_config, nombre):
    """Lee preprod/medicion-config.json y devuelve el perfil pedido."""
    try:
        with open(ruta_config, encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        raise SystemExit(
            f"error: no existe el fichero de perfiles: {ruta_config}")
    except json.JSONDecodeError as e:
        raise SystemExit(
            f"error: el fichero de perfiles no es JSON válido: {e}")
    perfiles = data.get("perfiles") or {}
    if nombre not in perfiles:
        raise SystemExit(
            f"error: no hay un perfil {nombre!r} en {ruta_config} "
            f"(perfiles: {', '.join(sorted(perfiles)) or 'ninguno'})")
    return perfiles[nombre]


# --- Base histórica desde el CSV de la auditoría ------------------------

COLUMNAS_CSV = {
    "fecha": ("fecha",),
    "formato": ("formato",),
    "titulo": ("título", "titulo"),
    "visualizaciones": ("visualizaciones",),
    "alcance": ("alcance",),
    "interacciones": ("interacciones",),
    "reacciones": ("me gusta y reacciones", "reacciones"),
    "comentarios": ("comentarios",),
    "compartidos": ("veces compartido", "compartidos"),
    "url": ("enlace directo", "enlace", "url"),
}


def _entero_csv(valor):
    """Entero desde una celda del CSV de Meta (1.234, 1234, '1,0 mil').

    Meta exporta las cifras grandes en español ('1,0 mil' = 1000,
    '14,2 mil' = 14200); sin el sufijo, los miles van con punto.
    Lo que no se puede leer es None (desconocido, no cero).
    """
    if valor is None:
        return None
    texto = str(valor).strip().lower()
    if not texto:
        return None
    if texto.endswith("mil"):
        numero = texto[:-3].strip().replace(".", "").replace(",", ".")
        try:
            return int(round(float(numero) * 1000))
        except ValueError:
            return None
    texto = texto.replace(".", "").replace(",", "")
    if not texto:
        return None
    try:
        return int(texto)
    except ValueError:
        return None


def leer_base_csv(ruta):
    """Publicaciones históricas desde el CSV de la auditoría (oct-2026).

    El CSV es la exportación de Meta Business Suite de la auditoría
    del 21-oct-2026 (65 filas, 11-sep → 20-oct): fecha, formato de
    Meta, métricas (visualizaciones, alcance, interacciones,
    reacciones, comentarios, compartidos) y enlace directo. La señal
    es reacciones. Se excluyen las Historias (25 filas: no son
    publicaciones del feed, no tienen enlace y su dinámica de 24 h
    no es comparable) y las filas sin enlace http (la auditoría
    marcó alguna como NO OBTENIBLE). Se deduplica por URL. Archivo
    ausente -> error claro (la base es opcional en la CLI: si no se
    pasa --fb-base-csv, no se llama a esta función).
    """
    try:
        with open(ruta, encoding="utf-8-sig", newline="") as f:
            filas = list(csv.DictReader(f))
    except FileNotFoundError:
        raise SystemExit(
            f"error: no existe el CSV de base histórica: {ruta}")
    except csv.Error as e:
        raise SystemExit(f"error: el CSV de base no se pudo leer: {e}")
    if not filas:
        return []
    columnas = {}
    for campo, variantes in COLUMNAS_CSV.items():
        for clave in filas[0].keys():
            if clave is None:
                continue
            kl = clave.strip().lower()
            if any(kl.startswith(v) for v in variantes):
                columnas[campo] = clave
                break
    if "fecha" not in columnas or "url" not in columnas:
        raise SystemExit(
            "error: el CSV de base no trae las columnas de fecha y "
            "enlace que la medición necesita")
    posts = []
    vistos = set()
    for fila in filas:
        url = (fila.get(columnas["url"]) or "").strip()
        fecha = parse_fecha_api(
            (fila.get(columnas["fecha"]) or "").strip())
        formato = (fila.get(columnas["formato"])
                   if "formato" in columnas else "") or ""
        # Solo publicaciones del feed con enlace http: las Historias
        # no son comparables y las filas sin enlace (NO OBTENIBLE)
        # no se pueden verificar ni deduplicar.
        if not url.startswith("http") or fecha is None:
            continue
        if formato.strip().lower() == "historia":
            continue
        if url in vistos:
            continue
        vistos.add(url)
        reacciones = _entero_csv(
            fila.get(columnas["reacciones"])) if "reacciones" in columnas else None
        titulo = (fila.get(columnas["titulo"]) or "").strip() \
            if "titulo" in columnas else ""
        posts.append({
            "id": url,
            "titulo": titulo_desde_caption(titulo) if titulo else "(sin texto)",
            "url": url,
            "plataforma": "facebook",
            "tipo": normalizar_tipo(
                formato,
                url),
            "publicado": fecha,
            "publicado_dt": None,
            "senial": reacciones,
            "reacciones": reacciones,
            "comentarios": _entero_csv(
                fila.get(columnas["comentarios"])) if "comentarios" in columnas else None,
            "compartidos": _entero_csv(
                fila.get(columnas["compartidos"])) if "compartidos" in columnas else None,
            "visualizaciones": _entero_csv(
                fila.get(columnas["visualizaciones"])) if "visualizaciones" in columnas else None,
            "alcance": _entero_csv(
                fila.get(columnas["alcance"])) if "alcance" in columnas else None,
            "interacciones": _entero_csv(
                fila.get(columnas["interacciones"])) if "interacciones" in columnas else None,
            "fuente": "csv",
        })
    return posts


def _clave_dedupe(p):
    """Clave de deduplicación de una publicación de Facebook.

    La URL canónica que devuelve `post read` difiere de la URL de
    la lista y de la del CSV (otro pfbid y el owner_id en vez del
    handle), así que la misma publicación puede venir dos veces
    (en vivo + CSV) con URLs distintas. La clave es (fecha, inicio
    del título normalizado): ambas fuentes derivan del mismo texto.
    Sin fecha o sin título, la publicación no se deduplica.
    """
    fecha = p.get("publicado").isoformat() if p.get("publicado") else ""
    titulo = re.sub(r"[^a-z0-9]+", " ",
                    (p.get("titulo") or "").lower()).strip()
    if not fecha or not titulo or titulo == "(sin texto)":
        return ("__unico__", p.get("url") or p.get("id") or str(id(p)))
    return (fecha, titulo[:60])


def deduplicar_posts(posts):
    """Elimina duplicados de la misma publicación (gana la primera).

    Los vivos van primero en la lista, así que gana la versión en
    vivo (más fresca) sobre la del CSV.
    """
    vistos = {}
    for p in posts:
        clave = _clave_dedupe(p)
        if clave not in vistos:
            vistos[clave] = p
    return list(vistos.values())


# --- Facebook: vía de Páginas (preferida, hoy bloqueada) ----------------

def resolver_pagina_fb(fb_bin, perfil):
    """Busca la Página del perfil en `pages list` (Páginas administradas).

    Devuelve (page_id, None) o (None, motivo). El `pages list` del
    conector devuelve vacío para el Memorial (verificado 21-oct y
    21-nov-2026), así que hoy esto devuelve el motivo y la medición
    cae a la vía de URLs. La coincidencia es por profile_id
    (owner_id de la config) y, si no, por nombre exacto.
    """
    fb = perfil.get("facebook") or {}
    owner_id = str(fb.get("owner_id") or "")
    nombre = (fb.get("nombre_pagina") or perfil.get("nombre") or "").strip()
    cursor = None
    visto = 0
    while True:
        cmd = [fb_bin, "pages", "list", "--limit", "20"]
        if cursor:
            cmd += ["--after", cursor]
        salida = ejecutar_cli(cmd, 60, "facebook-cli pages list")
        try:
            data = json.loads(salida)
        except json.JSONDecodeError:
            raise SystemExit(
                "error: facebook-cli pages list devolvió salida no JSON")
        filas = data.get("data") or []
        for fila in filas:
            visto += 1
            if owner_id and str(fila.get("profile_id") or "") == owner_id:
                return fila.get("page_id"), None
            if nombre and (fila.get("name") or "").strip().lower() == nombre.lower():
                return fila.get("page_id"), None
        cursor = (data.get("paging") or {}).get("cursors", {}).get("after")
        if not cursor:
            break
    if visto == 0:
        return None, ("pages list devolvió 0 Páginas administradas "
                      "(el conector no descubre la Página; verificado "
                      "21-oct y 21-nov-2026)")
    return None, (f"pages list devolvió {visto} "
                  f"{_plural(visto, 'Página', 'Páginas')} y ninguna "
                  f"coincide con el perfil {perfil.get('nombre')!r}")


def _posts_desde_pages_list(data):
    """Extrae la lista de posts de una respuesta de `pages posts list`.

    La forma exacta de la respuesta NO se pudo verificar en vivo
    (el descubrimiento de Páginas devuelve vacío): el parseo es
    defensivo y acepta las variantes razonables (`posts`, `data`,
    o la respuesta misma como lista). Cada post acepta varias
    claves por campo; lo que no venga, queda en None.
    """
    if isinstance(data, list):
        return data
    if not isinstance(data, dict):
        return []
    for clave in ("posts", "data", "items"):
        valor = data.get(clave)
        if isinstance(valor, list):
            return valor
    return []


def _campo_post_pages(p, *claves):
    for clave in claves:
        valor = p.get(clave)
        if valor is not None:
            return valor
    metricas = p.get("metrics") or p.get("insights") or {}
    if isinstance(metricas, dict):
        for clave in claves:
            if metricas.get(clave) is not None:
                return metricas[clave]
    return None


def _entero(valor):
    if valor is None:
        return None
    try:
        return int(valor)
    except (TypeError, ValueError):
        return None


def fetch_facebook_pages(page_id, fb_bin, fecha_ref):
    """Posts recientes + insights de la Página vía `pages` (administrada).

    `pages posts list` (LAST_28D, 10 por página, con cursor) trae
    vistas e interacciones por post; `pages account-insights`
    (LAST_7D) trae el total de la Página y los seguidores. La señal
    de esta vía es INTERACCIONES (engagements): la vía de Páginas
    no expone reacciones puras. Devuelve (posts, cuenta) donde
    cuenta trae seguidores y totales si el conector los dio.
    """
    posts = []
    cursor = None
    while True:
        cmd = [fb_bin, "pages", "posts", "list", "--page-id", page_id,
               "--time-range", "LAST_28D",
               "--fields",
               "views,unique_viewers,engagements,"
               "engagements_including_clicks,clicks,link_clicks,saves",
               "--limit", "10"]
        if cursor:
            cmd += ["--cursor", cursor]
        salida = ejecutar_cli(cmd, 60, "facebook-cli pages posts list")
        try:
            data = json.loads(salida)
        except json.JSONDecodeError:
            raise SystemExit(
                "error: facebook-cli pages posts list devolvió salida "
                "no JSON")
        for p in _posts_desde_pages_list(data):
            if not isinstance(p, dict):
                continue
            creado = _campo_post_pages(
                p, "created_time", "created_at", "post_created_at")
            if isinstance(creado, dict):
                creado = creado.get("utc") or creado.get("user_local")
            fecha = parse_fecha_api(creado)
            dt = parse_fecha_hora(creado)
            interacciones = _entero(_campo_post_pages(p, "engagements"))
            posts.append({
                "id": _campo_post_pages(p, "post_id", "id") or "",
                "titulo": titulo_desde_caption(
                    _campo_post_pages(p, "message", "post_caption",
                                      "caption")),
                "url": _campo_post_pages(p, "permalink_url", "url") or "",
                "plataforma": "facebook",
                "tipo": normalizar_tipo(
                    _campo_post_pages(p, "media_type", "type",
                                      "format"),
                    _campo_post_pages(p, "permalink_url", "url") or ""),
                "publicado": fecha,
                "publicado_dt": dt,
                "senial": interacciones,
                "interacciones": interacciones,
                "visualizaciones": _entero(
                    _campo_post_pages(p, "views")),
                "alcance": _entero(
                    _campo_post_pages(p, "unique_viewers")),
                "comentarios": None,
                "compartidos": None,
                "fuente": "pages",
            })
        cursor = data.get("cursor") if isinstance(data, dict) else None
        if not cursor:
            break
    cuenta = {"seguidores": None, "totales": {}}
    salida = ejecutar_cli(
        [fb_bin, "pages", "account-insights", "--page-id", page_id,
         "--time-range", "LAST_7D", "--metrics",
         "follower_count,views,unique_viewers,"
         "engagement_including_clicks,profile_visits,new_followers,"
         "unfollowers"],
        60, "facebook-cli pages account-insights")
    try:
        data = json.loads(salida)
    except json.JSONDecodeError:
        raise SystemExit(
            "error: facebook-cli pages account-insights devolvió "
            "salida no JSON")
    metricas = data.get("metrics") or data if isinstance(data, dict) else {}
    if isinstance(metricas, dict):
        cuenta["seguidores"] = _entero(metricas.get("follower_count"))
        for clave in ("views", "unique_viewers",
                      "engagement_including_clicks", "profile_visits",
                      "new_followers", "unfollowers"):
            if metricas.get(clave) is not None:
                cuenta["totales"][clave] = metricas[clave]
    return posts, cuenta


# --- Facebook: vía de URLs (la que funciona hoy) ------------------------

def _es_post_del_perfil(post, perfil):
    """¿El post enriquecido es de la Página del perfil (no de otra)?

    El descubrimiento en digests puede traer URLs de otras Páginas;
    la medición es de contenido PROPIO, así que solo cuentan los
    posts cuyo owner_id coincide con la config (o, sin owner_id en
    la config, cuyo slug coincide con el handle).
    """
    fb = perfil.get("facebook") or {}
    owner_id = str(fb.get("owner_id") or "")
    if owner_id:
        return str(post.get("fb_owner_id") or "") == owner_id
    handle = (fb.get("handle") or "").lower()
    return (post.get("fb_slug") or "").lower() == handle


def fetch_facebook_urls(urls, fb_bin, perfil):
    """Enriquece URLs de posts de Facebook (lectura pública).

    Reutiliza `fetch_facebook_post` de outliers.py (`post read` +
    `post reactions read`). Devuelve (posts_propio, omitidos,
    fallos): los posts de otras Páginas se cuentan como omitidos,
    no como errores. Pausa cortés entre URLs.
    """
    posts, omitidos, fallos = [], [], []
    for url in urls:
        try:
            p = fetch_facebook_post(url, fb_bin)
        except RateLimitError:
            raise
        except SystemExit as e:
            fallos.append({"url": url, "error": str(e)})
            continue
        if not _es_post_del_perfil(p, perfil):
            omitidos.append({"url": url,
                             "motivo": "de otra Página, no del perfil"})
            continue
        fecha = p.get("publicado")
        posts.append({
            "id": p.get("id") or url,
            "titulo": p.get("titulo") or "(sin texto)",
            "url": p.get("url") or url,
            "plataforma": "facebook",
            "tipo": normalizar_tipo(p.get("media_type"), p.get("url") or url),
            "publicado": fecha,
            "publicado_dt": None,
            "senial": p.get("reacciones"),
            "reacciones": p.get("reacciones"),
            "comentarios": p.get("comentarios"),
            "compartidos": None,
            "visualizaciones": None,
            "alcance": None,
            "interacciones": None,
            "fuente": "url",
        })
        time.sleep(PAUSA_FB_SEG)
    return posts, omitidos, fallos


# --- Instagram: lectura pública + sonda de insights propios --------------

def fetch_instagram_seguidores(handle, account_id, ig_bin):
    """Seguidores del perfil desde la primera página de `posts`.

    Las filas de `posts` traen `follower_count` del autor; basta la
    primera fila propia. Si no se puede leer, devuelve None (el
    informe omite el dato, no inventa uno).
    """
    try:
        salida = ejecutar_cli(
            [ig_bin, "posts", "--username", handle,
             "--account-id", account_id],
            120, f"instagram-cli posts @{handle} (seguidores)")
        data = json.loads(salida)
    except (SystemExit, RateLimitError, json.JSONDecodeError):
        return None
    for p in data.get("posts") or []:
        if (p.get("username") or "").lower() == handle.lower():
            seguidores = p.get("follower_count")
            return int(seguidores) if seguidores is not None else None
    return None


def fetch_instagram_publico(handle, max_n, account_id, ig_bin, fecha_ref):
    """Publicaciones públicas del perfil (reutiliza outliers.py).

    Señal: likes. Filtra colaboraciones de otros autores y pagina
    hasta completar la base mínima. Devuelve posts normalizados.
    """
    items = fetch_instagram(handle, max_n, account_id, ig_bin, fecha_ref)
    posts = []
    for v in items:
        fecha = v.get("publicado")
        posts.append({
            "id": v.get("id") or "",
            "titulo": v.get("titulo") or "(sin texto)",
            "url": v.get("url") or "",
            "plataforma": "instagram",
            "tipo": normalizar_tipo(v.get("media_type"), v.get("url") or ""),
            "publicado": fecha,
            "publicado_dt": None,
            "senial": v.get("likes"),
            "likes": v.get("likes"),
            "comentarios": v.get("comentarios"),
            "compartidos": None,
            "visualizaciones": None,
            "alcance": None,
            "interacciones": None,
            "fuente": "instagram-publico",
        })
    return posts


def probar_insights_ig(post_id, owned_id, ig_bin):
    """Sonda de insights propios sobre UN post (`individual-post-insights`).

    Devuelve (metricas, bloqueo): metricas es un dict con Views y
    demás si el conector las dio; bloqueo es un dict con el motivo
    preciso si no. Sin la sesión del perfil activa, el conector
    devuelve success:false + media_not_found: el post no pertenece
    a la cuenta seleccionada. La sonda es una sola llamada: si el
    perfil no está conectado, no tiene sentido probar post por post.
    """
    salida = ejecutar_cli(
        [ig_bin, "individual-post-insights", "--account-id", owned_id,
         "--post", post_id],
        60, "instagram-cli individual-post-insights (sonda)")
    try:
        data = json.loads(salida)
    except json.JSONDecodeError:
        return None, {"via": "owned-insights",
                      "error": "salida no JSON del conector"}
    if data.get("success") is False or data.get("error"):
        error = data.get("error") or {}
        codigo = error.get("code") if isinstance(error, dict) else None
        return None, {
            "via": "owned-insights",
            "error": f"success:false, code={codigo or 'desconocido'}",
            "que_falta": ("la sesión del perfil medida activa en "
                          "Instagram (código nuevo al correo del "
                          "perfil) + --instagram-owned-id con su "
                          "cuenta"),
        }
    metricas = {}
    for clave in ("views", "reach", "accounts_reached", "likes",
                  "comments", "shares", "saves", "profile_visits"):
        if data.get(clave) is not None:
            metricas[clave] = data[clave]
    insights = data.get("insights") or {}
    if isinstance(insights, dict):
        for clave, valor in insights.items():
            metricas.setdefault(clave, valor)
    return metricas, None


# --- Matemática de medición ---------------------------------------------

def clasificar_medicion(multiplicador):
    """'destacado' >= 3x, 'flojo' <= 0,5x, si no None."""
    if multiplicador is None:
        return None
    if multiplicador >= DESTACADO_MIN:
        return "destacado"
    if multiplicador <= FLOJO_MAX:
        return "flojo"
    return None


def _patron_hora_dia(posts):
    """Patrón de hora/día, solo si los datos lo sostienen.

    Requiere n >= 10 posts con fecha+hora y señal. Compara la
    mediana por franja (madrugada/mañana/tarde/noche) y por día de
    la semana; solo se emite un patrón si el mejor grupo (n >= 3)
    rinde >= 1,5x el peor grupo (n >= 3). Devuelve un dict
    descriptivo o None. Nunca causal: es una descripción, no una
    explicación.
    """
    con_hora = [p for p in posts
                if p.get("publicado_dt") is not None
                and p.get("senial") is not None]
    if len(con_hora) < MIN_HORA_DIA:
        return None
    patrones = []
    for nombre, grupos in (
            ("franja", {f: [p for p in con_hora
                            if a <= p["publicado_dt"].hour < b]
                        for f, a, b in FRANJAS}),
            ("día", {DIAS_SEMANA[d]: [p for p in con_hora
                                      if p["publicado_dt"].weekday() == d]
                     for d in range(7)})):
        medianas = {}
        for etiqueta, items in grupos.items():
            seniales = [p["senial"] for p in items]
            if len(seniales) >= MIN_GRUPO_HORA:
                medianas[etiqueta] = (statistics.median(seniales),
                                      len(seniales))
        if len(medianas) < 2:
            continue
        mejor = max(medianas.items(), key=lambda kv: kv[1][0])
        peor = min(medianas.items(), key=lambda kv: kv[1][0])
        if peor[1][0] and mejor[1][0] >= RATIO_HORA_DIA * peor[1][0]:
            patrones.append({
                "dimension": nombre,
                "mejor": {"etiqueta": mejor[0], "mediana": mejor[1][0],
                          "n": mejor[1][1]},
                "peor": {"etiqueta": peor[0], "mediana": peor[1][0],
                         "n": peor[1][1]},
                "ratio": round(mejor[1][0] / peor[1][0], 2),
            })
    return patrones or None


def analizar_plataforma(plataforma, posts, fecha_ref, senial_etiqueta,
                        seguidores=None):
    """Medición de una plataforma: ventana de 7 días contra su mediana.

    La base es la mediana de la señal sobre publicaciones de más de
    7 días (las recientes aún no acumularon señal, igual que en
    outliers.py). Cada publicación de la ventana se clasifica
    contra esa mediana (destacado >= 3x, flojo <= 0,5x) y contra la
    mediana de su tipo cuando la hay (n >= 3 por tipo).
    """
    for p in posts:
        pub = p.get("publicado")
        p["edad_dias"] = (fecha_ref - pub).days if pub else None

    ventana = [p for p in posts
               if p.get("edad_dias") is not None
               and 0 <= p["edad_dias"] <= VENTANA_DIAS]
    base = [p for p in posts
            if p.get("edad_dias") is not None
            and p["edad_dias"] > VENTANA_DIAS]

    seniales_base = [p["senial"] for p in base if p.get("senial") is not None]
    mediana = statistics.median(seniales_base) if seniales_base else None

    medianas_tipo = {}
    for tipo in TIPOS:
        seniales = [p["senial"] for p in base
                    if p.get("tipo") == tipo and p.get("senial") is not None]
        if len(seniales) >= MIN_TIPO:
            medianas_tipo[tipo] = {"mediana": statistics.median(seniales),
                                   "n": len(seniales)}

    for p in ventana:
        senial = p.get("senial")
        mult = senial / mediana if (senial is not None and mediana) else None
        p["multiplicador"] = round(mult, 2) if mult is not None else None
        p["clasificacion"] = clasificar_medicion(mult)
        mt = medianas_tipo.get(p.get("tipo"))
        mult_tipo = (senial / mt["mediana"]
                     if (senial is not None and mt and mt["mediana"])
                     else None)
        p["multiplicador_tipo"] = (round(mult_tipo, 2)
                                   if mult_tipo is not None else None)

    con_senial = [p for p in ventana if p.get("multiplicador") is not None]
    top = sorted(con_senial, key=lambda p: p["multiplicador"],
                 reverse=True)[:TOP_N]
    bottom = sorted(con_senial, key=lambda p: p["multiplicador"])[:TOP_N]
    return {
        "plataforma": plataforma,
        "senial": senial_etiqueta,
        "seguidores": seguidores,
        "n_ventana": len(ventana),
        "n_base": len(base),
        "n_sin_senial": sum(1 for p in posts if p.get("senial") is None),
        "n_sin_fecha": sum(1 for p in posts if p.get("publicado") is None),
        "mediana": mediana,
        "mediana_fiable": len(seniales_base) >= BASE_MINIMA_FIABLE,
        "medianas_tipo": medianas_tipo,
        "ventana": ventana,
        "top": top,
        "bottom": bottom,
        "destacados": [p for p in ventana
                       if p.get("clasificacion") == "destacado"],
        "flojos": [p for p in ventana
                   if p.get("clasificacion") == "flojo"],
        "patron_hora_dia": _patron_hora_dia(posts),
    }


def generar_hallazgos(analisis):
    """Hallazgos PROPUESTOS para FORMATOS.md, solo con evidencia.

    Reglas conservadoras: comparación entre tipos solo con n >= 3
    en ambos y ratio >= 2x; semana floja de un tipo solo con >= 3
    flojos del mismo tipo; patrón de hora/día solo si la función
    de análisis lo emitió. Cada hallazgo lleva su evidencia con
    números. El módulo propone; el agente semanal aplica.
    """
    hallazgos = []
    plat = analisis["plataforma"]
    senial = analisis["senial"]
    mt = analisis["medianas_tipo"]
    if len(mt) >= 2:
        orden = sorted(mt.items(), key=lambda kv: kv[1]["mediana"])
        peor_tipo, peor = orden[0]
        mejor_tipo, mejor = orden[-1]
        if peor["mediana"] and mejor["mediana"] >= RATIO_HALLAZGO_TIPO * peor["mediana"]:
            ratio = round(mejor["mediana"] / peor["mediana"], 1)
            hallazgos.append({
                "texto": (f"En {plat}, los {ETIQUETA_TIPO[mejor_tipo]} "
                          f"rinden {ratio}x la mediana de "
                          f"{ETIQUETA_TIPO[peor_tipo]}"),
                "evidencia": (f"mediana {mejor_tipo}: {_num(mejor['mediana'])} "
                              f"{senial} (n={mejor['n']}); mediana "
                              f"{peor_tipo}: {_num(peor['mediana'])} {senial} "
                              f"(n={peor['n']}); base >7 días"),
            })
    if analisis["top"] and analisis["top"][0].get("multiplicador") is not None \
            and analisis["top"][0]["multiplicador"] >= DESTACADO_MIN:
        mejor_post = analisis["top"][0]
        hallazgos.append({
            "texto": (f"El mejor post de la semana en {plat} fue "
                      f"«{mejor_post['titulo']}» "
                      f"({mejor_post['multiplicador']}x la mediana)"),
            "evidencia": (f"{_num(mejor_post.get('senial'))} {senial} "
                          f"frente a una mediana de "
                          f"{_num(analisis['mediana'])} "
                          f"(n base={analisis['n_base']}); "
                          f"{mejor_post['url']}"),
        })
    flojos_por_tipo = {}
    for p in analisis["flojos"]:
        flojos_por_tipo.setdefault(p.get("tipo"), []).append(p)
    for tipo, items in flojos_por_tipo.items():
        if len(items) >= 3:
            hallazgos.append({
                "texto": (f"Semana floja de {ETIQUETA_TIPO[tipo]} en "
                          f"{plat}: {len(items)} de la ventana quedaron "
                          f"en 0,5x la mediana o menos"),
                "evidencia": "; ".join(
                    f"«{p['titulo']}» ({p['multiplicador']}x)"
                    for p in items),
            })
    for patron in analisis["patron_hora_dia"] or []:
        hallazgos.append({
            "texto": (f"En {plat}, por {patron['dimension']}, lo mejor "
                      f"fue {patron['mejor']['etiqueta']} "
                      f"({patron['ratio']}x sobre "
                      f"{patron['peor']['etiqueta']})"),
            "evidencia": (f"mediana {patron['mejor']['etiqueta']}: "
                          f"{_num(patron['mejor']['mediana'])} {senial} "
                          f"(n={patron['mejor']['n']}); mediana "
                          f"{patron['peor']['etiqueta']}: "
                          f"{_num(patron['peor']['mediana'])} {senial} "
                          f"(n={patron['peor']['n']}); descriptivo, no causal"),
        })
    return hallazgos[:5]


# --- Informe -------------------------------------------------------------

def _post_md(p, senial):
    fecha = p["publicado"].isoformat() if p.get("publicado") else "s/d"
    valor = _num(p.get("senial"))
    mult = f"{p['multiplicador']}x" if p.get("multiplicador") is not None else "s/d"
    mult_tipo = (f" · {p['multiplicador_tipo']}x su tipo"
                 if p.get("multiplicador_tipo") is not None else "")
    clase = f" · **{p['clasificacion'].upper()}**" if p.get("clasificacion") else ""
    com = (f" · {p['comentarios']} comentarios"
           if p.get("comentarios") is not None else "")
    comp = (f" · {p['compartidos']} compartidos"
            if p.get("compartidos") is not None else "")
    vistas = (f" · {_num(p.get('visualizaciones'))} vistas"
              if p.get("visualizaciones") is not None else "")
    return (f"- [{p['titulo']}]({p['url']}) — {valor} {senial}{com}{comp}"
            f"{vistas} · {mult}{mult_tipo} · {fecha} · {p.get('tipo')}{clase}")


def _post_json(p):
    return {
        "titulo": p["titulo"],
        "url": p["url"],
        "tipo": p.get("tipo"),
        "publicado": p["publicado"].isoformat() if p.get("publicado") else None,
        "senial": p.get("senial"),
        "multiplicador": p.get("multiplicador"),
        "multiplicador_tipo": p.get("multiplicador_tipo"),
        "clasificacion": p.get("clasificacion"),
        "comentarios": p.get("comentarios"),
        "compartidos": p.get("compartidos"),
        "visualizaciones": p.get("visualizaciones"),
        "alcance": p.get("alcance"),
        "interacciones": p.get("interacciones"),
        "fuente": p.get("fuente"),
    }


def escribir_informe_medicion(perfil_nombre, fecha, desde, hasta,
                              analisis_list, vias, bloqueos, fallos,
                              out_dir):
    """Escribe medicion-FECHA.md/.json en out_dir (un informe semanal).

    `analisis_list` trae un análisis por plataforma con datos;
    `vias` describe la vía usada por plataforma; `bloqueos` y
    `fallos` documentan lo que no se pudo medir. El informe PROPONE
    hallazgos para FORMATOS.md; nunca lo edita.
    """
    os.makedirs(out_dir, exist_ok=True)
    base = os.path.join(out_dir, f"medicion-{fecha}")
    todos_hallazgos = []
    for a in analisis_list:
        todos_hallazgos.extend(generar_hallazgos(a))

    lineas = [f"# Medición semanal — {perfil_nombre} — {fecha}",
              "",
              f"Ventana: {desde} → {hasta} (últimos 7 días). "
              f"Mediana por plataforma sobre publicaciones de más de "
              f"7 días; destacado ≥{DESTACADO_MIN}x, flojo "
              f"≤{FLOJO_MAX}x.",
              ""]
    if bloqueos:
        lineas.append("## Bloqueos y límites de esta corrida")
        lineas.append("")
        for b in bloqueos:
            linea = f"- **{b['plataforma']}** ({b.get('via', '?')}): {b['error']}"
            if b.get("que_falta"):
                linea += f" Qué falta: {b['que_falta']}."
            lineas.append(linea)
        lineas.append("")

    for a in analisis_list:
        plat = a["plataforma"]
        lineas.append(f"## {plat}")
        lineas.append("")
        lineas.append(f"Vía: {vias.get(plat, '?')}. Señal: {a['senial']}.")
        seguidores = (f"{_num(a['seguidores'])} seguidores"
                      if a.get("seguidores") else "seguidores s/d")
        aviso = (" · ⚠ mediana poco fiable "
                 f"(base de {a['n_base']})"
                 if 0 < a["n_base"] < BASE_MINIMA_FIABLE else "")
        lineas.append(f"{seguidores} · Semana: {a['n_ventana']} "
                      f"{_plural(a['n_ventana'], 'publicación', 'publicaciones')} "
                      f"· Base de mediana: {a['n_base']} · "
                      f"Mediana: {_num(a['mediana'])} {a['senial']}{aviso}")
        if a["medianas_tipo"]:
            detalle = "; ".join(
                f"{t}: {_num(v['mediana'])} {a['senial']} (n={v['n']})"
                for t, v in sorted(a["medianas_tipo"].items()))
            lineas.append(f"Medianas por tipo: {detalle}.")
        else:
            lineas.append("Medianas por tipo: sin datos suficientes "
                          f"(mínimo {MIN_TIPO} por tipo en la base).")
        lineas.append("")
        lineas.append(f"### Top {TOP_N} de la semana")
        lineas.append("")
        if a["top"]:
            for p in a["top"]:
                lineas.append(_post_md(p, a["senial"]))
        else:
            lineas.append("Sin publicaciones con señal en la ventana.")
        lineas.append("")
        lineas.append(f"### Bottom {TOP_N} de la semana")
        lineas.append("")
        if a["bottom"]:
            for p in a["bottom"]:
                lineas.append(_post_md(p, a["senial"]))
        else:
            lineas.append("Sin publicaciones con señal en la ventana.")
        lineas.append("")
        if a["patron_hora_dia"]:
            for patron in a["patron_hora_dia"]:
                lineas.append(f"Hora/día ({patron['dimension']}): lo mejor "
                              f"fue {patron['mejor']['etiqueta']} "
                              f"(mediana {_num(patron['mejor']['mediana'])} "
                              f"{a['senial']}, n={patron['mejor']['n']}) "
                              f"frente a {patron['peor']['etiqueta']} "
                              f"({_num(patron['peor']['mediana'])}, "
                              f"n={patron['peor']['n']}); descriptivo, "
                              f"no causal.")
        else:
            lineas.append("Hora/día: sin patrón claro con los datos "
                          "disponibles.")
        lineas.append("")

    lineas.append("## Hallazgos para FORMATOS.md (propuestas, no aplicadas)")
    lineas.append("")
    lineas.append("Este módulo NO edita FORMATOS.md: propone. El agente "
                  "semanal aplica solo lo verificado, con nota de versión.")
    lineas.append("")
    if todos_hallazgos:
        for i, h in enumerate(todos_hallazgos, 1):
            lineas.append(f"{i}. **{h['texto']}**")
            lineas.append(f"   Evidencia: {h['evidencia']}")
    else:
        lineas.append("Sin hallazgos con evidencia suficiente esta semana.")
    lineas.append("")

    if fallos:
        lineas.append("## Fallos parciales")
        lineas.append("")
        for f in fallos:
            lineas.append(f"- {f.get('plataforma', '?')}: {f.get('error')}")
        lineas.append("")

    with open(base + ".md", "w", encoding="utf-8") as f:
        f.write("\n".join(lineas))

    data = {
        "fecha": fecha,
        "perfil": perfil_nombre,
        "ventana": {"desde": desde, "hasta": hasta},
        "plataformas": [],
        "hallazgos": todos_hallazgos,
        "bloqueos": bloqueos,
        "fallos": fallos,
    }
    for a in analisis_list:
        data["plataformas"].append({
            "plataforma": a["plataforma"],
            "via": vias.get(a["plataforma"]),
            "senial": a["senial"],
            "seguidores": a.get("seguidores"),
            "n_ventana": a["n_ventana"],
            "n_base": a["n_base"],
            "mediana": a["mediana"],
            "mediana_fiable": a["mediana_fiable"],
            "medianas_tipo": a["medianas_tipo"],
            "ventana": [_post_json(p) for p in a["ventana"]],
            "top": [_post_json(p) for p in a["top"]],
            "bottom": [_post_json(p) for p in a["bottom"]],
            "patron_hora_dia": a["patron_hora_dia"],
        })
    with open(base + ".json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    return base + ".md", base + ".json"


# --- Medición por plataforma --------------------------------------------

def medir_facebook(args, perfil, fecha_ref):
    """Mide Facebook: vía de Páginas si se puede, si no vía de URLs.

    Devuelve (analisis | None, via, bloqueos, fallos). La base del
    CSV solo se suma cuando la vía es la de URLs (misma señal:
    reacciones); con la vía de Páginas la señal es interacciones y
    mezclarlas falsearía la mediana.
    """
    bloqueos, fallos = [], []
    posts, via, seguidores = [], None, None
    try:
        page_id, motivo = resolver_pagina_fb(args.facebook_cli, perfil)
    except SystemExit as e:
        page_id, motivo = None, str(e)
    except RateLimitError as e:
        return None, None, [{"plataforma": "Facebook", "via": "pages",
                             "error": f"rate limit: {e}"}], fallos
    if page_id:
        try:
            posts, cuenta = fetch_facebook_pages(page_id, args.facebook_cli,
                                                 fecha_ref)
            via = "pages posts list (Página administrada)"
            seguidores = cuenta.get("seguidores")
        except RateLimitError as e:
            return None, None, [{"plataforma": "Facebook", "via": "pages",
                                 "error": f"rate limit: {e}"}], fallos
        except SystemExit as e:
            bloqueos.append({"plataforma": "Facebook", "via": "pages",
                             "error": str(e)})
            posts = []
    else:
        bloqueos.append({"plataforma": "Facebook", "via": "pages",
                         "error": motivo or "Página no resuelta",
                         "que_falta": ("que el conector descubra la "
                                       "Página en pages list; mientras, "
                                       "la medición usa la vía de URLs")})
    if not posts:
        # Vía de URLs: lista preparada + descubrimiento en digests.
        urls = []
        for ruta in args.fb_urls or []:
            urls += leer_urls_fb(ruta)
        if not args.no_digest:
            urls += descubrir_urls_digest(args.digest_dir, args.digest_days,
                                          fecha_ref)
        urls = list(dict.fromkeys(urls))
        # Solo URLs http: la lista puede traer líneas que no son
        # URLs (la auditoría marcó algún enlace como NO OBTENIBLE).
        urls = [u for u in urls if u.startswith("http")]
        if not urls:
            fallos.append({"plataforma": "Facebook",
                           "error": "sin URLs: pasa --fb-urls FICHERO o "
                                    "deja que la medición descubra URLs "
                                    "en los digests del radar"})
        else:
            print(f"Facebook: {len(urls)} URLs a enriquecer (vía pública)")
            try:
                vivos, omitidos, fallos_url = fetch_facebook_urls(
                    urls, args.facebook_cli, perfil)
            except RateLimitError as e:
                return None, None, [{"plataforma": "Facebook",
                                     "via": "urls",
                                     "error": f"rate limit: {e}"}], fallos
            posts = vivos
            via = "lectura pública por URL (post read + reactions read)"
            for o in omitidos:
                fallos.append({"plataforma": "Facebook",
                               "error": f"omitida {o['url']}: {o['motivo']}"})
            for fl in fallos_url:
                fallos.append({"plataforma": "Facebook",
                               "error": f"{fl['url']}: {fl['error']}"})
        # Base histórica del CSV (misma señal: reacciones).
        ruta_csv = args.fb_base_csv or os.path.expanduser(
            (perfil.get("facebook") or {}).get("fb_base_csv") or "")
        if ruta_csv:
            base = leer_base_csv(ruta_csv)
            vistos = {p["url"] for p in posts}
            nuevos = [p for p in base if p["url"] not in vistos]
            posts += nuevos
            print(f"Facebook: base histórica del CSV: {len(base)} "
                  f"publicaciones ({len(nuevos)} nuevas)")
    if not posts:
        return None, via, bloqueos, fallos
    posts = deduplicar_posts(posts)
    senial = "interacciones" if via and via.startswith("pages") else "reacciones"
    analisis = analizar_plataforma("Facebook", posts, fecha_ref, senial,
                                   seguidores)
    return analisis, via, bloqueos, fallos


def medir_instagram(args, perfil, fecha_ref):
    """Mide Instagram: lectura pública + sonda de insights propios.

    Devuelve (analisis | None, via, bloqueos, fallos).
    """
    bloqueos, fallos = [], []
    ig = perfil.get("instagram") or {}
    handle = ig.get("handle")
    if not handle:
        return None, None, [{"plataforma": "Instagram",
                             "error": "el perfil no trae handle de Instagram"}], fallos
    try:
        account_id = resolver_instagram_account_id(
            args.instagram_account_id, args.instagram_cli)
    except SystemExit as e:
        return None, None, [{"plataforma": "Instagram",
                             "error": str(e)}], fallos
    try:
        posts = fetch_instagram_publico(handle, args.max, account_id,
                                        args.instagram_cli, fecha_ref)
    except RateLimitError as e:
        return None, None, [{"plataforma": "Instagram",
                             "via": "lectura pública",
                             "error": f"rate limit: {e}"}], fallos
    except SystemExit as e:
        return None, None, [{"plataforma": "Instagram",
                             "via": "lectura pública",
                             "error": str(e)}], fallos
    via = "lectura pública del perfil (likes)"
    seguidores = fetch_instagram_seguidores(handle, account_id,
                                            args.instagram_cli)
    # Insights propios: solo si se pasa el ID de la cuenta del perfil.
    if args.instagram_owned_id:
        ventana = [p for p in posts
                   if p.get("publicado")
                   and 0 <= (fecha_ref - p["publicado"]).days <= VENTANA_DIAS]
        candidatos = (ventana or posts)[:MAX_INSIGHTS]
        if candidatos:
            try:
                metricas, bloqueo = probar_insights_ig(
                    candidatos[0]["id"], args.instagram_owned_id,
                    args.instagram_cli)
            except RateLimitError as e:
                bloqueos.append({"plataforma": "Instagram",
                                 "via": "owned-insights",
                                 "error": f"rate limit: {e}"})
                metricas, bloqueo = None, True
            if bloqueo:
                bloqueos.append({"plataforma": "Instagram", **bloqueo})
            elif metricas:
                for p in candidatos:
                    try:
                        m, _b = probar_insights_ig(
                            p["id"], args.instagram_owned_id,
                            args.instagram_cli)
                    except RateLimitError:
                        break
                    if m:
                        p["visualizaciones"] = m.get("views")
                        p["alcance"] = m.get("accounts_reached") or m.get("reach")
                        p["interacciones"] = m.get("likes")
    else:
        bloqueos.append({
            "plataforma": "Instagram", "via": "owned-insights",
            "error": ("no intentado: falta --instagram-owned-id "
                      "(la sesión del perfil no está activa)"),
            "que_falta": ("reactivar la sesión del perfil en Instagram "
                          "(código nuevo al correo del perfil) y pasar "
                          "su ID con --instagram-owned-id; sin eso, la "
                          "medición usa likes públicos, sin Views ni "
                          "Accounts reached"),
        })
    if not posts:
        return None, via, bloqueos, fallos
    analisis = analizar_plataforma("Instagram", posts, fecha_ref, "likes",
                                   seguidores)
    return analisis, via, bloqueos, fallos


# --- CLI -----------------------------------------------------------------

def construir_cli():
    parser = argparse.ArgumentParser(
        prog="measure.py",
        description="Medición semanal del contenido propio "
                    "(Facebook e Instagram) para preproducción.")
    sub = parser.add_subparsers(dest="comando", required=True)
    p = sub.add_parser("measure",
                       help="mide la semana y escribe medicion-FECHA.md/.json")
    p.add_argument("--profile", default="memorial",
                   help="perfil de medicion-config.json (defecto: memorial)")
    p.add_argument("--config", default=None,
                   help="fichero de perfiles (defecto: "
                        "preprod/medicion-config.json)")
    p.add_argument("--platform", choices=["facebook", "instagram", "all"],
                   default="all",
                   help="plataforma a medir (defecto: all)")
    p.add_argument("--max", type=int, default=30,
                   help="publicaciones recientes por plataforma "
                        "(defecto: 30; en Instagram es un objetivo: el "
                        "escaneo puede traer hasta el triple para "
                        "completar la base de la mediana)")
    p.add_argument("--date", default=None,
                   help="fecha del informe YYYY-MM-DD (defecto: hoy en "
                        "America/Puerto_Rico)")
    p.add_argument("--out", default=None,
                   help="directorio de informes (defecto: preprod/research)")
    p.add_argument("--fb-urls", action="append", default=[],
                   help="fichero de URLs de posts de Facebook (una por "
                        "línea; repetible)")
    p.add_argument("--fb-base-csv", default=None,
                   help="CSV de base histórica de Facebook (formato de "
                        "la auditoría de oct-2026; por defecto, el de la "
                        "config del perfil)")
    p.add_argument("--digest-dir", default=DIGEST_DIR_DEFECTO,
                   help="directorio de digests del radar para descubrir "
                        "URLs de Facebook")
    p.add_argument("--digest-days", type=int, default=DIGEST_DIAS_DEFECTO,
                   help="días de digests hacia atrás "
                        f"(defecto: {DIGEST_DIAS_DEFECTO})")
    p.add_argument("--no-digest", action="store_true",
                   help="no descubrir URLs de Facebook en los digests "
                        "(solo --fb-urls)")
    p.add_argument("--facebook-cli", default=FACEBOOK_BIN_DEFECTO,
                   help="binario facebook-cli (defecto: en el PATH)")
    p.add_argument("--instagram-cli", default=INSTAGRAM_BIN_DEFECTO,
                   help="binario instagram-cli (defecto: en el PATH)")
    p.add_argument("--instagram-account-id", default=None,
                   help="ID de la cuenta propia de Instagram que lee "
                        "(si no se pasa, usa INSTAGRAM_ACCOUNT_ID o "
                        "autodetecta con instagram-cli accounts)")
    p.add_argument("--instagram-owned-id", default=None,
                   help="ID de la cuenta del perfil medido, para "
                        "probar insights propios (Views, Accounts "
                        "reached); sin él, la medición usa likes "
                        "públicos y registra el bloqueo")
    return parser


def cmd_measure(args):
    raiz = os.path.dirname(os.path.dirname(os.path.dirname(
        os.path.abspath(__file__))))
    ruta_config = args.config or os.path.join(
        raiz, "preprod", "medicion-config.json")
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
    perfil = cargar_perfil(ruta_config, args.profile)
    desde = (fecha_ref - timedelta(days=VENTANA_DIAS)).isoformat()
    plataformas = (["facebook", "instagram"] if args.platform == "all"
                   else [args.platform])
    medidores = {"facebook": medir_facebook,
                 "instagram": medir_instagram}
    analisis_list, vias, bloqueos, fallos = [], {}, [], []
    for plat in plataformas:
        analisis, via, bloq, fal = medidores[plat](args, perfil, fecha_ref)
        bloqueos.extend(bloq)
        fallos.extend(fal)
        if analisis is not None:
            analisis_list.append(analisis)
            vias[analisis["plataforma"]] = via
            print(f"{plat}: semana {analisis['n_ventana']} "
                  f"{_plural(analisis['n_ventana'], 'publicación', 'publicaciones')}, "
                  f"base {analisis['n_base']}, mediana "
                  f"{_num(analisis['mediana'])} {analisis['senial']}")
        else:
            print(f"{plat}: sin datos", file=sys.stderr)
    if not analisis_list:
        print("error: ninguna plataforma pudo medirse", file=sys.stderr)
        return 1
    md, js = escribir_informe_medicion(
        perfil.get("nombre") or args.profile, fecha, desde, fecha,
        analisis_list, vias, bloqueos, fallos, out_dir)
    print(f"informe: {md}")
    print(f"datos: {js}")
    return 0


def main(argv=None):
    parser = construir_cli()
    args = parser.parse_args(argv)
    if args.comando == "measure":
        return cmd_measure(args)
    parser.print_help(sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
