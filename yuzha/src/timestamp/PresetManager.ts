import type { TextAlign, TimestampPresetV2, TimestampPresetV3, Overlay } from "./types";

export type TimestampPresetV1 = {
  id: string;
  name: string;
  createdAt: number;
  timeText: string;
  dateText: string;
  locationText: string;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  textAlign: TextAlign;
  scale: number;
  translateX: number;
  translateY: number;
  timePosition: { x: number; y: number };
  datePosition: { x: number; y: number };
  locationPosition: { x: number; y: number };
};

export type TimestampPreset = TimestampPresetV3;

const STORAGE_KEY = "timestamp_presets";

function migrateV1toV2(v1: TimestampPresetV1): TimestampPresetV2 {
  return {
    id: v1.id,
    name: v1.name,
    createdAt: v1.createdAt,
    version: 2,
    scale: v1.scale,
    translateX: v1.translateX,
    translateY: v1.translateY,
    rotation: 0,
    textColor: v1.textColor,
    shadowColor: v1.shadowColor,
    shadowBlur: v1.shadowBlur,
    shadowOffsetX: v1.shadowOffsetX,
    shadowOffsetY: v1.shadowOffsetY,
    customFonts: [],
    time: {
      text: v1.timeText,
      fontFamily: v1.fontFamily,
      fontSize: v1.fontSize,
      textAlign: v1.textAlign,
      position: v1.timePosition,
    },
    date: {
      text: v1.dateText,
      fontFamily: v1.fontFamily,
      fontSize: v1.fontSize,
      textAlign: v1.textAlign,
      position: v1.datePosition,
    },
    location: {
      text: v1.locationText,
      fontFamily: v1.fontFamily,
      fontSize: v1.fontSize,
      textAlign: v1.textAlign,
      position: v1.locationPosition,
    },
  };
}

function migrateV2toV3(v2: TimestampPresetV2): TimestampPresetV3 {
  const overlays: Overlay[] = [
    {
      id: "time",
      type: "text",
      label: "Time",
      text: v2.time.text,
      fontFamily: v2.time.fontFamily,
      fontSize: v2.time.fontSize,
      textAlign: v2.time.textAlign,
      position: { ...v2.time.position },
      isPermanent: true,
      formatType: "time",
      noWrap: true,
    },
    {
      id: "date",
      type: "text",
      label: "Date",
      text: v2.date.text,
      fontFamily: v2.date.fontFamily,
      fontSize: v2.date.fontSize,
      textAlign: v2.date.textAlign,
      position: { ...v2.date.position },
      isPermanent: true,
      formatType: "date",
      noWrap: true,
    },
    {
      id: "location",
      type: "text",
      label: "Location",
      text: v2.location.text,
      fontFamily: v2.location.fontFamily,
      fontSize: v2.location.fontSize,
      textAlign: v2.location.textAlign,
      position: { ...v2.location.position },
      isPermanent: true,
      noWrap: false,
    },
  ];

  return {
    id: v2.id,
    name: v2.name,
    createdAt: v2.createdAt,
    version: 3,
    scale: v2.scale,
    translateX: v2.translateX,
    translateY: v2.translateY,
    rotation: v2.rotation,
    textColor: v2.textColor,
    shadowColor: v2.shadowColor,
    shadowBlur: v2.shadowBlur,
    shadowOffsetX: v2.shadowOffsetX,
    shadowOffsetY: v2.shadowOffsetY,
    customFonts: [...v2.customFonts],
    overlays,
  };
}

function isV1Preset(preset: unknown): preset is TimestampPresetV1 {
  return typeof preset === "object" && preset !== null && !("version" in preset) && "timeText" in preset;
}

function isV2Preset(preset: unknown): preset is TimestampPresetV2 {
  return typeof preset === "object" && preset !== null && "version" in preset && (preset as { version: number }).version === 2;
}

function isV3Preset(preset: unknown): preset is TimestampPresetV3 {
  return typeof preset === "object" && preset !== null && "version" in preset && (preset as { version: number }).version === 3;
}

function migratePreset(preset: unknown): TimestampPresetV3 {
  if (isV3Preset(preset)) {
    return preset;
  }
  if (isV2Preset(preset)) {
    return migrateV2toV3(preset);
  }
  if (isV1Preset(preset)) {
    return migrateV2toV3(migrateV1toV2(preset));
  }
  throw new Error("Unknown preset format");
}

export function loadPresets(): TimestampPreset[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data) as unknown[];
    return parsed.map((p) => migratePreset(p));
  } catch {
    return [];
  }
}

export function savePresets(presets: TimestampPreset[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
  }
}

export type PresetInputV3 = {
  name: string;
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

export function addPreset(input: PresetInputV3): TimestampPreset {
  const presets = loadPresets();
  const newPreset: TimestampPreset = {
    ...input,
    id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    version: 3,
    overlays: input.overlays.map((o) => ({ ...o, position: { ...o.position } })),
  };
  presets.push(newPreset);
  savePresets(presets);
  return newPreset;
}

export function deletePreset(id: string): void {
  const presets = loadPresets();
  const filtered = presets.filter((p) => p.id !== id);
  savePresets(filtered);
}

export function getPresetById(id: string): TimestampPreset | undefined {
  const presets = loadPresets();
  return presets.find((p) => p.id === id);
}
