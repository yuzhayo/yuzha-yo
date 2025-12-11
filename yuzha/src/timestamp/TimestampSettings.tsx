import React, { useEffect, useState, useMemo } from "react";
import FloatingWindowTemplate from "@shared/floating/FloatingWindowTemplate";
import Accordion from "@shared/floating/Accordion";
import { loadPresets, deletePreset, type TimestampPreset } from "./PresetManager";
import { DatePickerYuzha } from "@shared/components/date-picker_date-picker-yuzha";
import {
  type OverlaySettings,
  type TextAlign,
  FONT_FAMILIES,
  TEXT_ALIGNMENTS,
  DATE_FORMATS,
  TIME_FORMATS,
  formatDate,
  formatTime,
} from "./types";

export type TimestampSettingsProps = {
  textColor: string;
  onTextColorChange: (value: string) => void;
  shadowColor: string;
  onShadowColorChange: (value: string) => void;
  shadowBlur: number;
  onShadowBlurChange: (value: number) => void;
  shadowOffsetX: number;
  onShadowOffsetXChange: (value: number) => void;
  shadowOffsetY: number;
  onShadowOffsetYChange: (value: number) => void;
  scale: number;
  onScaleChange: (value: number) => void;
  translateX: number;
  onTranslateXChange: (value: number) => void;
  translateY: number;
  onTranslateYChange: (value: number) => void;
  rotation: number;
  onRotationChange: (value: number) => void;
  onResetPosition: () => void;
  customFonts: string[];
  onAddCustomFont: (fontName: string, fontDataUrl: string) => void;
  timeSettings: OverlaySettings;
  onTimeSettingsChange: (settings: OverlaySettings) => void;
  dateSettings: OverlaySettings;
  onDateSettingsChange: (settings: OverlaySettings) => void;
  locationSettings: OverlaySettings;
  onLocationSettingsChange: (settings: OverlaySettings) => void;
  previewBounds: { x: number; y: number; width: number; height: number };
  onTimeAlignmentChange?: (textAlign: TextAlign) => void;
  onDateAlignmentChange?: (textAlign: TextAlign) => void;
  onLocationAlignmentChange?: (textAlign: TextAlign) => void;
  onSavePreset: (name: string) => void;
  onLoadPreset: (preset: TimestampPreset) => void;
  onAddImageOverlay?: () => void;
  onClose?: () => void;
};

function parseDateFromText(text: string): Date | undefined {
  if (!text) return undefined;
  
  const monthNames: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };

  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match && match[1] && match[2] && match[3]) {
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
  }

  match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match && match[1] && match[2] && match[3]) {
    const first = parseInt(match[1]);
    const second = parseInt(match[2]);
    const year = parseInt(match[3]);
    if (first > 12) {
      return new Date(year, second - 1, first);
    }
    return new Date(year, first - 1, second);
  }

  match = text.match(/^(\w{3})\s+(\d{1,2}),?\s+(\d{4})$/i);
  if (match && match[1] && match[2] && match[3]) {
    const monthNum = monthNames[match[1].toLowerCase()];
    if (monthNum !== undefined) {
      return new Date(parseInt(match[3]), monthNum, parseInt(match[2]));
    }
  }

  match = text.match(/^(\d{1,2})\s+(\w{3})\s+(\d{4})$/i);
  if (match && match[1] && match[2] && match[3]) {
    const monthNum = monthNames[match[2].toLowerCase()];
    if (monthNum !== undefined) {
      return new Date(parseInt(match[3]), monthNum, parseInt(match[1]));
    }
  }

  return undefined;
}

function detectDateFormat(text: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return "YYYY-MM-DD";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    const parts = text.split("/");
    const firstPart = parts[0] ?? "01";
    const first = parseInt(firstPart);
    if (first > 12) return "DD/MM/YYYY";
    return "MM/DD/YYYY";
  }
  if (/^\w{3}\s+\d{1,2},?\s+\d{4}$/i.test(text)) return "MMM DD, YYYY";
  if (/^\d{1,2}\s+\w{3}\s+\d{4}$/i.test(text)) return "DD MMM YYYY";
  return "YYYY-MM-DD";
}

