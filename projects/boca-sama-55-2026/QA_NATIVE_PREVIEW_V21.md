# V21 — QA nativa de la transición final | 2026-10-11

## Procedencia comprobada
- GitHub Actions [38107196836](https://github.com/davidiaz03/remotion-production-hub-/actions/runs/38107196836), rama `work/boca-sama-55-2026-research`, commit exacto `a58a1967edcea475cd4a899f2a974a645e0debe3`.
- Se renderizaron frames globales **1450–1500** (51 frames; 30fps) de la composición Remotion 1080×1920.
- MP4 H.264 + AAC: **426482 bytes**, SHA-256 `d12f3f115f3fec5fe3cc854fd4f19f553718f0556dbcaa841138f8d48c01a158`.
- QA técnica reporta `actualFrames:51`, `expectedFrames:51`, `decodeOkay:true`, `blackIntervals:[]`, `technicalStatus:passed`, duración contenedor 1.749333 s (video esperado 1.7 s, padding AAC), audio presente.
- Backup de trabajo permanente: [MP4 V21 en Drive](https://drive.google.com/file/d/1TKHL0jH99cTq_cpqiv409kltllx_A5x9/view), [12 fotogramas detallados en Drive](https://drive.google.com/file/d/1PiLnEwtk98d2Dzscu_5WH-x2xSOjwftl/view). El artifact temporal de GitHub no es la única copia.

## Evaluación visual real
Se visualizaron la contact sheet nativa y los frames locales 0, 8, 13, 16, 18, 19, 20, 21, 22, 26, 35 y 50:
1. El plano final previo al logo muestra continuidad del **paisaje costero** desde el primer frame de este intervalo, sin el salto arquitectónico que aparecía en V20.
2. El paisaje y el titular `LA MEMORIA PERMANECE` realizan salida gradual a negro en frames globales ~1453–1469.
3. La marca de agua derivada del último frame oficial está visible durante la escena previa y desaparece cuando comienza la animación en **frame 1470**. No queda doble logo.
4. La estrella roja grande de la animación oficial original aparece limpia sobre negro a partir de frame 1470, sin superposición con el titular de la escena anterior.
5. El aviso `BORRADOR · NO PUBLICAR` sigue activo, correcto para una preview interna. No imprimir en producto aprobado.

**Veredicto:** APROBADA esta transición de cierre en V21. El cambio de in-point a 356.0s y `playbackRate=0.72` ha resuelto el salto detectado en V20 dentro de los fotogramas inspeccionados.

## Límites relevantes
- **Sólo se validaron frames 1450–1500**: esto NO prueba el desarrollo posterior de toda la animación oficial de seis segundos ni el render completo de 55 segundos.
- Se mantiene la obligación de comprobar los nombres/datos de víctimas, licencias, subtítulos de voz real, edición sonora y legibilidad móvil antes del máster.
- La locución y las voces auténticas todavía no están montadas; los testimonios no se pueden considerar publicados o completos.
- Esta revisión no justifica gastar otro render de 1450–1500. Priorizar pruebas de las secuencias NO vistas o de la animación completa sólo cuando se acerque la revisión de entrega.
