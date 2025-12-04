import React from "react";

export type CounterEffectDemoProps = {
  onClose?: () => void;
};

export default function CounterEffectDemo({ onClose }: CounterEffectDemoProps) {
  const [label, setLabel] = React.useState("Press to glow");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-6 top-6 rounded bg-slate-800 px-3 py-1 text-sm font-semibold text-white shadow hover:bg-slate-700"
      >
        Close
      </button>
      <button
        type="button"
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-500 active:bg-blue-700"
        onPointerDown={() => setLabel("Release to stop")}
        onPointerUp={() => setLabel("Press to glow")}
        onPointerLeave={() => setLabel("Press to glow")}
      >
        {label}
      </button>
    </div>
  );
}
