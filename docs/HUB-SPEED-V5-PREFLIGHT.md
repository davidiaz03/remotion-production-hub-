# Pre-vuelo visual automático (hub-speed-v5)

**Rama:** `work/hub-speed-v5-preflight` · **Pieza:** `scripts/visual-preflight.py`
(+ `scripts/test_visual_preflight.py`, 25 tests) ·
**Manifiesto de ejemplo:** `tests/fixtures/preflight-scenes-marti-fidel.json`

## El problema

En la V4.1 de marti-fidel, tres errores de composición solo se vieron
DESPUÉS del render completo (~14 min de tramos + máster):

- **f020** — arranque de S5 con ~80% de papel vacío ~1 s (fotograma muerto).
- **f016** — punto rojo de «EN VIVO» recortado en el borde izquierdo.
- **f011** — retrato oval tapando la «L» de «LA REVISTA ILUSTRADA».

La V5 los corrigió, pero tarde: cada corrección costaba otro render
completo. El pre-vuelo mueve la detección ANTES del render: 1 still por
escena con `remotion still` + chequeos automáticos por píxeles. Reporta
SOLO los fotogramas con flags; el humano lee esos + una muestra de un
fotograma limpio por escena.

## Uso

```bash
# 1 still por escena ANTES del render completo (usa el candado
# compartido /tmp/hub-speed-v5-render.lock; ver «Candado» abajo):
~/workspace/remotion-hub/.venv/bin/python scripts/visual-preflight.py \
    --stills --project marti-fidel \
    --manifest tests/fixtures/preflight-scenes-marti-fidel.json \
    --logo-ref <fotograma-con-logo.jpg>

# Fotogramas ya extraídos (validación / auditoría post-render):
~/workspace/remotion-hub/.venv/bin/python scripts/visual-preflight.py \
    --frames-dir projects/marti-fidel/out/frames-v41 \
    --manifest tests/fixtures/preflight-scenes-marti-fidel.json \
    --logo-ref projects/marti-fidel/out/frames-v41/f001.jpg \
    --out preflight.json
```

Códigos de salida: **0** = sin flags bloqueantes (los avisos no frenan
el render), **1** = hay flags bloqueantes, **2** = error de uso/entorno.

### Manifiesto de escenas

Cada proyecto declara sus escenas en un JSON (el de marti-fidel vive en
`tests/fixtures/` como ejemplo; en uso normal va en el proyecto):

```json
{"project": "marti-fidel", "fps": 30,
 "scenes": [{"name": "S1", "start": 0, "end": 166},
            {"name": "S4", "start": 382, "end": 561, "frame": 471}],
 "logo_skip_scenes": ["STING"]}
```

- `frame` es opcional: por defecto, el punto medio de `[start, end]`.
  Fijarlo sirve para evitar fundidos de entrada (el punto de «EN VIVO»
  es indetectable a medio fundido en f014–f015; el punto medio de S4
  lo caza).
- `logo_skip_scenes`: escenas donde el logo ES la escena (sting a
  pantalla completa) y el chequeo de logo en zona no aplica.
- En modo `--frames-dir`, cada `fNNN.jpg` se asigna a la escena que
  contiene el fotograma `(NNN-1)*fps`.

### Candado compartido

El modo `--stills` renderiza (trabajo pesado): adquiere el candado
`/tmp/hub-speed-v5-render.lock` (mkdir atómico, espera pasiva) y lo
libera al terminar, igual que los demás agentes de hub-speed-v5. El
análisis de imágenes ya extraídas no necesita candado.

## Chequeos

