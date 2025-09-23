import React from "react";

const WRAPPER_STYLE: React.CSSProperties = {
  width: "100vw",
  height: "100vh",
  margin: 0,
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#0f172a",
  color: "#fff",
  fontFamily: "sans-serif",
};

const MainScreen: React.FC = () => (
  <div style={WRAPPER_STYLE}>
    <p>Display host ready.</p>
  </div>
);

export default MainScreen;
