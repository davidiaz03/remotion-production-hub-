#!/usr/bin/env python3
"""investigate.py — etapa de investigación previa de preproducción.

Antes de escribir el guion de un reel, el tema se investiga a fondo:
hechos verificados contra su fuente primaria, referencias de videos y
posts del tema que funcionan (SOLO como guía, nunca copia), tendencias
que se puedan adaptar al tema y ganchos que funcionan en el tema.
Las referencias son el centro del dossier, no un extra. El dossier
es el artefacto de esa etapa: un tema, un dossier, antes del guion.

PUERTA (NARRATIVA.md R31): sin dossier verificado no hay guion.
`propose.py check` exige el dossier en los packs nuevos; los packs
anteriores a la etapa (2026-11-22 o antes) solo reciben un aviso y
pueden recibir un dossier retroactivo.

Solo Python stdlib, sin red, determinista y offline. No duplica el
escáner de outliers: el dossier REFERENCIA sus informes
(`preprod/research/outliers-*.md`) en el campo Origen de cada
referencia que venga de ahí.

Uso:
  python3 scripts/preprod/investigate.py new <tema>
  python3 scripts/preprod/investigate.py check <slug | ruta/dossier.md>

Salidas: 0 OK · 1 error operativo o validación fallida · 2 uso incorrecto.
"""

from __future__ import annotations

import argparse
import re
import sys
import unicodedata
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.dont_write_bytecode = True

REPO_ROOT = Path(__file__).resolve().parents[2]
PREPROD_DIR = REPO_ROOT / "preprod"
DEFAULT_INVEST_DIR = PREPROD_DIR / "investigacion"

REFERENCIAS_MIN = 3
REFERENCIAS_MAX = 5
GANCHOS_MIN = 2
TENDENCIAS_MIN = 2

MARCADOR_ESCRIBIR = "[ESCRIBIR"
ESTADOS_HECHO = ("VERIFICADO", "NO CONFIRMADO", "NO VERIFICADO")
URL_RE = re.compile(r"https?://\S+")
HECHO_RE = re.compile(
    r"^-\s*\[(VERIFICADO|NO CONFIRMADO|NO VERIFICADO)\]\s*(.+)$")
FECHA_RE = re.compile(r"—\s*Fecha:\s*(\d{4}-\d{2}-\d{2})")
FUENTE_RE = re.compile(r"—\s*Fuente:\s*(.+?)(?:\s*—\s*Fecha:|$)")


# --- Utilidades (copias de propose.py: no hay módulo compartido en
# scripts/preprod; mantener sincronizadas) -------------------------------

def today_local() -> str:
    """Fecha de hoy en America/Puerto_Rico (= hora oficial de Cuba)."""
    try:
        from zoneinfo import ZoneInfo
        tz = ZoneInfo("America/Puerto_Rico")
    except Exception:  # noqa: BLE001 - sin tzdata, UTC-4 fijo
        tz = timezone(timedelta(hours=-4))
    return datetime.now(tz).strftime("%Y-%m-%d")


def slugify(texto: str, max_len: int = 60) -> str:
    """«La negación del embargo» -> «la-negacion-del-embargo»."""
    normalizado = unicodedata.normalize("NFKD", texto or "")
    sin_tildes = "".join(c for c in normalizado
                         if not unicodedata.combining(c))
    bajo = sin_tildes.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", bajo).strip("-")
    slug = re.sub(r"-+", "-", slug)
    return slug[:max_len].rstrip("-") or "sin-titulo"


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


def tiene_seccion(secciones: dict[str, list[str]], prefijo: str) -> bool:
    return any(nombre.lower().startswith(prefijo.lower())
               for nombre in secciones)


# --- Plantilla ------------------------------------------------------------

