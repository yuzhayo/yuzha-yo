import React from "react";

type Counter2FloatingProps = {
  onClose?: () => void;
};

export default function Counter2Floating({ onClose }: Counter2FloatingProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-[90%] max-w-md bg-slate-900/95 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">Counter2 Info</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Optimized Renderer</h3>
            <p className="text-sm text-slate-400">
              Counter2 uses the shared/layer system for optimized rendering.
              It automatically switches between Three.js (GPU) and Canvas2D (CPU)
              based on device capability.
            </p>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Low-End Device Support</h3>
            <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
              <li>Automatic pixel ratio clamping</li>
              <li>Canvas2D fallback for weak GPUs</li>
              <li>Shared geometry and texture caching</li>
              <li>Efficient animation loop</li>
            </ul>
          </div>

          <div className="p-4 bg-gradient-to-r from-teal-900/30 to-cyan-900/30 rounded-xl border border-teal-700/30">
            <h3 className="text-sm font-medium text-teal-300 mb-1">Performance Mode</h3>
            <p className="text-sm text-teal-400/80">
              Using shared/layer pipeline with automatic device optimization.
            </p>
          </div>
        </div>

        <div className="px-4 py-3 bg-slate-800/30 border-t border-slate-700/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600/80 hover:bg-teal-500/80 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
