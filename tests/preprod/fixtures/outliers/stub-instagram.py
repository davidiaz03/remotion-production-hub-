#!/usr/bin/env python3
"""instagram-cli falso para las pruebas de outliers.py (sin red).

Subcomandos:
- accounts -> una sola cuenta (la autodetección la resuelve).
- posts --username <handle> [--after <cursor>] -> páginas fijas.

Datos de cuentaa (misma matemática que stub-ytdlp, con una página
más): base 100/200/300/400/500 likes + outlier 1200 (3.69x) +
breakout 4500 (13.85x) sobre mediana 325; un reciente a 9000
(27.69x, sin clasificar); uno sin likes y uno sin fecha; una
colaboración de otro autor (99999 likes) que el escáner debe
filtrar. La página 1 trae 5 posts y next_cursor PAG2; la página 2
trae 5 propios + la colaboración y next_cursor PAG3; la página 3
trae 5 posts más de base (100/150/250/350/450). Con --max 6, el
escaneo debe seguir hasta la página 3 para completar la base
mínima (10): esa es la prueba de paginación adaptativa.
Datos de cuentab: 3 posts (100/200/300) sin outliers, base de 3
(mediana poco fiable). Registra sus argumentos en $STUB_LOG.
"""
import json
import os
import sys

if os.environ.get("STUB_LOG"):
    with open(os.environ["STUB_LOG"], "a", encoding="utf-8") as f:
        f.write(" ".join(sys.argv[1:]) + "\n")


def post(pid, usuario, likes, fecha, titulo, media="video"):
    return {"post_id": pid, "username": usuario, "likes": likes,
            "comments": 5, "created_at": fecha, "media_type": media,
            "url": f"https://www.instagram.com/reel/{pid}/",
            "post_caption": titulo}


PAG1 = [
    post("ig_a1", "cuentaa", 100, "2026-10-01 10:00:00", "Post base 100"),
    post("ig_a2", "cuentaa", 200, "2026-10-05 10:00:00", "Post base 200"),
    post("ig_a3", "cuentaa", 300, "2026-10-10 10:00:00", "Post base 300"),
    post("ig_a4", "cuentaa", 400, "2026-10-15 10:00:00", "Post base 400"),
    post("ig_a5", "cuentaa", 500, "2026-10-20 10:00:00", "Post base 500"),
]
PAG2 = [
    post("ig_out", "cuentaa", 1200, "2026-10-15 10:00:00",
         "Post outlier tres equis"),
    post("ig_break", "cuentaa", 4500, "2026-10-10 10:00:00",
         "Post breakout once equis"),
    post("ig_rec", "cuentaa", 9000, "2026-11-20 10:00:00",
         "Post reciente veintidos equis"),
    post("ig_sinlikes", "cuentaa", None, "2026-10-05 10:00:00",
         "Post sin likes"),
    post("ig_sinfecha", "cuentaa", 600, None, "Post sin fecha"),
    post("ig_colab", "otroautor", 99999, "2026-10-12 10:00:00",
         "Colaboración que debe filtrarse"),
]
PAG3 = [
    post("ig_c1", "cuentaa", 100, "2026-10-02 10:00:00", "Post base 100b"),
    post("ig_c2", "cuentaa", 150, "2026-10-08 10:00:00", "Post base 150"),
    post("ig_c3", "cuentaa", 250, "2026-10-12 10:00:00", "Post base 250"),
    post("ig_c4", "cuentaa", 350, "2026-10-18 10:00:00", "Post base 350"),
    post("ig_c5", "cuentaa", 450, "2026-10-22 10:00:00", "Post base 450"),
]
CUENTAB = [
    post("ig_b1", "cuentab", 100, "2026-10-01 10:00:00", "Post B 100"),
    post("ig_b2", "cuentab", 200, "2026-10-05 10:00:00", "Post B 200"),
    post("ig_b3", "cuentab", 300, "2026-10-10 10:00:00", "Post B 300"),
]

args = sys.argv[1:]
if args and args[0] == "accounts":
    print(json.dumps({"accounts": [{"user_fbid": "999999",
                                    "username": "cuentapropia"}]}))
    sys.exit(0)

handle = None
cursor = None
i = 0
while i < len(args):
    if args[i] == "--username" and i + 1 < len(args):
        handle = args[i + 1]
        i += 2
    elif args[i] == "--after" and i + 1 < len(args):
        cursor = args[i + 1]
        i += 2
    else:
        i += 1

if handle == "cuentaa" and cursor is None:
    out = {"count": len(PAG1), "has_next_page": True,
           "next_cursor": "PAG2", "posts": PAG1}
elif handle == "cuentaa" and cursor == "PAG2":
    out = {"count": len(PAG2), "has_next_page": True,
           "next_cursor": "PAG3", "posts": PAG2}
elif handle == "cuentaa" and cursor == "PAG3":
    out = {"count": len(PAG3), "has_next_page": False,
           "next_cursor": None, "posts": PAG3}
elif handle == "cuentab":
    out = {"count": len(CUENTAB), "has_next_page": False,
           "next_cursor": None, "posts": CUENTAB}
else:
    out = {"count": 0, "has_next_page": False, "next_cursor": None,
           "posts": []}
print(json.dumps(out))
