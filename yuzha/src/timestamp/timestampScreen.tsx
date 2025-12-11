import React, { useEffect, useRef, useState, useCallback } from "react";
import TimestampHeader from "./TimestampHeader";
import TimestampPreview from "./TimestampPreview";
import TimestampFloating, { type TimestampFloatingRef } from "./TimestampFloating";
import ImageFloating, { type ImageFloatingRef } from "./ImageFloating";
import TimestampSettings from "./TimestampSettings";
import { addPreset, type TimestampPreset } from "./PresetManager";
import { type Overlay, type TextOverlay, type ImageOverlay, type TextAlign, DEFAULT_STATE, DEFAULT_OVERLAYS, checkAABBCollision, resolveAllCollisions, type OverlayBounds } from "./types";

export type TimestampScreenProps = {
  onBack?: () => void;
};

type HistoryEntry = {
  scale: number;
  translateX: number;
  translateY: number;
  rotation: number;
  textColor: string;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  customFonts: string[];
  overlays: Overlay[];
};

function cloneOverlay(overlay: Overlay): Overlay {
  return {
    ...overlay,
    position: { ...overlay.position },
  };
}

function cloneState(s: HistoryEntry): HistoryEntry {
  return {
    ...s,
    customFonts: [...s.customFonts],
    overlays: s.overlays.map(cloneOverlay),
  };
}

