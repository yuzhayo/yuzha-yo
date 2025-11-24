import React from "react";

export type PositionPreset = "bottom-left" | "bottom-right" | "top-left" | "top-right" | "center" | "custom";
export type TextMode = "guided" | "custom";
export type DateMode = "picker" | "manual";
export type FrameRatioId = (typeof FRAME_RATIO_OPTIONS)[number]["id"] | "custom";
export type TextAlignOption = "left" | "center" | "right";
export type PresetName = string;

export type LoadedImage = {
  url: string;
  name: string;
  width: number;
  height: number;
  element: HTMLImageElement;
};

export type StampLine = { text: string; size: number; align: TextAlignOption };

export type StampSpec = {
  padding: number;
  width: number;
  height: number;
  fontFamily: string;
  lines: StampLine[];
  lineSpacing: number;
};

export type FrameSize = { width: number; height: number };
export type Offset = { x: number; y: number };

export type TimestampPreset = {
  name: PresetName;
  textMode: TextMode;
  dateMode: DateMode;
  datePickerValue: string;
  dateManual: string;
  timeFormat: "24h" | "12h";
  timeValue: string;
  timeRandomStart: string;
  timeRandomEnd: string;
  locationLines: string[];
  customText: string;
  styles: TextStyleState;
  frameRatioId: FrameRatioId;
  customRatio: { w: number; h: number };
  positionPreset: PositionPreset;
  customCenter: { x: number; y: number };
  zoom: number;
  imageOffset: Offset;
};

export const FRAME_RATIO_OPTIONS = [
  { id: "2:1", label: "2:1", w: 2, h: 1 },
  { id: "16:9", label: "16:9", w: 16, h: 9 },
  { id: "4:3", label: "4:3", w: 4, h: 3 },
  { id: "3:4", label: "3:4", w: 3, h: 4 },
  { id: "1:1", label: "1:1", w: 1, h: 1 },
] as const;

export const POSITION_PRESETS: { id: PositionPreset; label: string }[] = [
  { id: "bottom-left", label: "Bottom Left" },
  { id: "bottom-right", label: "Bottom Right" },
  { id: "top-left", label: "Top Left" },
  { id: "top-right", label: "Top Right" },
  { id: "center", label: "Center" },
  { id: "custom", label: "Custom (drag)" },
];

const DEFAULT_LOCATION_LINES = ["Jakarta", "Indonesia"];
const DEFAULT_FONT_FAMILY = `"Inter", "Segoe UI", sans-serif`;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 3;
const DATE_DISPLAY_FORMAT = "dd - MM - yyyy";

