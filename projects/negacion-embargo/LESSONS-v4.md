# Repaso de lecciones — «Dicen que no hay bloqueo» (v4)

**Fecha de producción:** domingo 22-nov-2026.
**Proyecto:** `projects/negacion-embargo/`, rama `work/preprod-2026-11-21`.
**Alcance del repaso:** de la aprobación de Suleris (~11:47) a la entrega v4 (~19:45).
**Objetivo:** recortar el tiempo de producción sin bajar la calidad, con la meta de
un reel diario y contenido para YouTube 3–4 veces por semana.
**Estado:** informe de análisis. NINGUNA propuesta está aplicada todavía; las
decisiones las toma el usuario.

**Convención horaria:** todas las horas son de La Habana (UTC−4). Los commits de la
mañana quedaron registrados en −04:00 y los de la tarde en +00:00; `STATE.json` y
los mtimes de archivo están en UTC. Todo se convirtió a La Habana para este informe.

---

## 0. Resumen ejecutivo

| Medida | Valor (verificado) |
|---|---|
| Pack redactado → entrega v4 | **9 h 08 min** (10:37 → 19:45) |
| Aprobación Suleris → entrega v4 | **7 h 58 min** (11:47 → 19:45) |
| Orden de montar → entrega v4 | **7 h 09 min** (12:36 → 19:45) |
| Camino crítico limpio (sin re-trabajo) | ≈ **4 h 05 min** |
| Re-trabajo evitable | ≈ **3 h 40 min** (~46 % del total desde la aprobación) |
| Renders completos | 3 (v2 abortado, v3, v4) + 2 borradores 540p |
| Mezclas construidas | 5 (temporal, final, v2, v3, v4) |
| Auditorías completas | 2 (v3 FAIL 119, v4 0 FAIL) + 2 pre-auditorías |
| Composición | 102 KB de `MainReel.tsx` escrito a mano, 2 versiones (v2, v3) |

**La tesis en una frase:** el reel no se demoró por el render (19 min) ni por la
mezcla (minutos de cómputo), sino por **rehacer dos veces lo ya hecho**: una
recomposición completa v2→v3 (2 h) y un ciclo de auditoría v3 (1 h 40 min) del
que el 93 % de los fallos eran artefactos de medición, no defectos reales.

**Meta realista para el próximo reel de complejidad similar:**

| Escenario | Tiempo aprobación → entrega |
|---|---|
| Hoy (sin cambios) | ~8 h |
| Con las propuestas P0 | ~3 h – 3 h 30 min |
| Con P0 + plantillas (P1) | ~2 h 30 min |

El reel diario es factible a ~2 h 30 min–3 h 30 min de pipeline mayormente
desatendido, con el usuario tocando solo tres puntos: aprobación del pack,
revisión del borrador (~15 min) y visto bueno final.

---

## 1. Línea de tiempo verificada (La Habana)

Fuentes: `git log` (con offset), `STATE.json` (milestones), mtimes de archivo,
`HANDOFF.md`, informes de auditoría. Los eventos de usuario (WhatsApp, feedback)
vienen del registro del coordinador.

