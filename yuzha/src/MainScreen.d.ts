import React from "react";
export type MainScreenProps = {
    children?: React.ReactNode;
};
declare function MainScreenOverlay(): import("react/jsx-runtime").JSX.Element;
/**
 * Container host untuk stage dan overlay lain.
 * Bertugas menyediakan kanvas full-screen 2048x2048.
 */
export default function MainScreen({ children }: MainScreenProps): import("react/jsx-runtime").JSX.Element;
export { MainScreenOverlay };
