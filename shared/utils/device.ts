/**
 * Device detection utilities
 */

export interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  hasTouch: boolean
  pixelRatio: number
  screenSize: { width: number; height: number }
}

export function getDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent.toLowerCase()
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  
  const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent)
  const isDesktop = !isMobile && !isTablet
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    hasTouch,
    pixelRatio: window.devicePixelRatio || 1,
    screenSize: {
      width: window.screen.width,
      height: window.screen.height
    }
  }
}

export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

export function getViewportSize() {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  }
}