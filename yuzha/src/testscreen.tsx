// IMPORT SECTION
import "../../fonts/taimingda.css";

// STYLE SECTION
const STYLE_TAG = `
:root {
  color-scheme: dark;
  font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
  background: #0f172a;
  color: #e2e8f0;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body,
#root {
  min-height: 100vh;
}

.app {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: radial-gradient(circle at top, rgba(59, 130, 246, 0.35), transparent 60%);
}

.screen {
  width: min(560px, 100%);
  text-align: center;
  padding: 3rem 2.5rem;
  border-radius: 24px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 35px 80px -45px rgba(15, 23, 42, 0.9);
  display: grid;
  gap: 1.5rem;
}

.screen__heading {
  font-size: clamp(2rem, 4vw, 2.6rem);
  font-weight: 600;
  font-family: "Taimingda", "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
}

.screen__copy {
  font-size: 1rem;
  line-height: 1.6;
  color: rgba(203, 213, 225, 0.8);
}
`;

// STATE SECTION
const HERO_HEADING = "Yuzha Starter";
const HERO_SUBTITLE = "App wiring is ready. Start building your UI here.";

// LOGIC SECTION (unused)

// UI SECTION
function TestScreen() {
  return (
    <>
      <style>{STYLE_TAG}</style>
      <div className="app">
        <main className="screen">
          <h1 className="screen__heading">{HERO_HEADING}</h1>
          <p className="screen__copy">{HERO_SUBTITLE}</p>
        </main>
      </div>
    </>
  );
}

// EFFECT SECTION (unused)

// EXPORT SECTION
export default TestScreen;

