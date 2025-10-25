import React from "react";
import MainScreen from "./MainScreen";
import TestScreen from "./test/testscreen";
import StruckScreen from "./struck/struckScreen";

type AppView = "main" | "test" | "struck";

export default function App() {
  const [view, setView] = React.useState<AppView>("main");

  const handleOpenTest = React.useCallback(() => setView("test"), []);
  const handleOpenStruck = React.useCallback(() => setView("struck"), []);
  const handleReturnToMain = React.useCallback(() => setView("main"), []);

  if (view === "test") {
    return <TestScreen onBack={handleReturnToMain} />;
  }

  if (view === "struck") {
    return <StruckScreen onBack={handleReturnToMain} />;
  }

  return <MainScreen onOpenTestScreen={handleOpenTest} onOpenStruckScreen={handleOpenStruck} />;
}
