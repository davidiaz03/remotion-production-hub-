# QuietReel — plantilla tranquila

Para reels de material grabado (testimonios, entrevistas, eventos):
video a pantalla completa, cortes limpios, casi sin gráficos.

## Cómo se crea un proyecto con esta plantilla

```bash
node scripts/editing/new-quiet-reel.mjs mi-reel "Mi reel"
```

Eso crea `projects/mi-reel/` desde esta plantilla, copia los assets
de marca (`shared/brand/`) a `public/` y deja el proyecto listo para
recibir el corte.

## Cómo llega el montaje aquí

1. `paper-edit.py` transcribe la grabación y produce el papel.
2. El usuario elige frases en orden.
3. `assemble-cut.py --project projects/mi-reel` arma el rough cut y lo
   instala: `public/video/rough-cut.mp4`, `src/cut.ts` (EDL + captions
   + lower-thirds) y actualiza `project.json` (`durationInFrames`).

## Qué hace esta composición

| Capa | Origen |
|---|---|
| Video a pantalla completa | `public/video/rough-cut.mp4` (el montaje, con transiciones ya fundidas por ffmpeg) |
| Marca de agua | `img/logo-white.png` (logotipo completo, desde el fotograma 0) |
| Subtítulos karaoke (opcional) | `CUT.captions` vía `BottomKaraoke` |
| Lower-thirds (opcionales) | `CUT.lowerThirds` (se definen en `assemble-cut.py --lower-third`) |
| Cierre | `video/sting-black-2x.mp4` (logo animado, fondo negro) |

## Música y máster

La música NO se mezcla en Remotion: se renderiza la composición, se
extrae su audio como «voz» y se mezcla con `mix.py` (cama musical +
ducking, parámetros V1.5 de marti-fidel: threshold 0,08 / ratio 5 /
release 250 ms). Ver `scripts/editing/README.md` § «Música y máster».

## Antes de entregar

`scripts/audio/audit-audio.py` sobre el proyecto. Veredicto FAIL = no
entregar (regla en `repo/AGENTS.md`).