| Hora | Evento | Evidencia |
|---|---|---|
| 10:37 | Pack «desmontar la negación» redactado y validado (24/24) | `1fb0655` |
| 11:14 | Etapa de investigación previa codificada (dossier + puerta R31) | `8d71c78` |
| 11:15 | Panel de negaciones verificado (4 citas, fuente primaria) | `9820c0e` |
| 11:21 | Estrategia video 1 + guion 125 palabras | `5d9fd21` |
| 11:26 | Texto para Suleris enviado | `fcd4f90` |
| 11:28 | Texto 2ª parte (memorando Mallory) | `6365698` |
| 11:47–11:50 | **Suleris aprueba** («Exelente propuesta»; corrección: BLOQUEO, no «embargo») | WhatsApp |
| 11:53 | Corrección BLOQUEO aplicada al guion | `c3a9aa1` |
| 12:04–12:10 | Guion íntegro para Adriana (solo texto hablado) | `23be3c1`, `3b8726f`, `3344310` |
| 12:12 | Recopilación de recursos completa (546 MB, 4 momentos con video real) | `1e0f782` |
| 12:22 | Auditoría pre-edición COMPLETA (C1–C12, ninguna toca el guion) | `8eca2c4` |
| 12:23 | VO de Adriana recibida (8 archivos .aac) | registro |
| 12:29–12:31 | VO verificada 7/8 + L1 recibida → **VO completa 8/8** | `5e4eeed`, `1af27a9` |
| 12:36 | Suleris confirma el guion corregido; **el usuario ordena montar** | registro |
| 12:49–12:56 | Cama nueva generada en Flow Music (el usuario inicia sesión él mismo) | registro |
| 12:52–12:55 | Timeline, karaoke alineado, ducking, `run-render.sh` + `run-audit.py` | `de50c63`, `e995eaf`, `cf5e2bf` |
| 13:19 | Cama final + mezcla final fixed-gain (−16,2 LUFS) | `3f07907` |
| 13:48 | Puerta QA visual permanente + rejilla de compás (investigación 3) | `e3d747d` |
| ~13:20–14:57 | **Composición v2** + pre-vuelo (70 stills del subagente + 16/16 críticos) | `1cab80d` |
| ~14:40–14:55 | Borrador v2 (540p) entregado al usuario para verlo en movimiento | `out/draft/mainreel-draft-v2.mp4` 18:55Z |
| 15:04 | Re-mezcla v2 (43 SFX) + J-cut L8 | `b139df5` |
| 15:04–15:10 | Render v2 de validación iniciado (2 tramos) — **abortado por el feedback** | STATE.json |
| 15:10 | **Feedback del usuario sobre v2** (7 puntos: Bruno, tarjeta Fox, subtítulo cordón, foto Waltz, disparo, NOAA, subir de nivel) | registro |
| 15:20 | Frame fantasma de Bruno localizado (f465–f468) y corregido; bug de ruta del render diagnosticado | HANDOFF.md |
| 15:27 | 4ª declaración verificada: Waltz 28-oct (reemplaza la tarjeta Fox) | `f2da904` |
| 15:28 | Disparo CC0 verificado y medido (Freesound 844540) | HANDOFF.md |
| 16:02–16:03 | PNG «before» NOAA/CIRA conseguido (el de la 1ª entrada era de otro evento) | registro |
| 15:20–17:10 | **Composición v3** (subagente; T4 28-oct, glitch ×3, morph ×3, shake ×5, NOAA, sándwich fantasma → fallback) | `7844d3e` |
| 17:10–17:24 | Fix «PUNTO.» f400→f423 (el slam caía 0,77 s antes de la palabra) + verificación | `3b170ab` |
| 17:24–17:31 | Re-mezcla v3 (77 SFX, −16,3 LUFS) | `681a901` |
| 17:32 | Usuario aprueba el título del gancho (f9, «Perfecto») → luz verde al render | registro |
| 17:32–17:51 | **Render v3** 16/16 tramos PCM, 2325/2325 fotogramas | STATE.json |
| 17:51–17:53 | MASTER-v3 + LIGERA-v3 generados | mtimes |
| 17:55 | QA técnico v3 PASS (−16,1 LUFS, 0 silencios, 0 negros) | STATE.json |
| ~18:05 | **Auditoría v3: FAIL — 119 FAIL, 96 WARN** (bloquea la entrega) | `research/audit-v3/` |
| 18:05–18:26 | Latencia: entrega del veredicto + decisión de triaje | registro |
| 18:26–19:15 | Triaje + corrección + re-auditoría pre2 (0 FAIL sobre insumos) | `d8eb218` 19:15 |
| 19:16–19:34 | **Render v4** 16/16 tramos (re-render completo) | STATE.json |
| 19:35–19:36 | MASTER-v4 + LIGERA-v4 | mtimes |
| 19:38 | QA técnico v4 PASS (−16,2 LUFS) | STATE.json |
| ~19:42 | **Auditoría final v4: 0 FAIL** (WARN, 62 avisos benignos) | `research/audit-v4/` |
| 19:45 | **Entrega v4** (Drive + Muse storage) | `e76ef92` |


## 2. Presupuesto de tiempo: dónde se fueron las 7 h 58 min

Desde la aprobación de Suleris (11:47) hasta la entrega (19:45). Los bloques se
clasifican en **necesario** (camino crítico, hecho una sola vez), **re-trabajo**
(repetir lo ya hecho por un defecto, una decisión tardía o un error de medición)
y **espera** (nadie produce).

| Bloque | Duración | Clase |
|---|---:|---|
| Cierre de preproducción (corrección BLOQUEO, guion Adriana, recopilación, auditoría pre-edición, VO 8/8) | 49 min | Necesario |
| Audio base (timeline, karaoke, ducking, scripts de pipeline, cama Flow + mezcla final) | 43 min | Necesario* |
| Composición v2 + pre-vuelo (70 stills + 16/16 críticos) | 1 h 37 min | Necesario |
| Re-mezcla v2 | 7 min | Necesario |
| Borrador v2 + revisión del usuario | ~15 min | Necesario |
| Render v2 abortado (2 tramos, bug de ruta) | 6 min | Re-trabajo |
| **Recomposición v2→v3 (feedback + 4ª tarjeta + NOAA + sándwich + correcciones)** | **2 h 00 min** | **Re-trabajo** |
| Fix «PUNTO.» f400→f423 + re-mezcla v3 | 21 min | Re-trabajo |
| Render v3 + máster/ligera + QA técnico | 23 min | Necesario |
| Auditoría v3 (FAIL) | ~10 min | Necesario |
| Latencia de decisión del triaje | 21 min | Espera |
| Triaje + corrección + re-auditoría pre2 | 49 min | Re-trabajo |
| Render v4 (completo) + máster/ligera + QA | 22 min | Re-trabajo (mayoría evitable) |
| Auditoría final v4 + entrega | ~7 min | Necesario |
| **Total** | **≈ 7 h 58 min** | **Necesario ≈ 4 h 05 min · Re-trabajo ≈ 3 h 40 min · Espera ≈ 21 min** |

