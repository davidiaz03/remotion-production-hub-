# Escaneo semanal de tendencias — 2026-11-23

**Fecha del escaneo:** lunes 23-nov-2026. **Método:** `scripts/preprod/outliers.py scan
--platform all --max 30` (YouTube vía yt-dlp, sin clave de API; Instagram y Facebook
con sus CLIs) + `scripts/preprod/measure.py measure --platform all --max 30` (con
`--instagram-account-id` de la cuenta personal, ver §5). **Idioma:** español (es-419).

**Cómo leer este documento:** cada ejemplo lleva su fuente y su fecha. [VERIFICADO] =
visto directamente (video descargado y analizado: transcripción propia con
faster-whisper-small + fotogramas 0,5/1,5/3,0 s). Las métricas de Instagram son
likes leídos el 23-nov-2026 con `instagram-cli`; las de YouTube, vistas públicas
leídas con yt-dlp el mismo día. Nada está inventado: lo no verificable está en la §6.

## 1. Resumen

- **YouTube:** 6 canales escaneados, 25 outliers (10 breakout). Top global: El Orden
  Mundial, «¿Por qué nadie quiere que Corea del Norte caiga?» (652.887 vistas,
  2026-09-25, 14m16s).
- **Instagram:** 5 cuentas, 50 outliers (3 breakout). Top global: La Base, «Un saludito
  a Constanza Peña» (22.103 likes, 21,74x, 2026-11-09, video).
- **Facebook:** 277 URLs procesadas, 0 outliers. El descubrimiento por digests inundó
  el escaneo con 236 Páginas ajenas al tema (ver §5).
- **Medición propia:** Instagram 6 publicaciones en la semana, mediana 21 likes (base
  84); el reel del caso Pilar sigue destacado: 237 likes, 11,29x (era 222 / 10,09x el
  21-nov). Facebook: 0 publicaciones nuevas descubribles; medianas sin cambio.
- **FORMATOS.md:** actualizado con nota de versión 23-nov (medición + 2 ejemplos
  verificados + 1 tipo de gancho nuevo). Ningún principio anterior queda «en revisión»:
  en los 2 videos cortos revisados a fondo, el texto en pantalla aparece en 0–3 s
  (La Base: karaoke «MIENTRAS» a 0,5 s; AJ+: «No han pasado» a 0,5 s).

## 2. Outliers de YouTube (25, 10 breakout)

Señal: vistas. Mediana por canal sobre videos de más de 7 días.

| Canal | Mediana | Outliers | Top de la semana |
|---|---|---|---|
| DW Documental | 288.871 | 2 | Corea del Norte y su alianza con China y Rusia (1.698.534 vistas, 5,88x, 2026-10-28, 42m21s) |
| VisualPolitik | 79.805 | 6 | La guerra de BUKELE en HAITÍ (1.846.142 vistas, 23,13x, 2026-11-11, 22m10s) |
| La Hiperactina | 161.285 | 4 | Tu cerebro no está roto: puedes recuperar tu atención (1.544.100 vistas, 9,57x, 2026-10-13, 17m35s) |
| El Orden Mundial | 1.952 | 9 | ¿Por qué nadie quiere que Corea del Norte caiga? (652.887 vistas, 334,56x, 2026-09-25, 14m16s) |
| La Base | 22.160 | 4 | Un saludito a Constanza Peña (252.768 vistas, 11,41x, 2026-11-09, 34 s) |
| AJ+ Español | s/d | 0 | Sin base de mediana (ver §5) |

**Matiz de lectura (importante):** la mediana mezcla Shorts y videos largos. El Orden
Mundial tiene mediana 1.952 vistas porque publica muchos Shorts de pocas vistas; sus
multiplicadores (334x, 131x, 55x) NO son comparables con los de un canal de formato
único. Lo mismo aplica a La Base (mediana 22.160; mezcla clips de 34 s con podcasts
de 40 min). Los múltiplos se citan como los calcula el escáner, pero la comparación
entre canales debe hacerse por vistas absolutas y por formato, no por múltiplo.

### 2.1 Revisado a fondo: El Orden Mundial — «¿Por qué nadie quiere que Corea del Norte caiga?»

- URL: https://www.youtube.com/watch?v=OtRKNf7bzv4 — 652.887 vistas, 2026-09-25, 14m16s.
- Gancho [VERIFICADO, transcripción propia de los primeros 60 s]: abre con un montaje
  de voces («Escucha cómo habla el mundo de Corea del Norte», 0–2,3 s), luego una
  cadena de frases cortas de contradicción («Llevamos décadas escuchando lo mismo,
  sanciones, condenas y resoluciones de la ONU… sin embargo, ahí sigue, intacto y con
  más armas que nunca», ~18–31 s) y a los ~45 s llega la pregunta del título: «Si de
  verdad nadie lo quiere, ¿por qué no lo han hecho caer?», seguida de «La respuesta
  es incómoda».