export default function TimestampScreen({ onBack }: TimestampScreenProps) {
  const [hInput, setHInput] = useState("1");
  const [wInput, setWInput] = useState("1");
  const [headerHeight, setHeaderHeight] = useState(56);
  const headerRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<{ vw: number; vh: number }>({
    vw: typeof window !== "undefined" ? window.innerWidth : 1024,
    vh: typeof window !== "undefined" ? window.innerHeight : 768,
  });

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [scale, setScale] = useState(DEFAULT_STATE.scale);
  const [translateX, setTranslateX] = useState(DEFAULT_STATE.translateX);
  const [translateY, setTranslateY] = useState(DEFAULT_STATE.translateY);
  const [rotation, setRotation] = useState(DEFAULT_STATE.rotation);

  const [textColor, setTextColor] = useState(DEFAULT_STATE.textColor);
  const [shadowColor, setShadowColor] = useState(DEFAULT_STATE.shadowColor);
  const [shadowBlur, setShadowBlur] = useState(DEFAULT_STATE.shadowBlur);
  const [shadowOffsetX, setShadowOffsetX] = useState(DEFAULT_STATE.shadowOffsetX);
  const [shadowOffsetY, setShadowOffsetY] = useState(DEFAULT_STATE.shadowOffsetY);

  const [customFonts, setCustomFonts] = useState<string[]>([]);

  const [overlays, setOverlays] = useState<Overlay[]>(() =>
    DEFAULT_OVERLAYS.map(cloneOverlay)
  );

  const [previewBounds, setPreviewBounds] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [showDebugBounds] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const nextImageIdRef = useRef(1);

  const textOverlayRefsMap = useRef<Map<string, TimestampFloatingRef>>(new Map());
  const imageOverlayRefsMap = useRef<Map<string, ImageFloatingRef>>(new Map());

  const setOverlayRef = useCallback((id: string, ref: TimestampFloatingRef | null) => {
    if (ref) {
      textOverlayRefsMap.current.set(id, ref);
    } else {
      textOverlayRefsMap.current.delete(id);
    }
  }, []);

  const setImageOverlayRef = useCallback((id: string, ref: ImageFloatingRef | null) => {
    if (ref) {
      imageOverlayRefsMap.current.set(id, ref);
    } else {
      imageOverlayRefsMap.current.delete(id);
    }
  }, []);

  const getOverlayRef = useCallback((id: string): TimestampFloatingRef | null => {
    return textOverlayRefsMap.current.get(id) ?? null;
  }, []);

  const getImageOverlayRef = useCallback((id: string): ImageFloatingRef | null => {
    return imageOverlayRefsMap.current.get(id) ?? null;
  }, []);

  const getAnyOverlayBounds = useCallback((id: string) => {
    const textRef = textOverlayRefsMap.current.get(id);
    if (textRef) return textRef.getBounds();
    const imageRef = imageOverlayRefsMap.current.get(id);
    if (imageRef) return imageRef.getBounds();
    return null;
  }, []);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoRef = useRef(false);

  const getCurrentState = useCallback((): HistoryEntry => {
    const updatedOverlays = overlays.map((overlay) => {
      if (overlay.type === "text") {
        const ref = getOverlayRef(overlay.id);
        if (ref) {
          return { ...overlay, position: ref.getRelativePosition() };
        }
      } else if (overlay.type === "image") {
        const ref = getImageOverlayRef(overlay.id);
        if (ref) {
          const size = ref.getSize();
          return { ...overlay, position: ref.getRelativePosition(), width: size.width, height: size.height };
        }
      }
      return overlay;
    });

    return {
      scale,
      translateX,
      translateY,
      rotation,
      textColor,
      shadowColor,
      shadowBlur,
      shadowOffsetX,
      shadowOffsetY,
      customFonts: [...customFonts],
      overlays: updatedOverlays,
    };
  }, [scale, translateX, translateY, rotation, textColor, shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY, customFonts, overlays, getOverlayRef, getImageOverlayRef]);

  const pushHistory = useCallback((overrides?: Partial<HistoryEntry>) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }
    const current = getCurrentState();
    const stateToSave = overrides ? { ...current, ...overrides } : current;
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(cloneState(stateToSave));
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  }, [getCurrentState, historyIndex]);

  const applyState = useCallback((entry: HistoryEntry) => {
    isUndoRedoRef.current = true;
    setScale(entry.scale);
    setTranslateX(entry.translateX);
    setTranslateY(entry.translateY);
    setRotation(entry.rotation);
    setTextColor(entry.textColor);
    setShadowColor(entry.shadowColor);
    setShadowBlur(entry.shadowBlur);
    setShadowOffsetX(entry.shadowOffsetX);
    setShadowOffsetY(entry.shadowOffsetY);
    setCustomFonts([...entry.customFonts]);
    setOverlays(entry.overlays.map(cloneOverlay));

    entry.overlays.forEach((overlay) => {
      if (overlay.type === "text") {
        const ref = getOverlayRef(overlay.id);
        ref?.setRelativePosition(overlay.position);
      } else if (overlay.type === "image") {
        const ref = getImageOverlayRef(overlay.id);
        if (ref) {
          ref.setRelativePosition(overlay.position);
          ref.setSize({ width: overlay.width, height: overlay.height });
        }
      }
    });
  }, [getOverlayRef, getImageOverlayRef]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const entry = history[newIndex];
      if (entry) {
        setHistoryIndex(newIndex);
        applyState(entry);
      }
    }
  }, [historyIndex, history, applyState]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const entry = history[newIndex];
      if (entry) {
        setHistoryIndex(newIndex);
        applyState(entry);
      }
    }
  }, [historyIndex, history, applyState]);

  useEffect(() => {
    if (history.length === 0) {
      const initial = getCurrentState();
      setHistory([cloneState(initial)]);
      setHistoryIndex(0);
    }
  }, []);

  useEffect(() => {
    const handle = () => {
      setViewport({ vw: window.innerWidth, vh: window.innerHeight });
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  useEffect(() => {
    if (!imageSrc || previewBounds.width === 0) return;
    
    const timeoutId = setTimeout(() => {
      const maxGlobalIterations = 10;
      
      for (let globalIteration = 0; globalIteration < maxGlobalIterations; globalIteration++) {
        const allBounds: OverlayBounds[] = [];
        overlays.forEach((o) => {
          const bounds = getAnyOverlayBounds(o.id);
          if (bounds) {
            allBounds.push({ ...bounds });
          }
        });
        
        if (allBounds.length < 2) return;
        
        let anyCollisionResolved = false;
        
        for (let i = 0; i < allBounds.length; i++) {
          const current = allBounds[i]!;
          const others = allBounds.filter((_, idx) => idx !== i);
          
          const hasCollision = others.some((other) => checkAABBCollision(current, other));
          if (hasCollision) {
            const result = resolveAllCollisions(current, others, { x: current.x, y: current.y });
            if (result.x !== current.x || result.y !== current.y) {
              const maxX = Math.max(0, previewBounds.width - current.width);
              const maxY = Math.max(0, previewBounds.height - current.height);
              const clampedX = Math.max(0, Math.min(result.x, maxX));
              const clampedY = Math.max(0, Math.min(result.y, maxY));
              
              const textRef = textOverlayRefsMap.current.get(current.id);
              if (textRef) {
                textRef.setRelativePosition({ x: clampedX, y: clampedY });
              }
              const imageRef = imageOverlayRefsMap.current.get(current.id);
              if (imageRef) {
                imageRef.setRelativePosition({ x: clampedX, y: clampedY });
              }
              
              current.x = clampedX;
              current.y = clampedY;
              anyCollisionResolved = true;
            }
          }
        }
        
        if (!anyCollisionResolved) {
          break;
        }
      }
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [imageSrc, previewBounds, overlays, getAnyOverlayBounds]);

  const clampRatio = (val: number) => Math.max(1, Math.min(32, Math.round(val) || 1));
  const parseRatio = (input: string) => {
    const num = parseInt(input, 10);
    return isNaN(num) ? 1 : clampRatio(num);
  };
  const safeH = parseRatio(hInput);
  const safeW = parseRatio(wInput);

  const handleBlur = (setter: (val: string) => void, input: string) => {
    const validated = parseRatio(input);
    setter(String(validated));
  };

  const handleIncrement = (setter: (val: string) => void, current: string) => {
    const num = parseInt(current, 10) || 0;
    const newVal = Math.min(32, num + 1);
    setter(String(newVal));
  };

  const handleDecrement = (setter: (val: string) => void, current: string) => {
    const num = parseInt(current, 10) || 0;
    const newVal = Math.max(1, num - 1);
    setter(String(newVal));
  };

  const padding = 4;
  const availableWidth = viewport.vw - padding * 2;
  const availableHeight = viewport.vh - headerHeight - padding;
  const aspectRatio = safeW / safeH;

  let widthPx: number;
  let heightPx: number;

  if (availableWidth / availableHeight > aspectRatio) {
    heightPx = availableHeight;
    widthPx = heightPx * aspectRatio;
  } else {
    widthPx = availableWidth;
    heightPx = widthPx / aspectRatio;
  }

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  const handleOpenFile = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setImageSrc(url);
        setScale(1);
        setTranslateX(0);
        setTranslateY(0);
        setRotation(0);
        pushHistory();
      }
    };
    input.click();
  }, [pushHistory]);

  const handleTranslateChange = useCallback((x: number, y: number) => {
    setTranslateX(x);
    setTranslateY(y);
  }, []);

  const handleBoundsChange = useCallback((bounds: { x: number; y: number; width: number; height: number }) => {
    setPreviewBounds(bounds);
  }, []);

  const handleResetPosition = useCallback(() => {
    setTranslateX(0);
    setTranslateY(0);
    pushHistory();
  }, [pushHistory]);

  const handleAddCustomFont = useCallback((fontName: string, fontDataUrl: string) => {
    const fontFace = new FontFace(fontName, `url(${fontDataUrl})`);
    fontFace.load().then((loaded) => {
      (document.fonts as unknown as { add: (font: FontFace) => void }).add(loaded);
      setCustomFonts((prev) => (prev.includes(fontName) ? prev : [...prev, fontName]));
      pushHistory();
    });
  }, [pushHistory]);

  const addImageOverlay = useCallback((imageSrcUrl: string, width: number, height: number) => {
    const id = `image-${nextImageIdRef.current}`;
    const maxWidth = Math.min(width, previewBounds.width * 0.5);
    const scaleRatio = maxWidth / width;
    const scaledWidth = width * scaleRatio;
    const scaledHeight = height * scaleRatio;

    const newOverlay: ImageOverlay = {
      id,
      type: "image",
      label: `Image ${nextImageIdRef.current}`,
      src: imageSrcUrl,
      position: { x: 20, y: 20 },
      width: scaledWidth,
      height: scaledHeight,
      isPermanent: false,
    };

    nextImageIdRef.current += 1;
    setOverlays((prevOverlays) => [...prevOverlays, newOverlay]);
    pushHistory();
  }, [previewBounds.width, pushHistory]);

  const deleteImageOverlay = useCallback((id: string) => {
    setOverlays((prev) => {
      const overlay = prev.find((o) => o.id === id);
      if (overlay && overlay.type === "image" && overlay.src.startsWith("blob:")) {
        URL.revokeObjectURL(overlay.src);
      }
      return prev.filter((o) => o.id !== id || o.isPermanent);
    });
    imageOverlayRefsMap.current.delete(id);
    pushHistory();
  }, [pushHistory]);

  const handleAddImageOverlay = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          addImageOverlay(url, img.width, img.height);
        };
        img.src = url;
      }
    };
    input.click();
  }, [addImageOverlay]);

  const syncOverlayPositionsFromRefs = useCallback(() => {
    setOverlays((prev) =>
      prev.map((overlay) => {
        if (overlay.type === "text") {
          const ref = getOverlayRef(overlay.id);
          if (ref) {
            return { ...overlay, position: ref.getRelativePosition() };
          }
        } else if (overlay.type === "image") {
          const ref = getImageOverlayRef(overlay.id);
          if (ref) {
            const size = ref.getSize();
            return { ...overlay, position: ref.getRelativePosition(), width: size.width, height: size.height };
          }
        }
        return overlay;
      })
    );
  }, [getOverlayRef, getImageOverlayRef]);

  const handleSavePreset = useCallback((name: string) => {
    syncOverlayPositionsFromRefs();

    const currentOverlays = overlays.map((overlay) => {
      if (overlay.type === "text") {
        const ref = getOverlayRef(overlay.id);
        if (ref) {
          return { ...overlay, position: { ...ref.getRelativePosition() } };
        }
      } else if (overlay.type === "image") {
        const ref = getImageOverlayRef(overlay.id);
        if (ref) {
          const size = ref.getSize();
          return { ...overlay, position: { ...ref.getRelativePosition() }, width: size.width, height: size.height };
        }
      }
      return { ...overlay, position: { ...overlay.position } };
    });

    addPreset({
      name,
      scale,
      translateX,
      translateY,
      rotation,
      textColor,
      shadowColor,
      shadowBlur,
      shadowOffsetX,
      shadowOffsetY,
      customFonts,
      overlays: currentOverlays,
    });
  }, [scale, translateX, translateY, rotation, textColor, shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY, customFonts, overlays, getOverlayRef, getImageOverlayRef, syncOverlayPositionsFromRefs]);

  const handleLoadPreset = useCallback((preset: TimestampPreset) => {
    setScale(preset.scale);
    setTranslateX(preset.translateX);
    setTranslateY(preset.translateY);
    setRotation(preset.rotation);
    setTextColor(preset.textColor);
    setShadowColor(preset.shadowColor);
    setShadowBlur(preset.shadowBlur);
    setShadowOffsetX(preset.shadowOffsetX);
    setShadowOffsetY(preset.shadowOffsetY);
    setCustomFonts([...preset.customFonts]);

    setOverlays((prevOverlays) => {
      prevOverlays.forEach((o) => {
        if (o.type === "image" && o.src.startsWith("blob:")) {
          URL.revokeObjectURL(o.src);
        }
      });
      return prevOverlays;
    });

    imageOverlayRefsMap.current.clear();

    const restoredOverlays = preset.overlays.map((o) => ({
      ...o,
      position: { ...o.position },
    }));

    setOverlays(restoredOverlays);

    let maxImageId = 0;
    restoredOverlays.forEach((o) => {
      if (o.type === "image") {
        const numPart = parseInt(o.id.replace("image-", ""), 10);
        if (!isNaN(numPart) && numPart >= maxImageId) {
          maxImageId = numPart + 1;
        }
      }
    });
    nextImageIdRef.current = maxImageId;

    setTimeout(() => {
      restoredOverlays.forEach((o) => {
        if (o.type === "text") {
          getOverlayRef(o.id)?.setRelativePosition(o.position);
        } else if (o.type === "image") {
          getImageOverlayRef(o.id)?.setRelativePosition(o.position);
        }
      });
    }, 0);

    pushHistory();
  }, [pushHistory, getOverlayRef, getImageOverlayRef]);

  const handleSave = useCallback(async () => {
    if (!imageSrc) return;

    const canvas = document.createElement("canvas");
    canvas.width = widthPx;
    canvas.height = heightPx;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    ctx.save();
    ctx.translate(canvas.width / 2 + translateX, canvas.height / 2 + translateY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();

    type ImageLoadResult = { img: HTMLImageElement; x: number; y: number; w: number; h: number } | null;
    const imageLoadPromises: Promise<ImageLoadResult>[] = [];

    overlays.forEach((overlay) => {
      if (overlay.type === "text") {
        const ref = getOverlayRef(overlay.id);
        if (ref) {
          const relPos = ref.getRelativePosition();
          const size = ref.getSize();

          const shadowActive = overlay.shadowEnabled === true;
          const paddingX = 2;

          ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
          ctx.fillStyle = textColor;
          ctx.shadowColor = shadowActive ? shadowColor : "transparent";
          ctx.shadowBlur = shadowActive ? shadowBlur : 0;
          ctx.shadowOffsetX = shadowActive ? shadowOffsetX : 0;
          ctx.shadowOffsetY = shadowActive ? shadowOffsetY : 0;
          ctx.textAlign = overlay.textAlign;

          let xPos: number;
          if (overlay.textAlign === "center") {
            xPos = relPos.x + size.width / 2;
          } else if (overlay.textAlign === "right") {
            xPos = relPos.x + size.width - paddingX;
          } else {
            xPos = relPos.x + paddingX;
          }

          const lines = overlay.text.split("\n");
          lines.forEach((line, i) => {
            ctx.fillText(line, xPos, relPos.y + overlay.fontSize + i * overlay.fontSize * 1.2);
          });
        }
      } else if (overlay.type === "image") {
        const ref = getImageOverlayRef(overlay.id);
        if (ref) {
          const relPos = ref.getRelativePosition();
          const size = ref.getSize();
          const imgSrc = overlay.src;
          const loadPromise = new Promise<{ img: HTMLImageElement; x: number; y: number; w: number; h: number } | null>((resolve) => {
            const overlayImg = new Image();
            overlayImg.crossOrigin = "anonymous";
            overlayImg.onload = () => {
              resolve({ img: overlayImg, x: relPos.x, y: relPos.y, w: size.width, h: size.height });
            };
            overlayImg.onerror = () => resolve(null);
            overlayImg.src = imgSrc;
          });
          imageLoadPromises.push(loadPromise);
        }
      }
    });

    const loadedImages = await Promise.all(imageLoadPromises);
    loadedImages.forEach((loaded) => {
      if (loaded) {
        ctx.drawImage(loaded.img, loaded.x, loaded.y, loaded.w, loaded.h);
      }
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "timestamp-photo.png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [imageSrc, widthPx, heightPx, translateX, translateY, rotation, scale, textColor, shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY, overlays, getOverlayRef, getImageOverlayRef]);

  const handleSettingsChange = useCallback(() => {
    pushHistory();
  }, [pushHistory]);

  const MARGIN = 20;

  const handleAlignmentChange = useCallback((overlayId: string, textAlign: TextAlign) => {
    const ref = getOverlayRef(overlayId);
    if (!ref || previewBounds.width === 0) return;

    const size = ref.getSize();
    const currentPos = ref.getRelativePosition();
    let newX: number;

    if (size.width === 0) {
      newX = currentPos.x;
    } else if (textAlign === "left") {
      newX = MARGIN;
    } else if (textAlign === "center") {
      newX = (previewBounds.width - size.width) / 2;
    } else {
      newX = previewBounds.width - size.width - MARGIN;
    }

    const newPos = { x: newX, y: currentPos.y };
    ref.setRelativePosition(newPos);

    setOverlays((prev) =>
      prev.map((overlay) =>
        overlay.id === overlayId && overlay.type === "text"
          ? { ...overlay, textAlign, position: newPos }
          : overlay
      )
    );

    pushHistory();
  }, [previewBounds.width, pushHistory, getOverlayRef]);

  const handleOverlaySettingsChange = useCallback((overlayId: string, updates: Partial<TextOverlay>) => {
    syncOverlayPositionsFromRefs();
    setOverlays((prev) =>
      prev.map((overlay) =>
        overlay.id === overlayId && overlay.type === "text"
          ? { ...overlay, ...updates }
          : overlay
      )
    );
    handleSettingsChange();
  }, [handleSettingsChange, syncOverlayPositionsFromRefs]);

  const timeOverlay = overlays.find((o) => o.id === "time") as TextOverlay | undefined;
  const dateOverlay = overlays.find((o) => o.id === "date") as TextOverlay | undefined;
  const locationOverlay = overlays.find((o) => o.id === "location") as TextOverlay | undefined;

  const toOverlaySettings = (overlay: TextOverlay | undefined) => {
    if (!overlay) {
      return {
        text: "",
        fontFamily: "sans-serif",
        fontSize: 24,
        textAlign: "left" as TextAlign,
        position: { x: 20, y: 20 },
        shadowEnabled: false,
      };
    }
    return {
      text: overlay.text,
      fontFamily: overlay.fontFamily,
      fontSize: overlay.fontSize,
      textAlign: overlay.textAlign,
      position: overlay.position,
      shadowEnabled: overlay.shadowEnabled === true,
    };
  };

  const getOtherOverlayBounds = useCallback((currentId: string) => {
    return overlays
      .filter((o) => o.id !== currentId)
      .map((o) => {
        const bounds = getAnyOverlayBounds(o.id);
        if (bounds) {
          return bounds;
        }
        if (o.type === "image") {
          return {
            id: o.id,
            x: o.position.x,
            y: o.position.y,
            width: o.width,
            height: o.height,
          };
        }
        const textOverlay = o as TextOverlay;
        const estimatedCharWidth = textOverlay.fontSize * 0.6;
        const shadowActive = textOverlay.shadowEnabled === true;
        const shadowBuffer = shadowActive ? shadowBlur * 2 : 0;
        const estimatedWidth = Math.max(100, textOverlay.text.length * estimatedCharWidth + 4 + shadowBuffer);
        const estimatedHeight = textOverlay.fontSize + 2 + shadowBuffer;
        return {
          id: o.id,
          x: o.position.x,
          y: o.position.y,
          width: estimatedWidth,
          height: estimatedHeight,
        };
      });
  }, [overlays, getAnyOverlayBounds, shadowBlur]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-white">
      <TimestampHeader
        ref={headerRef}
        onBack={onBack}
        hInput={hInput}
        wInput={wInput}
        onHInputChange={setHInput}
        onWInputChange={setWInput}
        onHInputBlur={() => handleBlur(setHInput, hInput)}
        onWInputBlur={() => handleBlur(setWInput, wInput)}
        onHIncrement={() => handleIncrement(setHInput, hInput)}
        onHDecrement={() => handleDecrement(setHInput, hInput)}
        onWIncrement={() => handleIncrement(setWInput, wInput)}
        onWDecrement={() => handleDecrement(setWInput, wInput)}
        onOpen={handleOpenFile}
        onSettings={handleOpenSettings}
        onSave={handleSave}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />
      <TimestampPreview
        widthPx={widthPx}
        heightPx={heightPx}
        imageSrc={imageSrc}
        scale={scale}
        translateX={translateX}
        translateY={translateY}
        rotation={rotation}
        onScaleChange={setScale}
        onTranslateChange={handleTranslateChange}
        onBoundsChange={handleBoundsChange}
      />

      {previewBounds.width > 0 && (
        <>
          {overlays.map((overlay) => {
            if (overlay.type === "text") {
              return (
                <TimestampFloating
                  key={overlay.id}
                  id={overlay.id}
                  ref={(ref) => setOverlayRef(overlay.id, ref)}
                  label={overlay.label}
                  value={overlay.text}
                  boundingRect={previewBounds}
                  initialRelativePos={overlay.position}
                  fontFamily={overlay.fontFamily}
                  fontSize={overlay.fontSize}
                  color={textColor}
                  shadowColor={shadowColor}
                  shadowBlur={shadowBlur}
                  shadowOffsetX={shadowOffsetX}
                  shadowOffsetY={shadowOffsetY}
                  textAlign={overlay.textAlign}
                  noWrap={overlay.noWrap}
                  shadowEnabled={overlay.shadowEnabled}
                  otherOverlayBounds={getOtherOverlayBounds(overlay.id)}
                  showDebugBounds={showDebugBounds}
                />
              );
            }
            if (overlay.type === "image") {
              return (
                <ImageFloating
                  key={overlay.id}
                  id={overlay.id}
                  ref={(ref) => setImageOverlayRef(overlay.id, ref)}
                  src={overlay.src}
                  boundingRect={previewBounds}
                  initialRelativePos={overlay.position}
                  initialSize={{ width: overlay.width, height: overlay.height }}
                  otherOverlayBounds={getOtherOverlayBounds(overlay.id)}
                  onDelete={() => deleteImageOverlay(overlay.id)}
                  showDebugBounds={showDebugBounds}
                />
              );
            }
            return null;
          })}
        </>
      )}

      {showSettings && (
        <div ref={settingsRef}>
          <TimestampSettings
            textColor={textColor}
            onTextColorChange={(v) => { setTextColor(v); handleSettingsChange(); }}
            shadowColor={shadowColor}
            onShadowColorChange={(v) => { setShadowColor(v); handleSettingsChange(); }}
            shadowBlur={shadowBlur}
            onShadowBlurChange={(v) => { setShadowBlur(v); handleSettingsChange(); }}
            shadowOffsetX={shadowOffsetX}
            onShadowOffsetXChange={(v) => { setShadowOffsetX(v); handleSettingsChange(); }}
            shadowOffsetY={shadowOffsetY}
            onShadowOffsetYChange={(v) => { setShadowOffsetY(v); handleSettingsChange(); }}
            scale={scale}
            onScaleChange={(v) => { setScale(v); handleSettingsChange(); }}
            translateX={translateX}
            onTranslateXChange={(v) => { setTranslateX(v); handleSettingsChange(); }}
            translateY={translateY}
            onTranslateYChange={(v) => { setTranslateY(v); handleSettingsChange(); }}
            rotation={rotation}
            onRotationChange={(v) => { setRotation(v); handleSettingsChange(); }}
            onResetPosition={handleResetPosition}
            customFonts={customFonts}
            onAddCustomFont={handleAddCustomFont}
            timeSettings={toOverlaySettings(timeOverlay)}
            onTimeSettingsChange={(v) => handleOverlaySettingsChange("time", v)}
            dateSettings={toOverlaySettings(dateOverlay)}
            onDateSettingsChange={(v) => handleOverlaySettingsChange("date", v)}
            locationSettings={toOverlaySettings(locationOverlay)}
            onLocationSettingsChange={(v) => handleOverlaySettingsChange("location", v)}
            previewBounds={previewBounds}
            onTimeAlignmentChange={(align) => handleAlignmentChange("time", align)}
            onDateAlignmentChange={(align) => handleAlignmentChange("date", align)}
            onLocationAlignmentChange={(align) => handleAlignmentChange("location", align)}
            onSavePreset={handleSavePreset}
            onLoadPreset={handleLoadPreset}
            onAddImageOverlay={handleAddImageOverlay}
            onClose={handleCloseSettings}
          />
        </div>
      )}
    </div>
  );
}