\* El audio base incluye construir `run-render.sh` y `run-audit.py` DURANTE la
producción (commit `cf5e2bf`, 12:55): tiempo de ecosistema cargado a este reel.
Ya existe; los próximos reels lo heredan gratis.

**Lo que NO fue un sumidero (para no recortar lo equivocado):**

- El render en sí: 19 min por versión completa (16 tramos, concurrencia 2).
  Barato. Lo caro fue renderizar 3 veces.
- La mezcla en sí: minutos de cómputo por versión. Lo caro fue reconstruirla
  5 veces con verificación completa cada vez.
- La revisión del usuario: ~15 min del borrador v2 al feedback (15:10), y
  ~1 min para aprobar el f9 (17:32). El usuario NO fue el cuello de botella.
- La aprobación de Suleris: ~21 min de espera (11:26→11:47), cubierta en
  paralelo por la recopilación. No bloqueó nada.
- La grabación de la VO: guion enviado ~12:10, 8 líneas recibidas 12:23
  (~13 min) y verificadas a las 12:31. Rápida.
- La vigilancia de 10 min: corre en paralelo y no ralentiza el pipeline
  (consume atención del coordinador, no tiempo de producción).

---

## 3. Los 5 sumideros (con evidencia)

### S1. La recomposición v2→v3 — 2 h 00 min (15:10–17:10)

El mayor bloque único del día. La v2 (1 h 37 min de composición + pre-vuelo
+ re-mezcla) se rehízo casi entera. Sus causas, una a una:

| Causa | Coste dentro del bloque | ¿Evitable? |
|---|---|---|
| Frame fantasma de Bruno (f465–f468, 4 fotogramas) | Localización + fix + verificación: ~15–20 min, pero forzó re-render y re-pre-vuelo | **Sí.** La extracción densa que lo encontró tarda minutos; simplemente no era un paso estándar del pre-vuelo. La detección de escenas ffmpeg (0,3) y el muestreo a 0,5 s NO cazan un fantasma de 4 fotogramas. |
| Tarjeta Fox retirada + 4ª tarjeta (Waltz 28-oct) | Investigación + verificación triple + corte + reconstrucción de T4: ~45 min | **Parcial.** La decisión narrativa («no es la narrativa») solo la podía tomar el usuario viendo el borrador. Pero el coste fue una reconstrucción de escena completa porque la composición es monolítica: no hay módulos de escena intercambiables. |
| Sándwich fantasma del título (webm VP9 con alfa) | Recorte u2net por lote (171 fotogramas) + sándwich + diagnóstico: ~30–45 min | **Sí.** La premisa (Chromium de Remotion decodifica alfa VP9) nunca se verificó con una prueba de 1 minuto. Dos pruebas con `chrome-headless-shell` se colgaron (12 min + 90 s) sin resultado. El fallback de 2 líneas (que el usuario aprobó) era el plan B desde el brief. |
| NOAA: PNG «before» tardío + wipe que no converge | Búsqueda del PNG correcto (la 1ª entrada CIRA era otro evento) + intento de alineación (OpenCV + SIFT + rejilla): ~30 min | **Parcial.** El PNG llegó 16:02, después de construir el fallback. La alineación (corr. 0,13–0,25; SIFT 38 matches → 4 inliers) estaba condenada: dos pasadas de satélite distintas no alinean. El corte (la solución final) se podría haber elegido tras la primera medición fallida, sin la búsqueda en rejilla. |
| Correcciones del coordinador (rótulo NOAA por lado, legibilidad PUNTO.) | ~15 min | **No** (es pulido real), pero llegaron en la misma ventana porque el pre-vuelo no las había cazado. |

**Conclusión S1:** de las 2 h, al menos ~1 h era evitable con tres cosas que
hoy no existen: (a) extracción densa estándar en pre-vuelo, (b) prueba de
supuestos técnicos antes de construir sobre ellos (alfa VP9), (c) escenas
modulares que permitan cambiar T4 sin reconstruir el reel.

### S2. El ciclo de auditoría v3 — 1 h 40 min (18:05–19:45)

La auditoría v3 dio **119 FAIL**. El triaje demostró que **111 eran artefactos
de medición y solo 8 eran defectos reales** (ver apéndice):