- Qué se toma prestado: la **pregunta contraintuitiva + promesa de respuesta incómoda**
  («la respuesta es incómoda»). En un video de 14 min la pregunta puede esperar al
  segundo 45; en un reel debe llegar en 0–3 s. Ya existe el tipo «Pregunta
  contraintuitiva» en FORMATOS.md §1.2; se añade este ejemplo con el matiz de la
  promesa («la respuesta es incómoda»).
- Nota ASR: la transcripción tiene 2–3 palabras dudosas («misión belística»,
  «desnuclearización de la carrera norte-americana»); el gancho y la pregunta están
  claros y el título público los confirma.

### 2.2 VisualPolitik — patrón de títulos en mayúsculas (no nuevo, se sostiene)

6 outliers, todos videos largos (12–25 min). Fórmula de título repetida: «La guerra de
BUKELE en HAITÍ es PEOR de lo que pensábamos» (1.846.142 vistas, 23,13x, 2026-11-11),
«El caso de la espía CHINA de NVIDIA es PEOR de lo que pensábamos» (1.284.110 vistas,
16,09x, 2026-11-10), «TERREMOTO en el PENTÁGONO» (5,49x, 2026-11-14). Recientes a
vigilar: «La ONU gastó 7.000 MILLONES en HAITÍ sin estabilizarlo… y ahora BUKELE la
deja fuera» (1.162.239 vistas, 14,56x, 2026-11-18) y «El régimen de CUBA tiene de
repente un PROBLEMA: su GASOLINA ya solo llega de EEUU» (425.894 vistas, 5,34x,
2026-11-17, 18m48s) — este último, tema directo del Memorial (combustible/Cuba), en
formato largo; no se transcribe esta semana (fuera del rango de reel), queda anotado
como referencia de tema, no de formato.

## 3. Outliers de Instagram (50, 3 breakout)

Señal: likes (Instagram no expone vistas de publicaciones ajenas). Mediana por cuenta
sobre publicaciones de más de 7 días.

| Cuenta | Mediana | Outliers | Top de la semana |
|---|---|---|---|
| AJ+ Español | 3.181 | 12 | Elecciones de medio mandato en EE. UU. (25.522 likes, 8,02x, 2026-11-04, carrusel) |
| Memorias de Pez | 977 | 9 | Evolución de la gran potencia mundial (8.511 likes, 8,71x, 2025-12-20, video) |
| La Hiperactina | 10.879 | 7 | Rewind de ciencia (50.733 likes, 4,66x, 2023-12-22, carrusel) |
| La Base | 1.016 | 7 | Un saludito a Constanza Peña (22.103 likes, 21,74x, 2026-11-09, video) |
| El Orden Mundial | 1.202 | 15 | La #vivienda es la principal preocupación de los españoles (15.970 likes, 13,28x, 2026-09-22, carrusel) |

**Los carruseles con portada-afirmación rompen en El Orden Mundial y AJ+:** los dos
breakouts de El Orden Mundial son carruseles («La #vivienda es la principal
preocupación de los españoles», 13,28x; «#Europa ha vivido un fin de semana lleno de
protestas», 13,24x), y AJ+ tiene 12 outliers, la mayoría carruseles de noticia con
portada de afirmación. No cambia el dato propio (en la cuenta del Memorial los reels
rinden 4,4x los carruseles, §4), pero confirma que el carrusel rinde cuando la portada
es una afirmación noticiosa, no una ilustración.

### 3.1 Revisado a fondo: La Base — «Un saludito a Constanza Peña»

- URL: https://www.instagram.com/reel/Dfh-U_Ho7fO/ (mismo clip en YouTube:
  https://www.youtube.com/watch?v=1_Uc5XW56ok) — 22.103 likes, 676 comentarios,
  21,74x, 2026-11-09, 34 s. Breakout en ambas plataformas.
- Gancho [VERIFICADO, video descargado, transcripción propia + fotogramas 0,5/1,5/3,0 s]:
  pantalla dividida — presentadora arriba, foto abajo — con karaoke palabra por
  palabra en rojo/blanco («MIENTRAS», «HACIENDO» desde 0,5 s). Voz: «Mientras medio
  Paraguay estaba literalmente haciendo cola para poder rescatar sus ahorros, empezó
  a circular en redes una foto de Constanza Peña, la hija del presidente Santiago
  Peña, de 21 años, estudiante en Colombia, universidad privada como su papá, que se
  hacía un selfie ante el espejo de un gimnasio con una camiseta que decía "Tax the
  Poor", que pagan impuestos los pobres».
