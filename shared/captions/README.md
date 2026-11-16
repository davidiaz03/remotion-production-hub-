# Subtítulos karaoke compartidos (`shared/captions/`)

Un solo flujo de subtítulos para todos los proyectos del hub, sobre
`@remotion/captions` 4.0.543 (auditoría R2, 15-nov-2026). Antes, cada
proyecto copiaba su propio `KaraokeInner` (Pilar V30, Marabana) y
`TopKaraoke` vivía solo en `shared/motion/`.

## Flujo canónico

```
faster-whisper word_timestamps (es)
  → whisperWordsToCaptions()   HubCaption[]  (kw + pageBreakAfter)
  → captionsToLines()          KaraokeLine[] (vía createTikTokStyleCaptions)
  → <BottomKaraoke lines />    presentadora (inferior, Archivo Black, kw rojo)
  → <TopKaraoke lines />       explainer (superior, Poppins, kw en recuadro)
  → linesToSrt(lines)          .srt para accesibilidad / otras plataformas
```

## Reglas que hay que respetar

- **Espacio inicial**: `createTikTokStyleCaptions` solo rompe página en
  palabras cuyo texto empiece por espacio. El conversor lo normaliza
  (todas salvo la primera del documento). Si construyes `Caption[]` a
  mano, mantén esa regla o las páginas saldrán mal agrupadas.
- **Chunks manuales**: los cortes de chunk del guion y las keywords se
  marcan en el conversor (`chunkEndIndices` → `pageBreakAfter`,
  `keywordIndices`/`keywordWords` → `kw`). Sin `pageBreakAfter`, las
  páginas se agrupan solo por duración (1,5 s) y silencios (400 ms).
- **`kw` no existe en `Caption`**: vive en `HubCaption`. `captionsToLines`
  lo recupera por orden (los tokens salen en el orden de entrada).
- **BottomKaraoke = patrón Pilar/Marabana tal cual**: la línea queda
  visible hasta que empieza la siguiente; pop 1.2→1 en 0,1 s desde el
  borde izquierdo; líneas >28 caracteres bajan a 52. No cambiar estos
  números sin verificar contra el máster V1.3.

## Proyectos antiguos

`capSegmentsToLines()` adapta los `captions.ts` con formato CapSegment /
CapChunk / CapWord (Pilar V30, Marabana V1.3) sin regenerar nada. Los
proyectos nuevos generan directamente `HubCaption[]` con el conversor.

## Verificación

Composición `projects/captions-test/`: renderiza `BottomKaraoke` con los
captions reales de Marabana V1.3 y compara fotogramas con el máster
(mismo texto, mismos tiempos, misma posición). Script SRT:
`node scripts/export-srt.mjs <proyecto>` (ver `scripts/`).
