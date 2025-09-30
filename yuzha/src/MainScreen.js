import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import StageCanvas from "@shared/stages/StageCanvas";
import { MainScreenBtnPanel, useMainScreenBtnGesture, MainScreenRendererBadge, MainScreenUpdater, MainScreenApiTester, } from "./MainScreenUtils";
function MainScreenOverlay() {
    const gesture = useMainScreenBtnGesture();
    const label = "Canvas 2D Renderer";
    return (_jsxs(_Fragment, { children: [_jsx("div", { ...gesture.bindTargetProps(), className: "absolute inset-0 pointer-events-auto z-20" }), _jsx(MainScreenBtnPanel, { open: gesture.open, onToggle: gesture.toggle, effect: { kind: "fade" }, title: "Modules", target: "_self" }), _jsx(MainScreenRendererBadge, { visible: gesture.open, label: label }), _jsx(MainScreenApiTester, { visible: gesture.open }), _jsx(MainScreenUpdater, { visible: gesture.open })] }));
}
/**
 * Container host untuk stage dan overlay lain.
 * Bertugas menyediakan kanvas full-screen 2048x2048.
 */
export default function MainScreen({ children }) {
    return (_jsxs("div", { className: "relative w-screen h-screen overflow-hidden", children: [_jsx(StageCanvas, {}), children ?? _jsx(MainScreenOverlay, {})] }));
}
export { MainScreenOverlay };
