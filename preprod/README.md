# Preproducción — Módulo de propuestas de reels del Memorial

**Mismo ecosistema, módulo nuevo.** Este módulo vive dentro del repo
del hub (`remotion-hub`), en la rama `work/preprod-2026-11-21`, y
cubre la fase anterior a la edición: cada mañana el sistema propone
reels desde las noticias del día, con guiones adaptados a la
narrativa del Memorial y al gusto de la directora Suleris Coss Diaz,
como packs de propuesta que el usuario le reenvía por WhatsApp para
**APROBAR ANTES de editar**.

## Puerta dura (la regla que define el módulo)

**Ningún comando de preproducción dispara jamás la edición de un
video.** La separación es por comando: `propose.py` solo escribe
texto (packs, shortlists, logs) dentro de `preprod/propuestas/`.
La edición empieza SOLO cuando el usuario dice que Suleris aprobó
un pack, y eso lo hace otro flujo (el hub de edición), nunca este.
La garantía está cubierta por tests (`tests/preprod/`): escaneo
estático del código + prueba de ejecución.

## Arquitectura

```
radar matutino (07:17) → digest radar-YYYY-MM-DD-digest.txt
        │
        ▼
propose.py rank ──► SHORTLIST.md + SHORTLIST.json (top 5–10)
        │              (dedupe contra propuestas/index.json)
        ▼
propose.py daily ─► packs (andamios) de los 2–3 primeros
        │
        ▼
agente redacta (ganchos, guion, plan visual, justificación)
        │  el script andamia y valida; el agente crea y verifica
        ▼
propose.py check ─► 0 = listo para enviar a Suleris
        │
        ▼
usuario reenvía el pack por WhatsApp → Suleris aprueba
        │
        ▼  (solo entonces, y en otro flujo)
edición en el hub
```

El módulo también se alimenta de **news-content**
(`~/workspace/news-content/`): un borrador ya redactado y validado
allí (`drafts/<id>-reel.md` + `items/<id>.json`) puede convertirse
en pack con `draft --from-draft`. El parseo del digest se reutiliza
de `news_content/radar.py` (vía `sys.path`); preprod no reescribe
ese parseo.

## Layout

```
preprod/
├── README.md                 ← este archivo
├── SULERIS.md                ← perfil codificado de la directora (vetos, exigencias, gustos)
├── NARRATIVA.md              ← 30 reglas narrativas permanentes del Memorial
├── FORMATOS.md               ← principios de gancho, 11 formatos, patrones de edición
├── RANKING.md                ← criterios de ranking, fórmula, umbral, ajustes del agente
├── checklist-suleris.json    ← checklist legible por máquina (V1–V9, E1–E4 + reglas de guion)
├── research/
│   └── tendencias-YYYY-MM-DD.md  ← investigación cruda de tendencias (una por escaneo)
└── propuestas/
    ├── index.json            ← URLs ya propuestas (dedupe de rank)
    └── YYYY-MM-DD/
        ├── SHORTLIST.md / SHORTLIST.json
        ├── daily.log
        └── <slug>/propuesta.md

scripts/preprod/
└── propose.py                ← única entrada del módulo (draft, check, rank, daily)

tests/preprod/
├── preprod.test.mjs          ← suite (node --test)
└── fixtures/                 ← digests sintéticos, borrador de ejemplo, packs
```

**La bandeja se versiona:** `preprod/propuestas/` se guarda en git
a propósito — es el registro auditable de qué se propuso, cuándo y
qué aprobó Suleris (la sección `## Aprobación` de cada pack). Pesa
poco (~40 KB/día) y el `index.json` es el dedupe entre corridas:
nunca se borra a mano.

**Decisión de diseño — una sola entrada:** los cuatro subcomandos
viven en un solo script (`propose.py`) en vez de cuatro scripts
separados, porque comparten la construcción del pack, el checklist,
el ranking y el índice. Una sola entrada documentada es más fácil
de probar (la garantía de no-edición se verifica sobre un solo
archivo) y de invocar desde el cron.

