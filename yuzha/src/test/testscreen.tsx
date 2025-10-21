import React from "react";
import bgArtifactCraftCenter from "@shared/asset/BG_ArtifactCraft_Center.png";
import gearMoon from "@shared/asset/GEARMOON.png";

export type TestScreenProps = {
  onBack?: () => void;
};

export default function TestScreen(props: TestScreenProps) {
  const gearSizePx = 140;
  const orbitRadiusPx = 200;
  const gearOrbitDurationSeconds = 20;

  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <div className="absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2">
        <img
          src={bgArtifactCraftCenter}
          alt="Artifact Craft center background"
          className="h-full w-full animate-[spin_72s_linear_infinite] object-contain"
        />
      </div>
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-20"
        style={{
          width: orbitRadiusPx * 2,
          height: orbitRadiusPx * 2,
          marginLeft: -orbitRadiusPx,
          marginTop: -orbitRadiusPx,
        }}
      >
        <div
          className="relative h-full w-full"
          style={{
            animation: `orbit ${gearOrbitDurationSeconds}s linear infinite`,
            transformOrigin: "50% 50%",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) translateY(-${orbitRadiusPx}px)`,
            }}
          >
            <img
              src={gearMoon}
              alt="Orbiting gear moon"
              style={{
                width: gearSizePx,
                height: gearSizePx,
                display: "block",
                animation: `orbit-counter ${gearOrbitDurationSeconds}s linear infinite`,
                transformOrigin: "50% 50%",
              }}
            />
          </div>
        </div>
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
