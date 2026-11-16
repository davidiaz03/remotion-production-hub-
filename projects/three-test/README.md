# 3D · Prueba de verificación de @remotion/three

Proyecto de prueba (no es un reel): un cubo rojo y un anillo dorado
girando dentro de un `ThreeCanvas`, con `Float` de drei. Demuestra que
el stack 3D funciona en el hub y mide su coste de render.

## Stack

| Paquete | Versión | Nota |
| --- | --- | --- |
| `@remotion/three` | 4.0.543 | Igual que el resto de `@remotion/*` |
| `@react-three/fiber` | 8.17.14 | Última rama compatible con React 18 |
| `@react-three/drei` | 9.122.0 | Última rama compatible con fiber 8 |
| `three` | 0.169.0 | Peer de fiber/drei |

fiber 9 y drei 10 exigen React 19: NO subir sin migrar todo el hub.

## Render de verificación (16-nov-2026)

```bash
node scripts/project.mjs render three-test --mode quick --frames 0-89 --concurrency 1
```

- 3 s, 90 fotogramas, 540×960, 30 fps → `out/three-test-quick.mp4`
  (150 kB, h264).
- **Tiempo total: 55,8 s** (~0,6 s/fotograma con bundling incluido,
  concurrency 1, SwiftShader/CPU en esta VM).
- Fotogramas revisados: f8 (cubo en esquina, 3 caras visibles con
  sombreado), f30/f45/f60 (giro completo, simetría del cubo).

## Reglas para usar 3D en un reel

- Rotación/animación SIEMPRE desde `useCurrentFrame` (determinista).
  Nunca `useFrame` de fiber: el bucle de render de R3F no existe en
  Remotion y el resultado no sería reproducible.
- Geometría procedural o modelos GLTF locales en `public/`. Nada que
  descargue en render (p. ej. `Environment` con HDR remoto): el render
  debe funcionar sin red.
- El coste es alto en CPU (SwiftShader): reserva el 3D para momentos
  cortos (logo, intro, un objeto flotante) y prefiere 540×960 para
  previews. Un reel entero en 3D a 1080×1920 es viable pero lento:
  estima ~1–2 s/fotograma a esa resolución antes de comprometerte.
- Alternativa barata: para un objeto que solo rota en un eje, un PNG
  con `CameraMove`/parallax 2.5D rinde casi lo mismo a una fracción
  del coste (ver `shared/motion/CameraMove.tsx`).
