import React from "react";

interface ConfigYuzhaPopupHandlesProps {
  onStartResize: (event: React.MouseEvent | React.TouchEvent, handle: string) => void;
}

export function ConfigYuzhaPopupHandles({ onStartResize }: ConfigYuzhaPopupHandlesProps) {
  return (
    <>
      {/* Edge Handles */}
      <div
        className="absolute top-0 left-0 right-0 h-[5px] cursor-n-resize"
        style={{ touchAction: "none" }}
        onMouseDown={(event) => onStartResize(event, "n")}
        onTouchStart={(event) => onStartResize(event, "n")}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-[5px] cursor-s-resize"
        style={{ touchAction: "none" }}
        onMouseDown={(event) => onStartResize(event, "s")}
        onTouchStart={(event) => onStartResize(event, "s")}
      />
      <div
        className="absolute top-0 right-0 bottom-0 w-[5px] cursor-e-resize"
        style={{ touchAction: "none" }}
        onMouseDown={(event) => onStartResize(event, "e")}
        onTouchStart={(event) => onStartResize(event, "e")}
      />
      <div
        className="absolute top-0 left-0 bottom-0 w-[5px] cursor-w-resize"
        style={{ touchAction: "none" }}
        onMouseDown={(event) => onStartResize(event, "w")}
        onTouchStart={(event) => onStartResize(event, "w")}
      />

      {/* Corner Handles */}
      <div
        className="absolute top-0 right-0 w-[10px] h-[10px] cursor-ne-resize"
        style={{ touchAction: "none" }}
        onMouseDown={(event) => onStartResize(event, "ne")}
        onTouchStart={(event) => onStartResize(event, "ne")}
      />
      <div
        className="absolute top-0 left-0 w-[10px] h-[10px] cursor-nw-resize"
        style={{ touchAction: "none" }}
        onMouseDown={(event) => onStartResize(event, "nw")}
        onTouchStart={(event) => onStartResize(event, "nw")}
      />
      <div
        className="absolute bottom-0 right-0 w-[10px] h-[10px] cursor-se-resize"
        style={{ touchAction: "none" }}
        onMouseDown={(event) => onStartResize(event, "se")}
        onTouchStart={(event) => onStartResize(event, "se")}
      />
      <div
        className="absolute bottom-0 left-0 w-[10px] h-[10px] cursor-sw-resize"
        style={{ touchAction: "none" }}
        onMouseDown={(event) => onStartResize(event, "sw")}
        onTouchStart={(event) => onStartResize(event, "sw")}
      />
    </>
  );
}
