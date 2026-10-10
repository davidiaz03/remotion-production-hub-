# Componentes Remotion reutilizables

No se recrea un video final para usar estas piezas. Se importan desde `shared/` y sus valores se modifican por propiedades, manteniendo las composiciones reales editables.

- `AnimatedTitle`: `<AnimatedTitle text="Titulo" delay={6}/>`; entrada de texto con interpolacion por fotograma.
- `Caption`: `<Caption text="Narracion" size={44}/>`; subtitulos limpios. Evita fondos solidos grandes.
- `BrandFrame`: marco institucional configurable; los logos deben proceder de assets originales aprobados y verificados.
- `KenBurnsStill`: `<KenBurnsStill src={staticFile('photo.jpg')} durationInFrames={90} fromScale={1.02} toScale={1.10}/>`; movimiento cinematografico ligero y determinista.
- `LowerThird`: `<LowerThird title="Santa Clara" subtitle="Diciembre de 1958" startFrame={8}/>`; rotulo inferior con una linea de acento sin rectangulo opaco.

Ninguno de los componentes nuevos usa `Date.now`, `Math.random` ni URLs en vivo. Las fuentes, imagenes, videos, audio y datos externos deben residir como assets locales verificados por SHA-256. Para fidelidad pixel a pixel, fija archivos tipograficos y prueba el motor/Chromium exactos; Arial del sistema no garantiza pixeles identicos entre equipos.