| Chequeo | Severidad | Método (umbrales calibrados sobre frames-v41) |
|---|---|---|
| `dead-frame` | AVISO | Fracción de celdas vacías en rejilla 6×10 ≥ 0,70 (celda vacía: std luminancia < 8 y densidad de bordes Canny < 0,005). Detecta la CONDICIÓN (fotograma casi vacío); que sea defecto o pausa intencional lo decide el humano. |
| `edge-clipped` | AVISO | (a) Fragmento rojizo compacto (30–400 px, lados ≥ 8, aspecto ≤ 2, relleno < 0,9, S > 60) en la banda superior junto al borde izquierdo/derecho, sobre fondo oscuro (mediana del anillo < 80: el papel claro con motas rojizas queda excluido). (b) Componente brillante (30–2000 px) que TOCA el borde con contraste ≥ 40 respecto a su entorno. La zona del logo se excluye en ambos. |
| `text-on-face` | BLOQUEANTE | Caras YuNet (mismo modelo/escalas/umbrales que `memes/scripts/face-frame.py`, solo score ≥ 0,6; ver «Caras») + blobs de texto brillante/rojo nítidos (gradiente medio en el borde ≥ 150) agrupados en líneas de ≥ 3 letras, con solape > 30% del blob sobre la cara (+25% de barbilla). |
| `duplicate` | BLOQUEANTE ≤ 6 / AVISO 7–12 | pHash DCT 8×8 entre escenas DISTINTAS (Hamming). Los fotogramas consecutivos de la misma escena son casi idénticos por naturaleza y no se comparan. |
| `logo-missing` | BLOQUEANTE | Plantilla-máscara del logo construida desde `--logo-ref` (píxeles brillantes en la zona). Score = fracción de píxeles de la máscara > fondo local + 15 (la mediana local hace el chequeo robusto a logos atenuados por el etalonaje). Umbral 0,5. Sin `--logo-ref`, el chequeo se omite. |

### Caras: reutilización del ecosistema de memes

La detección es **YuNet vía `cv2.FaceDetectorYN`**, mismo modelo
(`face_detection_yunet_2023mar.onnx`), mismas escalas (1,0/0,5/0,33) y
misma escalera de umbrales (0,6/0,4/0,3) que
`memes/scripts/face-frame.py` (rama `work/meme-ecosystem-2026-11-18`).
La función está vendorizada en `visual-preflight.py` con una diferencia
documentada: expone los scores y el pre-vuelo **solo acepta score
≥ 0,6** (primer peldaño). Motivo medido: con el coste asimétrico del
pre-vuelo, una cara alucinada genera falsos positivos en cascada
(bandera de Trinidad en f003, score 0,31; estrella del logo en
f020–f026, 0,53; palmeras en f067–f068, 0,31–0,49), mientras que las
protagonistas reales puntúan 0,91–0,93 y las únicas caras que se
pierden son de 11–14 px en una multitud. Además se descartan cajas con
el centro en la zona del logo y cajas enormes (> 25% del alto) de
score bajo.

## Validación sobre los fotogramas V4.1 (69 fotogramas, f001–f069)

Verdad de referencia: la auditoría visual humana de V4.1
(`reports/adjudicacion-auditoria-v41.md`, dos auditores independientes).

### Resultado del pre-vuelo

```
PRE-VUELO VISUAL — 69 fotograma(s), 12 escena(s)
BLOQUEANTES: 0 fotograma(s) · AVISOS: 9 fotograma(s) · limpios: 60
  f016–f019 [S4] AVISO edge-clipped (punto de «EN VIVO»)
  f020 [S5]      AVISO dead-frame (87% vacío)
  f054–f057 [S9] AVISO dead-frame (85/78/78/72% vacío)
```

El humano lee **9 fotogramas con flags + 12 de muestra** (1 limpio por
escena) en vez de 69: un 70% menos de lectura.

### Precisión / recall (honestos, dos niveles)

**Nivel condición** (¿el flag describe una condición real de píxeles?):
9 flags, los 9 reales → **precisión 9/9 = 100%**. Condiciones
detectables presentes: 9 → **recall 9/9 = 100%**.

**Nivel defecto** (¿el flag señala un problema real según la auditoría
humana?):

