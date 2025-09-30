import React from "react";
import MainScreen from "./MainScreen";
import ErrorBoundary from "./ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <div className="app-shell">
        <MainScreen />
      </div>
    </ErrorBoundary>
  );
}
