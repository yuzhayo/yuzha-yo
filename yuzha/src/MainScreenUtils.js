import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * MainScreenUtils.tsx - Unified MainScreen Component System
 *
 * ⚠️  AI AGENT CRITICAL INSTRUCTIONS:
 *
 * This file is organized into ISOLATED BLOCKS. Each block is marked as:
 * 🔴 CRITICAL - DO NOT DELETE (breaks core functionality)
 * 🟡 OPTIONAL - Safe to delete (removes UI features but basic display works)
 * 🟢 UTILITY - Safe to delete (convenience helpers only, no visual impact)
 *
 * Deleting any 🔴 CRITICAL block will break the application!
 * 🟡 OPTIONAL blocks can be safely removed to reduce features.
 * 🟢 UTILITY blocks provide convenience helpers and can be deleted.
 */
import React from "react";
// ===================================================================
// 🔴 BLOCK 1: STAGE DIMENSIONS AND COORDINATE SYSTEM
// ⚠️  AI AGENT: CRITICAL BLOCK - DO NOT DELETE
// Defines the 2048×2048 stage coordinate system for consistent positioning
// ===================================================================
/** Stage dimensions - 2048×2048 coordinate system */
export const STAGE_WIDTH = 2048;
export const STAGE_HEIGHT = 2048;
/** Stage center coordinates */
export const STAGE_CENTER_X = STAGE_WIDTH / 2; // 1024
export const STAGE_CENTER_Y = STAGE_HEIGHT / 2; // 1024
/** Stage quadrants for positioning reference */
export const STAGE_QUADRANTS = {
    TOP_LEFT: { x: 0, y: 0, width: STAGE_CENTER_X, height: STAGE_CENTER_Y },
    TOP_RIGHT: { x: STAGE_CENTER_X, y: 0, width: STAGE_CENTER_X, height: STAGE_CENTER_Y },
    BOTTOM_LEFT: { x: 0, y: STAGE_CENTER_Y, width: STAGE_CENTER_X, height: STAGE_CENTER_Y },
    BOTTOM_RIGHT: {
        x: STAGE_CENTER_X,
        y: STAGE_CENTER_Y,
        width: STAGE_CENTER_X,
        height: STAGE_CENTER_Y,
    },
};
/** Common positioning zones within 2048×2048 stage */
export const STAGE_ZONES = {
    CENTER: { x: STAGE_CENTER_X, y: STAGE_CENTER_Y },
    TOP_CENTER: { x: STAGE_CENTER_X, y: STAGE_CENTER_Y * 0.25 },
    BOTTOM_CENTER: { x: STAGE_CENTER_X, y: STAGE_CENTER_Y * 1.75 },
    LEFT_CENTER: { x: STAGE_CENTER_X * 0.25, y: STAGE_CENTER_Y },
    RIGHT_CENTER: { x: STAGE_CENTER_X * 1.75, y: STAGE_CENTER_Y },
};
// ===================================================================
// 🟢 BLOCK 3: MODULE LINKS UTILITY
// ⚠️  AI AGENT: UTILITY BLOCK - Safe to delete (removes module navigation)
// Module link generation from environment variables
// ===================================================================
function getDefaultModuleLinks() {
    const env = import.meta.env;
    return [
        { id: "0setting", label: "0Setting", url: env.VITE_URL_0SETTING ?? "http://localhost:5001" },
        { id: "1meng", label: "1Meng", url: env.VITE_URL_1MENG ?? "http://localhost:5002" },
        { id: "3database", label: "3Database", url: env.VITE_URL_3DATABASE ?? "http://localhost:5003" },
        { id: "4extra", label: "4Extra", url: env.VITE_URL_4EXTRA ?? "http://localhost:5004" },
        { id: "5rara", label: "5Rara", url: env.VITE_URL_5RARA ?? "http://localhost:5005" },
    ];
}
// ===================================================================
// 🟢 BLOCK 4: CACHE MANAGEMENT UTILITY
// ⚠️  AI AGENT: UTILITY BLOCK - Safe to delete (removes cache clearing)
// Cache clearing and reload functionality for updater component
// ===================================================================
async function clearCachesAndReload() {
    try {
        if ("serviceWorker" in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (const r of regs)
                try {
                    await r.unregister();
                }
                catch { }
        }
    }
    catch { }
    try {
        if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
        }
    }
    catch { }
    try {
        const url = new URL(window.location.href);
        url.searchParams.set("_ts", String(Date.now()));
        window.location.replace(url.toString());
    }
    catch {
        window.location.reload();
    }
}
export function useMainScreenBtnGesture(opts) {
    const holdMs = Math.max(120, Math.floor(opts?.holdMs ?? 450));
    const tol = Math.max(2, Math.floor(opts?.moveTolerancePx ?? 8));
    const [open, setOpen] = React.useState(false);
    const toggle = React.useCallback(() => setOpen((v) => !v), []);
    const pressRef = React.useRef({
        active: false,
        id: null,
        startX: 0,
        startY: 0,
        startedAt: 0,
        timer: null,
        consumed: false,
    });
    const clearTimer = React.useCallback(() => {
        const p = pressRef.current;
        if (p.timer !== null) {
            window.clearTimeout(p.timer);
            p.timer = null;
        }
    }, []);
    const onPointerDown = React.useCallback((e) => {
        if (!e.isPrimary)
            return; // Pastikan target dapat menerima pointer event
        e.currentTarget.setPointerCapture?.(e.pointerId);
        const p = pressRef.current;
        p.active = true;
        p.id = e.pointerId;
        p.startX = e.clientX;
        p.startY = e.clientY;
        p.startedAt = performance.now();
        p.consumed = false;
        clearTimer();
        p.timer = window.setTimeout(() => {
            // Bila masih aktif dan belum digerakkan jauh, toggle
            if (p.active && !p.consumed) {
                p.consumed = true;
                toggle();
            }
        }, holdMs);
    }, [clearTimer, holdMs, toggle]);
    const onPointerMove = React.useCallback((e) => {
        const p = pressRef.current;
        if (!p.active || p.id !== e.pointerId)
            return;
        const dx = e.clientX - p.startX;
        const dy = e.clientY - p.startY;
        if (dx * dx + dy * dy > tol * tol) {
            // Terlalu banyak bergerak saat menahan → batalkan hold
            p.active = false;
            p.id = null;
            p.consumed = false;
            clearTimer();
        }
    }, [clearTimer, tol]);
    const endPress = React.useCallback((e) => {
        const p = pressRef.current;
        if (!p.active || (p.id !== null && p.id !== e.pointerId))
            return;
        p.active = false;
        p.id = null;
        // Jika timer belum menembak (belum long-press), tidak melakukan apa-apa (bukan toggle).
        clearTimer();
        // Lepas capture jika sempat dipasang
        try {
            e.currentTarget.releasePointerCapture?.(e.pointerId);
        }
        catch { }
    }, [clearTimer]);
    const bindTargetProps = React.useCallback(() => {
        return {
            onPointerDown,
            onPointerMove,
            onPointerUp: endPress,
            onPointerCancel: endPress,
        };
    }, [onPointerDown, onPointerMove, endPress]);
    // Bersih-bersih saat unmount
    React.useEffect(() => {
        return () => clearTimer();
    }, [clearTimer]);
    return { open, setOpen, toggle, bindTargetProps };
}
// ===================================================================
// 🔴 BLOCK 6: EFFECT SYSTEM
// ⚠️  AI AGENT: CRITICAL BLOCK - DO NOT DELETE
// Visual effects system for button styling and animations
// ===================================================================
export function useMainScreenBtnEffect(state, cfg) {
    const kind = cfg?.kind ?? "none";
    // Base styles aman (dark UI)
    const basePanel = "pointer-events-auto fixed bottom-4 right-4 z-[9999] " +
        "bg-neutral-900/80 backdrop-blur-md border border-neutral-800 " +
        "rounded-2xl shadow-lg px-3 py-2 flex items-center gap-2";
    const baseButton = "btn inline-flex items-center gap-2 px-3 py-1.5 rounded-xl " +
        "bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 " +
        "text-sm leading-none";
    const baseBadge = "badge text-[10px] px-2 py-0.5 rounded bg-neutral-800/70 border border-neutral-700";
    // Variasi sederhana (placeholder). Tidak mengubah flow logic.
    if (kind === "glow") {
        return {
            panelClass: basePanel + " ring-1 ring-pink-400/25",
            panelStyle: state.open ? { boxShadow: "0 0 24px rgba(236,72,153,0.25)" } : undefined,
            buttonClass: baseButton + " ring-1 ring-pink-400/20",
            buttonStyle: state.hovering ? { boxShadow: "0 0 12px rgba(236,72,153,0.35)" } : undefined,
            badgeClass: baseBadge,
        };
    }
    if (kind === "pulse") {
        return {
            panelClass: basePanel,
            panelStyle: state.open ? { animation: "pulse 1.5s ease-in-out infinite" } : undefined,
            buttonClass: baseButton,
            buttonStyle: state.pressing ? { transform: "scale(0.98)" } : undefined,
            badgeClass: baseBadge,
        };
    }
    if (kind === "fade") {
        return {
            panelClass: basePanel,
            panelStyle: { opacity: state.open ? 1 : 0.85, transition: "opacity 160ms ease" },
            buttonClass: baseButton,
            buttonStyle: undefined,
            badgeClass: baseBadge,
        };
    }
    // kind === 'none' (default)
    return {
        panelClass: basePanel,
        panelStyle: undefined,
        buttonClass: baseButton,
        buttonStyle: undefined,
        badgeClass: baseBadge,
    };
}
// ===================================================================
// 🟡 BLOCK 7: RENDERER BADGE COMPONENT
// ⚠️  AI AGENT: OPTIONAL BLOCK - Safe to delete (removes renderer info display)
// Component for displaying renderer type badge
// ===================================================================
export function MainScreenRendererBadge(props) {
    if (!props.visible)
        return null;
    return (_jsx("div", { className: "pointer-events-none select-none fixed top-3 right-3 z-[9998] text-[10px] px-2 py-0.5 rounded bg-black/60 border border-white/10 text-white/80", "aria-live": "polite", children: props.label }));
}
// ===================================================================
// 🟡 BLOCK 8: API TESTER COMPONENT
// ⚠️  AI AGENT: OPTIONAL BLOCK - Safe to delete (removes API tester display)
// Component for displaying API tester information
// ===================================================================
export function MainScreenApiTester(props) {
    if (!props.visible)
        return null;
    return (_jsx("div", { className: "fixed top-9 right-16 z-[9998] rounded border border-white/10 bg-black/70 px-3 py-2 text-[11px] text-white/80 shadow-sm", children: "Supabase API tester dinonaktifkan. Gunakan data lokal untuk verifikasi." }));
}
// ===================================================================
// 🟡 BLOCK 9: UPDATER COMPONENT
// ⚠️  AI AGENT: OPTIONAL BLOCK - Safe to delete (removes update functionality)
// Component for cache clearing and app updating
// ===================================================================
export function MainScreenUpdater(props) {
    if (!props.visible)
        return null;
    const handleSyncAssets = React.useCallback(() => {
        const command = "npm run sync:image-registry";
        if (navigator.clipboard?.writeText) {
            navigator.clipboard
                .writeText(command)
                .then(() => {
                window.alert("Sync command copied. Run it in your terminal.");
            })
                .catch(() => {
                window.prompt("Run this command to sync assets:", command);
            });
        }
        else {
            window.prompt("Run this command to sync assets:", command);
        }
    }, []);
    return (_jsxs("div", { className: "fixed top-9 right-3 z-[9998] flex flex-col gap-1", children: [_jsx("button", { type: "button", onClick: clearCachesAndReload, className: "text-[10px] px-2 py-0.5 rounded bg-pink-600/80 hover:bg-pink-500/80 active:bg-pink-600 text-white shadow-sm border border-white/10", "aria-label": "Force update and reload", children: "Update" }), _jsx("button", { type: "button", onClick: handleSyncAssets, className: "text-[10px] px-2 py-0.5 rounded bg-indigo-600/80 hover:bg-indigo-500/80 active:bg-indigo-600 text-white shadow-sm border border-white/10", children: "Sync Assets" })] }));
}
// ===================================================================
// 🔴 BLOCK 10: BUTTON PANEL COMPONENT
// ⚠️  AI AGENT: CRITICAL BLOCK - DO NOT DELETE
// Main navigation panel component for module access
// ===================================================================
export function MainScreenBtnPanel(props) {
    const { open, onToggle, title = "Modules", target = "_self" } = props;
    const [hovering, setHovering] = React.useState(false);
    const [pressing, setPressing] = React.useState(false);
    const vis = useMainScreenBtnEffect({ open, hovering, pressing }, props.effect);
    const links = React.useMemo(() => props.links ?? getDefaultModuleLinks(), [props.links]);
    // ESC untuk menutup cepat
    React.useEffect(() => {
        if (!open)
            return;
        const onKey = (e) => {
            if (e.key === "Escape")
                onToggle?.();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onToggle]);
    if (!open)
        return null;
    return (_jsxs("div", { className: vis.panelClass, style: vis.panelStyle, children: [_jsx("span", { className: vis.badgeClass, children: title }), _jsxs("div", { className: "flex items-center gap-2", children: [links.map((link) => (_jsx("a", { href: link.url, target: target, rel: target === "_blank" ? "noreferrer" : undefined, className: vis.buttonClass, style: vis.buttonStyle, onMouseEnter: () => setHovering(true), onMouseLeave: () => setHovering(false), onMouseDown: () => setPressing(true), onMouseUp: () => setPressing(false), onTouchStart: () => setPressing(true), onTouchEnd: () => setPressing(false), "data-mod": link.id, children: link.label }, link.id))), _jsx("button", { type: "button", className: vis.buttonClass, style: vis.buttonStyle, onClick: onToggle, onMouseEnter: () => setHovering(true), onMouseLeave: () => setHovering(false), onMouseDown: () => setPressing(true), onMouseUp: () => setPressing(false), children: "Close" })] })] }));
}
// ===================================================================
// 🟡 BLOCK 11: GESTURE AREA COMPONENT
// ⚠️  AI AGENT: OPTIONAL BLOCK - Safe to delete (removes gesture area wrapper)
// Wrapper component for gesture handling with optional children
// ===================================================================
export function MainScreenBtnGestureArea(props) {
    const g = useMainScreenBtnGesture(props.options);
    React.useEffect(() => {
        props.onOpenChange?.(g.open);
    }, [g.open, props]);
    return (_jsx("div", { ...g.bindTargetProps(), className: props.className ?? "absolute inset-0 pointer-events-auto", style: props.style, children: typeof props.children === "function"
            ? // @ts-expect-error: expose open via function child kalau mau
                props.children({ open: g.open, toggle: g.toggle })
            : props.children }));
}
// ===================================================================
// 🟢 BLOCK 12: FACTORY EXPORTS AND CONVENIENCE FUNCTIONS
// ⚠️  AI AGENT: UTILITY BLOCK - Safe to delete (convenience only)
// Main composite components and factory functions for external use
// ===================================================================
/**
 * MainScreenBtnDock - util opsional yang langsung menggabungkan gesture + panel.
 * - Pasang ini di App/LauncherScreen untuk pengalaman lengkap.
 * - HOLD-TAP di mana saja pada area overlay akan toggle panel.
 */
export function MainScreenBtnDock(props) {
    const gesture = useMainScreenBtnGesture();
    return (_jsxs(_Fragment, { children: [_jsx("div", { ...gesture.bindTargetProps(), className: props.overlayClassName ?? "absolute inset-0 pointer-events-auto" }), _jsx(MainScreenBtnPanel, { open: gesture.open, onToggle: gesture.toggle, links: props.links, effect: props.effect, title: props.title, target: props.target })] }));
}
// Export convenience functions
export function createMainScreenGesture(_opts) {
    // Note: This would need to be called within a React component
    // This is just for consistency with the LayerSpin pattern
    throw new Error("createMainScreenGesture must be called within a React component using useMainScreenBtnGesture");
}
// Export utility functions for external access
export { getDefaultModuleLinks, clearCachesAndReload };
