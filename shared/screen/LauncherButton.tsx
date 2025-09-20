import { type ReactNode } from "react";

import "@shared/screen/launcherStyles.css";

export type LauncherButtonProps = {
  title: string;
  description?: string;
  meta?: string;
  icon?: ReactNode;
  href?: string;
  target?: string;
  rel?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
};

function buildClassName(className?: string) {
  return [className, "launcher-button"].filter(Boolean).join(" ");
}

export function LauncherButton(props: LauncherButtonProps) {
  const { title, description, meta, icon, href, target, rel, onClick, disabled, className } = props;

  if (href) {
    return (
      <a
        className={buildClassName(className)}
        href={href}
        target={target}
        rel={rel ?? "noopener noreferrer"}
        aria-disabled={disabled}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
            return;
          }

          onClick?.();
        }}
      >
        {icon ? <span className="launcher-button__icon">{icon}</span> : null}
        <span className="launcher-button__body">
          <span className="launcher-button__title">{title}</span>
          {description ? <span className="launcher-button__description">{description}</span> : null}
        </span>
        {meta ? <span className="launcher-button__meta">{meta}</span> : null}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={buildClassName(className)}
      onClick={onClick}
      disabled={disabled}
    >
      {icon ? <span className="launcher-button__icon">{icon}</span> : null}
      <span className="launcher-button__body">
        <span className="launcher-button__title">{title}</span>
        {description ? <span className="launcher-button__description">{description}</span> : null}
      </span>
      {meta ? <span className="launcher-button__meta">{meta}</span> : null}
    </button>
  );
}
