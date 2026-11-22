#!/usr/bin/env python3
"""facebook-cli falso para las pruebas de measure.py (sin red).

Subcomandos:
- pages list -> [] (defecto) o la Página A si STUB_FB_PAGES=found.
- pages posts list -> posts de la Página A (engagements 100/200/300
  en base + 600 destacado y 50 flojo en la ventana).
- pages account-insights -> seguidores 5000 y totales.
- post read --url <url> -> el post de esa URL (o {"posts": []}).
- post reactions read --post-id <id> -> total_count de ese post.

Datos de la vía de URLs (Página A, owner 1001): base de 6 posts
(reels 100/200/300, carruseles 400/500/600; mediana global 350) +
ventana (reel 1050 = 3.0x destacado, carrusel 100 = 0.29x flojo,
reel 350 = 1.0x). Un post de otra Página (owner 1002) para probar
el filtro de contenido propio. Registra sus argumentos en $STUB_LOG.

STUB_FB_RATE_LIMIT=urls hace fallar `post read` con rate limit;
=pages hace fallar `pages posts list` con rate limit.
"""
import json
import os
import sys

if os.environ.get("STUB_LOG"):
    with open(os.environ["STUB_LOG"], "a", encoding="utf-8") as f:
        f.write(" ".join(sys.argv[1:]) + "\n")

RATE = os.environ.get("STUB_FB_RATE_LIMIT", "")

POSTS = {
    "https://www.facebook.com/reel/2001/": {
        "owner_id": "1001", "post_id": "3001", "username": "paginaa",
        "owner_name": "Página A", "profile_url": "https://facebook.com/paginaa",
        "comments": 5, "created_at": "2026-10-01T10:00:00+00:00",
        "post_caption": "Reel base cien", "media_type": "video",
        "url": "https://www.facebook.com/reel/2001/", "reacciones": 100},
    "https://www.facebook.com/reel/2002/": {
        "owner_id": "1001", "post_id": "3002", "username": "paginaa",
        "owner_name": "Página A", "profile_url": "https://facebook.com/paginaa",
        "comments": 5, "created_at": "2026-10-05T10:00:00+00:00",
        "post_caption": "Reel base doscientos", "media_type": "video",
        "url": "https://www.facebook.com/reel/2002/", "reacciones": 200},
    "https://www.facebook.com/reel/2003/": {
        "owner_id": "1001", "post_id": "3003", "username": "paginaa",
        "owner_name": "Página A", "profile_url": "https://facebook.com/paginaa",
        "comments": 5, "created_at": "2026-10-10T10:00:00+00:00",
        "post_caption": "Reel base trescientos", "media_type": "video",
        "url": "https://www.facebook.com/reel/2003/", "reacciones": 300},
    "https://www.facebook.com/paginaa/posts/2101": {
        "owner_id": "1001", "post_id": "3101", "username": "paginaa",
        "owner_name": "Página A", "profile_url": "https://facebook.com/paginaa",
        "comments": 2, "created_at": "2026-10-12T10:00:00+00:00",
        "post_caption": "Carrusel base cuatrocientos", "media_type": "carousel",
        "url": "https://www.facebook.com/paginaa/posts/2101", "reacciones": 400},
    "https://www.facebook.com/paginaa/posts/2102": {
        "owner_id": "1001", "post_id": "3102", "username": "paginaa",
        "owner_name": "Página A", "profile_url": "https://facebook.com/paginaa",
        "comments": 2, "created_at": "2026-10-15T10:00:00+00:00",
        "post_caption": "Carrusel base quinientos", "media_type": "carousel",
        "url": "https://www.facebook.com/paginaa/posts/2102", "reacciones": 500},
    "https://www.facebook.com/paginaa/posts/2103": {
        "owner_id": "1001", "post_id": "3103", "username": "paginaa",
        "owner_name": "Página A", "profile_url": "https://facebook.com/paginaa",
        "comments": 2, "created_at": "2026-10-18T10:00:00+00:00",
        "post_caption": "Carrusel base seiscientos", "media_type": "carousel",
        "url": "https://www.facebook.com/paginaa/posts/2103", "reacciones": 600},
    "https://www.facebook.com/reel/2006/": {
        "owner_id": "1001", "post_id": "3006", "username": "paginaa",
        "owner_name": "Página A", "profile_url": "https://facebook.com/paginaa",
        "comments": 9, "created_at": "2026-11-20T10:00:00+00:00",
        "post_caption": "Reel ventana mil cincuenta", "media_type": "video",
        "url": "https://www.facebook.com/reel/2006/", "reacciones": 1050},
    "https://www.facebook.com/paginaa/posts/2106": {
        "owner_id": "1001", "post_id": "3106", "username": "paginaa",
        "owner_name": "Página A", "profile_url": "https://facebook.com/paginaa",
        "comments": 1, "created_at": "2026-11-18T10:00:00+00:00",
        "post_caption": "Carrusel ventana cien", "media_type": "carousel",
        "url": "https://www.facebook.com/paginaa/posts/2106", "reacciones": 100},
    "https://www.facebook.com/reel/2007/": {
        "owner_id": "1001", "post_id": "3007", "username": "paginaa",
        "owner_name": "Página A", "profile_url": "https://facebook.com/paginaa",
        "comments": 4, "created_at": "2026-11-15T10:00:00+00:00",
        "post_caption": "Reel ventana trescientos cincuenta", "media_type": "video",
        "url": "https://www.facebook.com/reel/2007/", "reacciones": 350},
    "https://www.facebook.com/paginab/posts/2201": {
        "owner_id": "1002", "post_id": "3201", "username": "paginab",
        "owner_name": "Página B", "profile_url": "https://facebook.com/paginab",
        "comments": 0, "created_at": "2026-11-19T10:00:00+00:00",
        "post_caption": "Post de otra pagina", "media_type": "video",
        "url": "https://www.facebook.com/paginab/posts/2201", "reacciones": 9999},
}
POR_ID = {p["post_id"]: p for p in POSTS.values()}

