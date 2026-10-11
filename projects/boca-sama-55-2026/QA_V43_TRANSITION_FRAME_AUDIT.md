# Boca de Samá — V43 transición Carlos → memoria: auditoría cuantitativa
**Borrador · NO PUBLICAR · 11 de octubre de 2026**

## Fuentes exactas
- V42 full draft de Remotion SHA `5af8c86201defaf7a47c7a89f997bfbccc6fe45f`, run `38157847584`, MP4 guardado en Drive scratch.
- V43 90-frame preview `1260-1349`, run `38158814162`, source SHA `0255958c4fad0a524a555f5d1bca93743bfdfe6a`, SHA del MP4 `fd903fff43661de1bddc78316774ee55a0b480a2260ac6ae51e15e33215dd97d`.
- Report V43: 90/90 fotogramas, 1080×1920, decodificación completa y audio presentes, cero intervalos negros registrados en el detector; `visualStatus=PENDING_HUMAN_REVIEW`.
- Drive QA: `boca-sama-V43-transition-compare-V42-V43.jpg` ID `12YNtRHljbdzJcgP-kmgNIcvq-MOsNLN2`, métricas JSON ID `1j3LnLU1EVHSAV40M35i4UPFQYbqNXbHF`. Preview MP4 ID `1jLkQN6wp5za-c5ZJtDOr0d3eU-fqKm5o`.

## Método
Se extrajeron exactamente los fotogramas globales 1284, 1286, ..., 1304 de cada MP4 mediante OpenCV. El clip V43 comienza en el fotograma global 1260; se restó ese offset para evitar confundir índices. Se midió luminancia media en el mismo ROI central `x80:1000, y280:1150`. No se cambió la curva tonal durante la medición.

| Fotograma | Momento | ROI luminancia V42 (0–255) | V43 (0–255) |
| --- | --- | ---: | ---: |
| 1288 | 42.933s | 93.99 | 93.97 |
| **1290** | **43.000s** | **8.15** | **94.04** |
| 1292 | 43.067s | 22.26 | 93.38 |
| 1294 | 43.133s | 36.36 | 93.37 |
| 1296 | 43.200s | 50.38 | 93.37 |
| 1300 | 43.333s | 78.95 | 93.15 |
| 1302 | 43.400s | 93.53 | 93.57 |

**Conclusión limitada:** la transición V43 elimina el descenso de imagen a negro de 12 fotogramas en el segundo 43, preservando la secuencia de Carlos durante el fundido de la escena siguiente. Es un resultado verificado en el ROI y por la comparación de fotogramas, pero no implica aprobación visual/editorial de los 55 segundos.

## Reparación implementada
- La escena de Carlos ahora dura 282 fotogramas en vez de 270, manteniendo su voz original (que termina antes) sin prolongarla artificialmente.
- La escena `Remembrance` continúa empezando en el fotograma 1290; su fundido de 12 frames ahora tiene material saliente debajo.
- Se añadió test de regresión que exige el manejo de 12 fotogramas en todos los cortes de tipo fade/slide. GitHub CI run `38160999899` SUCCESS.

## Render integral siguiente
- V44: run `38161084428`, **en cola al redactar**. No certificar hasta ver resultado, MP4 en Drive, informes de decodificación y comparación en el mismo frame global.
- Los subtítulos permanecen desactivados por falta de cotejo literal de testimonios. No confundir QA técnica con validación institucional.
