import type { PhaseStatus } from "../types";

interface Props {
  index: number;
  label: string;
  status: PhaseStatus;
  detail?: string;
  onRun: () => void;
  disabled: boolean;
}

const STATUS_ICON: Record<PhaseStatus, string> = {
  idle: "⬜",
  running: "⏳",
  done: "✅",
  error: "❌",
};

const STATUS_COLOR: Record<PhaseStatus, string> = {
  idle: "text-neutral-500",
  running: "text-amber-400",
  done: "text-emerald-400",
  error: "text-red-400",
};

export default function PhasePanel({ index, label, status, detail, onRun, disabled }: Props) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg">
      <span className="text-base w-5 text-center">{STATUS_ICON[status]}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 tabular-nums">Phase {index}</span>
          <span className="text-sm text-white font-medium">{label}</span>
        </div>
        {detail && (
          <p className={`text-xs mt-0.5 truncate ${STATUS_COLOR[status]}`}>{detail}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onRun}
        disabled={disabled || status === "running" || status === "done"}
        className="px-3 py-1.5 text-xs rounded font-medium transition-colors
          bg-rose-700 hover:bg-rose-600 text-white
          disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {status === "running" ? "Running…" : "▶ Run"}
      </button>
    </div>
  );
}