def construir_dossier(tema: str, slug: str, fecha: str) -> str:
    """Plantilla de dossier.md. Los huecos quedan marcados [ESCRIBIR]:
    un dossier recién creado NO pasa `check` hasta rellenarse."""
    return f"""# Dossier de investigación — {tema}

> Etapa de investigación previa (NARRATIVA.md R31): antes del guion,
> el tema se investiga a fondo y se verifica todo el contenido.
> Tema: {tema} · Slug: {slug} · Fecha: {fecha} · Estado: en curso
> Pack(s): — (se rellenan al crear el pack)

## Hechos verificados

> Un hecho por línea. Estado: VERIFICADO (fuente primaria abierta
> directamente), NO CONFIRMADO (corroborado por terceros, sin
> primaria) o NO VERIFICADO (no se encontró o no se pudo confirmar).
> Solo los hechos VERIFICADOS pueden entrar en el guion como hechos;
> los demás se registran para no usarlos por error. Fecha: fecha del
> hecho (o de la lectura, para documentos vigentes).

- [VERIFICADO] [ESCRIBIR: enunciado del hecho] — Fuente: [ESCRIBIR: URL de la fuente primaria] — Fecha: [ESCRIBIR: YYYY-MM-DD]
- [NO VERIFICADO] [ESCRIBIR: enunciado del hecho no verificado] — Fuente: sin fuente primaria — Fecha: [ESCRIBIR: YYYY-MM-DD]

## Referencias

> Videos o posts del tema que funcionan. GUÍA, nunca copia: se estudia
> por qué funcionan y qué se toma prestado (ritmo, estructura, gancho),
> no se reproduce su contenido. Entre 3 y 5 referencias. Las que vengan
> del escáner de outliers se anotan en Origen con la ruta del informe
> (preprod/research/outliers-*.md).

### 1. [ESCRIBIR: título o descripción corta]

- URL: [ESCRIBIR: URL del video o post]
- Plataforma: [ESCRIBIR: Instagram / Facebook / YouTube / Threads]
- Métricas: [ESCRIBIR: likes o vistas + fecha de la métrica]
- Por qué funciona: [ESCRIBIR]
- Qué se toma prestado (guía, no copia): [ESCRIBIR]
- Origen: [ESCRIBIR: investigación manual | escáner de outliers]

### 2. [ESCRIBIR: título o descripción corta]

- URL: [ESCRIBIR: URL del video o post]
- Plataforma: [ESCRIBIR: Instagram / Facebook / YouTube / Threads]
- Métricas: [ESCRIBIR: likes o vistas + fecha de la métrica]
- Por qué funciona: [ESCRIBIR]
- Qué se toma prestado (guía, no copia): [ESCRIBIR]
- Origen: [ESCRIBIR: investigación manual | escáner de outliers]

### 3. [ESCRIBIR: título o descripción corta]

- URL: [ESCRIBIR: URL del video o post]
- Plataforma: [ESCRIBIR: Instagram / Facebook / YouTube / Threads]
- Métricas: [ESCRIBIR: likes o vistas + fecha de la métrica]
- Por qué funciona: [ESCRIBIR]
- Qué se toma prestado (guía, no copia): [ESCRIBIR]
- Origen: [ESCRIBIR: investigación manual | escáner de outliers]

## Tendencias adaptables

> Tendencias que se puedan adaptar al tema (ángulos calientes,
> formatos que rinden, frases que circulan), SOLO como guía para el
> guion, nunca para copiar. Cada una con dónde se vio (URL o informe
> del escáner de outliers) y cómo se adapta a este tema. Al menos 2.

- [ESCRIBIR: tendencia]: [ESCRIBIR: cómo se adapta a este tema] — Visto en: [ESCRIBIR: URL o preprod/research/outliers-*.md]
- [ESCRIBIR: tendencia]: [ESCRIBIR: cómo se adapta a este tema] — Visto en: [ESCRIBIR: URL o preprod/research/outliers-*.md]

## Ganchos que funcionan

> Patrones de gancho observados en el tema (tipos de FORMATOS.md
> §1.2), con un ejemplo de cada uno y dónde se vio. Alimentan las 3
> opciones de gancho del pack; no son el gancho del reel.

- [ESCRIBIR: tipo de gancho]: [ESCRIBIR: ejemplo o patrón] — Visto en: [ESCRIBIR: referencia nº o URL]
- [ESCRIBIR: tipo de gancho]: [ESCRIBIR: ejemplo o patrón] — Visto en: [ESCRIBIR: referencia nº o URL]
"""


