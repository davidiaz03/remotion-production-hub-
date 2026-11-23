# Especificación de música — libreto-pagina-62mil
## 3 camas Flow de la misma familia para «La página que engañó a 62.000 personas»

- **Fecha:** 23-nov-2026
- **Método de video largo del hub:** 3 camas de la misma familia (un solo carácter sonoro, tres estados emocionales), cama 20–24 dB bajo la VO, crossfades de 3 s entre camas. La cama cubre la DURACIÓN DEL VIDEO (totalFrames/fps), no la de la VO.
- **Generación:** la hace el PADRE en Flow Music (flowmusic.app, cuenta izquierdodavid528@gmail.com, Tier Plus, perfil «vortexPixel»). Acceso: pulsar «Acceder con Google» (entra automático). NO pedir credenciales. **Esta tarea NO genera música.**
- **Regla permanente:** toda cama generada se escanea con `scan-bed.py` (Whisper+VAD) antes de usarse; la ventana se elige con `select-bed-window.py`, nunca a mano. FAIL = otra ventana u otra pista. Importar con `bed-import.py --in <pista> --id <id> --duration 60` y registrar en `assets/music/beds/registry.json`.
- **Referencia de sonido:** la cama del Short de Messi (`libreto-messi-desmentido`, Lyria 3.5, 115 BPM, 1:53) es la identidad sonora de El Libreto. Las 3 camas del largo deben sonar de la MISMA FAMILIA que esa (documental, tensa sin ser oscura, con pulso discreto), pero NO son la misma pista: el largo necesita arco emocional (intriga → tensión → resolución) y la cama del Short es una sola pieza de 60 s.
- **Coherencia con las referencias:** AIR (sep-2026) fija secciones tranquilas/narrativas a −20/−25 dB bajo la voz y 60–80 BPM, y secuencias energéticas a −8/−12 dB y 100–120 BPM. El video-ensayo fija la cama a 24–28 LU bajo la VO, con el ánimo por capítulo y bajada para la revelación. Nuestro método (20–24 dB bajo la VO) está dentro de ambos rangos.

---

## Las 3 camas

### Cama 1 — `libreto-largo-intriga` (Acto 0, 0:00–2:00)

| Campo | Valor |
|---|---|
| **Uso** | Cold open + caso Messi. La intriga: algo desapareció y hay que reconstruirlo |
| **Estilo (prompt para Flow)** | Documental investigativo, minimalista, piano grave + pad oscuro + pulso de bajo muy discreto. Tenso sin ser oscuro. Sin voces, sin melodía cantable, sin percusión marcada |
| **BPM objetivo** | 60–70 |
| **Ánimo** | Intriga contenida, curiosidad, algo no encaja |
| **Volumen en mezcla** | 20–22 dB bajo la VO (el tramo más bajo: el cold open necesita aire) |
| **Duración de la pista** | 90–120 s (la ventana de 60 s se extrae con `select-bed-window.py`) |
| **Entrada** | Desde 0:00 (ColdFusion: música desde el primer fotograma), a volumen bajo |
| **Salida** | Crossfade de 3 s a la cama 2 al entrar el Acto 1 (~2:00) |

### Cama 2 — `libreto-largo-investigacion` (Actos 1–2, 2:00–8:30)

| Campo | Valor |
|---|---|
| **Uso** | La fábrica + la escalada. La investigación avanza y la tensión sube |
| **Estilo (prompt para Flow)** | Misma familia que la cama 1 (mismo carácter documental, mismo tipo de instrumentación), con más pulso: bajo con movimiento + arpegio sutil + pad. Crece sin explotar. Sin voces, sin percusión marcada |
| **BPM objetivo** | 70–85 (ligeramente más rápido que la cama 1: el pulso sube con la investigación) |
| **Ánimo** | Investigación en marcha, tensión creciente, cada caso es un paso más |
| **Volumen en mezcla** | 20–22 dB bajo la VO; en los bloques de revelación (Cienfuegos, Valdez Galloso) la cama se CORTA 0,5 s antes y vuelve después (el silencio es el golpe) |
| **Duración de la pista** | 120–180 s (es el tramo más largo: 6:30 min; la ventana de 60 s se buclea con `bed-loop.py` o se importan 2 ventanas de la misma pista) |
| **Entrada** | Crossfade de 3 s desde la cama 1 (~2:00) |
| **Salida** | Crossfade de 3 s a la cama 3 al entrar el Acto 3 (~8:30) |

