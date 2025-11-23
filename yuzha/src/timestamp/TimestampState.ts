import React from "react";

export type PositionPreset = "bottom-left" | "bottom-right" | "top-left" | "top-right" | "center" | "custom";
export type FormatPresetId = (typeof FORMAT_PRESETS)[number]["id"];
export type FrameRatioId = (typeof FRAME_RATIO_OPTIONS)[number]["id"];

export type LoadedImage = {
  url: string;
  name: string;
  width: number;
  height: number;
  element: HTMLImageElement;
};

export type StampSpec = {
  fontSize: number;
  padding: number;
  width: number;
  height: number;
  fontFamily: string;
};

export type FrameSize = { width: number; height: number };
export type Offset = { x: number; y: number };

export const FORMAT_PRESETS = [
  { id: "default", label: "DD MMM YYYY | HH:mm | Lokasi", template: "{DATE} | {TIME} | {LOCATION}" },
  { id: "time-first", label: "HH:mm - DD MMM YYYY | Lokasi", template: "{TIME} - {DATE} | {LOCATION}" },
  { id: "minimal", label: "DD/MM/YYYY HH:mm (lokasi)", template: "{DATE_SLASH} {TIME} ({LOCATION})" },
] as const;

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

const DEFAULT_LOCATION = "Jakarta, Indonesia";
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 3;

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

function formatDateDisplay(dateValue: string) {
  if (!dateValue) return "Tanggal belum dipilih";
  const d = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateValue;
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

function formatDateSlash(dateValue: string) {
  if (!dateValue) return "";
  const parts = dateValue.split("-");
  if (parts.length !== 3) return dateValue;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function buildStampText(dateValue: string, timeValue: string, location: string, templateId: FormatPresetId) {
  const preset = FORMAT_PRESETS.find((f) => f.id === templateId) ?? FORMAT_PRESETS[0];
  return preset.template
    .replace("{DATE}", formatDateDisplay(dateValue))
    .replace("{DATE_SLASH}", formatDateSlash(dateValue))
    .replace("{TIME}", timeValue || "--:--")
    .replace("{LOCATION}", location || "-");
}

function randomTimeString() {
  const h = Math.floor(Math.random() * 24);
  const m = Math.floor(Math.random() * 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function measureStamp(imageWidth: number, text: string): StampSpec {
  const fontSize = clampToRange(Math.round(imageWidth * 0.032), 18, 72);
  const padding = Math.round(fontSize * 0.7);
  const fontFamily = `"Inter", "Segoe UI", sans-serif`;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  let textWidth = text.length * fontSize * 0.48;
  if (ctx) {
    ctx.font = `${fontSize}px ${fontFamily}`;
    textWidth = ctx.measureText(text).width;
  }
  const lineHeight = Math.round(fontSize * 1.25);
  return {
    fontSize,
    padding,
    width: Math.round(textWidth + padding * 2),
    height: Math.round(lineHeight + padding * 2),
    fontFamily,
  };
}

function computeCenterFromPreset(
  preset: PositionPreset,
  spec: StampSpec,
  img: { width: number; height: number },
  currentCustom: { x: number; y: number },
): { x: number; y: number } {
  if (preset === "custom") return currentCustom;

  const margin = Math.max(24, Math.round(img.width * 0.02));
  const marginX = margin / img.width;
  const marginY = margin / img.height;
  const widthNorm = spec.width / img.width;
  const heightNorm = spec.height / img.height;

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
  img: { width: number; height: number },
) {
  const cx = center.x * img.width;
  const cy = center.y * img.height;
  const x = clampToRange(cx - spec.width / 2, 0, img.width - spec.width);
  const y = clampToRange(cy - spec.height / 2, 0, img.height - spec.height);
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

function getFrameRatioById(id: FrameRatioId) {
  return FRAME_RATIO_OPTIONS.find((r) => r.id === id) ?? FRAME_RATIO_OPTIONS[0];
}

export function useTimestampState() {
  const [photo, setPhoto] = React.useState<LoadedImage | null>(null);
  const [frameRatioId, setFrameRatioId] = React.useState<FrameRatioId>(FRAME_RATIO_OPTIONS[0].id);
  const [frameSize, setFrameSize] = React.useState<FrameSize | null>(null);
  const [zoom, setZoom] = React.useState(1);
  const [imageOffset, setImageOffset] = React.useState<Offset>({ x: 0, y: 0 });

  const [dateValue, setDateValue] = React.useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [timeValue, setTimeValue] = React.useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });
  const [location, setLocation] = React.useState(DEFAULT_LOCATION);
  const [formatId, setFormatId] = React.useState<FormatPresetId>("default");
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

  const stampText = React.useMemo(
    () => buildStampText(dateValue, timeValue, location, formatId),
    [dateValue, timeValue, location, formatId],
  );

  const frameRatio = getFrameRatioById(frameRatioId);

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
    return measureStamp(baseWidth, stampText);
  }, [frameSize?.width, photo?.width, stampText]);

  React.useEffect(() => {
    if (!frameSize || !stampSpec) return;
    if (positionPreset === "custom") return;
    const nextCenter = computeCenterFromPreset(positionPreset, stampSpec, frameSize, customCenter);
    if (nextCenter.x !== customCenter.x || nextCenter.y !== customCenter.y) {
      setCustomCenter(nextCenter);
    }
  }, [customCenter, frameSize, positionPreset, stampSpec]);

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

    const radius = Math.round(stampSpec.padding * 0.6);
    drawRoundedRect(ctx, x, y, stampSpec.width, stampSpec.height, radius);
    ctx.fillStyle = "rgba(15,15,15,0.55)";
    ctx.filter = "blur(0px)";
    ctx.fill();
    ctx.filter = "none";

    ctx.font = `${stampSpec.fontSize}px ${stampSpec.fontFamily}`;
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.textBaseline = "top";
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = stampSpec.fontSize * 0.22;
    ctx.fillText(stampText, x + stampSpec.padding, y + stampSpec.padding);
    ctx.shadowBlur = 0;

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

  return {
    photo,
    frameRatio,
    frameRatioId,
    frameSize,
    frameBox,
    zoom,
    offsetLimit,
    imageOffset,
    stampText,
    stampSpec,
    activeCenter,
    positionPreset,
    saving,
    status,
    dateValue,
    timeValue,
    location,
    formatId,
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
    handlePreviewResize,
    handleZoomChange,
    handleOffsetChange,
    handleResetView,
    setDateValue,
    setTimeValue,
    setLocation,
    setFormatId,
    randomizeTime,
    setStatus,
  };
}

export { clamp01, clampToRange };