- Qué se toma prestado: **contraste pueblo/élite con la foto como evidencia** — el
  gancho es la contradicción (cola para rescatar ahorros vs. camiseta «Tax the Poor»)
  y la foto está en pantalla desde el fotograma 0. La presentadora no describe la
  foto: la muestra. Entra en FORMATOS.md §2 («Pantalla dividida») como ejemplo
  verificado; el tipo de gancho ya existía en §1.2 («Denuncia en vivo /
  contradicción»).
- Nota ASR: la transcripción tiene alguna palabra malsonante censurada por el modelo;
  no afecta al gancho.

### 3.2 Revisado a fondo: AJ+ Español — reel sobre GTA VI (reciente a vigilar)

- URL: https://www.instagram.com/reel/Df8Nf0SKF9h/ — 59.847 likes, 1.098 comentarios,
  18,81x, 2026-11-19, video, 101 s. Reciente a vigilar (≤7 días, sin clasificar).
- Gancho [VERIFICADO, video descargado, transcripción propia de los primeros 22 s +
  fotogramas 0,5/1,5/3,0 s]: presentadora en recuadro inferior sobre metraje del
  videojuego, karaoke palabra por palabra («No han pasado» a 0,5 s). Voz: «No han
  pasado ni 24 horas y el chat ya se llenó de hombres diciendo que el GTA 6 se volvió
  woke y que es evidente que lo hizo una mujer».
- Qué se toma prestado: **reacción rápida a la polémica del día (<24 h)** — el reel
  salió al día siguiente del lanzamiento de GTA VI (19-nov) y el gancho nombra la
  polémica en la primera frase («No han pasado ni 24 horas…»). Nuevo tipo de gancho
  en FORMATOS.md §1.2: no es noticia ni denuncia propia, es reacción con contexto al
  debate que ya está en el chat. Para el Memorial: reaccionar el mismo día a una
  declaración o polémica (p. ej., una negación del bloqueo) con la presentadora en
  recuadro sobre el metraje.
- Nota: el título truncado del informe («13 años de desarrollo y más de mil millones
  de dólares después…») es el inicio del pie del reel, no su tema: el video es sobre
  la polémica «woke» de GTA VI. La transcripción lo aclara; no fiarse del texto
  truncado del informe.

### 3.3 Recientes a vigilar (Instagram, ≤7 días)

- AJ+: video de Ricardo Salinas Pliego (51.619 likes, 16,23x, 2026-11-18); «Le
  quitaron la playa a los pescadores y el mar ahora se llevó el hotel» (29.177 likes,
  9,17x, 2026-11-18); carrusel «Rayan Abu M'alla tenía solo 16 años» (25.727 likes,
  8,09x, 2026-11-21).
- La Base: «Se olvidan de contar la historia completa» (8.456 likes, 8,32x, 2026-11-17).

## 4. Medición propia (Memorial) — semana 16–23 nov 2026

Informe: `preprod/research/medicion-2026-11-23.md`. Ventana 2026-11-16 → 2026-11-23.

- **Facebook:** 0 publicaciones en la ventana (sin URLs recientes descubribles por
  ninguna vía del conector; igual que el 21-nov). Base de mediana: 49, mediana 17
  reacciones (reels 60, n=12; fotos 14,5, n=32; carruseles 18,5, n=4). Sin cambio
  respecto al 21-nov: la base es la misma (CSV de la auditoría de octubre).
- **Instagram:** 6 publicaciones en la semana, base 84, mediana 21 likes (era 22 el
  21-nov); reels 62 (n=39), carruseles 14 (n=38), fotos 15 (n=7). **Los reels siguen
  rindiendo 4,4x la mediana de carruseles** (62 vs 14). Seguidores: 4.735 (eran 4.682
  el 21-nov, +53).
