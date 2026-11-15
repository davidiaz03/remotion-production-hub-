# Módulo motion — explainer animado para reels del Memorial

Gramática del estilo «animated explainer reel» (analizado en
`~/workspace/marabana/research/motion-ref-fb/ANALISIS.md`): karaoke superior
palabra a palabra, escenario oscuro con resplandor emocional por actos, marco
de teléfono con grabación o UI simulada, mano que toca, lupa de detalle,
pasos numerados, alertas, diagramas animados, contadores y citas.

**Qué replica:** las TÉCNICAS. **Qué no replica:** el contenido ni la marca
del creador de referencia. Los assets (fotos, textos, videos) los pone cada
proyecto; la paleta usa los colores del Memorial (rojo #ED1C24, tinta,
blanco) con los acentos del estilo como sistema (verde = seguro, azul =
palabra clave, amarillo = dato, naranja = curiosidad).

Fuente: Poppins (instalada en `~/.fonts/`, como Archivo/Roboto). Si falta,
el sistema cae a sans-serif.

Flujo completo end-to-end (brief → guion → assets → animación →
transiciones → SFX → música → render → QA): skill
`motion_graphics_reels` en `~/workspace/custom-skills/`.

## Componentes

| Componente | Qué hace | Props clave |
|---|---|---|
| `GlowStage` | Fondo tinta + resplandor radial de color emocional + partículas + viñeta | `glow`: danger \| safe \| neutral \| curiosity \| ink; `particles`, `seed` |
| `GlowCrossfade` | Fundido entre dos resplandores (cambio de acto; se apila sobre el GlowStage raíz) | `to`, `atFrame`, `durationInFrames` |
| `TopKaraoke` | Subtítulo karaoke SUPERIOR: palabra activa en blanco negrita con pop; resto en gris; palabras `kw` con recuadro azul | `lines: KaraokeLine[]` (palabras con `t/s/e/kw` de faster-whisper), `top`, `size` |
| `KineticHeadline` | Titular con palabras que entran una a una con pop elástico | `lines: HeadlineWord[][]` (`{t, accent?}`), `delay`, `step` |
| `PhoneFrame` | Marco de teléfono (carcasa, cámara, barra de estado, reflejo) con video de grabación o UI simulada | `video` (ruta public/) o `children`, `width`, `height`, `top` (con karaoke: 580), `tilt`, `float` |
| `TapHand` | Mano SVG original que se desplaza y toca puntos con anillo expansivo | `taps: {x, y, at}[]`, `size`, `enterFrom` |
| `Magnifier` | Lupa circular con mango que amplía un detalle | `x`, `y`, `size`, `zoom`, `delay`, `children` (diseñado para `size/zoom`) |
| `StepCard` | Tarjeta de paso numerado (círculo + título + descripción) | `n`, `title`, `subtitle`, `accent`, `delay`, `top` |
| `AlertBanner` | Píldora roja de advertencia + marcas X en cascada | `text`, `delay`, `xs`, `top` |
| `DiagramFlow` | Elemento que viaja de A a B con rastro que se dibuja + anillo de llegada | `from`, `to`, `startFrame`, `durationInFrames`, `traveler` |
| `CountUp` | Contador que sube en 8–18 fotogramas y aterriza exacto (adaptado de remotion-video-templates + facecammaxxing) | `to`, `from`, `label`, `prefix`, `suffix`, `delay`, `durationInFrames` |
| `QuoteCard` | Tarjeta de cita/testimonio con entrada escalonada (adaptada de reactvideoeditor/remotion-templates) | `quote`, `attribution`, `role`, `top`, `delay`, `size`, `card` |
| `ParallaxStill` / `cameraMove` | Foto fija con movimiento de cámara y parallax 2.5D (adaptado de free-remotion-pipeline) | `bg`, `fg`, `move`: push-in \| snap-zoom \| lateral-pan \| low-angle-hero \| dolly-zoom \| extreme-closeup, `durationInFrames`, `sourceWidth`, `seed` |
| `SweepTransition` | Panel de color que barre la pantalla (cambia la escena en el punto medio; uso puntual) | `color`, `durationInFrames`, `delay`, `direction` |
| `Sfx` | Efecto de sonido colocado por su punto de sincronía (ver § SFX) | `id`, `atFrame`, `volume`, `underVO` |

## Transiciones (`transitions/`)

Catálogo curado en `shared/motion/transitions/index.ts`: oficiales de
`@remotion/transitions` (HTML: `fade`, `slide`, `wipe`, `flip`,
`clockWipe`, `iris`; WebGL: `dissolve`, `crosswarp`, `filmBurn`, `ripple`,
`zoomBlur`) + 5 de Remocn (MIT, `transitions/remocn/`: `waveWipe`,
`emberBurn`, `irisWipe`, `whipPan`, `rippleZoom`) + guía de uso
(`TRANSITION_GUIDE`, `REMOCN_TRANSITIONS`).

Reglas de `<TransitionSeries>` (verificadas por stills, 15-nov-2026):

- La transición SOLAPA: total = Σ secuencias − Σ transiciones.
- El reloj local de la escena entrante empieza AL INICIO de la transición.
  Para reels con VO, el contenido de cada escena entrante lleva
  `delay = duración de la transición` para aterrizar en el corte nominal.
- El `offset` de Sequence NO compensa el solape (la escena entrante sale
  NEGRA durante la transición). No usarlo.
- Duración recomendada: 10–15 fotogramas. Una transición por corte.
- `@remotion/light-leaks` se evaluó y se DESCARTÓ (deprecado en 4.0.530,
  no es una presentación de TransitionSeries). No instalarlo.

## SFX (`sfx/`)

