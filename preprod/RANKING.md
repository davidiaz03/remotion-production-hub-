# RANKING — Cómo se ordenan las noticias del día

**Módulo de preproducción del Memorial de la Denuncia.**
**Propósito:** que Suleris elija de un menú en vez de juzgar idea por
idea. Cada mañana, el comando `rank` ordena las entradas frescas del
digest del radar y publica una shortlist de 5–10 propuestas con su
desglose de puntuación y una línea de justificación por ítem.

**Principio anti-sesgo:** la puntuación de candidatos de news-content
premia el engagement y deja fuera ítems importantes con pocos likes
(caso Kane, 21-nov-2026: la operación de Harry Kane, hecho
confirmado de primera plana, quedó fuera de los candidatos por tener
pocos likes). Este ranking NO repite ese sesgo: el engagement es
solo una señal débil (máximo +0,5 sobre 60) y nunca ordena por
encima del total.

**Determinista y offline:** la puntuación sale solo de los campos de
la entrada del digest (sección, descripción, timestamp, likes, URL)
y de listas de palabras documentadas abajo. Sin red, sin modelos,
sin aleatoriedad: la misma entrada da siempre la misma puntuación.

---

## 1. Los 5 criterios (cada uno 0–5)

### C1. Valor informativo (peso ×3)

¿La entrada trae material suficiente para un guion de 60 s?

| Puntos | Rúbrica |
|---|---|
| 0–1 | Sin sustancia: descripción vacía o de menos de 50 caracteres, o solo sensacionalismo. |
| 2 | Resumen breve con algún dato (base). |
| 3 | Resumen sustancial (≥200 caracteres) con datos. |
| 4 | Sustancial + cifra, fecha o cita concreta. |
| 5 | Sustancial + cifra/fecha/cita + sin banderas de riesgo. |

**Fórmula implementada** (`puntuar_entrada`, `scripts/preprod/propose.py`):
base 2; +1 si la descripción tiene ≥200 caracteres; +1 si contiene
un dígito o una cita entrecomillada; +1 si no tiene banderas de
riesgo; −2 si tiene banderas de riesgo (afirmación sin verificar,
titular sensacionalista, republicación sin texto propio — las mismas
de `news_content/radar.py`). Resultado acotado a 0–5.

### C2. Ajuste a la narrativa del Memorial (peso ×3)

¿La noticia encaja en lo que el Memorial cuenta (bloqueo, soberanía,
memoria histórica, injerencia, Cuba, Venezuela, América Latina)?

| Puntos | Rúbrica |
|---|---|
| 1 | Tema ajeno al Memorial (p. ej. fútbol sin conexión con Cuba). |
| 2 | Tema internacional general con algún punto de contacto. |
| 3 | Tema de Cuba, Cuba–EE.UU. o Venezuela-LatAm. |
| 4 | Tema del Memorial + vocabulario de la narrativa (≥2 palabras clave). |
| 5 | Tema del Memorial + vocabulario denso (≥4 palabras clave). |

**Fórmula implementada:** base por sección del digest — CUBA-EEUU 3,
VENEZUELA 3, ESP-BRASIL-IA 2, BAYERN 1, otras 2; +1 si la descripción
contiene ≥2 palabras de la lista de narrativa; +1 si contiene ≥4.
Lista de palabras (`PALABRAS_NARRATIVA` en el código): bloqueo,
sanciones, Cuba, Venezuela, Martí, Fidel, imperio, ONU, CARICOM,
Latinoamérica, Caribe, denuncia, historia, memoria, intervención,
injerencia, soberanía, dignidad, petróleo, combustible, arancel,
Trump, Rubio, Estados Unidos, Miami, exilio, migración, TPS,
embargo, guerra, invasión, golpe, derechos humanos (y sus
equivalentes en inglés, porque las descripciones del digest suelen
venir en inglés).

### C3. Ajuste de formato (peso ×2)

¿La noticia encaja en un formato de `FORMATOS.md` §2?

| Puntos | Rúbrica |
|---|---|
| 1 | No encaja en ningún formato claro. |
| 2 | Encaja débilmente (un formato posible, sin material distintivo). |
| 3 | Encaja en un formato claro (cita, lugares o metraje de video). |
| 4 | Encaja en un formato + un segundo material (p. ej. cita + metraje). |
| 5 | Encaja en varios formatos a la vez (cita + lugares + metraje). |

**Fórmula implementada:** base 2; +1 si hay cita textual entrecomillada;
+1 si se mencionan ≥2 lugares (mapa, frontera, ruta, países, ciudad,
golfo, canal, isla…); +1 si la URL es de video (reel, Shorts).
Acotado a 0–5.

### C4. Potencial de gancho (peso ×2)

¿La noticia trae con qué abrir los primeros 3 segundos (FORMATOS.md §1)?

| Puntos | Rúbrica |
|---|---|
| 1 | Sin gancho evidente. |
| 2 | Un elemento de gancho (cita, contradicción, fecha o pregunta). |
| 3 | Dos elementos de gancho. |
| 4 | Tres elementos de gancho. |
| 5 | Cuatro elementos (cita + contradicción + fecha + pregunta). |

