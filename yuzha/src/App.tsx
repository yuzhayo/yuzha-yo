import React from "react";
import MainScreen from "./MainScreen";
import TimestampScreen from "./timestamp/timestampScreen";
import FloatingScreen from "@shared/floating/FloatingScreen";
import MangaReaderScreen from "./manga/MangaReaderScreen";

type AppView = "main" | "timestamp" | "floating" | "manga";

export default function App() {
  const [view, setView] = React.useState<AppView>("main");

  const handleOpenTimestamp = React.useCallback(() => setView("timestamp"), []);
  const handleOpenFloating = React.useCallback(() => setView("floating"), []);
  const handleOpenManga = React.useCallback(() => setView("manga"), []);
  const handleReturnToMain = React.useCallback(() => setView("main"), []);

  if (view === "timestamp") {
    return <TimestampScreen onBack={handleReturnToMain} />;
  }

  if (view === "floating") {
    return <FloatingScreen onBack={handleReturnToMain} />;
  }

  if (view === "manga") {
    return <MangaReaderScreen onBack={handleReturnToMain} />;
  }

  return (
    <MainScreen
      onOpenTimestampScreen={handleOpenTimestamp}
      onOpenFloatingScreen={handleOpenFloating}
      onOpenMangaScreen={handleOpenManga}
    />
  );
}