- **Causa raíz:** `build-audit-inputs.py` concatenaba `L1.wav` (mono) con
  `L2–L8.wav` (estéreo) con `-c copy`, sin convertir. La cabecera declaraba
  mono y las muestras estéreo se leían como mono intercalado: `voice-orig.wav`
  medía **116,71 s en vez de 61,78 s** y era inservible desde L2. Eso invalidó
  los checks (c) §1/§3/§4, (i2) 70 dips y (i4) 7/8 segmentos. **La VO colocada
  era correcta todo el tiempo** (correlación 1,0000 en las 8 líneas).
- **Defectos reales (8):** 1 acento (`QUE`→`QUÉ`), 1 hueco de karaoke (27,26 s),
  3 discontinuidades de empalme (corregidas con fundidos de 5 ms),
  3 máscaras de SFX (chime/ding que enterraban «¿Tú» y «conviene»).
- **Falsos positivos de diseño:** las 13 «pausas inesperadas» (e) eran prosodia
  de Adriana, no ediciones; la auditoría no tenía el mapa de pausas
  intra-línea del original.

El coste se desglosa así:

| Tramo | Duración | ¿Evitable? |
|---|---|---|
| Latencia 18:05→18:26 (veredicto → orden de triaje) | 21 min | Sí, con un orquestador que dispare el triaje automáticamente ante un FAIL. |
| Triaje + corrección + re-auditoría pre2 | 49 min | En su mayoría: un sanity check de 30 s sobre `voice-orig.wav` (duración == suma de líneas) habría abortado la auditoría antes de generar 111 FAILs falsos. El triaje real (8 defectos) era ~15 min de trabajo. |
| Re-render v4 completo (16/16) | 18 min | En un 87 %: solo 2 tramos tenían cambios visuales (captions en f818 → tramo 6, y f2072 → tramo 14). El cambio de mezcla es solo audio y no exige re-render visual. Con invalidación por hash, el render v4 habría sido ~3 min. |
| QA + auditoría final + entrega | ~12 min | No (puertas obligatorias). |

**Conclusión S2:** ~1 h 20 min de las 1 h 40 min eran evitables. Y hay un
hallazgo de seguridad: el `--resume` actual de `render-chunks.mjs` solo
comprueba que el tramo existe y tiene los fotogramas esperados (línea 209);
**no detecta que la composición o los captions cambiaron**. Si el v4 se hubiera
lanzado con `--resume`, habría reutilizado los 16 tramos v3 con el karaoke
viejo. El re-render completo fue la opción segura con la herramienta actual —
la herramienta es la que hay que arreglar.

### S3. Composición artesanal desde cero — 3 h 27 min en total

`MainReel.tsx` tiene 102 KB escritos a mano para este reel. La v2 costó
~1 h 37 min y la v3 ~1 h 50 min. Cada cambio (por pequeño que sea) exige:
editar el monolito → `tsc` → regenerar stills → verificar a ojo → re-render
completo. No hay:

- Plantillas de escena reutilizables (gancho, tarjeta de cita, panel con barra
  de tiempo, antes/después, CTA, cierre con logo).
- Separación entre estructura (qué escenas, en qué orden, con qué tiempos) y
  presentación (cómo se ve cada escena).
- Pre-vuelo por escena: un cambio en T4 obliga a re-verificar todo el reel.

Este es el sumidero **estructural**: aunque se eliminen S1 y S2, un reel
siempre costará ~1 h 40 min de composición artesanal. Para un reel diario,
es el techo que hay que romper. (Ver propuesta P1-6.)

### S4. Todo se reconstruye de cero en cada ciclo — ~45–60 min de agente

- **Mezcla ×5:** temporal → final → v2 (43 SFX) → v3 (77 SFX) → v4 (77 SFX,
  2 movidos + fundidos). Cada versión: rebuild completo + verificación
  completa (silencedetect, copias SFX, loudness). La v4 difería de la v3 en
  dos SFX movidos y unos fundidos, y aun así fue rebuild + re-verificación.
- **Render ×3** (+ 2 borradores): sin invalidación incremental (S2).
- **Auditoría ×2 completas** (+ 2 pre-auditorías): cada una re-transcribe el
  máster con Whisper y re-ejecuta todos los checks, aunque solo cambiaran
  2 captions.
- **QA visual repetido:** `qa-visual-gaps.py` + extracción densa + ojo humano
  en cada versión.

Ningún paso es incremental. El cómputo de cada paso es barato (minutos); lo
caro es que cada paso va envuelto en un turno de agente con lectura de
contexto, ejecución, verificación y reporte.

### S5. Verificación por ojo en 3 capas + checks reactivos

- Pre-vuelo v2: 70 stills del subagente + 16/16 críticos del coordinador.
- Pre-vuelo v3: 37 stills + verificación del coordinador + 8/8 del padre.
- Total: **102 stills** en `out/preview/` + verificaciones repetidas de los
  mismos puntos por 3 agentes distintos.