# --- Validación -----------------------------------------------------------

def _fecha_valida(texto: str) -> bool:
    try:
        datetime.strptime(texto, "%Y-%m-%d")
    except ValueError:
        return False
    return True


def _validar_hechos(lineas: list[str]) -> list[str]:
    """Valida las líneas de hechos. Devuelve los fallos."""
    fallos: list[str] = []
    n_hechos = 0
    n_verificados = 0
    for i, linea in enumerate(lineas, start=1):
        cruda = linea.strip()
        if not cruda.startswith("- "):
            continue
        m = HECHO_RE.match(cruda)
        if not m:
            if cruda.startswith("- ["):
                fallos.append(
                    f"hechos, línea {i}: estado no reconocido "
                    f"(se espera VERIFICADO, NO CONFIRMADO o NO VERIFICADO): "
                    f"«{cruda[:100]}»")
            else:
                fallos.append(
                    f"hechos, línea {i}: formato inválido (se espera "
                    f"«- [ESTADO] enunciado — Fuente: … — Fecha: YYYY-MM-DD»): "
                    f"«{cruda[:100]}»")
            continue
        estado, resto = m.group(1), m.group(2).strip()
        enunciado = re.split(r"\s*—\s*Fuente:", resto, maxsplit=1)[0].strip()
        n_hechos += 1
        if estado == "VERIFICADO":
            n_verificados += 1
        m_fecha = FECHA_RE.search(cruda)
        if not m_fecha or not _fecha_valida(m_fecha.group(1)):
            fallos.append(
                f"hecho «{enunciado[:80]}»: sin fecha válida "
                f"(«— Fecha: YYYY-MM-DD»)")
        m_fuente = FUENTE_RE.search(cruda)
        if not m_fuente or not m_fuente.group(1).strip():
            fallos.append(f"hecho «{enunciado[:80]}»: sin fuente")
        elif estado == "VERIFICADO" and not URL_RE.search(
                m_fuente.group(1)):
            fallos.append(
                f"hecho VERIFICADO sin fuente primaria (URL): "
                f"«{enunciado[:100]}»")
    if n_hechos == 0:
        fallos.append("el dossier no tiene hechos "
                      "(sección ## Hechos verificados vacía)")
    elif n_verificados == 0:
        fallos.append("el dossier no tiene ningún hecho VERIFICADO: "
                      "sin hechos verificados no hay guion")
    return fallos


def _dividir_referencias(lineas: list[str]) -> list[tuple[str, list[str]]]:
    """Subsecciones `### N. Título` -> (título, líneas de cuerpo)."""
    referencias: list[tuple[str, list[str]]] = []
    titulo = None
    cuerpo: list[str] = []
    for linea in lineas:
        m = re.match(r"^###\s+(?:\d+[.)]\s*)?(.+?)\s*$", linea)
        if m:
            if titulo is not None:
                referencias.append((titulo, cuerpo))
            titulo = m.group(1).strip()
            cuerpo = []
        elif titulo is not None:
            cuerpo.append(linea)
    if titulo is not None:
        referencias.append((titulo, cuerpo))
    return referencias


def _campo_referencia(lineas: list[str], etiqueta: str) -> str | None:
    """Valor de `- Etiqueta: …` (prefijo; admite texto entre la
    etiqueta y los dos puntos, como en «Qué se toma prestado (guía,
    no copia):»). Devuelve None si el campo no existe."""
    patron = re.compile(rf"^-\s*{re.escape(etiqueta)}[^:]*:\s*(.+?)\s*$",
                        re.IGNORECASE)
    for linea in lineas:
        m = patron.match(linea.strip())
        if m:
            return m.group(1)
    return None


