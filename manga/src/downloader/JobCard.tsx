import React, { useState } from "react";
import type { Chapter, Phase } from "../types";

interface Job {
  id: string;
  startUrl: string;
  phase: Phase;
  discoverCurrent?: number;
  discoverTotal?: number;
  chapters: Map<string, Chapter>;
  chapterOrder: string[];
  done: number;
  total: number;
  message?: string;
  outputDir: string;
}

interface Props {
  job: Job;
  onCancel: () => void;
  onOpenFolder: () => void;
}

const STATUS_ICON: Record<string, string> = {
  pending: "⏳",
  loading: "🌐",
  scrolling: "📜",
  fetching: "⬇️",
  packaging: "📦",
  done: "✅",
  error: "❌",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "text-slate-500",
  loading: "text-slate-400",
  scrolling: "text-amber-400",
  fetching: "text-blue-400",
  packaging: "text-violet-400",
  done: "text-emerald-400",
  error: "text-red-400",
};

const PHASE_BADGE: Record<Phase, string> = {
  discovering: "bg-amber-600 text-white",
  downloading: "bg-blue-600 text-white",
  done: "bg-emerald-600 text-white",
  error: "bg-red-700 text-white",
};

export default function JobCard({ job, onCancel, onOpenFolder }: Props) {
  const [expanded, setExpanded] = useState(true);
  const pct = job.total > 0 ? Math.round((job.done / job.total) * 100) : 0;
  const isActive = job.phase === "discovering" || job.phase === "downloading";

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
      {/* Progress bar */}
      <div className="h-1 bg-neutral-800">
        <div
          className="h-full bg-rose-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${PHASE_BADGE[job.phase]}`}>
          {job.phase === "discovering"
            ? `Discovering${job.discoverTotal ? ` ${job.discoverCurrent}/${job.discoverTotal}` : "…"}`
            : job.phase.charAt(0).toUpperCase() + job.phase.slice(1)}
        </span>
        <span className="flex-1 text-sm text-neutral-300 truncate">{job.startUrl}</span>
        <span className="text-xs text-neutral-500">{job.done}/{job.total}</span>
        {isActive && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs px-2 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-neutral-300 transition-colors"
          >
            Cancel
          </button>
        )}
        {!isActive && (
          <button
            type="button"
            onClick={onOpenFolder}
            className="text-xs px-2 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-neutral-300 transition-colors"
          >
            📂 Open
          </button>
        )}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-neutral-500 hover:text-white transition-colors text-xs"
        >
          {expanded ? "▲" : "▼"}
        </button>
      </div>

      {/* Chapter list */}
      {expanded && job.chapterOrder.length > 0 && (
        <div className="border-t border-neutral-800 max-h-64 overflow-y-auto">
          {job.chapterOrder.map((url) => {
            const ch = job.chapters.get(url);
            if (!ch) return null;
            return (
              <div key={url} className="flex items-center gap-2 px-4 py-1.5 border-b border-neutral-800/50">
                <span className={`text-sm ${STATUS_COLOR[ch.status] ?? "text-slate-500"}`}>
                  {STATUS_ICON[ch.status] ?? "⏳"}
                </span>
                <span className="flex-1 text-xs text-neutral-300 truncate">{ch.title || url}</span>
                {ch.pages != null && (
                  <span className="text-xs text-neutral-500">{ch.pages}p</span>
                )}
                {ch.fetchTotal != null && ch.fetchDone != null && ch.status === "fetching" && (
                  <span className="text-xs text-neutral-500">
                    {ch.fetchDone}/{ch.fetchTotal}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Message (done/error) */}
      {job.message && (
        <div className={`px-4 py-2 text-xs border-t border-neutral-800 ${job.phase === "error" ? "text-red-400" : "text-emerald-400"}`}>
          {job.message}
        </div>
      )}
    </div>
  );
}
