import React from "react";
import bgArtifactCraftCenter from "@shared/asset/BG_ArtifactCraft_Center.png";

export type TestScreenProps = {
  onBack?: () => void;
};

export default function TestScreen(props: TestScreenProps) {
  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <div className="absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2">
        <img
          src={bgArtifactCraftCenter}
          alt="Artifact Craft center background"
          className="h-full w-full animate-[spin_72s_linear_infinite] object-contain"
        />
      </div>
      {props.onBack && (
        <button
          type="button"
          onClick={props.onBack}
          className="absolute right-6 top-6 z-10 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-black/30 transition hover:bg-blue-500 active:bg-blue-600"
        >
          Back to Main Screen
        </button>
      )}
    </div>
  );
}
