import { useState, useCallback, useRef } from "react";
import { unzip } from "fflate";
import type { CbzLoadResult } from "../types";

function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

function isImageFile(name: string): boolean {
  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

function getMime(name: string): string {
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
}

export function useCbzLoader() {
  const [result, setResult] = useState<CbzLoadResult>({ status: "idle" });
  const blobUrlsRef = useRef<string[]>([]);

  const revokePreviousUrls = () => {
    for (const url of blobUrlsRef.current) {
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    }
    blobUrlsRef.current = [];
  };

  const loadFile = useCallback((file: File) => {
    revokePreviousUrls();
    setResult({ status: "loading", progress: 10 });

    const reader = new FileReader();

    reader.onload = (e) => {
      const buffer = e.target?.result;
      if (!(buffer instanceof ArrayBuffer)) {
        setResult({ status: "error", message: "Failed to read file." });
        return;
      }

      setResult({ status: "loading", progress: 40 });

      unzip(new Uint8Array(buffer), (err, files) => {
        if (err) {
          setResult({ status: "error", message: `Unzip failed: ${err.message}` });
          return;
        }

        const imageEntries = Object.entries(files)
          .filter(
            ([name]) => isImageFile(name) && !name.startsWith("__MACOSX") && !name.startsWith("."),
          )
          .sort(([a], [b]) => naturalSort(a, b));

        if (imageEntries.length === 0) {
          setResult({ status: "error", message: "No images found in this CBZ file." });
          return;
        }

        setResult({ status: "loading", progress: 80 });

        const urls = imageEntries.map(([name, data]) => {
          const blob = new Blob([data.buffer as ArrayBuffer], { type: getMime(name) });
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
