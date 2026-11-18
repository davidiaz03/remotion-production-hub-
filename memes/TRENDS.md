# Tendencias de memes — qué funciona hoy (oct–nov 2026)

Resumen de la investigación en redes y web del 18-nov-2026. Dónde
re-chequear: **Know Your Meme** (knowyourmeme.com), **Imgflip trending**
(imgflip.com/memes), **ppl.studio/viral-formats**.

## Panorama

- **El vídeo manda** (TikTok/Reels/Shorts); la imagen sigue fuerte en
  IG/FB/X.
- **Humor dominante: absurdo/post-irónico** — sin remate tradicional,
  ironía agresiva, brainrot (Italian brainrot, Tung Tung Tung Sahur),
  nostalgia y «reinicios» de memes viejos (un clip de 2017 fue «el primer
  meme de 2026»).
- **Lo nicho y específico rinde más que lo genérico.**
- **Regla de los 3 segundos**: el gancho en el primer fotograma.

## Formatos y qué soporta el ecosistema

| Formato | Estado en v1 | Cómo |
| --- | --- | --- |
| Vídeo con los 4 movimientos (captions + zoom punch + SFX + freeze) | ✅ | `meme-video.py --top … --punch-at … --sfx … --freeze-end 3` |
| POV | ✅ | `meme-video.py --pov "…"` |
| Meme de solo texto (fondo blanco) | ✅ | `meme.py --text-only "…"` |
| Multipanel 2×2 | ✅ | `meme.py --grid a,b,c,d --texts …` |
| Chat falso | ✅ | `meme.py --fake-chat "yo: …|…: …"` |
| Deep-fry | ✅ | `meme.py … --deep-fry` |
| Imagen absurda con IA (Pollinations) | ✅ | `gen-absurd.py --prompt "…"` |
| Reacción (clip + caption) | ✅ | `meme-video.py --input clip.mp4 --caption "…"` |
| Vídeo meme con IA (Veo/Omni) | 📝 receta | Ver README § «Vídeo meme con IA» |
| Freeze a mitad de clip | ⏳ pendiente | Hoy solo `--freeze-end` |

## La ola de 2026: vídeo con IA

Los memes de vídeo con IA son la ola del año: Tiny Desk Outstanding,
Black Cat Clapping, La Calabaza, palomas IA, animales humanizados. El
formato «remake» (estilo fijo + tu cara/mascota) es el más replicable.
La generación es manual en Flow/gemini.google.com (autorización
permanente del usuario) y el remate —caption, punch, SFX, freeze— se hace
aquí con `meme-video.py`.

## Mantenimiento de tendencias

- **Plantillas de imagen**: `refresh-templates.py` (Imgflip top 100).
- **Formatos de vídeo**: revisar cada cierto tiempo contra Know Your Meme,
  Imgflip trending y ppl.studio/viral-formats, y actualizar esta tabla y
  los generadores. Los formatos de vídeo no se actualizan solos.