### Cama 3 — `libreto-largo-resolucion` (Acto 3, 8:30–10:30)

| Campo | Valor |
|---|---|
| **Uso** | El método + las 3 comprobaciones + el cierre honesto |
| **Estilo (prompt para Flow)** | Misma familia, vuelta a la calma: piano claro + pad luminoso + pulso mínimo. Resolución sin triunfalismo (el cierre es honesto, no victorioso: la fórmula sigue viva). Sin voces |
| **BPM objetivo** | 60–70 (vuelta al pulso del inicio: el video respira al final) |
| **Ánimo** | Claridad, resolución, herramienta en la mano del espectador |
| **Volumen en mezcla** | 22–24 dB bajo la VO (el tramo más bajo: las comprobaciones se escuchan con atención); **silencio total** en «No sabemos por qué desapareció, y no vamos a inventarlo» (la música vuelve suave para el CTA) |
| **Duración de la pista** | 90–120 s |
| **Entrada** | Crossfade de 3 s desde la cama 2 (~8:30) |
| **Salida** | La cama termina con el video (cubre hasta el final del end screen, no solo hasta el final de la VO) |

---

## Mapa de música por acto (resumen)

| Acto | Tiempo | Cama | BPM | dB bajo VO | Momentos de silencio |
|---|---|---|---|---|---|
| 0. La página que ya no existe | 0:00–2:00 | `libreto-largo-intriga` | 60–70 | 20–22 | — |
| 1. La fábrica | 2:00–5:00 | `libreto-largo-investigacion` | 70–85 | 20–22 | En «Si este video dijera que Musk nunca ha dicho nada sobre Cuba, estaría mintiendo» |
| 2. Cuando el bulo sale del feed | 5:00–8:30 | `libreto-largo-investigacion` (misma) | 70–85 | 20–22 | 0,5 s antes de «una institución del Estado lo publicó como cierto» y de «Falso. El juicio ni siquiera había empezado» |
| 3. Por qué funciona | 8:30–10:30 | `libreto-largo-resolucion` | 60–70 | 22–24 | En «No sabemos por qué desapareció, y no vamos a inventarlo» |

**Crossfades:** 3,0 s entre camas (pipeline `music.xfade`). **Ducking en la mezcla:** ratio 5:1, threshold 0,08, release 180 ms (pipeline `mix`). **Loudness objetivo del máster:** −14,5 LUFS (pipeline `mix.targetLufs`); camas a −16 LUFS (pipeline `music.targetLufs`).

---

## Prompts sugeridos para Flow Music (copiar y adaptar)

> **Cama 1 (intriga):** «Documentary underscore, investigative, minimalist. Low piano, dark pad, very subtle bass pulse. Tense but not dark. No vocals, no drums, no melody. 60 BPM. Instrumental.»
>
> **Cama 2 (investigación):** «Documentary underscore, investigative, same family as a low-piano dark-pad cue, with more pulse: moving bass, subtle arpeggio, pad. Growing tension, never explosive. No vocals, no drums. 75 BPM. Instrumental.»
>
> **Cama 3 (resolución):** «Documentary underscore, calm resolution, clear piano, luminous pad, minimal pulse. Clarity and closure without triumph. No vocals, no drums. 65 BPM. Instrumental.»

**Después de generar cada pista:** `scan-bed.py` (PASS obligatorio) → `select-bed-window.py --duration 60` → `bed-import.py --in <pista> --id <id> --duration 60` → verificar en `registry.json` → actualizar `pipeline.json` (los ids ya están puestos como placeholders: `libreto-largo-intriga`, `libreto-largo-investigacion`, `libreto-largo-resolucion`).

**Términos de Flow Music (verificado 23-nov-2026):** la música generada se puede usar en los videos de El Libreto; los términos prohíben presentar la música como creada por un humano, no obligan a etiquetar el video como IA por llevar una cama instrumental (Meta solo exige la etiqueta para video fotorrealista o audio que suene real; YouTube solo si la música fuera el foco del video). La decisión de etiquetar es editorial, no de cumplimiento.
