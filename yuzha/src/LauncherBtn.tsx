import React from "react";
import { useLauncherBtnEffect, type LauncherBtnEffectConfig } from "./LauncherBtnEffect";
import { useLauncherBtnGesture } from "./LauncherBtnGesture";

export type ModuleLink = { id: string; label: string; url: string };

function getDefaultModuleLinks(): ModuleLink[] {
  const env = import.meta.env as Record<string, string | undefined>;
  return [
    { id: "0setting", label: "0Setting", url: env.VITE_URL_0SETTING ?? "http://localhost:5001" },
    { id: "1meng", label: "1Meng", url: env.VITE_URL_1MENG ?? "http://localhost:5002" },
    { id: "3database", label: "3Database", url: env.VITE_URL_3DATABASE ?? "http://localhost:5003" },
    { id: "4extra", label: "4Extra", url: env.VITE_URL_4EXTRA ?? "http://localhost:5004" },
    { id: "5rara", label: "5Rara", url: env.VITE_URL_5RARA ?? "http://localhost:5005" },
  ];
}

export type LauncherBtnProps = {
  open: boolean;
  onToggle?: () => void;
  links?: ModuleLink[];
  effect?: LauncherBtnEffectConfig;
  title?: string;
  target?: "_self" | "_blank";
};

export function LauncherBtnPanel(props: LauncherBtnProps) {
  const { open, onToggle, title = "Modules", target = "_self" } = props;
  const [hovering, setHovering] = React.useState(false);
  const [pressing, setPressing] = React.useState(false);

  const vis = useLauncherBtnEffect({ open, hovering, pressing }, props.effect);

  const links = React.useMemo(() => props.links ?? getDefaultModuleLinks(), [props.links]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onToggle?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onToggle]);

  if (!open) return null;

  return (
    <div className={vis.panelClass} style={vis.panelStyle}>
      <span className={vis.badgeClass}>{title}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target={target}
            rel={target === "_blank" ? "noreferrer" : undefined}
            className={vis.buttonClass}
            style={vis.buttonStyle}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onMouseDown={() => setPressing(true)}
            onMouseUp={() => setPressing(false)}
            onTouchStart={() => setPressing(true)}
            onTouchEnd={() => setPressing(false)}
            data-mod={link.id}
          >
            {link.label}
          </a>
        ))}
        <button
          type="button"
          className={vis.buttonClass}
          style={vis.buttonStyle}
          onClick={onToggle}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onMouseDown={() => setPressing(true)}
          onMouseUp={() => setPressing(false)}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export function LauncherBtnDock(
  props: Omit<LauncherBtnProps, "open" | "onToggle"> & { overlayClassName?: string },
) {
  const gesture = useLauncherBtnGesture();
  return (
    <>
      <div
        {...gesture.bindTargetProps()}
        className={props.overlayClassName ?? "launcher-overlay"}
      />
      <LauncherBtnPanel
        open={gesture.open}
        onToggle={gesture.toggle}
        links={props.links}
        effect={props.effect}
        title={props.title}
        target={props.target}
      />
    </>
  );
}
