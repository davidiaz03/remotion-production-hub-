#!/usr/bin/env python3
"""Publicación programada del Memorial de la Denuncia (versión prudente).

Prepara borradores programados para revisar; NADA se publica solo y
NADA se agenda sin un humano que lo confirme.

Subcomandos:
  prepare   crea un manifiesto de borrador en publish/queue/ a partir
            de un pack APROBADO + máster + texto (plataforma,
            fecha/hora, texto, hashtags, medio, estado `borrador`).
  review    lista los borradores pendientes de revisión.
  schedule  agenda en la plataforma, solo si pasan todas las puertas.
            `--simular` hace todo menos la llamada a la plataforma.
  status    muestra lo agendado y el estado de cada manifiesto.
  resolver  resuelve a mano un manifiesto `incierto` (el humano
            comprobó la Página en Facebook).

PUERTAS DURAS (sin excepciones, testeadas):
  1. Nunca publicar inmediato: el único comando de escritura es
     `pages posts create` SIEMPRE con `--scheduled-publish-time`.
     No existe en este script ninguna ruta que publique ahora.
  2. Nunca agendar sin aprobación de Suleris: la sección
     `## Aprobación` del pack debe decir `Estado: aprobada`
     (se comprueba en `prepare` y se vuelve a comprobar en
     `schedule`, por si el pack cambió entre tanto).
  3. Nunca agendar sin `--confirmar`: la flag explícita de un
     humano es obligatoria en cada `schedule`.
  4. Fecha/hora pasada → rechazo. Facebook solo agenda entre 10
     minutos y 29 días en el futuro; esa ventana se impone aquí.
  5. Instagram BLOQUEADO hasta reactivar la sesión de
     @memorialdenuncia: `schedule` lo rechaza con mensaje claro.
     Facebook es la vía que funciona (Página owner_id
     61553292780810).

RESILIENCIA (si el acceso se cae en el momento de publicar):
  - Una vez agendado, el post vive en los servidores de Meta y lo
    publica Meta a la hora fijada: nuestro acceso solo hace falta
    EN EL MOMENTO DE AGENDAR, no después. Si el token se cae
    después, el post sale igual.
  - Tras un schedule exitoso, el módulo vuelve a leer el post
    agendado en la plataforma (`pages posts get`) y solo marca
    `agendado` si la lectura confirma `state: scheduled`.
  - Si el schedule falla con un rechazo claro de la plataforma
    (p. ej. token caído), el borrador QUEDA en la cola con el
    error registrado y se puede reintentar. Si el resultado es
    ambiguo (tiempo agotado, respuesta ilegible, lectura de
    verificación fallida), el manifiesto pasa a `incierto`:
    NO se reintenta solo, porque el post podría estar agendado;
    un humano comprueba la Página y lo resuelve con `resolver`.

Códigos de salida: 0 ok; 1 error inesperado; 2 rechazo de puerta;
3 rechazo de la plataforma (borrador conservado, reintentable);
4 resultado incierto (revisar la Página, resolver a mano).

Horas: se acepta ISO 8601 con offset explícito
(`2026-11-24T19:00:00-04:00`). Sin offset, se asume -04:00
(hora oficial de La Habana). La hora la elige el humano; el
calendario semanal de marketing es la fuente del hueco.
"""
import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timedelta, timezone

PAGE_ID = "61553292780810"
FACEBOOK_BIN_DEFECTO = "/opt/hatch/bin/facebook-cli"
PLATAFORMAS = {"facebook", "instagram"}
ESTADOS = {"borrador", "agendado", "incierto"}
TEXTO_MAX = {"facebook": 1024, "instagram": 2200}
# Ventana de Facebook: de 10 minutos a 29 días en el futuro.
VENTANA_MIN = timedelta(minutes=10)
VENTANA_MAX = timedelta(days=29)
# Hora oficial de La Habana (Cuba mantiene el horario de verano).
TZ_HABANA = timezone(timedelta(hours=-4))

SALIDA_OK = 0
SALIDA_ERROR = 1
SALIDA_PUERTA = 2
SALIDA_PLATAFORMA = 3
SALIDA_INCIERTO = 4

