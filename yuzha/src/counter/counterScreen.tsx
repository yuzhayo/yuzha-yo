import React from "react";
import StageThree from "@shared/layer/StageThree";
import prestigeOff from "@shared/asset/Prestige_SlotBase_Off.png";
import prestigeOn from "@shared/asset/Prestige_SlotBase.png";

if (import.meta.hot) {
  import.meta.hot.accept();
}

export type CounterScreenProps = {
  onBack?: () => void;
};

export default function CounterScreen({ onBack }: CounterScreenProps) {
  const [pressed, setPressed] = React.useState(false);

  const handlePointerDown = () => setPressed(true);
  const handlePointerUp = () => setPressed(false);
  const handlePointerLeave = () => setPressed(false);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === " " || e.key === "Enter") {
      setPressed(true);
    }
  };
  const handleKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === " " || e.key === "Enter") {
      setPressed(false);
    }
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-slate-950 text-white">
      <StageThree />
      <button
        type="button"
        onClick={onBack}
        disabled={!onBack}
        className="absolute right-6 top-6 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-black/30 transition hover:bg-blue-500 active:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60" // back button position/size
      >
        Back
      </button>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center"> {/* center overlay position */}
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          className="pointer-events-auto rounded-xl p-0 shadow-lg shadow-black/30 transition focus:outline-none focus:ring focus:ring-blue-400/60"
        >
          <img
            src={pressed ? prestigeOn : prestigeOff}
            alt="New Action"
            className="block h-84 w-84 object-contain" //size of the button
            draggable={false}
          />
        </button>
      </div>
    </div>
  );
}