**Fórmula implementada:** base 1; +1 cita textual; +1 contradicción
(pero, sin embargo, mientras, aunque / but, however, despite, while,
although); +1 fecha explícita (mes o dígito); +1 pregunta (¿ o ?).
Acotado a 0–5.

### C5. Actualidad (peso ×2)

¿De cuándo es la publicación? Se mide desde su timestamp hasta el
mediodía UTC del día del digest.

| Puntos | Rúbrica |
|---|---|
| 5 | ≤12 horas. |
| 4 | ≤24 horas. |
| 3 | ≤36 horas. |
| 2 | ≤48 horas. |
| 1 | Más de 48 horas. |

Sin timestamp legible se asume 48 horas (2 puntos).

---

## 2. Fórmula del total y umbral

```
total = C1×3 + C2×3 + C3×2 + C4×2 + C5×2 + bonus_engagement
```

- Máximo sin bonus: **60 puntos** (5 × 12 de peso total).
- **Bonus por engagement (señal débil):** +0,1 por orden de magnitud
  de likes, con tope de +0,5. Es decir: ~10 likes → +0,1; ~100 →
  +0,2; ~1.000 → +0,3; ~10.000 → +0,4; ~100.000 o más → +0,5. Sin
  dato de likes → +0. El bonus nunca decide por encima de los
  criterios: dos ítems empatados en criterios se desempatan por
  narrativa, luego por likes, luego por más reciente — pero un ítem
  con 100.000 likes y criterios bajos no supera a un ítem importante
  con 3 likes.
- **Umbral de shortlist: 30 puntos** (la mitad del máximo). Solo los
  ítems con total ≥ 30 entran en la shortlist, con un tope de 10.
  Si ningún ítem supera el umbral, `rank` no escribe shortlist y
  sale con 0: silencio, sin relleno.

**Ejemplo del sesgo corregido (digest 21-nov-2026):** una entrada de
la sección CUBA-EEUU con solo 3 likes («Atlas Of Why») entró en la
shortlist en 5º lugar con 50,1 puntos (C1 5, C2 5, C3 3, C4 2,
C5 5, bonus +0,1), por encima de entradas con miles de likes y
menos narrativa. Con la puntuación de news-content (engagement
dominante) habría quedado fuera.

---

## 3. Dedupe: no volver a proponer lo mismo

Antes de puntuar, `rank` excluye:

1. **URLs duplicadas dentro del digest** (misma publicación en varias
   secciones): queda la primera aparición, con el mayor conteo de
   likes y la descripción más larga (reutiliza `radar.dedupe`).
2. **URLs ya propuestas** (registradas en
   `preprod/propuestas/index.json`, que `draft` y `daily` actualizan
   al crear cada pack). Una noticia propuesta una vez no vuelve a la
   shortlist aunque siga en el digest de días posteriores.

---

## 4. La shortlist

`rank` escribe dos archivos en `preprod/propuestas/<fecha>/`:

- **SHORTLIST.md** — legible: por ítem, entidad, sección, URL,
  desglose de los 5 criterios + bonus, y UNA LÍNEA de justificación
  (por qué puede funcionar + qué formato y qué tipo de gancho
  encajan, generada desde los criterios más altos y la sugerencia de
  `FORMATOS.md`).
- **SHORTLIST.json** — legible por máquina: los mismos datos más la
  descripción completa, las banderas de riesgo y el formato
  sugerido.

## 5. Ajustes del agente (con motivo registrado, nunca en silencio)

La puntuación automática es un punto de partida, no un veredicto.
El agente puede ajustar cualquier puntuación, con dos reglas:

1. **El ajuste se escribe en SHORTLIST.md**, junto al ítem, con este
   formato: `Ajuste del agente: C2 3→4, motivo: la noticia conecta
   con el ensayo que Suleris envió el 18-nov.` El motivo es
   obligatorio: un número cambiado sin motivo no vale.
2. **El ajuste no se escribe en SHORTLIST.json** (ese archivo es la
   salida determinista del script) ni se re-ejecuta `rank` después
   de ajustar: regenerar la shortlist con `--force` borra los
   ajustes anotados en el .md. El ajuste que importa para el pack se
   copia a la sección «Por qué ahora» del pack cuando se redacta.

El ajuste típico es subir C2 (el agente sabe de conexiones con el
ensayo de Suleris o con la línea editorial que las palabras clave no
ven) o bajar C1 (la descripción promete más de lo que la fuente
realmente trae). Un ajuste no puede meter en la shortlist un ítem
bajo el umbral sin registrar el motivo: si el agente rescata un ítem
del digest completo, lo anota en el .md con el motivo.

---

## 6. Límites honestos

- La descripción del digest es un resumen truncado (~600 caracteres,
  en inglés): la puntuación juzga el resumen, no la noticia. Un ítem
  puede puntuar alto y resultar débil al abrir la fuente, o al revés.
  Por eso el agente selecciona (máximo 3 al día) y verifica antes de
  redactar.
- Las listas de palabras son heurísticas, no comprensión: un ítem
  puede mencionar «Cuba» de pasada y subir C2 sin merecerlo. El
  ajuste del agente (§5) existe para eso.
- El ranking no clasifica (hecho / declaración / rumor): la
  clasificación la pone el agente al verificar la fuente, en el pack.
  Las banderas de riesgo solo advierten.