PAGES_POSTS = [
    {"post_id": "4001", "created_time": "2026-10-02T10:00:00+00:00",
     "permalink_url": "https://www.facebook.com/reel/4001/",
     "message": "Reel pages cien", "media_type": "video",
     "views": 1000, "engagements": 100},
    {"post_id": "4002", "created_time": "2026-10-08T10:00:00+00:00",
     "permalink_url": "https://www.facebook.com/reel/4002/",
     "message": "Reel pages doscientos", "media_type": "video",
     "views": 2000, "engagements": 200},
    {"post_id": "4003", "created_time": "2026-10-14T10:00:00+00:00",
     "permalink_url": "https://www.facebook.com/paginaa/posts/4003",
     "message": "Post pages trescientos", "media_type": "photo",
     "views": 3000, "engagements": 300},
    {"post_id": "4004", "created_time": "2026-11-20T10:00:00+00:00",
     "permalink_url": "https://www.facebook.com/reel/4004/",
     "message": "Reel pages seiscientos", "media_type": "video",
     "views": 6000, "engagements": 600},
    {"post_id": "4005", "created_time": "2026-11-16T10:00:00+00:00",
     "permalink_url": "https://www.facebook.com/paginaa/posts/4005",
     "message": "Post pages cincuenta", "media_type": "photo",
     "views": 500, "engagements": 50},
]

args = sys.argv[1:]
if args[:2] == ["pages", "list"]:
    if os.environ.get("STUB_FB_PAGES") == "found":
        print(json.dumps({"data": [{"page_id": "2001", "profile_id": "1001",
                                    "name": "Página A"}]}))
    else:
        print(json.dumps({"data": []}))
elif args[:3] == ["pages", "posts", "list"]:
    if RATE == "pages":
        print("Error: rate limit exceeded (429)", file=sys.stderr)
        sys.exit(1)
    print(json.dumps({"posts": PAGES_POSTS, "cursor": None}))
elif args[:2] == ["pages", "account-insights"]:
    print(json.dumps({"metrics": {"follower_count": 5000, "views": 10000,
                                  "unique_viewers": 8000,
                                  "engagement_including_clicks": 1500}}))
elif args[:2] == ["post", "read"]:
    if RATE == "urls":
        print("Error: rate limit exceeded (429)", file=sys.stderr)
        sys.exit(1)
    url = args[args.index("--url") + 1] if "--url" in args else ""
    p = POSTS.get(url)
    if p is None:
        print(json.dumps({"posts": []}))
    else:
        copia = {k: v for k, v in p.items() if k != "reacciones"}
        print(json.dumps({"posts": [copia]}))
elif args[:3] == ["post", "reactions", "read"]:
    pid = args[args.index("--post-id") + 1] if "--post-id" in args else ""
    p = POR_ID.get(pid)
    total = p["reacciones"] if p else 0
    print(json.dumps({"summary": {"total_count": total,
                                  "reaction_counts": []}}))
else:
    print(json.dumps({}))
