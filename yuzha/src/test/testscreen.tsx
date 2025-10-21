import React from "react";
import bgArtifactCraftCenter from "@shared/asset/BG_ArtifactCraft_Center.png";
import gearMoon from "@shared/asset/GEARMOON.png";
import lockIcon from "@shared/asset/V3_LockIcon.png";
import hourHand from "@shared/asset/H12.png";

export type TestScreenProps = {
  onBack?: () => void;
};

export default function TestScreen(props: TestScreenProps) {
  const orbitRadiusPx = 200;
  const gearOrbitDurationSeconds = 20;
  const lockOrbitRadiusPx = 300;
  const lockOrbitDurationSeconds = 32;
  const hourOrbitRadiusPx = 240;
  const hourOrbitDurationSeconds = 48;
  const hourSpinDurationSeconds = 12;

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
        className="pointer-events-none absolute left-1/2 top-1/2 z-30"
        style={{
          width: hourOrbitRadiusPx * 2,
          height: hourOrbitRadiusPx * 2,
          marginLeft: -hourOrbitRadiusPx,
          marginTop: -hourOrbitRadiusPx,
        }}
      >
        <div
          className="relative h-full w-full"
          style={{
            animation: `orbit ${hourOrbitDurationSeconds}s linear infinite`,
            transformOrigin: "50% 50%",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) translateY(-${hourOrbitRadiusPx}px)`,
            }}
          >
            <img
              src={hourHand}
              alt="Orbiting hour hand"
              style={{
                display: "block",
                transformOrigin: "50% 50%",
                animation: `spin ${hourSpinDurationSeconds}s linear infinite`,
              }}
            />
          </div>
        </div>
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
                display: "block",
                transformOrigin: "50% 50%",
              }}
            />
          </div>
        </div>
      </div>
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-10"
        style={{
          width: lockOrbitRadiusPx * 2,
          height: lockOrbitRadiusPx * 2,
          marginLeft: -lockOrbitRadiusPx,
          marginTop: -lockOrbitRadiusPx,
        }}
      >
        <div
          className="relative h-full w-full"
          style={{
            animation: `orbit ${lockOrbitDurationSeconds}s linear infinite`,
            transformOrigin: "50% 50%",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) translateY(-${lockOrbitRadiusPx}px)`,
            }}
          >
            <img
              src={lockIcon}
              alt="Orbiting lock icon"
              style={{
                display: "block",
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
