#!/usr/bin/env python3
"""Stub del CLI de Google Drive para los tests del archivo.

Emula `hatch_gws_cli drive files list --params '{...}'` con datos
ficticios de drive-fixture.json (mismo directorio). Sin red.
"""
import json
import os
import re
import sys

FIXTURE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "drive-fixture.json")


def main():
    argv = sys.argv[1:]
    if argv[:3] != ["drive", "files", "list"]:
        print(json.dumps({"error": "comando no soportado por el stub"}))
        return 1
    params = {}
    if "--params" in argv:
        params = json.loads(argv[argv.index("--params") + 1])
    q = params.get("q", "")
    m = re.search(r"'([^']+)' in parents", q)
    folder_id = m.group(1) if m else ""
    with open(FIXTURE, encoding="utf-8") as fh:
        datos = json.load(fh)
    archivos = datos.get(folder_id, [])
    print(json.dumps({"files": archivos}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
