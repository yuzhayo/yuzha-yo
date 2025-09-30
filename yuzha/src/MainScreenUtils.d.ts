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
import type { CSSProperties } from "react";
/** Stage dimensions - 2048×2048 coordinate system */
export declare const STAGE_WIDTH = 2048;
export declare const STAGE_HEIGHT = 2048;
/** Stage center coordinates */
export declare const STAGE_CENTER_X: number;
export declare const STAGE_CENTER_Y: number;
/** Stage quadrants for positioning reference */
export declare const STAGE_QUADRANTS: {
    readonly TOP_LEFT: {
        readonly x: 0;
        readonly y: 0;
        readonly width: number;
        readonly height: number;
    };
    readonly TOP_RIGHT: {
        readonly x: number;
        readonly y: 0;
        readonly width: number;
        readonly height: number;
    };
    readonly BOTTOM_LEFT: {
        readonly x: 0;
        readonly y: number;
        readonly width: number;
        readonly height: number;
    };
    readonly BOTTOM_RIGHT: {
        readonly x: number;
        readonly y: number;
        readonly width: number;
        readonly height: number;
    };
};
/** Common positioning zones within 2048×2048 stage */
export declare const STAGE_ZONES: {
    readonly CENTER: {
        readonly x: number;
        readonly y: number;
    };
    readonly TOP_CENTER: {
        readonly x: number;
        readonly y: number;
    };
    readonly BOTTOM_CENTER: {
        readonly x: number;
        readonly y: number;
    };
    readonly LEFT_CENTER: {
        readonly x: number;
        readonly y: number;
    };
    readonly RIGHT_CENTER: {
        readonly x: number;
        readonly y: number;
    };
};
export type ModuleLink = {
    id: string;
    label: string;
    url: string;
};
export type MainScreenBtnGestureOptions = {
    /** Durasi tahan minimal (ms) untuk terdeteksi long-press. Default 450 ms. */
    holdMs?: number;
    /** Ambang toleransi gerakan saat menahan (px). Default 8 px. */
    moveTolerancePx?: number;
};
export type MainScreenBtnGesture = {
    /** Status panel tombol (true: tampil). */
    open: boolean;
    /** Ganti status secara manual (opsional). */
    setOpen: (v: boolean) => void;
    /** Toggle manual (opsional). */
    toggle: () => void;
    /**
     * Bind props gestur ke elemen target (mis. overlay full screen).
     * Contoh: <div {...bindTargetProps()} className="absolute inset-0" />
     */
    bindTargetProps: () => React.HTMLAttributes<HTMLElement>;
};
export type MainScreenBtnEffectKind = "none" | "fade" | "pulse" | "glow";
export type MainScreenBtnEffectConfig = {
    kind?: MainScreenBtnEffectKind;
    intensity?: number;
};
export type MainScreenBtnEffectState = {
    open: boolean;
    hovering?: boolean;
    pressing?: boolean;
};
export type MainScreenBtnVisual = {
    panelClass: string;
    panelStyle?: CSSProperties;
    buttonClass: string;
    buttonStyle?: CSSProperties;
    badgeClass: string;
};
export type MainScreenBtnProps = {
    /** Status panel (true: tampil). Direkomendasikan dikontrol oleh useLauncherBtnGesture. */
    open: boolean;
    /** Toggle panel (dipanggil oleh tombol Close). */
    onToggle?: () => void;
    /** Kustom link modul. Default: baca ENV lalu fallback port lokal. */
    links?: ModuleLink[];
    /** Konfigurasi efek visual tombol/panel. */
    effect?: MainScreenBtnEffectConfig;
    /** Judul kecil panel. */
    title?: string;
    /** Buka link di tab yang sama (default) atau tab baru. */
    target?: "_self" | "_blank";
};
export type MainScreenRendererBadgeProps = {
    visible: boolean;
    label: string;
};
export type MainScreenApiTesterProps = {
    visible: boolean;
};
export type MainScreenUpdaterProps = {
    visible: boolean;
};
export type MainScreenBtnGestureAreaProps = {
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
    options?: MainScreenBtnGestureOptions;
    onOpenChange?: (open: boolean) => void;
};
declare function getDefaultModuleLinks(): ModuleLink[];
declare function clearCachesAndReload(): Promise<void>;
export declare function useMainScreenBtnGesture(opts?: MainScreenBtnGestureOptions): MainScreenBtnGesture;
export declare function useMainScreenBtnEffect(state: MainScreenBtnEffectState, cfg?: MainScreenBtnEffectConfig): MainScreenBtnVisual;
export declare function MainScreenRendererBadge(props: MainScreenRendererBadgeProps): import("react/jsx-runtime").JSX.Element | null;
export declare function MainScreenApiTester(props: MainScreenApiTesterProps): import("react/jsx-runtime").JSX.Element | null;
export declare function MainScreenUpdater(props: MainScreenUpdaterProps): import("react/jsx-runtime").JSX.Element | null;
export declare function MainScreenBtnPanel(props: MainScreenBtnProps): import("react/jsx-runtime").JSX.Element | null;
export declare function MainScreenBtnGestureArea(props: MainScreenBtnGestureAreaProps): import("react/jsx-runtime").JSX.Element;
/**
 * MainScreenBtnDock - util opsional yang langsung menggabungkan gesture + panel.
 * - Pasang ini di App/LauncherScreen untuk pengalaman lengkap.
 * - HOLD-TAP di mana saja pada area overlay akan toggle panel.
 */
export declare function MainScreenBtnDock(props: Omit<MainScreenBtnProps, "open" | "onToggle"> & {
    overlayClassName?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function createMainScreenGesture(_opts?: MainScreenBtnGestureOptions): MainScreenBtnGesture;
export { getDefaultModuleLinks, clearCachesAndReload };
