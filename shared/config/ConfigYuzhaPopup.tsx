import React, { useState, useCallback } from "react";
import { useConfigYuzhaPopupDragResize } from "./ConfigYuzhaPopupDragResize";
import { ConfigYuzhaPopupHeader } from "./ConfigYuzhaPopupHeader";
import { ConfigYuzhaPopupHandles } from "./ConfigYuzhaPopupHandles";
import { ConfigYuzhaAccordion } from "./ConfigYuzhaAccordion";
import { transformConfigToAccordion } from "./ConfigYuzhaPopupUtils";
import type { ConfigYuzhaPopupProps, ConfigYuzhaPopupButtonProps } from "./ConfigYuzhaPopupUtils";
import type { AccordionParentItem } from "./ConfigYuzhaAccordionUtils";
import imageRegistryData from "./ImageRegistry.json";

// ---------------------------------------------------------------------------
// ConfigYuzhaPopup (main component)
// ---------------------------------------------------------------------------
export function ConfigYuzhaPopup({
  isOpen,
  onClose,
  title = "Layer Configuration",
  children,
}: ConfigYuzhaPopupProps) {
  const {
    isDragging,
    isResizing,
    position,
    size,
    isCentered,
    popupRef,
    startDrag,
    startResize,
  } = useConfigYuzhaPopupDragResize();

  // Transform data for accordion
  const [accordionData] = useState<AccordionParentItem[]>(() => transformConfigToAccordion());
  const [imageOptions] = useState<string[]>(() => imageRegistryData.map((img) => img.id));

  const handleSaveChanges = useCallback((_data: AccordionParentItem[]) => {
    // Here you could implement actual save logic
    // For now, just log the changes
    alert("Changes saved! (Console log available)");
  }, []);

  if (!isOpen) return null;

  const popupStyle = isCentered
    ? {
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: `${size.width}px`,
        height: `${size.height}px`,
      }
    : {
        left: "0",
        top: "0",
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[1000]"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div
        ref={popupRef}
        className="absolute bg-white rounded-xl shadow-[0_25px_50px_rgba(0,0,0,0.25)] overflow-hidden transition-shadow duration-300 hover:shadow-[0_35px_60px_rgba(0,0,0,0.3)]"
        style={{
          ...popupStyle,
          touchAction: "none",
          willChange: isDragging || isResizing ? "transform, width, height" : "auto",
        }}
        onMouseDown={(event) => event.stopPropagation()}
        data-testid="config-popup"
      >
        <ConfigYuzhaPopupHeader
          title={title}
          onClose={onClose}
          onMouseDown={startDrag}
          onTouchStart={startDrag}
        />

        <div className="border-b border-gray-300 bg-white px-3 py-2 flex gap-2">
          <button
            type="button"
            onClick={() => handleSaveChanges(accordionData)}
            className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-colors"
          >
            Sync
          </button>
          <button
            type="button"
            className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded font-semibold transition-colors"
          >
            Add
          </button>
        </div>

        <div className="relative bg-gray-50" style={{ height: "calc(100% - 48px - 44px)" }}>
          <div className="w-full h-full">
            <div className="p-3">
              {children ? (
                children
              ) : (
                <ConfigYuzhaAccordion
                  data={accordionData}
                  onSave={handleSaveChanges}
                  imageOptions={imageOptions}
                />
              )}
            </div>
          </div>
        </div>

        <ConfigYuzhaPopupHandles onStartResize={startResize} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConfigYuzhaPopupButton (trigger button)
// ---------------------------------------------------------------------------
export function ConfigYuzhaPopupButton({
  label = "Sync Assets",
  popupTitle,
  className,
  children,
}: ConfigYuzhaPopupButtonProps) {
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={
          className ??
          "text-[10px] px-2 py-0.5 rounded bg-indigo-600/80 hover:bg-indigo-500/80 active:bg-indigo-600 text-white shadow-sm border border-white/10"
        }
        data-testid="sync-assets-button"
      >
        {label}
      </button>
      <ConfigYuzhaPopup isOpen={open} onClose={handleClose} title={popupTitle}>
        {children}
      </ConfigYuzhaPopup>
    </>
  );
}