import { jsx as _jsx } from "react/jsx-runtime";
import MainScreen from "./MainScreen";
export default function App() {
    return (_jsx("div", { className: "app-shell", children: _jsx(MainScreen, {}) }));
}
