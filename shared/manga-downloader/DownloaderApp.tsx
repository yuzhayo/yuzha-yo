import { useState, useEffect } from "react";
import type { PhaseState, HarvestedImage } from "@shared/manga-types";
import PhasePanel from "./PhasePanel";

function idle(): PhaseState { return { status: "idle" }; }

export default function DownloaderApp() {
  const [url, setUrl] = useState("");
  const [outputDir, setOutputDir] = useState("");

  const [phase1, setPhase1] = useState<PhaseState>(idle());
  const [phase2, setPhase2] = useState<PhaseState & { imageCount?: number }>(idle());
  const [phase3, setPhase3] = useState<PhaseState & { imageCount?: number }>(idle());
  const [phase4, setPhase4] = useState<PhaseState & { done?: number; total?: number; file?: string }>(idle());

  const [harvested, setHarvested] = useState<HarvestedImage[]>([]);

  // Subscribe to push events from main process once
  useEffect(() => {
    window.api.onPhaseEvent((event) => {
      if (event.type === "scroll-progress") {
        setPhase2((p) => ({
          ...p,
          message: `Height ${event.height}px · ${event.images} images · stable ${event.stable}/${8}`,
        }));
      } else if (event.type === "fetch-progress") {
        setPhase4((p) => ({ ...p, done: event.done, total: event.total,
          message: `Downloading ${event.done}/${event.total}…` }));
      } else if (event.type === "compile-done") {
        setPhase4({ status: "done", file: event.file,
          message: `${event.pages} pages saved, ${event.skipped} skipped → ${event.file}` });
      } else if (event.type === "phase-error") {
        // handled per-phase in catch blocks
      }
    });
  }, []);

  async function handlePhase1() {
    if (!url.trim()) return;
    setPhase1({ status: "running", message: "Opening scraper…" });
    setPhase2(idle()); setPhase3(idle()); setPhase4(idle());
    setHarvested([]);
    try {
      await window.api.phaseOpen(url.trim());
      setPhase1({ status: "done", message: "Scraper open and page loaded." });
    } catch (err) {
      setPhase1({ status: "error", message: String(err) });
    }
  }

  async function handlePhase2() {
    setPhase2({ status: "running", message: "Scrolling…" });
    setPhase3(idle()); setPhase4(idle());
    setHarvested([]);
    try {
      const result = await window.api.phaseScroll();
      setPhase2({ status: "done", imageCount: result.imageCount,
        message: `Scroll complete · ${result.imageCount} images detected` });
    } catch (err) {
      setPhase2({ status: "error", message: String(err) });
    }
  }

  async function handlePhase3() {
    setPhase3({ status: "running", message: "Harvesting images…" });
    setPhase4(idle());
    setHarvested([]);
    try {
      const result = await window.api.phaseHarvest();
      setHarvested(result.images);
      setPhase3({ status: "done", imageCount: result.images.length,
        message: `${result.images.length} images harvested` });
    } catch (err) {
      setPhase3({ status: "error", message: String(err) });
    }
  }

  async function handlePhase4() {
    if (!outputDir || harvested.length === 0) return;
    setPhase4({ status: "running", message: "Starting download…" });
    try {
      await window.api.phaseCompile(harvested, outputDir);
      // result handled via onPhaseEvent compile-done
    } catch (err) {
      setPhase4({ status: "error", message: String(err) });
    }
  }

  async function handleReset() {
    await window.api.phaseClose().catch(() => {});
    setPhase1(idle()); setPhase2(idle()); setPhase3(idle()); setPhase4(idle());
    setHarvested([]);
  }

  const allDone = phase4.status === "done";
  const anyError = [phase1, phase2, phase3, phase4].some((p) => p.status === "error");

  return (
    <div className="h-full flex flex-col bg-neutral-950 text-white overflow-hidden">

      {/* Top bar */}
      <div className="flex-shrink-0 p-4 border-b border-neutral-800 bg-neutral-900 space-y-2">
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="Chapter URL…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm
              text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={() => window.api.pickFolder().then((d) => { if (d) setOutputDir(d); })}
            className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-sm text-white transition-colors"
          >
            📁 Folder
          </button>
          <span className="flex-1 text-sm text-neutral-400 truncate">
            {outputDir || "No folder selected"}
          </span>
          {(allDone || anyError) && (
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-sm text-white transition-colors"
            >
              ↺ Reset
            </button>
          )}
          {phase4.status === "done" && (
            <button
              type="button"
              onClick={() => window.api.openFolder(outputDir)}
              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 rounded text-sm text-white transition-colors"
            >
              📂 Open Folder
            </button>
          )}
        </div>
      </div>

      {/* Phase panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <PhasePanel
          index={1}
          label="Open Scraper"
          status={phase1.status}
          detail={phase1.message}
          onRun={handlePhase1}
          disabled={false}
        />
        <PhasePanel
          index={2}
          label="Scroll to Load Images"
          status={phase2.status}
          detail={phase2.message}
          onRun={handlePhase2}
          disabled={phase1.status !== "done"}
        />
        <PhasePanel
          index={3}
          label="Harvest Images"
          status={phase3.status}
          detail={phase3.message}
          onRun={handlePhase3}
          disabled={phase2.status !== "done"}
        />
        <PhasePanel
          index={4}
          label="Compile & Download"
          status={phase4.status}
          detail={phase4.message}
          onRun={handlePhase4}
          disabled={phase3.status !== "done" || !outputDir || harvested.length === 0}
        />
      </div>
    </div>
  );
}
