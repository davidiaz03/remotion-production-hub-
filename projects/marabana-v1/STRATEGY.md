# STRATEGY.md — Reel Marabana V1
## «La carrera que el bloqueo no pudo parar»
**Memorial de la Denuncia · 40ª Marabana · 15 de noviembre de 2026**
**Fecha de estrategia: 15-nov-2026 · Autor: Alberto · Estado: ESTRATEGIA CERRADA, producción a partir de aquí**

**Cambios de dirección del usuario (15-nov-2026, incorporados):**
1. **El reel SÍ lleva voz en off** (anula §2 y §11.6): guion natural y conversacional, VO de IA solo como previsualización (el usuario grabará la definitiva). La narración manda el ritmo: tabla maestra re-temporizada (§6) y subtítulos karaoke desde el audio real. Ver `VO_SCRIPT.md`.
2. **Música original generada con IA, no Flow** (anula §8): motivo, evitar cualquier problema de derechos de autor. MusicGen (Meta) en 3 secciones con el arco emocional del reel; la pista Flow queda como fallback documentado. Ver §8.

---

## 1. TESIS DEL REEL (una frase)

> **El bloqueo intentó cancelar esta carrera en 2012. Catorce años después, casi 3.000 personas la corrieron en La Habana — y un hombre con bastón terminó los 10K.**

El reel es una estructura de contraste **AYER → HOY**: primero la indignación (el dato que casi nadie conoce), después la respuesta (la carrera de hoy, masiva, alegre, desafiante), y al final el corazón (Ernesto). La denuncia no se explica: se demuestra con imágenes de hoy.

---

## 2. EL PROBLEMA CENTRAL — Y CÓMO SE COMPENSA

### El dato incómodo del Memorial

Los datos propios del Memorial (handoff de referencias virales, Drive `1pa6IIqq6HIFm9Yv-70lYzNmHhfYNKtWk`) son brutales:

| Formato | Reacciones |
|---|---|
| Presentadora A CÁMARA + diálogo + karaoke + overlays | 14.000 y 9.100 (115K/119K vistas) |
| «Ecosistema» SIN cara (voz en off + fotos/documentos) | **32–69** |

**Ningún reel sin cara ha funcionado nunca en esta página.** Y en Marabana NO hay presentadora: solo fotos. La pregunta honesta de esta estrategia es: ¿cómo se hace un reel sin cara que no repita el fracaso de los «ecosistema»?

### Por qué fallaron los «ecosistema» (diagnóstico del propio handoff)

1. **Sin cara a la que mirar** → sin conexión humana.
2. **Voz en off con dicción formal y escrita** → suena a documental de televisión, no a reel.
3. **Subtítulos pequeños a dos líneas** → no son karaoke; no se leen en vertical.
4. **Documentos/ilustraciones a pantalla completa >4 s** → estáticos, aburridos.
5. **Temas de pura historia, sin gancho de actualidad ni pregunta polémica.**

### La compensación (punto por punto)

| Fallo de «ecosistema» | Compensación en Marabana V1 |
|---|---|
| Sin cara | **Hay caras DENTRO de las fotos** (Ernesto sonríe, los corredores, el grupo nocturno). La cámara las busca con push-ins Ken Burns. La cara existe; está dentro del encuadre, no presentando. |
| Voz en off documental | **SÍ hay voz en off — pero natural y conversacional, no de documental** (cambio de dirección del usuario, 15-nov-2026). Guion coloquial en español (~40 s, 114 palabras), voz masculina. La VO de V1 es una previsualización con TTS (Piper, voz es_MX-ald-medium); el usuario grabará la definitiva con su propia voz y la pista es intercambiable (ver `VO_SCRIPT.md` y `EDIT_NOTES.md`). |
| Subtítulos pequeños | **Karaoke palabra a palabra sincronizado con el audio real de la VO** (faster-whisper word_timestamps, como en Pilar V30): tipografía grande (Archivo Black, 52–60 px), palabra clave en **rojo #ED1C24**. Los titulares que repetían la narración palabra por palabra se eliminaron — quedan solo rótulos con información nueva (números, nombres, citas, datos). |
| Nada estático >4 s | **Ningún beat dura más de 5,5 s** (el beat 2012, con el sello en medio, 5,53 s; Ernesto, el pico emocional, 5,12 s). Todo se mueve: Ken Burns en cada foto, count-up numérico, sello CANCELADO, ventana de video real, transiciones whip entre actos. |
| Sin gancho de actualidad | Gancho en el segundo 0: una pregunta indignante + la carrera de HOY como respuesta. Noticia caliente, no historia fría. |

**Principio rector:** este reel no intenta imitar a los virales con presentadora (imposible sin ella). Cambia de género: pasa de «presentadora que explica» a **«narración + karaoke + evidencia»**: una voz natural cuenta la historia, el karaoke la escribe en pantalla palabra por palabra (el lenguaje visual de los virales), las fotos la prueban y la música marca el pulso.

