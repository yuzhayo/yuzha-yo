import React, { Component } from "react";
import type { ReactNode } from "react";
import MainScreen from "./MainScreen";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("🚨 Application Error:", error);
    console.error("Error Info:", errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            backgroundColor: "#0a1628",
            color: "#ffffff",
            fontFamily: "system-ui, -apple-system, sans-serif",
            padding: "20px",
          }}
        >
          <div
            style={{
              maxWidth: "600px",
              textAlign: "center",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              padding: "40px",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>⚠️</div>
            <h1 style={{ fontSize: "28px", marginBottom: "16px", fontWeight: "600" }}>
              Oops! Something went wrong
            </h1>
            <p
              style={{
                fontSize: "16px",
                marginBottom: "24px",
                color: "rgba(255, 255, 255, 0.7)",
                lineHeight: "1.5",
              }}
            >
              The application encountered an unexpected error. Please try reloading the page.
            </p>

            {this.state.error && import.meta.env.DEV && (
              <details
                style={{
                  marginBottom: "24px",
                  textAlign: "left",
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  padding: "16px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  maxHeight: "200px",
                  overflow: "auto",
                }}
              >
                <summary style={{ cursor: "pointer", marginBottom: "12px", fontWeight: "600" }}>
                  Error Details (Development Only)
                </summary>
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    color: "#ff6b6b",
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "12px 24px",
                  fontSize: "16px",
                  fontWeight: "500",
                  backgroundColor: "#4f46e5",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#4338ca")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#4f46e5")}
              >
                Reload Page
              </button>

              <button
                onClick={this.handleReset}
                style={{
                  padding: "12px 24px",
                  fontSize: "16px",
                  fontWeight: "500",
                  backgroundColor: "transparent",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.4)")
                }
                onMouseOut={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)")}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <div className="app-shell">
        <MainScreen />
      </div>
    </ErrorBoundary>
  );
}
