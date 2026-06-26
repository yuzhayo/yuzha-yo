import React from "react";
import MainScreen from "./MainScreen";
import TimestampScreen from "./timestamp/timestampScreen";
import FloatingScreen from "@shared/floating/FloatingScreen";

type AppView = "main" | "timestamp" | "floating";

export default function App() {
  const [view, setView] = React.useState<AppView>("main");

  const handleOpenTimestamp = React.useCallback(() => setView("timestamp"), []);
  const handleOpenFloating = React.useCallback(() => setView("floating"), []);
  const handleReturnToMain = React.useCallback(() => setView("main"), []);

  if (view === "timestamp") {
    return <TimestampScreen onBack={handleReturnToMain} />;
  }

  if (view === "floating") {
    return <FloatingScreen onBack={handleReturnToMain} />;
  }

  return (
    <MainScreen
      onOpenTimestampScreen={handleOpenTimestamp}
      onOpenFloatingScreen={handleOpenFloating}
    />
  );
}
