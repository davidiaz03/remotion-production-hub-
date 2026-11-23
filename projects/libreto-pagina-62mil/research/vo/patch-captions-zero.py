#!/usr/bin/env python3
"""Corrige las palabras de karaoke con duración CERO que dejó
transcribe-vo.py cuando el ASR no ancló la palabra del guion
(23-nov-2026, 10 casos en 1465 palabras).

Casos con ancla acústica real (se reconstruyen desde los
word_timestamps de vo-edited-transcript-by-line.json):
- L16 «Es totalmente falso»: el ASR oyó «Esto también es falso»
  (296.20-297.44). «Es» = 296.20-296.52 («Esto»), «totalmente» =
  296.52-297.10 («también es»), «falso» = 297.10-297.44 (ancla ASR).
  La VO dice «Es totalmente» (confirmado de oído por el usuario).
- L17 «Yasel Porto»: el ASR oyó «y hacer puto» (317.00-317.96).
  «Yasel» = 317.00-317.42, «Porto» = 317.42-317.96. (El texto ASR
  soez solo existe en la transcripción; en pantalla va el guion.)
  La región siguiente (839-842) también quedó desanclada y se
  reconstruye entera desde el by-line (verificado 23-nov-2026):
  «y» 317.96-318.08, «el poder digital.» 318.08-318.78,
  «El toque» 319.20-319.64, «la» (= «lo») 319.64-319.74.
- 12 palabras de inicio de frase que transcribe-vo.py interpoló
  DENTRO de la pausa anterior (0,3-1,4 s antes de su frase; el
  chequeo contra research/sentences.json v3 las cazó): «62.000»
  (19.15, ASR «62»+«mil»), 3× «elTOQUE» (95.49/179.44/189.50),
  «SIN» (162.17), «MUSK»+«SÍ» (197.38/197.60), «LO» (211.76),
  «SI» (215.68), «HORAS» (350.08), «MESSI POR FIN HABLANDO DE»
  (432.62-433.76, el ASR oyó «Mésipo fina») y «A EL LIBRETO.»
  (539.02-539.64; el ASR fundió «a el» en «al», se reparte 80/80 ms).

Resto (artículos y el guion «-», 7 casos): 60 ms centrados en su
marca de tiempo, tomando 30 ms de cada vecino (siempre quedan >=40 ms).

Aplica el mismo parche a src/captions.json (lista plana HubCaption) y
a src/captions.ts (CapSegment anidados; se recomputan los start/end de
cada chunk desde sus palabras). Después, re-correr el paso align del
pipeline para regenerar el informe y el SRT.

Uso: python3 patch-captions-zero.py [--force]
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(os.path.dirname(HERE))

# Índice en la lista plana -> (inicio_s, fin_s). Se verifica el texto.
ABSOLUTE = {
    60: (19.15, 20.17, "62.000"),         # ASR «62»+«mil» (caption: 18.74)
    268: (95.49, 95.99, "ELTOQUE"),       # ASR «El»+«toque» (caption: 95.08)
    424: (162.17, 162.53, "SIN"),         # ASR «sin» (caption: 161.56)
    468: (179.44, 179.80, "ELTOQUE"),     # ASR «el»+«toque» (caption: 178.98)
    495: (189.50, 189.98, "ELTOQUE"),     # ASR «El»+«toque» (caption: 189.00)
    516: (197.38, 197.60, "MUSK"),        # ASR «Musk» (caption: 197.06)
    517: (197.60, 197.86, "SÍ"),          # ASR «si»
    559: (211.76, 211.92, "LO"),          # ASR «Los» (caption: 211.44)
    570: (215.68, 215.84, "SI"),          # ASR «Si» (caption: 215.14)
    778: (296.20, 296.52, "«ES"),         # L16, ancla ASR «Esto»
    779: (296.52, 297.10, "TOTALMENTE"),  # L16, ancla ASR «también es»
    837: (317.00, 317.42, "YASEL"),       # L17, ancla ASR «y hacer»
    838: (317.42, 317.96, "PORTO"),       # L17, ancla ASR «puto»
    839: (317.96, 318.08, "Y"),           # L17, ASR «y»
    840: (318.08, 318.78, "ELPODERDIGITAL."),  # L17, ASR «el poder digital.»
    841: (319.20, 319.64, "ELTOQUE"),     # L17, ASR «El»+«toque»
    842: (319.64, 319.74, "LO"),          # L17, ASR «la»
    925: (350.08, 350.40, "HORAS"),       # ASR «Horas» (caption: 349.46)
    1147: (432.62, 432.85, "MESSI"),      # ASR «Mésipo» (caption: 432.26)
    1148: (432.85, 432.98, "POR"),        # ASR «Mésipo» (2ª mitad)
    1149: (432.98, 433.26, "FIN"),        # ASR «fina»
    1150: (433.26, 433.44, "HABLANDO"),   # ASR «hablando»
    1151: (433.44, 433.76, "DE"),         # ASR «de»
    1453: (539.02, 539.10, "A"),          # ASR «al» (1ª mitad)
    1454: (539.10, 539.18, "EL"),         # ASR «al» (2ª mitad)
    1455: (539.18, 539.64, "LIBRETO."),   # ASR «libreto.» (align la movió a 540.17)
}
MIN_DUR_S = 0.06  # duración mínima para las palabras sin ancla


def main():
    force = "--force" in sys.argv
    json_path = os.path.join(PROJ, "src", "captions.json")
    ts_path = os.path.join(PROJ, "src", "captions.ts")
    cap = json.load(open(json_path, encoding="utf-8"))
    assert len(cap) == 1465, len(cap)

    # 1. Localizar las palabras con duración <40 ms (cero + 2 de 20 ms:
    # «LA» [894] y [1013], estranguladas por el alineador tras
    # «JUNIO,»/«JULIO,»). La validación exige >=40 ms en TODAS.
    zero = [i for i, c in enumerate(cap)
            if c["endMs"] - c["startMs"] < 40]
    print(f"palabras con duración <40 ms: {len(zero)}")
    for i in zero:
        print(f"  [{i}] {cap[i]['text']!r} @ {cap[i]['startMs']/1000:.2f}s "
              f"({cap[i]['endMs'] - cap[i]['startMs']} ms)")

    # 2. Calcular los nuevos tiempos (en ms) sobre la lista plana.
    new_times = {}  # idx -> (startMs, endMs)
    for i, (s, e, expect) in ABSOLUTE.items():
        got = cap[i]["text"].strip().upper()
        assert got == expect, (i, got, expect)
        new_times[i] = (round(s * 1000), round(e * 1000))
    for i in zero:
        if i in new_times:
            continue
        # La palabra corta está justo en la frontera entre sus vecinos
        # (hueco 0 ms): roba hasta 60 ms repartidos desde su punto
        # medio, dejando a cada vecino >=50 ms si se puede (>=40 ms
        # como mínimo absoluto). El reparto simétrico 30/30 dejaba a
        # «QUE» [878] en 30 ms.
        t = (cap[i]["startMs"] + cap[i]["endMs"]) // 2
        need = round(MIN_DUR_S * 1000)
        prev_dur = cap[i - 1]["endMs"] - cap[i - 1]["startMs"]
        next_dur = cap[i + 1]["endMs"] - cap[i + 1]["startMs"]
        take_prev = min(need // 2, max(0, prev_dur - 50))
        take_next = need - take_prev
        if take_next > next_dur - 50:
            take_next = max(0, next_dur - 50)
            take_prev = need - take_next
        new_times[i] = (t - take_prev, t + take_next)
    # Vecinos: que ningún vecino invada el nuevo tramo.
    for i, (s, e) in sorted(new_times.items()):
        if i > 0:
            ps, pe = new_times.get(i - 1, (cap[i - 1]["startMs"],
                                           cap[i - 1]["endMs"]))
            if pe > s:
                new_times[i - 1] = (ps, s)
        if i + 1 < len(cap):
            ns, ne = new_times.get(i + 1, (cap[i + 1]["startMs"],
                                           cap[i + 1]["endMs"]))
            if ns < e:
                new_times[i + 1] = (e, ne)
    # Validación: duraciones >= 40 ms y monotonía.
    merged = [(new_times.get(i, (c["startMs"], c["endMs"])))
              for i, c in enumerate(cap)]
    for i, (s, e) in enumerate(merged):
        assert e - s >= 40, (i, cap[i]["text"], s, e)
        if i:
            assert s >= merged[i - 1][0], (i, "no monótono")
    print(f"palabras retocadas (incl. vecinos): {len(new_times)}")

    # 3. Aplicar a captions.json.
    for i, (s, e) in new_times.items():
        cap[i]["startMs"] = s
        cap[i]["endMs"] = e
        cap[i]["timestampMs"] = s
    if not force and os.path.exists(json_path + ".bak"):
        print("existe src/captions.json.bak; usa --force")
        return 1
    os.rename(json_path, json_path + ".bak")
    json.dump(cap, open(json_path, "w", encoding="utf-8"),
              indent=2, ensure_ascii=False)
    print("src/captions.json parcheado (respaldo .bak)")

    # 4. Aplicar a captions.ts (misma lista, en el mismo orden).
    ts = open(ts_path, encoding="utf-8").read()
    m = re.search(r"export const CAPTIONS: CapSegment\[\] = (.*);\n?$",
                  ts, re.S)
    assert m, "no se encontró CAPTIONS en captions.ts"
    segs = json.loads(m.group(1))
    flat = [w for s in segs for ch in s["chunks"] for w in ch["words"]]
    assert len(flat) == len(cap), (len(flat), len(cap))
    for i, w in enumerate(flat):
        assert w["t"].strip().upper() == cap[i]["text"].strip().upper(), (
            i, w["t"], cap[i]["text"])
    for i, (s, e) in new_times.items():
        flat[i]["s"] = round(s / 1000, 3)
        flat[i]["e"] = round(e / 1000, 3)
    for s in segs:
        for ch in s["chunks"]:
            ch["start"] = ch["words"][0]["s"]
            ch["end"] = ch["words"][-1]["e"]
    new_ts = (ts[:m.start(1)] + json.dumps(segs, ensure_ascii=False)
              + ts[m.end(1):])
    os.rename(ts_path, ts_path + ".bak")
    open(ts_path, "w", encoding="utf-8").write(new_ts)
    print("src/captions.ts parcheado (respaldo .bak)")
    print("Siguiente paso: node scripts/pipeline.mjs libreto-pagina-62mil "
          "--from align --to align  (regenera informe + SRT)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
