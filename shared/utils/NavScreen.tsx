/**
 * NavScreen.tsx - Universal Screen Template System
 *
 * A flexible image-based UI component system for Android/mobile devices.
 * Separate from MainScreenUtils with unique type names to avoid conflicts.
 *
 * Key Features:
 * - 3-state image system (normal/pressed/hover)
 * - Fallback to default button styling when no images
 * - "cover" and "contain" fit modes
 * - 2048×2048 stage coordinate positioning
 * - Touch-optimized gesture system
 * - Responsive viewport scaling
 */

import React from "react";
import type { CSSProperties } from "react";

// ===================================================================
// STAGE DIMENSIONS AND COORDINATE SYSTEM
// Using 2048×2048 stage for consistent positioning across devices
// ===================================================================

/** Stage dimensions - 2048×2048 coordinate system */
export const NAV_STAGE_WIDTH = 2048;
export const NAV_STAGE_HEIGHT = 2048;

/** Stage center coordinates */
export const NAV_STAGE_CENTER_X = NAV_STAGE_WIDTH / 2; // 1024
export const NAV_STAGE_CENTER_Y = NAV_STAGE_HEIGHT / 2; // 1024

// ===================================================================
// TYPE DEFINITIONS
// Using NavScreen* naming convention to avoid MainScreen conflicts
// ===================================================================

/** Image fit mode for containers */
export type NavImageFitMode = "cover" | "contain";

/** 3-state image configuration */
export type NavImageState = {
  /** Default state image path */
  normalImage: string | null;
  /** Image when button is pressed */
  pressedImage: string | null;
  /** Optional hover effect (default: null for mobile) */
  hoverImage: string | null;
};

/** Position in stage coordinates (0-2048) */
export type NavPosition = {
  x: number;
  y: number;
};

/** Size in pixels */
export type NavSize = {
  width: number;
  height: number;
};

/** NavSlot component props */
export type NavSlotProps = {
  /** Position in stage coordinates (0-2048) - Adjust position: stage coordinates */
  position: NavPosition;
  /** Size in pixels - Adjust size: width and height in pixels */
  size: NavSize;
  /** Normal state image path (default: null) */
  normalImage?: string | null;
  /** Pressed state image path (default: null) */
  pressedImage?: string | null;
  /** Hover state image path (default: null, primarily for desktop) */
  hoverImage?: string | null;
  /** Image fit mode: "cover" fills container, "contain" fits entire image */
  fitMode?: NavImageFitMode;
  /** Click handler */
  onClick?: () => void;
  /** Optional children (used when no normalImage is provided) */
  children?: React.ReactNode;
  /** Optional custom className */
  className?: string;
  /** Optional custom style */
  style?: CSSProperties;
  /** Test ID for testing */
  testId?: string;
};

/** NavScreenLayout component props */
export type NavScreenLayoutProps = {
  /** Background image path (optional) */
  backgroundImage?: string | null;
  /** Background fit mode */
  backgroundFitMode?: NavImageFitMode;
  /** Children slots */
  children?: React.ReactNode;
  /** Optional custom className */
  className?: string;
  /** Optional custom style */
  style?: CSSProperties;
};

/** Gesture options for hold-tap system */
export type NavGestureOptions = {
  /** Minimum hold duration (ms) for detection. Default 450 ms. */
  holdMs?: number;
  /** Movement tolerance while holding (px). Default 8 px. */
  moveTolerancePx?: number;
};

// ===================================================================
// GESTURE SYSTEM FOR TOUCH INTERACTIONS
// Hold-tap gesture handling optimized for mobile/Android
// ===================================================================

type _PressState = {
  active: boolean;
  id: number | null;
  startX: number;
  startY: number;
  startedAt: number;
  timer: number | null;
  consumed: boolean;
};

/**
 * Hook for managing press/hover states on NavSlot
 * Returns handlers for pointer events and current state
 */