# Un rechazo CLARO de la plataforma (el post NO se creó): errores de
# autenticación, sesión o permisos. Cualquier otra cosa (5xx, red,
# tiempo agotado, respuesta ilegible) es AMBIGUA: el post podría
# haberse creado y no se reintenta solo.
RE_RECHAZO_CLARO = re.compile(
    r"token|auth|oauth|sesion|sesión|session|permiso|permission|"
    r"invalid|expired|revoked|401|403|unauthorized|forbidden",
    re.I,
)


def raiz_repo():
    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def ahora_utc():
    return datetime.now(timezone.utc)


def marca_tiempo(dt=None):
    return (dt or ahora_utc()).isoformat()


def parsear_cuando(texto):
    """ISO 8601 con offset; sin offset, se asume -04:00 (La Habana)."""
    dt = datetime.fromisoformat(texto.strip())
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=TZ_HABANA)
    return dt


def validar_ventana(dt, ahora=None):
    """None si la fecha es agendable; si no, el motivo del rechazo."""
    ahora = ahora or ahora_utc()
    if dt <= ahora:
        return "la fecha/hora ya pasó"
    if dt - ahora < VENTANA_MIN:
        return "Facebook exige agendar al menos 10 minutos en el futuro"
    if dt - ahora > VENTANA_MAX:
        return "Facebook solo agenda hasta 29 días en el futuro"
    return None


def leer_aprobacion(ruta_pack):
    """Lee la sección ## Aprobación de un pack. Devuelve el dict
    {estado, fecha, medio} o None si no hay sección."""
    with open(ruta_pack, encoding="utf-8") as fh:
        texto = fh.read()
    m = re.search(r"^## Aprobación\s*$\n(.*?)(?=^## |\Z)", texto, re.M | re.S)
    if not m:
        return None
    seccion = m.group(1)
    campos = {}
    for clave in ("Estado", "Fecha de aprobación", "Medio"):
        mm = re.search(rf"^- {re.escape(clave)}:\s*(.*)$", seccion, re.M)
        campos[clave] = mm.group(1).strip() if mm else ""
    return {
        "estado": campos["Estado"],
        "fecha": campos["Fecha de aprobación"],
        "medio": campos["Medio"],
    }


def aprobado(aprobacion):
    return bool(aprobacion) and aprobacion["estado"].strip().lower() == "aprobada"


def titulo_del_pack(ruta_pack):
    with open(ruta_pack, encoding="utf-8") as fh:
        primera = fh.readline().strip()
    if primera.startswith("# "):
        return primera[2:].strip()
    return os.path.basename(os.path.dirname(ruta_pack))


def ruta_manifiesto(directorio, manifiesto_id):
    return os.path.join(directorio, f"{manifiesto_id}.json")


def cargar_manifiesto(directorio, manifiesto_id):
    ruta = ruta_manifiesto(directorio, manifiesto_id)
    if not os.path.exists(ruta):
        return None
    with open(ruta, encoding="utf-8") as fh:
        return json.load(fh)


def guardar_manifiesto(directorio, manifiesto):
    """Escritura atómica (temporal + renombre): un fallo a mitad no
    deja un manifiesto a medias ni pierde el borrador."""
    os.makedirs(directorio, exist_ok=True)
    ruta = ruta_manifiesto(directorio, manifiesto["id"])
    tmp = ruta + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(manifiesto, fh, ensure_ascii=False, indent=2, sort_keys=True)
        fh.write("\n")
    os.replace(tmp, ruta)
    return ruta


def listar_manifiestos(directorio):
    if not os.path.isdir(directorio):
        return []
    out = []
    for nombre in sorted(os.listdir(directorio)):
        if not nombre.endswith(".json"):
            continue
        try:
            with open(os.path.join(directorio, nombre), encoding="utf-8") as fh:
                out.append(json.load(fh))
        except (OSError, ValueError):
            continue
    return sorted(out, key=lambda m: m.get("cuando", ""))


