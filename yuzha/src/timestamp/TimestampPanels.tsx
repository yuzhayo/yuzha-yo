import React from "react";
import type {
  FormatPresetId,
  FrameRatioId,
  FrameSize,
  LoadedImage,
  Offset,
  PositionPreset,
  StampSpec,
} from "./TimestampState";
import {
  FORMAT_PRESETS,
  FRAME_RATIO_OPTIONS,
  POSITION_PRESETS,
  clamp01,
} from "./TimestampState";

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
  stampText: string;
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
  dateValue: string;
  timeValue: string;
  location: string;
  formatId: FormatPresetId;
  positionPreset: PositionPreset;
  photo: LoadedImage | null;
  stampText: string;
  saving: boolean;
  status: string | null;
  frameRatioId: FrameRatioId;
  zoom: number;
  offset: Offset;
  offsetLimit: Offset;
  onBrowse: () => void;
  onSave: () => void;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onFormatChange: (value: FormatPresetId) => void;
  onRandomTime: () => void;
  onPresetChange: (value: PositionPreset) => void;
  onRatioChange: (value: FrameRatioId) => void;
  onZoomChange: (value: number) => void;
  onOffsetChange: (value: Offset) => void;
  onResetView: () => void;
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

function ImageOverlayStamp({
  frameBox,
  stampSpec,
  stampText,
  activeCenter,
}: {
  frameBox: FrameBox | null;
  stampSpec: StampSpec;
  stampText: string;
  activeCenter: { x: number; y: number };
}) {
  if (!frameBox) return null;
  const left = `${clamp01(activeCenter.x) * 100}%`;
  const top = `${clamp01(activeCenter.y) * 100}%`;
  return (
    <div
      className="pointer-events-none absolute inline-flex -translate-x-1/2 -translate-y-1/2 select-none items-center justify-center rounded-lg bg-black/60 text-xs text-white shadow-xl shadow-black/40 backdrop-blur"
      style={{
        left,
        top,
        width: stampSpec.width,
        height: stampSpec.height,
        padding: stampSpec.padding,
        fontSize: stampSpec.fontSize,
      }}
    >
      {stampText}
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
              <span>Alt + drag untuk pan gambar, scroll untuk zoom</span>
            </div>
            <div
              ref={props.previewRef}
              className="relative w-full overflow-hidden rounded-xl border border-white/5 bg-slate-950"
              style={{ aspectRatio: `${props.frameRatio.w} / ${props.frameRatio.h}` }}
              onPointerDown={props.onPointerDown}
              onPointerMove={props.onPointerMove}
              onPointerUp={props.onPointerUp}
              onPointerCancel={props.onPointerUp}
              onWheel={props.onWheel}
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
              <ImageOverlayStamp
                frameBox={props.frameBox}
                stampSpec={props.stampSpec}
                stampText={props.stampText}
                activeCenter={props.activeCenter}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ControlPanel(props: ControlPanelProps) {
  const offsetXMax = props.offsetLimit.x || 0;
  const offsetYMax = props.offsetLimit.y || 0;

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-xl shadow-black/30">
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

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-white/80">
          Tanggal
          <input
            type="date"
            value={props.dateValue}
            onChange={(e) => props.onDateChange(e.target.value)}
            className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none transition focus:border-sky-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-white/80">
          Jam
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
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-white/80">
        Lokasi
        <input
          type="text"
          value={props.location}
          onChange={(e) => props.onLocationChange(e.target.value)}
          placeholder="Lokasi dipotret"
          className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none transition focus:border-sky-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-white/80">
        Format Teks
        <select
          value={props.formatId}
          onChange={(e) => props.onFormatChange(e.target.value as FormatPresetId)}
          className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none transition focus:border-sky-500"
        >
          {FORMAT_PRESETS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </label>

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
          </select>
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
          <label className="flex flex-col gap-1 text-xs text-white/70">
            Pan X
            <input
              type="range"
              min={-offsetXMax}
              max={offsetXMax}
              step={1}
              value={props.offset.x}
              onChange={(e) => props.onOffsetChange({ x: Number(e.target.value), y: props.offset.y })}
              className="w-full accent-sky-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-white/70">
            Pan Y
            <input
              type="range"
              min={-offsetYMax}
              max={offsetYMax}
              step={1}
              value={props.offset.y}
              onChange={(e) => props.onOffsetChange({ x: props.offset.x, y: Number(e.target.value) })}
              className="w-full accent-sky-500"
            />
          </label>
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

      <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
        <span className="rounded-full border border-white/10 px-2 py-1">Drag di preview untuk custom stamp</span>
        <span className="rounded-full border border-white/10 px-2 py-1">Alt+drag untuk pan gambar</span>
        <span className="rounded-full border border-white/10 px-2 py-1">Canvas export: sesuai frame</span>
      </div>
    </div>
  );
}
