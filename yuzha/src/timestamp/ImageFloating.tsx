import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect, useCallback } from "react";
import FloatingBorderless from "@shared/floating/FloatingBorderless";
import type { BoundingRect } from "@shared/floating/FloatingBorderless";
import type { OverlayBounds } from "./types";
import { checkAABBCollision, resolveAllCollisions } from "./types";

export type ImageFloatingRef = {
  getRelativePosition: () => { x: number; y: number };
  getSize: () => { width: number; height: number };
  setRelativePosition: (pos: { x: number; y: number }) => void;
  setSize: (size: { width: number; height: number }) => void;
  getBounds: () => OverlayBounds;
};

export type ImageFloatingProps = {
  id: string;
  src: string;
  boundingRect: BoundingRect;
  initialRelativePos?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  otherOverlayBounds?: OverlayBounds[];
  onCollision?: (collidingId: string) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
  onDelete?: () => void;
  showDebugBounds?: boolean;
};

const ImageFloating = forwardRef<ImageFloatingRef, ImageFloatingProps>(
  (
    {
      id,
      src,
      boundingRect,
      initialRelativePos = { x: 20, y: 20 },
      initialSize = { width: 100, height: 100 },
      otherOverlayBounds = [],
      onCollision,
      onSizeChange,
      onDelete,
      showDebugBounds = false,
    },
    ref
  ) => {
    const [relativePos, setRelativePos] = useState(initialRelativePos);
    const [size, setSize] = useState(initialSize);
    const [isColliding, setIsColliding] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const prevRelativePosRef = useRef(relativePos);

    useEffect(() => {
      prevRelativePosRef.current = relativePos;
    }, [relativePos]);

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
      setSize: (newSize: { width: number; height: number }) => setSize(newSize),
      getBounds,
    }));

    const handleChange = useCallback((absPos: { x: number; y: number }, newSize: { width: number; height: number }) => {
      let newRelativeX = absPos.x - boundingRect.x;
      let newRelativeY = absPos.y - boundingRect.y;

      const sizeChanged = newSize.width !== size.width || newSize.height !== size.height;
      if (sizeChanged) {
        setSize(newSize);
        onSizeChange?.(newSize);
      }

      const myBounds = {
        x: newRelativeX,
        y: newRelativeY,
        width: newSize.width,
        height: newSize.height,
      };

      const result = resolveAllCollisions(myBounds, otherOverlayBounds, prevRelativePosRef.current);
      newRelativeX = result.x;
      newRelativeY = result.y;

      if (result.hasCollision) {
        otherOverlayBounds.forEach((other) => {
          if (checkAABBCollision({ x: newRelativeX, y: newRelativeY, width: newSize.width, height: newSize.height }, other)) {
            onCollision?.(other.id);
          }
        });
      }

      const maxX = Math.max(0, boundingRect.width - newSize.width);
      const maxY = Math.max(0, boundingRect.height - newSize.height);
      newRelativeX = Math.max(0, Math.min(newRelativeX, maxX));
      newRelativeY = Math.max(0, Math.min(newRelativeY, maxY));

      const finalBounds = {
        x: newRelativeX,
        y: newRelativeY,
        width: newSize.width,
        height: newSize.height,
      };
      const stillColliding = otherOverlayBounds.some((other) => checkAABBCollision(finalBounds, other));
      if (stillColliding) {
        newRelativeX = prevRelativePosRef.current.x;
        newRelativeY = prevRelativePosRef.current.y;
      }

      setIsColliding(result.hasCollision || stillColliding);
      setRelativePos({ x: newRelativeX, y: newRelativeY });
    }, [boundingRect, size, otherOverlayBounds, onCollision, onSizeChange]);

    const absolutePos = {
      x: boundingRect.x + relativePos.x,
      y: boundingRect.y + relativePos.y,
    };

    const containerStyle: React.CSSProperties = {
      position: "relative",
      width: "100%",
      height: "100%",
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

    const imageStyle: React.CSSProperties = {
      width: "100%",
      height: "100%",
      objectFit: "contain",
      userSelect: "none",
      pointerEvents: "none",
    };

    const deleteButtonStyle: React.CSSProperties = {
      position: "absolute",
      top: "-10px",
      right: "-10px",
      width: "24px",
      height: "24px",
      borderRadius: "50%",
      backgroundColor: "rgba(255, 60, 60, 0.9)",
      color: "white",
      border: "2px solid white",
      cursor: "pointer",
      display: isHovered ? "flex" : "none",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "14px",
      fontWeight: "bold",
      zIndex: 10,
    };

    return (
      <FloatingBorderless
        pos={absolutePos}
        size={size}
        initialSize={size}
        minWidth={30}
        minHeight={30}
        boundingRect={boundingRect}
        zIndex={1100}
        onChange={handleChange}
      >
        <div
          style={containerStyle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <img src={src} alt="overlay" style={imageStyle} draggable={false} />
          {onDelete && (
            <button
              style={deleteButtonStyle}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete image"
            >
              ×
            </button>
          )}
        </div>
      </FloatingBorderless>
    );
  }
);

ImageFloating.displayName = "ImageFloating";

export default ImageFloating;