---

## 3. LECCIONES DE LOS TRES REELS DEL MEMORIAL

### Reel 09 — MÁS VIRAL («¿Quién es la verdadera amenaza?», 72 s, 14K reacciones)
- Abre **EN MITAD de la conversación** («Yo todavía no…»), sin intro ni logo. El gancho es inmediato.
- Solo ~4 cambios de escena en 72 s: el dinamismo viene del **diálogo, los punch-ins y los overlays**, no de los cortes.
- Subtítulos grandes blancos con **palabra en rojo** (NO, QUE).
- **Lección para Marabana:** el primer segundo es sagrado; no hay intro, no hay logo al inicio. El rojo en la palabra clave es marca de la casa.

### Reel 01 — VIRAL RECIENTE («terrorista ONU», 2:25, 9,1K reacciones)
- Una presentadora en primer plano + archivo compuesto; logo fijo arriba a la derecha.
- **Lección para Marabana:** la marca de agua discreta en esquina es compatible con alto rendimiento; el archivo compuesto (foto + texto) funciona cuando hay una cara que lo ancla.

### Reel 10 — ÚLTIMO (10-nov-2026, 91 s, 147 likes, 18 comentarios)
Analizado fotograma a fotograma (archivo `~/workspace/marabana/research/10_ultimo-reel-10nov-heroes-washington.mp4`).
- **Guion bien estructurado:** gancho «¿3478? No es un número de teléfono…» (víctimas fatales del terrorismo contra Cuba) → definición ONU → casos (La Coubre, avión de Cubana 73 víctimas, Hotel Copacabana) → doble moral → CTA + «segunda parte».
- **Pero el montaje lo mata:**
  - Solo **10 escenas en 91 s** (bloques continuos de 21,9 s y 24,8 s) — ritmo de documental, no de reel.
  - Una sola presentadora sentada en interior estático, sin B-roll ni punch-ins.
  - Subtítulos **pequeños centrados, sin palabra en rojo** — rompe el lenguaje de los virales.
  - Overlay de documento ONU denso e **ilegible**.
  - Sin marca de agua durante el video.
  - **Desajuste gancho/recompensa:** el título pregunta por qué los terroristas son «héroes» para Washington y la parte 1 **nunca lo responde** — la promesa queda incumplida.
- **Lección para Marabana (la más importante):** un buen guion con mal ritmo no funciona. Marabana V1: **ningún beat supera los 5,5 s**, el texto es grande con palabra en rojo, y **el gancho se responde dentro del mismo reel** (la pregunta del segundo 0 tiene su respuesta en el segundo 40: la carrera se corrió igual).

---

## 4. REFERENCIAS EXTERNAS (investigación obligada)

### 4.1 Sports hype reels — la gramática del deporte en vertical
*(Guía «How to Make a Sports Hype Video», increditors.com, 2026)*
- 15–60 s vertical; **impacto inmediato: la mejor jugada primero, sin build-up lento**.
- Text overlays para contexto sin narración; cortes rápidos; speed ramps; gráficos con nombres y cifras.
- **Aplicación:** la mejor imagen (el corredor con la bandera cubana en el Malecón al amanecer) abre el reel; los números (21, 3.000, 2:25:31) van como gráficos grandes, no como voz.

### 4.2 Velocity editing / edición cinemática con ritmo
*(Tendencia Alight Motion 2025–2026; creador «Lenny»/Motion Creators, 150M+ vistas)*
- «Hook frames in the first 0.5 seconds, retention edits, beat-synced cuts, speed ramps, pattern interrupts».
- Transiciones de cámara lenta suaves, rampas de velocidad dramáticas, sincronización con el beat (zooms, sacudidas, destellos en los golpes de bajo), motion blur.
- **Aplicación:** el sello CANCELADO es el **pattern interrupt** (una interrupción visual brusca a los 7 s que resetea la atención); los cambios de beat van sincronizados con la música; el whip transition marca el cambio de acto (2012 → hoy).

### 4.3 Motion Echo Blur — fotos deportivas que parecen moverse
*(Creador Gyasi, 59K seguidores: «Motion Echo Blur» en fotos de deporte)*
- Estelas de desenfoque de movimiento fantasmales sobre fotos fijas para simular velocidad.
- **Aplicación:** la foto de los corredores en carrera (dorsal 870, Cubadebate) lleva una estela de motion blur direccional pre-procesada en Python (PIL): el original nítido sobre una copia desenfocada y desplazada. Es el único beat con este efecto (usarlo en todos lo banalizaría).

