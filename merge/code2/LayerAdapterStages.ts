// Adapter: LayerData[] (pure logic) → StageObject[] (renderer-agnostic)
//
// This file is NEW. It does not import from launcher/upgraded/variant folders.
// It only relies on shared types from the unified layer + stages packages.

import type {
  LayerData,
  StageConfigNormalized,
} from "./LayerTypes";
import type {
  StageObject,
} from "../stages/StagesTypes";

/**
 * Convert LayerData[] into StageObject[] expected by StagesEngine.
 * - Keeps ordering using `order` (mapped into Z).
 * - Converts angleDeg/angleRad to a renderer-friendly rotation (Z-axis).
 * - Pass-through extra metadata (src, w, h, opacity, anchor, fit, align).
 */
export function layersToStageObjects(
  layers: LayerData[],
  stage: StageConfigNormalized
): StageObject[] {
  const zBase = 0;

  return layers
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((ld, i) => {
      const z = (ld.order ?? 0) + zBase;

      // Rotation priority:
      // - prefer angleRad if present
      // - else compute from angleDeg
      const angleRad =
        typeof (ld as any).angleRad === "number"
          ? (ld as any).angleRad
          : typeof ld.angleDeg === "number"
            ? (ld.angleDeg * Math.PI) / 180
            : 0;

      // Scale normalization: allow number | [x,y]
      let sx = 1, sy = 1;
      if (Array.isArray(ld.scale)) {
        sx = Number(ld.scale[0] ?? 1);
        sy = Number(ld.scale[1] ?? 1);
      } else if (typeof ld.scale === "number") {
        sx = sy = ld.scale;
      } else if (typeof (ld as any).scale?.x === "number" && typeof (ld as any).scale?.y === "number") {
        sx = (ld as any).scale.x;
        sy = (ld as any).scale.y;
      }

      const obj: StageObject = {
        id: ld.id ?? `L${i}`,
        // Three.js 2D-ish scene uses XY plane; Z from order.
        position: [ld.position?.x ?? 0, ld.position?.y ?? 0, z],
        // Rotation around Z axis (radians)
        rotation: [0, 0, angleRad],
        // Scale XY (Z kept at 1 for sprites/quads)
        scale: [sx, sy, 1],
        visible: (ld.state?.isVisible ?? true) !== false,
        // Renderer-agnostic metadata; Stages side decides how to use it
        metadata: {
          src: ld.image?.src ?? ld.image?.id ?? "",
          w: ld.dimensions?.w,
          h: ld.dimensions?.h,
          opacity: typeof ld.opacity === "number" ? ld.opacity : 1,
          anchor: ld.anchor ?? { x: 0, y: 0 },
          fit: (ld as any).fitMode ?? ld.fit ?? "contain",
          align: ld.align ?? "center",
          stageOrigin: stage.origin,
        },
      };

      return obj;
    });
}