function clamp01(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function clampToRange(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampOffset(value: Offset, limit: Offset): Offset {
  return {
    x: clampToRange(value.x, -limit.x, limit.x),
    y: clampToRange(value.y, -limit.y, limit.y),
  };
}

function randomTimeString() {
  const h = Math.floor(Math.random() * 24);
  const m = Math.floor(Math.random() * 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function formatTimeForDisplay(timeValue: string, mode: "24h" | "12h") {
  if (mode === "24h") return timeValue;
  const [hStr, mStr] = timeValue.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return timeValue;
  const isPM = h >= 12;
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH.toString().padStart(2, "0")}:${mStr} ${isPM ? "PM" : "AM"}`;
}

function defaultDateString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${dd}-${mm}-${yyyy}`;
}

function defaultDateIso() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateIsoToDisplay(iso: string) {
  if (!iso) return "";
  const [yyyy, mm, dd] = iso.split("-");
  if (!yyyy || !mm || !dd) return iso;
  return DATE_DISPLAY_FORMAT.replace("dd", dd).replace("MM", mm).replace("yyyy", yyyy);
}

function loadPresetsFromStorage(): TimestampPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("timestamp-presets");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function savePresetsToStorage(presets: TimestampPreset[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("timestamp-presets", JSON.stringify(presets));
  } catch {
    /* ignore */
  }
}

function getFrameRatioById(id: FrameRatioId) {
  if (id === "custom") return null;
  return FRAME_RATIO_OPTIONS.find((r) => r.id === id) ?? FRAME_RATIO_OPTIONS[0];
}

function measureStamp(lines: StampLine[], lineSpacing: number, baseWidth: number): StampSpec {
  const paddingBase = Math.max(14, Math.min(72, Math.round(baseWidth * 0.02)));
  const padding = paddingBase;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const measureLine = (line: StampLine) => {
    if (!ctx) return line.text.length * line.size * 0.48;
    ctx.font = `${line.size}px ${DEFAULT_FONT_FAMILY}`;
    return ctx.measureText(line.text).width;
  };

  let maxWidth = 0;
  let totalHeight = 0;
  lines.forEach((line, idx) => {
    const w = measureLine(line);
    maxWidth = Math.max(maxWidth, w);
    const lineHeight = line.size * 1.25;
    totalHeight += lineHeight;
    if (idx < lines.length - 1) {
      totalHeight += lineHeight * (lineSpacing - 1);
    }
  });

  return {
    padding,
    width: Math.round(maxWidth + padding * 2),
    height: Math.round(totalHeight + padding * 2),
    fontFamily: DEFAULT_FONT_FAMILY,
    lines,
    lineSpacing,
  };
}

function computeCenterFromPreset(
  preset: PositionPreset,
  spec: StampSpec,
  frame: { width: number; height: number },
  currentCustom: { x: number; y: number },
): { x: number; y: number } {
  if (preset === "custom") return currentCustom;

  const margin = Math.max(24, Math.round(frame.width * 0.02));
  const marginX = margin / frame.width;
  const marginY = margin / frame.height;
  const widthNorm = spec.width / frame.width;
  const heightNorm = spec.height / frame.height;

  const centerFor = (x: number, y: number) => ({
    x: clamp01(x),
    y: clamp01(y),
  });

  if (preset === "bottom-left") {
    return centerFor(marginX + widthNorm / 2, 1 - marginY - heightNorm / 2);
  }
  if (preset === "bottom-right") {
    return centerFor(1 - marginX - widthNorm / 2, 1 - marginY - heightNorm / 2);
  }
  if (preset === "top-left") {
    return centerFor(marginX + widthNorm / 2, marginY + heightNorm / 2);
  }
  if (preset === "top-right") {
    return centerFor(1 - marginX - widthNorm / 2, marginY + heightNorm / 2);
  }
  if (preset === "center") {
    return centerFor(0.5, 0.5);
  }

  return currentCustom;
}

function centerToTopLeftPx(
  center: { x: number; y: number },
  spec: StampSpec,
  frame: { width: number; height: number },
) {
  const cx = center.x * frame.width;
  const cy = center.y * frame.height;
  const x = clampToRange(cx - spec.width / 2, 0, frame.width - spec.width);
  const y = clampToRange(cy - spec.height / 2, 0, frame.height - spec.height);
  return { x, y };
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

type TextStyleState = {
  timeSize: number;
  dateSize: number;
  locationSize: number;
  customSize: number;
  lineSpacing: number;
  alignTime: TextAlignOption;
  alignDate: TextAlignOption;
  alignLocation: TextAlignOption;
  alignCustom: TextAlignOption;
};

function buildStampLines(
  mode: TextMode,
  guided: { time: string; date: string; locationLines: string[] },
  styles: TextStyleState,
  customText: string,
): StampLine[] {
  if (mode === "custom") {
    const lines = customText.split(/\r?\n/).map((l) => l.trimEnd());
    const filtered = lines.length > 0 ? lines : [""];
    return filtered.map((text) => ({ text, size: styles.customSize, align: styles.alignCustom }));
  }

  const lines: StampLine[] = [];
  if (guided.time) lines.push({ text: guided.time, size: styles.timeSize, align: styles.alignTime });
  if (guided.date) lines.push({ text: guided.date, size: styles.dateSize, align: styles.alignDate });
  guided.locationLines
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((loc) => lines.push({ text: loc, size: styles.locationSize, align: styles.alignLocation }));

  if (lines.length === 0) {
    lines.push({ text: "Tambahkan teks", size: styles.timeSize, align: styles.alignTime });
  }

  return lines;
}

export function useTimestampState() {
  const [photo, setPhoto] = React.useState<LoadedImage | null>(null);
  const [frameRatioId, setFrameRatioId] = React.useState<FrameRatioId>("4:3");
  const [customRatio, setCustomRatio] = React.useState<{ w: number; h: number }>({ w: 4, h: 3 });
  const [frameSize, setFrameSize] = React.useState<FrameSize | null>(null);
  const [zoom, setZoom] = React.useState(1);
  const [imageOffset, setImageOffset] = React.useState<Offset>({ x: 0, y: 0 });

  const [textMode, setTextMode] = React.useState<TextMode>("guided");
  const [dateMode, setDateMode] = React.useState<DateMode>("picker");
  const [datePickerValue, setDatePickerValue] = React.useState(defaultDateIso());
  const [dateManual, setDateManual] = React.useState(defaultDateString());
  const [timeFormat, setTimeFormat] = React.useState<"24h" | "12h">("24h");
  const [timeRandomStart, setTimeRandomStart] = React.useState("08:00");
  const [timeRandomEnd, setTimeRandomEnd] = React.useState("20:00");
  const [timeValue, setTimeValue] = React.useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });
  const [locationLines, setLocationLines] = React.useState<string[]>(DEFAULT_LOCATION_LINES);
  const [customText, setCustomText] = React.useState("12.00\n24 - 11 - 2025\nJakarta\nIndonesia");
  const [styles, setStyles] = React.useState<TextStyleState>({
    timeSize: 32,
    dateSize: 28,
    locationSize: 24,
    customSize: 28,
    lineSpacing: 1.2,
    alignTime: "left",
    alignDate: "left",
    alignLocation: "left",
    alignCustom: "left",
  });
  const [presets, setPresets] = React.useState<TimestampPreset[]>([]);
  const [activePreset, setActivePreset] = React.useState<PresetName | null>(null);

  const [positionPreset, setPositionPreset] = React.useState<PositionPreset>("bottom-left");
  const [customCenter, setCustomCenter] = React.useState({ x: 0.18, y: 0.82 });
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState<string | null>(null);
  const [isStampDragging, setIsStampDragging] = React.useState(false);
  const [isPanning, setIsPanning] = React.useState(false);
  const previewRef = React.useRef<HTMLDivElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const imageObjectUrlRef = React.useRef<string | null>(null);
  const panStartRef = React.useRef<{ x: number; y: number; offset: Offset }>({
    x: 0,
    y: 0,
    offset: { x: 0, y: 0 },
  });

  const frameRatioPreset = getFrameRatioById(frameRatioId);
  const frameRatio = frameRatioPreset ?? { w: customRatio.w, h: customRatio.h };

  const displayDate = React.useMemo(
    () => (dateMode === "picker" ? formatDateIsoToDisplay(datePickerValue) : dateManual),
    [dateMode, dateManual, datePickerValue],
  );
  const displayTime = React.useMemo(() => formatTimeForDisplay(timeValue, timeFormat), [timeFormat, timeValue]);

  const stampLines = React.useMemo(
    () =>
      buildStampLines(
        textMode,
        { time: displayTime, date: displayDate, locationLines },
        styles,
        customText,
      ),
    [textMode, displayTime, displayDate, locationLines, styles, customText],
  );

  const baseScale = React.useMemo(() => {
    if (!photo || !frameSize) return 1;
    return Math.min(frameSize.width / photo.width, frameSize.height / photo.height);
  }, [photo, frameSize]);

  const scaledImage = React.useMemo(() => {
    if (!photo) return { width: 0, height: 0 };
    const finalScale = baseScale * zoom;
    return {
      width: photo.width * finalScale,
      height: photo.height * finalScale,
    };
  }, [photo, baseScale, zoom]);

  const offsetLimit = React.useMemo<Offset>(() => {
    if (!frameSize || !photo) return { x: 0, y: 0 };
    const halfX = Math.max(0, (scaledImage.width - frameSize.width) / 2);
    const halfY = Math.max(0, (scaledImage.height - frameSize.height) / 2);
    return { x: halfX, y: halfY };
  }, [frameSize, photo, scaledImage.height, scaledImage.width]);

  React.useEffect(() => {
    setImageOffset((prev) => clampOffset(prev, offsetLimit));
  }, [offsetLimit]);

  const stampSpec = React.useMemo(() => {
    const baseWidth = frameSize?.width ?? photo?.width ?? 1024;
    return measureStamp(stampLines, styles.lineSpacing, baseWidth);
  }, [frameSize?.width, photo?.width, stampLines, styles.lineSpacing]);

  React.useEffect(() => {
    if (!frameSize || !stampSpec) return;
    if (positionPreset === "custom") return;
    const nextCenter = computeCenterFromPreset(positionPreset, stampSpec, frameSize, customCenter);
    if (nextCenter.x !== customCenter.x || nextCenter.y !== customCenter.y) {
      setCustomCenter(nextCenter);
    }
  }, [customCenter.x, customCenter.y, frameSize, positionPreset, stampSpec]);

  React.useEffect(() => {
    return () => {
      if (imageObjectUrlRef.current) {
        URL.revokeObjectURL(imageObjectUrlRef.current);
      }
    };
  }, []);

  const loadFile = React.useCallback((file?: File) => {
    if (!file) return;
    if (imageObjectUrlRef.current) {
      URL.revokeObjectURL(imageObjectUrlRef.current);
      imageObjectUrlRef.current = null;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imageObjectUrlRef.current = url;
      setPhoto({
        url,
        name: file.name,
        width: img.naturalWidth,
        height: img.naturalHeight,
        element: img,
      });
      setImageOffset({ x: 0, y: 0 });
      setZoom(1);
      setStatus(null);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setStatus("Gagal memuat gambar. Coba file lain.");
    };
    img.src = url;
  }, []);

  const handleFileInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    loadFile(e.target.files?.[0]);
  };

  const handleBrowseClick = () => fileInputRef.current?.click();

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
      loadFile(file);
    }
  };

  const handleDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
  };

  const frameBox = React.useMemo(() => {
    if (!frameSize) return null;
    const clampedOffset = clampOffset(imageOffset, offsetLimit);
    const left = frameSize.width / 2 - scaledImage.width / 2 + clampedOffset.x;
    const top = frameSize.height / 2 - scaledImage.height / 2 + clampedOffset.y;
    return {
      width: frameSize.width,
      height: frameSize.height,
      imgLeft: left,
      imgTop: top,
      imgWidth: scaledImage.width,
      imgHeight: scaledImage.height,
    };
  }, [frameSize, imageOffset, offsetLimit, scaledImage.height, scaledImage.width]);

  const activeCenter = React.useMemo(() => {
    if (!frameSize || !stampSpec) return customCenter;
    return computeCenterFromPreset(positionPreset, stampSpec, frameSize, customCenter);
  }, [frameSize, stampSpec, positionPreset, customCenter]);

  const handlePresetChange = (preset: PositionPreset) => {
    setPositionPreset(preset);
    if (!frameSize || !stampSpec) return;
    const center = computeCenterFromPreset(preset, stampSpec, frameSize, customCenter);
    setCustomCenter(center);
  };

  const handleFrameRatioChange = (id: FrameRatioId) => {
    setFrameRatioId(id);
    if (id !== "custom") {
      const preset = getFrameRatioById(id);
      if (preset) setCustomRatio({ w: preset.w, h: preset.h });
    }
  };

  const handleCustomRatioChange = (patch: { w?: number; h?: number }) => {
    setFrameRatioId("custom");
    setCustomRatio((prev) => ({
      w: patch.w ? clampToRange(patch.w, 0.5, 10) : prev.w,
      h: patch.h ? clampToRange(patch.h, 0.5, 10) : prev.h,
    }));
  };

  const handleZoomChange = (value: number) => {
    const clamped = clampToRange(value, MIN_ZOOM, MAX_ZOOM);
    setZoom(clamped);
  };

  const handleOffsetChange = (next: Offset) => {
    setImageOffset(clampOffset(next, offsetLimit));
  };

  const handleResetView = () => {
    setZoom(1);
    setImageOffset({ x: 0, y: 0 });
  };

  const updatePositionFromPointer = (clientX: number, clientY: number) => {
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    setPositionPreset("custom");
    setCustomCenter({ x: clamp01(x), y: clamp01(y) });
  };

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!photo) return;
    const isPanGesture = e.altKey || e.button === 1 || e.button === 2;
    if (isPanGesture) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY, offset: imageOffset };
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      return;
    }
    setIsStampDragging(true);
    updatePositionFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      const nextOffset = {
        x: panStartRef.current.offset.x + dx,
        y: panStartRef.current.offset.y + dy,
      };
      setImageOffset(clampOffset(nextOffset, offsetLimit));
      return;
    }
    if (!isStampDragging) return;
    updatePositionFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (isPanning) {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    }
    setIsPanning(false);
    setIsStampDragging(false);
  };

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    if (!photo) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    const nextZoom = clampToRange(zoom + delta, MIN_ZOOM, MAX_ZOOM);
    setZoom(nextZoom);
  };

  const handleSave = async () => {
    if (!photo || !frameSize || !stampSpec) {
      setStatus("Pilih foto dulu sebelum menyimpan.");
      return;
    }

    setSaving(true);
    setStatus(null);

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(frameSize.width);
    canvas.height = Math.round(frameSize.height);
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setSaving(false);
      setStatus("Context canvas tidak tersedia.");
      return;
    }

    const finalScale = baseScale * zoom;
    const clampedOffset = clampOffset(imageOffset, offsetLimit);
    const drawWidth = photo.width * finalScale;
    const drawHeight = photo.height * finalScale;
    const drawX = frameSize.width / 2 - drawWidth / 2 + clampedOffset.x;
    const drawY = frameSize.height / 2 - drawHeight / 2 + clampedOffset.y;

    ctx.drawImage(photo.element, drawX, drawY, drawWidth, drawHeight);

    const center = activeCenter;
    const { x, y } = centerToTopLeftPx(center, stampSpec, frameSize);

    const radius = Math.round(Math.max(10, stampSpec.padding * 0.6));
    drawRoundedRect(ctx, x, y, stampSpec.width, stampSpec.height, radius);
    ctx.fillStyle = "rgba(15,15,15,0.55)";
    ctx.filter = "blur(0px)";
    ctx.fill();
    ctx.filter = "none";

    let currentY = y + stampSpec.padding;
    stampSpec.lines.forEach((line, idx) => {
      const align = line.align;
      let drawXAligned = x + stampSpec.padding;
      if (align === "center") drawXAligned = x + stampSpec.width / 2;
      if (align === "right") drawXAligned = x + stampSpec.width - stampSpec.padding;

      ctx.font = `${line.size}px ${stampSpec.fontFamily}`;
      ctx.fillStyle = "rgba(255,255,255,0.96)";
      ctx.textBaseline = "top";
      ctx.textAlign = align;
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = line.size * 0.22;
      ctx.fillText(line.text, drawXAligned, currentY);
      ctx.shadowBlur = 0;
      const lineHeight = line.size * 1.25;
      currentY += lineHeight;
      if (idx < stampSpec.lines.length - 1) {
        currentY += lineHeight * (stampSpec.lineSpacing - 1);
      }
    });

    const downloadName = `${photo.name?.replace(/\.[^/.]+$/, "") || "photo"}-timestamp.png`;
    canvas.toBlob((blob) => {
      if (!blob) {
        setStatus("Gagal membuat file.");
        setSaving(false);
        return;
      }
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = downloadName;
      a.click();
      URL.revokeObjectURL(blobUrl);
      setSaving(false);
      setStatus("Berhasil disimpan.");
    }, "image/png");
  };

  const handlePreviewResize = (size: FrameSize) => {
    setFrameSize((prev) => {
      if (prev && Math.round(prev.width) === Math.round(size.width) && Math.round(prev.height) === Math.round(size.height)) {
        return prev;
      }
      return size;
    });
  };

  const randomizeTime = () => setTimeValue(randomTimeString());
  const randomizeTimeInRange = () => {
    const parse = (t: string) => {
      const [h, m] = t.split(":").map((v) => Number(v));
      if (Number.isNaN(h) || Number.isNaN(m)) return null;
      return h * 60 + m;
    };
    const startMin = parse(timeRandomStart);
    const endMin = parse(timeRandomEnd);
    if (startMin === null || endMin === null || endMin < startMin) {
      setStatus("Range waktu tidak valid");
      return;
    }
    const span = endMin - startMin;
    const rand = startMin + Math.floor(Math.random() * (span + 1));
    const hh = String(Math.floor(rand / 60)).padStart(2, "0");
    const mm = String(rand % 60).padStart(2, "0");
    setTimeValue(`${hh}:${mm}`);
    setStatus(null);
  };

  const buildPresetFromState = React.useCallback(
    (name: string): TimestampPreset => ({
      name,
      textMode,
      dateMode,
      datePickerValue,
      dateManual,
      timeFormat,
      timeValue,
      timeRandomStart,
      timeRandomEnd,
      locationLines,
      customText,
      styles,
      frameRatioId,
      customRatio,
      positionPreset,
      customCenter,
      zoom,
      imageOffset,
    }),
    [
      customCenter,
      customText,
      dateManual,
      dateMode,
      datePickerValue,
      frameRatioId,
      customRatio,
      imageOffset,
      locationLines,
      positionPreset,
      styles,
      textMode,
      timeFormat,
      timeRandomEnd,
      timeRandomStart,
      timeValue,
      zoom,
    ],
  );

  const applyPreset = React.useCallback((preset: TimestampPreset) => {
    setTextMode(preset.textMode);
    setDateMode(preset.dateMode);
    setDatePickerValue(preset.datePickerValue);
    setDateManual(preset.dateManual);
    setTimeFormat(preset.timeFormat ?? "24h");
    setTimeValue(preset.timeValue);
    setTimeRandomStart(preset.timeRandomStart);
    setTimeRandomEnd(preset.timeRandomEnd);
    setLocationLines(preset.locationLines);
    setCustomText(preset.customText);
    setStyles(preset.styles);
    setFrameRatioId(preset.frameRatioId);
    setCustomRatio(preset.customRatio ?? customRatio);
    setPositionPreset(preset.positionPreset);
    setCustomCenter(preset.customCenter);
    setZoom(preset.zoom);
    setImageOffset(preset.imageOffset);
  }, [customRatio]);

  const savePreset = (name: string) => {
    if (!name.trim()) return;
    const preset = buildPresetFromState(name.trim());
    setPresets((prev) => {
      const filtered = prev.filter((p) => p.name !== name.trim());
      const next = [preset, ...filtered];
      savePresetsToStorage(next);
      return next;
    });
    setActivePreset(name.trim());
  };

  const loadPreset = (name: string) => {
    const preset = presets.find((p) => p.name === name);
    if (!preset) return;
    applyPreset(preset);
    setActivePreset(name);
  };

  const deletePreset = (name: string) => {
    setPresets((prev) => {
      const next = prev.filter((p) => p.name !== name);
      savePresetsToStorage(next);
      return next;
    });
    if (activePreset === name) {
      setActivePreset(null);
    }
  };

  React.useEffect(() => {
    const stored = loadPresetsFromStorage();
    if (stored.length) {
      setPresets(stored);
      const last = stored[0];
      applyPreset(last);
      setActivePreset(last.name);
    }
  }, [applyPreset]);

  const updateLocationLines = (value: string) => {
    setLocationLines(value.split(/\r?\n/));
  };

  return {
    photo,
    frameRatio,
    frameRatioId,
    frameSize,
    frameBox,
    zoom,
    offsetLimit,
    imageOffset,
    customRatio,
    stampSpec,
    stampLines,
    textMode,
    dateMode,
    datePickerValue,
    dateManual,
    timeRandomStart,
    timeRandomEnd,
    timeValue,
    locationLines,
    customText,
    styles,
    timeFormat,
    activeCenter,
    positionPreset,
    saving,
    status,
    previewRef,
    fileInputRef,
    handleBrowseClick,
    handleFileInputChange,
    handleDrop,
    handleDragOver,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    handleSave,
    handlePresetChange,
    handleFrameRatioChange,
    handleCustomRatioChange,
    handlePreviewResize,
    handleZoomChange,
    handleOffsetChange,
    handleResetView,
    setTextMode,
    setDateMode,
    setDatePickerValue,
    setDateManual,
    setTimeFormat,
    setTimeRandomStart,
    setTimeRandomEnd,
    setTimeValue,
    updateLocationLines,
    setCustomText,
    setStyles,
    randomizeTime,
    randomizeTimeInRange,
    presets,
    activePreset,
    savePreset,
    loadPreset,
    deletePreset,
    setStatus,
  };
}

export { clamp01, clampToRange };