export function useNavSlotState() {
  const [isPressed, setIsPressed] = React.useState(false);
  const [isHovering, setIsHovering] = React.useState(false);

  const handlePointerDown = React.useCallback(() => {
    setIsPressed(true);
  }, []);

  const handlePointerUp = React.useCallback(() => {
    setIsPressed(false);
  }, []);

  const handlePointerLeave = React.useCallback(() => {
    setIsPressed(false);
    setIsHovering(false);
  }, []);

  const handleMouseEnter = React.useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = React.useCallback(() => {
    setIsHovering(false);
  }, []);

  return {
    isPressed,
    isHovering,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
      onPointerLeave: handlePointerLeave,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
  };
}

// ===================================================================
// NAV SLOT COMPONENT
// Main building block for NavScreen - supports images or default styling
// ===================================================================

/**
 * NavSlot - Universal slot/placeholder component
 *
 * Displays images based on state (normal/pressed/hover) or falls back to
 * default button styling when no images are provided.
 *
 * @example
 * ```tsx
 * <NavSlot
 *   position={{ x: 1024, y: 200 }}  // Adjust position: center-top area
 *   size={{ width: 300, height: 80 }}  // Adjust size: button dimensions
 *   normalImage={ImageRegistry.menuButton}
 *   pressedImage={ImageRegistry.menuButtonPressed}
 *   hoverImage={null}  // No hover for mobile
 *   fitMode="cover"
 *   onClick={handleClick}
 * />
 * ```
 */
