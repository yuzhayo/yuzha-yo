import React from "react";

export type PositionPreset = "bottom-left" | "bottom-right" | "top-left" | "top-right" | "center" | "custom";
export type FormatPresetId = typeof FORMAT_PRESETS[number]["id"];

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

export const FORMAT_PRESETS = [
  { id: "default", label: "DD MMM YYYY · HH:mm · Lokasi", template: "{DATE} · {TIME} · {LOCATION}" },
  { id: "time-first", label: "HH:mm — DD MMM YYYY · Lokasi", template: "{TIME} — {DATE} · {LOCATION}" },
  { id: "minimal", label: "DD/MM/YYYY HH:mm (lokasi)", template: "{DATE_SLASH} {TIME} ({LOCATION})" },
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

function clamp01(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function clampToRange(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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
    .replace("{LOCATION}", location || "–");
}

function randomTimeString() {
  const h = Math.floor(Math.random() * 24);
  const m = Math.floor(Math.random() * 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function measureStamp(imageWidth: number, text: string): StampSpec {
  const fontSize = clampToRange(Math.round(imageWidth * 0.032), 18, 64);
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

export function useTimestampState() {
  const [photo, setPhoto] = React.useState<LoadedImage | null>(null);
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
  const [isDragging, setIsDragging] = React.useState(false);

  const previewRef = React.useRef<HTMLDivElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const imageObjectUrlRef = React.useRef<string | null>(null);

  const stampText = React.useMemo(
    () => buildStampText(dateValue, timeValue, location, formatId),
    [dateValue, timeValue, location, formatId],
  );

  const stampSpec = React.useMemo(() => {
    if (!photo) return null;
    return measureStamp(photo.width, stampText);
  }, [photo, stampText]);

  React.useEffect(() => {
    if (!photo || !stampSpec) return;
    if (positionPreset === "custom") return;
    const nextCenter = computeCenterFromPreset(positionPreset, stampSpec, photo, customCenter);
    setCustomCenter(nextCenter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo, stampSpec, positionPreset]);

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

  const handleSave = async () => {
    if (!photo || !stampSpec) {
      setStatus("Pilih foto dulu sebelum menyimpan.");
      return;
    }

    setSaving(true);
    setStatus(null);

    const canvas = document.createElement("canvas");
    canvas.width = photo.width;
    canvas.height = photo.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setSaving(false);
      setStatus("Context canvas tidak tersedia.");
      return;
    }

    ctx.drawImage(photo.element, 0, 0, photo.width, photo.height);

    const center = computeCenterFromPreset(positionPreset, stampSpec, photo, customCenter);
    const { x, y } = centerToTopLeftPx(center, stampSpec, photo);

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
    setIsDragging(true);
    updatePositionFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!isDragging) return;
    updatePositionFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp: React.PointerEventHandler<HTMLDivElement> = () => {
    setIsDragging(false);
  };

  const activeCenter = React.useMemo(() => {
    if (!photo || !stampSpec) return customCenter;
    return computeCenterFromPreset(positionPreset, stampSpec, photo, customCenter);
  }, [photo, stampSpec, positionPreset, customCenter]);

  const handlePresetChange = (preset: PositionPreset) => {
    setPositionPreset(preset);
    if (!photo || !stampSpec) return;
    const center = computeCenterFromPreset(preset, stampSpec, photo, customCenter);
    setCustomCenter(center);
  };

  const randomizeTime = () => setTimeValue(randomTimeString());

  return {
    photo,
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
    handleSave,
    handlePresetChange,
    setDateValue,
    setTimeValue,
    setLocation,
    setFormatId,
    randomizeTime,
    setStatus,
  };
}

export { clamp01 };
