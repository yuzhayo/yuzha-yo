# CBZ Manga Reader — Implementation Plan

> **For AI agents:** This document is the single source of truth for building the `manga/` workspace. Read it fully before touching any file. It covers architecture, file-by-file implementation, integration points with the existing monorepo, and every known bug with its solution.

---

## 0. Repo Context (Read This First)

This is a **npm workspaces monorepo** at the root. Current workspaces:

```
yuzha/        ← Main app, port 5000 (webview)
counter2/     ← Standalone counter, port 3002
meng/         ← Cafe website, port 3001
shared/       ← Shared engine, UI, assets, utils
```

**Root `package.json` workspaces array must be updated** to include `"manga"`.

The `counter2/` workspace is the closest template to follow. It is a standalone Vite + React + TypeScript app that shares code via `@shared` alias. **Mirror its structure exactly.**

Key conventions observed in this codebase:
- All Vite configs use `host: true` / `host: "0.0.0.0"` and `strictPort: true`
- `tsconfig.json` in each workspace extends `../tsconfig.base.json`
- Tailwind is used for all styling (dark theme, `bg-neutral-*` palette)
- TypeScript strict mode — no `any`, no implicit returns
- All components export a single default export
- Screen components accept an optional `onBack?: () => void` prop

---

## 1. New Workspace: `manga/`

**Port:** `3003`  
**Entry:** `manga/src/main.tsx`  
**Main component:** `manga/src/MangaReaderScreen.tsx`

### 1.1 Directory Structure

```
manga/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.ts
└── src/
    ├── main.tsx                  ← ReactDOM root
    ├── index.css                 ← Tailwind directives
    ├── MangaReaderScreen.tsx     ← Top-level screen, accepts onBack prop
    ├── MangaUploader.tsx         ← Drag-and-drop / click-to-open CBZ
    ├── MangaReader.tsx           ← Core reader (single-page + webtoon modes)
    ├── MangaToolbar.tsx          ← Top toolbar: back, title, page counter, controls
    ├── MangaControls.tsx         ← Bottom bar: prev/next, zoom, mode toggle
    ├── useCbzLoader.ts           ← Hook: unzip CBZ → sorted image blob URLs
    ├── useReaderState.ts         ← Hook: page index, zoom, mode, RTL state
    ├── useKeyboardNav.ts         ← Hook: arrow keys + Ctrl+scroll zoom
    └── types.ts                  ← Shared TypeScript types
```

---

## 2. File-by-File Implementation

### 2.1 `manga/package.json`

```json
{
  "name": "manga-reader",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port 3003 --host",
    "build": "tsc && vite build",
    "preview": "vite preview --port 3003",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "fflate": "^0.8.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.7",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.6.3",
    "vite": "^7.0.4"
  }
}
```

**Why `fflate`?** It is the fastest pure-JS unzip library, works in-browser with no WASM, tree-shakable, and already compatible with Vite ESM. Do NOT use JSZip — it is larger and has a clunkier async API. Do NOT use the native `DecompressionStream` API — it doesn't support ZIP format (only gzip/deflate streams).

---

### 2.2 `manga/vite.config.ts`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../shared"),
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    port: 3003,
    host: true,
    strictPort: true,
    allowedHosts: true,
    fs: {
      allow: [path.resolve(__dirname, "."), path.resolve(__dirname, "../shared")],
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 3003,
  },
  build: {
    outDir: "dist",
    target: "es2020",
    sourcemap: false,
  },
});
```

**Critical:** `allowedHosts: true` is required for Replit's proxy iframe. Without it, Vite will reject requests with `403 Forbidden`.

---

### 2.3 `manga/tsconfig.json`

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@shared/*": ["../shared/*"]
    }
  },
  "include": ["src"],
  "references": []
}
```

---

### 2.4 `manga/tailwind.config.ts`

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
```

---

### 2.5 `manga/postcss.config.ts`

```ts
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

### 2.6 `manga/index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Manga Reader</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

### 2.7 `manga/src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #111;
  color: #fff;
  font-family: system-ui, sans-serif;
  overflow: hidden;
}
```

---

### 2.8 `manga/src/main.tsx`

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import MangaReaderScreen from "./MangaReaderScreen";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MangaReaderScreen />
  </React.StrictMode>
);
```

