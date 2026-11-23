import React from 'react';
import {Img} from 'remotion';
import {
  aspectForAsset,
  cropForAsset,
  imageSrc,
  type Crop,
} from '../assetMap';

/**
 * Rectángulo que ocupa la zona visible de un asset dentro de una caja
 * con contain (misma matemática que DocumentImage): lo usan los
 * componentes que dibujan overlays sobre la imagen (círculos, sellos).
 * Devuelve null si el aspecto no está en assetMap.
 */
export const containRect = (
  asset: string,
  boxW: number,
  boxH: number,
  crop?: Crop,
): {x: number; y: number; w: number; h: number} | null => {
  const aspect = aspectForAsset(asset);
  if (aspect === null) return null;
  const {top, bottom} = crop ?? cropForAsset(asset);
  const visFrac = Math.max(1 - top - bottom, 0.05);
  const sliceAspect = aspect / visFrac;
  const boxAspect = boxW / boxH;
  let w: number;
  let h: number;
  if (boxAspect > sliceAspect) {
    h = boxH;
    w = boxH * sliceAspect;
  } else {
    w = boxW;
    h = boxW / sliceAspect;
  }
  return {x: (boxW - w) / 2, y: (boxH - h) / 2, w, h};
};

/**
 * Imagen de documento con recorte vertical + zoom, calculados con
 * matemática de layout (sin transform CSS, para que el punto de foco
 * quede fijo en pantalla sea cual sea el zoom).
 *
 * - El recorte sale de assetMap.ts (privacidad F9–F12, banner Cuballama,
 *   zonas de cita F1-p2/F5-p2) salvo que se pase `crop` explícito.
 * - `fill=false` (defecto): contain — se ve la zona recortada entera,
 *   sin deformar, centrada en la caja.
 * - `fill=true`: cover — la zona recortada llena la caja; se panea
 *   según `focus` (p. ej. el mensaje de F11 a pantalla completa).
 * - `zoom`: escala sobre la zona visible; `focus` (coords relativas
 *   0–1 sobre la zona visible) es el punto que queda fijo.
 * - `centerFocus`: al hacer zoom, el punto de foco se desplaza hacia
 *   el centro de la caja (proporcional a zoom−1, hasta 1). Sin él, un
 *   picado sobre un detalle del borde (la marca Gemini está en
 *   y≈0,96) dejaría el detalle en el borde del fotograma, tapado por
 *   el karaoke; con él, la lupa lo centra. En Ken Burns (zoom≈1,08)
 *   el desplazamiento es despreciable.
 * - Si el aspecto del archivo no está en assetMap, cae a <Img> con
 *   contain/cover sin recorte.
 */
export const DocumentImage: React.FC<{
  asset: string;
  width: number;
  height: number;
  zoom?: number;
  focus?: {x: number; y: number};
  centerFocus?: boolean;
  fill?: boolean;
  crop?: Crop;
  style?: React.CSSProperties;
}> = ({
  asset,
  width,
  height,
  zoom = 1,
  focus = {x: 0.5, y: 0.5},
  centerFocus = false,
  fill = false,
  crop,
  style,
}) => {
  const aspect = aspectForAsset(asset);
  const src = imageSrc(asset);

  if (aspect === null) {
    // Sin aspecto conocido: sin recorte ni matemática de foco.
    return (
      <div
        style={{
          position: 'relative',
          width,
          height,
          overflow: 'hidden',
          ...style,
        }}
      >
        <Img
          src={src}
          style={{
            width: '100%',
            height: '100%',
            objectFit: fill ? 'cover' : 'contain',
            transform: `scale(${zoom})`,
            transformOrigin: `${focus.x * 100}% ${focus.y * 100}%`,
          }}
        />
      </div>
    );
  }

  const {top, bottom} = crop ?? cropForAsset(asset);
  const visFrac = Math.max(1 - top - bottom, 0.05);
  // Aspecto de la zona visible (recortada).
  const sliceAspect = aspect / visFrac;

  if (!fill) {
    // CONTAIN: la zona visible entera dentro de la caja.
    const boxAspect = width / height;
    let dw: number;
    let dh: number;
    if (boxAspect > sliceAspect) {
      dh = height;
      dw = height * sliceAspect;
    } else {
      dw = width;
      dh = width / sliceAspect;
    }
    const dwZ = dw * zoom;
    const dhZ = dh * zoom;
    // El punto de foco queda fijo en la caja al hacer zoom; con
    // centerFocus, además se desplaza hacia el centro al aumentar el zoom.
    const left0 = (width - dw) / 2;
    const top0 = (height - dh) / 2;
    const pull = centerFocus ? Math.min(Math.max(zoom - 1, 0), 1) : 0;
    const anchorX =
      left0 + focus.x * dw + (width / 2 - (left0 + focus.x * dw)) * pull;
    const anchorY =
      top0 + focus.y * dh + (height / 2 - (top0 + focus.y * dh)) * pull;
    const left = anchorX - focus.x * dwZ;
    const topY = anchorY - focus.y * dhZ;
    return (
      <div
        style={{
          position: 'relative',
          width,
          height,
          overflow: 'hidden',
          ...style,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left,
            top: topY,
            width: dwZ,
            height: dhZ,
            overflow: 'hidden',
          }}
        >
          <Img
            src={src}
            style={{
              position: 'absolute',
              left: 0,
              top: -(dhZ * top) / visFrac,
              width: dwZ,
              height: dhZ / visFrac,
            }}
          />
        </div>
      </div>
    );
  }

  // COVER: la zona visible llena la caja; paneo según el foco.
  const k = Math.max(1, (height * aspect) / (width * visFrac));
  const imgW = width * k * zoom;
  const imgH = imgW / aspect;
  const sliceTop = top * imgH;
  const sliceH = visFrac * imgH;
  const pull = centerFocus ? Math.min(Math.max(zoom - 1, 0), 1) : 0;
  const anchorX = focus.x * width + (width / 2 - focus.x * width) * pull;
  const anchorY = focus.y * height + (height / 2 - focus.y * height) * pull;
  const offX = Math.min(
    Math.max(focus.x * imgW - anchorX, 0),
    Math.max(imgW - width, 0),
  );
  // offY es relativo al inicio de la zona visible (el top del <Img>
  // ya descuenta sliceTop), así que no se suma aquí.
  const offY = Math.min(
    Math.max(focus.y * sliceH - anchorY, 0),
    Math.max(sliceH - height, 0),
  );
  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        ...style,
      }}
    >
      <Img
        src={src}
        style={{
          position: 'absolute',
          left: -offX,
          top: -sliceTop - offY,
          width: imgW,
          height: imgH,
        }}
      />
    </div>
  );
};