Biblioteca del hub: 320 sonidos WAV 48 kHz/24-bit (wyzowl/sfx-kit, CC0) en
`~/workspace/remotion-hub/assets/sfx/` — FUERA del repo. Índice con
metadatos en `sfx/index.ts` (`SFX_INDEX`, `sfxSearch()`,
`sfxByCategory()`, `SFX_CATEGORIES`).

```bash
# Copiar los sonidos elegidos al public/ del proyecto:
node shared/motion/sfx/add-sfx.mjs <proyecto> <id...> [<id...>]
```

```tsx
// Colocar por sync point: atFrame = fotograma del evento visual.
<Sfx id="whoosh-medium-medium" atFrame={317} underVO />
<Sfx id="pop-medium-in" atFrame={275} underVO />
```

## Flujo de ilustraciones (style prompt bloqueado)

Las ilustraciones las genera una IA con un **style prompt BLOQUEADO** que se
repite palabra por palabra en cada imagen (sin bloqueo, cada imagen sale de
un estilo distinto). Una ilustración por línea de guion, literal a la VO;
fondo transparente o recortable para el look flotante (si la herramienta no
da alfa, recorta con `@imgly/background-removal-node`, ONNX local). El
código las anima: flotar, parallax (`ParallaxStill`), escala con spring,
brillo. Plantilla y reglas completas en la skill `motion_graphics_reels`.

## Uso mínimo (proyecto nuevo)

```tsx
import {AbsoluteFill} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {
  GlowStage, TopKaraoke, KineticHeadline, PhoneFrame, Sfx,
} from '../../../shared/motion';
import {slide, fade} from '../../../shared/motion/transitions';
import {CAPTIONS} from './captions'; // líneas con word_timestamps de Whisper

const T12 = linearTiming({durationInFrames: 12});

export const MainReel: React.FC = () => (
  <AbsoluteFill>
    <GlowStage glow="danger" />
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={150}>
        <KineticHeadline
          lines={[[{t: '3'}, {t: 'DATOS', accent: true}], [{t: 'QUE DEBES SABER'}]]}
          top={330} size={100} delay={6} step={5}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({direction: 'from-right'})} timing={T12} />
      <TransitionSeries.Sequence durationInFrames={210}>
        <PhoneFrame width={540} height={1100} top={580} float={false} delay={14}>
          {/* UI simulada con divs, o video="video/grabacion.mp4" */}
        </PhoneFrame>
      </TransitionSeries.Sequence>
    </TransitionSeries>
    <Sfx id="whoosh-fast-soft" atFrame={150} underVO />
    <TopKaraoke lines={CAPTIONS} top={340} size={72} />
  </AbsoluteFill>
);
```

Nota: en la segunda escena el contenido lleva `delay={14}` (≈ duración de
la transición + 2) para aterrizar en el corte nominal; la duración total
de la serie es 150 + 210 − 12 = 348 fotogramas.

## Reglas del estilo (del análisis)

1. **Una sola idea por frase, una sola imagen por frase.** Texto arriba, UNA
   ilustración en el centro. Nunca dos focos compitiendo.
2. **La palabra cambia cada ~0,5 s, la imagen cada 1–2 s, la escena cada
   10–15 s.** Si un beat dura más de 2 s sin un evento visual, añade uno
   (entrada, cambio de estado, toque, lupa).
3. **El color del fondo narra la emoción:** rojo = peligro, verde = seguro,
   naranja = curiosidad, azul = neutro/tutorial. Cambia con fundido, nunca
   de golpe.
4. **La palabra clave con recuadro azul se reserva a 1 por frase como mucho.**
   Si todo es clave, nada lo es.
5. **Sin música o con música muy baja:** la voz manda; los SFX marcan los
   eventos (pop en titulares, clic en toques, golpe en alertas).
6. **Los cortes caen sobre fronteras de frase de la VO**, no a mitad de idea.

## Demo

`projects/motion-demo/` — MainReel v2 (15 s, 450 f, 1080×1920): 5 escenas
en TransitionSeries (waveWipe/slide/fade/emberBurn), CountUp, teléfono con
lupa y toque, diagrama, 3 SFX por sync point. Render de verificación:
`out/motion-demo-v2-preview.mp4` (540×960). Composiciones de verificación:
`TransitionsTest` (semántica de solape), `TransitionsShowcase` (10
transiciones), `ComponentsTest` (ParallaxStill + QuoteCard).

## Notas técnicas

- Todo el movimiento es determinista (solo depende de `useCurrentFrame` y de
  `seed`): mismo fotograma = mismo resultado. No hay `Math.random` en render.
- Los componentes usan coordenadas de composición 1080×1920. Para otra
  resolución, escala con un wrapper o ajusta las props de tamaño/posición.
- `TopKaraoke` espera líneas preagrupadas con tiempos en SEGUNDOS (los
  `word_timestamps` de faster-whisper, igual que `captions.ts` de Marabana).
  Entre líneas no muestra nada (corte limpio).
- `PhoneFrame float` debe ser `false` cuando hay callouts precisos (el bob
  ±7 px desplaza el punto de toque/lupa). Con karaoke superior, usa
  `top={580}` y recalcula los puntos absolutos (`top + 9 + y` dentro de la
  pantalla).
- Dependencias añadidas al hub para este módulo: `@remotion/transitions`
  4.0.530 (ya estaba), `@remotion/noise` 4.0.530 (deriva de cámara),
  `@paper-design/shaders-react` 0.0.82 Apache-2.0 (shaders de Remocn).
- Skills oficiales de Remotion (13) instaladas en `repo/.agents/` con
  enlaces en `repo/.claude/skills/` y `skills-lock.json` (15-nov-2026).
