import React from "react";
import type {
  FrameRatioId,
  FrameSize,
  LoadedImage,
  Offset,
  PositionPreset,
  StampLine,
  StampSpec,
  TextMode,
} from "./TimestampState";
import { FRAME_RATIO_OPTIONS, POSITION_PRESETS, clamp01 } from "./TimestampState";

type FrameBox = {
  width: number;
  height: number;
  imgLeft: number;
  imgTop: number;
  imgWidth: number;
  imgHeight: number;
};

type ImageDropzoneProps = {
  photo: LoadedImage | null;
  stampSpec: StampSpec;
  activeCenter: { x: number; y: number };
  frameRatio: { w: number; h: number };
  frameBox: FrameBox | null;
  previewRef: React.RefObject<HTMLDivElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onBrowse: () => void;
  onFileInputChange: React.ChangeEventHandler<HTMLInputElement>;
  onDrop: React.DragEventHandler<HTMLDivElement>;
  onDragOver: React.DragEventHandler<HTMLDivElement>;
  onPointerDown: React.PointerEventHandler<HTMLDivElement>;
  onPointerMove: React.PointerEventHandler<HTMLDivElement>;
  onPointerUp: React.PointerEventHandler<HTMLDivElement>;
  onWheel: React.WheelEventHandler<HTMLDivElement>;
  onPreviewResize: (size: FrameSize) => void;
};

type ControlPanelProps = {
  textMode: TextMode;
  timeValue: string;
  locationLines: string[];
  customText: string;
  styles: {
    timeSize: number;
    dateSize: number;
    locationSize: number;
    customSize: number;
    lineSpacing: number;
    alignTime: "left" | "center" | "right";
    alignDate: "left" | "center" | "right";
    alignLocation: "left" | "center" | "right";
    alignCustom: "left" | "center" | "right";
  };
  positionPreset: PositionPreset;
  photo: LoadedImage | null;
  saving: boolean;
  status: string | null;
  frameRatioId: FrameRatioId;
  customRatio: { w: number; h: number };
  zoom: number;
  offset: Offset;
  offsetLimit: Offset;
  dateMode: "picker" | "manual";
  datePickerValue: string;
  dateManual: string;
  timeRandomStart: string;
  timeRandomEnd: string;
  timeFormat: "24h" | "12h";
  onBrowse: () => void;
  onSave: () => void;
  onTextModeChange: (mode: TextMode) => void;
  onTimeChange: (value: string) => void;
  onDateModeChange: (value: "picker" | "manual") => void;
  onDatePickerChange: (value: string) => void;
  onDateManualChange: (value: string) => void;
  onTimeFormatChange: (value: "24h" | "12h") => void;
  onLocationChange: (value: string) => void;
  onCustomTextChange: (value: string) => void;
  onStyleChange: (patch: Partial<ControlPanelProps["styles"]>) => void;
  onRandomTime: () => void;
  onRandomTimeRange: () => void;
  onTimeRangeChange: (patch: { start?: string; end?: string }) => void;
  onPresetChange: (value: PositionPreset) => void;
  onRatioChange: (value: FrameRatioId) => void;
  onCustomRatioChange: (patch: { w?: number; h?: number }) => void;
  onZoomChange: (value: number) => void;
  onOffsetChange: (value: Offset) => void;
  onResetView: () => void;
  presets: { name: string }[];
  activePreset: string | null;
  onSavePreset: (name: string) => void;
  onLoadPreset: (name: string) => void;
  onDeletePreset: (name: string) => void;
};

type StampPreviewProps = {
  frameBox: FrameBox;
  stampSpec: StampSpec;
  activeCenter: { x: number; y: number };
};