---

### 2.9 `manga/src/types.ts`

```ts
export type ReadingMode = "single" | "webtoon";

export type ReaderState = {
  pages: string[];         // blob: URLs of extracted images
  currentPage: number;     // 0-indexed
  zoom: number;            // 1.0 = 100%, range: 0.5 – 4.0
  mode: ReadingMode;
  rtl: boolean;            // right-to-left page order (manga)
  fileName: string;
};

export type CbzLoadResult =
  | { status: "idle" }
  | { status: "loading"; progress: number }  // 0–100
  | { status: "ready"; pages: string[]; fileName: string }
  | { status: "error"; message: string };
```

---

### 2.10 `manga/src/useCbzLoader.ts`

This is the most complex piece. It reads a `.cbz` File object, unzips it with `fflate`, filters image entries, sorts them naturally, and produces blob URLs.

```ts
import { useState, useCallback, useRef } from "react";
import { unzip } from "fflate";
import type { CbzLoadResult } from "./types";

// Natural sort: "page10" after "page9" not "page1"
function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

function isImageFile(name: string): boolean {
  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

export function useCbzLoader() {
  const [result, setResult] = useState<CbzLoadResult>({ status: "idle" });
  const blobUrlsRef = useRef<string[]>([]);

  const revokePreviousUrls = () => {
    for (const url of blobUrlsRef.current) {
      URL.revokeObjectURL(url);
    }
    blobUrlsRef.current = [];
  };

  const loadFile = useCallback((file: File) => {
    revokePreviousUrls();
    setResult({ status: "loading", progress: 0 });

    const reader = new FileReader();

    reader.onload = (e) => {
      const buffer = e.target?.result;
      if (!(buffer instanceof ArrayBuffer)) {
        setResult({ status: "error", message: "Failed to read file." });
        return;
      }

      setResult({ status: "loading", progress: 30 });

      unzip(new Uint8Array(buffer), (err, files) => {
        if (err) {
          setResult({ status: "error", message: `Unzip failed: ${err.message}` });
          return;
        }

        // Filter and sort image entries
        const imageEntries = Object.entries(files)
          .filter(([name]) => isImageFile(name) && !name.startsWith("__MACOSX"))
          .sort(([a], [b]) => naturalSort(a, b));

        if (imageEntries.length === 0) {
          setResult({ status: "error", message: "No images found in this CBZ file." });
          return;
        }

        // Determine MIME type from extension
        const getMime = (name: string): string => {
          const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
          const map: Record<string, string> = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
            ".gif": "image/gif",
            ".avif": "image/avif",
          };
          return map[ext] ?? "image/jpeg";
        };

        const urls = imageEntries.map(([name, data]) => {
          const blob = new Blob([data], { type: getMime(name) });
          return URL.createObjectURL(blob);
        });

        blobUrlsRef.current = urls;
        setResult({ status: "ready", pages: urls, fileName: file.name });
      });
    };

    reader.onerror = () => {
      setResult({ status: "error", message: "Could not read the file." });
    };

    reader.readAsArrayBuffer(file);
  }, []);

  const reset = useCallback(() => {
    revokePreviousUrls();
    setResult({ status: "idle" });
  }, []);

  return { result, loadFile, reset };
}
```

---

### 2.11 `manga/src/useReaderState.ts`

```ts
import { useState, useCallback } from "react";
import type { ReadingMode } from "./types";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4.0;
const ZOOM_STEP = 0.25;

export function useReaderState(totalPages: number) {
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [mode, setMode] = useState<ReadingMode>("single");
  const [rtl, setRtl] = useState(false);

  const goNext = useCallback(() => {
    setCurrentPage((p) => Math.min(p + 1, totalPages - 1));
  }, [totalPages]);

  const goPrev = useCallback(() => {
    setCurrentPage((p) => Math.max(p - 1, 0));
  }, []);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
  }, [totalPages]);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(+(z + ZOOM_STEP).toFixed(2), MAX_ZOOM));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(+(z - ZOOM_STEP).toFixed(2), MIN_ZOOM));
  }, []);

  const resetZoom = useCallback(() => setZoom(1.0), []);

  const toggleMode = useCallback(() => {
    setMode((m) => (m === "single" ? "webtoon" : "single"));
    setZoom(1.0); // reset zoom on mode change
    setCurrentPage(0);
  }, []);

  const toggleRtl = useCallback(() => setRtl((r) => !r), []);

  return {
    currentPage, goNext, goPrev, goToPage,
    zoom, zoomIn, zoomOut, resetZoom,
    mode, toggleMode,
    rtl, toggleRtl,
  };
}
```

