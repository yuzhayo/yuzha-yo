import React from "react";
import MainScreen from "./MainScreen";
import TestScreen from "./test/testscreen";
import TimestampScreen from "./timestamp/timestampScreen";

type AppView = "main" | "test" | "timestamp";

export default function App() {
  const [view, setView] = React.useState<AppView>("main");

  const handleOpenTest = React.useCallback(() => setView("test"), []);
  const handleOpenTimestamp = React.useCallback(() => setView("timestamp"), []);
  const handleReturnToMain = React.useCallback(() => setView("main"), []);

  if (view === "test") {
    return <TestScreen onBack={handleReturnToMain} />;
  }

  if (view === "timestamp") {
    return <TimestampScreen onBack={handleReturnToMain} />;
  }

  return (
    <MainScreen onOpenTestScreen={handleOpenTest} onOpenTimestampScreen={handleOpenTimestamp} />
  );
}
