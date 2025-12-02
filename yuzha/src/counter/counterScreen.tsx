import React from "react";
import StageThree from "@shared/layer/StageThree";
import "@shared/fonts/taimingda.css";
import { counterUi, systemMessageBg } from "./count";
import CountTap from "./countTap";
import { useCounterValue, counterLogic } from "./countLogic";

if (import.meta.hot) {
  import.meta.hot.accept();
}

export type CounterScreenProps = {
  onBack?: () => void;
};

export default function CounterScreen({ onBack }: CounterScreenProps) {
  const count = useCounterValue();

  return (
    <div
      className="relative flex h-screen w-screen overflow-hidden bg-slate-950 text-white"
      style={{ fontFamily: "Taimingda, sans-serif" }}
    >
      <StageThree />
      <button
        type="button"
        onClick={onBack}
        disabled={!onBack}
        className={counterUi.backButton} // back button position/size
      >
        Back
      </button>
      <button
        type="button"
        className={counterUi.newButton}
        onClick={() => counterLogic.reset()}
      >
        Reset
      </button>
      <div className={counterUi.systemMessageContainer}>
        <img
          src={systemMessageBg}
          alt="System Message"
          className={counterUi.systemMessageImage}
          draggable={false}
        />
        <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white drop-shadow">
          {count}
        </div>
      </div>
      <CountTap />
    </div>
  );
}
