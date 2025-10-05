/**
 * Renderer detector - currently set to always return 'dom'
 * Three.js renderer is available but dormant for future use
 */

export function getRendererType(): "dom" {
  console.log("[RendererDetector] Using DOM renderer");
  return "dom";
}