| | Fotogramas |
|---|---|
| Verdaderos positivos | f020 (muerto), f016–f019 (punto) = **5** |
| Falsos positivos | f054–f057 (S9 tesis: vacío intencional, pausa de la tesis) = **4** |
| Falsos negativos | f011–f013 (masthead tapado), f036 (mapa tapa la cara de Fidel 1 f), f014–f015 (punto a medio fundido, demasiado tenue) = **6** |

- **Precisión (defecto): 5/9 = 56%.** Los 4 FP son la pausa de la
  tesis: el chequeo detecta «fotograma casi vacío» y el humano
  confirma que es intencional. Es el comportamiento diseñado (AVISO,
  no bloqueante).
- **Recall (defecto, por fotograma): 5/11 = 45%.** Por defecto
  distinto (4: muerto S5, punto S4, masthead S3, mapa-cara f036):
  **2/4 = 50%**.
- **Verdaderos negativos confirmados:** 0 duplicados entre escenas
  (mínimo Hamming entre escenas = 16, umbral 12), logo presente en
  f001–f068 (scores 0,99–1,00; f069 es el sting y se excluye por
  manifiesto), 0 casos de texto sobre cara. La V4.1 no tenía esos
  defectos y el pre-vuelo no los inventa.

### Controles sintéticos (los chequeos cazan lo que deben cazar)

| Control | Resultado |
|---|---|
| Logo borrado de f001 (zona pintada con el fondo) | BLOQ `logo-missing`, score 0,00, salida 1 |
| «TEXTO» con contorno pegado sobre la cara de Fidel (f037) | BLOQ `text-on-face`, 5 letras, salida 1 |
| f001 copiada como f037 (otra escena) | BLOQ `duplicate`, Hamming 0, salida 1 |
| f001 regradada (+5% brillo, JPEG q70) como f059 | BLOQ `duplicate`, Hamming 2, salida 1 |

### Suite de tests

`scripts/test_visual_preflight.py`: **25 tests, todos OK** (20 sintéticos
+ 5 de integración sobre frames reales V4.1; la integración se salta si
los fotogramas no están, como en `test_microcut.py`).

```bash
~/workspace/remotion-hub/.venv/bin/python -m unittest scripts.test_visual_preflight -v
```

## Límites honestos / PENDIENTE

1. **Masthead tapado (f011–f013): NO DETECTABLE por píxeles.**
   Es layout relativo entre dos elementos (el retrato oval cubre la
   «L» de «LA REVISTA ILUSTRADA»). Detectarlo requeriría OCR del
   masthead + geometría de elementos declarada en el TSX. Queda
   PENDIENTE con este motivo; no se finge.
2. **Cara tapada por otro elemento 1 fotograma (f036): NO DETECTABLE.**
   YuNet no ve una cara tapada y el mapa no es texto. PENDIENTE:
   consistencia temporal (cara presente en los stills vecinos y
   ausente en este) — solo viable con > 1 still por escena.
3. **Punto a medio fundido (f014–f015):** demasiado tenue para el
   umbral rojo. Mitigado: el still se toma en el punto medio de la
   escena, no en el fundido.
4. **Texto sobre cara con solape total:** si el texto cubre gran parte
   de la cara, YuNet puede dejar de verla (el defecto se esconde del
   detector). El control sintético («TEXTO» sobre media cara) sí se
   caza (YuNet 0,89); el caso extremo queda como límite conocido.
5. **El chequeo de borde rojo solo dispara sobre fondo oscuro**
   (anillo < 80): sobre papel claro, las motas rojizas son
   indistinguibles de un punto tenue. Un badge recortado sobre fondo
   claro no se detectaría.
6. **El still es 1 fotograma por escena:** defectos de 1 fotograma en
   transiciones (f036) o que solo existen en otro instante de la
   escena pueden escaparse. El manifiesto permite fijar `frame` por
   escena; muestrear 2 stills por escena (inicio + medio) queda como
   mejora futura.

## Integración con el render (puerta propuesta)

El pre-vuelo es la puerta ANTES de `render-chunks.mjs`:

