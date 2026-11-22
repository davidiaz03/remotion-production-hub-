#!/usr/bin/env python3
"""facebook-cli falso para las pruebas de outliers.py (sin red).

Subcomandos:
- post read --url <url> -> el post de esa URL (o {"posts": []} si
  la URL no está en los datos).
- post reactions read --post-id <id> -> total_count de ese post.

Datos de Página A (misma matemática que stub-ytdlp): base
100/200/300/400/500 reacciones + outlier 1200 (3.0x) + breakout
4500 (11.25x) sobre mediana 400; un reciente a 9000 (22.5x, sin
clasificar). Datos de Página B (NO está en channels.json del
fixture: prueba la atribución de páginas no configuradas): 2 posts
(100/200), base de 2 (mediana poco fiable). Registra sus
argumentos en $STUB_LOG.
"""
import json
import os
import sys

if os.environ.get("STUB_LOG"):
    with open(os.environ["STUB_LOG"], "a", encoding="utf-8") as f:
        f.write(" ".join(sys.argv[1:]) + "\n")

POSTS = {
    "https://www.facebook.com/reel/2001/": {
        "owner_id": "1001", "post_id": "3001", "username": "paginaa", "owner_name": "Página A",
        "profile_url": "https://facebook.com/paginaa", "comments": 5,
        "created_at": "2026-10-01T10:00:00+00:00",
        "post_caption": "Post base 100", "media_type": "video",
        "url": "https://www.facebook.com/reel/2001/",
        "reacciones": 100},
    "https://www.facebook.com/reel/2002/": {
        "owner_id": "1001", "post_id": "3002", "username": "paginaa", "owner_name": "Página A",
        "profile_url": "https://facebook.com/paginaa", "comments": 5,
        "created_at": "2026-10-05T10:00:00+00:00",
        "post_caption": "Post base 200", "media_type": "video",
        "url": "https://www.facebook.com/reel/2002/",
        "reacciones": 200},
    "https://www.facebook.com/reel/2003/": {
        "owner_id": "1001", "post_id": "3003", "username": "paginaa", "owner_name": "Página A",
        "profile_url": "https://facebook.com/paginaa", "comments": 5,
        "created_at": "2026-10-10T10:00:00+00:00",
        "post_caption": "Post base 300", "media_type": "video",
        "url": "https://www.facebook.com/reel/2003/",
        "reacciones": 300},
    "https://www.facebook.com/reel/2004/": {
        "owner_id": "1001", "post_id": "3004", "username": "paginaa", "owner_name": "Página A",
        "profile_url": "https://facebook.com/paginaa", "comments": 5,
        "created_at": "2026-10-15T10:00:00+00:00",
        "post_caption": "Post base 400", "media_type": "video",
        "url": "https://www.facebook.com/reel/2004/",
        "reacciones": 400},
    "https://www.facebook.com/reel/2005/": {
        "owner_id": "1001", "post_id": "3005", "username": "paginaa", "owner_name": "Página A",
        "profile_url": "https://facebook.com/paginaa", "comments": 5,
        "created_at": "2026-10-20T10:00:00+00:00",
        "post_caption": "Post base 500", "media_type": "video",
        "url": "https://www.facebook.com/reel/2005/",
        "reacciones": 500},
    "https://www.facebook.com/reel/2006/": {
        "owner_id": "1001", "post_id": "3006", "username": "paginaa", "owner_name": "Página A",
        "profile_url": "https://facebook.com/paginaa", "comments": 5,
        "created_at": "2026-10-15T10:00:00+00:00",
        "post_caption": "Post outlier tres equis", "media_type": "video",
        "url": "https://www.facebook.com/reel/2006/",
        "reacciones": 1200},
    "https://www.facebook.com/reel/2007/": {
        "owner_id": "1001", "post_id": "3007", "username": "paginaa", "owner_name": "Página A",
        "profile_url": "https://facebook.com/paginaa", "comments": 5,
        "created_at": "2026-10-10T10:00:00+00:00",
        "post_caption": "Post breakout once equis", "media_type": "video",
        "url": "https://www.facebook.com/reel/2007/",
        "reacciones": 4500},
    "https://www.facebook.com/reel/2008/": {
        "owner_id": "1001", "post_id": "3008", "username": "paginaa", "owner_name": "Página A",
        "profile_url": "https://facebook.com/paginaa", "comments": 5,
        "created_at": "2026-11-20T10:00:00+00:00",
        "post_caption": "Post reciente veintidos equis",
        "media_type": "video",
        "url": "https://www.facebook.com/reel/2008/",
        "reacciones": 9000},
    "https://www.facebook.com/paginab/posts/2101": {
        "owner_id": "1002", "post_id": "3101", "username": "paginab", "owner_name": "Página B",
        "profile_url": "https://facebook.com/paginab", "comments": 2,
        "created_at": "2026-10-01T10:00:00+00:00",
        "post_caption": "Post B 100", "media_type": "photo",
        "url": "https://www.facebook.com/paginab/posts/2101",
        "reacciones": 100},
    "https://www.facebook.com/paginab/posts/2102": {
        "owner_id": "1002", "post_id": "3102", "username": "paginab", "owner_name": "Página B",
        "profile_url": "https://facebook.com/paginab", "comments": 2,
        "created_at": "2026-10-05T10:00:00+00:00",
        "post_caption": "Post B 200", "media_type": "photo",
        "url": "https://www.facebook.com/paginab/posts/2102",
        "reacciones": 200},
}
POR_ID = {p["post_id"]: p for p in POSTS.values()}

args = sys.argv[1:]
if args[:2] == ["post", "read"]:
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
