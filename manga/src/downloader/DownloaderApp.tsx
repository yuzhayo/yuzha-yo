import React, { useState, useEffect, useRef } from "react";
import type { Direction, Phase, Chapter } from "../types";
import JobCard from "./JobCard";

interface Job {
  id: string;
  startUrl: string;
  direction: Direction;
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

export default function DownloaderApp() {
  const [url, setUrl] = useState("");
  const [direction, setDirection] = useState<Direction>("next");
  const [count, setCount] = useState(1);
  const [outputDir, setOutputDir] = useState("");
  const [jobs, setJobs] = useState<Map<string, Job>>(new Map());
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (subscribedRef.current) return;
    subscribedRef.current = true;
    window.api.onJobEvent((event) => {
      setJobs((prev) => {
        const next = new Map(prev);
        const job = next.get(event.jobId);
        if (!job) return prev;
        if (event.type === "phase") {
          job.phase = event.phase;
          if (event.chapters) {
            job.chapterOrder = event.chapters.map((c) => c.url);
            for (const c of event.chapters) {
              job.chapters.set(c.url, { ...c, status: "pending" });
            }
          }
        } else if (event.type === "discover") {
          job.discoverCurrent = event.current;
          job.discoverTotal = event.total;
        } else if (event.type === "chapter") {
          job.chapters.set(event.chapter.url, event.chapter);
          if (!job.chapterOrder.includes(event.chapter.url)) {
            job.chapterOrder.push(event.chapter.url);
          }
        } else if (event.type === "progress") {
          job.done = event.done;
          job.total = event.total;
        } else if (event.type === "done") {
          job.phase = "done";
          job.message = event.message;
        } else if (event.type === "error") {
          job.phase = "error";
          job.message = event.message;
        }
        next.set(event.jobId, { ...job });
        return next;
      });
    });
  }, []);

  async function handlePickFolder() {
    const dir = await window.api.pickFolder();
    if (dir) setOutputDir(dir);
  }

  async function handleStart() {
    if (!url.trim() || !outputDir) return;
    const jobId = await window.api.startJob({
      startUrl: url.trim(),
      direction,
      count,
      outputDir,
    });
    setJobs((prev) => {
      const next = new Map(prev);
      next.set(jobId, {
        id: jobId,
        startUrl: url.trim(),
        direction,
        phase: "discovering",
        chapters: new Map(),
        chapterOrder: [],
        done: 0,
        total: count,
        outputDir,
      });
      return next;
    });
    setUrl("");
  }

  const jobList = Array.from(jobs.values()).reverse();

  return (
    <div className="h-full flex flex-col bg-neutral-950 text-white overflow-hidden">
      {/* Input form */}
      <div className="flex-shrink-0 p-4 border-b border-neutral-800 bg-neutral-900 space-y-3">
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="Chapter URL to start from..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
          />
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as Direction)}
            className="bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="next">→ Next</option>
            <option value="prev">← Prev</option>
          </select>
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={handlePickFolder}
            className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-sm text-white transition-colors"
          >
            📁 Choose Folder
          </button>
          <span className="flex-1 text-sm text-neutral-400 truncate">
            {outputDir || "No folder selected"}
          </span>
          <button
            type="button"
            onClick={handleStart}
            disabled={!url.trim() || !outputDir}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm font-medium text-white transition-colors"
          >
            ⬇ Start
          </button>
        </div>
      </div>

      {/* Job list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {jobList.length === 0 && (
          <p className="text-neutral-500 text-sm text-center mt-8">
            No jobs yet. Enter a chapter URL above to start downloading.
          </p>
        )}
        {jobList.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onCancel={() => window.api.cancelJob(job.id)}
            onOpenFolder={() => window.api.openFolder(job.outputDir)}
          />
        ))}
      </div>
    </div>
  );
}