def texto_completo(manifiesto):
    texto = manifiesto["texto"]
    tags = manifiesto.get("hashtags") or []
    if tags:
        texto = texto.rstrip() + "\n\n" + " ".join(tags)
    return texto


def construir_comando_agendar(manifiesto, facebook_bin):
    """ÚNICO comando de escritura del módulo. Siempre agenda a
    futuro: `--scheduled-publish-time` es obligatorio y no hay
    ninguna ruta que construya un `posts create` sin él. Un reel
    es un post de Página cuyo único medio es un MP4."""
    return [
        facebook_bin,
        "pages",
        "posts",
        "create",
        "--page-id",
        PAGE_ID,
        "--text",
        texto_completo(manifiesto),
        "--privacy",
        "PUBLIC",
        "--file",
        manifiesto["medio"],
        "--scheduled-publish-time",
        str(manifiesto["cuando_unix"]),
    ]


def construir_comando_leer(post_id, facebook_bin):
    """Lectura de verificación: vuelve a leer el post agendado en
    la plataforma para confirmar que quedó realmente agendado."""
    return [
        facebook_bin,
        "pages",
        "posts",
        "get",
        "--page-id",
        PAGE_ID,
        "--post-ids",
        post_id,
    ]


def ejecutar_cli(cmd, timeout):
    """Única llamada a subprocess del script. Devuelve
    (returncode, stdout, stderr, timeout)."""
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return proc.returncode, proc.stdout, proc.stderr, False
    except subprocess.TimeoutExpired:
        return None, "", f"tiempo agotado tras {timeout} s", True
    except OSError as exc:
        return None, "", f"no se pudo ejecutar el CLI: {exc}", False


def buscar_clave(obj, claves):
    """Busca una clave en un JSON anidado (dicts y listas)."""
    if isinstance(obj, dict):
        for clave in claves:
            if clave in obj:
                return obj[clave]
        for valor in obj.values():
            hallado = buscar_clave(valor, claves)
            if hallado is not None:
                return hallado
    elif isinstance(obj, list):
        for item in obj:
            hallado = buscar_clave(item, claves)
            if hallado is not None:
                return hallado
    return None


def clasificar_fallo_agendar(rc, stdout, stderr, timeout):
    """'rechazado' = la plataforma dijo que no (el post NO se creó;
    el borrador queda en cola y se puede reintentar). 'incierto' =
    no se sabe si se creó (tiempo agotado, respuesta ilegible,
    error sin clasificar); no se reintenta solo."""
    if timeout:
        return "incierto"
    texto = f"{stdout}\n{stderr}"
    if rc is not None and rc != 0 and RE_RECHAZO_CLARO.search(texto):
        return "rechazado"
    if rc is not None and rc != 0 and not texto.strip():
        return "incierto"
    if rc == 0:
        return "incierto"
    return "incierto"


def registrar_error(manifiesto, etapa, mensaje):
    manifiesto["ultimo_error"] = {
        "cuando": marca_tiempo(),
        "etapa": etapa,
        "mensaje": mensaje,
    }


def imprimir_bloqueo(titulo, lineas):
    print()
    print(f"!!! {titulo} !!!")
    for linea in lineas:
        print(f"    {linea}")
    print()


# ---------------------------------------------------------------- prepare