### 4.4 Photo slideshows de TikTok — el formato foto+texto que sí funciona
*(Investigación de formato 2025–2026)*
- 1,5–5 s por diapositiva; la música manda; los carruseles de fotos llegan a 3× el engagement de un video medio.
- **Aplicación:** valida el formato foto+texto en sí mismo. La diferencia entre un slideshow que funciona y uno que no es el ritmo, el texto y la música — exactamente los tres ejes de esta estrategia.

### 4.5 Explainer visual sin presentador (formato AJ+ / Ac2ality)
- Texto cinético + fotos + mapas + cifras, sin cara presentando. Ac2ality (referencia del propio HOMOLOGOS.md del Memorial): explainer ~1 min, subtítulos grandes, imagen fuerte cada pocos segundos.
- **Aplicación:** es el género que Marabana V1 adopta. La lección de Academia Play (también en HOMOLOGOS.md): **un hecho visual nuevo cada pocos segundos** — el modelo para contenido sin cara.

### 4.6 Resumen: qué se toma de cada referencia

| Referencia | Técnica adoptada |
|---|---|
| Sports hype | Mejor imagen primero; números como gráficos; sin build-up |
| Velocity editing | Pattern interrupt (sello); cortes al beat; whip entre actos |
| Motion Echo Blur | Estela de movimiento en la foto de carrera |
| Photo slideshows | Ritmo 2–5 s por beat; la música manda |
| AJ+/Ac2ality | Texto cinético como narrador; hecho visual nuevo cada pocos segundos |
| Reel 09/01 (Memorial) | Palabra clave en rojo; sin intro; marca de agua discreta |
| Reel 10 (Memorial) | Qué NO hacer: bloques largos, subtítulos pequeños, promesa sin cumplir |

---

## 5. IDENTIDAD VISUAL (Manual de Identidad Corporativa MD)

Fuente: Drive `1eWYHgyf8c6LQVXgrUAWCL87HIh8BLSPG` (PDF oficial, 11,4 MB).

- **Rojo corporativo: #ED1C24** (RGB 237-28-36; CMYK 0-100-100-0; PANTONE 485 C) — color de la palabra clave, el sello CANCELADO, los acentos.
- **Negro #000000**; gris de apoyo #77787B; apoyos #624D45, #905745, #BE4F38, #F15B40, #F58466.
- **Franja negra** como elemento de apoyo y símbolo de luto (manual) — se usa como banda inferior en las tarjetas de texto.
- **Tipografía corporativa: Amplitude** (neo-humanista, 35 estilos; comercial, NO disponible). Sustitutos de trabajo ya establecidos en Pilar V30: **Archivo Black** (display/titulares) + **Roboto Condensed** (apoyo/etiquetas).
- **Fondo de trabajo:** tinta oscura #0A0E11 (negro azulado) con viñeta radial sutil — las fotos de 580 px no aguantan pantalla completa, así que el diseño es de **tarjetas de evidencia** sobre fondo oscuro (ver §7).
- **Marca de agua:** estrella recortada del PNG oficial (fondo transparente; el lockup completo es demasiado alto para la esquina). Esquina superior derecha, ~110 px, opacidad ~0,9, durante todo el contenido; se retira antes del sting.
- **Cierre:** animación oficial «la del disparo» (6 s, 720×1280, 24 fps) a pantalla completa al final. La marca de agua y el sting usan el MISMO logo oficial.

---

## 6. ESTRUCTURA NARRATIVA — LA TABLA MAESTRA

**Duración total: 47,5 s = 1.425 fotogramas a 30 fps** (41,5 s de contenido + 6 s de sting).
**Re-timing 15-nov-2026: la voz en off manda el ritmo.** Los beats siguen las líneas de la VO (VO de previsualización: 40,89 s; `vo-lines.json`). El sello CANCELADO ya no es un beat propio: golpea DENTRO del beat 2012, en la palabra «canceló» (4,42 s). El corte salida → número cae en la palabra «tres» (15,08 s), para que el count-up arranque con el número que dice la voz.

### ACTO I — LA INDIGNACIÓN (0–11,77 s)
El espectador aprende algo escandaloso en los primeros 5 segundos.

| Beat | Tiempo | Visual | Rótulo (lo que NO dice la VO) | VO |
|---|---|---|---|---|
| 1. GANCHO | 0–2,90 s | Foto CN360 (corredora con la bandera CUBA en el Malecón al amanecer) a **pantalla completa**, push-in lento | Píldora «40ª MARABANA · LA HABANA · 15 NOV 2026» | L1 «¿Sabías que el bloqueo llegó hasta el maratón?» |
| 2. EL DATO | 2,90–8,43 s | «2012» gigante + gráfico vectorial (silueta de corredor + símbolo de prohibición) en tarjeta; **sello CANCELADO** golpea en «canceló» (4,42 s) y queda sobre la tarjeta | Nota OFAC (qué significa la sigla; la VO no la explica) | L2 «En 2012, la OFAC canceló el programa…» |
| 3. EL CONTRASTE | 8,43–11,77 s | «21» gigante en rojo + línea de tiempo gráfica 2011 → 2012 (el nodo 2012 tachado) | «EN 2011,» + «21» + línea de tiempo | L3 «Un año antes, veintiuno habían corrido en La Habana.» |

