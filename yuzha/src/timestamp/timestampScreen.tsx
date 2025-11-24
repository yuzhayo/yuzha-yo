import React from "react";
import { ControlPanel, ImageDropzone } from "./TimestampPanels";
import { useTimestampState } from "./TimestampState";

export type TimestampScreenProps = {
  onBack?: () => void;
};

export default function TimestampScreen(props: TimestampScreenProps) {
  const state = useTimestampState();

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-white overflow-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-4 md:px-6">
        <div className="flex items-center justify-end">
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

        <div className="grid w-full gap-4 md:grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] md:min-h-0 md:overflow-visible">
          <div className="min-h-0">
            <ImageDropzone
              photo={state.photo}
              stampSpec={state.stampSpec}
              activeCenter={state.activeCenter}
              frameRatio={state.frameRatio}
              frameBox={state.frameBox}
              previewRef={state.previewRef}
              fileInputRef={state.fileInputRef}
              onBrowse={state.handleBrowseClick}
              onFileInputChange={state.handleFileInputChange}
              onDrop={state.handleDrop}
              onDragOver={state.handleDragOver}
              onPointerDown={state.handlePointerDown}
              onPointerMove={state.handlePointerMove}
              onPointerUp={state.handlePointerUp}
              onWheel={state.handleWheel}
              onPreviewResize={state.handlePreviewResize}
            />
          </div>

          <div className="min-h-0">
            <ControlPanel
              textMode={state.textMode}
              timeValue={state.timeValue}
              dateMode={state.dateMode}
              datePickerValue={state.datePickerValue}
              dateManual={state.dateManual}
              timeRandomStart={state.timeRandomStart}
              timeRandomEnd={state.timeRandomEnd}
              locationLines={state.locationLines}
              customText={state.customText}
              styles={state.styles}
              positionPreset={state.positionPreset}
              frameRatioId={state.frameRatioId}
              customRatio={state.customRatio}
              zoom={state.zoom}
              offset={state.imageOffset}
              offsetLimit={state.offsetLimit}
              stampLines={state.stampLines}
              photo={state.photo}
              saving={state.saving}
              status={state.status}
              presets={state.presets}
              activePreset={state.activePreset}
              onBrowse={state.handleBrowseClick}
              onSave={state.handleSave}
              onTextModeChange={state.setTextMode}
              onTimeChange={state.setTimeValue}
              onLocationChange={state.updateLocationLines}
              onCustomTextChange={state.setCustomText}
              onStyleChange={(patch) => state.setStyles((prev) => ({ ...prev, ...patch }))}
              onRandomTime={state.randomizeTime}
              onRandomTimeRange={state.randomizeTimeInRange}
              onTimeRangeChange={(patch) => {
                if (patch.start !== undefined) state.setTimeRandomStart(patch.start);
                if (patch.end !== undefined) state.setTimeRandomEnd(patch.end);
              }}
              onDateModeChange={state.setDateMode}
              onDatePickerChange={state.setDatePickerValue}
              onDateManualChange={state.setDateManual}
              timeFormat={state.timeFormat}
              onTimeFormatChange={state.setTimeFormat}
              onSavePreset={(name) => state.savePreset(name)}
              onLoadPreset={(name) => state.loadPreset(name)}
              onDeletePreset={(name) => state.deletePreset(name)}
              onPresetChange={state.handlePresetChange}
              onRatioChange={state.handleFrameRatioChange}
              onCustomRatioChange={state.handleCustomRatioChange}
              onZoomChange={state.handleZoomChange}
              onOffsetChange={state.handleOffsetChange}
              onResetView={state.handleResetView}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