def cmd_prepare(args):
    if not os.path.exists(args.pack):
        print(f"error: no existe el pack {args.pack}", file=sys.stderr)
        return SALIDA_PUERTA
    aprobacion = leer_aprobacion(args.pack)
    if not aprobado(aprobacion):
        estado = aprobacion["estado"] if aprobacion else "sin sección de aprobación"
        print(
            f"error: el pack no está aprobado por Suleris "
            f"(estado: {estado}). Sin aprobación no hay borrador.",
            file=sys.stderr,
        )
        return SALIDA_PUERTA
    if not os.path.exists(args.medio):
        print(f"error: no existe el medio {args.medio}", file=sys.stderr)
        return SALIDA_PUERTA
    try:
        cuando = parsear_cuando(args.cuando)
    except ValueError:
        print(
            f"error: fecha/hora inválida '{args.cuando}' "
            f"(usa ISO 8601, p. ej. 2026-11-24T19:00:00-04:00)",
            file=sys.stderr,
        )
        return SALIDA_PUERTA
    motivo = validar_ventana(cuando)
    if motivo:
        print(f"error: {motivo}.", file=sys.stderr)
        return SALIDA_PUERTA
    limite = TEXTO_MAX[args.plataforma]
    if len(args.texto) > limite:
        print(
            f"error: el texto tiene {len(args.texto)} caracteres; "
            f"el límite en {args.plataforma} es {limite}.",
            file=sys.stderr,
        )
        return SALIDA_PUERTA
    slug = os.path.basename(os.path.dirname(os.path.abspath(args.pack)))
    manifiesto_id = args.id or (
        f"{slug}-{args.plataforma}-{cuando.strftime('%Y%m%d-%H%M')}"
    )
    if cargar_manifiesto(args.dir, manifiesto_id) is not None:
        print(
            f"error: ya existe un borrador con id '{manifiesto_id}'.",
            file=sys.stderr,
        )
        return SALIDA_PUERTA
    manifiesto = {
        "id": manifiesto_id,
        "pack": args.pack,
        "titulo": titulo_del_pack(args.pack),
        "plataforma": args.plataforma,
        "page_id": PAGE_ID if args.plataforma == "facebook" else None,
        "cuando": cuando.isoformat(),
        "cuando_unix": int(cuando.timestamp()),
        "texto": args.texto,
        "hashtags": list(args.hashtags or []),
        "medio": args.medio,
        "estado": "borrador",
        "creado": marca_tiempo(),
        "aprobacion": {
            "fecha": aprobacion["fecha"],
            "medio": aprobacion["medio"],
        },
        "ultimo_error": None,
        "agendado": None,
    }
    guardar_manifiesto(args.dir, manifiesto)
    print(f"Borrador creado: {manifiesto_id} (estado: borrador).")
    print(f"  Pack: {args.pack}")
    print(f"  Plataforma: {args.plataforma} · Para: {cuando.isoformat()}")
    print("  Nada agendado todavía: revisa con `review` y agenda con")
    print("  `schedule --confirmar` cuando un humano lo confirme.")
    return SALIDA_OK


def info_medio(ruta):
    """Describe el medio para la previsualización: nombre, tipo y
    tamaño; avisa si el archivo ya no existe."""
    nombre = os.path.basename(ruta)
    ext = os.path.splitext(nombre)[1].lower()
    if ext in {".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v"}:
        tipo = "vídeo"
    elif ext in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        tipo = "imagen"
    else:
        tipo = "archivo"
    if not os.path.exists(ruta):
        return f"{nombre} ({tipo}) — ¡EL ARCHIVO NO EXISTE EN ESTA RUTA!"
    mb = os.path.getsize(ruta) / (1024 * 1024)
    if mb >= 1:
        return f"{nombre} ({tipo}, {mb:.1f} MB)"
    return f"{nombre} ({tipo}, {os.path.getsize(ruta)} B)"


DIAS_SEMANA = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
MESES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]


def fecha_legible(cuando_iso):
    """'martes 24 de noviembre, 19:00 (hora de La Habana)'."""
    dt = parsear_cuando(cuando_iso)
    return (
        f"{DIAS_SEMANA[dt.weekday()]} {dt.day} de {MESES[dt.month - 1]}, "
        f"{dt.strftime('%H:%M')} (hora de La Habana)"
    )