```
editar TSX → visual-preflight.py --stills (1 still/escena, ~3-4 min
   para 12 escenas, medido abajo)
   → BLOQ? corregir layout, repetir
   → limpio → render-chunks.mjs (render completo)
```

El cableado en `render-chunks.mjs` (llamar al pre-vuelo o exigir su
informe) lo decide el coordinador al fusionar, para no chocar con la
pieza de render (rama `work/hub-speed-v5-render`). Este script ya
devuelve el código de salida que la puerta necesita (1 = bloqueante).

## Coste y ahorro

- Análisis de 69 fotogramas: ~4 min de reloj bajo carga (78 s de CPU;
  YuNet domina, ~1,1 s/fotograma). Para 12 stills: ~15–20 s de CPU.
- Render de stills (3 escenas S1/S4/S5, V5, con `--bundle-cache`):
  **~64 s de reloj** para los 3 stills + análisis (el primer still
  carga el bundle de webpack; los siguientes lo reutilizan). Total
  de la corrida: 9m24s, de los que ~8m20s fueron espera del candado
  compartido (un hermano renderizaba). Extrapolación para 12 escenas:
  **~3–4 min** (estimación: 1 bundle + 12 stills a ~10–15 s).
- Ahorro por error cazado: un render completo son ~14 min de tramos +
  máster; el pre-vuelo lo sustituye por ~3–4 min. **~10 min ahorrados
  por cada error cazado antes del render**, más la lectura humana
  reducida de 69 a 21 fotogramas (9 flags + 12 de muestra). En V4.1
  habría cazado 2 de los 3 defectos que motivaron la V5 (muerto S5,
  punto S4) antes del primer render.

## Modo stills — verificación (21-nov-2026, VERIFICADO)

Corrida end-to-end con candado compartido desde el worktree principal
(`--repo-root`, sin tocarlo: solo lectura + stills a `/tmp`):

- 3 stills renderizados (S1 f83, S4 f471, S5 f664, composición
  `MainReelV5`): `S1.jpg` 98 KB, `S4.jpg` 113 KB, `S5.jpg` 330 KB,
  1080×1920. El candado se adquirió y liberó correctamente (un hermano
  lo retomó 1 s después de liberarlo).
- Pre-vuelo sobre los 3 stills V5: **0 flags, salida 0** (correcto:
  la V5 corrigió los defectos — S5 muestra las palmas crecidas desde
  el fotograma 1, `grid_empty` 0,20; el badge «EN VIVO» se movió a
  arriba-derecha con el punto entero y visible; logo 0,99–1,00 en los
  tres).
- La plantilla-máscara del logo se construyó desde f001 (V4.1) y
  funciona sobre stills V5 (misma posición/tamaño de logo).

## Texto exacto a añadir a repo/AGENTS.md

(El coordinador lo integra al fusionar para evitar conflictos.)

```markdown
## Pre-vuelo visual — obligatorio antes del render completo (21-nov-2026, hub-speed-v5)
**Ningún reel se renderiza entero sin pasar `scripts/visual-preflight.py
--stills`.** En la V4.1 de marti-fidel, el fotograma muerto de S5 (f020)
y el punto de «EN VIVO» recortado (f016) solo se vieron DESPUÉS de ~14
min de render + máster; el pre-vuelo los caza en 1 still por escena
antes de renderizar. Chequeos: fotograma muerto (AVISO), elemento
recortado por el borde (AVISO), texto sobre cara (BLOQUEANTE), imagen
duplicada entre escenas (BLOQUEANTE), logotipo ausente (BLOQUEANTE).
Salida 1 = hay bloqueantes: corregir el layout y repetir el pre-vuelo.
El manifiesto de escenas vive en el proyecto (`preflight-scenes.json`).
Límites conocidos (ver docs/HUB-SPEED-V5-PREFLIGHT.md): el masthead
tapado de f011 (layout relativo entre dos elementos) NO lo detecta
ningún chequeo por píxeles — la revisión humana de los flags + 1
fotograma limpio por escena sigue siendo obligatoria.
```
