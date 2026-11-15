/**
 * Dependencia de wave-wipe y ripple-zoom (Paper shaders).
 *
 * PROCEDENCIA: Remocn (github.com/Remocn/remocn), artefacto de registro
 * `shader-grain-gradient`, commit 3d2288f55aa5b85c3af736f0aa09fd40139a056e (2026-11-15), licencia MIT.
 * Adaptación: se quitaron la directiva "use client" y los alias de ruta
 * `@/` (reescritos a importaciones relativas); el resto del código es
 * el del artefacto original. Instalado manualmente desde la caché local
 * `_sources/remocn/` (equivalente a `npx shadcn@latest add @remocn/shader-grain-gradient`).
 */
import {
  GrainGradient,
  type GrainGradientProps,
} from "@paper-design/shaders-react";
import { useCallback, useState } from "react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const NEUTRAL_COLORS = ["#3a3a52", "#4a4a68", "#5a5a7e"];

export interface ShaderGrainGradientProps
  extends Omit<GrainGradientProps, "frame" | "ref"> {}

export function ShaderGrainGradient({
  speed = 1,
  colors = NEUTRAL_COLORS,
  colorBack = "#12121a",
  softness = 0.6,
  intensity = 0.2,
  noise = 0.15,
  className,
  ...rest
}: ShaderGrainGradientProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const [handle] = useState(() => delayRender("shader-grain-gradient"));
  const gate = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element) return;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => continueRender(handle)),
      );
    },
    [handle],
  );

  return (
    <div
      ref={gate}
      className={className}
      style={{ position: "absolute", inset: 0 }}
    >
      <GrainGradient
        speed={0}
        frame={(frame / fps) * speed * 1000}
        colors={colors}
        colorBack={colorBack}
        softness={softness}
        intensity={intensity}
        noise={noise}
        fit="cover"
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}