## Comandos

Todos desde la raíz del repo. `--help` en cada subcomando. Salidas:
0 OK · 1 error operativo o validación fallida · 2 uso incorrecto.
Solo Python stdlib, sin red, determinista y offline.

### draft — andamio de un pack de propuesta

```bash
# Desde un borrador de news-content (con su items/<id>.json si existe)
python3 scripts/preprod/propose.py draft \
  --from-draft ~/workspace/news-content/drafts/2026-11-21-trump-rusia-china-venezuela-reel.md \
  --date 2026-11-21

# Desde una entrada del digest del radar
python3 scripts/preprod/propose.py draft \
  --from-radar ~/workspace/goals/resumen-diario-de-redes-sociales/hidden_files/radar-2026-11-21-digest.txt \
  --url https://www.instagram.com/reel/Df-ocWiJfbO/ \
  --date 2026-11-21
```

Salida: `preprod/propuestas/<fecha>/<slug>/propuesta.md` (+ registro
en `index.json` para no volver a proponer esa URL).

El andamio NUNCA inventa hechos: la ficha, los hechos, la fuente y
la clasificación salen del input. Desde el radar, la clasificación
queda «por determinar» (la pone el agente tras verificar la fuente)
y la descripción del digest se cita como resumen truncado, no como
hecho. Lo creativo queda marcado `[ESCRIBIR]`: por qué ahora, 3
opciones de gancho, guion (líneas de VO numeradas + plan visual por
escena, 120–170 palabras habladas, ~60 s), justificación de formato
(con sugerencia automática desde FORMATOS.md) y el checklist de
Suleris completo con estado pendiente.

### check — validar un pack rellenado

```bash
python3 scripts/preprod/propose.py check preprod/propuestas/2026-11-21/<slug>/propuesta.md
```

Chequeos mecánicos (regex del checklist contra guion, ganchos y
plan visual; cada fallo cita la regla y la línea de evidencia) y
estructurales (3 ganchos presentes y no vacíos; sin marcadores
`[ESCRIBIR]`; guion 120–170 palabras; plan visual presente; cada
ítem del checklist con estado `pass`/`flag` + evidencia escrita;
fuente con URL en la ficha). Exit 0 solo si todo pasa; si no, lista
cada fallo.

### rank — shortlist del día

```bash
python3 scripts/preprod/propose.py rank --date 2026-11-21
```

Parsea el digest, excluye las URLs ya propuestas, puntúa cada
entrada fresca y escribe `SHORTLIST.md` + `SHORTLIST.json` (top
5–10). Si ningún ítem supera el umbral, no escribe shortlist y sale
con 0 (silencio, sin relleno). Regenerar una shortlist existente
exige `--force` (se pierden los ajustes del agente anotados en el
`.md`). Detalle de los criterios en `RANKING.md`.

### daily — corrida diaria

```bash
python3 scripts/preprod/propose.py daily --date 2026-11-21
```

Encadena `rank` + packs (andamios) de los 2–3 primeros de la
shortlist. Log en `preprod/propuestas/<fecha>/daily.log`. Digest
ausente → exit 1 con mensaje claro (el radar de las 07:17 escribe
el digest; si falta, falló o no terminó). Sin ítems sobre el umbral
→ exit 0, sin packs ni shortlist.

Opciones comunes: `--out DIR` redirige el directorio de propuestas
(útil para pruebas); `--digest-dir DIR` y `--news-content DIR`
redigen las entradas.

## Ranking (resumen; detalle en RANKING.md)

| Criterio | Peso | Qué mide |
|---|---|---|
| C1 valor informativo | ×3 | Sustancia + dato concreto (cifra, fecha, cita). |
| C2 ajuste a la narrativa | ×3 | Sección + vocabulario del Memorial. |
| C3 ajuste de formato | ×2 | Cita, lugares, metraje de video (FORMATOS.md). |
| C4 potencial de gancho | ×2 | Cita, contradicción, fecha, pregunta. |
| C5 actualidad | ×2 | Horas desde la publicación. |

