import type { ReactNode } from "react";

import "@shared/screen/launcherStyles.css";

export type LauncherGestureProps = {
  label: string;
  keys: Array<string | ReactNode>;
  hint?: string;
  className?: string;
};

export function LauncherGesture({ label, keys, hint, className }: LauncherGestureProps) {
  return (
    <span className={[className, "launcher-gesture"].filter(Boolean).join(" ")}>
      <span>{label}</span>
      <span className="launcher-gesture__keys">
        {keys.map((key, index) => (
          <span key={index} className="launcher-gesture__key">
            {key}
          </span>
        ))}
      </span>
      {hint ? <span className="launcher-gesture__hint">{hint}</span> : null}
    </span>
  );
}
