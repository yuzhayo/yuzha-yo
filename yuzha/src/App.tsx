import React from "react";
import MainScreen from "./MainScreen";
import FloatingScreen from "@shared/floating/FloatingScreen";

type AppView = "main" | "floating";

export default function App() {
  const [view, setView] = React.useState<AppView>("main");

  const handleOpenFloating = React.useCallback(() => setView("floating"), []);
  const handleReturnToMain = React.useCallback(() => setView("main"), []);

  if (view === "floating") {
    return <FloatingScreen onBack={handleReturnToMain} />;
  }

  return (
    <MainScreen
      onOpenFloatingScreen={handleOpenFloating}
    />
  );
}
