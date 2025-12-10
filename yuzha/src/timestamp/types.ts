export type TextAlign = "left" | "center" | "right";

export type OverlayType = "text" | "image";

export type BaseOverlay = {
  id: string;
  type: OverlayType;
  position: { x: number; y: number };
  isPermanent: boolean;
  label: string;
};

export type TextOverlay = BaseOverlay & {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  textAlign: TextAlign;
  formatType?: "time" | "date";
  noWrap?: boolean;
  shadowEnabled?: boolean;
};

export type ImageOverlay = BaseOverlay & {
  type: "image";
  src: string;
  width: number;
  height: number;
};

export type Overlay = TextOverlay | ImageOverlay;

export type OverlaySettings = {
  text: string;
  fontFamily: string;
  fontSize: number;
  textAlign: TextAlign;
  position: { x: number; y: number };
  shadowEnabled?: boolean;
};

export type TimestampState = {
  imageSrc: string | null;
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

export type TimestampPresetV2 = {
  id: string;
  name: string;
  createdAt: number;
  version: 2;
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
  time: OverlaySettings;
  date: OverlaySettings;
  location: OverlaySettings;
};

export type TimestampPresetV3 = {
  id: string;
  name: string;
  createdAt: number;
  version: 3;
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

export const DEFAULT_OVERLAYS: Overlay[] = [
  {
    id: "time",
    type: "text",
    label: "Time",
    text: "12:00",
    fontFamily: "sans-serif",
    fontSize: 24,
    textAlign: "left",
    position: { x: 20, y: 20 },
    isPermanent: true,
    formatType: "time",
    noWrap: true,
    shadowEnabled: false,
  },
  {
    id: "date",
    type: "text",
    label: "Date",
    text: "2025-01-01",
    fontFamily: "sans-serif",
    fontSize: 24,
    textAlign: "left",
    position: { x: 20, y: 70 },
    isPermanent: true,
    formatType: "date",
    noWrap: true,
    shadowEnabled: false,
  },
  {
    id: "location",
    type: "text",
    label: "Location",
    text: "Location",
    fontFamily: "sans-serif",
    fontSize: 24,
    textAlign: "left",
    position: { x: 20, y: 120 },
    isPermanent: true,
    noWrap: false,
    shadowEnabled: false,
  },
];

export const DEFAULT_OVERLAY_SETTINGS: Record<"time" | "date" | "location", OverlaySettings> = {
  time: {
    text: "12:00",
    fontFamily: "sans-serif",
    fontSize: 24,
    textAlign: "left",
    position: { x: 20, y: 20 },
    shadowEnabled: false,
  },
  date: {
    text: "2025-01-01",
    fontFamily: "sans-serif",
    fontSize: 24,
    textAlign: "left",
    position: { x: 20, y: 70 },
    shadowEnabled: false,
  },
  location: {
    text: "Location",
    fontFamily: "sans-serif",
    fontSize: 24,
    textAlign: "left",
    position: { x: 20, y: 120 },
    shadowEnabled: false,
  },
};

export const DEFAULT_STATE = {
  scale: 1,
  translateX: 0,
  translateY: 0,
  rotation: 0,
  textColor: "#ffffff",
  shadowColor: "#000000",
  shadowBlur: 2,
  shadowOffsetX: 1,
  shadowOffsetY: 1,
  customFonts: [] as string[],
  overlays: DEFAULT_OVERLAYS.map((o) => ({ ...o, position: { ...o.position } })),
};

export const FONT_FAMILIES = [
  { label: "Sans Serif", value: "sans-serif" },
  { label: "Serif", value: "serif" },
  { label: "Monospace", value: "monospace" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Taimingda", value: "Taimingda, sans-serif" },
];

export const TEXT_ALIGNMENTS: { label: string; value: TextAlign }[] = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
];

export const DATE_FORMATS = [
  { label: "YYYY-MM-DD", value: "YYYY-MM-DD" },
  { label: "MM/DD/YYYY", value: "MM/DD/YYYY" },
  { label: "DD/MM/YYYY", value: "DD/MM/YYYY" },
  { label: "MMM DD, YYYY", value: "MMM DD, YYYY" },
  { label: "DD MMM YYYY", value: "DD MMM YYYY" },
];

export const TIME_FORMATS = [
  { label: "HH:MM (24h)", value: "HH:mm" },
  { label: "HH:MM:SS (24h)", value: "HH:mm:ss" },
  { label: "h:MM AM/PM", value: "h:mm A" },
  { label: "h:MM:SS AM/PM", value: "h:mm:ss A" },
];

export function formatDate(date: Date, format: string): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  switch (format) {
    case "YYYY-MM-DD":
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    case "MM/DD/YYYY":
      return `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}/${year}`;
    case "DD/MM/YYYY":
      return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
    case "MMM DD, YYYY":
      return `${monthNames[month - 1]} ${String(day).padStart(2, "0")}, ${year}`;
    case "DD MMM YYYY":
      return `${String(day).padStart(2, "0")} ${monthNames[month - 1]} ${year}`;
    default:
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
}

export function formatTime(date: Date, format: string): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const hours12 = hours % 12 || 12;
  const ampm = hours >= 12 ? "PM" : "AM";

  switch (format) {
    case "HH:mm":
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    case "HH:mm:ss":
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    case "h:mm A":
      return `${hours12}:${String(minutes).padStart(2, "0")} ${ampm}`;
    case "h:mm:ss A":
      return `${hours12}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} ${ampm}`;
    default:
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
}

export type OverlayBounds = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export function checkAABBCollision(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function resolveCollision(
  moving: { x: number; y: number; width: number; height: number },
  obstacle: { x: number; y: number; width: number; height: number },
  prevPos: { x: number; y: number }
): { x: number; y: number } {
  const deltaX = moving.x - prevPos.x;
  const deltaY = moving.y - prevPos.y;

  const overlapLeft = moving.x + moving.width - obstacle.x;
  const overlapRight = obstacle.x + obstacle.width - moving.x;
  const overlapTop = moving.y + moving.height - obstacle.y;
  const overlapBottom = obstacle.y + obstacle.height - moving.y;

  const resolvedX = deltaX > 0
    ? obstacle.x - moving.width
    : obstacle.x + obstacle.width;

  const resolvedY = deltaY > 0
    ? obstacle.y - moving.height
    : obstacle.y + obstacle.height;

  const minOverlapX = Math.min(overlapLeft, overlapRight);
  const minOverlapY = Math.min(overlapTop, overlapBottom);

  if (minOverlapX < minOverlapY) {
    return { x: resolvedX, y: moving.y };
  } else {
    return { x: moving.x, y: resolvedY };
  }
}

export function resolveAllCollisions(
  moving: { x: number; y: number; width: number; height: number },
  obstacles: OverlayBounds[],
  prevPos: { x: number; y: number },
  maxIterations: number = 10
): { x: number; y: number; hasCollision: boolean } {
  let currentPos = { x: moving.x, y: moving.y };
  let referencePos = { x: prevPos.x, y: prevPos.y };
  let hasCollision = false;
  
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let collisionFound = false;
    const posBeforeIteration = { x: currentPos.x, y: currentPos.y };
    
    for (const obstacle of obstacles) {
      const currentBounds = {
        x: currentPos.x,
        y: currentPos.y,
        width: moving.width,
        height: moving.height,
      };
      
      if (checkAABBCollision(currentBounds, obstacle)) {
        collisionFound = true;
        hasCollision = true;
        const resolved = resolveCollision(currentBounds, obstacle, referencePos);
        currentPos = resolved;
      }
    }
    
    if (collisionFound) {
      referencePos = { x: currentPos.x, y: currentPos.y };
    }
    
    if (!collisionFound) {
      break;
    }
    
    if (currentPos.x === posBeforeIteration.x && currentPos.y === posBeforeIteration.y) {
      break;
    }
  }
  
  return { ...currentPos, hasCollision };
}
