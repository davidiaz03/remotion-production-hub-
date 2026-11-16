# Música de Google Flow Music (auditoría R5, redirigido)

La música de los reels puede venir de dos fuentes: **MusicGen-small**
(local, sin créditos, instrumental) o **Google Flow Music** (canciones
completas con estructura real — verso/estribillo — y stems). Flow es la
fuente preferida cuando el reel necesita una canción con cuerpo
documental; MusicGen sigue siendo la vía rápida para camas
instrumentales y para cuando Flow no está disponible.

> **Qué es Flow Music:** el estudio de música con IA de Google
> (**flowmusic.app**, SIN guion — `flow-music.app` es otro servicio sin
> relación; antes Riffusion/Producer.ai, modelo Lyria 3.5). Genera
> canciones completas por chat, con edición por secciones, stems y
> descargas WAV/MP3/M4A. Funciona por créditos.

## Acceso (importante)

**Este módulo NUNCA entra en la cuenta ni descarga nada por sí mismo.**
No hay CLI ni API pública para Flow: las descargas y generaciones se
hacen desde la sesión del navegador que gestiona el agente padre (inicio
con Google). El lado CLI solo consume archivos locales de la biblioteca.
Si una pista no está en la biblioteca local, pedirla al agente padre —
no intentar entrar en la cuenta desde aquí.

## Biblioteca local

`~/workspace/remotion-hub/assets/music/flow/` — FUERA del repo (los
audios no van a git), junto al pack de SFX (`assets/sfx/`).

- **Formato:** WAV preferido (sin pérdida). Si solo hay MP3/M4A,
  convertir a WAV en la ingesta.
- **Nombre:** `<slug>-flow.wav` (p. ej. `shadows-evidence-flow.wav`).
  Los stems van en `<slug>-flow-stems/` con los nombres que entrega Flow.
- **Catálogo:** `catalogue.md` en la misma carpeta: título, ánimo/uso,
  duración, archivo local, estado (solo-nube / descargada) y reels en
  los que se usó. Actualizarlo en cada ingesta.
- **Ingesta:** al descargar una pista, normalizar una copia a −16 LUFS
  (el nivel de stem que espera `mix.py`, igual que las secciones de
  MusicGen) y conservar el WAV original intacto:
  `ffmpeg -i <slug>-flow.wav -af loudnorm=I=-16:TP=-2:LRA=9 <slug>-flow-stem.wav`
  (el `-stem.wav` es lo que entra en `mix.py`; el original queda como
  archivo maestro).

## Cómo entra en el flujo (mix.py)

Una pista de Flow entra en `mix.py` exactamente igual que una sección
de MusicGen: como `--music` (pista única) o como `--section` (ventanas
por acto). La diferencia es que una canción de Flow tiene estructura
real: hay que elegir las ventanas según la energía de cada acto, sin
cortar a mitad de frase.

```bash
# Ejemplo: 3 actos de una canción de Flow (crossfades de 1,5 s,
# ducking sidechain bajo la VO — igual que con MusicGen)
python scripts/audio/mix.py \
  --voice public/audio/vo-preview.wav \
  --section assets/music/flow/shadows-evidence-flow-stem.wav@0@15 \
  --section assets/music/flow/shadows-evidence-flow-stem.wav@45@62 \
  --section assets/music/flow/shadows-evidence-flow-stem.wav@62@78 \
  --seconds 47.97 --out public/audio/mix.wav --report public/audio/mix.json
```

- Las ventanas (`@INICIO@FIN`) son segundos dentro de la pista, no del
  reel: `mix.py` las coloca en orden con crossfades de 1,5 s.
- Si un acto necesita bucle, elegir una ventana con cola suficiente y
  hacer el loop en el punto de menor energía (igual que con MusicGen).
- El ducking sidechain (threshold 0,018, ratio 7) y el objetivo final
  (−14,5 LUFS / TP −1,5) son los mismos para ambas fuentes.

## Regla de créditos (permiso permanente del usuario, 15-nov-2026)

- **Generar música en Flow cuando haya un proyecto real está
  AUTORIZADO sin pedir aprobación por pista.** Con criterio: no quemar
  créditos en pruebas sin propósito.
- **Descargar pistas que ya existan en la biblioteca no gasta créditos
  y es la vía normal.** Antes de generar una pista nueva, revisar si la
  biblioteca ya tiene algo que sirva.
- (Esta regla sustituye a la anterior, que exigía aprobación explícita
  por pista.)

## Derechos

La página de precios de Flow Music **no declara derechos comerciales
por plan**. Antes de publicar una pista en un reel, hay que leer los
términos de Google y registrar la comprobación (pista + fecha + qué
dicen los términos) en el `CREATIVE_BRIEF.md` del proyecto. El Memorial
no monetiza, pero la duda queda registrada.

## Estado de la integración

**Preparado.** El punto de integración (biblioteca, formato, ingesta,
secciones en `mix.py`, regla de créditos, nota de derechos) está
documentado. Las descargas se hacen vía la sesión del navegador del
agente padre; este módulo no necesita ningún acceso más.
