import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from "react";
import MainScreen from "./MainScreen";
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.handleReset = () => {
            this.setState({
                hasError: false,
                error: null,
                errorInfo: null
            });
        };
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }
    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error,
            errorInfo: null
        };
    }
    componentDidCatch(error, errorInfo) {
        console.error('🚨 Application Error:', error);
        console.error('Error Info:', errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }
    render() {
        if (this.state.hasError) {
            return (_jsx("div", { style: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    backgroundColor: '#0a1628',
                    color: '#ffffff',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    padding: '20px'
                }, children: _jsxs("div", { style: {
                        maxWidth: '600px',
                        textAlign: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        padding: '40px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }, children: [_jsx("div", { style: { fontSize: '64px', marginBottom: '20px' }, children: "\u26A0\uFE0F" }), _jsx("h1", { style: { fontSize: '28px', marginBottom: '16px', fontWeight: '600' }, children: "Oops! Something went wrong" }), _jsx("p", { style: {
                                fontSize: '16px',
                                marginBottom: '24px',
                                color: 'rgba(255, 255, 255, 0.7)',
                                lineHeight: '1.5'
                            }, children: "The application encountered an unexpected error. Please try reloading the page." }), this.state.error && import.meta.env.DEV && (_jsxs("details", { style: {
                                marginBottom: '24px',
                                textAlign: 'left',
                                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                padding: '16px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                maxHeight: '200px',
                                overflow: 'auto'
                            }, children: [_jsx("summary", { style: { cursor: 'pointer', marginBottom: '12px', fontWeight: '600' }, children: "Error Details (Development Only)" }), _jsxs("pre", { style: {
                                        margin: 0,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        color: '#ff6b6b'
                                    }, children: [this.state.error.toString(), this.state.errorInfo?.componentStack] })] })), _jsxs("div", { style: { display: 'flex', gap: '12px', justifyContent: 'center' }, children: [_jsx("button", { onClick: () => window.location.reload(), style: {
                                        padding: '12px 24px',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        backgroundColor: '#4f46e5',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s'
                                    }, onMouseOver: (e) => e.currentTarget.style.backgroundColor = '#4338ca', onMouseOut: (e) => e.currentTarget.style.backgroundColor = '#4f46e5', children: "Reload Page" }), _jsx("button", { onClick: this.handleReset, style: {
                                        padding: '12px 24px',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        backgroundColor: 'transparent',
                                        color: '#ffffff',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'border-color 0.2s'
                                    }, onMouseOver: (e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)', onMouseOut: (e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)', children: "Try Again" })] })] }) }));
        }
        return this.props.children;
    }
}
export default function App() {
    return (_jsx(ErrorBoundary, { children: _jsx("div", { className: "app-shell", children: _jsx(MainScreen, {}) }) }));
}