El ojo humano cazó cosas reales (rótulo NOAA contradictorio, legibilidad de
«PUNTO.»), así que no se puede eliminar. Pero hoy es el **único** filtro para
defectos que una máquina detecta mejor: un gráfico sobre una cara (detección
de caras + geometría), texto fuera de zonas seguras (coordenadas), un frame
fantasma (extracción densa + diff), un caption que no coincide con el guion
(diff de texto, que la auditoría ya hace en (a)). Tres defectos de este reel
se encontraron **después** de que un humano los viera, cuando un check
automático los habría cazado **antes**: Bruno (usuario, 15:10), PUNTO. desync
(subagente de composición, en el HANDOFF), sándwich opaco (stills frescos).

**Conclusión S5:** el ojo humano debe quedar para lo que solo el ojo decide
(¿se ve bien? ¿el gancho pega?), no para lo que un script mide mejor.

---

## 4. Clasificación: necesario / re-trabajo / espera

| | Tiempo | % del total (7 h 58 min) |
|---|---:|---:|
| **Necesario** (preprod, composición v2, mezcla, render, QA, auditoría, entrega) | ~4 h 05 min | 51 % |
| **Re-trabajo evitable** (S1 + S2 + S4 + render v2 abortado) | ~3 h 40 min | 46 % |
| **Espera** (latencia de decisión del triaje) | ~21 min | 4 % |

Matiz importante: **no todo el re-trabajo fue error**. La retirada de la
tarjeta Fox fue una decisión editorial legítima del usuario al ver el
borrador en movimiento, y el borrador existe precisamente para eso. Lo que
sí fue error (y es lo que hay que arreglar) es que **el coste de cambiar de
opinión fuera una reconstrucción completa**: sin módulos de escena, sin
invalidación incremental y sin checks automáticos, cada corrección cuesta
lo mismo que empezar de nuevo.


## 5. Propuestas priorizadas

P0 = hacer primero (alto ahorro, bajo riesgo, poca inversión).
P1 = siguiente oleada (mayor inversión o mayor riesgo de calidad).
P2 = mejora de proceso (barata, buen retorno a medio plazo).

| # | Propuesta | Ahorro / reel | Inversión | Riesgo de calidad |
|---|---|---:|---|---|
| P0-1 | Orquestador de reels `reel.mjs` (un comando, reanudable) | ~45–60 min | Media (1 día) | Bajo |
| P0-2 | Pre-auditoría obligatoria + validación de insumos de auditoría | ~1 h 20 min cuando hay FAIL (evita el ciclo entero) | Baja (horas) | Muy bajo |
| P0-3 | Invalidación de tramos por hash de insumos | ~15 min por ciclo de corrección | Baja (horas) | Medio (ver mitigación) |
| P0-4 | Pre-vuelo automatizado + check de fotogramas fantasma estándar | ~30–45 min | Media (1 día) | Bajo |
| P0-5 | Tiempos de audio medidos una sola vez (fuente única) | ~20 min + elimina la deriva composición↔mezcla | Baja (horas) | Muy bajo |
| P1-6 | Plantillas y módulos de escena | ~1 h (composición 1 h 40 min → 30–40 min) | Alta (1–2 días) | Medio (genericidad) |
| P1-7 | Mezcla incremental + verificación incremental | ~10 min por re-mezcla | Media | Bajo |
| P1-8 | Biblioteca de camas pre-escaneadas | ~20–30 min | Baja (se construye con el uso) | Bajo (repetitividad) |
| P1-9 | Reducir el ruido de la auditoría (WARN accionables vs estructurales) | ~10–15 min de triaje por auditoría | Baja | Bajo |
| P2-10 | Borrador temprano al usuario (draft-first formalizado) | ~30 min (evita pulir escenas que se cortan) | Nula (proceso) | Bajo |

### P0-1. Orquestador de reels `reel.mjs` — la propuesta central

**Qué cambia:** un solo comando (`node scripts/reel.mjs <id> --tag vN`) que
encadena mezcla → pre-auditoría → render por tramos → máster + ligera → QA →
auditoría final → entrega (Drive + Muse storage), reanudable por frescura de
artefactos (si un paso ya está hecho y sus insumos no cambiaron, se salta),
con puertas duras (FAIL de auditoría = parada, no entrega) y un informe de
progreso en `reports/`. Modelado en el orquestador de video largo
(`worktrees/longform-v2/scripts/pipeline.mjs`, 13 pasos, ya verificado E2E),
adaptado al flujo de reel.

**Ahorro razonado:** este reel tuvo 3 agentes en cadena (composición → audio →
render/auditoría/entrega) con latencias de spawn, lectura de contexto y
reporte entre cada uno, más 21 min de latencia de decisión ante el FAIL y
~15 min de inactividad observada del agente de render (18:43–18:58). Un
orquestador elimina los handoffs entre pasos mecánicos: **~45–60 min por
reel**, y permite correr el pipeline desatendido (por ejemplo, de noche).