- **Top de la semana (Instagram):** el reel del caso Pilar («Una b*mba camuflada en un
  libro fue enviada a una embajada cubana en 1974»,
  https://www.instagram.com/reel/Df-s8UmvPSR/) — **237 likes, 11,29x la mediana**
  (era 222 likes / 10,09x el 21-nov): sigue creciendo y sigue siendo el mejor post
  propio. Confirma el hallazgo del 21-nov: testimonio de la propia víctima + reel.
- **Bottom:** los mismos 3 carruseles de la semana pasada (Reagan 1983, Fidel 2000,
  TV Martí 1997), entre 0,52x y 0,76x. Sin patrón de hora/día (n insuficiente).
- **Hallazgos para FORMATOS.md:** los 3 del 21-nov se confirman sin cambio (reels 4,1x
  fotos en Facebook; reels 4,4x carruseles en Instagram; Pilar destacado). La
  actualización de FORMATOS.md anota los números del 23-nov con nota de fecha.

## 5. Bloqueos, fallos y límites de esta corrida

- **Memorias de Pez (YouTube): error de yt-dlp.** El canal falló con el error SABR
  («Some android client https formats have been skipped… YouTube may have enabled the
  SABR-only streaming experiment»). Sin datos de ese canal esta semana; reintentar la
  próxima con otro cliente o con la clave de la API.
- **AJ+ Español (YouTube): base de mediana 0.** 30 videos analizados, ninguno con
  fecha usable para la base (todos recientes o sin fecha extraíble en la lista plana).
  Sin outliers ni recientes clasificables en YouTube; en Instagram sí rindió (12
  outliers). Pendiente diagnosticar si es fecha o extracción.
- **Instagram (medición): la primera corrida dio «sin datos».** Causa: ahora hay DOS
  cuentas conectadas (`ellibreto` y `davidmanuel2003`) y la autodetección exige
  exactamente una. Se re-corrió con `--instagram-account-id` de la cuenta personal
  (`davidmanuel2003`, la lectora usada el 21-nov) y midió bien (6 publicaciones, base
  84). **Para las próximas corridas: pasar siempre el flag** (el ID no va en el repo).
  Los insights propios siguen bloqueados (falta reactivar la sesión de
  @memorialdenuncia).
- **Facebook (outliers): el descubrimiento por digests inundó el escaneo.** 236 Páginas
  y 277 URLs, casi todas con 1 publicación y sin base de mediana (deportes, farándula,
  política española…: es el radar entero, no las Páginas de referencia). 0 outliers y
  solo UniVista TV con mediana (172,5, 0 outliers). Las Páginas de referencia
  (Memorias de Pez, El Orden Mundial, Canal Red, DW Documental) no tenían URLs en la
  lista. **Para la próxima semana: construir la lista de URLs de Facebook desde los
  posts recientes de las Páginas de referencia, no solo desde los digests** (o correr
  con `--no-digest` + lista curada).
- **Facebook (medición):** `pages list` devolvió 1 Página y ninguna coincide con el
  Memorial; sigue la vía de URLs. 1 URL del listado da INVALID_POST_ID
  (`pfbid0AztXSzSDeWjz99hQu5jptpHENMxHrnkLreQX24Fzoic5sH5ZG3DXkXTa9SwhPeCl`, la misma
  que el 21-nov): ese post ya no es legible por el conector.
- **vidIQ:** no usado (créditos desde el 2-dic-2026, según README §5).

## 6. Lo no verificado / pendientes

- Pendiente del 21-nov, sin resolver: aclarar qué cuenta es «Nota» y re-verificar si la
  ventaja del gancho corto de Scrptly y los múltiplos de EditorOP se sostienen en la
  muestra hispana.
- El video de VisualPolitik sobre la gasolina de Cuba (2026-11-17, 425.894 vistas) no
  se transcribió: es formato largo (18m48s), queda como referencia de tema.
- RT en Español: sigue no disponible en las 3 plataformas (verificado 21-nov).

## 7. Archivos de esta corrida

- `preprod/research/outliers-2026-11-23.md` / `.json` (YouTube)
- `preprod/research/outliers-instagram-2026-11-23.md` / `.json` (Instagram)
- `preprod/research/outliers-facebook-2026-11-23.md` / `.json` (Facebook)
- `preprod/research/medicion-2026-11-23.md` / `.json` (medición propia)
- `preprod/research/fb-urls-2026-11-23.txt` (lista de URLs del escaneo de FB)
- `preprod/research/fb-urls-medicion-2026-11-23.txt` (lista de URLs de la medición)
- Videos descargados y transcripciones de trabajo (no versionados):
  `~/workspace/.tmp/tendencias-2026-11-23/` (La Base 34 s, AJ+ GTA VI 101 s, EOM
  Corea del Norte primeros 60 s, con fotogramas 0,5/1,5/3,0 s).

---

*Escaneo semanal 23-nov-2026. Próximo: lunes 30-nov-2026 (con la lista de URLs de
Facebook curada desde las Páginas de referencia y el flag `--instagram-account-id`
siempre pasado).*
