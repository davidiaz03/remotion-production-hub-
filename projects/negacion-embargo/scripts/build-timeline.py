#!/usr/bin/env python3
"""Construye la línea de tiempo maestra del reel «Dicen que no hay
bloqueo» a partir de los tiempos de palabra de la VO real (faster-whisper
small) y las mediciones del panel (AUDIT_PREEDIT.md §6).

Salidas:
  research/timeline.json   — escenas, colocación de la VO, rangos del
                             panel, puntos SFX (con sync/uvo), hitos
                             visuales. Fuente de verdad para la composición.
  src/captions.ts          — CapSegment[] (formato marti-fidel) con los
                             tiempos PRE-alineación; después se corrigen
                             con scripts/audio/align-captions.py contra
                             la VO colocada (el karaoke tras pausa
                             adelanta ~0,2 s en Whisper).
  research/captions-raw.json — palabras planas pre-alineación (referencia).

Tiempos: 30 fps. Total 2325 f = 77,5 s (rango de la auditoría: 73–78 s).
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
FPS = 30

# --- VO: inicio del HABLA de cada línea en la línea de tiempo (s) -------
# Medido: L1 4,92 s de habla; L2 2,60; L3 1,88; L4 8,88; L5 8,68;
# L6 9,34; L7 6,06; L8 4,68. Respiración entre líneas: 0,3–1,4 s.
# L8 en 68,5 (J-cut investigación 3: la voz empieza sobre el último
# fotograma del cierre; era 69,0).
SPEECH_START = {1: 0.5, 2: 23.6, 3: 26.5, 4: 29.0,
                5: 40.5, 6: 51.0, 7: 61.5, 8: 68.5}

# --- Chunks de karaoke (índices de palabra, 2–4 por golpe) --------------
# kw = palabra clave en rojo #ED1C24 (mapa AUDIT_PREEDIT.md §8).
CHUNKS = {
    1: [([0, 1, 2], []), ([3, 4, 5], []), ([6, 7, 8], []),
        ([9, 10, 11], [11]), ([12], [])],
    2: [([0, 1], [0]), ([2, 3, 4], [])],
    3: [([0, 1], []), ([2, 3], [2, 3])],
    4: [([0, 1, 2, 3], []), ([4, 5, 6, 7], []), ([8, 9, 10, 11], []),
        ([12, 13, 14], []), ([15, 16, 17, 18], []), ([19, 20, 21], []),
        ([22, 23, 24], [22, 23, 24])],
    5: [([0, 1, 2, 3], []), ([4, 5, 6], []), ([7, 8], []),
        ([9, 10, 11], [9, 10, 11]), ([12, 13, 14, 15], []),
        ([16, 17], []), ([18, 19, 20], [])],
    6: [([0, 1, 2], []), ([3, 4, 5, 6], []), ([7, 8, 9], []),
        ([10, 11, 12], []), ([13, 14, 15, 16], [14]),
        ([17, 18, 19], []), ([20, 21], []), ([22, 23, 24], [24])],
    7: [([0, 1, 2], []), ([3, 4, 5, 6], []), ([7, 8], []),
        ([9, 10, 11, 12], []), ([13, 14, 15, 16], [15, 16])],
    8: [([0, 1, 2], []), ([3, 4, 5], []), ([6, 7, 8], [7, 8]),
        ([9, 10, 11, 12], [11, 12]), ([13, 14], [13])],
}

# --- Escenas (fotogramas a 30 fps) ---------------------------------------
SCENES = [
    {"id": 0, "name": "Gancho", "start_f": 0, "end_f": 171,
     "note": "Video real mudo de Waltz 27-oct (soundbite 13,0–18,7 s) "
             "+ título cinético con slam a 0,3 s + karaoke L1; logo "
             "desde f0."},
    {"id": 1, "name": "Panel T1 Rubio", "start_f": 171, "end_f": 297,
     "note": "Video Rubio 5,9–9,9 s (punch-in 120–130% sobre la cara, "
             "C9); «NO SE DEBE A UN “BLOQUEO” PETROLERO»; punto 1/4."},
    {"id": 2, "name": "Panel T2 Waltz 7-jul", "start_f": 297, "end_f": 465,
     "note": "Video Waltz 10,9–16,5 s; «IT'S FAKE. IT'S FALSE. IT'S A "
             "LIE. PERIOD.» + «ES FALSO. ES MENTIRA. PUNTO.»; slam en "
             "«PUNTO.» a 14,1 s (f423; J-cut: el audio T2 arranca en 9,5 s); "
             "punto 2/4."},
    {"id": 3, "name": "Panel T3 Waltz 27-oct", "start_f": 465, "end_f": 585,
     "note": "Video Waltz 0,3–2,8 s CON RAMPA (2,9 s, mudo) + "
             "freeze-frame 1,1 s (aterriza en 18,40 s); audio por "
             "separado desde 15,1 s (J-cut); «THERE IS NO BLOCKADE» / "
             "«NO HAY BLOQUEO» grande; punto 3/4."},
    {"id": 4, "name": "Panel T4 Fox", "start_f": 585, "end_f": 705,
     "note": "Tarjeta sobre foto Fox + degradado; «THERE IS NO AMERICAN "
             "NAVAL CORDON AROUND CUBA» + traducción; punto 4/4."},
    {"id": 5, "name": "Giro", "start_f": 705, "end_f": 861,
     "note": "L2: rejilla 2×2 + «CUATRO VECES.» / «EN SEIS MESES.»; "
             "L3: casi negro + «Vale. Ahora mira esto.»; música cortada."},
    {"id": 6, "name": "L4 state.gov", "start_f": 861, "end_f": 1200,
     "note": "Plano 1 página 65→82% con zoom lento (28,7–32,7 s) → "
             "punch al párrafo 230% (32,7 s) + punch 2 a 235% sobre la "
             "cláusula final (37,5 s) + resaltador amarillo + subrayado "
             "rojo a mano + traducción en 3 tiempos desde 34,38 s."},
    {"id": 7, "name": "L5 5-nov", "start_f": 1200, "end_f": 1515,
     "note": "Comunicado + contador 1→10 en rejilla (44,0–48,8 s) + "
             "10 nodos en 3 grupos por NOMBRE (sin cifras) + chip «5 "
             "BUQUES BLOQUEADOS» al final."},
    {"id": 8, "name": "L6 EAR", "start_f": 1515, "end_f": 1830,
     "note": "4 tiempos: (1) Waltz mudo 19,3–25,2 s + «$876 M» + "
             "«incluye $231,7 M en combustible»; (2) sello «PERMISO "
             "REQUERIDO — EAR» a 55,24 s; (3) «COMERCIO LIBRE» tachado "
             "a 58,04 s; (4) «CONTROL» en rojo + NOAA a 59,64 s."},
    {"id": 9, "name": "Cierre L7", "start_f": 1830, "end_f": 2055,
     "note": "Pantalla dividida: 4 mini-tarjetas ciclando cada 48 f "
             "(1,6 s, 3 compases) (izq.) + 2 documentos (der.); eslogan "
             "en dos tiempos (64,94 s / 66,44 s) + sello «ES UN "
             "DOCUMENTO OFICIAL»."},
    {"id": 10, "name": "Pregunta L8", "start_f": 2055, "end_f": 2235,
     "note": "Karaoke L8 (chunks −0,5 s por el J-cut) + botones "
             "«A · NO EXISTE» / «B · NO LES CONVIENE» (a 68,5 s) + "
             "«Comenta A o B»."},
    {"id": 11, "name": "Logo", "start_f": 2235, "end_f": 2325,
     "note": "Logo animado del Memorial (fondo negro, sting-black-2x) "
             "+ sting; 3,0 s."},
]

# --- Panel: rangos de video usados (segundos del archivo original) -------
PANEL = {
    "t1_rubio": {"file": "video/rubio-bloqueo-petrolero.mp4",
                 "clip_start": 5.9, "clip_end": 9.9,
                 "scene_start_s": 5.7,
                 "phrase_s": [6.34, 9.56],
                 "note": "23,976 fps; punch-in 120–130% sobre la cara."},
    "t2_waltz7": {"file": "video/waltz-7jul-its-fake.mp4",
                  "clip_start": 10.9, "clip_end": 16.5,
                  "scene_start_s": 9.9, "audio_start_s": 9.5,
                  "phrase_s": [11.18, 16.16],
                  "punto_s": 14.08,
                  "note": "Pausa de 1,44 s antes de «Period.». J-cut: "
                          "el audio arranca en 9,5 s, 0,4 s antes que "
                          "la imagen; «Period.» se oye a 14,08 s "
                          "(f423; medido: 4,58 s del clip + J-cut 9,5 s; "
                          "ver research/audio-times.json)."},
    "t3_waltz27": {"file": "video/waltz-27oct-no-blockade-soundbite33.mp4",
                   "clip_start": 0.3, "clip_end": 2.8,
                   "freeze_s": 1.1, "scene_start_s": 15.5,
                   "audio_start_s": 15.1, "freeze_land_s": 18.40,
                   "phrase_s": [0.6, 2.8],
                   "note": "Video 2,5 s CON RAMPA (2,9 s, mudo) + "
                           "freeze-frame 1,1 s (still a 2,7 s; el "
                           "freeze aterriza en 18,40 s = f552). Audio "
                           "por separado a velocidad normal desde "
                           "15,1 s (J-cut). La frase completa dura "
                           "10,9 s: NO recortarla por el medio."},
    "t4_fox": {"file": "img/waltz-foxnews-16nov.jpg",
               "scene_start_s": 19.5, "note": "Foto 1280×720 como fondo, "
               "no hero; tarjeta diseñada encima."},
    "l6_mute": {"file": "video/waltz-27oct-no-blockade-soundbite33.mp4",
                "clip_start": 19.3, "clip_end": 25.2,
                "scene_start_s": 50.5, "muted": True,
                "note": "Ventana muda de Waltz bajo L6 (1)."},
    "hook": {"file": "video/waltz-27oct-no-blockade-soundbite33.mp4",
             "clip_start": 13.0, "clip_end": 18.7,
             "scene_start_s": 0.0, "muted": True,
             "note": "Gancho S0: video real mudo (de frente, boca muy "
                     "abierta a 14,0 s, puño levantado a 15,0 s; evita "
                     "la pausa de 6,0–7,0 s y el inicio de perfil)."},
}

# --- SFX: (id, tiempo del EVENTO en s, underVO) ---------------------------
# mix.py no compensa el sync: at = T - sync. underVO aplica el uvo del
# índice (ganancia recomendada bajo VO); fuera de VO, ganancia 1.
SFX_SYNC = {  # del índice shared/motion/sfx/index.ts
    "cinematic-drum-big": (0.011, -8), "whoosh-medium-hard": (0.201, -4),
    "impact-medium-hard": (0.010, -3), "whoosh-fast-hard": (0.092, -4),
    "impact-heavy-hard": (0.010, -4), "reverse-whoosh-short-strong": (0.340, -5),
    "pop-medium-in": (0.011, -2), "move-zoom-in": (0.489, -3),
    "whoosh-medium-soft": (0.229, -2), "impact-light-soft": (0.012, -2),
    "click-hover-medium": (0.008, -1), "swish-hard": (0.054, -4),
    "bass-808-short": (0.011, -8), "cinematic-slam-big": (0.011, -8),
    "writing-marker-draw": (0, -1),
    "riser-1s-soft": (0.982, 0), "riser-1s-soft-tail": (0.292, 0),
    "mechanical-shutter-light": (0.010, -6),
}
SFX_CAT = {  # categoría (subcarpeta en public/audio/sfx/)
    "cinematic-drum-big": "cinematic-hits", "whoosh-medium-hard": "whooshes",
    "impact-medium-hard": "impacts", "whoosh-fast-hard": "whooshes",
    "impact-heavy-hard": "impacts", "reverse-whoosh-short-strong": "reverse-whooshes",
    "pop-medium-in": "pops", "move-zoom-in": "bounce-spin-zoom",
    "whoosh-medium-soft": "whooshes", "impact-light-soft": "impacts",
    "click-hover-medium": "interface", "swish-hard": "swishes-and-zips",
    "bass-808-short": "booms-and-bass", "cinematic-slam-big": "cinematic-hits",
    "writing-marker-draw": "writing-and-drawing",
    "riser-1s-soft": "risers-and-fallers",
    "riser-1s-soft-tail": "risers-and-fallers",
    "mechanical-shutter-light": "mechanical",
}
# Rejilla nominal del compás (T_beat = 0,5357 s; la cama no tiene
# pulso bloqueable): 10 ticks espaciados 1 compás, anclados al
# tick 1 en «10»@44,04 s, cada evento 1–2 f antes de su tiempo.
_ticks = [round(44.04 + i * 0.5357 - 0.05, 2) for i in range(10)]
SFX_EVENTS = [
    ("cinematic-drum-big", 0.30, True),
    ("whoosh-medium-hard", 0.30, True),
    ("riser-1s-soft-tail", 0.30, False),  # cola 0,29 s: solo cabe el final
    ("impact-medium-hard", 5.70, False),
    ("whoosh-fast-hard", 9.90, False),
    ("impact-medium-hard", 9.90, False),
    ("riser-1s-soft", 14.10, False),  # riser T3 antes de «PUNTO.»
    ("impact-heavy-hard", 14.10, False),  # «Period.» a 14,08 s (f423)
    ("whoosh-fast-hard", 15.50, False),
    ("impact-medium-hard", 15.50, False),
    ("mechanical-shutter-light", 18.40, True),  # aterrizaje freeze T3 (f552)
    ("whoosh-fast-hard", 19.50, False),
    ("impact-medium-hard", 19.50, False),
    ("reverse-whoosh-short-strong", 23.20, False),
    ("pop-medium-in", 23.57, True),
    ("pop-medium-in", 23.83, True),
    ("pop-medium-in", 24.10, True),
    ("pop-medium-in", 24.37, True),
    ("whoosh-fast-hard", 28.70, False),
    ("move-zoom-in", 32.70, True),
    ("whoosh-medium-soft", 32.70, True),
    ("impact-light-soft", 34.00, True),
    ("writing-marker-draw", 36.58, True),  # trazo rojo T2 (L4)
] + [("click-hover-medium", t, True) for t in _ticks] + [
    ("impact-medium-hard", 48.81, True),  # acompaña al tick 10
    ("riser-1s-soft", 55.34, False),  # riser T3 antes del sello EAR
    ("impact-heavy-hard", 55.34, True),  # "Pero" (onset acústico; Whisper 55.24)
    ("swish-hard", 58.11, True),  # "Eso" (onset acústico; Whisper 58.04)
    ("bass-808-short", 59.64, True),
    ("riser-1s-soft", 66.52, False),  # riser T3 antes del sello final
    ("cinematic-slam-big", 66.52, True),  # "Es" (onset acústico; Whisper 66.44)
    ("pop-medium-in", 68.50, True),
    ("pop-medium-in", 68.80, True),
    ("cinematic-drum-big", 74.50, False),
]

# --- Hitos visuales (s) ---------------------------------------------------
BEATS = {
    "title_slam_s": 0.30,
    "punto_slam_s": 14.10,
    "grid_pops_s": [23.57, 23.83, 24.10, 24.37],
    "t3_freeze_s": 18.40,  # aterrizaje del freeze (SFX obturador)
    "l4_punch_s": 32.70,
    "l4_overlay_s": 34.00,
    "l4_quote_s": [35.66, 38.78],
    "l5_counter_s": [44.00, 48.80],
    "l5_nodes_s": {"red_petroleo": 45.58, "entidades": 46.76,
                   "proveedores": 48.14},
    "l5_chip_s": 49.50,
    "l6_number_s": 52.10,  # odómetro: aparece 52,1 s, cuenta 52,2–53,2 s
    "l6_seal_s": 55.34,
    "l6_strike_s": 58.11,
    "l6_control_s": 59.64,  # "eso es control" (Whisper; no corregido: intra-frase)
    "l7_slogan1_s": 64.94,
    "l7_slogan2_s": 66.52,
    "l8_buttons_s": 68.50,
    "l8_highlight_a_s": 70.82,
    "l8_highlight_b_s": 72.28,
    "logo_s": 74.50,
}

# --- Cama: dips horneados en el stem (antes de mix.py) -------------------
BED_DIPS = [
    {"t0": 5.7, "t1": 23.5, "gain_db": -6, "ramp_s": 0.3,
     "note": "Panel: la cama baja para dejar claras las voces originales."},
    {"t0": 23.5, "t1": 28.7, "gain_db": -12, "ramp_s": 0.3,
     "note": "Giro: música cortada a casi-silencio (NO silencio digital: "
             "el check (g) falla con >=0,3 s bajo -45 dB)."},
    {"t0": 28.7, "t1": 29.2, "gain_db": 0, "ramp_s": 0.5,
     "note": "Vuelta al nivel tras el giro (subida con la revelación)."},
]


def load_words():
    """Palabras por línea: {linea: [{t, s, e}]} en tiempo del archivo."""
    words = {}
    l1 = json.load(open(os.path.join(PROJ, "research/vo/l1-words-small.json")))
    words[1] = [{"t": w["w"], "s": w["s"], "e": w["e"]} for w in l1]
    vo = json.load(open(os.path.join(
        PROJ, "research/vo/vo-transcription-small.json")))
    for line in vo:
        words[line["linea"]] = [
            {"t": w["palabra"], "s": w["inicio"], "e": w["fin"]}
            for w in line["palabras"]]
    return words


def main():
    words = load_words()
    segments = []
    flat = []
    vo_place = {}
    for n in range(1, 9):
        ws = words[n]
        first = ws[0]["s"]
        last = ws[-1]["e"]
        # Recorte de la sala: 0,15 s antes de la primera palabra y 0,30 s
        # después de la última (solo tono de sala, nunca dentro de una
        # palabra ni de una pausa intra-línea).
        trim_start = max(0.0, round(first - 0.15, 3))
        trim_end = round(last + 0.30, 3)
        adelay = round(SPEECH_START[n] - first + trim_start, 3)
        vo_place[f"L{n}"] = {
            "file": f"audio/real/lines/L{n}.wav",
            "trim_start_s": trim_start, "trim_end_s": trim_end,
            "adelay_s": adelay,
            "speech_start_s": SPEECH_START[n],
            "speech_end_s": round(SPEECH_START[n] + (last - first), 3),
        }
        chunks = []
        for idxs, kws in CHUNKS[n]:
            cwords = []
            for i in idxs:
                w = ws[i]
                s = round(SPEECH_START[n] + (w["s"] - first), 3)
                e = round(SPEECH_START[n] + (w["e"] - first), 3)
                cwords.append({"t": w["t"].upper(), "s": s, "e": e,
                               "kw": i in kws})
                flat.append({"text": w["t"].upper(), "startMs": int(s * 1000),
                             "endMs": int(e * 1000),
                             "pageBreakAfter": i == idxs[-1]})
            chunks.append({"start": cwords[0]["s"], "end": cwords[-1]["e"],
                           "words": cwords})
        seg_start = chunks[0]["start"]
        seg_end = chunks[-1]["end"]
        segments.append({"id": n, "start": seg_start,
                         "frames": int(round((seg_end - seg_start) * FPS)) + 15,
                         "chunks": chunks})

    sfx = []
    for sid, t, under_vo in SFX_EVENTS:
        sync, uvo = SFX_SYNC[sid]
        sfx.append({
            "id": sid, "event_s": t, "at_s": round(max(0.0, t - sync), 3),
            "sync_s": sync, "underVO": under_vo,
            "uvo_db": uvo if under_vo else 0,
            "file": f"audio/sfx/{SFX_CAT[sid]}/{sid}.wav",
        })

    timeline = {
        "project": "negacion-embargo",
        "title": "Dicen que no hay bloqueo",
        "fps": FPS, "duration_s": 77.5, "duration_frames": 2325,
        "scenes": [{**s, "start_s": round(s["start_f"] / FPS, 2),
                    "end_s": round(s["end_f"] / FPS, 2)} for s in SCENES],
        "vo_placement": vo_place,
        "panel": PANEL,
        "sfx": sfx,
        "beats": BEATS,
        "bed": {"id": "memorial-cama-documental",
                "file": "audio/music-bed.wav",
                "stem_lufs": -22.28,
                "music_volume": 0.40,
                "dips": BED_DIPS,
                "note": "Cama nueva de Flow Music (Lyria 3.5, 112 BPM, "
                        "ventana 8-98 s de la pista, scan PASS). Stem a "
                        "nivel nativo + dips horneados (SIN loudnorm: "
                        "caería en modo dinámico y comprimiría los dips); "
                        "el nivel se calibra con --music-volume 0,40 en "
                        "la mezcla. Respaldo: documentary-flow-a."},
        "mix": {"voice_track": "audio/voice-placed.wav",
                "out": "audio/mix.wav",
                "target_lufs": -14.5, "target_tp": -1.5},
        "panel_audio": {"note": "El audio del panel va EN LA COMPOSICIÓN "
                        "(OffthreadVideo), NO en la mezcla. Segmentos "
                        "pre-normalizados a -16 LUFS / TP -2 en "
                        "video/panel-t1.mp4, panel-t2.mp4, panel-t3.mp4."},
        "notes": [
            "Tiempos de palabra: faster-whisper small (L1: "
            "l1-words-small.json; L2–L8: vo-transcription-small.json).",
            "Los captions de src/captions.ts son PRE-alineación: correr "
            "align-captions.py contra audio/voice-placed.wav antes del "
            "render (Whisper adelanta ~0,2 s los inicios tras pausa).",
            "Terminología: BLOQUEO en la voz del Memorial; «embargo» solo "
            "en la cita L4 y su traducción fiel (nunca en rojo).",
        ],
    }
    with open(os.path.join(PROJ, "research/timeline.json"), "w") as f:
        json.dump(timeline, f, indent=2, ensure_ascii=False)
    with open(os.path.join(PROJ, "research/captions-raw.json"), "w") as f:
        json.dump(flat, f, indent=1, ensure_ascii=False)

    os.makedirs(os.path.join(PROJ, "src"), exist_ok=True)
    ts = ("// Auto-generated by scripts/build-timeline.py (VO real de "
          "Adriana, faster-whisper small). PRE-alineación: correr "
          "align-captions.py contra audio/voice-placed.wav antes del render.\n"
          "// Palabra clave (kw) en rojo #ED1C24. En L4 en rojo va "
          "«sigue vigente hoy», NUNCA «embargo».\n"
          "export type CapWord = {t: string; s: number; e: number; "
          "kw: boolean};\n"
          "export type CapChunk = {start: number; end: number; "
          "words: CapWord[]};\n"
          "export type CapSegment = {id: number; start: number; "
          "frames: number; chunks: CapChunk[]};\n"
          "export const CAPTIONS: CapSegment[] = "
          + json.dumps(segments, ensure_ascii=False) + ";\n")
    with open(os.path.join(PROJ, "src/captions.ts"), "w") as f:
        f.write(ts)
    print(f"timeline.json: {len(SCENES)} escenas, {len(sfx)} SFX, "
          f"{len(flat)} palabras de karaoke")
    print(f"captions.ts: {len(segments)} segmentos")
    for n in range(1, 9):
        p = vo_place[f"L{n}"]
        print(f"  L{n}: habla {p['speech_start_s']:.2f}–"
              f"{p['speech_end_s']:.2f}s, adelay {p['adelay_s']:.2f}s")


if __name__ == "__main__":
    main()