def mostrar_previsualizacion(manifiesto):
    """Previsualización fiel de lo que se va a agendar: el humano ve
    exactamente el post (texto, hashtags, medio, fecha y plataforma)
    antes de confirmar."""
    marca = ""
    if manifiesto["estado"] == "incierto":
        marca = " [INCIERTO: revisar la Página antes de tocarlo]"
    print(f"════════ PREVISUALIZACIÓN — {manifiesto['id']} ════════")
    print(f"Plataforma: {manifiesto['plataforma']}{marca}")
    print(f"Para: {manifiesto['cuando']} — {fecha_legible(manifiesto['cuando'])}")
    print(f"Estado: {manifiesto['estado']}")
    print(f"Pack: {manifiesto['pack']}")
    print(
        f"Aprobación de Suleris: {manifiesto['aprobacion']['fecha']} "
        f"({manifiesto['aprobacion']['medio']})"
    )
    print(f"Medio: {info_medio(manifiesto['medio'])}")
    print("────────────────────────────────────────")
    print(texto_completo(manifiesto))
    print("────────────────────────────────────────")
    if manifiesto.get("ultimo_error"):
        print(f"Último error: {manifiesto['ultimo_error']['mensaje']}")
    if manifiesto["estado"] == "borrador":
        print("Nada agendado todavía. Para agendar:")
        print(f"  schedule --id {manifiesto['id']} --confirmar")
    print()


# ---------------------------------------------------------------- review

def cmd_review(args):
    if args.id:
        manifiesto = cargar_manifiesto(args.dir, args.id)
        if manifiesto is None:
            print(f"error: no hay ningún manifiesto con id '{args.id}'.", file=sys.stderr)
            return SALIDA_PUERTA
        if args.json:
            print(json.dumps(manifiesto, ensure_ascii=False, indent=2))
            return SALIDA_OK
        mostrar_previsualizacion(manifiesto)
        return SALIDA_OK
    pendientes = [
        m for m in listar_manifiestos(args.dir) if m.get("estado") in ("borrador", "incierto")
    ]
    if args.json:
        print(json.dumps(pendientes, ensure_ascii=False, indent=2))
        return SALIDA_OK
    if not pendientes:
        print("No hay borradores pendientes.")
        return SALIDA_OK
    print(f"{len(pendientes)} borrador(es) pendiente(s):\n")
    for m in pendientes:
        mostrar_previsualizacion(m)
    return SALIDA_OK


# ---------------------------------------------------------------- schedule