export const NavSlot = React.memo<NavSlotProps>(function NavSlot(props) {
  const {
    position,
    size,
    normalImage = null,
    pressedImage = null,
    hoverImage = null,
    fitMode = "cover",
    onClick,
    children,
    className = "",
    style = {},
    testId,
  } = props;

  const { isPressed, isHovering, handlers } = useNavSlotState();

  // Determine which image to display based on state
  const currentImage = React.useMemo(() => {
    // Priority: pressed > hover > normal
    if (isPressed && pressedImage) return pressedImage;
    if (isHovering && hoverImage) return hoverImage;
    return normalImage;
  }, [isPressed, isHovering, pressedImage, hoverImage, normalImage]);

  // Base positioning styles
  const positionStyle: CSSProperties = {
    position: "absolute",
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${size.width}px`,
    height: `${size.height}px`,
    transform: "translate(-50%, -50%)", // Center the element on the position point
  };

  // Image display logic
  const hasImage = currentImage !== null;

  // Default button styling (when no image)
  const defaultButtonStyle: CSSProperties = hasImage
    ? {}
    : {
        backgroundColor: "rgba(30, 30, 30, 0.9)",
        border: "2px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "12px",
        padding: "8px 16px",
        color: "white",
        fontSize: "14px",
        fontWeight: "500",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        transition: "all 0.15s ease",
        cursor: "pointer",
      };

  // Press effect for default button
  const pressEffectStyle: CSSProperties =
    !hasImage && isPressed
      ? {
          transform: "translate(-50%, -50%) scale(0.95)",
          opacity: 0.8,
        }
      : {};

  // Image container styles
  const imageStyle: CSSProperties = hasImage
    ? {
        width: "100%",
        height: "100%",
        objectFit: fitMode,
        pointerEvents: "none",
        userSelect: "none",
      }
    : {};

  const combinedStyle: CSSProperties = {
    ...positionStyle,
    ...defaultButtonStyle,
    ...pressEffectStyle,
    ...style,
  };

  return (
    <div
      className={`nav-slot ${className}`}
      style={combinedStyle}
      onClick={onClick}
      data-testid={testId}
      {...handlers}
    >
      {hasImage ? (
        <img src={currentImage} alt="" style={imageStyle} draggable={false} />
      ) : (
        children || "Button"
      )}
    </div>
  );
});

// ===================================================================
// NAV SCREEN LAYOUT COMPONENT
// Container that manages stage scaling and slot positioning
// ===================================================================

/**
 * NavScreenLayout - Main layout container for NavScreen system
 *
 * Provides a 2048×2048 stage coordinate system that scales to fit viewport.
 *
 * CRITICAL: Uses "contain" behavior - entire stage always fits within viewport.
 * This ensures ALL interactive elements (NavSlot buttons) are always visible
 * and accessible. Background images can use "cover" for visual overflow effect.
 *
 * Place NavSlot components inside with stage coordinates.
 *
 * @example
 * ```tsx
 * <NavScreenLayout backgroundImage="/path/to/bg.png" backgroundFitMode="cover">
 *   <NavSlot position={{ x: 1024, y: 1024 }} size={{ width: 200, height: 60 }} />
 * </NavScreenLayout>
 * ```
 */
export function NavScreenLayout(props: NavScreenLayoutProps) {
  const {
    backgroundImage = null,
    backgroundFitMode = "cover",
    children,
    className = "",
    style = {},
  } = props;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });

  // Calculate responsive scaling
  React.useEffect(() => {
    const updateTransform = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Contain behavior: fit entire stage within viewport (all buttons always visible)
      const scaleX = viewportWidth / NAV_STAGE_WIDTH;
      const scaleY = viewportHeight / NAV_STAGE_HEIGHT;
      const newScale = Math.min(scaleX, scaleY); // Use min for contain behavior

      const width = NAV_STAGE_WIDTH * newScale;
      const height = NAV_STAGE_HEIGHT * newScale;

      setScale(newScale);
      setOffset({
        x: (viewportWidth - width) / 2,
        y: (viewportHeight - height) / 2,
      });
    };

    updateTransform();
    window.addEventListener("resize", updateTransform);
    return () => window.removeEventListener("resize", updateTransform);
  }, []);

  const containerStyle: CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    width: `${NAV_STAGE_WIDTH}px`,
    height: `${NAV_STAGE_HEIGHT}px`,
    transformOrigin: "top left",
    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
    overflow: "hidden",
    ...style,
  };

  const backgroundStyle: CSSProperties = backgroundImage
    ? {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: backgroundFitMode,
        pointerEvents: "none",
        userSelect: "none",
      }
    : {};

  return (
    <div ref={containerRef} className={`nav-screen-layout ${className}`} style={containerStyle}>
      {backgroundImage && (
        <img src={backgroundImage} alt="" style={backgroundStyle} draggable={false} />
      )}
      {children}
    </div>
  );
}

// ===================================================================
// UTILITY FUNCTIONS
// Helper functions for working with NavScreen coordinates
// ===================================================================

/**
 * Convert viewport coordinates to stage coordinates
 */
export function viewportToNavStageCoords(
  viewportX: number,
  viewportY: number,
  scale: number,
  offset: { x: number; y: number },
): NavPosition {
  return {
    x: (viewportX - offset.x) / scale,
    y: (viewportY - offset.y) / scale,
  };
}

/**
 * Convert stage coordinates to viewport coordinates
 */
export function navStageToViewportCoords(
  stageX: number,
  stageY: number,
  scale: number,
  offset: { x: number; y: number },
): { x: number; y: number } {
  return {
    x: stageX * scale + offset.x,
    y: stageY * scale + offset.y,
  };
}

/**
 * Check if a point is within a NavSlot bounds
 */
export function isPointInNavSlot(
  point: NavPosition,
  slotPosition: NavPosition,
  slotSize: NavSize,
): boolean {
  const left = slotPosition.x - slotSize.width / 2;
  const top = slotPosition.y - slotSize.height / 2;
  const right = left + slotSize.width;
  const bottom = top + slotSize.height;

  return point.x >= left && point.x <= right && point.y >= top && point.y <= bottom;
}

// All types and components are already exported inline above
// No need for additional exports