### ACTO II — LA RESPUESTA (11,77–32,35 s)
La música cambia (entra la sección enérgica). Hoy, 14 años después, la carrera se corrió igual.

| Beat | Tiempo | Visual | Rótulo | VO |
|---|---|---|---|---|
| 4. EL GIRO | 11,77–13,22 s | Whip transition → foto Cubadebate 1 (multitud + bandera cubana) en tarjeta grande | «PERO A PESAR DE ELLO…» | L4 «Pero a pesar de ello…» |
| 5. LA SALIDA | 13,22–15,08 s | **Ventana de VIDEO REAL** (Canal Caribe, salida masiva bajo el arco rojo «Marabana CUBA») en marco estilo pegatina + píldoras 42K/21K/10K/5K | «40ª MARABANA» + fecha + etiqueta de la arrancada | L5 (inicio) «Hoy, catorce años después…» |
| 6. EL NÚMERO | 15,08–19,33 s | Foto Cubadebate 4 (corredores en carrera, dorsal 870) con **estela motion blur** | «CASI **3.000** CORREDORES» — count-up 0→3.000 | L5 «…casi tres mil corredores tomaron las calles…» |
| 7. LA 5K | 19,33–23,23 s | Foto Cubadebate 2 (grupo nocturno, camisetas «CUBA NO ESTÁ SOLA») | «5K · CARRERA CONTRA EL **BLOQUEO** Y POR LA PAZ» | L6 «Y los cinco kilómetros se llamaron…» |
| 8. LA VOZ | 23,23–27,42 s | Foto Cubadebate 3 (grupo MINREX con carteles) | «“EL BLOQUEO ASFIXIA AL PUEBLO CUBANO”» + «— Yuraldi Cava, corredor · AP» | L7 «Como dijo el corredor Yuraldi Cava…» |
| 9. LOS GANADORES | 27,42–32,35 s | Tarjeta de datos (crece: primero 42K, luego 21K con la frase) + foto Tiempo21 (Tamerón y López con medallas) | Tiempos (la VO solo dice apellidos): «ESTÉVEZ 2:25:31 · BACALLAO 2:45:41 · TAMERÓN 1:06:53 · LÓPEZ GUISAO 1:17:24» + «DOBLETE TUNERO EN 21K» | L8 «En el maratón ganaron Estévez y Bacallao. Y en la media, doblete de Las Tunas.» |

### ACTO III — EL CORAZÓN (32,35–41,5 s)
El pico emocional.

| Beat | Tiempo | Visual | Rótulo | VO |
|---|---|---|---|---|
| 10. ERNESTO | 32,35–37,47 s | Foto Cubadebate 6 (Ernesto con bastón en el Malecón) en **tarjeta grande horizontal**, push-in lento hacia su rostro | «ERNESTO JAVIER CONSUEGRA» + «COMPLETÓ LOS **10K**» (con «completó», 33,9 s) + «CON UN **BASTÓN**» (con la pausa dramática, 35,90 s) + «DORSAL 5766» | L9 «Y Ernesto Javier Consuegra completó los diez kilómetros… con un bastón.» |
| 11. EL CIERRE | 37,47–41,5 s | Foto Cubadebate 5 (meta con arco, celebrando en familia) | «HOY LA HABANA CORRIÓ.» (la segunda frase la lleva el karaoke, sin duplicar) | L10 «Hoy La Habana corrió. Y cada paso fue una denuncia.» |

### STING (41,5–47,5 s)
Cierre animado oficial «la del disparo» a pantalla completa (escalado 720×1280 → 1080×1920). La música se retira con fade de 1 s y suena el audio del sting (disparo a ~1–2 s del sting).

### Decisiones de orden (por qué así)
- **Los ganadores van ANTES de Ernesto, no después:** el dato va en el medio (Acto II, energía), la emoción cierra (Acto III). Poner cifras después de Ernesto desinflaría el final.
- **La cita de Yuraldi Cava va en el Acto II:** es la única voz humana con nombre del reel (aparte de Ernesto). Da voz a la multitud — compensa la falta de presentadora con una persona real que habla.
- **El gancho se responde dentro del reel:** la pregunta del segundo 0 («¿el bloqueo llegó hasta el maratón?») tiene su respuesta en el segundo 40 («Hoy La Habana corrió») — lo contrario del error del reel 10.

---

## 7. LENGUAJE VISUAL — EL SISTEMA DE TARJETAS DE EVIDENCIA