def cmd_schedule(args):
    manifiesto = cargar_manifiesto(args.dir, args.id)
    if manifiesto is None:
        print(f"error: no hay ningún manifiesto con id '{args.id}'.", file=sys.stderr)
        return SALIDA_PUERTA
    # Puerta: solo un borrador se agenda. Un manifiesto `incierto`
    # no se reintenta solo: un humano lo resuelve con `resolver`.
    if manifiesto["estado"] == "agendado":
        print(
            f"error: '{args.id}' ya está agendado "
            f"(post {manifiesto['agendado']['post_id']}).",
            file=sys.stderr,
        )
        return SALIDA_PUERTA
    if manifiesto["estado"] == "incierto":
        print(
            f"error: '{args.id}' está INCIERTO: el último intento no "
            f"confirmó si el post quedó agendado. Revisa la Página en "
            f"Facebook y resuélvelo con `resolver` antes de reintentar.",
            file=sys.stderr,
        )
        return SALIDA_PUERTA
    # Puerta: Instagram bloqueado hasta reactivar la sesión.
    if manifiesto["plataforma"] == "instagram":
        print(
            "error: Instagram está BLOQUEADO hasta reactivar la sesión "
            "de @memorialdenuncia (código nuevo al correo del Memorial). "
            "El borrador queda en la cola; la vía que funciona hoy es "
            "Facebook.",
            file=sys.stderr,
        )
        return SALIDA_PUERTA
    # Puerta: la aprobación se vuelve a comprobar (el pack puede
    # haber cambiado desde `prepare`).
    aprobacion = leer_aprobacion(manifiesto["pack"])
    if not aprobado(aprobacion):
        estado = aprobacion["estado"] if aprobacion else "sin sección de aprobación"
        print(
            f"error: el pack ya no está aprobado por Suleris "
            f"(estado: {estado}). El borrador queda en la cola.",
            file=sys.stderr,
        )
        return SALIDA_PUERTA
    # Puerta: confirmación explícita del humano.
    if not args.confirmar:
        print(
            "error: falta --confirmar. Nada se agenda sin la "
            "confirmación explícita de un humano.",
            file=sys.stderr,
        )
        return SALIDA_PUERTA
    # Puerta: la fecha debe seguir siendo agendable.
    cuando = parsear_cuando(manifiesto["cuando"])
    motivo = validar_ventana(cuando)
    if motivo:
        print(f"error: {motivo}. El borrador queda en la cola.", file=sys.stderr)
        return SALIDA_PUERTA
    # Pre-vuelo: el medio debe seguir existiendo.
    if not os.path.exists(manifiesto["medio"]):
        print(
            f"error: el medio ya no existe: {manifiesto['medio']}. "
            f"El borrador queda en la cola.",
            file=sys.stderr,
        )
        return SALIDA_PUERTA
    comando = construir_comando_agendar(manifiesto, args.platform_cli)
    if args.simular:
        manifiesto["simulacion_ultima"] = {
            "cuando": marca_tiempo(),
            "comando": comando,
        }
        guardar_manifiesto(args.dir, manifiesto)
        print("SIMULACIÓN: no se llamó a la plataforma.")
        print("Comando que se ejecutaría:")
        print("  " + " ".join(comando))
        print("Luego se verificaría con:")
        print("  " + " ".join(
            construir_comando_leer("<post_id>", args.platform_cli)
        ))
        print("El manifiesto sigue en estado borrador.")
        return SALIDA_OK
    # Llamada real a la plataforma (única escritura del módulo).
    rc, stdout, stderr, timeout = ejecutar_cli(comando, args.timeout)
    if rc != 0 or timeout:
        tipo = clasificar_fallo_agendar(rc, stdout, stderr, timeout)
        mensaje = (stderr or stdout or "sin detalle del error").strip()
        registrar_error(manifiesto, "agendar", mensaje)
        if tipo == "rechazado":
            guardar_manifiesto(args.dir, manifiesto)
            imprimir_bloqueo(
                "FALLO AL AGENDAR — EL BORRADOR SIGUE EN LA COLA",
                [
                    f"La plataforma rechazó el schedule: {mensaje}",
                    f"El borrador '{args.id}' queda en estado borrador,",
                    "sin perderse, con el error registrado. Se puede",
                    "reintentar cuando el acceso vuelva.",
                ],
            )
            return SALIDA_PLATAFORMA
        manifiesto["estado"] = "incierto"
        guardar_manifiesto(args.dir, manifiesto)
        imprimir_bloqueo(
            "RESULTADO INCIERTO — NO SE REINTENTA SOLO",
            [
                f"No se pudo confirmar si el post se agendó: {mensaje}",
                "El post PODRÍA estar agendado en Meta. Revisa la",
                f"Página en Facebook y resuelve '{args.id}' con",
                "`resolver` antes de tocar nada.",
            ],
        )
        return SALIDA_INCIERTO
    try:
        respuesta = json.loads(stdout)
    except ValueError:
        respuesta = None
    post_id = buscar_clave(respuesta, ("post_id", "id")) if respuesta else None
    if not post_id:
        registrar_error(
            manifiesto, "agendar",
            "la plataforma respondió sin post_id (respuesta ilegible)",
        )
        manifiesto["estado"] = "incierto"
        guardar_manifiesto(args.dir, manifiesto)
        imprimir_bloqueo(
            "RESULTADO INCIERTO — NO SE REINTENTA SOLO",
            [
                "La plataforma respondió sin post_id; no se sabe si el",
                "post quedó agendado. Revisa la Página en Facebook y",
                f"resuelve '{args.id}' con `resolver`.",
            ],
        )
        return SALIDA_INCIERTO
    # Verificación: volver a leer el post agendado en la plataforma.
    comando_leer = construir_comando_leer(post_id, args.platform_cli)
    rc2, stdout2, stderr2, timeout2 = ejecutar_cli(comando_leer, args.timeout)
    if rc2 != 0 or timeout2:
        mensaje = (stderr2 or stdout2 or "sin detalle").strip()
        registrar_error(manifiesto, "verificar", mensaje)
        manifiesto["estado"] = "incierto"
        manifiesto["agendado"] = {"post_id": post_id, "verificado_en": None}
        guardar_manifiesto(args.dir, manifiesto)
        imprimir_bloqueo(
            "RESULTADO INCIERTO — LA VERIFICACIÓN FALLÓ",
            [
                f"El schedule devolvió el post {post_id}, pero no se",
                f"pudo leerlo de vuelta para confirmarlo: {mensaje}",
                "El post PROBABLEMENTE está agendado. Revisa la",
                f"Página en Facebook y resuelve '{args.id}' con",
                "`resolver --fue-agendado` si lo ves agendado.",
            ],
        )
        return SALIDA_INCIERTO
    try:
        lectura = json.loads(stdout2)
    except ValueError:
        lectura = None
    estado_leido = buscar_clave(lectura, ("state", "estado")) if lectura else None
    if estado_leido != "scheduled":
        registrar_error(
            manifiesto, "verificar",
            f"la lectura devolvió estado '{estado_leido}' "
            f"en vez de 'scheduled'",
        )
        manifiesto["estado"] = "incierto"
        manifiesto["agendado"] = {"post_id": post_id, "verificado_en": None}
        guardar_manifiesto(args.dir, manifiesto)
        imprimir_bloqueo(
            "RESULTADO INCIERTO — EL POST NO APARECE COMO AGENDADO",
            [
                f"El schedule devolvió el post {post_id}, pero al",
                f"leerlo de vuelta su estado es '{estado_leido}', no",
                "'scheduled'. Revisa la Página en Facebook y resuelve",
                f"'{args.id}' con `resolver`.",
            ],
        )
        return SALIDA_INCIERTO
    manifiesto["estado"] = "agendado"
    manifiesto["agendado"] = {
        "post_id": post_id,
        "verificado_en": marca_tiempo(),
        "estado_leido": "scheduled",
    }
    manifiesto["ultimo_error"] = None
    guardar_manifiesto(args.dir, manifiesto)
    print(f"Agendado y verificado: {args.id}")
    print(f"  Post: {post_id} · Para: {manifiesto['cuando']}")
    print("  La lectura de vuelta confirma state: scheduled.")
    print("  A partir de aquí lo publica Meta: si nuestro acceso se")
    print("  cae después, el post sale igual a la hora fijada.")
    return SALIDA_OK


