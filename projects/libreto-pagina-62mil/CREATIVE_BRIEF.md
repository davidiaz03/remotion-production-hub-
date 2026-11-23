# CREATIVE_BRIEF — libreto-pagina-62mil
## «La página que engañó a 62.000 personas» — El Libreto, video largo (~10:30)

- **Fecha de creación:** 23-nov-2026 (preproducción)
- **Estado:** ESQUELETO. Guion pendiente de la revisión del usuario. Voz (~10 min) NO grabada. Capturas F1–F14 pendientes. Camas de música SIN generar. NO renderizar nada hasta tener VO + capturas + camas.
- **Dossier R31:** `~/workspace/marketing/research/dossiers/messi-patron-largo/dossier.md`
- **Guion:** `~/workspace/marketing/research/dossiers/messi-patron-largo/guion-borrador.md` (1.493 palabras, 4 actos, ~10:39 a 140 ppm)
- **Referencias de edición:** `~/workspace/marketing/research/dossiers/messi-patron-largo/referencias-edicion-largo.md`
- **Plan de recursos:** `~/workspace/marketing/research/dossiers/messi-patron-largo/plan-recursos.md`

---

## 1. Concepto

**La historia:** una página de Facebook con 770.000 seguidores usaba el nombre del cantante fallecido El Taiger para publicar citas falsas e imágenes con IA sobre Cuba. El caso más viral fue un mensaje falso atribuido a Messi (62.000 reacciones, marzo de 2026). La página siguió con Bukele, Musk, Daddy Yankee, Bad Bunny, Bebeshito, un bulo de Ronaldo que republicó una institución del Estado y una condena inventada. Y el 23 de noviembre de 2026, cuando fuimos a buscarla para este video, **la página ya no estaba disponible**.

**El enfoque (aprobado por el usuario, 23-nov-2026):** la desaparición es el gancho y el cierre. El video abre con el hecho de que la página ya no existe y reconstruye el patrón completo. El título es «La página que engañó a 62.000 personas».

**El género:** documental de investigación en formato video-ensayo, al estilo Fern/LEMMiNO (documentos en pantalla, ritmo contenido, cierre honesto) con la estructura de Johnny Harris (evidencia visual antes que contexto, pregunta → informe) y el ritmo progresivo de Veritasium (apretado al principio, ancho después). Sin rostro, sin presentador en cámara: la voz del usuario + el documento en pantalla son los protagonistas.

**Lo que este video NO es:** no es un Short estirado (el ritmo de cambio cada 2 s no se transfiere); no es un video de opinión (cada afirmación lleva su fuente en pantalla); no es un ataque a El Taiger ni a sus fans (la página usaba su nombre; el contenido no tenía nada que ver con él).

---

## 2. Estructura (4 actos = 4 capítulos de YouTube)

| Acto | Tiempo | Palabras | Función | Visual dominante |
|---|---|---|---|---|
| 0. La página que ya no existe | 0:00–2:00 | 223 | Gancho con la desaparición + el caso Messi completo | URL caída, post falso, comparación de fotos, Casa Blanca |
| 1. La fábrica | 2:00–5:00 | 491 | La página, la fórmula en 4 pasos, la ráfaga de marzo | Artículos de elTOQUE, tabla de crecimiento, diagrama, trío de posts, tuit de Musk |
| 2. Cuando el bulo sale del feed | 5:00–8:30 | 436 | La escalada: personas reales, una institución, una condena inventada | Cuballama (Bebeshito, Cienfuegos, juicio), elTOQUE 24-jun |
| 3. Por qué funciona y cómo detectarlo | 8:30–10:30 | 343 | El método + 3 comprobaciones + cierre honesto | Búsqueda inversa, checklist, lupa Gemini, línea de tiempo completa |

**Capítulos de YouTube** en `chapters.json` (el pipeline los genera con `scripts/chapters.mjs`; primer capítulo en 0:00, ≥10 s entre capítulos).

---

## 3. Decisiones creativas (con su fuente)

1. **Cold open con evidencia, sin preámbulos** (Harris, Veritasium, Playbook: 9/10 grandes canales empiezan en mitad del mundo). Primer fotograma: la URL caída. La tarjeta de título entra después del gancho (~0:40).
2. **Evidencia visual antes que contexto** (Harris: «visual evidence, then context»). Cada caso se MUESTRA antes de explicarse.
3. **Ritmo progresivo** (AIR: top 25% por AVD retiene 20–30% más): cambio cada 8–12 s en el Acto 1, 12–20 s en el Acto 2, 15–25 s en el Acto 3, tranquilo + ráfagas en el Acto 4. Ningún plano fijo más de 40 s sin movimiento interno.
4. **Documentos como infraestructura narrativa** (Fern: línea citada resaltada mientras el narrador la lee; Harris: años y cifras como rótulos animados que segmentan). La línea de tiempo del patrón reaparece en cada acto.
5. **Re-ganchos programados cada ~2 min** (AIR; Harris: cada respuesta es un cliffhanger): las preguntas del guion van como tarjetas de pregunta a pantalla completa.
6. **Música como estructura** (AIR; Fern; método de largo del hub): 3 camas Flow de la misma familia, una por estado emocional, crossfades de 3 s, 20–24 dB bajo la VO, silencio antes de las 3 revelaciones. Ver `music-spec.md`.
7. **Cierre honesto sin resolver** (LEMMiNO: «theories adjudicated → honest unresolved landing»): «No sabemos por qué desapareció, y no vamos a inventarlo». Fotograma final útil (línea de tiempo completa) bajo el end screen; el logo animado va después.
8. **El bulo nunca domina la pantalla**: proporción a favor del documento (en el P1 era 1:1,5 a favor de la prueba; en el largo, cada bulo se muestra 2–4 s y la prueba ocupa el resto del bloque).

