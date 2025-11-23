import React from "react";
import { ControlPanel, ImageDropzone } from "./TimestampPanels";
import { useTimestampState } from "./TimestampState";

export type TimestampScreenProps = {
  onBack?: () => void;
};

export default function TimestampScreen(props: TimestampScreenProps) {
  const state = useTimestampState();

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:px-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-pink-300/70">Timestamp Overlay</p>
            <h1 className="text-2xl font-bold leading-tight text-white">Tambahkan timestamp ke foto</h1>
            <p className="text-sm text-white/60">
              Unggah foto, atur tanggal/jam/lokasi, geser posisi, lalu simpan dengan timestamp tertanam.
            </p>
          </div>
          {props.onBack && (
            <button
              type="button"
              onClick={props.onBack}
              className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 active:bg-slate-800"
            >
              Back
            </button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <ImageDropzone
            photo={state.photo}
            stampText={state.stampText}
            stampSpec={state.stampSpec}
            activeCenter={state.activeCenter}
            previewRef={state.previewRef}
            fileInputRef={state.fileInputRef}
            onBrowse={state.handleBrowseClick}
            onFileInputChange={state.handleFileInputChange}
            onDrop={state.handleDrop}
            onDragOver={state.handleDragOver}
            onPointerDown={state.handlePointerDown}
            onPointerMove={state.handlePointerMove}
            onPointerUp={state.handlePointerUp}
          />

          <ControlPanel
            dateValue={state.dateValue}
            timeValue={state.timeValue}
            location={state.location}
            formatId={state.formatId}
            positionPreset={state.positionPreset}
            photo={state.photo}
            stampText={state.stampText}
            saving={state.saving}
            status={state.status}
            onBrowse={state.handleBrowseClick}
            onSave={state.handleSave}
            onDateChange={state.setDateValue}
            onTimeChange={state.setTimeValue}
            onLocationChange={state.setLocation}
            onFormatChange={state.setFormatId}
            onRandomTime={state.randomizeTime}
            onPresetChange={state.handlePresetChange}
          />
        </div>
      </div>
    </div>
  );
}
