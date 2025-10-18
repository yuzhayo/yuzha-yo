import React from "react";
import MainScreen from "./MainScreen";
import TestScreen from "./test/testscreen";

type AppView = "main" | "test";

export default function App() {
  const [view, setView] = React.useState<AppView>("main");

  const handleOpenTest = React.useCallback(() => setView("test"), []);
  const handleReturnToMain = React.useCallback(() => setView("main"), []);

  if (view === "test") {
    return <TestScreen onBack={handleReturnToMain} />;
  }

  return <MainScreen onOpenTestScreen={handleOpenTest} />;
}