**Riesgo de calidad:** un bug en el orquestador podría saltarse un paso o
entregar sin auditoría. **Mitigación:** cada paso sigue invocable por
separado; el orquestador no decide nada creativo, solo ejecuta y reporta;
las puertas (auditoría FAIL = no entregar) son código, no convención; modo
`--dry-run` que lista los pasos sin ejecutarlos; el informe de progreso
registra qué se ejecutó y qué se saltó por frescura.

### P0-2. Pre-auditoría obligatoria + validación de insumos de auditoría

**Qué cambia (dos piezas):**

1. **Validación dura en `build-audit-inputs.py`:** antes de generar nada,
   comprobar que cada línea de VO tiene el mismo número de canales y sample
   rate (o convertir), y que la duración de `voice-orig.wav` == suma de las
   duraciones de las líneas (±0,1 s). Si no cuadra, abortar con un error
   claro. El bug del 22-nov (116,71 s en vez de 61,78 s) se habría cazado
   en 30 segundos, antes de generar un solo FAIL falso.
2. **Pre-auditoría como puerta antes del render:** la auditoría corre PRIMERO
   sobre la mezcla + captions + VO colocada (el patrón `v4-pre2`, que ya
   demostró funcionar: 0 FAIL sobre insumos antes del render v4). Solo si
   pasa, se renderiza. La auditoría final sobre el máster se mantiene.

**Ahorro razonado:** en este reel habría evitado el ciclo completo
FAIL→triaje→re-render (~1 h 20 min de las 1 h 40 min). En el caso típico
(sin bug de insumos) evita al menos detectar un defecto de mezcla/karaoke
después de un render de 19 min.

**Riesgo de calidad:** la pre-auditoría no ve defectos que solo existen en
el máster (deriva A/V, agujeros de frontera, alineación karaoke/onset).
**Mitigación:** es una puerta ADICIONAL, no un reemplazo; la auditoría
final sobre el máster sigue siendo obligatoria (regla del repo).

### P0-3. Invalidación de tramos por hash de insumos

**Qué cambia:** `render-chunks.mjs` guarda un manifiesto por tramo con el
hash de sus insumos (`MainReel.tsx`, `captions.ts`, assets usados en ese
tramo, versión del código de render). Con `--resume`, solo re-renderiza los
tramos cuyos insumos cambiaron. Hoy `--resume` solo comprueba existencia +
número de fotogramas (línea 209), lo que es **peligroso**: tras un cambio
de captions reutilizaría tramos rancios con el karaoke viejo.

**Ahorro razonado:** el render v4 re-renderizó 16 tramos (18 min) cuando
solo 2 tenían cambios visuales (captions en f818 → tramo 6; f2072 →
tramo 14) y el cambio de mezcla es solo audio (lo aplica `master.py`, sin
re-render visual). Con invalidación: ~3 min. **~15 min por ciclo de
corrección.**

**Riesgo de calidad:** un hash incompleto reutiliza un tramo rancio (el
peor fallo posible: entregar video viejo). **Mitigación:** hash conservador
— ante cualquier duda (insumo no catalogado, versión del renderizador
distinta, manifiesto ausente), re-renderizar. El manifiesto es explícito y
auditable; el ahorro viene de los casos claros, no de los dudosos.

### P0-4. Pre-vuelo automatizado + check de fotogramas fantasma estándar

**Qué cambia (dos piezas):**

1. **Extracción densa estándar:** en cada cambio de plano que use material
   de archivo (o en todo el reel a 10 fps si es barato), extraer fotogramas
   y compararlos (diff + detección de caras) para cazar frames fantasma
   como el de Bruno (4 fotogramas) ANTES de entregar el borrador. El check
   que lo encontró tardó minutos; el problema fue que no existía como paso.
2. **Checks automáticos sobre stills:** cara libre de gráficos (detección
   de caras + geometría de overlays), texto dentro de zonas seguras Meta,
   contraste/legibilidad. El script limpia el ~90 % de los stills y el ojo
   humano solo ve los marcados + el gancho + 2–3 de riesgo.

**Ahorro razonado:** elimina el ciclo Bruno (~15–20 min directos + el
re-render y re-pre-vuelo que forzó) y recorta la revisión manual de 70
stills a una revisión de marcados. **~30–45 min por reel.**

**Riesgo de calidad:** un falso negativo del detector deja pasar un
defecto. **Mitigación:** el ojo humano sigue en el gancho y en los
marcados; el usuario sigue viendo el borrador; los umbrales se calibran
conservadores (mejor un falso positivo que un falso negativo).

### P0-5. Tiempos de audio medidos una sola vez (fuente única)

