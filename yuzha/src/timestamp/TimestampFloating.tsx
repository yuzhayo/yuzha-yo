import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect, useLayoutEffect, useCallback } from "react";
import FloatingBorderless from "@shared/floating/FloatingBorderless";
import type { BoundingRect } from "@shared/floating/FloatingBorderless";
import type { TextAlign, OverlayBounds } from "./types";
import { checkAABBCollision, resolveAllCollisions } from "./types";
export type { TextAlign } from "./types";

export type TimestampFloatingRef = {
  getRelativePosition: () => { x: number; y: number };
  getSize: () => { width: number; height: number };
  setRelativePosition: (pos: { x: number; y: number }) => void;
  getBounds: () => OverlayBounds;
};

export type TimestampFloatingProps = {
  id: string;
  label: string;
  value: string;
  boundingRect: BoundingRect;
  initialRelativePos?: { x: number; y: number };
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  textAlign?: TextAlign;
  noWrap?: boolean;
  shadowEnabled?: boolean;
  otherOverlayBounds?: OverlayBounds[];
  onCollision?: (collidingId: string) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
  showDebugBounds?: boolean;
};

const TimestampFloating = forwardRef<TimestampFloatingRef, TimestampFloatingProps>(
  (
    {
      id,
      label,
      value,
      boundingRect,
      initialRelativePos = { x: 20, y: 20 },
      fontFamily = "sans-serif",
      fontSize = 24,
      color = "#ffffff",
      shadowColor = "#000000",
      shadowBlur = 2,
      shadowOffsetX = 1,
      shadowOffsetY = 1,
      textAlign = "left",
      noWrap = false,
      shadowEnabled = false,
      otherOverlayBounds = [],
      onCollision,
      onSizeChange,
      showDebugBounds = false,
    },
    ref
  ) => {
    const [relativePos, setRelativePos] = useState(initialRelativePos);
    const [size, setSize] = useState({ width: 100, height: 40 });
    const [measuredWidth, setMeasuredWidth] = useState(100);
    const [isColliding, setIsColliding] = useState(false);
    const prevBoundsRef = useRef(boundingRect);
    const textRef = useRef<HTMLDivElement>(null);
    const prevRelativePosRef = useRef(relativePos);

    useEffect(() => {
      prevRelativePosRef.current = relativePos;
    }, [relativePos]);

    useLayoutEffect(() => {
      if (textRef.current) {
        const rect = textRef.current.getBoundingClientRect();
        const shadowActive = shadowEnabled === true;
        const shadowBufferX = shadowActive ? Math.max(0, shadowBlur * 2 + Math.abs(shadowOffsetX) * 2) : 0;
        const shadowBufferY = shadowActive ? Math.max(0, shadowBlur * 2 + Math.abs(shadowOffsetY) * 2) : 0;
        const newWidth = Math.ceil(rect.width) + shadowBufferX;
        const newHeight = Math.ceil(rect.height) + shadowBufferY;
        if (newWidth !== measuredWidth || newHeight !== size.height) {
          setMeasuredWidth(newWidth);
          const newSize = { width: newWidth, height: newHeight };
          setSize(newSize);
          onSizeChange?.(newSize);

          const maxX = Math.max(0, boundingRect.width - newWidth);
          const maxY = Math.max(0, boundingRect.height - newHeight);
          let clampedRelX = Math.max(0, Math.min(relativePos.x, maxX));
          let clampedRelY = Math.max(0, Math.min(relativePos.y, maxY));

          if (otherOverlayBounds.length > 0) {
            const myBounds = {
              x: clampedRelX,
              y: clampedRelY,
              width: newWidth,
              height: newHeight,
            };
            const result = resolveAllCollisions(myBounds, otherOverlayBounds, prevRelativePosRef.current);
            if (result.hasCollision) {
              clampedRelX = Math.max(0, Math.min(result.x, maxX));
              clampedRelY = Math.max(0, Math.min(result.y, maxY));
              setIsColliding(true);
            }
          }

          if (clampedRelX !== relativePos.x || clampedRelY !== relativePos.y) {
            setRelativePos({ x: clampedRelX, y: clampedRelY });
          }
        }
      }
    }, [value, label, fontFamily, fontSize, boundingRect, relativePos, measuredWidth, size.height, shadowBlur, shadowOffsetX, shadowOffsetY, shadowEnabled, otherOverlayBounds, onSizeChange]);

    useEffect(() => {
      prevBoundsRef.current = boundingRect;
    }, [boundingRect]);

    const getBounds = useCallback((): OverlayBounds => ({
      id,
      x: relativePos.x,
      y: relativePos.y,
      width: size.width,
      height: size.height,
    }), [id, relativePos, size]);

    useImperativeHandle(ref, () => ({
      getRelativePosition: () => relativePos,
      getSize: () => size,
      setRelativePosition: (pos: { x: number; y: number }) => setRelativePos(pos),
      getBounds,
    }));

    const handleChange = useCallback((absPos: { x: number; y: number }, _newSize: { width: number; height: number }) => {
      let newRelativeX = absPos.x - boundingRect.x;
      let newRelativeY = absPos.y - boundingRect.y;

      const myBounds = {
        x: newRelativeX,
        y: newRelativeY,
        width: size.width,
        height: size.height,
      };

      const result = resolveAllCollisions(myBounds, otherOverlayBounds, prevRelativePosRef.current);
      newRelativeX = result.x;
      newRelativeY = result.y;

      if (result.hasCollision) {
        otherOverlayBounds.forEach((other) => {
          if (checkAABBCollision({ x: newRelativeX, y: newRelativeY, width: size.width, height: size.height }, other)) {
            onCollision?.(other.id);
          }
        });
      }

      const maxX = Math.max(0, boundingRect.width - size.width);
      const maxY = Math.max(0, boundingRect.height - size.height);
      newRelativeX = Math.max(0, Math.min(newRelativeX, maxX));
      newRelativeY = Math.max(0, Math.min(newRelativeY, maxY));

      const finalBounds = {
        x: newRelativeX,
        y: newRelativeY,
        width: size.width,
        height: size.height,
      };
      const stillColliding = otherOverlayBounds.some((other) => checkAABBCollision(finalBounds, other));
      if (stillColliding) {
        newRelativeX = prevRelativePosRef.current.x;
        newRelativeY = prevRelativePosRef.current.y;
      }

      setIsColliding(result.hasCollision || stillColliding);
      setRelativePos({ x: newRelativeX, y: newRelativeY });
    }, [boundingRect, size, otherOverlayBounds, onCollision]);

    const absolutePos = {
      x: boundingRect.x + relativePos.x,
      y: boundingRect.y + relativePos.y,
    };

    const shadowActive = shadowEnabled === true;
    const textShadow = shadowActive
      ? `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowColor}, ${-shadowOffsetX}px ${-shadowOffsetY}px ${shadowBlur}px ${shadowColor}, ${shadowOffsetX}px ${-shadowOffsetY}px ${shadowBlur}px ${shadowColor}, ${-shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowColor}`
      : "none";

    const paddingX = 2;
    const paddingY = 1;

    const textStyle: React.CSSProperties = {
      fontFamily,
      fontSize: `${fontSize}px`,
      color,
      textShadow,
      whiteSpace: noWrap ? "nowrap" : "pre-wrap",
      userSelect: "none",
      cursor: "move",
      padding: `${paddingY}px ${paddingX}px`,
      textAlign,
      display: "inline-block",
    };

    const containerStyle: React.CSSProperties = {
      transition: "outline 0.15s ease-out",
      ...(isColliding ? {
        outline: "2px solid rgba(255, 100, 100, 0.8)",
        outlineOffset: "-2px",
        borderRadius: "2px",
      } : {}),
      ...(showDebugBounds && !isColliding ? {
        outline: "1px dashed rgba(0, 255, 255, 0.6)",
        outlineOffset: "0px",
      } : {}),
    };

    return (
      <FloatingBorderless
        pos={absolutePos}
        size={size}
        initialSize={size}
        minWidth={20}
        minHeight={20}
        boundingRect={boundingRect}
        disableResize
        zIndex={1100}
        onChange={handleChange}
        style={containerStyle}
      >
        <div ref={textRef} style={textStyle}>
          {value || label}
        </div>
      </FloatingBorderless>
    );
  }
);

TimestampFloating.displayName = "TimestampFloating";

export default TimestampFloating;
