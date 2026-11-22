#!/usr/bin/env python3
"""Stub de facebook-cli para los tests de publicación programada.

Emula `pages posts create` (agendar) y `pages posts get` (lectura de
verificación) con respuestas JSON ficticias. Sin red ni llamadas
reales. El comportamiento se controla con variables de entorno:

  STUB_MODO=ok          create responde con post_id (defecto)
  STUB_MODO=error-auth  create falla con error de token (rechazo claro)
  STUB_MODO=error-5xx   create falla con error genérico (ambiguo)
  STUB_MODO=sin-post-id create responde 0 pero sin post_id
  STUB_MODO=lento       create duerme 5 s (para probar el timeout)
  STUB_LECTURA=ok        get responde state scheduled (defecto)
  STUB_LECTURA=fallo     get falla (rc 1)
  STUB_LECTURA=publicado get responde state published
  STUB_LECTURA=sin-estado get responde sin campo state
  STUB_REGISTRO=<ruta>   cada invocación se añade como línea JSON

El stub NUNCA publica nada: solo imprime JSON.
"""
import json
import os
import sys
import time


def registrar(argv):
    ruta = os.environ.get("STUB_REGISTRO")
    if ruta:
        with open(ruta, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(argv, ensure_ascii=False) + "\n")


def main():
    argv = sys.argv[1:]
    registrar(argv)
    if argv[:3] == ["pages", "posts", "create"]:
        modo = os.environ.get("STUB_MODO", "ok")
        if modo == "lento":
            time.sleep(5)
        if modo == "error-auth":
            print("error: token expired or revoked", file=sys.stderr)
            return 1
        if modo == "error-5xx":
            print("error: internal server error", file=sys.stderr)
            return 1
        if modo == "sin-post-id":
            print(json.dumps({"state": "scheduled"}))
            return 0
        unix = None
        if "--scheduled-publish-time" in argv:
            unix = int(argv[argv.index("--scheduled-publish-time") + 1])
        print(json.dumps({
            "post_id": "fb_post_123",
            "state": "scheduled",
            "scheduled_publish_time": unix,
        }))
        return 0
    if argv[:3] == ["pages", "posts", "get"]:
        lectura = os.environ.get("STUB_LECTURA", "ok")
        if lectura == "fallo":
            print("error: connection reset", file=sys.stderr)
            return 1
        if lectura == "publicado":
            print(json.dumps({"posts": [{"id": "fb_post_123", "state": "published"}]}))
            return 0
        if lectura == "sin-estado":
            print(json.dumps({"posts": [{"id": "fb_post_123"}]}))
            return 0
        print(json.dumps({
            "posts": [{"id": "fb_post_123", "state": "scheduled"}],
        }))
        return 0
    print(json.dumps({"error": "comando no soportado por el stub"}))
    return 1


if __name__ == "__main__":
    sys.exit(main())