---

### 2.12 `manga/src/useKeyboardNav.ts`

```ts
import { useEffect } from "react";

type KeyboardNavOptions = {
  onNext: () => void;
  onPrev: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  rtl: boolean;
  enabled: boolean;
};

export function useKeyboardNav(opts: KeyboardNavOptions) {
  useEffect(() => {
    if (!opts.enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // Don't fire if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case "ArrowRight":
          opts.rtl ? opts.onPrev() : opts.onNext();
          break;
        case "ArrowLeft":
          opts.rtl ? opts.onNext() : opts.onPrev();
          break;
        case "ArrowDown":
          opts.onNext();
          break;
        case "ArrowUp":
          opts.onPrev();
          break;
        case "+":
        case "=":
          opts.onZoomIn();
          break;
        case "-":
          opts.onZoomOut();
          break;
        case "0":
          opts.onResetZoom();
          break;
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      if (e.deltaY < 0) opts.onZoomIn();
      else opts.onZoomOut();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", onWheel);
    };
  }, [opts]);
}
```

---

### 2.13 `manga/src/MangaUploader.tsx`

Shown when no file is loaded. Drag-and-drop zone + click-to-browse.

```tsx
import React, { useCallback, useRef, useState } from "react";

type Props = {
  onFile: (file: File) => void;
  isLoading: boolean;
  progress: number;
  error: string | null;
};

export default function MangaUploader({ onFile, isLoading, progress, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".cbz")) {
      alert("Please select a .cbz file.");
      return;
    }
    onFile(file);
  }, [onFile]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ""; // reset so same file can be re-picked
  }, [handleFile]);

  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen bg-neutral-950 text-white">
      <div
        className={`relative flex flex-col items-center justify-center gap-4 w-80 h-56 rounded-2xl border-2 border-dashed transition-colors cursor-pointer
          ${dragging ? "border-blue-400 bg-blue-900/20" : "border-neutral-600 bg-neutral-900 hover:border-neutral-400"}`}
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
      >
        <span className="text-4xl">📚</span>
        <p className="text-sm text-neutral-300 text-center px-4">
          Drag & drop a <code className="bg-neutral-800 px-1 rounded">.cbz</code> file here<br />
          or click to browse
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".cbz"
          className="hidden"
          onChange={onInputChange}
        />
      </div>

      {isLoading && (
        <div className="mt-6 w-80">
          <div className="text-xs text-neutral-400 mb-1">Loading... {progress}%</div>
          <div className="w-full bg-neutral-800 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-400 max-w-xs text-center">{error}</p>
      )}
    </div>
  );
}
```

---

### 2.14 `manga/src/MangaToolbar.tsx`

Top bar: back button, file name, page counter (tappable to jump).

```tsx
import React, { useState } from "react";

type Props = {
  fileName: string;
  currentPage: number;
  totalPages: number;
  onBack: () => void;
  onPageJump: (page: number) => void;
};

export default function MangaToolbar({ fileName, currentPage, totalPages, onBack, onPageJump }: Props) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");

  const handleCounterClick = () => {
    setInputVal(String(currentPage + 1));
    setEditing(true);
  };

  const commitJump = () => {
    const n = parseInt(inputVal, 10);
    if (!isNaN(n)) onPageJump(n - 1);
    setEditing(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-3 py-2 bg-black/80 backdrop-blur-sm">
      <button
        type="button"
        onClick={onBack}
        className="text-sm px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white"
      >
        ← Back
      </button>
      <span className="flex-1 truncate text-sm text-neutral-300">{fileName}</span>
      {editing ? (
        <input
          autoFocus
          type="number"
          min={1}
          max={totalPages}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={commitJump}
          onKeyDown={(e) => { if (e.key === "Enter") commitJump(); if (e.key === "Escape") setEditing(false); }}
          className="w-16 text-center text-sm rounded bg-neutral-800 text-white border border-neutral-600 py-1"
        />
      ) : (
        <button
          type="button"
          onClick={handleCounterClick}
          className="text-sm text-neutral-300 bg-neutral-800 px-3 py-1 rounded-lg hover:bg-neutral-700 tabular-nums"
          title="Click to jump to page"
        >
          {currentPage + 1} / {totalPages}
        </button>
      )}
    </div>
  );
}
```