# ---------------------------------------------------------------- status

def cmd_status(args):
    if args.id:
        manifiestos = [cargar_manifiesto(args.dir, args.id)]
        if manifiestos[0] is None:
            print(f"error: no hay ningún manifiesto con id '{args.id}'.", file=sys.stderr)
            return SALIDA_PUERTA
    else:
        manifiestos = listar_manifiestos(args.dir)
    if args.json:
        print(json.dumps(manifiestos, ensure_ascii=False, indent=2))
        return SALIDA_OK
    if not manifiestos:
        print("La cola está vacía.")
        return SALIDA_OK
    for m in manifiestos:
        print(f"- {m['id']} [{m['estado']}]")
        print(f"  {m['titulo']}")
        print(f"  {m['plataforma']} · {m['cuando']} · medio: {m['medio']}")
        if m.get("agendado") and m["agendado"].get("post_id"):
            verificado = m["agendado"].get("verificado_en") or "sin verificar"
            print(f"  Post: {m['agendado']['post_id']} · verificado: {verificado}")
        if m.get("ultimo_error"):
            print(f"  Último error: {m['ultimo_error']['mensaje']}")
    return SALIDA_OK


# ---------------------------------------------------------------- resolver

def cmd_resolver(args):
    manifiesto = cargar_manifiesto(args.dir, args.id)
    if manifiesto is None:
        print(f"error: no hay ningún manifiesto con id '{args.id}'.", file=sys.stderr)
        return SALIDA_PUERTA
    if manifiesto["estado"] != "incierto":
        print(
            f"error: '{args.id}' está en estado {manifiesto['estado']}; "
            f"solo se resuelven manifiestos inciertos.",
            file=sys.stderr,
        )
        return SALIDA_PUERTA
    if args.fue_agendado:
        if not args.post_id:
            print("error: --fue-agendado exige --post-id.", file=sys.stderr)
            return SALIDA_PUERTA
        manifiesto["estado"] = "agendado"
        manifiesto["agendado"] = {
            "post_id": args.post_id,
            "verificado_en": None,
            "estado_leido": None,
            "verificacion": "humana",
        }
        manifiesto["resuelto"] = {
            "cuando": marca_tiempo(),
            "accion": "fue-agendado",
            "nota": "El humano comprobó la Página: el post está agendado.",
        }
        guardar_manifiesto(args.dir, manifiesto)
        print(f"'{args.id}' marcado como agendado (verificación humana).")
        return SALIDA_OK
    if args.reintentar:
        manifiesto["estado"] = "borrador"
        manifiesto["agendado"] = None
        manifiesto["resuelto"] = {
            "cuando": marca_tiempo(),
            "accion": "reintentar",
            "nota": "El humano comprobó la Página: el post NO está agendado.",
        }
        guardar_manifiesto(args.dir, manifiesto)
        print(f"'{args.id}' vuelve a borrador: se puede agendar de nuevo.")
        return SALIDA_OK
    print("error: indica --fue-agendado o --reintentar.", file=sys.stderr)
    return SALIDA_PUERTA


