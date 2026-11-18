# Tendencias de memes — qué funciona hoy (nov 2026)

Resumen de la investigación en redes y web, refrescado el **18-nov-2026**
(búsqueda web + IG/FB/Threads). Dónde re-chequear: **Know Your Meme**
(knowyourmeme.com), **Imgflip trending** (imgflip.com/memes),
**ppl.studio/viral-formats**, **Virlo** (virlo.ai/reels).

## Panorama

- **El vídeo manda** (TikTok/Reels/Shorts); la imagen sigue fuerte en
  IG/FB/X.
- **Humor dominante: absurdo/post-irónico** — sin remate tradicional,
  ironía agresiva, brainrot, nostalgia y «reinicios» de memes viejos (un
  clip de 2017 fue «el primer meme de 2026»; la animación «SpongeBob
  Beats Up Patrick» de nov-2025 resurgió en nov-2026).
- **Lo nicho y específico rinde más que lo genérico.**
- **Regla de los 3 segundos**: el gancho en el primer fotograma.
- **NUEVO — el audio manda el remate**: el sonido controla el punchline o
  el ritmo del montaje, no es solo «lo que está sonando» (Lightreel,
  nov-2026). El brainrot sin dirección y el caos genérico de «el becario
  tomó la cuenta» están RINDIENDO MAL: el absurdo necesita una premisa
  estable debajo del desorden.
- **NUEVO — camuflaje de formato**: lo más fuerte no parece anuncio ni
  contenido: parece un hilo de chat, un edit de fandom, una confesión,
  un chiste de nicho. El producto (o el chiste) es el remate, no el
  decorado.

## Novedades del 18-nov-2026

- **Silent face caption** — el formato más fuerte de la semana
  (ppl.studio, 15-nov: 16 creadores, post top 74,5 M de vistas): cara
  en silencio + una línea de texto. Se hace con `meme-video.py --caption`
  sobre un clip quieto.
- **«Your First Time In a Fancy Cafe» (AI slop)** — vídeo IA de alguien
  que cree sentarse en una silla y está sentado en la mesa (TikTok
  @leehoustonx, 1-nov; ola de remakes con otros personajes). Formato
  «remake»: estilo fijo + tu cara/personaje. Ver README § «Vídeo meme
  con IA».
- **Storytime carousel sobre un meme de reacción** — la historia en
  láminas cortas (1–2 frases) sobre el mismo meme de reacción repetido.
  Se arma con `meme.py --texts` + carrusel.
- **Meme + prueba en texto** (carousel) — el meme primero, la captura
  de chat que «lo prueba» después. `--fake-chat` hace la segunda parte.
- **Chat falso de escándalo** — el formato nativo más claro del momento
  (Lightreel): una conversación normal que degenera en escándalo absurdo,
  con el remate en la última línea. `meme.py --fake-chat`.
- **Boy, man, kebab** — tres vídeos apilados en vertical: cómo reacciona
  un niño, un hombre… y un kebab girando. Estructura 3-panel vertical.
- **«Go go go go»** — audio repetitivo sobre gente que va demasiado
  lento o tarda en decidirse. **«Oh no, I'm so cringe»** — audio de
  South Park + texto de algo vergonzoso que hacías (o sigues haciendo).
- **Guess the Movie By the Frame** — adivinar la película por un solo
  fotograma (y su timestamp). Formato de juego/participación.
- **Wizard Cat at Keyboard** (Virlo, 18-nov) — gato mago al teclado;
  **Pretty Little Liars -A messages**; **ChatGPT One Word Personality
  Challenge** — pedirle a ChatGPT una palabra que te describa.
- **«My Moon My Man» soft launch / «Same Spot, Years Apart»** — la
  revelación que hay que esperar: la pareja que se insinúa y se muestra
  en el estribillo; la foto vieja recreada en el mismo lugar.
- **Suno AI text-to-song** — convertir un texto en canción; **144p vs 4K**
  irónico; **Tung Tung Tung Sahur** dance overlays (brainrot con
  premisa estable).
- **Slang nuevo**: W Chews / L Nibbles; «Frutiger Aero Yams»; «Wassup,
  In a Minute Wassup» (animación Blue Lock + Jersey club).
- **Canciones sin sentido** siguen fuertes en Reels (bombaclat wallahi;
  remix «Do Re Mi Fa»); **música IA absurda** (AI Rumpelstiltskin «Tip
  Toe in My Jordans», 55K likes en FB). La cama musical del ecosistema
  (`--music`) cubre el lado de la música libre; los audios trending de
  TikTok NO se descargan (copyright) — se añaden en la app al publicar.
- **Estacional**: No Nut November; «first of the month»; agotamiento de
  propósitos de Año Nuevo en noviembre; «Remember November 2026 polar
  bear» (imagen IA de 2023 que «predijo» nov-2026).

## Formatos y qué soporta el ecosistema

| Formato | Estado | Cómo |
| --- | --- | --- |
| Vídeo con los 4 movimientos (captions + zoom punch + SFX + freeze) | ✅ | `meme-video.py --top … --punch-at … --sfx … --freeze-end 3` |
| Freeze a mitad de clip | ✅ (18-nov) | `meme-video.py --freeze-at 2.5 --freeze-dur 2` |
| Cama musical | ✅ (18-nov) | `meme-video.py --music sneaky-snitch` |
| Texto que evita las caras | ✅ (18-nov) | automático en `meme.py` y `meme-video.py` |
| POV | ✅ | `meme-video.py --pov "…"` |
| Meme de solo texto (fondo blanco) | ✅ | `meme.py --text-only "…"` |
| Multipanel 2×2 | ✅ | `meme.py --grid a,b,c,d --texts …` |
| Chat falso | ✅ | `meme.py --fake-chat "yo: …|…: …"` |
| Deep-fry | ✅ | `meme.py … --deep-fry` |
| Imagen absurda con IA (Pollinations) | ✅ | `gen-absurd.py --prompt "…"` |
| Reacción (clip + caption) | ✅ | `meme-video.py --input clip.mp4 --caption "…"` |
| Silent face caption | ✅ | `meme-video.py --input clip-quieto.mp4 --caption "…"` |
| Vídeo meme con IA (Veo/Omni) | 📝 receta | Ver README § «Vídeo meme con IA» (Pollinations vídeo = pago; Flow web = gratis) |

## La ola de 2026: vídeo con IA

Los memes de vídeo con IA son la ola del año: Tiny Desk Outstanding,
Black Cat Clapping, La Calabaza, palomas IA, animales humanizados, y
ahora «Fancy Cafe». El formato «remake» (estilo fijo + tu cara/mascota)
es el más replicable. La generación es manual en Flow/gemini.google.com
(autorización permanente del usuario) y el remate —caption, punch, SFX,
freeze, música— se hace aquí con `meme-video.py`.

## Mantenimiento de tendencias

- **Plantillas de imagen**: `refresh-templates.py` (Imgflip top 100).
- **Formatos de vídeo**: revisar cada cierto tiempo contra Know Your Meme,
  Imgflip trending, ppl.studio/viral-formats y Virlo, y actualizar esta
  tabla y los generadores. Los formatos de vídeo no se actualizan solos.
- **Historial**: primera versión 18-nov-2026 (mañana); refresco
  18-nov-2026 (mediodía) — este documento.