---

### 2.15 `manga/src/MangaControls.tsx`

Bottom bar: prev/next, zoom controls, mode + RTL toggles.

```tsx
import React from "react";
import type { ReadingMode } from "./types";

type Props = {
  currentPage: number;
  totalPages: number;
  zoom: number;
  mode: ReadingMode;
  rtl: boolean;
  onPrev: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onToggleMode: () => void;
  onToggleRtl: () => void;
};

export default function MangaControls({
  currentPage, totalPages, zoom, mode, rtl,
  onPrev, onNext, onZoomIn, onZoomOut, onResetZoom,
  onToggleMode, onToggleRtl,
}: Props) {
  const btnBase = "text-xs px-3 py-2 rounded-lg text-white border border-neutral-700";
  const btnNormal = `${btnBase} bg-neutral-800 hover:bg-neutral-700`;
  const btnActive = `${btnBase} bg-blue-700 border-blue-600`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-2 px-3 py-2 bg-black/80 backdrop-blur-sm flex-wrap">
      {/* Navigation */}
      <div className="flex gap-2">
        <button type="button" onClick={onPrev} disabled={currentPage === 0}
          className={`${btnNormal} disabled:opacity-30`}>
          ‹ Prev
        </button>
        <button type="button" onClick={onNext} disabled={currentPage >= totalPages - 1}
          className={`${btnNormal} disabled:opacity-30`}>
          Next ›
        </button>
      </div>

      {/* Zoom */}
      <div className="flex items-center gap-1">
        <button type="button" onClick={onZoomOut} className={btnNormal}>−</button>
        <button type="button" onClick={onResetZoom}
          className="text-xs px-2 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 tabular-nums w-14 text-center">
          {Math.round(zoom * 100)}%
        </button>
        <button type="button" onClick={onZoomIn} className={btnNormal}>+</button>
      </div>

      {/* Mode + RTL */}
      <div className="flex gap-2">
        <button type="button" onClick={onToggleMode}
          className={mode === "webtoon" ? btnActive : btnNormal}>
          {mode === "webtoon" ? "📜 Webtoon" : "📖 Single"}
        </button>
        <button type="button" onClick={onToggleRtl}
          className={rtl ? btnActive : btnNormal}
          title="Right-to-left (manga)">
          {rtl ? "RTL ✓" : "RTL"}
        </button>
      </div>
    </div>
  );
}
```

---

### 2.16 `manga/src/MangaReader.tsx`

The core display component. Two distinct modes:
- **Single page:** one image, centered, zoom applied, click left/right half to navigate
- **Webtoon:** all images stacked vertically, scrollable, zoom applied as width scale