def _validar_referencias(lineas: list[str]) -> list[str]:
    fallos: list[str] = []
    referencias = _dividir_referencias(lineas)
    if not (REFERENCIAS_MIN <= len(referencias) <= REFERENCIAS_MAX):
        fallos.append(
            f"referencias: se esperan entre {REFERENCIAS_MIN} y "
            f"{REFERENCIAS_MAX}, hay {len(referencias)}")
    for titulo, cuerpo in referencias:
        etiqueta = f"referencia «{titulo[:60]}»"
        url = _campo_referencia(cuerpo, "URL")
        if url is None or not URL_RE.search(url):
            fallos.append(f"{etiqueta}: sin URL")
        metricas = _campo_referencia(cuerpo, "Métricas")
        if metricas is None or not metricas.strip():
            fallos.append(f"{etiqueta}: sin métricas")
        porque = _campo_referencia(cuerpo, "Por qué funciona")
        if porque is None or not porque.strip():
            fallos.append(f"{etiqueta}: sin «Por qué funciona»")
        prestado = _campo_referencia(cuerpo, "Qué se toma prestado")
        if prestado is None or not prestado.strip():
            fallos.append(f"{etiqueta}: sin «Qué se toma prestado»")
    return fallos


def _validar_tendencias(lineas: list[str]) -> list[str]:
    tendencias = [l.strip()[2:].strip() for l in lineas
                  if l.strip().startswith("- ") and l.strip()[2:].strip()]
    if len(tendencias) < TENDENCIAS_MIN:
        return [f"tendencias: se esperan al menos {TENDENCIAS_MIN}, "
                f"hay {len(tendencias)}"]
    return []


def _validar_ganchos(lineas: list[str]) -> list[str]:
    ganchos = [l.strip()[2:].strip() for l in lineas
               if l.strip().startswith("- ") and l.strip()[2:].strip()]
    if len(ganchos) < GANCHOS_MIN:
        return [f"ganchos: se esperan al menos {GANCHOS_MIN}, "
                f"hay {len(ganchos)}"]
    return []


def validar_dossier(ruta: Path) -> list[str]:
    """Valida un dossier rellenado. Devuelve la lista de fallos
    (vacía = OK). La usa también `propose.py check` para la puerta
    de la etapa de investigación (NARRATIVA.md R31)."""
    fallos: list[str] = []
    try:
        texto = ruta.read_text(encoding="utf-8")
    except OSError as exc:
        return [f"no se pudo leer el dossier: {exc}"]
    secciones = dividir_secciones(texto)

    # 1. Marcadores sin rellenar.
    for i, linea in enumerate(texto.splitlines(), start=1):
        if MARCADOR_ESCRIBIR in linea:
            fallos.append(f"marcador sin rellenar en la línea {i}: "
                          f"{linea.strip()[:100]}")

    # 2. Secciones obligatorias.
    for prefijo in ("Hechos verificados", "Referencias",
                    "Tendencias adaptables", "Ganchos que funcionan"):
        if not tiene_seccion(secciones, prefijo):
            fallos.append(f"falta la sección ## {prefijo}")
    if fallos and any(f.startswith("falta la sección") for f in fallos):
        return fallos

    # 3. Hechos: estado, fuente y fecha; VERIFICADO exige URL.
    fallos += _validar_hechos(
        seccion_por_prefijo(secciones, "Hechos verificados"))
    # 4. Referencias: 3–5, cada una con URL, métricas y análisis.
    fallos += _validar_referencias(
        seccion_por_prefijo(secciones, "Referencias"))
    # 5. Tendencias: al menos 2 adaptables al tema.
    fallos += _validar_tendencias(
        seccion_por_prefijo(secciones, "Tendencias adaptables"))
    # 6. Ganchos: al menos 2 patrones observados.
    fallos += _validar_ganchos(
        seccion_por_prefijo(secciones, "Ganchos que funcionan"))
    return fallos