**Qué cambia:** los tiempos de eventos de audio (palabras del panel,
impactos, slams) se miden UNA vez con Whisper/energía sobre el clip real
y se guardan en un archivo de tiempos con procedencia (clip, método,
probabilidad). La composición y la mezcla LEEN ese archivo; nunca se
copian tiempos a mano entre documentos.

**Por qué:** el desync de «PUNTO.» (f400 visual vs f423 audio, 0,77 s)
existió porque la v2 puso el slam en 13,32 s creyendo que «Period.» caía
en 13,72 s — una creencia errónea, cuando la medición correcta (4,58 s
del clip → f423) ya existía. El fix costó una edición de composición +
stills + re-mezcla (~21 min) y se descubrió de casualidad (el subagente
de composición lo marcó en el HANDOFF).

**Ahorro razonado:** ~20 min por reel en fixes de desync + elimina la
deriva composición↔mezcla que obligó a re-mezclar 5 veces con el mapa
de SFX moviéndose.

**Riesgo de calidad:** muy bajo. **Mitigación:** cada medida lleva su
procedencia; si un tiempo se re-mide y cambia, el diff es visible.

### P1-6. Plantillas y módulos de escena (la apuesta estructural)

**Qué cambia:** una biblioteca de escenas reutilizables (gancho con
título, tarjeta de cita con video, panel con barra de tiempo, antes/
después, CTA con botones, cierre con logo) y un `MainReel` que las
compone por configuración (qué escenas, en qué orden, con qué tiempos
y textos). Un reel nuevo es ensamblaje + personalización, no 102 KB
de código nuevo. Cada escena lleva su propio pre-vuelo (stills de esa
escena), así que cambiar T4 no obliga a re-verificar todo el reel.

**Ahorro razonado:** composición de ~1 h 40 min a ~30–40 min por reel.
Es la única propuesta que rompe el techo estructural para el reel diario.

**Riesgo de calidad (el mayor de la lista):** los reels pueden empezar
a verse iguales (plantilla visible). **Mitigación:** las plantillas son
punto de partida, no camisa de fuerza; el gancho y el cierre se mantienen
a medida en cada reel; la dirección creativa (protocolo vigente) sigue
mandando; se revisa la biblioteca cada mes para retirar lo trillado.
Inversión: 1–2 días de trabajo de ecosistema, amortizable en ~5 reels.

### P1-7 a P1-9 (resumen)

- **P1-7 Mezcla incremental:** re-mezclar solo stems/SFX tocados y
  re-verificar solo los checks afectados (hash de `timeline.json` + SFX;
  si cambia algo fuera del mapa, rebuild completo). ~10 min por re-mezcla.
- **P1-8 Biblioteca de camas pre-escaneadas:** 3–5 camas por mood, ya
  escaneadas con `scan-bed.py` y con ventana limpia registrada. El reel
  elige de la biblioteca; solo se genera cama nueva cuando el usuario la
  pide o cuando toca rotar (semanal). Ahorra ~20–30 min por reel
  (generación + inicio de sesión del usuario + scan) y elimina la
  dependencia de que el usuario esté disponible para el login de Flow
  Music en medio de la producción.
- **P1-9 Reducir el ruido de la auditoría:** separar WARN accionables de
  WARN estructurales. Los 44 captions cortos de (b) son inevitables con
  habla rápida y sin efecto visual en BottomKaraoke (la propia auditoría
  lo dice: «importa en SRT»); los 13 de (g) son ruido de Whisper sobre
  el máster mezclado. Si el veredicto solo cuenta lo accionable, la v4
  habría sido casi limpia y el próximo FAIL real no se perderá entre
  62 avisos. Los estructurales se registran como INFO con su
  justificación, no se borran.

### P2-10. Borrador temprano al usuario (draft-first)

**Qué cambia (proceso, no código):** renderizar un borrador 540p en
cuanto la composición compila (antes del pre-vuelo completo) y
entregarlo al usuario para revisión narrativa mientras continúa el
pulido. En este reel el ciclo funcionó (borrador ~14:55 → feedback
15:10); formalizarlo adelanta las decisiones editoriales (como la de
la tarjeta Fox) antes de invertir en pulido. ~30 min de pulido evitado
por reel. Riesgo: el usuario juzga un borrador sin pulir; mitigación:
marcarlo claramente como borrador narrativo (sin SFX finales ni
micro-animación).

---

## 6. Qué NO recortar (líneas rojas de calidad)

Estas cosas parecen «lentas» pero son las que hacen que el reel sea bueno.
Ninguna propuesta las toca:

1. **La auditoría de audio obligatoria** (regla del repo: FAIL = no
   entregar). Se adelanta (pre-auditoría) y se limpia de ruido (P1-9),
   pero no se debilita. La v4 pasó 0 FAIL con 12 checks sustantivos en
   PASS; ese es el listón.
