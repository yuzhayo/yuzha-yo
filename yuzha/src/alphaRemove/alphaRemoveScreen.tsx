import React, { useEffect, useMemo, useRef, useState } from "react";

type ImageDataResult = {
  url: string;
  width: number;
  height: number;
};

function processImage(
  img: HTMLImageElement,
  threshold: number,
  curve: number,
): ImageDataResult {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D not supported");
  }
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const t = Math.min(255, Math.max(0, threshold));
  const tNorm = t / 255;
  const buf = data.data;

  for (let i = 0; i < buf.length; i += 4) {
    const r = (buf[i] ?? 0) / 255;
    const g = (buf[i + 1] ?? 0) / 255;
    const b = (buf[i + 2] ?? 0) / 255;
    const lum = Math.max(r, g, b);
    let a = lum <= tNorm ? 0 : (lum - tNorm) / (1 - tNorm);
    a = Math.pow(Math.min(1, Math.max(0, a)), curve);
    buf[i + 3] = Math.round(a * 255);
  }

  ctx.putImageData(data, 0, 0);
  const url = canvas.toDataURL("image/png");
  return { url, width: canvas.width, height: canvas.height };
}

export default function AlphaRemoveScreen({ onBack }: { onBack?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [threshold, setThreshold] = useState(32);
  const [curve, setCurve] = useState(1.4);
  const [preview, setPreview] = useState<ImageDataResult | null>(null);
  const [splitView, setSplitView] = useState(false);
  const [splitPercent, setSplitPercent] = useState(50);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load the image when a file is selected
  useEffect(() => {
    if (!file) {
      setPreview(null);
      imgRef.current = null;
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        const result = processImage(img, threshold, curve);
        setPreview(result);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }, [file]);

  // Reprocess when sliders change and an image is already loaded
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const result = processImage(img, threshold, curve);
    setPreview(result);
  }, [threshold, curve]);

  const downloadName = useMemo(() => {
    if (!file) return "output.png";
    const base = file.name.replace(/\.png$/i, "");
    return `${base}_alpha.png`;
  }, [file]);

  const handleReprocess = () => {
    if (!imgRef.current) return;
    const result = processImage(imgRef.current, threshold, curve);
    setPreview(result);
  };

  const checkerboardStyle: React.CSSProperties = {
    backgroundImage:
      "linear-gradient(45deg, #555 25%, transparent 25%), linear-gradient(-45deg, #555 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #555 75%), linear-gradient(-45deg, transparent 75%, #555 75%)",
    backgroundSize: "16px 16px",
    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-900 text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-800/70 backdrop-blur">
        <div>
          <div className="text-lg font-semibold">Alpha Remover</div>
          <div className="text-xs text-slate-300">Convert black matte to transparent (offline)</div>
        </div>
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded bg-slate-700 px-3 py-1 text-sm hover:bg-slate-600"
            >
              Back
            </button>
          )}
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[340px,1fr]">
        <div className="space-y-3 rounded-lg border border-white/10 bg-slate-800/60 p-4 backdrop-blur">
          <div className="space-y-1">
            <label className="text-sm font-medium">PNG file</label>
            <input
              type="file"
              accept="image/png"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              Threshold (remove darker areas) — {threshold}
            </label>
            <input
              type="range"
              min={0}
              max={255}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full"
            />
          </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Curve (edge hardness) — {curve.toFixed(2)}</label>
              <input
                type="range"
                min={1}
              max={3}
              step={0.05}
              value={curve}
              onChange={(e) => setCurve(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Split preview</label>
            <input
              type="checkbox"
              checked={splitView}
              onChange={(e) => setSplitView(e.target.checked)}
              className="h-4 w-4"
            />
          </div>
          {splitView && (
            <div className="space-y-1">
              <label className="text-sm font-medium">Split position — {splitPercent}%</label>
              <input
                type="range"
                min={0}
                max={100}
                value={splitPercent}
                onChange={(e) => setSplitPercent(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleReprocess}
            disabled={!file}
            className="w-full rounded bg-emerald-600 px-3 py-2 text-sm font-semibold hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-600"
          >
            Reprocess
          </button>

          {preview && (
            <a
              download={downloadName}
              href={preview.url}
              className="block w-full rounded bg-sky-600 px-3 py-2 text-center text-sm font-semibold hover:bg-sky-500"
            >
              Download cleaned PNG
            </a>
          )}

          <p className="text-xs text-slate-300">
            Tip: Increase threshold to remove more fringe; increase curve to sharpen the edge. This runs entirely
            in the browser—no upload.
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-slate-800/40 p-4 backdrop-blur">
          {preview ? (
            <div className="space-y-3">
              <div className="text-sm text-slate-200">
                Preview ({preview.width}x{preview.height})
              </div>
              {!splitView && (
                <div className="grid gap-3 md:grid-cols-2">
                  <div
                    className="overflow-hidden rounded border border-white/10 p-2"
                    style={checkerboardStyle}
                  >
                    <div className="text-xs text-slate-300 mb-1">Original (alpha as-is)</div>
                    <img
                      src={imgRef.current?.src}
                      alt="original"
                      className="w-full"
                      draggable={false}
                    />
                  </div>
                  <div
                    className="overflow-hidden rounded border border-white/10 p-2"
                    style={checkerboardStyle}
                  >
                    <div className="text-xs text-slate-300 mb-1">
                      Processed (checkerboard shows transparency)
                    </div>
                    <img src={preview.url} alt="processed" className="w-full" draggable={false} />
                  </div>
                </div>
              )}
              {splitView && (
                <div
                  className="relative overflow-hidden rounded border border-white/10 p-2"
                  style={checkerboardStyle}
                >
                  <div className="text-xs text-slate-300 mb-1">Split view</div>
                  <div className="relative w-full">
                    <img
                      src={imgRef.current?.src}
                      alt="original"
                      className="w-full"
                      draggable={false}
                      style={{ clipPath: `inset(0 ${100 - splitPercent}% 0 0)` }}
                    />
                    <img
                      src={preview.url}
                      alt="processed"
                      className="absolute inset-0 h-full w-full"
                      style={{ clipPath: `inset(0 0 0 ${splitPercent}%)` }}
                      draggable={false}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-[2px] bg-emerald-400"
                      style={{ left: `${splitPercent}%`, transform: "translateX(-1px)" }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-300">
              Select a PNG to preview and download cleaned output.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
