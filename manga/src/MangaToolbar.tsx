import React, { useState } from "react";

type Props = {
  fileName: string;
  seriesName?: string;
  currentPage: number;
  totalPages: number;
  onBack: () => void;
  onPageJump: (page: number) => void;
};

export default function MangaToolbar({
  fileName,
  seriesName,
  currentPage,
  totalPages,
  onBack,
  onPageJump,
}: Props) {
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

  const displayName = fileName.replace(/\.cbz$/i, "");

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center gap-2 px-3 py-2 bg-black/85 backdrop-blur-sm border-b border-white/5">
      <button
        type="button"
        onClick={onBack}
        className="shrink-0 text-sm px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-white transition-colors"
      >
        ← Back
      </button>

      <div className="flex-1 flex flex-col min-w-0 justify-center">
        {seriesName && (
          <span className="text-[10px] text-blue-400 truncate leading-tight">{seriesName}</span>
        )}
        <span className="text-sm text-neutral-400 truncate leading-tight" title={displayName}>
          {displayName}
        </span>
      </div>

      {editing ? (
        <input
          autoFocus
          type="number"
          min={1}
          max={totalPages}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={commitJump}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitJump();
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-20 shrink-0 text-center text-sm rounded-lg bg-neutral-800 text-white border border-blue-500 py-1 outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={handleCounterClick}
          className="shrink-0 text-sm text-neutral-300 bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-lg tabular-nums transition-colors"
          title="Click to jump to a page"
        >
          {currentPage + 1} <span className="text-neutral-500">/ {totalPages}</span>
        </button>
      )}
    </div>
  );
}