**La limitación que define el diseño:** las fotos de Cubadebate tienen solo **580 px de ancho**. A pantalla completa vertical (1080×1920) necesitarían un recorte de ~217 px de ancho → 5× de escalado: inaceptable. Solo la foto CN360 (1600×844) aguanta pantalla completa.

**Solución (no parche, sino lenguaje):** el reel alterna UNA foto cinematográfica a pantalla completa (el héroe, al inicio) con una serie de **tarjetas de evidencia** — fotos enmarcadas estilo pegatina (borde blanco 6 px, radio 14 px, sombra, leve rotación) sobre fondo tinta oscuro, con etiqueta de fuente en pequeño («FOTO: INDER / CUBADEBATE») y texto cinético grande alrededor. Es el lenguaje de un expediente de denuncia: cada foto es una prueba exhibida. Coherente con el Memorial (un museo de la denuncia) y con la limitación técnica.

- **Foto a pantalla completa:** solo CN360 héroe (beat 1). Recorte vertical 474×844 centrado en el corredor (x ≈ 850–1324).
- **Tarjetas:** 860–960 px de ancho (escalado 1,5× desde 580 px — aceptable).
- **Video:** ventana 16:9 en marco de pegatina, con sus bugs de noticiero visibles (se lee como material de prensa, no como defecto).
- **Transiciones:** fundidos cruzados entre beats del mismo acto; **whip** (escala + desplazamiento rápido) en el cambio de acto (beat 4 → 5); **slam** del sello con destello rojo.
- **Movimiento:** Ken Burns en TODA foto (nada estático); direcciones y velocidades variadas (push-in, pan lateral, pull-back) para que no se sienta repetitivo.
- **Texto cinético:** el karaoke se revela palabra por palabra sincronizado con la VO (faster-whisper word_timestamps); la palabra clave de cada frase en rojo #ED1C24; las cifras (21, 3.000, 2:25:31) en tamaño gigante. Los titulares de beat entran por spring en los momentos que marca la narración (el sello con «canceló», «CON UN BASTÓN» con la pausa dramática).

---

## 8. MÚSICA — ORIGINAL GENERADA CON IA (MusicGen)

**Cambio de dirección del usuario (15-nov-2026):** la música es original generada con IA, NO la pista Flow. Motivo: evitar cualquier problema de derechos de autor. La pista Flow era «sonido propio del proyecto», pero el usuario prefiere música generada para este reel. La pista Flow editada (`public/audio/music.wav`) queda en el proyecto como **fallback documentado** (ver abajo).

**Generador:** MusicGen-small de Meta (facebook/musicgen-small, 300M parámetros), vía transformers en local (CPU). AudioCraft no se pudo instalar en este entorno (su dependencia `av` pide una versión sin wheel para Python 3.12 y compilarla exige las librerías de desarrollo de FFmpeg, ausentes); los pesos son los mismos. Los pesos se descargaron con curl (el `snapshot_download` de huggingface_hub se atascaba a ~67 MB por el proxy de egreso). Script: `scripts/gen-music.py`; modelo en `~/workspace/.musicgen-models/facebook/musicgen-small/`.

**Tres secciones, una por acto, con el arco emocional del reel:**

| Sección | Tiempo | Carácter | Prompt (resumen) |
|---|---|---|---|
| A — tensa | 0–11,77 s | Tensión / indignación contenida | Tense cinematic underscore, low pulsing synth bass, sparse somber piano, no vocals, no drums |
| B — enérgica | 11,77–32,35 s | Energía, impulso, desafío | Driving defiant sports anthem, powerful drums, rising strings, triumphant brass, building intensity, no vocals |
| C — emotiva | 32,35–41,5 s | Elevación emocional → resolución | Emotional uplifting cinematic finale, warm strings and piano, hopeful triumphant resolution, no vocals |

**Mezcla:** crossfades de 1,5 s en los dos giros dramáticos (11,77 s = el giro «Pero a pesar de ello…»; 32,35 s = Ernesto); fade-out de 1 s hacia el sting. Mezcla final a **−16 LUFS** (2 dB por debajo de la VO). Las 3 secciones crudas quedan en `public/audio/music-sections/` por si hay que remezclar.

**Ducking:** la música baja a 0,25 (≈ −12 dB) mientras habla la VO (ataque 0,12 s antes de cada línea, liberación 0,2 s después; las ventanas que se solapan se fusionan, así que la música solo respira a pleno volumen en las dos pausas dramáticas y en la cola de 0,6 s antes del sting). La VO va siempre por encima, normalizada a −14 LUFS como en V30.

**Enfoque:** la música no es fondo: es el pulso. El cambio de acto coincide con el cambio de sección musical, y el cambio de sección coincide con el giro narrativo.

**Fallback (regla del usuario):** si la generación con IA no da calidad aceptable tras 2 intentos serios (artefactos, ritmo roto, tono equivocado), documentar el problema y usar la pista Flow. El intento con IA es obligatorio primero.

