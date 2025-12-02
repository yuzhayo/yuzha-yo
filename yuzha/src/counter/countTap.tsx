import React from "react";
import prestigeOff from "@shared/asset/Prestige_SlotBase_Off.png";
import prestigeOn from "@shared/asset/Prestige_SlotBase.png";
import { counterLogic } from "./countLogic";

export default function CountTap() {
  const [pressed, setPressed] = React.useState(false);

  const handlePointerDown = () => setPressed(true);
  const handlePointerUp = () => {
    if (pressed) {
      counterLogic.increment();
    }
    setPressed(false);
  };
  const handlePointerLeave = () => setPressed(false);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === " " || e.key === "Enter") {
      setPressed(true);
    }
  };
  const handleKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === " " || e.key === "Enter") {
      if (pressed) counterLogic.increment();
      setPressed(false);
    }
  };

  const tapContainer =
    "pointer-events-none absolute inset-0 flex items-center justify-center";
  const tapButton =
    "pointer-events-auto rounded-xl p-0 shadow-lg shadow-black/30 transition focus:outline-none";
  const tapImage = "block h-244 w-244 object-contain"; // intentionally large hit area

  return (
    <div className={tapContainer}>
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        className={tapButton}
      >
        <img
          src={pressed ? prestigeOn : prestigeOff}
          alt="New Action"
          className={tapImage}
          draggable={false}
        />
      </button>
    </div>
  );
}
