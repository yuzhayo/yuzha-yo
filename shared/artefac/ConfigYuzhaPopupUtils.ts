import type React from "react";
import type {
  AccordionParentItem,
  AccordionSubParentItem,
  AccordionChildItem,
} from "./ConfigYuzhaAccordionUtils";
import configYuzhaData from "../config/ConfigYuzha.json";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export const MIN_WIDTH = 200;
export const MIN_HEIGHT = 150;
export const getMaxWidth = () => window.innerWidth * 0.95;
export const getMaxHeight = () => window.innerHeight * 0.95;
export const LOCALSTORAGE_KEY = "configYuzhaData";

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
  return (configYuzhaData as any[]).map((layerConfig: any) => {
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
          } else if (key === "ImageID") {
            type = "dropdown";
          } else if (key === "LayerOrder") {
            type = "number";
          } else if (key === "angle") {
            type = "number";
          } else if (Array.isArray(value)) {
            type = "array";
          }

          groupChildren.push({
            id: `${layerConfig.LayerID}-${groupName}-${key}`,
            label: key.charAt(0).toUpperCase() + key.slice(1),
            value: value as string | number | number[] | null,
            type,
            level: 3,
            hidden: false,
          });
        });

        children.push({
          id: `${layerConfig.LayerID}-${groupName}`,
          label: groupName,
          level: 2,
          children: groupChildren,
        });
      });
    }

    return {
      id: layerConfig.LayerID,
      label: layerConfig.LayerID,
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

// ---------------------------------------------------------------------------
// LocalStorage Functions
// ---------------------------------------------------------------------------

/**
 * Transform accordion data back to original ConfigYuzha.json format
 */
export function transformAccordionToConfig(accordionData: AccordionParentItem[]) {
  return accordionData.map((parent) => {
    const groups: Record<string, Record<string, string | number | number[] | null>> = {};

    parent.children.forEach((subParent) => {
      const groupData: Record<string, string | number | number[] | null> = {};

      subParent.children.forEach((child) => {
        const key = child.label.charAt(0).toLowerCase() + child.label.slice(1);
        groupData[key] = child.value;
      });

      groups[subParent.label] = groupData;
    });

    return {
      LayerID: parent.id,
      groups,
    };
  });
}

/**
 * Save accordion data to localStorage
 */
export function saveConfigToLocalStorage(accordionData: AccordionParentItem[]): void {
  try {
    const configData = transformAccordionToConfig(accordionData);
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(configData));
  } catch (error) {
    console.error("Failed to save config to localStorage:", error);
  }
}

/**
 * Load config from localStorage, fallback to original JSON
 */
export function loadConfigFromLocalStorage(): AccordionParentItem[] {
  try {
    const stored = localStorage.getItem(LOCALSTORAGE_KEY);
    if (stored) {
      const configData = JSON.parse(stored);
      // Transform stored data to accordion format
      return configData.map(
        (layerConfig: {
          LayerID: string;
          groups: Record<string, Record<string, string | number | number[] | null>>;
        }) => {
          const children: AccordionSubParentItem[] = [];

          if (layerConfig.groups) {
            Object.entries(layerConfig.groups).forEach(([groupName, groupData]) => {
              const groupChildren: AccordionChildItem[] = [];

              Object.entries(groupData).forEach(([key, value]) => {
                let type: AccordionChildItem["type"] = "text";

                if (key === "renderer") {
                  type = "dropdown";
                } else if (key === "ImageID") {
                  type = "dropdown";
                } else if (key === "LayerOrder") {
                  type = "number";
                } else if (key === "angle") {
                  type = "number";
                } else if (Array.isArray(value)) {
                  type = "array";
                }

                groupChildren.push({
                  id: `${layerConfig.LayerID}-${groupName}-${key}`,
                  label: key.charAt(0).toUpperCase() + key.slice(1),
                  value: value as string | number | number[] | null,
                  type,
                  level: 3,
                  hidden: false,
                });
              });

              children.push({
                id: `${layerConfig.LayerID}-${groupName}`,
                label: groupName,
                level: 2,
                children: groupChildren,
              });
            });
          }

          return {
            id: layerConfig.LayerID,
            label: layerConfig.LayerID,
            level: 1,
            children,
          };
        },
      );
    }
  } catch (error) {
    console.error("Failed to load config from localStorage:", error);
  }

  // Fallback to original JSON
  return transformConfigToAccordion();
}