function useResizeObserver(
  targetRef: React.RefObject<HTMLElement>,
  onSize: (size: FrameSize) => void,
  active: boolean,
) {
  React.useLayoutEffect(() => {
    if (!active) return undefined;
    const el = targetRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      onSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [active, onSize, targetRef]);
}

function StampPreview({ stampSpec, activeCenter }: StampPreviewProps) {
  const left = `${clamp01(activeCenter.x) * 100}%`;
  const top = `${clamp01(activeCenter.y) * 100}%`;

  return (
    <div
      className="pointer-events-none absolute inline-flex -translate-x-1/2 -translate-y-1/2 select-none flex-col rounded-lg bg-black/60 text-xs text-white shadow-xl shadow-black/40 backdrop-blur"
      style={{
        left,
        top,
        width: stampSpec.width,
        height: stampSpec.height,
        padding: stampSpec.padding,
      }}
    >
      {stampSpec.lines.map((line, idx) => {
        const alignClass =
          line.align === "center" ? "text-center" : line.align === "right" ? "text-right" : "text-left";
        return (
          <span
            key={`${line.text}-${idx}`}
            style={{
              fontSize: line.size,
              lineHeight: "1.25em",
              marginTop: idx === 0 ? 0 : line.size * 1.25 * (stampSpec.lineSpacing - 1),
              width: "100%",
            }}
            className={`text-white block ${alignClass}`}
          >
            {line.text}
          </span>
        );
      })}
    </div>
  );
}

export function ImageDropzone(props: ImageDropzoneProps) {
  const inputId = React.useId();
  useResizeObserver(props.previewRef as React.RefObject<HTMLElement>, props.onPreviewResize, Boolean(props.photo));

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900 to-slate-950 p-4 shadow-2xl shadow-black/40">
      <input
        ref={props.fileInputRef}
        type="file"
        id={inputId}
        className="hidden"
        accept="image/*"
        onChange={props.onFileInputChange}
      />
      <div
        className="relative flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-xl border border-white/5 bg-slate-900/70 p-4"
        onDrop={props.onDrop}
        onDragOver={props.onDragOver}
      >
        {!props.photo && (
          <div className="flex w-full max-w-xl flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-2xl">🕒</div>
            <p className="text-lg font-semibold text-white">Seret & lepas foto di sini</p>
            <p className="text-sm text-white/60">atau klik Browse untuk memilih dari komputer</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={props.onBrowse}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-sky-900/50 transition hover:bg-sky-500 active:bg-sky-600"
              >
                Browse Foto
              </button>
              <label
                htmlFor={inputId}
                className="cursor-pointer rounded-lg border border-white/10 px-4 py-2 text-sm text-white/80 transition hover:border-white/30"
              >
                Pilih File
              </label>
            </div>
          </div>
        )}

        {props.photo && (
          <div className="w-full">
            <div className="mb-3 flex items-center justify-between text-xs text-white/60">
              <span className="rounded-full bg-white/5 px-3 py-1 font-medium text-white/80">
                {props.photo.name} — {props.photo.width}x{props.photo.height}px
              </span>
              <span>Alt+drag untuk pan gambar, scroll untuk zoom, drag biasa untuk posisi stamp</span>
            </div>

            <div className="relative w-full overflow-hidden rounded-xl border border-white/5 bg-slate-950" style={{ aspectRatio: "1 / 1" }}>
              <div
                ref={props.previewRef}
                className="absolute left-1/2 top-1/2 flex h-full w-full -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                onPointerDown={props.onPointerDown}
                onPointerMove={props.onPointerMove}
                onPointerUp={props.onPointerUp}
                onPointerCancel={props.onPointerUp}
                onWheel={props.onWheel}
              >
                <div
                  className="relative overflow-hidden rounded-lg border border-white/10"
                  style={{
                    aspectRatio: `${props.frameRatio.w} / ${props.frameRatio.h}`,
                    width: "100%",
                    maxHeight: "100%",
                  }}
                >
                  {props.frameBox && (
                    <img
                      src={props.photo.url}
                      alt="preview"
                      className="absolute select-none"
                      draggable={false}
                      style={{
                        width: props.frameBox.imgWidth,
                        height: props.frameBox.imgHeight,
                        left: props.frameBox.imgLeft,
                        top: props.frameBox.imgTop,
                        objectFit: "cover",
                      }}
                    />
                  )}
                  {props.frameBox && (
                    <StampPreview
                      frameBox={props.frameBox}
                      stampSpec={props.stampSpec}
                      activeCenter={props.activeCenter}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-white/70">
      <div className="flex items-center justify-between">
        <span>{label}</span>
        <span className="text-white/80">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-sky-500"
      />
    </label>
  );
}

function LinesPreview({ lines }: { lines: StampLine[] }) {
  return (
    <div className="space-y-1 rounded-lg border border-white/10 bg-white/5 p-3 text-white/80">
      <div className="text-xs text-white/60">Preview Teks</div>
      {lines.map((l, idx) => (
        <div key={idx} className="flex items-center justify-between text-xs">
          <span className="truncate" style={{ fontSize: l.size }}>
            {l.text || <span className="text-white/40">Kosong</span>}
          </span>
          <span className="text-white/50">{Math.round(l.size)} px</span>
        </div>
      ))}
    </div>
  );
}

export function ControlPanel(props: ControlPanelProps & { stampLines: StampLine[] }) {
  const offsetXMax = props.offsetLimit.x || 0;
  const offsetYMax = props.offsetLimit.y || 0;
  const [showTextPreview, setShowTextPreview] = React.useState(true);

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-xl shadow-black/30 max-h-[80vh] md:max-h-[calc(100vh-140px)] overflow-y-auto pr-2">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={props.onBrowse}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-sky-900/50 transition hover:bg-sky-500 active:bg-sky-600"
        >
          Browse
        </button>
        <button
          type="button"
          onClick={props.onSave}
          disabled={!props.photo || props.saving}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-900/50 transition hover:bg-emerald-500 active:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-800/60 disabled:text-white/50"
        >
          {props.saving ? "Menyimpan..." : "Save"}
        </button>
        {props.status && <span className="text-xs text-white/70">{props.status}</span>}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/80">
        <div className="flex items-center gap-2">
          <span>Preset:</span>
          <select
            value={props.activePreset ?? ""}
            onChange={(e) => {
              if (!e.target.value) return;
              props.onLoadPreset(e.target.value);
            }}
            className="rounded border border-white/15 bg-slate-800 px-2 py-1 text-xs text-white"
          >
            <option value="">-- pilih --</option>
            {props.presets.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => {
            const name = window.prompt("Nama preset?");
            if (name) props.onSavePreset(name);
          }}
          className="rounded border border-white/20 bg-emerald-700 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-600"
        >
          Save preset
        </button>
        {props.activePreset && (
          <button
            type="button"
            onClick={() => props.onDeletePreset(props.activePreset!)}
            className="rounded border border-white/20 bg-red-700 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600"
          >
            Delete
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <label className="flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-white/80">
          <input
            type="radio"
            name="textMode"
            value="guided"
            checked={props.textMode === "guided"}
            onChange={() => props.onTextModeChange("guided")}
          />
          Guided (Time/Date/Location)
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-white/80">
          <input
            type="radio"
            name="textMode"
            value="custom"
            checked={props.textMode === "custom"}
            onChange={() => props.onTextModeChange("custom")}
          />
          Custom bebas (multi-line)
        </label>
      </div>

      {props.textMode === "guided" ? (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="space-y-3">
            <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between text-sm text-white/80">
                <span className="font-semibold">Jam</span>
                <select
                  value={props.styles.alignTime}
                  onChange={(e) => props.onStyleChange({ alignTime: e.target.value as any })}
                  className="rounded border border-white/15 bg-slate-800 px-2 py-1 text-xs text-white"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <span>Format jam</span>
                <select
                  value={props.timeFormat}
                  onChange={(e) => props.onTimeFormatChange(e.target.value as any)}
                  className="rounded border border-white/15 bg-slate-800 px-2 py-1 text-xs text-white"
                >
                  <option value="24h">24h</option>
                  <option value="12h">12h</option>
                </select>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  type="time"
                  value={props.timeValue}
                  onChange={(e) => props.onTimeChange(e.target.value)}
                  className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none transition focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={props.onRandomTime}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:border-white/40"
                >
                  Random
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex flex-col gap-1 text-white/70">
                  Range start
                  <input
                    type="time"
                    value={props.timeRandomStart}
                    onChange={(e) => props.onTimeRangeChange({ start: e.target.value })}
                    className="rounded border border-white/10 bg-slate-800 px-2 py-1 text-white outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1 text-white/70">
                  Range end
                  <input
                    type="time"
                    value={props.timeRandomEnd}
                    onChange={(e) => props.onTimeRangeChange({ end: e.target.value })}
                    className="rounded border border-white/10 bg-slate-800 px-2 py-1 text-white outline-none"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={props.onRandomTimeRange}
                className="w-full rounded-lg border border-white/10 bg-sky-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-600"
              >
                Random in range
              </button>
              <SliderRow
                label="Font Jam (px)"
                value={props.styles.timeSize}
                min={14}
                max={72}
                step={1}
                onChange={(v) => props.onStyleChange({ timeSize: v })}
              />
            </div>

            <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between text-sm text-white/80">
                <span className="font-semibold">Tanggal</span>
                <select
                  value={props.styles.alignDate}
                  onChange={(e) => props.onStyleChange({ alignDate: e.target.value as any })}
                  className="rounded border border-white/15 bg-slate-800 px-2 py-1 text-xs text-white"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-white/70">
                <label className="flex items-center gap-2 rounded border border-white/20 px-2 py-1">
                  <input
                    type="radio"
                    name="dateMode"
                    value="picker"
                    checked={props.dateMode === "picker"}
                    onChange={() => props.onDateModeChange("picker")}
                  />
                  Date picker
                </label>
                <label className="flex items-center gap-2 rounded border border-white/20 px-2 py-1">
                  <input
                    type="radio"
                    name="dateMode"
                    value="manual"
                    checked={props.dateMode === "manual"}
                    onChange={() => props.onDateModeChange("manual")}
                  />
                  Manual string
                </label>
              </div>
              {props.dateMode === "picker" ? (
                <input
                  type="date"
                  value={props.datePickerValue}
                  onChange={(e) => props.onDatePickerChange(e.target.value)}
                  className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none transition focus:border-sky-500"
                />
              ) : (
                <input
                  type="text"
                  value={props.dateManual}
                  onChange={(e) => props.onDateManualChange(e.target.value)}
                  className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none transition focus:border-sky-500"
                  placeholder="24 - 11 - 2025"
                />
              )}
              <SliderRow
                label="Font Tanggal (px)"
                value={props.styles.dateSize}
                min={14}
                max={72}
                step={1}
                onChange={(v) => props.onStyleChange({ dateSize: v })}
              />
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between text-sm font-semibold text-white/80">
              <span>Lokasi (multi-line)</span>
              <select
                value={props.styles.alignLocation}
                onChange={(e) => props.onStyleChange({ alignLocation: e.target.value as any })}
                className="rounded border border-white/15 bg-slate-800 px-2 py-1 text-xs text-white"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <textarea
              rows={3}
              value={props.locationLines.join("\n")}
              onChange={(e) => props.onLocationChange(e.target.value)}
              className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none transition focus:border-sky-500"
              placeholder="Jakarta&#10;Indonesia"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <SliderRow
                label="Font Lokasi (px)"
                value={props.styles.locationSize}
                min={12}
                max={64}
                step={1}
                onChange={(v) => props.onStyleChange({ locationSize: v })}
              />
              <SliderRow
                label="Line spacing"
                value={props.styles.lineSpacing}
                min={0.8}
                max={2}
                step={0.05}
                onChange={(v) => props.onStyleChange({ lineSpacing: v })}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3">
          <label className="flex flex-col gap-1 text-sm text-white/80">
            Teks custom (multi-line)
            <textarea
              rows={5}
              value={props.customText}
              onChange={(e) => props.onCustomTextChange(e.target.value)}
              className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none transition focus:border-sky-500"
              placeholder={"12.00\n24 - 11 - 2025\nJakarta\nIndonesia"}
            />
          </label>
          <div className="flex items-center justify-between text-xs text-white/70">
            <span>Alignment</span>
            <select
              value={props.styles.alignCustom}
              onChange={(e) => props.onStyleChange({ alignCustom: e.target.value as any })}
              className="rounded border border-white/15 bg-slate-800 px-2 py-1 text-xs text-white"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
          <SliderRow
            label="Font (px)"
            value={props.styles.customSize}
            min={12}
            max={72}
            step={1}
            onChange={(v) => props.onStyleChange({ customSize: v })}
          />
          <SliderRow
            label="Line spacing"
            value={props.styles.lineSpacing}
            min={0.8}
            max={2}
            step={0.05}
            onChange={(v) => props.onStyleChange({ lineSpacing: v })}
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-white/80">
          Posisi Stamp
          <select
            value={props.positionPreset}
            onChange={(e) => props.onPresetChange(e.target.value as PositionPreset)}
            className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none transition focus:border-sky-500"
          >
            {POSITION_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-1 text-sm text-white/80">
          Frame Ratio
          <div className="flex items-center gap-2">
            <select
              value={props.frameRatioId}
              onChange={(e) => props.onRatioChange(e.target.value as FrameRatioId)}
              className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none transition focus:border-sky-500"
            >
              {FRAME_RATIO_OPTIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
            <div className="flex items-center gap-1 text-xs text-white/70">
              <input
                type="number"
                min={0.5}
                max={10}
                step={0.1}
                value={props.customRatio.w}
                disabled={props.frameRatioId !== "custom"}
                onChange={(e) => props.onCustomRatioChange({ w: Number(e.target.value) })}
                className="w-14 rounded border border-white/15 bg-slate-800 px-2 py-1 text-right text-white outline-none disabled:opacity-50"
              />
              <span>:</span>
              <input
                type="number"
                min={0.5}
                max={10}
                step={0.1}
                value={props.customRatio.h}
                disabled={props.frameRatioId !== "custom"}
                onChange={(e) => props.onCustomRatioChange({ h: Number(e.target.value) })}
                className="w-14 rounded border border-white/15 bg-slate-800 px-2 py-1 text-right text-white outline-none disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
        <div className="mb-2 flex items-center justify-between text-xs text-white/60">
          <span>Zoom</span>
          <span className="text-white/70">{props.zoom.toFixed(2)}x</span>
        </div>
        <input
          type="range"
          min={0.6}
          max={3}
          step={0.01}
          value={props.zoom}
          onChange={(e) => props.onZoomChange(Number(e.target.value))}
          className="w-full accent-sky-500"
        />
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <SliderRow
            label="Pan X"
            value={props.offset.x}
            min={-offsetXMax}
            max={offsetXMax}
            step={1}
            onChange={(v) => props.onOffsetChange({ x: v, y: props.offset.y })}
          />
          <SliderRow
            label="Pan Y"
            value={props.offset.y}
            min={-offsetYMax}
            max={offsetYMax}
            step={1}
            onChange={(v) => props.onOffsetChange({ x: props.offset.x, y: v })}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-white/60">
          <span>
            Offset: {Math.round(props.offset.x)},{Math.round(props.offset.y)} px
          </span>
          <button
            type="button"
            onClick={props.onResetView}
            className="rounded-lg border border-white/20 px-2 py-1 text-[11px] text-white transition hover:border-white/40"
          >
            Reset view
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-white/70">Preview Teks</span>
          <button
            type="button"
            onClick={() => setShowTextPreview((v) => !v)}
            className="text-[11px] text-sky-300 hover:text-sky-200"
          >
            {showTextPreview ? "Hide" : "Show"}
          </button>
        </div>
        {showTextPreview && <LinesPreview lines={props.stampLines} />}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
        <span className="rounded-full border border-white/10 px-2 py-1">Drag di preview untuk posisi stamp</span>
        <span className="rounded-full border border-white/10 px-2 py-1">Alt+drag untuk pan gambar</span>
        <span className="rounded-full border border-white/10 px-2 py-1">Canvas export: sesuai frame</span>
      </div>
    </div>
  );
}
