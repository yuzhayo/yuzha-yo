import React from "react";
import systemMessageBg from "@shared/asset/SystemMessageBg.png";

export type CounterFloatingMessageProps = {
  size?: number;
  screenPosition?: { x: number; y: number };
  children?: React.ReactNode;
};

/**
 * Always-visible floating image for SystemMessageBg.
 * Minimal chrome; positioning/sizing driven by props.
 */
export default function CounterFloatingMessage({
  size = 240,
  screenPosition = { x: 24, y: 24 },
  children,
}: CounterFloatingMessageProps) {
  return (
    <div
      className="pointer-events-none fixed z-20"
      style={{
        left: screenPosition.x,
        top: screenPosition.y,
      }}
    >
      <div
        className="pointer-events-auto relative rounded-xl bg-transparent shadow-lg shadow-black/40"
        style={{
          width: size,
          height: size,
          maxWidth: "90vw",
          maxHeight: "90vh",
        }}
      >
        <img
          src={systemMessageBg}
          alt="System Message"
          className="block h-full w-full object-contain"
          draggable={false}
        />
        {children ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