Total = suma ponderada + bonus de engagement (señal débil: +0,1 por
orden de magnitud de likes, tope +0,5). Máximo 60,5. **Umbral: 30.**
El engagement nunca ordena por encima del total: un ítem importante
con 3 likes entra en la shortlist si sus criterios lo merecen (caso
Kane, 21-nov-2026). El agente puede ajustar una puntuación en
SHORTLIST.md con motivo registrado, nunca en silencio.

## Checklist de Suleris (resumen; detalle en checklist-suleris.json)

24 reglas: 9 vetos (V1–V9), 4 exigencias (E1–E4, con E2 dividida en
E2a/E2b por ser dos chequeos distintos) y 11 reglas de NARRATIVA.md
que aplican al guion o al plan visual (R1, R2, R5, R6, R15, R17,
R19, R21, R27, R30). Las reglas duplicadas entre ambos documentos
(V5=R3, V7=R4, V6=R11, V4=R12, E1=R28) aparecen una sola vez, con
ambas fuentes citadas.

- **7 mecánicas** (`regex` / `regex_max`): V2, V4, V5, V6, V7, E2a,
  E2b. El patrón de V4 detecta el «19» autónomo y excluye años
  (1891, 1917, 19xx), horas (19:30), fechas (19/11/2026, «19 de
  noviembre») y ordinales. V7 solo se aplica al plan visual (la
  palabra «patio trasero» en la voz en off está permitida; el sello
  gráfico, no). V5 usa un patrón conservador (las formas
  documentadas) y la revisión humana cubre el resto.
- **17 por atestación** (`agent`): el agente revisa a mano y escribe
  la evidencia; `check` exige estado + evidencia pero no juzga su
  contenido. Cada regla lleva su guía de verificación en el JSON.
- **15 reglas de NARRATIVA.md no aplican en preproducción** (R7, R8,
  R9, R10, R13, R14, R16, R18, R20, R22, R23, R24, R25, R26, R29):
  son de edición, audio o mezcla y se verifican sobre el montaje.
  El JSON las lista con su motivo de exclusión.

## Skill

La skill `memorial_preprod` (`~/workspace/custom-skills/memorial_preprod/`)
describe los flujos del agente: «propón reels de hoy» (daily +
revisión + selección), «hazme el guion de X» (draft + redacción +
check), «prepara la propuesta para Suleris» (pack limpio listo para
reenviar), «escaneo de tendencias» (actualización semanal, ver
abajo). La skill declara la puerta dura y el registro de la
aprobación: la edición empieza SOLO cuando el usuario dice que
Suleris aprobó, y la aprobación se registra en la sección
«Aprobación» del pack (estado, fecha, medio, notas).

## Corrida diaria (spec del cron — NO creado)

El cron corre después del radar (07:17) y de la ingesta de
news-content (07:35), para que el digest y los borradores del día
ya existan.

```
Nombre:   preprod-daily
Horario:  diario, 07:50 America/Puerto_Rico
Comando:  cd ~/workspace/remotion-hub/repo && python3 scripts/preprod/propose.py daily
Comportamiento: silencioso si todo va bien (log en preprod/propuestas/<fecha>/daily.log);
                avisa al usuario solo ante error (digest ausente, fallo del script).
```

La revisión del agente (leer la shortlist, seleccionar, redactar
los packs, validar con `check`) es trabajo del agente en la mañana,
no parte del cron: el cron solo andamia.

## Actualización semanal de tendencias (procedimiento)

Las tendencias de video corto cambian cada semana; `FORMATOS.md`
es un documento vivo y se actualiza con un escaneo semanal. El
procedimiento completo (pasos, cuentas de referencia, criterios de
revisión) es el de `FORMATOS.md` §6; este es el resumen operativo:

