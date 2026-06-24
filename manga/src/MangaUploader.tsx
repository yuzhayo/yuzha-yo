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

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith(".cbz")) {
        alert("Please select a .cbz file.");
        return;
      }
      onFile(file);
    },
    [onFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen bg-neutral-950 text-white select-none">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-1">Manga Reader</h1>
        <p className="text-neutral-500 text-sm">Supports .cbz comic book archives</p>
      </div>

      <div
        className={`relative flex flex-col items-center justify-center gap-4 w-80 h-56 rounded-2xl border-2 border-dashed transition-all cursor-pointer
          ${dragging ? "border-blue-400 bg-blue-900/20 scale-105" : "border-neutral-600 bg-neutral-900 hover:border-neutral-400 hover:bg-neutral-800/50"}`}
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onClick={() => !isLoading && inputRef.current?.click()}
      >
        <span className="text-5xl">{dragging ? "📂" : "📚"}</span>
        <div className="text-center px-4">
          <p className="text-sm text-neutral-300">
            Drag & drop a{" "}
            <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-blue-300">.cbz</code> file here
          </p>
          <p className="text-xs text-neutral-500 mt-1">or click to browse</p>
        </div>
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
          <div className="flex justify-between text-xs text-neutral-400 mb-2">
            <span>Extracting pages…</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 max-w-xs bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-3 text-center">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <p className="mt-8 text-xs text-neutral-600">
        Files are processed locally — nothing is uploaded
      </p>
    </div>
  );
}
