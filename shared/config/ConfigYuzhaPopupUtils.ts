import type React from "react";
import type {
  AccordionParentItem,
  AccordionSubParentItem,
  AccordionChildItem,
} from "./ConfigYuzhaAccordionUtils";
import configYuzhaData from "./ConfigYuzha.json";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export const MIN_WIDTH = 200;
export const MIN_HEIGHT = 150;
export const getMaxWidth = () => window.innerWidth * 0.95;
export const getMaxHeight = () => window.innerHeight * 0.95;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ConfigYuzhaPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

export interface ConfigYuzhaPopupButtonProps {
  label?: string;
  popupTitle?: string;
  className?: string;
  children?: React.ReactNode;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Transform ConfigYuzha.json to accordion structure
 */
export function transformConfigToAccordion(): AccordionParentItem[] {
  return configYuzhaData.map((layerConfig) => {
    const children: AccordionSubParentItem[] = [];

    // Process each group in the layer config
    if (layerConfig.groups) {
      Object.entries(layerConfig.groups).forEach(([groupName, groupData]) => {
        const groupChildren: AccordionChildItem[] = [];

        // Convert each property to a child item
        Object.entries(groupData).forEach(([key, value]) => {
          let type: AccordionChildItem["type"] = "text";

          if (key === "renderer") {
            type = "dropdown";
          } else if (key === "imageId") {
            type = "dropdown";
          } else if (key === "order") {
            type = "number";
          } else if (key === "angle") {
            type = "number";
          } else if (Array.isArray(value)) {
            type = "array";
          }

          groupChildren.push({
            id: `${layerConfig.layerId}-${groupName}-${key}`,
            label: key.charAt(0).toUpperCase() + key.slice(1),
            value: value as string | number | number[] | null,
            type,
            level: 3,
            hidden: false,
          });
        });

        children.push({
          id: `${layerConfig.layerId}-${groupName}`,
          label: groupName,
          level: 2,
          children: groupChildren,
        });
      });
    }

    return {
      id: layerConfig.layerId,
      label: layerConfig.layerId,
      level: 1,
      children,
    };
  });
}

/**
 * Helper to extract coordinates from mouse or touch event
 */
export const getEventCoordinates = (
  event: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent,
) => {
  if ("touches" in event && event.touches.length > 0) {
    return { x: event.touches[0]!.clientX, y: event.touches[0]!.clientY };
  }
  return {
    x: (event as MouseEvent | React.MouseEvent).clientX,
    y: (event as MouseEvent | React.MouseEvent).clientY,
  };
};