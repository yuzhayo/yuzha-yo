import React from "react";
import prestigeOff from "@shared/asset/Prestige_SlotBase_Off.png";
import prestigeOn from "@shared/asset/Prestige_SlotBase.png";

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
      className="pointer-events-none fixed z-20"
      style={{
        left: screenPosition.x,
        top: screenPosition.y,
      }}
    >
      <button
        type="button"
        className="pointer-events-auto rounded-xl bg-transparent shadow-lg shadow-black/40 transition hover:scale-[1.02] active:scale-100"
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
  );
}