function OverlaySection({
  label,
  settings,
  onChange,
  customFonts,
  formatType,
  onAlignmentChange,
}: {
  label: string;
  settings: OverlaySettings;
  onChange: (s: OverlaySettings) => void;
  customFonts: string[];
  formatType?: "time" | "date";
  onAlignmentChange?: (textAlign: TextAlign) => void;
}) {
  const allFonts = [
    ...FONT_FAMILIES,
    ...customFonts.map((f) => ({ label: f, value: f })),
  ];

  const formats = formatType === "time" ? TIME_FORMATS : formatType === "date" ? DATE_FORMATS : [];

  const [currentFormat, setCurrentFormat] = useState(() => 
    formatType === "date" ? detectDateFormat(settings.text) : "YYYY-MM-DD"
  );

  const parsedDate = useMemo(() => {
    if (formatType !== "date") return undefined;
    return parseDateFromText(settings.text);
  }, [settings.text, formatType]);

  const handleApplyFormat = (format: string) => {
    const now = new Date();
    const formatted = formatType === "time" ? formatTime(now, format) : formatDate(now, format);
    if (formatType === "date") {
      setCurrentFormat(format);
    }
    onChange({ ...settings, text: formatted });
  };

  const handleDatePickerChange = (date: Date | undefined) => {
    if (date) {
      const formatted = formatDate(date, currentFormat);
      onChange({ ...settings, text: formatted });
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    onChange({ ...settings, text: newText });
    if (formatType === "date") {
      const detected = detectDateFormat(newText);
      setCurrentFormat(detected);
    }
  };

  return (
    <div className="space-y-3 text-slate-800">
      {formatType === "date" && (
        <div className="flex items-center gap-2">
          <label className="block text-xs font-semibold">Pick Date</label>
          <DatePickerYuzha
            value={parsedDate}
            onApply={handleDatePickerChange}
            placeholder="Select date"
            className="h-8 text-xs"
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold mb-1">{label} Text</label>
        <textarea
          value={settings.text}
          onChange={handleTextChange}
          placeholder={label}
          rows={2}
          className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none resize-none"
        />
      </div>

      {formats.length > 0 && (
        <div>
          <label className="block text-xs font-semibold mb-1">Format</label>
          <div className="flex flex-wrap gap-1">
            {formats.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => handleApplyFormat(f.value)}
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                  formatType === "date" && currentFormat === f.value
                    ? "bg-blue-500 text-white border-blue-500"
                    : "border-slate-300 bg-white hover:bg-slate-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold mb-1">Font</label>
          <select
            value={settings.fontFamily}
            onChange={(e) => onChange({ ...settings, fontFamily: e.target.value })}
            className="w-full rounded border border-slate-300 px-2 py-1 text-sm bg-white"
          >
            {allFonts.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Size: {settings.fontSize}px</label>
          <input
            type="range"
            min={12}
            max={72}
            value={settings.fontSize}
            onChange={(e) => onChange({ ...settings, fontSize: Number(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id={`${label}-shadow-toggle`}
          type="checkbox"
          checked={settings.shadowEnabled !== false}
          onChange={(e) => onChange({ ...settings, shadowEnabled: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor={`${label}-shadow-toggle`} className="text-xs font-semibold text-slate-700">
          Shadow
        </label>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1">Align</label>
        <div className="flex gap-1">
          {TEXT_ALIGNMENTS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => {
                if (onAlignmentChange) {
                  onAlignmentChange(a.value);
                } else {
                  onChange({ ...settings, textAlign: a.value });
                }
              }}
              className={`flex-1 px-2 py-1 text-xs rounded border transition-colors ${
                settings.textAlign === a.value
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TimestampSettings({
  textColor,
  onTextColorChange,
  shadowColor,
  onShadowColorChange,
  shadowBlur,
  onShadowBlurChange,
  shadowOffsetX,
  onShadowOffsetXChange,
  shadowOffsetY,
  onShadowOffsetYChange,
  scale,
  onScaleChange,
  translateX,
  onTranslateXChange,
  translateY,
  onTranslateYChange,
  rotation,
  onRotationChange,
  onResetPosition,
  customFonts,
  onAddCustomFont,
  timeSettings,
  onTimeSettingsChange,
  dateSettings,
  onDateSettingsChange,
  locationSettings,
  onLocationSettingsChange,
  onTimeAlignmentChange,
  onDateAlignmentChange,
  onLocationAlignmentChange,
  onSavePreset,
  onLoadPreset,
  onAddImageOverlay,
  onClose,
}: TimestampSettingsProps) {
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [presets, setPresets] = useState<TimestampPreset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [rotationInput, setRotationInput] = useState(String(rotation));
  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setPresets(loadPresets());
  }, []);

  useEffect(() => {
    setRotationInput(String(rotation));
  }, [rotation]);

  const refreshPresets = () => setPresets(loadPresets());

  const isNarrow = viewport.width < 640;
  const initialPos = isNarrow
    ? { x: 20, y: viewport.height - 620 }
    : { x: viewport.width - 360, y: 80 };

  const handleZoomIn = () => onScaleChange(Math.min(5, scale + 0.1));
  const handleZoomOut = () => onScaleChange(Math.max(0.1, scale - 0.1));

  const handleRotationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRotationInput(e.target.value);
  };

  const handleRotationInputBlur = () => {
    const val = parseFloat(rotationInput);
    if (!isNaN(val)) {
      onRotationChange(((val % 360) + 360) % 360);
    } else {
      setRotationInput(String(rotation));
    }
  };

  const handleFontUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".ttf,.otf,.woff,.woff2";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const fontName = file.name.replace(/\.(ttf|otf|woff2?)$/i, "");
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          onAddCustomFont(fontName, dataUrl);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    onSavePreset(presetName.trim());
    setPresetName("");
    refreshPresets();
  };

  const handleLoadPreset = () => {
    const preset = presets.find((p) => p.id === selectedPresetId);
    if (preset) onLoadPreset(preset);
  };

  const handleDeletePreset = () => {
    if (!selectedPresetId) return;
    deletePreset(selectedPresetId);
    setSelectedPresetId("");
    refreshPresets();
  };

  const sections = [
    {
      id: "general",
      title: "General Settings",
      defaultOpen: false,
      content: (
        <div className="space-y-4 text-slate-800">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Text Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => onTextColorChange(e.target.value)}
                  className="h-8 w-10 rounded border border-slate-300 bg-white cursor-pointer"
                />
                <span className="text-xs text-slate-600">{textColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Shadow Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={shadowColor}
                  onChange={(e) => onShadowColorChange(e.target.value)}
                  className="h-8 w-10 rounded border border-slate-300 bg-white cursor-pointer"
                />
                <span className="text-xs text-slate-600">{shadowColor}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold">Shadow: Blur {shadowBlur}px</label>
            <input
              type="range"
              min={0}
              max={20}
              value={shadowBlur}
              onChange={(e) => onShadowBlurChange(Number(e.target.value))}
              className="w-full"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Offset X: {shadowOffsetX}px</label>
                <input
                  type="range"
                  min={-10}
                  max={10}
                  value={shadowOffsetX}
                  onChange={(e) => onShadowOffsetXChange(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Offset Y: {shadowOffsetY}px</label>
                <input
                  type="range"
                  min={-10}
                  max={10}
                  value={shadowOffsetY}
                  onChange={(e) => onShadowOffsetYChange(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <label className="block text-xs font-semibold mb-2">Image Zoom</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleZoomOut}
                className="flex h-7 w-7 items-center justify-center rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-sm"
              >
                -
              </button>
              <input
                type="range"
                min={0.1}
                max={5}
                step={0.1}
                value={scale}
                onChange={(e) => onScaleChange(Number(e.target.value))}
                className="flex-1"
              />
              <button
                type="button"
                onClick={handleZoomIn}
                className="flex h-7 w-7 items-center justify-center rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-sm"
              >
                +
              </button>
            </div>
            <div className="mt-1 text-xs text-slate-600 text-center">{Math.round(scale * 100)}%</div>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold">Image Position</label>
              <button
                type="button"
                onClick={onResetPosition}
                className="text-xs px-2 py-1 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              >
                Reset
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-600 mb-1">X: {translateX}px</label>
                <input
                  type="range"
                  min={-500}
                  max={500}
                  value={translateX}
                  onChange={(e) => onTranslateXChange(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Y: {translateY}px</label>
                <input
                  type="range"
                  min={-500}
                  max={500}
                  value={translateY}
                  onChange={(e) => onTranslateYChange(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <label className="block text-xs font-semibold mb-2">Image Rotation</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={rotationInput}
                onChange={handleRotationInputChange}
                onBlur={handleRotationInputBlur}
                className="w-16 rounded border border-slate-300 px-2 py-1 text-sm text-center"
              />
              <span className="text-xs text-slate-600">deg</span>
              <input
                type="range"
                min={0}
                max={360}
                value={rotation}
                onChange={(e) => onRotationChange(Number(e.target.value))}
                className="flex-1"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <label className="block text-xs font-semibold mb-2">Custom Font</label>
            <button
              type="button"
              onClick={handleFontUpload}
              className="w-full px-3 py-2 text-sm rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              Upload Font (.ttf, .otf, .woff)
            </button>
            {customFonts.length > 0 && (
              <div className="mt-2 text-xs text-slate-600">
                Loaded: {customFonts.join(", ")}
              </div>
            )}
          </div>

          {onAddImageOverlay && (
            <div className="border-t border-slate-200 pt-3">
              <label className="block text-xs font-semibold mb-2">Image Overlay</label>
              <button
                type="button"
                onClick={onAddImageOverlay}
                className="w-full px-3 py-2 text-sm rounded border border-green-500 bg-green-500 text-white hover:bg-green-600"
              >
                Add Image Overlay
              </button>
              <p className="mt-1 text-xs text-slate-500">Upload an image to place on your photo</p>
            </div>
          )}

          <div className="border-t border-slate-200 pt-3">
            <label className="block text-xs font-semibold mb-2">Presets</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Preset name..."
                  className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
                />
                <button
                  type="button"
                  onClick={handleSavePreset}
                  disabled={!presetName.trim()}
                  className="px-3 py-1 text-sm rounded border border-blue-500 bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
              {presets.length > 0 && (
                <div className="flex gap-2">
                  <select
                    value={selectedPresetId}
                    onChange={(e) => setSelectedPresetId(e.target.value)}
                    className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm bg-white"
                  >
                    <option value="">Select preset...</option>
                    {presets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleLoadPreset}
                    disabled={!selectedPresetId}
                    className="px-3 py-1 text-sm rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    onClick={handleDeletePreset}
                    disabled={!selectedPresetId}
                    className="px-3 py-1 text-sm rounded border border-red-300 bg-white text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Del
                  </button>
                </div>
              )}
              {presets.length === 0 && (
                <p className="text-xs text-slate-500 italic">No presets saved yet</p>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "time",
      title: "Time Settings",
      defaultOpen: false,
      content: (
        <OverlaySection
          label="Time"
          settings={timeSettings}
          onChange={onTimeSettingsChange}
          customFonts={customFonts}
          formatType="time"
          onAlignmentChange={onTimeAlignmentChange}
        />
      ),
    },
    {
      id: "date",
      title: "Date Settings",
      defaultOpen: false,
      content: (
        <OverlaySection
          label="Date"
          settings={dateSettings}
          onChange={onDateSettingsChange}
          customFonts={customFonts}
          formatType="date"
          onAlignmentChange={onDateAlignmentChange}
        />
      ),
    },
    {
      id: "location",
      title: "Location Settings",
      defaultOpen: false,
      content: (
        <OverlaySection
          label="Location"
          settings={locationSettings}
          onChange={onLocationSettingsChange}
          customFonts={customFonts}
          onAlignmentChange={onLocationAlignmentChange}
        />
      ),
    },
  ];

  return (
    <FloatingWindowTemplate
      title="Settings"
      initialPos={initialPos}
      initialSize={{ width: 340, height: 600 }}
      minWidth={300}
      minHeight={400}
      onClose={onClose}
    >
      <div className="overflow-y-auto max-h-[520px] pr-1">
        <Accordion sections={sections} allowMultiple />
      </div>
    </FloatingWindowTemplate>
  );
}