---

## 9. MARCA DE AGUA Y STING

- **Marca de agua:** estrella recortada del PNG oficial (transparente), esquina superior derecha, ~110 px, opacidad ~0,9, fotogramas 30–1245 (todo el contenido, aparece tras el gancho). Se retira con fade de 0,3 s antes del sting.
- **Sting:** `CIERRE_ANIMADO_OFICIAL_MEMORIAL.mp4` (6,0 s, 720×1280, 24 fps, H.264+AAC), fotogramas 1245–1424, escalado a 1080×1920. Su audio propio suena (es el disparo); la música ya se retiró.
- Ambas piezas usan el **mismo logo oficial** (estrella roja con impacto de bala + «MEMORIAL DE LA DENUNCIA»).

---

## 10. ASSETS — MANIFIESTO Y FUENTES

Todos los assets visuales son **reales y verificados**. La IA solo se usa para UN gráfico vectorial de apoyo (ver §11).

| Asset | Fuente | Archivo local | Uso |
|---|---|---|---|
| Foto héroe (corredor bandera CUBA, Malecón) | CubaNoticias360, fotos RL Hevia, 1600×844 | `marabana/assets/photos/cn360-hero.jpg` | Beat 1, pantalla completa |
| Foto 1 (multitud + bandera) | Cubadebate / INDER, 580 px | `cubadebate-marabana-1.jpg` | Beat 4 |
| Foto 2 (grupo nocturno «CUBA NO ESTÁ SOLA») | Cubadebate / INDER, 580 px | `cubadebate-marabana-2.jpg` | Beat 7 |
| Foto 3 (grupo MINREX con carteles) | Cubadebate / INDER, 580 px | `cubadebate-marabana-3.jpg` | Beat 8 |
| Foto 4 (corredores, dorsal 870) | Cubadebate / INDER, 580 px | `cubadebate-marabana-4.jpg` | Beat 6 (+ motion blur) |
| Foto 5 (meta con arco, celebrando) | Cubadebate / INDER, 580 px | `cubadebate-marabana-5.jpg` | Beat 11 |
| Foto 6 (Ernesto con bastón, Malecón) | Cubadebate / INDER (foto JIT), 580×386 | `cubadebate-marabana-6.jpg` | Beat 10 (pico) |
| Foto ganadores 21K (Tamerón + López, medallas) | Tiempo21, 784×442 | `tiempo21-tunas.jpg` | Beat 9 (ventana) |
| Video salida masiva (15,5 s, 35,0–50,5 s) | Canal Caribe (YouTube, 640×360) | `canal-caribe-marabana-2026.mp4` → recorte 44–48 s | Beat 5 |
| Marca de agua oficial | Drive `1rHsQLfVRUeJE435hYDXGu_x8FBG7zIQy` (PNG transparente 573×907) | `marabana/assets/brand/` | Esquina, todo el contenido |
| Cierre animado «la del disparo» | Drive `1u4MNtxv5IhUJIiIrq_qm4LAa644b_1Ub` (6 s, 720×1280) | `marabana/assets/brand/` | Sting final |
| Voz en off (previsualización) | Piper TTS, voz es_MX-ald-medium (scripts/gen-vo-piper.py) | `public/audio/vo-preview.wav` (48 kHz, −14 LUFS) | Narración 0–40,89 s; intercambiable por la grabación del usuario |
| Música original IA | MusicGen-small vía transformers (scripts/gen-music.py) | `public/audio/music-ai.wav` (48 kHz, −16 LUFS) | 3 secciones + ducking (ver §8) |
| Música Flow (fallback) | Proyecto Pilar V30, editada | `public/audio/music.wav` (40 s, −14 LUFS) | Solo si la IA falla tras 2 intentos (ver §8) |

### Verificación de Ernesto (la foto del pico)
Foto 6 verificada contra la descripción del post de El Necio (Facebook): gorro negro Adidas, camisa blanca holgada, pantalón azul brillante, bastón metálico de 4 patas, dorsal «57…» (resto tapado por la correa del bolso). Coincide exactamente. Dorsal 5766 según El Necio. Es la foto de JIT Deporte Cubano reproducida por Cubadebate.

### Números verificados (corrección al brief)
- **~3.000 participantes; 70 extranjeros** (AP/Cubadebate + teleSUR + eventosencuba). El brief decía ~100: **corregido a 70**. En el reel se usa «CASI 3.000 CORREDORES» y se evita el número de extranjeros.
- Tiempo de Estévez: **2:25:31** (el título de Cubadeportes en Facebook dice «2.21.31»: error tipográfico de ellos).
- NO hay ganadores del 10K publicados: no se inventan.

---

## 11. LO QUE NO VA (decisiones de exclusión, documentadas)

