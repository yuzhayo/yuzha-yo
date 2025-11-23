import React from "react";
import type {
  FormatPresetId,
  LoadedImage,
  PositionPreset,
  StampSpec,
} from "./TimestampState";
import { FORMAT_PRESETS, POSITION_PRESETS, clamp01 } from "./TimestampState";

type ImageDropzoneProps = {
  photo: LoadedImage | null;
  stampText: string;
  stampSpec: StampSpec | null;
  activeCenter: { x: number; y: number };
  previewRef: React.RefObject<HTMLDivElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onBrowse: () => void;
  onFileInputChange: React.ChangeEventHandler<HTMLInputElement>;
  onDrop: React.DragEventHandler<HTMLDivElement>;
  onDragOver: React.DragEventHandler<HTMLDivElement>;
  onPointerDown: React.PointerEventHandler<HTMLDivElement>;
  onPointerMove: React.PointerEventHandler<HTMLDivElement>;
  onPointerUp: React.PointerEventHandler<HTMLDivElement>;
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
  onBrowse: () => void;
  onSave: () => void;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onFormatChange: (value: FormatPresetId) => void;
  onRandomTime: () => void;
  onPresetChange: (value: PositionPreset) => void;
};

function usePreviewStampStyle(
  photo: LoadedImage | null,
  stampSpec: StampSpec | null,
  activeCenter: { x: number; y: number },
  previewRef: React.RefObject<HTMLDivElement>,
) {
  return React.useMemo(() => {
    if (!photo || !stampSpec || !previewRef.current) return null;
    const previewWidth = previewRef.current.getBoundingClientRect().width || 1;
    const previewHeight = previewRef.current.getBoundingClientRect().height || 1;
    const scaleX = previewWidth / photo.width;
    const scaleY = previewHeight / photo.height;
    const left = `${clamp01(activeCenter.x) * 100}%`;
    const top = `${clamp01(activeCenter.y) * 100}%`;
    return {
      left,
      top,
      width: stampSpec.width * scaleX,
      height: stampSpec.height * scaleY,
      padding: stampSpec.padding * ((scaleX + scaleY) / 2),
      fontSize: stampSpec.fontSize * ((scaleX + scaleY) / 2),
    };
  }, [photo, stampSpec, activeCenter, previewRef]);
}

export function ImageDropzone(props: ImageDropzoneProps) {
  const inputId = React.useId();

  const previewStampStyle = usePreviewStampStyle(
    props.photo,
    props.stampSpec,
    props.activeCenter,
    props.previewRef,
  );

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
              <span>
                {props.stampSpec
                  ? props.activeCenter
                      ? `Posisi: ${props.activeCenter.x.toFixed(2)}, ${props.activeCenter.y.toFixed(2)}`
                      : "Posisi siap diatur"
                  : "Posisi siap diatur"}
              </span>
            </div>
            <div
              ref={props.previewRef}
              className="relative w-full overflow-hidden rounded-xl border border-white/5 bg-slate-950"
              onPointerDown={props.onPointerDown}
              onPointerMove={props.onPointerMove}
              onPointerUp={props.onPointerUp}
              onPointerCancel={props.onPointerUp}
            >
              <img
                src={props.photo.url}
                alt="preview"
                className="block h-full w-full object-contain"
                style={{ maxHeight: "70vh" }}
              />
              {props.stampSpec && previewStampStyle && (
                <div
                  className="pointer-events-none absolute inline-flex -translate-x-1/2 -translate-y-1/2 select-none items-center justify-center rounded-lg bg-black/60 text-xs text-white shadow-xl shadow-black/40 backdrop-blur"
                  style={{
                    left: previewStampStyle.left,
                    top: previewStampStyle.top,
                    width: previewStampStyle.width,
                    height: previewStampStyle.height,
                    padding: previewStampStyle.padding,
                    fontSize: previewStampStyle.fontSize,
                  }}
                >
                  {props.stampText}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ControlPanel(props: ControlPanelProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-xl shadow-black/30">
      <div className="flex items-center gap-3">
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
          Posisi
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
        <div className="flex flex-col justify-end gap-2 text-sm text-white/70">
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            {props.photo ? (
              <>
                <div className="font-medium text-white">Preview Stamp</div>
                <div className="text-xs text-white/60">{props.stampText}</div>
              </>
            ) : (
              <div className="text-xs text-white/50">Belum ada foto</div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
        <span className="rounded-full border border-white/10 px-2 py-1">Drag di preview untuk custom</span>
        <span className="rounded-full border border-white/10 px-2 py-1">Canvas export: PNG</span>
      </div>
    </div>
  );
}
