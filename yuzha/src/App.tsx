import React from "react";
import MainScreen from "./MainScreen";
import CounterScreen from "./counter/counterScreen";
import TimestampScreen from "./timestamp/timestampScreen";
import FloatingScreen from "./floating/FloatingScreen";

type AppView = "main" | "counter" | "timestamp" | "floating";

export default function App() {
  const [view, setView] = React.useState<AppView>("main");

  const handleOpenCounter = React.useCallback(() => setView("counter"), []);
  const handleOpenTimestamp = React.useCallback(() => setView("timestamp"), []);
  const handleOpenFloating = React.useCallback(() => setView("floating"), []);
  const handleReturnToMain = React.useCallback(() => setView("main"), []);

  if (view === "counter") {
    return <CounterScreen onBack={handleReturnToMain} />;
  }

  if (view === "timestamp") {
    return <TimestampScreen onBack={handleReturnToMain} />;
  }

  if (view === "floating") {
    return <FloatingScreen onBack={handleReturnToMain} />;
  }

  return (
    <MainScreen 
      onOpenCounterScreen={handleOpenCounter} 
      onOpenTimestampScreen={handleOpenTimestamp}
      onOpenFloatingScreen={handleOpenFloating}
    />
  );
}