1. **Cuándo:** cada lunes, después de la corrida diaria.
2. **Fuentes:** los reels de la última semana de las 5 cuentas de
   referencia (AJ+ Español, Memorias de Pez, La Hiperactina, La
   Base / Pablo Iglesias, El Orden Mundial y sus podcasts).
   Anotar los 2–3 con mejor ratio likes/seguidores (o vistas en
   YouTube) y transcribir su gancho.
3. **A partir del 2-dic-2026, con vidIQ con créditos:** búsqueda de
   outliers en español (Instagram + TikTok) para
   documental/denuncia/historia, con vistas y múltiplos; revisar
   RT en Español, DW Documental y VisualPolitik (pendientes en
   `FORMATOS.md` §5); aclarar qué cuenta es «Nota»; re-verificar
   si la ventaja del gancho corto de Scrptly y los múltiplos de
   EditorOP se sostienen en la muestra hispana.
4. **Qué se revisa:** cualquier formato nuevo (nuevo tipo de gancho,
   nuevo uso de IA, nuevo patrón de edición) con URL y fecha; si un
   principio de `FORMATOS.md` deja de cumplirse en los ganadores
   (p. ej. el texto en 0–3 s cae por debajo de 2/3 de los casos),
   marcarlo «en revisión» y no borrarlo hasta la siguiente
   confirmación.
5. **Qué se escribe:** una entrada fechada en `preprod/research/`
   (nuevo archivo `tendencias-YYYY-MM-DD.md` o sección fechada en
   el archivo vigente) + actualización de `FORMATOS.md` solo con lo
   verificado, con nota de versión (fecha del escaneo y qué cambió).
   Regla permanente: nada sin fuente — un ejemplo sin URL y fecha no
   entra; una cifra sin fuente se marca como no verificada y no se
   usa para decidir.
6. **Dato propio manda:** cada vez que el Memorial publique un reel
   con rendimiento excepcional, incorporar el dato propio a
   `FORMATOS.md` (por encima de cualquier estudio externo).

### Spec del cron semanal (NO creado)

```
Nombre:   preprod-trends-weekly
Horario:  lunes, 09:00 America/Puerto_Rico
Tarea:    escaneo semanal de tendencias según el procedimiento de
          arriba (trabajo del agente con vidIQ + búsqueda social;
          no es un comando único): revisar las 5 cuentas de
          referencia, registrar el escaneo en preprod/research/
          y actualizar preprod/FORMATOS.md solo con lo verificado.
Comportamiento: silencioso si no hay cambios que incorporar;
                informe corto al usuario solo con lo nuevo.
```

## Tests

```bash
node --test tests/preprod/*.test.mjs
```

La suite cubre: checklist (un guion que pasa y uno que viola V4,
V5 y V7), generación de pack desde un ítem de radar (hechos del
fixture, sin contenido inventado), ranking (orden, desglose,
justificación, URL ya propuesta excluida), garantía de no-edición
(escaneo estático + ejecución con `--out` en tmpdir) y corrida
diaria silenciosa (digest bajo umbral → exit 0, sin packs ni
shortlist).

## Estado y pendientes

- **Estado (21-nov-2026):** módulo construido y probado (suite en
  verde). Rama `work/preprod-2026-11-21`, sin commit. Crons NO
  creados (specs arriba, pendientes de la orden del usuario).
- **Pendiente — vidIQ (2-dic-2026):** sin créditos (0 de 150) hasta
  el 2-dic-2026. La búsqueda de outliers en español, la revisión de
  RT en Español / DW Documental / VisualPolitik y la aclaración de
  «Nota» esperan a esa fecha (`FORMATOS.md` §5).
- **Pendiente — primera corrida real:** el primer `daily` con el
  digest del 22-nov validará el ranking contra noticias frescas y
  calibrará el umbral de 30 si hace falta (si la shortlist sale
  sistemáticamente vacía o sistemáticamente llena, el umbral se
  revisa con el usuario, no en silencio).
- **Pendiente — aprobación del usuario:** los crons (`preprod-daily`
  07:50 y `preprod-trends-weekly` lunes 09:00) solo se crean cuando
  el usuario lo ordene.