2. **La verificación en fuente primaria** (dossier, panel de negaciones,
   triple verificación). Es preproducción, no fue el cuello de botella
   (~2 h de 9 h, y es donde vive la credibilidad del Memorial).
3. **El ojo humano en el gancho y en el visto bueno final.** El usuario
   aprobó el f9 («Perfecto») y ese es el fotograma que vende el reel.
   La automatización limpia el resto; el gancho se sigue mirando.
4. **La VO real de Adriana y su verificación de oído.** La transcripción
   solo señala sospechas (lección registrada en AGENTS.md); el oído
   humano desempata. No se sustituye por TTS para ahorrar tiempo.
5. **Las pausas naturales intra-línea** (≥0,25 s, pérdida ≤50 %) y la
   regla de ningún gráfico sobre una cara. Son reglas de calidad, no
   de velocidad.
6. **Metraje real verificado primero; IA solo para gráficos, nunca para
   archivo sintético.** Principio del repo, intacto.

---

## 7. Camino al reel diario (cómo se vería el flujo con P0+P1)

| Hora (día de producción) | Paso | Quién |
|---|---|---|
| Mañana | Pack aprobado (dossier → propuesta → Suleris/usuario) | Preprod (ya existe) |
| +0:00 | VO grabada / recibida + verificada; recopilación de assets | Usuario + agente |
| +0:30 | Composición por plantillas + personalización (gancho a medida) | Agente |
| +1:10 | Borrador 540p al usuario (revisión narrativa) | Agente → usuario (~15 min) |
| +1:30 | Correcciones + pre-vuelo automatizado (ojo humano solo en marcados + gancho) | Agente |
| +2:00 | `reel.mjs`: mezcla → pre-auditoría → render → QA → auditoría → entrega | Orquestador (desatendido) |
| +2:30 | Visto bueno final del usuario → publicar | Usuario |

Total: **~2 h 30 min de producción por reel**, con el usuario interviniendo
~30 min en tres puntos. El pipeline desatendido (orquestador) permite además
encadenar reels: mientras el usuario revisa el borrador del reel N, el
orquestador puede estar renderizando el N−1.

**Nota sobre los canales personales:** todo lo anterior sirve igual para el
Memorial y para los proyectos personales del usuario (principio de
reutilización: lo general va en el núcleo, el Memorial es un perfil más).
Las plantillas y el orquestador son agnósticos al perfil; lo que cambia es
el brief (ganchos, tono, línea editorial) y la marca (logos, paleta).

---

## 8. Apéndice: desglose de los 119 FAIL de la auditoría v3

Contado de `research/audit-v3/audio-audit-v3.json` (253 hallazgos:
119 FAIL, 96 WARN, 6 PASS, 32 INFO). Clasificación según el triaje
(commit `d8eb218`).

| Check | FAIL | Reales | Artefactos / falsos positivos | Causa del artefacto |
|---|---:|---:|---:|---|
| (a) guion↔karaoke | 1 | 1 (`QUE`→`QUÉ`) | 0 | — |
| (b) tiempos de caption | 1 | 1 (hueco karaoke 27,26 s) | 0 | — |
| (c) integridad de la VO | 24 | 3 (discontinuidades de empalme) | 21 (7 truncamientos + 9 palabras exprimidas + 5 pausas recortadas) | Referencia `voice-orig.wav` corrupta (duración duplicada) |
| (e) pausas inesperadas | 13 | 0 | 13 | Prosodia de Adriana; la auditoría no tenía el mapa de pausas intra-línea |
| (i) microcortes/máscaras | 80 | 3 (máscaras SFX i5) | 77 (70 dips i2 + 7 segmentos i4) | Referencia corrupta |
| **Total** | **119** | **8 (7 %)** | **111 (93 %)** | — |

Auditoría v4 (`research/audit-v4/`): **0 FAIL, 62 WARN, 12 PASS, 45 INFO**.
Los 62 WARN son estructurales/benignos: 44 captions cortos (b, inevitables
con habla rápida, sin efecto en BottomKaraoke), 13 desvíos karaoke/Whisper
(g, ruido de Whisper sobre el máster mezclado), 4 pausas largas diseñadas
(e), 1 bombeo de ducking 12,4 dB (f, real pero no bloqueante; posible pulido
futuro con release más largo).

---

*Informe preparado 22-nov-2026 por el repaso post-producción. Fuentes:
`git log` (rama `work/preprod-2026-11-21`), `STATE.json`, `HANDOFF.md`,
`research/audit-v3/`, `research/audit-v4/`, `reports/technical-qa.json`,
`scripts/render-chunks.mjs`, `scripts/build-audit-inputs.py`, registro del
coordinador. No se aplicó ningún cambio al ecosistema; las propuestas
penden de la decisión del usuario.*
