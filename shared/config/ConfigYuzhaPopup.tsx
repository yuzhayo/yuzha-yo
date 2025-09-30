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

const SURFACE_BACKGROUND =
  "linear-gradient(180deg, rgba(24, 28, 40, 0.96) 0%, rgba(12, 14, 22, 0.94) 100%)";
const SURFACE_SHADOW = "0 24px 80px rgba(6, 8, 16, 0.65)";

const BASE_PILL_BUTTON =
  "inline-flex items-center justify-center rounded-full uppercase tracking-[0.18em] font-semibold transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0";
const FROSTED_BUTTON =
  `${BASE_PILL_BUTTON} px-4 py-1.5 text-[11px] text-sky-100 bg-white/10 border border-white/20 backdrop-blur-sm shadow-[0_6px_20px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 hover:bg-white/16`;
const FROSTED_BUTTON_SM =
  `${BASE_PILL_BUTTON} px-3 py-1 text-[10px] text-sky-100 bg-white/8 border border-white/20 backdrop-blur-sm shadow-[0_4px_16px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 hover:bg-white/12`;
const PRIMARY_BUTTON =
  `${BASE_PILL_BUTTON} px-4 py-1.5 text-[11px] text-white bg-gradient-to-br from-sky-400/90 via-indigo-500/85 to-purple-500/80 border border-white/20 shadow-[0_14px_34px_rgba(22,80,200,0.5)] hover:-translate-y-0.5 hover:shadow-[0_20px_46px_rgba(30,110,255,0.55)]`;
const DANGER_BUTTON =
  `${BASE_PILL_BUTTON} px-3 py-1.5 text-[11px] text-white bg-gradient-to-br from-rose-500/85 via-rose-600/80 to-amber-500/72 border border-rose-200/30 shadow-[0_14px_34px_rgba(140,30,70,0.5)] hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(170,45,90,0.55)]`;