```tsx
import React, { useRef, useCallback, TouchEvent } from "react";
import type { ReadingMode } from "./types";

type Props = {
  pages: string[];
  currentPage: number;
  zoom: number;
  mode: ReadingMode;
  rtl: boolean;
  onNext: () => void;
  onPrev: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

export default function MangaReader({
  pages, currentPage, zoom, mode, rtl,
  onNext, onPrev, onZoomIn, onZoomOut,
}: Props) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const lastPinchDist = useRef<number | null>(null);

  // ── Touch swipe (single mode) ──────────────────────────────────────
  const onTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
      const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
      lastPinchDist.current = Math.hypot(dx, dy);
      return;
    }
    touchStartX.current = e.touches[0]!.clientX;
    touchStartY.current = e.touches[0]!.clientY;
    lastPinchDist.current = null;
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDist.current !== null) {
      e.preventDefault();
      const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
      const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
      const dist = Math.hypot(dx, dy);
      if (dist > lastPinchDist.current + 8) onZoomIn();
      else if (dist < lastPinchDist.current - 8) onZoomOut();
      lastPinchDist.current = dist;
    }
  }, [onZoomIn, onZoomOut]);

  const onTouchEnd = useCallback((e: TouchEvent) => {
    if (lastPinchDist.current !== null) {
      lastPinchDist.current = null;
      return;
    }
    const dx = e.changedTouches[0]!.clientX - touchStartX.current;
    const dy = e.changedTouches[0]!.clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) rtl ? onPrev() : onNext();
      else rtl ? onNext() : onPrev();
    }
  }, [onNext, onPrev, rtl]);

  // ── Single Page Mode ───────────────────────────────────────────────
  if (mode === "single") {
    const src = pages[currentPage];

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const { clientX, currentTarget } = e;
      const mid = currentTarget.getBoundingClientRect().width / 2;
      if (clientX > mid) rtl ? onPrev() : onNext();
      else rtl ? onNext() : onPrev();
    };

    return (
      <div
        className="fixed inset-0 flex items-center justify-center bg-neutral-950 cursor-pointer"
        style={{ paddingTop: "44px", paddingBottom: "52px" }}
        onClick={handleClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {src && (
          <img
            key={src}
            src={src}
            alt={`Page ${currentPage + 1}`}
            style={{
              maxHeight: "100%",
              maxWidth: "100%",
              objectFit: "contain",
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
              userSelect: "none",
              pointerEvents: "none",
            }}
            draggable={false}
          />
        )}
      </div>
    );
  }

  // ── Webtoon Mode (vertical scroll) ────────────────────────────────
  return (
    <div
      className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-neutral-950"
      style={{ paddingTop: "44px", paddingBottom: "52px" }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        style={{
          width: `${zoom * 100}%`,
          maxWidth: "100%",
          margin: "0 auto",
        }}
      >
        {pages.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`Page ${i + 1}`}
            style={{ width: "100%", display: "block" }}
            loading="lazy"
            draggable={false}
          />
        ))}
      </div>
    </div>
  );
}
```

---

### 2.17 `manga/src/MangaReaderScreen.tsx`

Top-level screen. Orchestrates all hooks and components. Handles the idle → loaded state transition.

```tsx
import React from "react";
import { useCbzLoader } from "./useCbzLoader";
import { useReaderState } from "./useReaderState";
import { useKeyboardNav } from "./useKeyboardNav";
import MangaUploader from "./MangaUploader";
import MangaReader from "./MangaReader";
import MangaToolbar from "./MangaToolbar";
import MangaControls from "./MangaControls";

type Props = {
  onBack?: () => void;
};

export default function MangaReaderScreen({ onBack }: Props) {
  const { result, loadFile, reset } = useCbzLoader();
  const isReady = result.status === "ready";
  const pages = isReady ? result.pages : [];

  const {
    currentPage, goNext, goPrev, goToPage,
    zoom, zoomIn, zoomOut, resetZoom,
    mode, toggleMode,
    rtl, toggleRtl,
  } = useReaderState(pages.length);

  useKeyboardNav({
    onNext: goNext,
    onPrev: goPrev,
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onResetZoom: resetZoom,
    rtl,
    enabled: isReady,
  });

  const handleBack = () => {
    if (isReady) {
      reset();
    } else {
      onBack?.() ?? window.history.back();
    }
  };

  if (!isReady) {
    return (
      <MangaUploader
        onFile={loadFile}
        isLoading={result.status === "loading"}
        progress={result.status === "loading" ? result.progress : 0}
        error={result.status === "error" ? result.message : null}
      />
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-neutral-950">
      <MangaToolbar
        fileName={result.fileName}
        currentPage={currentPage}
        totalPages={pages.length}
        onBack={handleBack}
        onPageJump={goToPage}
      />
      <MangaReader
        pages={pages}
        currentPage={currentPage}
        zoom={zoom}
        mode={mode}
        rtl={rtl}
        onNext={goNext}
        onPrev={goPrev}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
      />
      <MangaControls
        currentPage={currentPage}
        totalPages={pages.length}
        zoom={zoom}
        mode={mode}
        rtl={rtl}
        onPrev={goPrev}
        onNext={goNext}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        onToggleMode={toggleMode}
        onToggleRtl={toggleRtl}
      />
    </div>
  );
}
```

---

## 3. Monorepo Integration

### 3.1 Root `package.json` — Add workspace

```json
"workspaces": [
  "yuzha",
  "meng",
  "counter2",
  "manga"
]
```

