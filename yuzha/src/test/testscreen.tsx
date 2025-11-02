import React from "react";

export type TestScreenProps = {
  onBack?: () => void;
};

export default function TestScreen({ onBack }: TestScreenProps) {
  return (
    <div className="relative min-h-screen bg-slate-950">
      <button
        type="button"
        onClick={onBack}
        disabled={!onBack}
        className="absolute right-6 top-6 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-black/30 transition hover:bg-blue-500 active:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Back
      </button>
    </div>
  );
}