# ---------------------------------------------------------------- main

def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Publicación programada del Memorial (versión prudente: "
        "borradores para revisar; nada se publica solo)."
    )
    parser.add_argument(
        "--dir",
        default=os.path.join(raiz_repo(), "publish", "queue"),
        help="Carpeta de la cola de manifiestos.",
    )
    parser.add_argument(
        "--platform-cli",
        default=FACEBOOK_BIN_DEFECTO,
        help="CLI de la plataforma (en tests, un stub).",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=120,
        help="Tiempo máximo de cada llamada a la plataforma (segundos).",
    )
    sub = parser.add_subparsers(dest="comando", required=True)

    p_pre = sub.add_parser("prepare", help="Crea un borrador programado.")
    p_pre.add_argument("--pack", required=True, help="Ruta de propuesta.md (aprobada).")
    p_pre.add_argument("--medio", required=True, help="Archivo del máster (MP4) o imagen.")
    p_pre.add_argument("--plataforma", required=True, choices=sorted(PLATAFORMAS))
    p_pre.add_argument("--cuando", required=True, help="ISO 8601, p. ej. 2026-11-24T19:00:00-04:00.")
    p_pre.add_argument("--texto", required=True, help="Texto del post.")
    p_pre.add_argument("--hashtags", nargs="*", default=[])
    p_pre.add_argument("--id", default=None, help="Id del manifiesto (opcional).")

    p_rev = sub.add_parser("review", help="Previsualiza los borradores pendientes.")
    p_rev.add_argument("--id", default=None, help="Previsualiza un solo borrador.")
    p_rev.add_argument("--json", action="store_true")

    p_sch = sub.add_parser("schedule", help="Agenda un borrador en la plataforma.")
    p_sch.add_argument("--id", required=True)
    p_sch.add_argument(
        "--confirmar",
        action="store_true",
        help="Confirmación explícita del humano (obligatoria).",
    )
    p_sch.add_argument(
        "--simular",
        action="store_true",
        help="Valida todo y muestra el comando sin llamar a la plataforma.",
    )

    p_sta = sub.add_parser("status", help="Muestra el estado de la cola.")
    p_sta.add_argument("--id", default=None)
    p_sta.add_argument("--json", action="store_true")

    p_res = sub.add_parser("resolver", help="Resuelve un manifiesto incierto.")
    p_res.add_argument("--id", required=True)
    p_res.add_argument("--fue-agendado", action="store_true",
                       help="El humano vio el post agendado en la Página.")
    p_res.add_argument("--post-id", default=None)
    p_res.add_argument("--reintentar", action="store_true",
                       help="El humano vio que el post NO está agendado.")

    args = parser.parse_args(argv)
    if args.comando == "prepare":
        return cmd_prepare(args)
    if args.comando == "review":
        return cmd_review(args)
    if args.comando == "schedule":
        return cmd_schedule(args)
    if args.comando == "status":
        return cmd_status(args)
    return cmd_resolver(args)


if __name__ == "__main__":
    sys.exit(main())