def resolver_dossier(tema: str, base: Path) -> Path:
    """<tema> puede ser un slug, una ruta a dossier.md o una ruta a la
    carpeta del dossier."""
    p = Path(tema)
    if p.is_file():
        return p
    if p.is_dir():
        return p / "dossier.md"
    return base / slugify(tema) / "dossier.md"


# --- Subcomandos ----------------------------------------------------------

def cmd_new(args) -> int:
    base = Path(args.out) if args.out else DEFAULT_INVEST_DIR
    slug = slugify(args.tema)
    fecha = args.date or today_local()
    destino = base / slug / "dossier.md"
    if destino.exists() and not args.force:
        print(f"error: el dossier ya existe: {destino} "
              f"(usa --force para regenerar la plantilla)",
              file=sys.stderr)
        return 1
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(construir_dossier(args.tema, slug, fecha),
                       encoding="utf-8")
    print(f"dossier creado: {destino}")
    print("rellénalo (hechos, referencias, tendencias, ganchos) y "
          "valida con "
          f"`investigate.py check {slug}` antes de redactar el guion.")
    return 0


def cmd_check(args) -> int:
    base = Path(args.out) if args.out else DEFAULT_INVEST_DIR
    ruta = resolver_dossier(args.tema, base)
    if not ruta.exists():
        print(f"error: dossier no encontrado: {ruta}", file=sys.stderr)
        return 1
    fallos = validar_dossier(ruta)
    if fallos:
        print(f"check FALLIDO ({len(fallos)}): {ruta}")
        for fallo in fallos:
            print(f"  - {fallo}")
        return 1
    print(f"check OK: {ruta}")
    return 0


# --- CLI ------------------------------------------------------------------

def construir_cli() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="investigate.py",
        description="Etapa de investigación previa de preproducción: "
                    "dossier por tema (hechos verificados, referencias "
                    "que funcionan como guía, tendencias adaptables y "
                    "ganchos del tema) antes "
                    "de redactar el guion. Sin dossier verificado no "
                    "hay guion (NARRATIVA.md R31).")
    sub = parser.add_subparsers(dest="comando", required=True)

    p_new = sub.add_parser(
        "new",
        help="crea el dossier de un tema con la plantilla",
        description="Crea preprod/investigacion/<slug>/dossier.md con "
                    "la plantilla (hechos, referencias, tendencias, "
                    "ganchos). Los "
                    "huecos quedan marcados [ESCRIBIR]: un dossier "
                    "recién creado NO pasa `check` hasta rellenarse.")
    p_new.add_argument("tema", metavar="TEMA",
                       help="tema del dossier (p. ej. «la negación del "
                            "embargo»); el slug sale del tema")
    p_new.add_argument("--date", metavar="YYYY-MM-DD",
                       help="fecha del dossier (defecto: hoy en "
                            "America/Puerto_Rico)")
    p_new.add_argument("--force", action="store_true",
                       help="regenerar la plantilla aunque ya exista "
                            "el dossier (se pierde lo rellenado)")
    p_new.add_argument("--out", metavar="DIR",
                       help="directorio de investigación (defecto: "
                            "preprod/investigacion)")
    p_new.set_defaults(func=cmd_new)

    p_check = sub.add_parser(
        "check",
        help="valida un dossier rellenado",
        description="Valida un dossier: secciones obligatorias, sin "
                    "marcadores [ESCRIBIR], cada hecho con estado, "
                    "fuente y fecha (VERIFICADO exige URL de fuente "
                    "primaria), 3–5 referencias con URL, métricas y "
                    "análisis, al menos 2 tendencias adaptables y al "
                    "menos 2 ganchos. Exit 0 solo si todo pasa.")
    p_check.add_argument("tema", metavar="TEMA",
                         help="slug del tema, ruta a dossier.md o ruta "
                              "a la carpeta del dossier")
    p_check.add_argument("--out", metavar="DIR",
                         help="directorio de investigación (defecto: "
                              "preprod/investigacion)")
    p_check.set_defaults(func=cmd_check)
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = construir_cli()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
