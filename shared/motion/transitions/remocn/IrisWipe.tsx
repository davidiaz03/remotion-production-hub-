/**
 * Iris circular clásico.
 *
 * PROCEDENCIA: Remocn (github.com/Remocn/remocn), artefacto de registro
 * `iris-wipe`, commit 3d2288f55aa5b85c3af736f0aa09fd40139a056e (2026-11-15), licencia MIT.
 * Adaptación: se quitaron la directiva "use client" y los alias de ruta
 * `@/` (reescritos a importaciones relativas); el resto del código es
 * el del artefacto original. Instalado manualmente desde la caché local
 * `_sources/remocn/` (equivalente a `npx shadcn@latest add @remocn/iris-wipe`).
 */
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import type React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";

export type IrisWipeProps = {
  /** Fill shown outside the iris while it is closed. */
  color?: string;
  /** Horizontal iris center, 0 to 1. */
  centerX?: number;
  /** Vertical iris center, 0 to 1. */
  centerY?: number;
  /** Radius of the held dot, as a percentage of the frame diagonal. */
  holdRadius?: number;
};

export const irisWipeDefaults: Required<IrisWipeProps> = {
  color: "#000000",
  centerX: 0.5,
  centerY: 0.5,
  holdRadius: 12,
};

// circle() percentages resolve against the diagonal / sqrt(2), so 150% covers
// the frame from any center point.
const COVER = 150;
// Progress at which the iris is fully shut and starts opening on the next scene.
const CUT = 0.5;

// One smooth curve instead of keyframes: the circle rushes in from off-frame,
// lingers as a slowly shrinking dot and snaps shut, without ever standing
// still. Easing each keyframe segment separately drops the speed to zero at
// every key, which reads as a stall.
function closingRadius(u: number, hold: number) {
  return hold * (1 - u ** 3) + (COVER - hold) * (1 - u) ** 5;
}

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const IrisWipePresentation: React.FC<
  TransitionPresentationComponentProps<IrisWipeProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const { color, centerX, centerY, holdRadius } = {
    ...irisWipeDefaults,
    ...passedProps,
  };
  const p = presentationProgress;
  const at = `${centerX * 100}% ${centerY * 100}%`;

  if (presentationDirection === "exiting") {
    const radius = closingRadius(Math.min(1, p / CUT), holdRadius);
    return (
      <AbsoluteFill style={{ backgroundColor: color }}>
        <AbsoluteFill style={{ clipPath: `circle(${radius}% at ${at})` }}>
          {children}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  const radius = interpolate(p, [CUT, 1], [0, COVER], {
    ...clamp,
    easing: Easing.bezier(0.45, 0, 0.75, 0.6),
  });
  return (
    <AbsoluteFill style={{ clipPath: `circle(${radius}% at ${at})` }}>
      {children}
    </AbsoluteFill>
  );
};

export function irisWipe(
  props: IrisWipeProps = {},
): TransitionPresentation<IrisWipeProps> {
  return { component: IrisWipePresentation, props };
}
