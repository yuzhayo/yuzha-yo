import React from "react";

if (import.meta.hot) {
  import.meta.hot.accept();
}

export type CounterScreenProps = {
  onBack?: () => void;
};

export default function CounterScreen({ onBack }: CounterScreenProps) {
  return (
    <div className="relative flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="absolute left-6 top-6 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-black/30 transition hover:bg-blue-500 active:bg-blue-600"
        >
          Back
        </button>
      )}
      <div className="text-lg text-slate-300">This screen is empty.</div>
    </div>
  );
}
