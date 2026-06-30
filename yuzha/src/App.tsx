import React from "react";
import MainScreen from "./MainScreen";
import TimestampScreen from "@yuzha/timestamp";
import FloatingScreen from "@shared/floating/FloatingScreen";
import MangaReader from "@yuzha/manga-reader";

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
    return <MangaReader onBack={handleReturnToMain} />;
  }

  return (
    <MainScreen
      onOpenTimestampScreen={handleOpenTimestamp}
      onOpenFloatingScreen={handleOpenFloating}
      onOpenMangaScreen={handleOpenManga}
    />
  );
}
