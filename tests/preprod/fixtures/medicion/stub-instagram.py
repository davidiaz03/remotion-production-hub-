#!/usr/bin/env python3
"""instagram-cli falso para las pruebas de measure.py (sin red).

Subcomandos:
- accounts -> una cuenta lectora (user_fbid 9001).
- posts --username cuentaa -> 2 páginas: 3 posts propios + 1
  colaboración de otra autora (se filtra), luego 2 propios.
  Propios: base 10/20/30 likes (octubre, mediana 20) + ventana
  90 likes (4.5x, destacado) y 5 likes (0.25x, flojo).
  follower_count 1000 en cada fila.
- individual-post-insights -> media_not_found (defecto) o métricas
  si STUB_IG_INSIGHTS=ok.
Registra sus argumentos en $STUB_LOG.
"""
import json
import os
import sys

if os.environ.get("STUB_LOG"):
    with open(os.environ["STUB_LOG"], "a", encoding="utf-8") as f:
        f.write(" ".join(sys.argv[1:]) + "\n")

PAGINA_1 = [
    {"post_id": "5001", "username": "cuentaa",
     "url": "https://www.instagram.com/reel/A1/",
     "post_caption": "Reel base diez", "likes": 10, "comments": 1,
     "media_type": "video", "created_at": "2026-10-02 10:00:00",
     "follower_count": 1000},
    {"post_id": "5002", "username": "cuentaa",
     "url": "https://www.instagram.com/p/A2/",
     "post_caption": "Carrusel base veinte", "likes": 20, "comments": 2,
     "media_type": "carousel", "created_at": "2026-10-09 10:00:00",
     "follower_count": 1000},
    {"post_id": "5003", "username": "cuentaa",
     "url": "https://www.instagram.com/reel/A3/",
     "post_caption": "Reel base treinta", "likes": 30, "comments": 3,
     "media_type": "video", "created_at": "2026-10-16 10:00:00",
     "follower_count": 1000},
    {"post_id": "5999", "username": "otra",
     "url": "https://www.instagram.com/reel/X9/",
     "post_caption": "Colaboracion de otra autora", "likes": 9999,
     "comments": 99, "media_type": "video",
     "created_at": "2026-11-19 10:00:00", "follower_count": 5000},
]
PAGINA_2 = [
    {"post_id": "5004", "username": "cuentaa",
     "url": "https://www.instagram.com/reel/A4/",
     "post_caption": "Reel ventana noventa", "likes": 90, "comments": 9,
     "media_type": "video", "created_at": "2026-11-20 10:00:00",
     "follower_count": 1000},
    {"post_id": "5005", "username": "cuentaa",
     "url": "https://www.instagram.com/p/A5/",
     "post_caption": "Carrusel ventana cinco", "likes": 5, "comments": 0,
     "media_type": "carousel", "created_at": "2026-11-18 10:00:00",
     "follower_count": 1000},
]

args = sys.argv[1:]
if args[:1] == ["accounts"]:
    print(json.dumps({"accounts": [{"user_fbid": "9001",
                                    "username": "lector"}]}))
elif args[:1] == ["posts"]:
    cursor = args[args.index("--after") + 1] if "--after" in args else None
    if cursor is None:
        print(json.dumps({"posts": PAGINA_1, "has_next_page": True,
                          "next_cursor": "c2"}))
    elif cursor == "c2":
        print(json.dumps({"posts": PAGINA_2, "has_next_page": False,
                          "next_cursor": None}))
    else:
        print(json.dumps({"posts": [], "has_next_page": False,
                          "next_cursor": None}))
elif args[:1] == ["individual-post-insights"]:
    if os.environ.get("STUB_IG_INSIGHTS") == "ok":
        print(json.dumps({"success": True, "views": 5000, "reach": 3000,
                          "likes": 90, "comments": 9, "shares": 4,
                          "saves": 2}))
    else:
        print(json.dumps({"success": False,
                          "error": {"code": "media_not_found",
                                    "retryable": False}}))
else:
    print(json.dumps({}))
