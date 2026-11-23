import React from 'react';
import {Img, staticFile} from 'remotion';

/**
 * Marca de agua El Libreto (lockup icono + LIBRETO sobre píldora de
 * tinta, 898×200). Abajo-izquierda desde el fotograma 0, en TODAS las
 * escenas (plan-edicion.md; en 16:9 la esquina superior-izquierda se
 * reserva para las píldoras de documento). Altura 56 px: legible sin
 * competir con el karaoke (centrado) ni con el contenido.
 */
export const Watermark: React.FC = () => (
  <Img
    src={staticFile('images/watermark-lockup-libreto.png')}
    style={{
      position: 'absolute',
      left: 40,
      bottom: 32,
      height: 56,
      width: 'auto',
      opacity: 0.95,
    }}
  />
);
