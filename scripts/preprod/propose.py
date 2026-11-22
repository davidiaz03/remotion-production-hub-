#!/usr/bin/env python3
"""propose.py — preproducción de reels del Memorial de la Denuncia.

Crea andamios de packs de propuesta (guion, ganchos, plan visual y
checklist de Suleris), los valida, rankea las noticias del día desde
el digest del radar y corre la propuesta diaria.

PUERTA DURA: ningún subcomando de este módulo dispara jamás la
edición de un video. Este script solo escribe texto (packs,
shortlists, logs) dentro de preprod/propuestas/. La edición empieza
únicamente cuando el usuario confirma que Suleris aprobó un pack, y
eso lo hace otro flujo, nunca este.

ETAPA DE INVESTIGACIÓN PREVIA (NARRATIVA.md R31): antes de redactar
el guion de un pack nuevo, el tema se investiga en un dossier
(`investigate.py`); `check` exige un dossier verificado en la ficha
de los packs nuevos. Los packs del 2026-11-22 o anteriores solo
reciben un aviso y pueden recibir un dossier retroactivo.

Solo Python stdlib, sin red, determinista y offline. El parseo del
digest se reutiliza de news-content (news_content/radar.py); este
script no reescribe ese parseo.

Uso:
  python3 scripts/preprod/propose.py draft --from-draft <ruta.md>
  python3 scripts/preprod/propose.py draft --from-radar <digest.txt> --url <url>
  python3 scripts/preprod/propose.py check <pack/propuesta.md>
  python3 scripts/preprod/propose.py rank [--date YYYY-MM-DD]
  python3 scripts/preprod/propose.py daily [--date YYYY-MM-DD]

Salidas: 0 OK · 1 error operativo o validación fallida · 2 uso incorrecto.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
import unicodedata
from datetime import datetime, timedelta, timezone
from pathlib import Path

# No escribir bytecode al importar el paquete de news-content: la
# corrida diaria no debe dejar archivos fuera de su directorio de salida.
sys.dont_write_bytecode = True

REPO_ROOT = Path(__file__).resolve().parents[2]
PREPROD_DIR = REPO_ROOT / "preprod"
CHECKLIST_PATH = PREPROD_DIR / "checklist-suleris.json"
DEFAULT_PROPS_DIR = PREPROD_DIR / "propuestas"
DEFAULT_DIGEST_DIR = (Path.home() / "workspace" / "goals"
                      / "resumen-diario-de-redes-sociales" / "hidden_files")
DEFAULT_NEWS_CONTENT = Path.home() / "workspace" / "news-content"

# Guion de ~60 s a 150 palabras por minuto (FORMATOS.md §3.6).
PALABRAS_MIN = 120
PALABRAS_MAX = 170
GANCHOS_MIN = 3
LINEAS_GUION_ANDAMIO = 8

# Ranking: ver preprod/RANKING.md. Total máximo 60 + 0,5 de bonus.
UMBRAL_SHORTLIST = 30.0
SHORTLIST_MAX = 10
DAILY_PACKS = 3

# Etapa de investigación previa (NARRATIVA.md R31, 22-nov-2026): los
# packs de esta fecha o anteriores son anteriores a la etapa — sin
# dossier referenciado solo reciben un aviso, no un fallo. Los packs
# posteriores exigen un dossier verificado para pasar el check.
DOSSIER_CORTE_LEGADO = "2026-11-22"

CLASIFICACIONES = {"hecho confirmado", "declaración", "preliminar",
                   "rumor no verificado", "reacción social"}
SECCIONES_FEED = {"Cuba", "Cuba-EE.UU.", "Venezuela-LatAm", "Internacional",
                  "Redes sociales", "Fútbol", "IA y tecnología",
                  "Comunicación y cultura"}

MARCADOR_ESCRIBIR = "[ESCRIBIR"


# --- Utilidades ---------------------------------------------------------

def today_local() -> str:
    """Fecha de hoy en America/Puerto_Rico (= hora oficial de Cuba)."""
    try:
        from zoneinfo import ZoneInfo
        tz = ZoneInfo("America/Puerto_Rico")
    except Exception:  # noqa: BLE001 - sin tzdata, UTC-4 fijo
        tz = timezone(timedelta(hours=-4))
    return datetime.now(tz).strftime("%Y-%m-%d")


def validar_fecha(texto: str) -> str:
    try:
        datetime.strptime(texto, "%Y-%m-%d")
    except ValueError:
        raise argparse.ArgumentTypeError(
            f"fecha inválida (se espera YYYY-MM-DD): {texto}") from None
    return texto


def slugify(texto: str, max_len: int = 60) -> str:
    """«Trump asegura que…» -> «trump-asegura-que» (sin tildes)."""
    normalizado = unicodedata.normalize("NFKD", texto or "")
    sin_tildes = "".join(c for c in normalizado
                         if not unicodedata.combining(c))
    bajo = sin_tildes.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", bajo).strip("-")
    slug = re.sub(r"-+", "-", slug)
    return slug[:max_len].rstrip("-") or "sin-titulo"


# Palabras genéricas que no aportan tema al slug de un pack
# (las descripciones del digest suelen abrir con «This is a news
# segment from…» o «The video shows…»).
PALABRAS_GENERICAS_SLUG = {
    "this", "that", "these", "those", "with", "from", "shows", "show",
    "showing", "shown", "video", "videos", "image", "images", "photo",
    "photos", "photograph", "news", "segment", "report", "reports",
    "reporting", "presents", "presenting", "features", "featuring",
    "about", "during", "while", "says", "said", "speaks", "speaking",
    "talks", "talking", "discusses", "discuss", "claims", "claiming",
    "announces", "announcing", "explains", "explaining", "describes",
    "describing", "shares", "sharing", "posts", "posting", "clip",
    "footage", "scene", "post", "social", "media", "screen", "text",
    "reads", "reading", "overlaid", "overlay", "large", "small",
    "young", "wearing", "standing", "sitting", "front", "behind",
    "left", "right", "also", "into", "over", "under", "after",
    "before", "the", "and", "for", "are", "was", "were", "has",
    "have", "had", "its", "their", "they", "them", "then", "than",
    "when", "what", "which", "who", "whom", "how", "why", "not",
    "but", "yet", "per", "via", "his", "her", "him", "she", "you",
    "your", "our", "out", "one", "two", "all", "can", "will",
    "would", "could", "should", "may", "might", "must", "been",
    "being", "does", "did", "doing", "done", "get", "got", "make",
    "made", "take", "took", "see", "seen", "know", "known", "think",
    "thought", "tell", "told", "ask", "asked", "put", "set", "let",
    "keep", "give", "gave", "find", "found", "call", "called",
    "try", "tried", "feel", "felt", "bring", "brought", "begin",
    "began", "happen", "happened", "write", "wrote", "lose", "lost",
    "pay", "paid", "meet", "met", "run", "ran", "say",
    "el", "la", "los", "las", "una", "unos", "unas",
    "con", "por", "para", "que", "son", "del", "al", "como", "más",
    "pero", "sus", "este", "esta", "estos", "estas", "ese", "esa",
    "eso", "aquel", "aquella", "cuando", "donde", "quien", "cual",
    "porque", "pues", "así", "también", "solo", "sólo", "cada",
    "otro", "otra", "otros", "otras", "todo", "toda", "todos",
    "todas", "mucho", "mucha", "poco", "poca", "bien", "mal", "hoy",
    "ayer", "ahora", "luego", "después", "antes", "siempre",
    "nunca", "aquí", "allí", "ahí",
}


# Fragmentos entrecomillados que NO son citas sino prosa de la
# descripción del digest («…overlays the bottom, stating: "…"»):
# solo se descartan en comillas rectas; entre «» o “” casi siempre
# son citas reales.
PROSA_EN_CITAS = ("stating", "states that", "the video", "the image",
                  "shows", "displays", "slide", "says:", "reads:",
                  "caption")


def extraer_citas(texto: str) -> list[str]:
    """Fragmentos entrecomillados que parecen citas o titulares,
    ordenados por plausibilidad (guillemets y titulares en mayúsculas
    primero). Descarta prosa de la descripción. Escanea comilla a
    comilla (no con regex por pares) para no perder la cita real
    cuando la prosa entrecomillada la antecede: en
    `"…stating: "TITULAR"` la comilla que cierra la prosa abre el
    titular."""
    texto = texto or ""
    candidatas = []
    vistos = set()
    for i, c in enumerate(texto):
        if c not in "«“\"":
            continue
        j = next((k for k in range(i + 1, len(texto))
                  if texto[k] in "«“\"»”"), None)
        if j is None:
            continue
        span = texto[i + 1:j].strip().strip("'").strip()
        # Comilla simple huérfana ante dos puntos (resto de un
        # entrecomillado anidado: «…NOSOTROS SI': TRUMP…»).
        span = span.replace("':", ":")
        if (len(span) < 10 or len(span) > 200 or span.endswith(":")
                or span.startswith("(")):
            continue
        if span in vistos:
            continue
        vistos.add(span)
        con_guillemets = c in ("«", "“")
        if not con_guillemets and any(p in span.lower()
                                      for p in PROSA_EN_CITAS):
            continue
        puntos = 0
        if con_guillemets:
            puntos += 3
        letras = [ch for ch in span if ch.isalpha()]
        if letras and (sum(1 for ch in letras if ch.isupper())
                       / len(letras) >= 0.6):
            puntos += 2
        puntos += min(2, len(span) // 40)
        candidatas.append((puntos, i, span))
    candidatas.sort(key=lambda c: (-c[0], c[1]))
    return [c[2] for c in candidatas]


def primera_cita(texto: str) -> str:
    """Primera cita plausible (titular en pantalla) o ''."""
    citas = extraer_citas(texto)
    return citas[0] if citas else ""


def tema_corto(texto: str, max_len: int = 70) -> str:
    """Tema legible para titulares: la primera cita, truncada, o ''."""
    cita = primera_cita(texto)
    if not cita:
        return ""
    if len(cita) <= max_len:
        return cita
    return cita[:max_len].rstrip() + "…"


def slug_desde_radar(entidad: str, descripcion: str) -> str:
    """Slug con tema para un pack desde el radar: entidad + titular
    entrecomillado si lo hay; si no, entidad + primeras palabras de
    contenido (sin las genéricas «this is a news segment…» ni las
    palabras que ya están en la entidad)."""
    cita = primera_cita(descripcion)
    if cita:
        base = " ".join(cita.split()[:6])
        return slugify(f"{entidad} {base}")
    palabras_entidad = set(slugify(entidad).split("-"))
    palabras = [p.strip(".,;:!?()\"'«»") for p in (descripcion or "").split()]
    contenido = [p for p in palabras
                 if len(p) >= 3
                 and p.lower() not in PALABRAS_GENERICAS_SLUG
                 and not set(slugify(p).split("-")) <= palabras_entidad]
    base = " ".join(contenido[:5])
    return slugify(f"{entidad} {base}") or slugify(entidad)


def contar_palabras(texto: str) -> int:
    """Palabras habladas: tokens con al menos un carácter alfanumérico."""
    return sum(1 for token in texto.split()
               if re.search(r"[A-Za-zÀ-ÿ0-9]", token))


def cargar_checklist() -> dict:
    try:
        return json.loads(CHECKLIST_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        print(f"error: no se pudo leer el checklist: {CHECKLIST_PATH}: {exc}",
              file=sys.stderr)
        raise SystemExit(1) from exc


def importar_radar(news_content: Path):
    """Importa news_content/radar.py sin reescribir el parseo del digest."""
    ruta = str(news_content)
    if ruta not in sys.path:
        sys.path.insert(0, ruta)
    try:
        from news_content import radar as radar_mod
    except ImportError as exc:
        print(f"error: no se pudo importar news_content.radar desde "
              f"{news_content}: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
    return radar_mod


def ruta_digest(fecha: str, digest_dir: Path) -> Path:
    return digest_dir / f"radar-{fecha}-digest.txt"


# --- Índice de propuestas (dedupe: no volver a proponer lo mismo) -------

def cargar_indice(props_dir: Path) -> dict:
    ruta = props_dir / "index.json"
    if not ruta.exists():
        return {"version": 1, "propuestas": []}
    try:
        datos = json.loads(ruta.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {"version": 1, "propuestas": []}
    if not isinstance(datos.get("propuestas"), list):
        datos["propuestas"] = []
    return datos


def guardar_indice(props_dir: Path, indice: dict) -> None:
    props_dir.mkdir(parents=True, exist_ok=True)
    ruta = props_dir / "index.json"
    ruta.write_text(json.dumps(indice, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8")


def registrar_propuesta(props_dir: Path, url: str, pack_rel: str,
                        fecha: str, titulo: str) -> None:
    """Registra una URL como ya propuesta (dedupe de rank)."""
    if not url:
        return
    indice = cargar_indice(props_dir)
    if any(p.get("url") == url for p in indice["propuestas"]):
        return
    indice["propuestas"].append({
        "url": url,
        "pack": pack_rel,
        "fecha": fecha,
        "titulo": titulo,
    })
    guardar_indice(props_dir, indice)


def urls_propuestas(props_dir: Path) -> set[str]:
    indice = cargar_indice(props_dir)
    return {p.get("url", "") for p in indice["propuestas"] if p.get("url")}


# --- Sugerencia automática de formato (FORMATOS.md §2) ------------------

# Palabras que delatan cada formato en el texto de la noticia. La
# sugerencia es automática y provisional: el agente la confirma o la
# cambia en la justificación del pack, con motivo.
FORMATOS = [
    ("Mapa animado",
     ["mapa", "frontera", "ruta", "países", "región", "territorio",
      "golfo", "canal", "caribe", "latinoamérica", "américa latina"],
     "la noticia nombra lugares que el mapa puede mostrar mientras la voz los nombra (FORMATOS.md §2, §3.4)."),
    ("Pregunta personal + objeto + acción",
     ["documento", "foto", "fotografía", "libro", "acta", "carta",
      "expediente", "archivo", "manuscrito"],
     "hay un objeto físico (documento, foto, libro) que la presentadora puede mostrar en mano (FORMATOS.md §2)."),
    ("Testimonio selfie desde el lugar",
     ["testimonio", "testigo", "desde el lugar", "en el lugar",
      "sobreviviente", "víctima"],
     "hay un testigo-protagonista que puede hablar desde el lugar de los hechos (FORMATOS.md §2)."),
    ("Denuncia en vivo",
     ["en vivo", "acto", "manifestación", "protesta", "marcha",
      "rueda de prensa", "conferencia de prensa"],
     "existe metraje real del hecho con voz propia (FORMATOS.md §2)."),
    ("Presentador a cámara + evidencia",
     ["explica", "análisis", "por qué", "qué pasó", "historia de",
      "contexto"],
     "tema explicativo de historia o geopolítica: el formato central del Memorial (FORMATOS.md §2)."),
]


def sugerir_formato(texto: str, tiene_cita: bool, es_video: bool) -> tuple[str, str]:
    """Formato sugerido + motivo, desde FORMATOS.md §2.

    Orden de prioridad: cita textual del protagonista (gancho de cita,
    FORMATOS.md §1.2) > lugares/objeto/testimonio/metraje > explicativo
    > documental faceless por defecto.
    """
    bajo = (texto or "").lower()
    if tiene_cita:
        if es_video:
            return ("Denuncia en vivo",
                    "hay metraje del hecho y una cita textual del "
                    "protagonista para el gancho (FORMATOS.md §1.2, §2).")
        return ("Presentador a cámara + evidencia",
                "hay una cita textual del protagonista para el gancho; el "
                "presentador la enmarca con evidencia (FORMATOS.md §1.2, §2).")
    for nombre, claves, motivo in FORMATOS:
        if any(clave in bajo for clave in claves):
            return (nombre, motivo)
    return ("Documental faceless",
            "sin presentadora disponible ni metraje con voz propia: "
            "narración sobre metraje y fotos, el grupo ganador más "
            "numeroso en EditorOP (FORMATOS.md §2).")


def tipo_gancho_sugerido(texto: str, tiene_cita: bool) -> str:
    """Tipo de gancho de FORMATOS.md §1.2 que mejor encaja."""
    bajo = (texto or "").lower()
    if tiene_cita:
        return "Cita textual del protagonista"
    if "?" in texto or "¿" in texto:
        return "Pregunta contraintuitiva"
    if any(p in bajo for p in ["mapa", "frontera", "ruta", "países"]):
        return "Dato + mapa"
    if re.search(r"\b\d{4}\b", texto or ""):
        return "Narración con fecha exacta"
    return "Afirmación + pregunta"


# --- Construcción del pack ----------------------------------------------

def lineas_checklist(checklist: dict) -> list[str]:
    """Una línea por regla, con estado pendiente y evidencia vacía."""
    lineas = []
    for regla in checklist["reglas"]:
        lineas.append(
            f"- [ ] {regla['id']} · {regla['texto']} — estado: pendiente "
            f"— evidencia: ")
    return lineas


def construir_pack(ficha: dict, checklist: dict) -> str:
    """Andamio de propuesta.md. Los hechos salen de `ficha`; lo creativo
    queda marcado [ESCRIBIR] para el agente. El andamio NUNCA inventa
    hechos: si un dato no viene en la ficha, queda como «por determinar»."""
    formato, motivo_formato = sugerir_formato(
        ficha.get("texto_busqueda", ""), bool(ficha.get("citas")),
        ficha.get("es_video", False))
    gancho = tipo_gancho_sugerido(ficha.get("texto_busqueda", ""),
                                   bool(ficha.get("citas")))
    lineas = [
        f"# Propuesta de reel — {ficha['titulo']}",
        "",
        "> Pack de propuesta para Suleris Coss Diaz · Memorial de la Denuncia.",
        f"> Fecha: {ficha['fecha']} · Estado: andamio (sin redactar) — no enviar todavía.",
        "> Puerta dura: este pack no dispara edición. La edición empieza",
        "> solo cuando el usuario confirma la aprobación de Suleris",
        "> (ver la sección Aprobación).",
        "",
        "## Ficha",
        "",
        f"- Noticia: {ficha['noticia']}",
        f"- Fuente: {ficha['fuente_nombre']} — {ficha['fuente_url']}",
        f"- Clasificación: {ficha['clasificacion']}",
        f"- Sección: {ficha['seccion']}",
    ]
    if ficha.get("fecha_noticia"):
        lineas.append(f"- Fecha de la noticia: {ficha['fecha_noticia']}")
    if ficha.get("fuente_primaria"):
        lineas.append(f"- Fuente primaria: {ficha['fuente_primaria']}")
    lineas.append(
        "- Dossier: "
        f"{ficha.get('dossier') or 'pendiente (investigate.py new <tema> '
        'antes de redactar el guion)'}")
    lineas += [
        "",
        "## Hechos (de la fuente; no añadir hechos sin fuente)",
        "",
    ]
    for hecho in ficha.get("hechos", []):
        lineas.append(f"- {hecho}")
    for cita in ficha.get("citas", []):
        lineas.append(f"- Cita ({cita['hablante']}): «{cita['texto']}»")
    for inferencia in ficha.get("inferencias", []):
        lineas.append(f"- Inferencia (no hecho): {inferencia}")
    if ficha.get("nota_verificacion"):
        lineas.append(f"- Nota de verificación: {ficha['nota_verificacion']}")
    lineas += [
        "",
        "## Por qué ahora",
        "",
        f"{MARCADOR_ESCRIBIR}: en 2–3 frases, por qué este reel hoy: qué cambió, "
        "por qué importa al Memorial y por qué no puede esperar. Sin inventar "
        "hechos: solo lo que está en la ficha.",
        "",
        "## Ganchos (3 opciones — se elige una al aprobar)",
        "",
        f"1. {MARCADOR_ESCRIBIR}: gancho 1 — afirmación corta en texto "
        "(7–10 palabras) + imagen que la prueba, en 1–3 s.",
        f"2. {MARCADOR_ESCRIBIR}: gancho 2 — otra opción, distinto ángulo "
        "(pregunta, cita o dato).",
        f"3. {MARCADOR_ESCRIBIR}: gancho 3 — otra opción, distinto ángulo.",
        "",
        f"Sugerencia (FORMATOS.md §1.2): tipo de gancho «{gancho}».",
        "",
        f"## Guion (~60 s, {PALABRAS_MIN}–{PALABRAS_MAX} palabras habladas)",
        "",
        "Las líneas numeradas son voz en off y cuentan como palabras "
        "habladas. Las líneas `>` son el plan visual y no cuentan.",
        "",
    ]
    for i in range(1, LINEAS_GUION_ANDAMIO + 1):
        lineas.append(f"{i}. {MARCADOR_ESCRIBIR}: línea {i} de voz en off.")
        lineas.append(f"> Visual: {MARCADOR_ESCRIBIR}: qué se ve en la escena {i}.")
    lineas += [
        "",
        "## Formato",
        "",
        f"Sugerencia automática: **{formato}** — {motivo_formato}",
        "",
        f"{MARCADOR_ESCRIBIR}: justificación del formato elegido (confirmar la "
        "sugerencia o cambiarla con motivo) y duración prevista (45–90 s).",
        "",
        "## Checklist Suleris",
        "",
        "Cada regla con estado `pass` o `flag` y evidencia escrita antes de "
        "enviar el pack. `flag` = revisado y con riesgo anotado, no sin revisar.",
        "",
    ]
    lineas += lineas_checklist(checklist)
    lineas += [
        "",
        "## Aprobación",
        "",
        "- Estado: pendiente",
        "- Fecha de aprobación: —",
        "- Medio: — (WhatsApp de Suleris Coss Diaz)",
        "- Notas de Suleris: —",
        "",
        "La edición empieza SOLO cuando el usuario confirma que Suleris "
        "aprobó este pack. Al confirmar, el agente actualiza el estado, la "
        "fecha y el medio aquí, y solo entonces el pack pasa a producción.",
        "",
    ]
    return "\n".join(lineas)


def escribir_pack(props_dir: Path, fecha: str, slug: str, contenido: str,
                  force: bool) -> Path:
    destino = props_dir / fecha / slug / "propuesta.md"
    if destino.exists() and not force:
        print(f"error: el pack ya existe: {destino} (usa --force para "
              f"sobrescribirlo)", file=sys.stderr)
        raise SystemExit(1)
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(contenido, encoding="utf-8")
    return destino


def url_del_pack(ruta: Path) -> str:
    """URL de la fuente de un pack existente (línea
    «- Fuente: … — <URL>») o '' si no se puede leer."""
    try:
        texto = ruta.read_text(encoding="utf-8")
    except OSError:
        return ""
    m = re.search(r"^- Fuente:\s*.+?\s+—\s+(https?://\S+)", texto, re.M)
    return m.group(1).strip() if m else ""


def slug_unico(props_dir: Path, fecha: str, slug: str, url: str) -> str:
    """Evita que dos ítems distintos (misma entidad, mismo titular)
    compartan slug y uno pise al otro: si el slug está ocupado por un
    pack de OTRA URL, añade -2, -3… Si es la misma URL, devuelve el
    slug tal cual (regeneración)."""
    base = slug
    n = 2
    while True:
        destino = props_dir / fecha / slug / "propuesta.md"
        if not destino.exists():
            return slug
        if not url or url_del_pack(destino) == url:
            return slug
        slug = f"{base}-{n}"
        n += 1


# --- draft --from-draft (borrador de news-content) -----------------------

def leer_borrador_news(ruta: Path) -> dict:
    """Extrae título, clasificación, sección, fuente y hechos del .md
    de un borrador de news-content. Lo que no está en el archivo queda
    como «por determinar»: nunca se inventa."""
    texto = ruta.read_text(encoding="utf-8")
    titulo = ""
    m = re.search(r"^# Guion de reel — (.+)$", texto, re.M)
    if m:
        titulo = m.group(1).strip()
    if not titulo:
        m = re.search(r"^# (.+)$", texto, re.M)
        titulo = m.group(1).strip() if m else ruta.stem
    clasificacion = "por determinar"
    seccion = "por determinar"
    m = re.search(r"^Clasificación:\s*(.+?)\s*·\s*Sección:\s*(.+)$", texto, re.M)
    if m:
        clasificacion = m.group(1).strip()
        seccion = m.group(2).strip()
    fuente_nombre = "por determinar"
    fuente_url = ""
    m = re.search(r"^Fuente:\s*(.+?)\s+—\s+(https?://\S+)", texto, re.M)
    if m:
        fuente_nombre = m.group(1).strip()
        fuente_url = m.group(2).strip()
    fuente_primaria = ""
    m = re.search(r"^Fuente primaria:\s*(.+)$", texto, re.M)
    if m:
        fuente_primaria = m.group(1).strip()
    hechos: list[str] = []
    citas: list[dict] = []
    inferencias: list[str] = []
    m = re.search(r"^## Hechos.*?\n(.*?)(?=^## |\Z)", texto, re.M | re.S)
    if m:
        for linea in m.group(1).splitlines():
            linea = linea.strip()
            if not linea.startswith("- "):
                continue
            cuerpo = linea[2:].strip()
            mc = re.match(r"\*\*Cita \((.+?)\):\*\*\s*«(.+?)»", cuerpo)
            if mc:
                citas.append({"hablante": mc.group(1), "texto": mc.group(2)})
                continue
            mi = re.match(r"\*\*Inferencia \(no hecho\):\*\*\s*(.+)", cuerpo)
            if mi:
                inferencias.append(mi.group(1))
                continue
            mf = re.match(r"\*\*(.+?):\*\*\s*(.+)", cuerpo)
            if mf and mf.group(1).lower() != "fuente":
                hechos.append(f"{mf.group(1)}: {mf.group(2)}")
            elif not mf:
                hechos.append(cuerpo)
    return {
        "titulo": titulo,
        "clasificacion": clasificacion,
        "seccion": seccion,
        "fuente_nombre": fuente_nombre,
        "fuente_url": fuente_url,
        "fuente_primaria": fuente_primaria,
        "hechos": hechos,
        "citas": citas,
        "inferencias": inferencias,
    }


def id_desde_borrador(ruta: Path) -> str:
    """<id>-reel.md / <id>-post.md / <id>-meme.md -> <id>."""
    stem = ruta.stem
    for sufijo in ("-reel", "-post", "-meme"):
        if stem.endswith(sufijo):
            return stem[: -len(sufijo)]
    return stem


def leer_item_json(news_content: Path, item_id: str) -> dict | None:
    ruta = news_content / "items" / f"{item_id}.json"
    if not ruta.exists():
        return None
    try:
        return json.loads(ruta.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def ficha_desde_borrador(ruta_borrador: Path, news_content: Path,
                         fecha: str) -> tuple[dict, str]:
    """Ficha del pack desde un borrador news-content. Si existe su
    items/<id>.json, los hechos estructurados mandan sobre el .md."""
    datos = leer_borrador_news(ruta_borrador)
    item_id = id_desde_borrador(ruta_borrador)
    item = leer_item_json(news_content, item_id)
    if item:
        hechos5w = item.get("facts", {})
        hechos = []
        for etiqueta, clave in (("Quién", "who"), ("Qué", "what"),
                                ("Cuándo", "when"), ("Dónde", "where"),
                                ("Contexto", "context")):
            if hechos5w.get(clave):
                hechos.append(f"{etiqueta}: {hechos5w[clave]}")
        datos["hechos"] = hechos or datos["hechos"]
        datos["citas"] = [
            {"hablante": c.get("speaker", "?"), "texto": c.get("text", "")}
            for c in item.get("quotes", [])] or datos["citas"]
        datos["inferencias"] = item.get("inferences", []) or datos["inferencias"]
        if item.get("classification"):
            datos["clasificacion"] = item["classification"]
        if item.get("section"):
            datos["seccion"] = item["section"]
        fuente = item.get("source", {})
        if fuente.get("name"):
            datos["fuente_nombre"] = fuente["name"]
        if fuente.get("url"):
            datos["fuente_url"] = fuente["url"]
        primaria = item.get("primary_source", {})
        if primaria.get("cites_concrete_post"):
            estado = primaria.get("status", "")
            detalle = primaria.get("detail", "")
            datos["fuente_primaria"] = (f"{estado} — {detalle}".strip(" —")
                                        if detalle else estado)
        if item.get("verification_note"):
            datos["nota_verificacion"] = item["verification_note"]
        if item.get("classification_note"):
            datos["nota_verificacion"] = (
                (datos.get("nota_verificacion", "") + " "
                 + item["classification_note"]).strip())
    noticia = datos["hechos"][1] if len(datos["hechos"]) > 1 else datos["titulo"]
    noticia = re.sub(r"^Qué:\s*", "", noticia)
    ficha = {
        "titulo": datos["titulo"],
        "fecha": fecha,
        "noticia": noticia,
        "fuente_nombre": datos["fuente_nombre"],
        "fuente_url": datos["fuente_url"],
        "clasificacion": datos["clasificacion"],
        "seccion": datos["seccion"],
        "fecha_noticia": "",
        "fuente_primaria": datos.get("fuente_primaria", ""),
        "hechos": datos["hechos"],
        "citas": datos["citas"],
        "inferencias": datos["inferencias"],
        "nota_verificacion": datos.get("nota_verificacion", ""),
        "texto_busqueda": " ".join(datos["hechos"] + [datos["titulo"]]),
        "es_video": "/reel/" in datos["fuente_url"]
                    or "youtube.com/shorts" in datos["fuente_url"],
    }
    slug = slugify(item_id) if item else slugify(datos["titulo"])
    return ficha, slug


# --- draft --from-radar (entrada del digest) -----------------------------

def ficha_desde_radar(entrada: dict, radar_mod, fecha: str) -> tuple[dict, str]:
    """Ficha desde una entrada del digest. La descripción del digest es
    un resumen truncado (suele venir en inglés): se cita como tal y NO
    se presenta como hecho verificado. La clasificación queda «por
    determinar»: la pone el agente tras verificar la fuente."""
    descripcion = entrada.get("description", "")
    entidad = entrada.get("entity", "")
    url = entrada.get("url", "")
    seccion = radar_mod.SECTION_MAP.get(entrada.get("section", ""),
                                        "por determinar")
    ts = entrada.get("timestamp", "")
    likes = entrada.get("likes")
    hechos = [
        f"Publicación de {entidad} ({entrada.get('handle', '')})"
        if entrada.get("handle") else f"Publicación de {entidad}",
        f"Resumen del radar (truncado, en inglés; NO es la fuente, "
        f"verificar contra la publicación): {descripcion}",
    ]
    if ts:
        hechos.append(f"Fecha de la publicación: {ts}")
    if likes is not None:
        hechos.append(f"Likes en el digest: {likes:,}".replace(",", "."))
    citas = [{"hablante": "por confirmar en la fuente", "texto": cita}
             for cita in extraer_citas(descripcion)]
    ficha = {
        "titulo": (f"{entidad} — «{tema_corto(descripcion)}» — {ts[:10]}"
                   if tema_corto(descripcion)
                   else (f"{entidad} — {ts[:10]}" if entidad
                         else "Sin título")),
        "fecha": fecha,
        "noticia": descripcion[:300] + ("…" if len(descripcion) > 300 else ""),
        "fuente_nombre": f"{entidad} (publicación en redes)",
        "fuente_url": url,
        "clasificacion": "por determinar (el agente clasifica tras "
                         "verificar la fuente)",
        "seccion": seccion,
        "fecha_noticia": ts[:10],
        "fuente_primaria": "pendiente — verificar la publicación enlazada "
                           "antes de redactar (regla del 7-nov-2026)",
        "hechos": hechos,
        "citas": citas,
        "inferencias": [],
        "nota_verificacion": "Los hechos de este andamio son el resumen "
                             "del radar, no la fuente. El agente verifica "
                             "cada hecho contra la publicación enlazada o "
                             "cobertura que la confirme antes de redactar.",
        "texto_busqueda": descripcion,
        "es_video": "/reel/" in url or "/shorts/" in url or "/videos/" in url,
    }
    slug = slug_desde_radar(entidad, descripcion)
    return ficha, slug


# --- Ranking (ver preprod/RANKING.md) ------------------------------------

# Palabras que acercan una entrada a la narrativa del Memorial
# (bloqueo, soberanía, memoria histórica, injerencia, Cuba, Venezuela).
PALABRAS_NARRATIVA = [
    "bloqueo", "blockade", "sancion", "sanction", "cuba", "venezuela",
    "martí", "marti", "fidel", "imperio", "imperial", "onu", "caricom",
    "latinoamérica", "latinoamerica", "latin america", "caribe",
    "caribbean", "denuncia", "historia", "memoria", "intervención",
    "intervention", "injerencia", "soberanía", "sovereignty",
    "dignidad", "petróleo", "oil", "combustible", "fuel", "arancel",
    "tariff", "trump", "rubio", "estados unidos", "united states",
    "miami", "exilio", "migración", "migration", "tps", "embargo",
    "guerra", "war", "invasión", "invasion", "golpe", "coup",
    "derechos humanos", "human rights", "pueblo", "people",
]

PALABRAS_CONTRADICCION = [
    "pero", "sin embargo", "mientras", "aunque", "no obstante",
    "but", "however", "despite", "while", "although", "yet",
]

PALABRAS_LUGAR = [
    "mapa", "map", "frontera", "border", "ruta", "route", "países",
    "countries", "ciudad", "city", "pueblo", "town", "golfo", "gulf",
    "canal", "isla", "island", "capital", "provincia", "province",
]

MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
         "agosto", "septiembre", "octubre", "noviembre", "diciembre",
         "january", "february", "march", "april", "may", "june", "july",
         "august", "september", "october", "november", "december"]

BASE_NARRATIVA_POR_SECCION = {
    "CUBA-EEUU": 3,
    "VENEZUELA": 3,
    "BAYERN": 1,
    "ESP-BRASIL-IA": 2,
}

PESOS = {"valor_informativo": 3, "narrativa": 3, "formato": 2,
         "gancho": 2, "actualidad": 2}


def _tiene_cita(texto: str) -> bool:
    return bool(extraer_citas(texto))


def _cuenta_claves(texto: str, claves: list[str]) -> int:
    bajo = (texto or "").lower()
    return sum(1 for clave in claves if clave in bajo)


def puntuar_entrada(entrada: dict, ref: datetime, radar_mod) -> dict:
    """Puntuación determinista de una entrada del digest (0–5 por
    criterio). El engagement NO entra en los criterios: solo un bonus
    débil de 0–0,5 puntos sobre el total (ver RANKING.md)."""
    descripcion = entrada.get("description", "")
    url = entrada.get("url", "")
    banderas = radar_mod.risk_flags(descripcion)
    tiene_cita = _tiene_cita(descripcion)
    tiene_dato = bool(re.search(r"\d", descripcion))

    # C1 valor informativo (peso 3): sustancia + dato concreto.
    c1 = 2
    if len(descripcion) >= 200:
        c1 += 1
    if tiene_dato or tiene_cita:
        c1 += 1
    if not banderas:
        c1 += 1
    else:
        c1 -= 2
    c1 = max(0, min(5, c1))

    # C2 ajuste a la narrativa (peso 3): sección + palabras clave.
    c2 = BASE_NARRATIVA_POR_SECCION.get(entrada.get("section", ""), 2)
    claves = _cuenta_claves(descripcion, PALABRAS_NARRATIVA)
    if claves >= 2:
        c2 += 1
    if claves >= 4:
        c2 += 1
    c2 = max(0, min(5, c2))

    # C3 ajuste de formato (peso 2): cita, lugares, metraje de video.
    c3 = 2
    if tiene_cita:
        c3 += 1
    if _cuenta_claves(descripcion, PALABRAS_LUGAR) >= 2:
        c3 += 1
    if "/reel/" in url or "/shorts/" in url or "/videos/" in url:
        c3 += 1
    c3 = max(0, min(5, c3))

    # C4 potencial de gancho (peso 2): cita, contradicción, fecha, pregunta.
    c4 = 1
    if tiene_cita:
        c4 += 1
    if _cuenta_claves(descripcion, PALABRAS_CONTRADICCION) >= 1:
        c4 += 1
    if any(mes in descripcion.lower() for mes in MESES) or tiene_dato:
        c4 += 1
    if "?" in descripcion or "¿" in descripcion:
        c4 += 1
    c4 = max(0, min(5, c4))

    # C5 actualidad (peso 2): horas desde la publicación hasta el
    # mediodía UTC del día del digest.
    try:
        ts = datetime.strptime(entrada["timestamp"], "%Y-%m-%dT%H:%M:%SZ")
        ts = ts.replace(tzinfo=timezone.utc)
        horas = max(0.0, (ref - ts).total_seconds() / 3600.0)
    except (KeyError, ValueError):
        horas = 48.0
    if horas <= 12:
        c5 = 5
    elif horas <= 24:
        c5 = 4
    elif horas <= 36:
        c5 = 3
    elif horas <= 48:
        c5 = 2
    else:
        c5 = 1

    criterios = {"valor_informativo": c1, "narrativa": c2, "formato": c3,
                 "gancho": c4, "actualidad": c5}
    total = sum(criterios[k] * PESOS[k] for k in PESOS)

    # Engagement: señal DÉBIL. +0,1 por orden de magnitud de likes,
    # tope +0,5. Un ítem importante con pocos likes no queda fuera por
    # esto (caso Kane, 21-nov-2026).
    likes = entrada.get("likes")
    if likes is None:
        bonus = 0.0
    else:
        bonus = round(min(0.5, 0.1 * math.log10(likes + 1)), 1)
    total = round(total + bonus, 1)

    formato, motivo = sugerir_formato(descripcion, tiene_cita,
                                      "/reel/" in url or "/shorts/" in url)
    gancho = tipo_gancho_sugerido(descripcion, tiene_cita)
    justificacion = justificar(entrada, criterios, formato, gancho, banderas)
    return {
        "criterios": criterios,
        "bonus_engagement": bonus,
        "total": total,
        "formato_sugerido": formato,
        "tipo_gancho": gancho,
        "justificacion": justificacion,
        "banderas": banderas,
    }


def justificar(entrada: dict, criterios: dict, formato: str, gancho: str,
               banderas: list[str]) -> str:
    """UNA LÍNEA por ítem: por qué puede funcionar + qué formato y
    gancho encajan. Se construye desde los criterios más altos."""
    partes = []
    mejor = max(criterios, key=lambda k: criterios[k])
    if mejor == "narrativa":
        partes.append("encaja de lleno en la narrativa del Memorial")
    elif mejor == "valor_informativo":
        partes.append("hecho sustancial con material para un guion")
    elif mejor == "gancho":
        partes.append("trae gancho (cita, contradicción o fecha)")
    elif mejor == "formato":
        partes.append("tiene imagen o cita para sostener el formato")
    elif mejor == "actualidad":
        partes.append("es noticia de hoy, con la ventana abierta")
    if criterios["narrativa"] >= 4 and mejor != "narrativa":
        partes.append("además encaja en la narrativa del Memorial")
    if criterios["gancho"] >= 4 and mejor != "gancho":
        partes.append("con gancho claro")
    texto = "; ".join(partes) if partes else "candidato de la shortlist"
    cita = primera_cita(entrada.get("description", ""))
    if cita:
        recorte = cita[:80].rstrip()
        if len(cita) > 80:
            recorte += "…"
        texto += f". Cita en pantalla: «{recorte}»"
    texto += f". Formato: {formato}; gancho: {gancho}."
    if banderas:
        texto += f" Ojo: {'; '.join(banderas)}."
    return texto[0].upper() + texto[1:]


def rankear(fecha: str, digest_path: Path, props_dir: Path,
            news_content: Path) -> tuple[list[dict], dict]:
    """Parsea el digest, deduce y puntúa. Devuelve (shortlist, stats).
    La shortlist puede estar vacía (ningún ítem supera el umbral)."""
    radar_mod = importar_radar(news_content)
    texto = digest_path.read_text(encoding="utf-8")
    entradas, stats_parseo = radar_mod.parse_digest(texto)
    unicas, dupes = radar_mod.dedupe(entradas)
    ya_propuestas = urls_propuestas(props_dir)
    frescas = [e for e in unicas if e.get("url") not in ya_propuestas]
    ref = datetime.strptime(fecha, "%Y-%m-%d").replace(
        tzinfo=timezone.utc, hour=12)
    puntuadas = []
    for entrada in frescas:
        puntuacion = puntuar_entrada(entrada, ref, radar_mod)
        puntuadas.append({**entrada, "puntuacion": puntuacion})
    # Orden: total desc; desempate por narrativa, luego likes, luego
    # más reciente. El engagement NUNCA ordena por encima del total.
    # Dos pasadas estables: primero por fecha (más reciente primero),
    # luego por los criterios numéricos.
    puntuadas.sort(key=lambda c: c.get("timestamp", ""), reverse=True)
    puntuadas.sort(key=lambda c: (
        -c["puntuacion"]["total"],
        -c["puntuacion"]["criterios"]["narrativa"],
        -(c.get("likes") or 0),
    ))
    shortlist = [c for c in puntuadas
                 if c["puntuacion"]["total"] >= UMBRAL_SHORTLIST]
    shortlist = shortlist[:SHORTLIST_MAX]
    for i, c in enumerate(shortlist, start=1):
        c["rank"] = i
    stats = {
        "parseadas": len(entradas),
        "unicas": len(unicas),
        "duplicadas": dupes,
        "ya_propuestas": len(unicas) - len(frescas),
        "frescas": len(frescas),
        "sobre_umbral": len(shortlist),
        "secciones": stats_parseo.get("sections", []),
        "lineas_omitidas": stats_parseo.get("skipped_lines", 0),
    }
    return shortlist, stats


def shortlist_markdown(fecha: str, shortlist: list[dict], stats: dict) -> str:
    lineas = [
        f"# Shortlist de propuestas — {fecha}",
        "",
        f"Entradas parseadas: {stats['parseadas']} · únicas: "
        f"{stats['unicas']} · ya propuestas (excluidas): "
        f"{stats['ya_propuestas']} · frescas: {stats['frescas']} · "
        f"sobre el umbral ({UMBRAL_SHORTLIST:.0f}): {stats['sobre_umbral']}",
        "",
        "Criterios (0–5, ver preprod/RANKING.md): C1 valor informativo "
        "(×3) · C2 narrativa (×3) · C3 formato (×2) · C4 gancho (×2) · "
        "C5 actualidad (×2). Total máximo 60 + 0,5 de bonus por "
        "engagement (señal débil).",
        "",
        "El agente puede ajustar una puntuación editando este archivo: "
        "escribe el ajuste con motivo (p. ej. «Ajuste del agente: C2 "
        "3→4, motivo: …») y nunca cambies un número en silencio.",
        "",
    ]
    for c in shortlist:
        p = c["puntuacion"]
        crit = p["criterios"]
        if c.get("likes") is not None:
            likes_txt = f"{c['likes']:,} likes".replace(",", ".")
        else:
            likes_txt = "likes s/d"
        banderas = (f" ⚠️ {'; '.join(p['banderas'])}" if p["banderas"]
                    else "")
        tema = tema_corto(c["description"])
        encabezado = f"## {c['rank']}. [{c['section']}] {c['entity']}"
        if tema:
            encabezado += f" — «{tema}»"
        encabezado += f" (total {p['total']}){banderas}"
        lineas += [
            encabezado,
            "",
            c["url"],
            "",
            f"- C1 valor informativo: {crit['valor_informativo']} · "
            f"C2 narrativa: {crit['narrativa']} · "
            f"C3 formato: {crit['formato']} · "
            f"C4 gancho: {crit['gancho']} · "
            f"C5 actualidad: {crit['actualidad']} · "
            f"bonus engagement: +{p['bonus_engagement']} "
            f"({likes_txt}, {c['timestamp'][:16]}Z)",
            f"- {p['justificacion']}",
            "",
        ]
    return "\n".join(lineas)


def shortlist_json(fecha: str, shortlist: list[dict], stats: dict) -> dict:
    return {
        "fecha": fecha,
        "umbral": UMBRAL_SHORTLIST,
        "stats": stats,
        "items": [
            {
                "rank": c["rank"],
                "section": c["section"],
                "entity": c["entity"],
                "handle": c.get("handle", ""),
                "url": c["url"],
                "timestamp": c["timestamp"],
                "likes": c.get("likes"),
                "description": c["description"],
                "criterios": c["puntuacion"]["criterios"],
                "bonus_engagement": c["puntuacion"]["bonus_engagement"],
                "total": c["puntuacion"]["total"],
                "formato_sugerido": c["puntuacion"]["formato_sugerido"],
                "tipo_gancho": c["puntuacion"]["tipo_gancho"],
                "justificacion": c["puntuacion"]["justificacion"],
                "banderas": c["puntuacion"]["banderas"],
            }
            for c in shortlist
        ],
    }


def escribir_shortlist(props_dir: Path, fecha: str, shortlist: list[dict],
                       stats: dict, force: bool) -> tuple[Path, Path]:
    carpeta = props_dir / fecha
    md_path = carpeta / "SHORTLIST.md"
    json_path = carpeta / "SHORTLIST.json"
    if (md_path.exists() or json_path.exists()) and not force:
        print(f"error: ya existe una shortlist para {fecha} en {carpeta} "
              f"(usa --force para regenerarla; ojo: se pierden los ajustes "
              f"del agente anotados en el .md)", file=sys.stderr)
        raise SystemExit(1)
    carpeta.mkdir(parents=True, exist_ok=True)
    md_path.write_text(shortlist_markdown(fecha, shortlist, stats),
                       encoding="utf-8")
    json_path.write_text(json.dumps(shortlist_json(fecha, shortlist, stats),
                                    ensure_ascii=False, indent=2) + "\n",
                         encoding="utf-8")
    return md_path, json_path


# --- check ----------------------------------------------------------------

ITEM_CHECKLIST_RE = re.compile(
    r"^-\s*\[[ xX]\]\s+([A-Z]\d+[a-z]?)\b.*?estado:\s*(pass|flag|pendiente)\b"
    r".*?evidencia:\s*(.*)$")
URL_RE = re.compile(r"https?://\S+")


def dividir_secciones(texto: str) -> dict[str, list[str]]:
    """Secciones `## Nombre` -> líneas de cuerpo (sin el encabezado)."""
    secciones: dict[str, list[str]] = {}
    actual = None
    for linea in texto.splitlines():
        m = re.match(r"^##\s+(.+?)\s*$", linea)
        if m:
            actual = m.group(1).strip()
            secciones[actual] = []
        elif actual is not None:
            secciones[actual].append(linea)
    return secciones


def seccion_por_prefijo(secciones: dict[str, list[str]],
                        prefijo: str) -> list[str]:
    for nombre, lineas in secciones.items():
        if nombre.lower().startswith(prefijo.lower()):
            return lineas
    return []


def lineas_vo(lineas_guion: list[str]) -> list[str]:
    """Líneas numeradas de voz en off (las `>` son plan visual)."""
    vo = []
    for linea in lineas_guion:
        m = re.match(r"^\s*\d+[.)]\s+(.+?)\s*$", linea)
        if m:
            vo.append(m.group(1))
    return vo


def lineas_visuales(lineas_guion: list[str]) -> list[str]:
    return [re.sub(r"^>\s*", "", linea).strip()
            for linea in lineas_guion if linea.strip().startswith(">")]


def buscar_coincidencias(patron: str, lineas: list[str]) -> list[tuple[int, str]]:
    """Coincidencias de un patrón regex, con nº de línea y línea de
    evidencia. Los patrones con `^` se prueban línea a línea; los de
    proximidad (con [\\s\\S]) sobre el texto unido."""
    try:
        rx = re.compile(patron, re.IGNORECASE | re.MULTILINE)
    except re.error:
        return []
    halladas: list[tuple[int, str]] = []
    if "[\\s\\S]" in patron:
        texto = "\n".join(lineas)
        for m in rx.finditer(texto):
            num = texto[: m.start()].count("\n") + 1
            linea = lineas[num - 1] if 0 < num <= len(lineas) else m.group(0)
            halladas.append((num, linea.strip()))
    else:
        for i, linea in enumerate(lineas, start=1):
            if rx.search(linea):
                halladas.append((i, linea.strip()))
    return halladas


def _validar_dossier(ruta: Path) -> list[str]:
    """Valida un dossier con investigate.py (importación perezosa: el
    módulo se carga solo cuando un pack referencia un dossier)."""
    scripts_dir = Path(__file__).resolve().parent
    if str(scripts_dir) not in sys.path:
        sys.path.insert(0, str(scripts_dir))
    try:
        import investigate
    except ImportError:
        return [f"no se pudo cargar investigate.py desde {scripts_dir}"]
    return investigate.validar_dossier(ruta)


def fecha_del_pack(ruta: Path, texto: str) -> str | None:
    """Fecha del pack: primero del path (propuestas/YYYY-MM-DD/...),
    si no de la línea «> Fecha:» del encabezado."""
    for parte in ruta.parts:
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", parte):
            return parte
    m = re.search(r"^> Fecha:\s*(\d{4}-\d{2}-\d{2})", texto, re.M)
    return m.group(1) if m else None


def validar_pack(ruta: Path, checklist: dict) -> tuple[list[str], list[str]]:
    """Valida un pack rellenado. Devuelve (fallos, avisos): los avisos
    no bloquean (p. ej. un pack anterior a la etapa de investigación
    sin dossier referenciado)."""
    fallos: list[str] = []
    avisos: list[str] = []
    try:
        texto = ruta.read_text(encoding="utf-8")
    except OSError as exc:
        return [f"no se pudo leer el pack: {exc}"], []
    secciones = dividir_secciones(texto)

    # 1. Marcadores sin rellenar.
    for i, linea in enumerate(texto.splitlines(), start=1):
        if MARCADOR_ESCRIBIR in linea:
            fallos.append(f"marcador sin rellenar en la línea {i}: "
                          f"{linea.strip()[:100]}")

    # 2. Ficha: fuente con URL presente.
    ficha = seccion_por_prefijo(secciones, "Ficha")
    texto_ficha = "\n".join(ficha)
    m_fuente = re.search(r"^- Fuente:\s*(.+)$", texto_ficha, re.M)
    if not m_fuente or not URL_RE.search(m_fuente.group(1)):
        fallos.append("la ficha no tiene fuente con URL "
                      "(línea «- Fuente: <nombre> — <URL>»)")

    # 3. Ganchos: 3 presentes y no vacíos.
    ganchos_lineas = seccion_por_prefijo(secciones, "Ganchos")
    ganchos = [re.sub(r"^\s*\d+[.)]\s*", "", l).strip()
               for l in ganchos_lineas
               if re.match(r"^\s*\d+[.)]\s+\S", l)]
    if len(ganchos) < GANCHOS_MIN:
        fallos.append(f"ganchos: se esperan {GANCHOS_MIN} opciones, "
                      f"hay {len(ganchos)}")

    # 4. Guion: 120–170 palabras habladas; plan visual presente.
    guion_lineas = seccion_por_prefijo(secciones, "Guion")
    vo = lineas_vo(guion_lineas)
    visual = lineas_visuales(guion_lineas)
    palabras = sum(contar_palabras(l) for l in vo)
    if not vo:
        fallos.append("guion: no hay líneas numeradas de voz en off")
    elif not (PALABRAS_MIN <= palabras <= PALABRAS_MAX):
        fallos.append(f"guion: {palabras} palabras habladas, fuera del "
                      f"rango {PALABRAS_MIN}–{PALABRAS_MAX}")
    if not visual:
        fallos.append("guion: falta el plan visual (líneas `>` por escena)")

    # 5. Checklist: cada regla con estado pass/flag + evidencia escrita.
    checklist_lineas = seccion_por_prefijo(secciones, "Checklist")
    estados: dict[str, tuple[str, str]] = {}
    for linea in checklist_lineas:
        m = ITEM_CHECKLIST_RE.match(linea.strip())
        if m:
            estados[m.group(1)] = (m.group(2).lower(), m.group(3).strip())
    for regla in checklist["reglas"]:
        rid = regla["id"]
        if rid not in estados:
            fallos.append(f"checklist: falta la regla {rid}")
            continue
        estado, evidencia = estados[rid]
        if estado == "pendiente":
            fallos.append(f"checklist: la regla {rid} sigue pendiente")
        elif not evidencia:
            fallos.append(f"checklist: la regla {rid} ({estado}) no tiene "
                          f"evidencia escrita")

    # 6. Reglas mecánicas del checklist (regex / regex_max).
    textos_alcance = {
        "guion": vo,
        "ganchos": ganchos,
        "plan_visual": visual,
    }
    for regla in checklist["reglas"]:
        tipo = regla.get("tipo")
        if tipo not in ("regex", "regex_max"):
            continue
        lineas: list[str] = []
        for ambito in regla.get("alcance", ["guion", "ganchos", "plan_visual"]):
            lineas += textos_alcance.get(ambito, [])
        for patron in regla.get("patrones", []):
            halladas = buscar_coincidencias(patron, lineas)
            if tipo == "regex" and halladas:
                num, linea = halladas[0]
                fallos.append(f"{regla['id']}: {regla['texto'][:80]}… "
                              f"— evidencia: «{linea[:120]}»")
            elif tipo == "regex_max":
                maximo = regla.get("maximo", 1)
                if len(halladas) > maximo:
                    fallos.append(
                        f"{regla['id']}: {regla['texto'][:80]}… — "
                        f"{len(halladas)} coincidencias (máximo {maximo}); "
                        f"primera: «{halladas[0][1][:120]}»")

    # 7. Dossier de investigación (NARRATIVA.md R31): sin dossier
    # verificado no hay guion. Los packs anteriores a la etapa solo
    # reciben un aviso; los nuevos fallan sin dossier o con un
    # dossier que no pasa su propia validación.
    fecha_pack = fecha_del_pack(ruta, texto)
    es_legado = fecha_pack is None or fecha_pack <= DOSSIER_CORTE_LEGADO
    m_dossier = re.search(r"^- Dossier:\s*(.+)$", texto_ficha, re.M)
    if m_dossier is None:
        if es_legado:
            avisos.append("sin dossier de investigación referenciado "
                          "(pack anterior a la etapa de investigación; "
                          "dossier retroactivo recomendado)")
        else:
            fallos.append("falta la línea «- Dossier:» en la ficha "
                          "(etapa de investigación previa, NARRATIVA.md R31)")
    else:
        dossier_valor = m_dossier.group(1).strip()
        if (dossier_valor.lower().startswith("pendiente")
                or MARCADOR_ESCRIBIR in dossier_valor):
            if es_legado:
                avisos.append("dossier pendiente (pack anterior a la "
                              "etapa de investigación)")
            else:
                fallos.append("dossier pendiente: investiga el tema con "
                              "`investigate.py new <tema>` antes de "
                              "redactar el guion (NARRATIVA.md R31)")
        else:
            ruta_dossier = Path(dossier_valor)
            if not ruta_dossier.is_absolute():
                ruta_dossier = (ruta.parent / ruta_dossier).resolve()
            if not ruta_dossier.exists():
                fallos.append(f"dossier no encontrado: {dossier_valor}")
            else:
                for fallo in _validar_dossier(ruta_dossier):
                    fallos.append(f"dossier: {fallo}")
    return fallos, avisos


# --- Subcomandos ----------------------------------------------------------

def cmd_draft(args) -> int:
    checklist = cargar_checklist()
    fecha = args.date or today_local()
    props_dir = Path(args.out) if args.out else DEFAULT_PROPS_DIR
    news_content = Path(args.news_content) if args.news_content \
        else DEFAULT_NEWS_CONTENT
    if args.from_draft:
        ruta = Path(args.from_draft)
        if not ruta.exists():
            print(f"error: borrador no encontrado: {ruta}", file=sys.stderr)
            return 1
        ficha, slug = ficha_desde_borrador(ruta, news_content, fecha)
        origen = f"borrador {ruta}"
    elif args.from_radar:
        radar_mod = importar_radar(news_content)
        digest_path = Path(args.from_radar)
        if not digest_path.exists():
            print(f"error: digest no encontrado: {digest_path}",
                  file=sys.stderr)
            return 1
        entradas, _ = radar_mod.parse_digest(
            digest_path.read_text(encoding="utf-8"))
        unicas, _ = radar_mod.dedupe(entradas)
        entrada = next((e for e in unicas if e.get("url") == args.url), None)
        if entrada is None:
            print(f"error: URL no encontrada en el digest: {args.url}",
                  file=sys.stderr)
            return 1
        ficha, slug = ficha_desde_radar(entrada, radar_mod, fecha)
        origen = f"digest {digest_path}"
    else:
        print("error: draft necesita --from-draft <ruta.md> o "
              "--from-radar <digest.txt> --url <url>", file=sys.stderr)
        return 2
    if args.slug:
        slug = slugify(args.slug)
    slug = slug_unico(props_dir, fecha, slug, ficha.get("fuente_url", ""))
    if args.dossier:
        ruta_dossier = Path(args.dossier)
        if not ruta_dossier.exists():
            print(f"error: dossier no encontrado: {ruta_dossier}",
                  file=sys.stderr)
            return 1
        fallos_dossier = _validar_dossier(ruta_dossier)
        if fallos_dossier:
            print(f"error: dossier no válido: {ruta_dossier}",
                  file=sys.stderr)
            for fallo in fallos_dossier:
                print(f"  - {fallo}", file=sys.stderr)
            return 1
        ficha["dossier"] = args.dossier
    contenido = construir_pack(ficha, checklist)
    destino = escribir_pack(props_dir, fecha, slug, contenido, args.force)
    pack_rel = f"{fecha}/{slug}/propuesta.md"
    registrar_propuesta(props_dir, ficha.get("fuente_url", ""), pack_rel,
                        fecha, ficha["titulo"])
    print(f"pack creado: {destino} (desde {origen})")
    if not args.dossier:
        print("aviso: sin dossier de investigación — crea uno con "
              "`investigate.py new <tema>` y rellena la línea Dossier de "
              "la ficha antes de redactar el guion (NARRATIVA.md R31)")
    return 0


def cmd_check(args) -> int:
    checklist = cargar_checklist()
    ruta = Path(args.pack)
    if not ruta.exists():
        print(f"error: pack no encontrado: {ruta}", file=sys.stderr)
        return 1
    fallos, avisos = validar_pack(ruta, checklist)
    for aviso in avisos:
        print(f"aviso: {aviso}")
    if fallos:
        print(f"check FALLIDO ({len(fallos)}): {ruta}")
        for fallo in fallos:
            print(f"  - {fallo}")
        return 1
    print(f"check OK: {ruta}")
    return 0


def cmd_rank(args) -> int:
    fecha = args.date or today_local()
    props_dir = Path(args.out) if args.out else DEFAULT_PROPS_DIR
    digest_dir = Path(args.digest_dir) if args.digest_dir \
        else DEFAULT_DIGEST_DIR
    news_content = Path(args.news_content) if args.news_content \
        else DEFAULT_NEWS_CONTENT
    digest_path = ruta_digest(fecha, digest_dir)
    if not digest_path.exists():
        print(f"error: digest no encontrado: {digest_path} (el radar de "
              f"las 07:17 escribe el digest; si falta, falló o no terminó)",
              file=sys.stderr)
        return 1
    shortlist, stats = rankear(fecha, digest_path, props_dir, news_content)
    if not shortlist:
        print(f"rank {fecha}: ningún ítem supera el umbral "
              f"{UMBRAL_SHORTLIST:.0f} — sin shortlist (silencio, sin relleno)")
        return 0
    md_path, json_path = escribir_shortlist(props_dir, fecha, shortlist,
                                            stats, args.force)
    print(f"rank {fecha}: shortlist con {len(shortlist)} ítems "
          f"(de {stats['frescas']} frescos) → {md_path}")
    return 0


def cmd_daily(args) -> int:
    fecha = args.date or today_local()
    props_dir = Path(args.out) if args.out else DEFAULT_PROPS_DIR
    digest_dir = Path(args.digest_dir) if args.digest_dir \
        else DEFAULT_DIGEST_DIR
    news_content = Path(args.news_content) if args.news_content \
        else DEFAULT_NEWS_CONTENT
    digest_path = ruta_digest(fecha, digest_dir)
    carpeta = props_dir / fecha
    carpeta.mkdir(parents=True, exist_ok=True)
    log_path = carpeta / "daily.log"
    lineas_log: list[str] = []

    def log(msg: str) -> None:
        marca = datetime.now(timezone.utc).strftime("%H:%M:%S")
        lineas_log.append(f"[{marca}Z] {msg}")
        print(msg)

    log(f"daily {fecha}: inicio")
    if not digest_path.exists():
        log(f"ERROR: digest no encontrado: {digest_path} (el radar de las "
            f"07:17 escribe el digest; si falta, falló o no terminó)")
        log_path.write_text("\n".join(lineas_log) + "\n", encoding="utf-8")
        return 1
    shortlist, stats = rankear(fecha, digest_path, props_dir, news_content)
    log(f"digest: {stats['parseadas']} entradas, {stats['unicas']} únicas, "
        f"{stats['ya_propuestas']} ya propuestas, {stats['frescas']} frescas")
    if not shortlist:
        log(f"sin shortlist: ningún ítem supera el umbral "
            f"{UMBRAL_SHORTLIST:.0f} — sin packs (silencio, sin relleno)")
        log(f"daily {fecha}: fin (sin propuestas)")
        log_path.write_text("\n".join(lineas_log) + "\n", encoding="utf-8")
        return 0
    escribir_shortlist(props_dir, fecha, shortlist, stats, force=True)
    log(f"shortlist: {len(shortlist)} ítems → {fecha}/SHORTLIST.md")
    checklist = cargar_checklist()
    radar_mod = importar_radar(news_content)
    creados = 0
    for candidato in shortlist[:DAILY_PACKS]:
        ficha, slug = ficha_desde_radar(candidato, radar_mod, fecha)
        slug = slug_unico(props_dir, fecha, slug,
                          ficha.get("fuente_url", ""))
        contenido = construir_pack(ficha, checklist)
        destino = escribir_pack(props_dir, fecha, slug, contenido,
                                force=True)
        registrar_propuesta(props_dir, ficha.get("fuente_url", ""),
                            f"{fecha}/{slug}/propuesta.md", fecha,
                            ficha["titulo"])
        log(f"pack {candidato['rank']}: {destino}")
        creados += 1
    if creados:
        log(f"dossier: los {creados} packs salen con Dossier pendiente; "
            f"investigar con `investigate.py new <tema>` antes de redactar")
    log(f"daily {fecha}: fin ({creados} packs creados)")
    log_path.write_text("\n".join(lineas_log) + "\n", encoding="utf-8")
    return 0


# --- CLI ------------------------------------------------------------------

def construir_cli() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="propose.py",
        description="Preproducción de reels del Memorial de la Denuncia: "
                    "packs de propuesta, validación contra el checklist de "
                    "Suleris, ranking del radar y corrida diaria. Ningún "
                    "subcomando dispara edición.")
    sub = parser.add_subparsers(dest="comando", required=True)

    p_draft = sub.add_parser(
        "draft",
        help="crea el andamio de un pack de propuesta",
        description="Crea el andamio de un pack de propuesta desde un "
                    "borrador de news-content o desde una entrada del "
                    "digest del radar. El andamio NUNCA inventa hechos: "
                    "los hechos, la fuente y la clasificación salen del "
                    "input; lo creativo queda marcado [ESCRIBIR].")
    p_draft.add_argument("--from-draft", metavar="RUTA.MD",
                         help="borrador de news-content "
                              "(drafts/<id>-reel.md); si existe su "
                              "items/<id>.json, los hechos mandan")
    p_draft.add_argument("--from-radar", metavar="DIGEST.TXT",
                         help="digest del radar (radar-YYYY-MM-DD-digest.txt)")
    p_draft.add_argument("--url", metavar="URL",
                         help="URL de la entrada del digest "
                              "(con --from-radar)")
    p_draft.add_argument("--date", metavar="YYYY-MM-DD",
                         type=validar_fecha,
                         help="fecha del pack (defecto: hoy en "
                              "America/Puerto_Rico)")
    p_draft.add_argument("--slug", metavar="SLUG",
                         help="slug del pack (defecto: desde el título)")
    p_draft.add_argument("--dossier", metavar="RUTA",
                         help="dossier de investigación verificado "
                              "(investigate.py); se valida antes de "
                              "crear el pack y queda en la línea "
                              "Dossier de la ficha")
    p_draft.add_argument("--force", action="store_true",
                         help="sobrescribir el pack si ya existe")
    p_draft.add_argument("--out", metavar="DIR",
                         help="directorio de propuestas (defecto: "
                              "preprod/propuestas)")
    p_draft.add_argument("--news-content", metavar="DIR",
                         help="directorio de news-content (defecto: "
                              "~/workspace/news-content)")
    p_draft.set_defaults(func=cmd_draft)

    p_check = sub.add_parser(
        "check",
        help="valida un pack rellenado contra el checklist de Suleris",
        description="Valida un pack rellenado: chequeos mecánicos (regex "
                    "del checklist contra guion, ganchos y plan visual) y "
                    "estructurales (3 ganchos, sin marcadores [ESCRIBIR], "
                    "guion 120–170 palabras, checklist completo con "
                    "evidencia, fuente con URL) y la puerta de la etapa "
                    "de investigación (NARRATIVA.md R31): los packs "
                    "nuevos exigen un dossier verificado referenciado "
                    "en la ficha; los packs del 2026-11-22 o anteriores "
                    "solo reciben un aviso. Exit 0 solo si todo pasa.")
    p_check.add_argument("pack", metavar="PACK",
                         help="ruta a propuesta.md")
    p_check.set_defaults(func=cmd_check)

    p_rank = sub.add_parser(
        "rank",
        help="rankea las noticias del día desde el digest del radar",
        description="Parsea el digest del radar, excluye las URLs ya "
                    "propuestas (preprod/propuestas/index.json), puntúa "
                    "cada entrada fresca con los 5 criterios de "
                    "preprod/RANKING.md y escribe la shortlist "
                    "(SHORTLIST.md + SHORTLIST.json). Si ningún ítem "
                    "supera el umbral, no escribe shortlist y sale con 0.")
    p_rank.add_argument("--date", metavar="YYYY-MM-DD", type=validar_fecha,
                        help="fecha del digest (defecto: hoy en "
                             "America/Puerto_Rico)")
    p_rank.add_argument("--force", action="store_true",
                        help="regenerar la shortlist aunque ya exista "
                             "(se pierden los ajustes del agente)")
    p_rank.add_argument("--out", metavar="DIR",
                        help="directorio de propuestas (defecto: "
                             "preprod/propuestas)")
    p_rank.add_argument("--digest-dir", metavar="DIR",
                        help="directorio de los digests del radar")
    p_rank.add_argument("--news-content", metavar="DIR",
                        help="directorio de news-content (defecto: "
                             "~/workspace/news-content)")
    p_rank.set_defaults(func=cmd_rank)

    p_daily = sub.add_parser(
        "daily",
        help="corrida diaria: rank + packs de los 2–3 primeros",
        description="Encadena rank y la creación de packs (andamios) para "
                    "los 2–3 primeros de la shortlist. Escribe el log en "
                    "preprod/propuestas/<fecha>/daily.log. Si falta el "
                    "digest, sale con 1. Si ningún ítem supera el umbral, "
                    "no crea packs y sale con 0.")
    p_daily.add_argument("--date", metavar="YYYY-MM-DD", type=validar_fecha,
                         help="fecha de la corrida (defecto: hoy en "
                              "America/Puerto_Rico)")
    p_daily.add_argument("--out", metavar="DIR",
                         help="directorio de propuestas (defecto: "
                              "preprod/propuestas)")
    p_daily.add_argument("--digest-dir", metavar="DIR",
                         help="directorio de los digests del radar")
    p_daily.add_argument("--news-content", metavar="DIR",
                         help="directorio de news-content (defecto: "
                             "~/workspace/news-content)")
    p_daily.set_defaults(func=cmd_daily)
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = construir_cli()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
