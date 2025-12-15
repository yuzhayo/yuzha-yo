import React from "react";
import MainScreen from "./MainScreen";
import CounterScreen from "./counter/counterScreen";
import Counter2Screen from "./counter2/counter2Screen";
import TimestampScreen from "./timestamp/timestampScreen";
import FloatingScreen from "@shared/floating/FloatingScreen";
import AlphaRemoveScreen from "./alphaRemove/alphaRemoveScreen";
import ComponentViewerScreen from "./componentViewer/ComponentViewerScreen";

type AppView = "main" | "counter" | "counter2" | "timestamp" | "floating" | "alphaRemove" | "componentViewer";

export default function App() {
  const [view, setView] = React.useState<AppView>("main");

  const handleOpenCounter = React.useCallback(() => setView("counter"), []);
  const handleOpenCounter2 = React.useCallback(() => setView("counter2"), []);
  const handleOpenTimestamp = React.useCallback(() => setView("timestamp"), []);
  const handleOpenFloating = React.useCallback(() => setView("floating"), []);
  const handleOpenAlphaRemove = React.useCallback(() => setView("alphaRemove"), []);
  const handleOpenComponentViewer = React.useCallback(() => setView("componentViewer"), []);
  const handleReturnToMain = React.useCallback(() => setView("main"), []);

  if (view === "counter") {
    return <CounterScreen onBack={handleReturnToMain} />;
  }

  if (view === "counter2") {
    return <Counter2Screen onBack={handleReturnToMain} />;
  }

  if (view === "timestamp") {
    return <TimestampScreen onBack={handleReturnToMain} />;
  }

  if (view === "floating") {
    return <FloatingScreen onBack={handleReturnToMain} />;
  }
  if (view === "alphaRemove") {
    return <AlphaRemoveScreen onBack={handleReturnToMain} />;
  }

  if (view === "componentViewer") {
    return <ComponentViewerScreen onBack={handleReturnToMain} />;
  }

  return (
    <MainScreen
      onOpenCounterScreen={handleOpenCounter}
      onOpenCounter2Screen={handleOpenCounter2}
      onOpenTimestampScreen={handleOpenTimestamp}
      onOpenFloatingScreen={handleOpenFloating}
      onOpenAlphaRemoveScreen={handleOpenAlphaRemove}
      onOpenComponentViewer={handleOpenComponentViewer}
    />
  );
}