1. **Video de teleSUR (IG reel DfvACIWiKF0, 75 s): RECHAZADO.** Es un paquete previo del 14-nov con metraje de ARCHIVO de ediciones anteriores + marca de agua teleSUR quemada. Presentarlo como la carrera de hoy sería engañoso. Documentado aquí para que nadie lo reintroduzca.
2. **Fotos de Facebook: NO descargables.** yt-dlp falla sin login («only available for registered users»); facebook-cli solo da metadatos/OCR. Los posts de INDER, El Necio y Chapman se consultaron vía CLI para verificar hechos, pero sus fotos no se pudieron descargar. Las fotos de Cubadebate (mismo material INDER/JIT) cubren la necesidad.
3. **Ganadores del 10K: NO se inventan** (no publicados).
4. **«~100 extranjeros»: NO se usa** (la cifra verificada es 70; se evita el número).
5. **IA generativa: DOS usos, ambos claramente no-fotográficos.** El usuario autorizó motion graphics con IA con moderación. (a) UN gráfico vectorial plano (silueta de corredor + símbolo de prohibición, estilo ilustración, NO fotorrealista) para el beat 2 (2012), donde no existe foto. (b) La música original (MusicGen, ver §8). Todo lo demás es foto/video real o grafismo dibujado en código (sello, línea de tiempo, count-up). **Nada de personas inventadas ni fotos falsas que parezcan reales.** Si el gráfico de IA no queda bien, el fallback es una tarjeta tipográfica pura (ya construida como base).
6. **Voz en off con dicción formal de documental** (uno de los fallos de «ecosistema»): la VO de este reel es conversacional y natural (ver `VO_SCRIPT.md`). La decisión anterior de «sin voz en off» quedó anulada por el usuario el 15-nov-2026.

---

## 12. COPY PARA PUBLICAR

**Texto del post (Facebook / Instagram):**

> ¿Sabías que el bloqueo llegó hasta el maratón? 🏃‍♂️
>
> En 2012, la OFAC de EE. UU. canceló el programa de InsightCuba que llevaba corredores estadounidenses a Marabana. La carrera «no calificaba» como programa pueblo a pueblo. En 2011, 21 estadounidenses habían corrido en La Habana.
>
> Pero a pesar de ello… hoy, 14 años después, casi 3.000 corredores tomaron las calles de La Habana en la 40ª Marabana. La 5K se llamó «Carrera contra el Bloqueo y por la Paz».
>
> Y Ernesto Javier Consuegra completó los 10K con un bastón.
>
> Hoy La Habana corrió. Y cada paso fue una denuncia.
>
> #TumbaElBloqueo #CubaNoEsUnaAmenaza #Marabana #MemorialDeLaDenuncia #CubaNoEstáSola

**Nota:** el copy es la versión en texto del reel (base: el copy cerrado de la mañana), no una repetición literal: el reel es el producto audiovisual; el copy es su acompañante. Los hashtags: los 4 del copy de la mañana + #CubaNoEstáSola (consigna visible en las camisetas de la foto 2).

---

## 13. PRODUCCIÓN — NOTAS TÉCNICAS

- **Proyecto:** `projects/marabana-v1/` (rama `work/marabana-v1`), composición MainReel, 1080×1920, 30 fps, 1.425 fotogramas, CRF 19.
- **Render por tramos** (lección de V30: el render en un solo pase muere por OOM de Chromium): 6 tramos de ~238 fotogramas, concatenación con ffmpeg recodificando el audio (evita huecos por padding AAC). Patrón: `projects/pilar-v30/render-chunks.sh`. Salida: máster `REEL_MARABANA_V1_ALBERTO_20261115_MASTER.mp4` + versión ligera `REEL_MARABANA_V1_ALBERTO_20261115_LIGERO.mp4` (720p, un solo paso de ffmpeg desde el máster).
- **Voz en off:** Piper TTS local (voz es_MX-ald-medium, length_scale 0,75), sintetizada línea por línea con silencios exactos en los puntos dramáticos (`scripts/gen-vo-piper.py`); normalizada a −14 LUFS, 48 kHz (`scripts/prep-vo.sh`); transcrita con faster-whisper word_timestamps y alineada al guion (`scripts/transcribe-vo.py` → `src/captions.ts`, 28 chunks, 119 palabras). edge-tts era la primera opción pero su WebSocket no responde de forma utilizable desde este entorno (ver `VO_SCRIPT.md`).
- **Música:** MusicGen-small vía transformers, 3 secciones + crossfades + −16 LUFS (`scripts/gen-music.py`).
- **Pre-procesado de assets (Python/ffmpeg):**
  - Estrella recortada de la marca de agua (bounding box de píxeles opacos en la mitad superior del PNG).
  - Recorte vertical del héroe CN360 (474×844, x 520–994; centroide del rojo medido en x=758).
  - Estela motion blur para la foto 4 (OpenCV: kernel 31 px, mezcla 55% nítido / 45% desenfocado).
  - Recorte del video de salida (43,5–48 s del Canal Caribe, 640×360, 4,5 s).
  - Edición musical Flow (intro 0–12 s + sección potente 30–58 s, crossfade 1 s, fade final) — solo como fallback.
