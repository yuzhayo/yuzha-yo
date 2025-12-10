import React from "react";
import { requireAssetUrl } from "@shared/asset/assetResolver";

const prestigeOff = requireAssetUrl("Prestige_SlotBase_Off");
const prestigeOn = requireAssetUrl("Prestige_SlotBase");
const glow = requireAssetUrl("overflow_glow_01");

export type CounterFloatingProps = {
  size?: number;
  screenPosition?: { x: number; y: number };
  onActivate?: () => void;
};

export default function CounterFloating({
  size = 128,
  screenPosition = { x: 24, y: 24 },
  onActivate,
}: CounterFloatingProps) {
  const [active, setActive] = React.useState(false);

  const handlePointerDown = () => setActive(true);
  const handlePointerUp = () => {
    if (active) {
      onActivate?.();
    }
    setActive(false);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " " || event.key === "Enter") {
      setActive(true);
    }
  };
  const handleKeyUp = () => {
    if (active) {
      onActivate?.();
    }
    setActive(false);
  };

  return (
    <div
      className="counter-floating pointer-events-none fixed z-20"
      style={{
        left: screenPosition.x,
        top: screenPosition.y,
      }}
    >
      <div
        className="relative"
        style={{ width: size, height: size, maxWidth: "90vw", maxHeight: "90vh" }}
      >
        <img
          src={glow}
          alt=""
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: active ? 1 : 0,
            transform: active ? "scale(1.6)" : "scale(0.85)",
            transition: active ? "opacity 0.45s ease-out, transform 0.45s ease-out" : "none",
          }}
          draggable={false}
        />
        <button
          type="button"
          className="pointer-events-auto relative z-10 rounded-xl bg-transparent transition hover:scale-[1.02] active:scale-100"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          aria-label="Counter Floating Button"
          style={{
            width: size,
            height: size,
            maxWidth: "90vw",
            maxHeight: "90vh",
            boxShadow: "none",
          }}
        >
          <img
            src={active ? prestigeOn : prestigeOff}
            alt="Counter Floating"
            className="block h-full w-full object-contain"
            draggable={false}
          />
        </button>
      </div>
    </div>
  );
}
