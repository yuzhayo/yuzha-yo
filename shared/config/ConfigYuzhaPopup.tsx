import React, { useState, useEffect, useCallback, useRef } from "react";
import type { LayerConfigEntry, LayerRenderer } from "./Config.ts";
import configData from "./ConfigYuzha.json";
import imageRegistryData from "./ImageRegistry.json";

export type ImageRegistryEntry = {
  id: string;
  path: string;
};

export interface ConfigYuzhaPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

type ExpandedState = {
  [layerId: string]: {
    layer: boolean;
    basic: boolean;
  };
};

const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;

export function ConfigYuzhaPopup({ isOpen, onClose }: ConfigYuzhaPopupProps) {
  const [layers, setLayers] = useState<LayerConfigEntry[]>([]);
  const [imageRegistry, setImageRegistry] = useState<ImageRegistryEntry[]>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [windowSize, setWindowSize] = useState({ width: 800, height: 600 });
  const [windowPos, setWindowPos] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<ResizeHandle | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLayers(configData as LayerConfigEntry[]);
      setImageRegistry(imageRegistryData as ImageRegistryEntry[]);

      const initialExpanded: ExpandedState = {};
      (configData as LayerConfigEntry[]).forEach((layer) => {
        initialExpanded[layer.layerId] = { layer: false, basic: false };
      });
      setExpanded(initialExpanded);
    }
  }, [isOpen]);

  const handleMouseDown = useCallback((e: React.MouseEvent, type: "drag" | ResizeHandle) => {
    e.preventDefault();
    e.stopPropagation();

    if (type === "drag") {
      setIsDragging(true);
    } else {
      setIsResizing(type);
    }

    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      if (isDragging) {
        setWindowPos((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        setDragStart({ x: e.clientX, y: e.clientY });
      } else if (isResizing) {
        setWindowSize((prev) => {
          let newWidth = prev.width;
          let newHeight = prev.height;
          let newX = windowPos.x;
          let newY = windowPos.y;

          if (isResizing.includes("e")) {
            newWidth = Math.max(MIN_WIDTH, prev.width + dx);
          }
          if (isResizing.includes("w")) {
            const delta = Math.min(dx, prev.width - MIN_WIDTH);
            newWidth = prev.width - delta;
            newX = windowPos.x + delta;
          }
          if (isResizing.includes("s")) {
            newHeight = Math.max(MIN_HEIGHT, prev.height + dy);
          }
          if (isResizing.includes("n")) {
            const delta = Math.min(dy, prev.height - MIN_HEIGHT);
            newHeight = prev.height - delta;
            newY = windowPos.y + delta;
          }

          setWindowPos({ x: newX, y: newY });
          return { width: newWidth, height: newHeight };
        });
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    },
    [isDragging, isResizing, dragStart, windowPos],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(null);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const toggleLayerExpanded = useCallback((layerId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [layerId]: {
        layer: !prev[layerId]?.layer,
        basic: prev[layerId]?.basic || false,
      },
    }));
  }, []);

  const toggleBasicExpanded = useCallback((layerId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [layerId]: {
        layer: prev[layerId]?.layer || false,
        basic: !prev[layerId]?.basic,
      },
    }));
  }, []);

  const addLayer = useCallback(() => {
    const maxOrder = layers.reduce((max, layer) => Math.max(max, layer.order), 0);
    const newLayer: LayerConfigEntry = {
      layerId: `layer-${Date.now()}`,
      renderer: "2D",
      order: maxOrder + 10,
      imageId: imageRegistry[0]?.id || "SAMPLE",
      scale: [1, 1],
      position: [1024, 1024],
      angle: null,
    };
    setLayers((prev) => [...prev, newLayer]);
    setExpanded((prev) => ({
      ...prev,
      [newLayer.layerId]: { layer: true, basic: true },
    }));
  }, [layers, imageRegistry]);

  const copyLayer = useCallback(
    (layerId: string) => {
      const layer = layers.find((l) => l.layerId === layerId);
      if (layer) {
        const newLayer: LayerConfigEntry = {
          ...layer,
          layerId: `${layer.layerId}-copy-${Date.now()}`,
          order: layer.order + 10,
        };
        setLayers((prev) => [...prev, newLayer]);
        setExpanded((prev) => ({
          ...prev,
          [newLayer.layerId]: { layer: true, basic: true },
        }));
      }
    },
    [layers],
  );

  const deleteLayer = useCallback((layerId: string) => {
    if (window.confirm(`Delete layer "${layerId}"?`)) {
      setLayers((prev) => prev.filter((l) => l.layerId !== layerId));
      setExpanded((prev) => {
        const newExpanded = { ...prev };
        delete newExpanded[layerId];
        return newExpanded;
      });
    }
  }, []);

  const updateLayer = useCallback((layerId: string, updates: Partial<LayerConfigEntry>) => {
    setLayers((prev) =>
      prev.map((layer) => (layer.layerId === layerId ? { ...layer, ...updates } : layer)),
    );
  }, []);

  const saveConfig = useCallback(async () => {
    try {
      const jsonContent = JSON.stringify(layers, null, 2);
      console.log("Saving config:", jsonContent);

      setSaveMessage("Configuration saved successfully!");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error("Error saving config:", error);
      setSaveMessage("Error saving configuration!");
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }, [layers]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        ref={windowRef}
        className="absolute bg-neutral-900/95 border border-neutral-700 rounded-lg shadow-2xl overflow-hidden"
        style={{
          left: windowPos.x,
          top: windowPos.y,
          width: windowSize.width,
          height: windowSize.height,
        }}
      >
        <div
          className="h-12 px-4 flex items-center justify-between cursor-move select-none"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
          onMouseDown={(e) => handleMouseDown(e, "drag")}
        >
          <h2 className="text-white font-semibold text-lg">Config Editor</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={addLayer}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
            >
              + Add Layer
            </button>
            <button
              onClick={saveConfig}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-lg rounded transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {saveMessage && (
          <div className="absolute top-14 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-green-600 text-white rounded shadow-lg z-10">
            {saveMessage}
          </div>
        )}

        <div
          className="overflow-y-auto overflow-x-hidden p-4 bg-neutral-900 text-white custom-scrollbar"
          style={{ height: "calc(100% - 48px)" }}
        >
          {layers.map((layer) => (
            <div
              key={layer.layerId}
              className="mb-3 border border-neutral-700 rounded-lg overflow-hidden"
            >
              <div
                className="flex items-center justify-between px-4 py-2 bg-neutral-800 hover:bg-neutral-750 cursor-pointer transition-colors"
                onClick={() => toggleLayerExpanded(layer.layerId)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{expanded[layer.layerId]?.layer ? "▼" : "▶"}</span>
                  <span className="font-medium">{layer.layerId}</span>
                  <span className="px-2 py-0.5 bg-neutral-700 text-xs rounded">
                    Order: {layer.order}
                  </span>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => copyLayer(layer.layerId)}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => deleteLayer(layer.layerId)}
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {expanded[layer.layerId]?.layer && (
                <div className="p-4 bg-neutral-850">
                  <div className="mb-2 border border-neutral-700 rounded overflow-hidden">
                    <div
                      className="px-3 py-2 bg-neutral-800 hover:bg-neutral-750 cursor-pointer transition-colors flex items-center gap-2"
                      onClick={() => toggleBasicExpanded(layer.layerId)}
                    >
                      <span className="text-sm">{expanded[layer.layerId]?.basic ? "▼" : "▶"}</span>
                      <span className="font-medium text-sm">BASIC</span>
                    </div>

                    {expanded[layer.layerId]?.basic && (
                      <div className="p-3 space-y-3 bg-neutral-900">
                        <div>
                          <label className="block text-sm font-medium mb-1">Renderer</label>
                          <select
                            value={layer.renderer}
                            onChange={(e) =>
                              updateLayer(layer.layerId, {
                                renderer: e.target.value as LayerRenderer,
                              })
                            }
                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="2D">2D</option>
                            <option value="3D">3D</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Image ID</label>
                          <select
                            value={layer.imageId}
                            onChange={(e) =>
                              updateLayer(layer.layerId, {
                                imageId: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {imageRegistry.map((img) => (
                              <option key={img.id} value={img.id}>
                                {img.id}
                              </option>
                            ))}
                          </select>
                          {layer.imageId && (
                            <div className="mt-2 flex items-center gap-2">
                              <img
                                src={`/${imageRegistry.find((i) => i.id === layer.imageId)?.path || ""}`}
                                alt={layer.imageId}
                                className="w-8 h-8 object-contain bg-neutral-800 rounded border border-neutral-700"
                              />
                              <span className="text-xs text-neutral-400">Preview</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Scale: {((layer.scale?.[0] || 1) * 100).toFixed(0)}%
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="10"
                              max="400"
                              value={(layer.scale?.[0] || 1) * 100}
                              onChange={(e) => {
                                const val = Math.max(10, Math.min(400, Number(e.target.value)));
                                const scale = val / 100;
                                updateLayer(layer.layerId, {
                                  scale: [scale, scale],
                                });
                              }}
                              className="w-20 px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              type="range"
                              min="10"
                              max="400"
                              value={(layer.scale?.[0] || 1) * 100}
                              onChange={(e) => {
                                const scale = Number(e.target.value) / 100;
                                updateLayer(layer.layerId, {
                                  scale: [scale, scale],
                                });
                              }}
                              className="flex-1 accent-blue-600"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Position</label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <label className="block text-xs text-neutral-400 mb-1">X</label>
                              <input
                                type="number"
                                value={layer.position?.[0] || 0}
                                onChange={(e) =>
                                  updateLayer(layer.layerId, {
                                    position: [Number(e.target.value), layer.position?.[1] || 0],
                                  })
                                }
                                className="w-full px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs text-neutral-400 mb-1">Y</label>
                              <input
                                type="number"
                                value={layer.position?.[1] || 0}
                                onChange={(e) =>
                                  updateLayer(layer.layerId, {
                                    position: [layer.position?.[0] || 0, Number(e.target.value)],
                                  })
                                }
                                className="w-full px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1 text-neutral-500">
                            Angle (Reserved)
                          </label>
                          <input
                            type="text"
                            disabled
                            placeholder="Reserved for future use"
                            className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded text-neutral-500 cursor-not-allowed"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {["n", "s", "e", "w", "ne", "nw", "se", "sw"].map((handle) => (
          <div
            key={handle}
            className={`absolute ${getResizeHandleClass(handle as ResizeHandle)}`}
            onMouseDown={(e) => handleMouseDown(e, handle as ResizeHandle)}
            style={{ cursor: getResizeCursor(handle as ResizeHandle) }}
          />
        ))}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #262626;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #525252;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #737373;
        }
      `}</style>
    </div>
  );
}

function getResizeHandleClass(handle: ResizeHandle): string {
  const baseClass = "bg-transparent hover:bg-blue-500/30 transition-colors";
  switch (handle) {
    case "n":
      return `${baseClass} top-0 left-0 right-0 h-1`;
    case "s":
      return `${baseClass} bottom-0 left-0 right-0 h-1`;
    case "e":
      return `${baseClass} right-0 top-0 bottom-0 w-1`;
    case "w":
      return `${baseClass} left-0 top-0 bottom-0 w-1`;
    case "ne":
      return `${baseClass} top-0 right-0 w-3 h-3`;
    case "nw":
      return `${baseClass} top-0 left-0 w-3 h-3`;
    case "se":
      return `${baseClass} bottom-0 right-0 w-3 h-3`;
    case "sw":
      return `${baseClass} bottom-0 left-0 w-3 h-3`;
    default:
      return baseClass;
  }
}

function getResizeCursor(handle: ResizeHandle): string {
  switch (handle) {
    case "n":
    case "s":
      return "ns-resize";
    case "e":
    case "w":
      return "ew-resize";
    case "ne":
    case "sw":
      return "nesw-resize";
    case "nw":
    case "se":
      return "nwse-resize";
    default:
      return "default";
  }
}
