import { useState } from "react";
import ReaderScreen from "./reader/ReaderScreen";
import DownloaderApp from "./downloader/DownloaderApp";

type Tab = "reader" | "downloader";

export default function App() {
  const [tab, setTab] = useState<Tab>("reader");

  return (
    <div className="flex flex-col w-screen h-screen bg-neutral-950 text-white overflow-hidden">
      <div className="flex border-b border-neutral-800 bg-neutral-900 flex-shrink-0">
        <button
          type="button"
          onClick={() => setTab("reader")}
          className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === "reader"
              ? "border-blue-500 text-white"
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          📖 Reader
        </button>
        <button
          type="button"
          onClick={() => setTab("downloader")}
          className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === "downloader"
              ? "border-rose-500 text-white"
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          ⬇ Downloader
        </button>
      </div>
      <div className={`flex-1 overflow-hidden ${tab === "reader" ? "block" : "hidden"}`}>
        <ReaderScreen />
      </div>
      <div className={`flex-1 overflow-hidden ${tab === "downloader" ? "block" : "hidden"}`}>
        <DownloaderApp />
      </div>
    </div>
  );
}
