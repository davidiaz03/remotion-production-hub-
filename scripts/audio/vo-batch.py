#!/usr/bin/env python3
"""Sintetiza TODOS los capítulos de VO en un solo proceso Kokoro.

En modern-wisdom-aprende la VO se hizo con 2 workers en paralelo y
cada capítulo en un proceso nuevo: RTF 8-12 (2 h 42 min para 33 min
de audio) frente a RTF ~1,6-2,1 de un solo proceso con 2 hilos. La
caja tiene 1,5 CPU efectivas: el paralelismo de workers EMPEORA el
tiempo total. Este script carga el modelo UNA vez (~30 s, no 15×)
y sintetiza los capítulos en secuencia, con reanudación (salta los
capítulos ya hechos).

Manifiesto JSON (--manifest):
  {"voice": "em_alex", "speed": 0.95, "threads": 2,
   "chapters": [
     {"script": "vo-chapters/ch00.json",
      "out": "public/audio/vo/ch00.wav",
      "lines_json": "vo-chapters/ch00-lines.json"},
     ...]}
Las rutas son relativas a --root (defecto: cwd, la carpeta del
proyecto). Cada capítulo es un JSON {"fragments": [...]} como el de
gen-vo-kokoro.py (mismo formato, mismo log por fragmento).

Uso:
  .venv/bin/python scripts/audio/vo-batch.py --manifest vo-manifest.json
  # Reanuda solo: los capítulos con WAV + lines_json existentes se
  # saltan (usa --force para regenerar todo).
"""
import argparse
import importlib.util
import json
import os
import sys
import time

_HUB = os.path.expanduser("~/workspace/remotion-hub")
os.environ.setdefault("HF_HOME", os.path.join(_HUB, ".hf-cache"))
os.environ.setdefault("NO_PROXY", "localhost,127.0.0.1")
os.environ.setdefault("no_proxy", "localhost,127.0.0.1")
os.environ.setdefault("OMP_NUM_THREADS", "2")
os.environ.setdefault("MKL_NUM_THREADS", "2")


def _load_kokoro_module():
    here = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(here, "gen-vo-kokoro.py")
    spec = importlib.util.spec_from_file_location("gen_vo_kokoro", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--manifest", required=True,
                   help="JSON con voice/speed/threads/chapters")
    p.add_argument("--root", default=".",
                   help="Carpeta del proyecto (rutas relativas)")
    p.add_argument("--force", action="store_true",
                   help="Regenerar incluso los capítulos ya hechos")
    a = p.parse_args()
    with open(a.manifest, encoding="utf-8") as f:
        man = json.load(f)
    voice = man.get("voice", "em_alex")
    speed = float(man.get("speed", 1.0))
    threads = int(man.get("threads", 2))
    chapters = man.get("chapters", [])
    if not chapters:
        p.error("el manifiesto no trae capítulos")
    root = os.path.abspath(a.root)

    todo = []
    for ch in chapters:
        out = os.path.join(root, ch["out"])
        lines = os.path.join(root, ch.get("lines_json", ch["out"] + ".json"))
        if (not a.force and os.path.exists(out)
                and os.path.exists(lines)
                and os.path.getsize(out) > 0):
            print(f"salto {ch['out']} (ya existe)")
            continue
        todo.append((ch, out, lines))
    if not todo:
        print("VO completa: todos los capítulos ya existen")
        return 0
    print(f"{len(todo)} capítulo(s) por sintetizar "
          f"({len(chapters) - len(todo)} ya hechos), voz {voice}, "
          f"speed {speed}, threads {threads}")

    koko = _load_kokoro_module()
    from kokoro import KPipeline  # noqa: PLC0415
    import torch  # noqa: PLC0415
    torch.set_num_threads(max(1, threads))
    torch.set_num_interop_threads(max(1, threads))
    t_load = time.perf_counter()
    pipe = KPipeline(lang_code="e")
    print(f"modelo cargado en {time.perf_counter() - t_load:.0f} s")

    grand_t0 = time.perf_counter()
    total_audio = 0.0
    for ch, out, lines_json in todo:
        with open(os.path.join(root, ch["script"]),
                  encoding="utf-8") as f:
            fragments = json.load(f)["fragments"]
        os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
        os.makedirs(os.path.dirname(os.path.abspath(lines_json)),
                    exist_ok=True)
        print(f"\n== {ch['out']} ({len(fragments)} fragmentos) ==")
        t0 = time.perf_counter()
        full, lines, _t = koko.render_fragments(pipe, fragments, voice,
                                                speed, log=print)
        total, peak = koko.write_wav24(out, full)
        with open(lines_json, "w", encoding="utf-8") as f:
            json.dump({"sample_rate": koko.SAMPLE_RATE, "voice": voice,
                       "speed": speed, "peak": round(peak, 3),
                       "total_duration": round(total, 3), "lines": lines},
                      f, ensure_ascii=False, indent=2)
        wall = time.perf_counter() - t0
        total_audio += total
        print(f"OK {out} — {total:.1f} s de audio en {wall:.0f} s "
              f"(RTF {wall / max(total, 0.1):.2f})")
    grand = time.perf_counter() - grand_t0
    print(f"\nVO_BATCH_OK {len(todo)} capítulos, {total_audio:.1f} s de "
          f"audio en {grand:.0f} s (RTF global "
          f"{grand / max(total_audio, 0.1):.2f}, carga del modelo "
          f"incluida)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
