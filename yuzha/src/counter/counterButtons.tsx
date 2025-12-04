import React from "react";
import iconBack from "@shared/asset/general_icon_jiantou1.png";
import iconReset from "@shared/asset/general_icon_shuaxin.png";
import iconSettings from "@shared/asset/general_icon_shezhi.png";

type ScreenPosition = { x: number; y: number };

type BaseButtonProps = {
  screenPosition: ScreenPosition;
  onClick?: () => void;
  size?: number;
  icon: string;
  label: string;
};

const BUTTON_BASE_SIZE = 56;

function FloatingButton({ screenPosition, onClick, size = BUTTON_BASE_SIZE, icon, label }: BaseButtonProps) {
  return (
    <div
      className="pointer-events-none fixed z-30"
      style={{ left: screenPosition.x, top: screenPosition.y }}
    >
      <button
        type="button"
        className="pointer-events-auto rounded-lg bg-transparent shadow-sm shadow-black/30 transition hover:scale-[1.05] active:scale-95"
        onClick={onClick}
        aria-label={label}
        style={{ width: size, height: size }}
      >
        <img src={icon} alt={label} className="h-full w-full object-contain" draggable={false} />
      </button>
    </div>
  );
}

export function CounterBackButton(props: Omit<BaseButtonProps, "icon">) {
  return <FloatingButton {...props} icon={iconBack} label="Back" />;
}

export function CounterResetButton(props: Omit<BaseButtonProps, "icon">) {
  return <FloatingButton {...props} icon={iconReset} label="Reset" />;
}

export function CounterSettingsButton(props: Omit<BaseButtonProps, "icon">) {
  return <FloatingButton {...props} icon={iconSettings} label="Settings" />;
}

export { BUTTON_BASE_SIZE };
