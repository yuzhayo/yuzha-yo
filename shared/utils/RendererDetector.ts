/**
 * Detect if the current environment is an AI agent or headless browser
 * that might not support WebGL properly for screenshots
 */

export function isAIAgentEnvironment(): boolean {
  // Check if running in a headless browser (common for AI agents)
  if (typeof window === "undefined") {
    return true;
  }

  // Check if WebGL is not supported
  if (!("WebGLRenderingContext" in window)) {
    return true;
  }

  // Check for webdriver (automated browser)
  if (navigator.webdriver === true) {
    return true;
  }

  // Check for headless user agents
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("headless") || ua.includes("phantom") || ua.includes("selenium")) {
    return true;
  }

  // Try to create a WebGL context to verify it actually works
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      return true;
    }
  } catch {
    return true;
  }

  return false;
}

export function getRendererType(): "three" | "canvas" {
  const isAIAgent = isAIAgentEnvironment();
  const rendererType = isAIAgent ? "canvas" : "three";

  console.log("[RendererDetector] Environment detection:", {
    isAIAgent,
    rendererType,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "N/A",
    hasWebGL: typeof window !== "undefined" && "WebGLRenderingContext" in window,
  });

  return rendererType;
}