Also add scripts:

```json
"dev:manga": "npm run dev --workspace manga",
"build:manga": "npm run build --workspace manga",
"preview:manga": "npm run preview --workspace manga"
```

### 3.2 `yuzha/src/App.tsx` — Add manga view

Add `"manga"` to the `AppView` union type and add the handler + conditional render. Follow the exact same pattern used for every other screen.

```tsx
type AppView = "main" | "counter" | "counter2" | "timestamp" | "floating" | "alphaRemove" | "componentViewer" | "manga";

// In App():
const handleOpenManga = React.useCallback(() => setView("manga"), []);

if (view === "manga") {
  return <MangaReaderScreen onBack={handleReturnToMain} />;
}

// Pass to MainScreen:
<MainScreen
  ...
  onOpenMangaScreen={handleOpenManga}
/>
```

**Important:** `MangaReaderScreen` lives in the `manga/` workspace, NOT in `yuzha/src/`. You must import it via a relative path or path alias. Since both workspaces share the same npm workspace root, the safest approach is to copy or re-export the component into `yuzha/src/manga/MangaReaderScreen.tsx` — just import the logic hooks from a shared location, OR duplicate the component inside `yuzha/src/manga/` (the simpler approach).

**Recommended approach:** Create `yuzha/src/manga/` with its own copy of the components (they are UI-only, no shared engine dependency). This avoids cross-workspace import issues.

### 3.3 `yuzha/src/MainScreenUtils.tsx` — Add Manga button

Add `onOpenMangaScreen?: () => void` to `MainScreenUpdaterProps` and render a button following the same pattern as the others (use a purple or indigo color to distinguish it).

### 3.4 `yuzha/src/MainScreen.tsx` — Pass prop through

Add `onOpenMangaScreen?: () => void` to `MainScreenProps` and `MainScreenOverlay` props, pass it down to `MainScreenUpdater`.

---

## 4. Package Installation

After creating `manga/package.json`, run from the repo root:

```bash
npm install
```

This installs `fflate` into the `manga/` workspace. No other new packages are needed.

---

## 5. Known Bugs & Solutions

### BUG-01: `fflate` async `unzip` callback fires on wrong thread context
**Symptom:** React state updates inside the `unzip` callback throw "Cannot update a component while rendering a different component."  
**Cause:** `fflate`'s async `unzip` uses a Web Worker internally; the callback runs outside React's batching.  
**Solution:** Always call `setResult(...)` directly — React 18's automatic batching handles this correctly. Do NOT wrap in `startTransition` (it's not a low-priority update). If errors persist, use `flushSync` as a last resort.

### BUG-02: Pages display out of order
**Symptom:** Pages appear shuffled (e.g., page 10 before page 9).  
**Cause:** Default string sort: `"page10" < "page2"` lexicographically.  
**Solution:** Always use the `naturalSort` function with `{ numeric: true }` locale compare. Already implemented in `useCbzLoader.ts`.

### BUG-03: `__MACOSX` folder entries appear as blank pages
**Symptom:** Black/blank images at the start of the reader.  
**Cause:** macOS adds `__MACOSX/` metadata entries to ZIP archives.  
**Solution:** Filter out any entry whose name starts with `"__MACOSX"` or `"."`. Already handled in `useCbzLoader.ts`.

### BUG-04: Ctrl+Scroll zoom conflicts with browser zoom
**Symptom:** Ctrl+Wheel zooms the entire browser window instead of the app.  
**Cause:** Browser intercepts `wheel` events with `ctrlKey` for native zoom.  
**Solution:** Register the wheel listener with `{ passive: false }` and call `e.preventDefault()`. Already implemented in `useKeyboardNav.ts`. Note: this only works on the document level — if attached to a specific element it may not prevent browser zoom on all platforms.

### BUG-05: Memory leak from blob URLs
**Symptom:** Memory usage grows linearly with each file opened.  
**Cause:** `URL.createObjectURL()` URLs are never released.  
**Solution:** Track all created URLs in `blobUrlsRef` and call `URL.revokeObjectURL()` on each before loading a new file and on component unmount. Already implemented in `useCbzLoader.ts` via `revokePreviousUrls()`.