- **QA:** ffprobe (1080×1920, 30 fps, 1.425 fotogramas, H.264+AAC); decodificación completa sin errores; inspección visual de cada beat (17 stills v3 verificados); marca de agua discreta; sting completo al final; sin fotogramas negros ni flashes; sincronía A/V (karaoke = audio real de la VO).

---

## 14. QUÉ NECESITA EL OJO DEL USUARIO (antes de publicar)

1. **La voz de previsualización (Piper):** ¿el ritmo y el tono venden la narración? Es un placeholder: la grabación del usuario la sustituye (ver EDIT_NOTES.md). ¿Alguna frase suena forzada en el guion?
2. **La música generada con IA:** ¿las tres secciones suenan coherentes? ¿El cambio en el giro (11,77 s) y en Ernesto (32,35 s) se siente natural? ¿La mezcla (música a 0,25 bajo la voz) deja oír bien la narración?
3. **El sello CANCELADO** golpeando en la palabra «canceló» (4,42 s): ¿funciona como interrupción o distrae?
4. **La cita de Yuraldi Cava:** ¿entra bien como «voz» del reel o sobra texto?
5. **La tarjeta de ganadores:** ¿aporta como producto informativo completo o diluye el mensaje de denuncia?
6. **El gráfico vectorial del beat 2 (IA):** ¿se lee claramente como gráfico o parece foto falsa?
7. **Ernesto:** ¿el push-in hacia su rostro es respetuoso y emocionante, o demasiado invasivo? ¿El remate «CON UN BASTÓN» con la pausa dramática funciona?

---

## 15. FUENTES DE LOS HECHOS

- Dato 2012 (OFAC cancela InsightCuba; 21 estadounidenses en 2011): https://cubanodehoy.blogspot.com/2012/07/historias-del-bloqueo-prohiben.html
- Cobertura de la carrera (15-nov-2026): Cubadebate «Marabana también alzó la voz contra el bloqueo» (con información de AP; fotos INDER) — incluye la cita de Yuraldi Cava («El bloqueo asfixia al pueblo cubano. Vamos a ganar esta pelea») y la de Abel Torres (MINREX).
- Ganadores: https://www.cubanoticias360.com/marabana-2026-otro-ano-de-maraton-en-las-calles-de-la-habana/ y https://www.tiempo21.cu/2026/11/15/las-tunas-hace-historia-en-el-marabana/
- Video salida masiva: Canal Caribe, «Actualidad en deportes: 15 de noviembre de 2026» (YouTube).
- Ernesto Javier Consuegra (dorsal 5766, 10K con bastón): post de El Necio en Facebook (verificado vía facebook-cli) + foto JIT reproducida por Cubadebate.
- Manual de identidad: Drive `1eWYHgyf8c6LQVXgrUAWCL87HIh8BLSPG`.
- Referencias virales del Memorial: Drive `1pa6IIqq6HIFm9Yv-70lYzNmHhfYNKtWk`.
- Homólogos externos: Drive `1PmcfLhR0kzxKEtsTxnOsSt1xCKSYfSOB` (HOMOLOGOS.md).
- Reel 10 (10-nov-2026): https://www.instagram.com/reel/DfkH1HzvZZf/ — archivo local `~/workspace/marabana/research/10_ultimo-reel-10nov-heroes-washington.mp4`.

---

## 16. REGISTRO DE CAMBIOS DE DIRECCIÓN (15-nov-2026)

| Hora (aprox.) | Cambio | Motivo (usuario) | Qué se modificó |
|---|---|---|---|
| ~15:45 | El reel SÍ lleva voz en off (anula «sin voz en off») | La narración con voz natural vende mejor la historia que el texto solo | Guion en `VO_SCRIPT.md`; VO TTS Piper como previsualización; karaoke desde el audio real (`src/captions.ts`); re-timing completo de beats (§6); titulares que repetían la narración eliminados; ducking de la música |
| ~15:46 | Música original generada con IA, no Flow (anula §8 original) | Evitar cualquier problema de derechos de autor | MusicGen-small en 3 secciones (§8); Flow queda como fallback |
| ~16:00 | Entrega en DOS versiones (máster + ligera) | El máster para archivo/publicación; la ligera para descargar rápido y previsualizar sin gastar datos | `render-chunks.sh` genera `…_MASTER.mp4` (CRF 19, 1080×1920) y `…_LIGERO.mp4` (720p, un paso desde el máster); ambas en la carpeta de Drive |