---

## 4. Reglas duras (del dossier §8 + marca El Libreto)

- **NUNCA decir que Meta eliminó la página**: el motivo de la desaparición NO está verificado. Decir «ya no está disponible» / «desapareció».
- **Matiz Musk obligatorio**: Musk SÍ tuiteó sobre Starlink en Cuba el 16-mar-2026 («Works in Cuba, just can't be sold there»); lo falso son las declaraciones políticas atribuidas.
- **No nombrar al presunto administrador.** No atacar la memoria de El Taiger ni a sus fans. No culpar a los que compartieron.
- **No usar la cifra de 700.000 seguidores de mayo** (inconsistente). Última cifra con fuente: 770.000+ (CubaBajoLupa, 4-jul-2026).
- **No mezclar el bulo de Bukele de República Dominicana** (MIREX, oct-2026) con el caso Bukele de esta página (mar-2026).
- **Nunca imágenes generadas por IA de personas reales en situaciones fabricadas.** La IA solo para tratamiento gráfico/animación con propósito.
- **Fotos de la Casa Blanca TAL CUAL**, sin recortar dentro de ellas (condiciones de la Oficina de Fotografía). Sin gráficos sobre caras.
- **Píldora de fuente en cada documento** (mínimo 24 px a 1080p). Marca de agua lockup desde el fotograma 0 (arriba-izquierda en vertical; en horizontal 16:9, abajo-izquierda — ver plan-edicion.md).
- **Paleta:** Papel #F5F1E8, Tinta #1A1A2E, Lápiz rojo #C0392B, Resaltador #FFD60A, Azul oficial #1F4E79. Subtítulos Noto Sans Bold, karaoke 1–6 palabras/pantalla, tercio inferior.

---

## 5. Estado de los materiales (23-nov-2026)

| Material | Estado |
|---|---|
| Dossier R31 (9 casos VERIFICADO) | ✅ Listo |
| Guion borrador (1.493 palabras) | ⏳ Pendiente de la revisión del usuario |
| Recursos P1 (15 usables) | ✅ En disco, sha256 verificados (`asset-manifest.json`) |
| Capturas F1–F14 | ❌ Pendientes (las hace el padre; ver `plan-recursos.md`) |
| Cortes C1–C3 del video completo de la Casa Blanca | ⏳ Disponibles sin cortar (en `~/workspace/.tmp/whitehouse-inter-miami/`) |
| B-roll adicional de dominio público (B1–B6) | ❌ Pendiente de búsqueda |
| Voz del usuario (~10 min) | ❌ NO grabada |
| Camas Flow (3, misma familia) | ❌ SIN generar (ver `music-spec.md`) |
| Componentes Remotion document-* | ❌ Por construir en `src/components/` |
| Timeline / captions / mezcla / render | ❌ Bloqueados hasta tener VO + capturas + camas |

---

## 6. Plan técnico (orquestador v2)

- **Orquestador:** `node scripts/pipeline.mjs libreto-pagina-62mil` (13 pasos, reanudable). NO correr hasta tener VO + camas + capturas.
- **Formato:** 1920×1080, 30 fps, CRF 19. Tramos de 900 f (contenido estático/documental), vídeo-solo + mezcla en el máster, PCM-16 (nunca AAC por tramos: agujeros de 34–55 ms por frontera).
- **VO real:** el paso `vo` del pipeline (Kokoro) se SALTA. La VO grabada va a `research/vo/`, se mejora con `enhance-voice.py` (preset pro/clean), se transcribe para `vo-captions.json`, y el paso `align` re-temporiza los captions desde los onsets acústicos (sin él, el karaoke se adelanta tras las pausas, mediana −0,21 s).
- **Pre-vuelo visual OBLIGATORIO** antes del render (`visual-preflight.py --stills`): caza la legibilidad de la marca de agua de Gemini (pendiente P3) y cualquier texto recortado o sobre cara.
- **Auditoría de audio OBLIGATORIA** antes de entregar (`audit-audio.py`): FAIL = no entregar.
- **Camas:** cada cama generada se escanea con `scan-bed.py` (Whisper+VAD) antes de usarse; ventana elegida con `select-bed-window.py`, nunca a mano. Identidad de cama: `timeline.json` bed.id = fuente única; `run-mix.py` rechaza la mezcla si el stem no coincide (NCC ≥0,99).
- **Capítulos:** `scripts/chapters.mjs libreto-pagina-62mil` genera el .txt de YouTube + .json.
- **Estimación (tasas del smoke 21-nov):** máster 0,66x, VO real (sin TTS) 0, QA 0,34x + auditoría 0,3x, render 0,08 s/f. Con `pipeline.mjs --estimate` antes de correr.

---

## 7. Siguiente acción

1. El usuario revisa el guion (`guion-borrador.md`).
2. El padre hace las capturas F1–F14 (prioridad: F11/F12, F1, F2, F5, F7).
3. El usuario graba la voz (~10 min, 4 actos).
4. El padre genera las 3 camas en Flow Music (ver `music-spec.md`) y las importa con `bed-import.py`.
5. Construir los componentes `document-*` en `src/components/` + la timeline desde la VO real.
6. Pre-vuelo → render → máster → QA → auditoría → entrega (ligera + máster).
