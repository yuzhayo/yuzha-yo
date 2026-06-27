import { useState } from "react";
import type { Chapter, ChapterStatus, Phase } from "../types";
import type { Job } from "./DownloaderApp";

interface Props {
  job: Job;
  onCancel: () => void;
  onOpenFolder: () => void;
}

const STATUS_ICON: Record<ChapterStatus, string> = {
  pending: "⏳",
  loading: "🌐",
  scrolling: "📜",
  fetching: "⬇️",
  packaging: "📦",
  done: "✅",
  error: "❌",
};

const STATUS_TEXT_COLOR: Record<ChapterStatus, string> = {
  pending: "text-slate-500",
  loading: "text-slate-400",
  scrolling: "text-amber-400",
  fetching: "text-blue-400",
  packaging: "text-violet-400",
  done: "text-emerald-400",
  error: "text-red-400",
};

const STATUS_BAR_COLOR: Record<ChapterStatus, string> = {
  pending: "bg-neutral-700",
  loading: "bg-slate-500",
  scrolling: "bg-amber-500",
  fetching: "bg-blue-500",
  packaging: "bg-violet-500",
  done: "bg-emerald-500",
  error: "bg-red-600",
};

function phaseLabel(ch: Chapter): string {
  switch (ch.status) {
    case "pending":
      return "Pending";
    case "loading":
      return "Loading…";
    case "scrolling":
      return "Scrolling…";
    case "fetching":
      return `Fetching ${ch.fetchDone ?? 0}/${ch.fetchTotal ?? 0}`;
    case "packaging":
      return "Packaging…";
    case "done":
      return ch.error ? `Done (${ch.error})` : `Done · ${ch.pages ?? 0} pages`;
    case "error":
      return ch.error ?? "Error";
  }
}

function chapterPct(ch: Chapter): number {
  if (ch.status === "done") return 100;
  if (ch.status === "packaging") return 95;
  if (ch.status === "fetching" && ch.fetchTotal && ch.fetchTotal > 0) {
    return Math.min(90, Math.round(((ch.fetchDone ?? 0) / ch.fetchTotal) * 90));
  }
  if (ch.status === "scrolling") return 15;
  if (ch.status === "loading") return 5;
  if (ch.status === "error") return 100;
  return 0;
}

/**
 * 3-state final job badge:
 *   - green : all chapters succeeded (failed === 0)
 *   - amber : mixed (some succeeded, some failed)
 *   - red   : zero succeeded
 */
function badgeForJob(job: Job): { label: string; cls: string } {
  if (job.phase === "discovering") {
    const label = job.discoverTotal
      ? `Discovering ${job.discoverCurrent}/${job.discoverTotal}`
      : "Discovering…";
    return { label, cls: "bg-amber-600 text-white" };
  }
  if (job.phase === "downloading") {
    return { label: "Downloading", cls: "bg-blue-600 text-white" };
  }
  if (job.phase === "error") {
    return { label: "Error", cls: "bg-red-700 text-white" };
  }
  // phase === "done"
  const succeeded = job.succeeded ?? 0;
  const failed = job.failed ?? 0;
  if (failed === 0 && succeeded > 0) {
    return { label: "Done", cls: "bg-emerald-600 text-white" };
  }
  if (succeeded === 0 && failed > 0) {
    return { label: "Failed", cls: "bg-red-700 text-white" };
  }
  if (failed > 0 && succeeded > 0) {
    return { label: `Partial ${succeeded}/${succeeded + failed}`, cls: "bg-amber-600 text-white" };
  }
  return { label: "Done", cls: "bg-emerald-600 text-white" };
}

function jobBarColor(job: Job): string {
  const b = badgeForJob(job);
  if (b.cls.includes("emerald")) return "bg-emerald-500";
  if (b.cls.includes("red")) return "bg-red-500";
  if (b.cls.includes("amber")) return "bg-amber-500";
  return "bg-blue-500";
}

export default function JobCard({ job, onCancel, onOpenFolder }: Props) {
  const [expanded, setExpanded] = useState(true);
  const pct = job.total > 0 ? Math.round((job.done / job.total) * 100) : 0;
  const isActive = job.phase === "discovering" || job.phase === "downloading";
  const badge = badgeForJob(job);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
      {/* Job-level progress bar */}
      <div className="h-1 bg-neutral-800">
        <div
          className={`h-full transition-all duration-300 ${jobBarColor(job)}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${badge.cls}`}>
          {badge.label}
        </span>
        <span className="flex-1 text-sm text-neutral-300 truncate">{job.startUrl}</span>
        <span className="text-xs text-neutral-500 tabular-nums">
          {job.done}/{job.total}
        </span>
        {isActive ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs px-2 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-neutral-300 transition-colors"
          >
            Cancel
          </button>
        ) : (
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
        <div className="border-t border-neutral-800 max-h-72 overflow-y-auto">
          {job.chapterOrder.map((url) => {
            const ch = job.chapters.get(url);
            if (!ch) return null;
            const pctCh = chapterPct(ch);
            const hasErrorTooltip = ch.status === "error" || (ch.status === "done" && ch.error);
            return (
              <div key={url} className="px-4 py-2 border-b border-neutral-800/50">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm ${STATUS_TEXT_COLOR[ch.status]} ${hasErrorTooltip ? "cursor-help" : ""}`}
                    title={hasErrorTooltip ? ch.error : undefined}
                  >
                    {STATUS_ICON[ch.status]}
                  </span>
                  <span className="flex-1 text-xs text-neutral-300 truncate" title={ch.title || url}>
                    {ch.title || url}
                  </span>
                  <span className={`text-[10px] tabular-nums ${STATUS_TEXT_COLOR[ch.status]}`}>
                    {phaseLabel(ch)}
                  </span>
                </div>
                {/* Per-chapter progress bar */}
                <div className="mt-1 h-0.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${STATUS_BAR_COLOR[ch.status]}`}
                    style={{ width: `${pctCh}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Message (done/error) */}
      {job.message && (
        <div
          className={`px-4 py-2 text-xs border-t border-neutral-800 ${
            badge.cls.includes("red")
              ? "text-red-400"
              : badge.cls.includes("amber")
                ? "text-amber-400"
                : "text-emerald-400"
          }`}
        >
          {job.message}
        </div>
      )}
    </div>
  );
}

// Re-export so the Phase symbol stays referenced if other files import it.
export type { Phase };