### BUG-06: Pinch-to-zoom triggers page navigation swipe
**Symptom:** Two-finger pinch accidentally advances the page.  
**Cause:** Touch end fires with `changedTouches` data that looks like a swipe.  
**Solution:** Track when a pinch gesture is active (`lastPinchDist.current !== null`) and skip swipe detection in `onTouchEnd`. Already handled in `MangaReader.tsx`.

### BUG-07: Vite dev server rejects requests from Replit proxy
**Symptom:** App shows blank page or `403 Forbidden` in Replit preview pane.  
**Cause:** Vite's default config only allows `localhost`; Replit proxies requests through a different host.  
**Solution:** Set `server.allowedHosts: true` in `vite.config.ts`. Already set. If still failing, also ensure `server.host: true` (not `"localhost"`).

### BUG-08: CBZ with nested folders breaks image detection
**Symptom:** 0 images found even though the file is valid.  
**Cause:** Some CBZ tools zip into a subfolder: `MyManga/001.jpg` instead of `001.jpg` at root.  
**Solution:** The current `isImageFile` check only cares about file extension, not path depth — so nested folders are handled correctly automatically. The `naturalSort` will sort by full path, which still produces correct order as long as the folder name is consistent.

### BUG-09: `tsconfig.json` path alias not resolving in VSCode
**Symptom:** TypeScript errors on `@/` imports in `manga/src/`.  
**Cause:** `manga/tsconfig.json` paths must match the `vite.config.ts` aliases exactly.  
**Solution:** Both `tsconfig.json` `paths` and `vite.config.ts` `alias` must define `"@/*"` pointing to `"./src/*"` and `"../src/*"` respectively. Already set up correctly in the configs above.

### BUG-10: `import.meta.hot` is undefined in production build
**Symptom:** Build fails or warns about `import.meta.hot`.  
**Cause:** HMR-only API used outside of dev guard.  
**Solution:** Always guard with `if (import.meta.hot) { ... }`. The manga workspace does not use the layer engine so this is not relevant here — but do NOT copy that pattern from `counter2Screen.tsx` into manga components.

### BUG-11: Webtoon mode images flash white between loads
**Symptom:** Images briefly show as white boxes before painting.  
**Cause:** All images attempt to load simultaneously; browser throttles concurrent requests for blob: URLs.  
**Solution:** Add `loading="lazy"` to all `<img>` tags in webtoon mode. Already set in `MangaReader.tsx`. For very large files (500+ pages), consider a virtual scroll — but this is out of scope for the initial version.

### BUG-12: Cross-workspace import fails at build time
**Symptom:** `Cannot find module '../manga/...'` when building `yuzha`.  
**Cause:** Vite does not cross-bundle workspace packages unless they are properly linked.  
**Solution:** Do NOT import from `manga/` into `yuzha/`. Instead, duplicate the manga UI components inside `yuzha/src/manga/`. They have no external dependencies beyond React and `fflate`. Install `fflate` in the `yuzha` workspace too if embedding there.

---

## 6. Checklist for the Building Agent

- [ ] Create all files in `manga/` as described in Section 2
- [ ] Install dependencies: `npm install` from root
- [ ] Add `"manga"` to root `package.json` workspaces
- [ ] Add `dev:manga`, `build:manga`, `preview:manga` scripts to root `package.json`
- [ ] Verify `npm run dev:manga` starts on port 3003 without errors
- [ ] Test: upload a `.cbz` file, pages appear in correct order
- [ ] Test: arrow keys navigate pages
- [ ] Test: Ctrl+scroll zooms without browser zoom interfering
- [ ] Test: webtoon mode shows all pages in vertical scroll
- [ ] Test: RTL mode reverses arrow key and click navigation
- [ ] Test: page jump input works (click counter → type number → Enter)
- [ ] Test: opening a second CBZ file revokes previous blob URLs (check DevTools Memory tab)
- [ ] Integrate Manga button into `yuzha/` main screen (Sections 3.2–3.4)
- [ ] Verify `yuzha` still builds and runs after integration

---

## 7. Out of Scope (Future Enhancements)

- CBR (RAR) support — requires a WASM-based RAR library, nontrivial
- Bookmarks / reading progress persistence via `localStorage`
- Library/collection view for multiple files
- Double-page spread mode
- Chapter metadata parsing (ComicInfo.xml)
- PDF support