const DANGER_BUTTON_SM =
  `${BASE_PILL_BUTTON} px-3 py-1 text-[10px] text-white bg-gradient-to-br from-rose-500/85 via-rose-600/80 to-amber-500/72 border border-rose-200/30 shadow-[0_10px_26px_rgba(150,40,80,0.4)] hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(180,55,95,0.48)]`;

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
    <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(1200px 800px at 50% 40%, rgba(79, 70, 229, 0.22), transparent), radial-gradient(900px 900px at 50% 70%, rgba(14, 165, 233, 0.18), transparent), #0b0f17",
        }}
      />
      <div
        className="absolute inset-0 bg-[#08090f]/70 backdrop-blur-[18px]"
        onClick={onClose}
      />

      <div
        ref={windowRef}
        className="absolute text-white/90 rounded-[28px] border border-white/10 ring-1 ring-white/10 backdrop-blur-xl overflow-hidden"
        style={{
          left: windowPos.x,
          top: windowPos.y,
          width: windowSize.width,
          height: windowSize.height,
          background: SURFACE_BACKGROUND,
          boxShadow: SURFACE_SHADOW,
        }}
      >
        <div
          className="relative h-14 px-6 flex items-center justify-between cursor-move select-none border-b border-white/10 bg-white/5 backdrop-blur-[10px]"
          style={{
            background:
              "linear-gradient(120deg, rgba(79, 70, 229, 0.24), rgba(14, 165, 233, 0.16))",
          }}
          onMouseDown={(e) => handleMouseDown(e, "drag")}
        >
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-[0.28em] uppercase text-white/80">
              Layer Configurator
            </span>
            <span className="text-[11px] tracking-[0.2em] text-white/50 uppercase">
              Swipe inspired control surface
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={addLayer} className={FROSTED_BUTTON}>
              Add Layer
            </button>
            <button type="button" onClick={saveConfig} className={PRIMARY_BUTTON}>
              Save
            </button>
            <button type="button" onClick={onClose} className={DANGER_BUTTON}>
              Close
            </button>
          </div>
        </div>

        {saveMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 transform px-4 py-2 rounded-full border border-white/20 bg-gradient-to-r from-sky-500/80 via-indigo-500/80 to-purple-500/80 text-[11px] uppercase tracking-[0.2em] text-white shadow-[0_16px_36px_rgba(24,90,200,0.45)]">
            {saveMessage}
          </div>
        )}

        <div className="h-[calc(100%-56px)] overflow-y-auto overflow-x-hidden px-6 py-6 space-y-4 text-sm leading-relaxed custom-scrollbar">
          {layers.map((layer) => (
            <div
              key={layer.layerId}
              className="mb-2 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-[6px] shadow-[0_18px_44px_rgba(6,10,26,0.5)] transition-all duration-200 hover:border-sky-400/40 hover:shadow-[0_26px_62px_rgba(12,24,44,0.6)]"
            >
              <div
                className="flex items-center justify-between px-5 py-3 bg-white/5 hover:bg-white/8 transition-colors cursor-pointer"
                onClick={() => toggleLayerExpanded(layer.layerId)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-white/60 text-base font-mono">
                    {expanded[layer.layerId]?.layer ? "v" : ">"}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-semibold tracking-[0.18em] uppercase text-white/80 text-xs">
                      {layer.layerId}
                    </span>
                    <span className="text-[11px] tracking-[0.16em] text-white/50 uppercase">
                      Order {layer.order}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => copyLayer(layer.layerId)}
                    className={FROSTED_BUTTON_SM}
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteLayer(layer.layerId)}
                    className={DANGER_BUTTON_SM}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {expanded[layer.layerId]?.layer && (
                <div className="p-5 space-y-4 bg-[#0f1622]/80 border-t border-white/10">
                  <div className="border border-white/10 rounded-2xl overflow-hidden">
                    <div
                      className="px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-3 cursor-pointer"
                      onClick={() => toggleBasicExpanded(layer.layerId)}
                    >
                      <span className="text-white/60 text-sm font-mono">
                        {expanded[layer.layerId]?.basic ? "v" : ">"}
                      </span>
                      <span className="text-xs font-semibold tracking-[0.2em] uppercase text-white/70">
                        Basic Settings
                      </span>
                    </div>

                    {expanded[layer.layerId]?.basic && (
                      <div className="p-5 space-y-4 bg-[#0b111b]/85">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] tracking-[0.16em] uppercase text-white/60 mb-1">
                              Renderer
                            </label>
                            <select
                              value={layer.renderer}
                              onChange={(e) =>
                                updateLayer(layer.layerId, {
                                  renderer: e.target.value as LayerRenderer,
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl bg-[#121a28]/90 border border-white/10 text-white/90 focus:outline-none focus:ring-2 focus:ring-sky-400/70 focus:border-sky-300/60"
                            >
                              <option value="2D">2D</option>
                              <option value="3D">3D</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] tracking-[0.16em] uppercase text-white/60 mb-1">
                              Image ID
                            </label>
                            <select
                              value={layer.imageId}
                              onChange={(e) =>
                                updateLayer(layer.layerId, {
                                  imageId: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl bg-[#121a28]/90 border border-white/10 text-white/90 focus:outline-none focus:ring-2 focus:ring-sky-400/70 focus:border-sky-300/60"
                            >
                              {imageRegistry.map((entry) => (
                                <option key={entry.id} value={entry.id}>
                                  {entry.id}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] tracking-[0.16em] uppercase text-white/60 mb-2">
                            Uniform Scale
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              step="0.01"
                              value={layer.scale?.[0] ?? 1}
                              onChange={(e) => {
                                const scale = Number(e.target.value) || 0;
                                updateLayer(layer.layerId, {
                                  scale: [scale, scale],
                                });
                              }}
                              className="w-24 px-3 py-2 rounded-xl bg-[#121a28]/90 border border-white/10 text-white/90 focus:outline-none focus:ring-2 focus:ring-sky-400/70 focus:border-sky-300/60"
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
                              className="flex-1 accent-sky-400"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] tracking-[0.16em] uppercase text-white/60 mb-2">
                            Position
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] tracking-[0.18em] uppercase text-white/40 mb-1">
                                X
                              </label>
                              <input
                                type="number"
                                value={layer.position?.[0] || 0}
                                onChange={(e) =>
                                  updateLayer(layer.layerId, {
                                    position: [Number(e.target.value), layer.position?.[1] || 0],
                                  })
                                }
                                className="w-full px-3 py-2 rounded-xl bg-[#121a28]/90 border border-white/10 text-white/90 focus:outline-none focus:ring-2 focus:ring-sky-400/70 focus:border-sky-300/60"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] tracking-[0.18em] uppercase text-white/40 mb-1">
                                Y
                              </label>
                              <input
                                type="number"
                                value={layer.position?.[1] || 0}
                                onChange={(e) =>
                                  updateLayer(layer.layerId, {
                                    position: [layer.position?.[0] || 0, Number(e.target.value)],
                                  })
                                }
                                className="w-full px-3 py-2 rounded-xl bg-[#121a28]/90 border border-white/10 text-white/90 focus:outline-none focus:ring-2 focus:ring-sky-400/70 focus:border-sky-300/60"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] tracking-[0.16em] uppercase text-white/40 mb-1">
                            Angle (Reserved)
                          </label>
                          <input
                            type="text"
                            disabled
                            placeholder="Reserved for future use"
                            className="w-full px-3 py-2 rounded-xl bg-[#121a28]/70 border border-white/10 text-white/40 cursor-not-allowed"
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
          background: rgba(20, 24, 36, 0.8);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(79, 70, 229, 0.45), rgba(14, 165, 233, 0.45));
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(79, 70, 229, 0.6), rgba(14, 165, 233, 0.6));
        }
      `}</style>
    </div>
  );
}

function getResizeHandleClass(handle: ResizeHandle): string {
  const baseClass = "bg-transparent hover:bg-sky-400/40 transition-colors";
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
