import React from "react";
import rayTexture from "@shared/asset/alpha_noise_256_wave_22.png";

export type CounterEffectProps = {
  size?: number;
  active?: boolean;
  rays?: number;
};

/**
 * CounterEffect - simple radial aura preview using alpha noise.
 * Duplicates a texture in a ring and scales/fades on activate.
 */
export default function CounterEffect({ size = 320, active = false, rays = 12 }: CounterEffectProps) {
  const angleStep = 360 / rays;
  const rayWidth = size * 1.35;
  const rayHeight = size * 0.38;

  return (
    <div
      className="pointer-events-none relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <style>
        {`
          @keyframes counter-effect-pulse {
            0% { transform: scale(0.9); opacity: 0.1; }
            100% { transform: scale(1.25); opacity: 1; }
          }
        `}
      </style>
      {Array.from({ length: rays }).map((_, index) => {
        const rotation = angleStep * index;
        const scale = active ? 1.5 : 1;
        const opacity = active ? 0.8 : 0.12;
        return (
          <img
            key={rotation}
            src={rayTexture}
            alt=""
            className="absolute left-1/2 top-1/2 mix-blend-screen"
            style={{
              width: rayWidth,
              height: rayHeight,
              transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
              opacity,
              filter: "drop-shadow(0 0 12px rgba(255, 200, 120, 0.5)) blur(2px)",
              transition: "opacity 400ms ease, transform 1.8s ease",
              animation: active ? "counter-effect-pulse 2s ease forwards" : "none",
            }}
            draggable={false}
          />
        );
      })}
    </div>
  );
}
