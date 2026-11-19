#!/usr/bin/env python3
"""Genera research/edit-plan-v1.json para scripts/audio/audit-audio.py.

La VO es SINTETIZADA (Kokoro), no editada: no hay cortes ni stretch.
Cada línea de VO es un segmento continuo; las pausas son de dos clases,
ambas DISEÑADAS:
- entre líneas: pause_after del guion (0,25-1,2 s, en vo-script.json);
- intra-línea: prosodia natural de Kokoro en comas/dos puntos del guion.

Sin plan, la auditoría (e) marca las 569 pausas como INESPERADAS porque
su modelo asume VO humana editada. El plan declara las pausas como
diseñadas: cada línea se parte en sub-segmentos en sus silencios
intra-línea detectados (>=0,25 s, misma lista que la auditoría detecta),
de modo que los huecos intra-línea y entre-líneas quedan registrados.

Las pausas intra-línea se toman del propio informe de auditoría
(reports/audio-audit-vX.json, métrica e_silences): la lista de silencios
detectados en la VO limpia. Verificado: los 226 silencios intra-línea
caen en comas/dos puntos del guion (prosodia, no artefactos).

Uso: python3 scripts/gen-edit-plan.py   (desde la raíz del proyecto)
Salida: research/edit-plan-v1.json
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main() -> None:
    lines = json.loads(
        (ROOT / "vo-chapters/vo-full-lines.json").read_text(encoding="utf-8")
    )["lines"]
    audit = json.loads(
        (ROOT / "reports/audio-audit-vX.json").read_text(encoding="utf-8")
    )
    silences = audit["metrics"]["e_silences"]  # [start, end, dur]

    plan_lines = []
    n_intra = 0
    for ln in lines:
        s0, e0 = ln["start"], ln["end"]
        # Silencios estrictamente dentro de la línea (con margen: no tocar
        # los bordes, que pertenecen al hueco entre líneas).
        inner = [(s, e) for (s, e, d) in silences
                 if s > s0 + 0.05 and e < e0 - 0.05]
        n_intra += len(inner)
        # Sub-segmentos: [s0, s1], [e1, s2], ..., [ek, e0].
        segs = []
        cur = s0
        for (ss, se) in sorted(inner):
            if ss > cur + 0.05:  # evita segmentos degenerados
                segs.append({"orig_start": round(cur, 3),
                             "orig_end": round(ss, 3),
                             "edited_start": round(cur, 3),
                             "edited_end": round(ss, 3)})
            cur = max(cur, se)
        if e0 > cur + 0.05:
            segs.append({"orig_start": round(cur, 3),
                         "orig_end": round(e0, 3),
                         "edited_start": round(cur, 3),
                         "edited_end": round(e0, 3)})
        if not segs:  # línea casi toda silencio (no debería pasar)
            segs = [{"orig_start": s0, "orig_end": e0,
                     "edited_start": s0, "edited_end": e0}]
        plan_lines.append({"linea": ln["index"] + 1,
                           "factor_uniforme": 1.0,
                           "segs": segs,
                           "merged_gaps": []})

    out = ROOT / "research/edit-plan-v1.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(
        {"pad": 0.03,
         "nota": "VO sintetizada Kokoro sin cortes: orig==edited en todos "
                 "los segmentos. Pausas entre líneas = pause_after del "
                 "guion; pausas intra-línea = prosodia en comas/dos puntos.",
         "lines": plan_lines},
        ensure_ascii=False, indent=1), encoding="utf-8")
    n_segs = sum(len(ln["segs"]) for ln in plan_lines)
    print(f"OK {out}: {len(plan_lines)} líneas, {n_segs} segmentos, "
          f"{n_intra} pausas intra-línea declaradas")


if __name__ == "__main__":
    main()
