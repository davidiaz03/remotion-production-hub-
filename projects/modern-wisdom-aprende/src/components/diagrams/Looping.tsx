import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT} from '../../theme';
import {DiagramShell} from './DiagramShell';

/**
 * Looping: Escucha → Parafrasea → Confirma, en ciclo. SVG puro: círculo
 * discontinuo con tres nodos y flechas de arco que se dibujan en orden.
 */
const STEPS = [
  {label: 'Escucha', angle: -90},
  {label: 'Parafrasea', angle: 30},
  {label: 'Confirma', angle: 150},
];

const CX = 450;
const CY = 250;
const R = 185;

const point = (angleDeg: number, r: number) => {
  const a = (angleDeg * Math.PI) / 180;
  return {x: CX + r * Math.cos(a), y: CY + r * Math.sin(a)};
};

// Arco de círculo entre dos ángulos (sentido horario), con margen para
// no pisar los nodos.
const arcPath = (from: number, to: number) => {
  const gap = 26;
  const p1 = point(from + gap, R);
  const p2 = point(to - gap, R);
  return `M ${p1.x} ${p1.y} A ${R} ${R} 0 0 1 ${p2.x} ${p2.y}`;
};

export const Looping: React.FC<{
  title?: string;
  notes?: string;
  durationInFrames: number;
}> = ({title, notes, durationInFrames}) => {
  const frame = useCurrentFrame();
  const at = (i: number) =>
    Math.floor(((durationInFrames - 20) * i) / STEPS.length);
  const W = 900;
  const H = 500;
  return (
    <DiagramShell title={title} notes={notes}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{overflow: 'visible'}}
      >
        <defs>
          <marker
            id="loopArrow"
            markerWidth="12"
            markerHeight="12"
            refX="9"
            refY="6"
            orient="auto"
          >
            <polygon points="0,0 12,6 0,12" fill={COLORS.amber} />
          </marker>
        </defs>
        {/* Círculo guía discontinuo */}
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke={COLORS.border}
          strokeWidth={3}
          strokeDasharray="6 10"
        />
        {/* Arcos con flecha, dibujados en orden */}
        {STEPS.map((s, i) => {
          const next = STEPS[(i + 1) % STEPS.length];
          const draw = interpolate(frame, [at(i) + 8, at(i) + 22], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const len = 320; // longitud aprox. del arco (para el dash)
          return (
            <path
              key={i}
              d={arcPath(s.angle, next.angle === -90 ? 270 : next.angle)}
              fill="none"
              stroke={COLORS.amber}
              strokeWidth={4}
              strokeDasharray={len}
              strokeDashoffset={len * (1 - draw)}
              markerEnd={draw > 0.9 ? 'url(#loopArrow)' : undefined}
            />
          );
        })}
        {/* Nodos */}
        {STEPS.map((s, i) => {
          const p = point(s.angle, R);
          const enter = interpolate(frame, [at(i), at(i) + 12], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const w = 250;
          const h = 84;
          return (
            <g key={s.label} opacity={enter}>
              <rect
                x={p.x - w / 2}
                y={p.y - h / 2}
                width={w}
                height={h}
                rx={20}
                fill={COLORS.surface}
                stroke={COLORS.amber}
                strokeWidth={3}
              />
              <text
                x={p.x}
                y={p.y + 13}
                textAnchor="middle"
                fill={COLORS.bone}
                fontFamily={FONT}
                fontSize={38}
                fontWeight={700}
              >
                {s.label}
              </text>
            </g>
          );
        })}
        {/* Centro: la pregunta de confirmación */}
        <text
          x={CX}
          y={CY - 8}
          textAnchor="middle"
          fill={COLORS.gray}
          fontFamily={FONT}
          fontSize={32}
          fontWeight={500}
        >
          «¿Es eso lo que
        </text>
        <text
          x={CX}
          y={CY + 36}
          textAnchor="middle"
          fill={COLORS.gray}
          fontFamily={FONT}
          fontSize={32}
          fontWeight={500}
        >
          quieres decir?»
        </text>
      </svg>
    </DiagramShell>
  );
};
