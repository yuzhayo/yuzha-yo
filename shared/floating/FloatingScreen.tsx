import React from "react";
import FloatingWindowTemplate from "./FloatingWindowTemplate";

export type FloatingScreenProps = {
  onBack?: () => void;
};

/**
 * FloatingScreen - Demo screen showing FloatingWindowTemplate usage
 *
 * This demonstrates how to use the FloatingWindowTemplate component
 * with custom content inside.
 */
export default function FloatingScreen({ onBack }: FloatingScreenProps) {
  const [showWindow1, setShowWindow1] = React.useState(true);
  const [showWindow2, setShowWindow2] = React.useState(false);

  return (
    <div className="relative w-screen h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Info Panel */}
      <div className="absolute top-6 left-6 z-10 max-w-md space-y-4">
        <div className="rounded-lg bg-black/40 backdrop-blur-sm p-4 text-white">
          <h2 className="text-lg font-semibold mb-2">Floating Window Template Demo</h2>
          <p className="text-sm text-slate-300 mb-3">
            Drag windows by their header. Resize from edges and corners. Works on desktop and mobile
            devices.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowWindow1(!showWindow1)}
              className="px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-500 transition-colors"
            >
              {showWindow1 ? "Hide" : "Show"} Window 1
            </button>
            <button
              type="button"
              onClick={() => setShowWindow2(!showWindow2)}
              className="px-3 py-1.5 text-sm rounded bg-purple-600 hover:bg-purple-500 transition-colors"
            >
              {showWindow2 ? "Hide" : "Show"} Window 2
            </button>
          </div>
        </div>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            ← Back to Main
          </button>
        )}
      </div>

      {/* Floating Window 1 - Control Panel Example */}
      {showWindow1 && (
        <FloatingWindowTemplate
          title="Control Panel"
          initialPos={{ x: 120, y: 120 }}
          initialSize={{ width: 350, height: 400 }}
          onClose={() => setShowWindow1(false)}
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Settings</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span>Enable notifications</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span>Auto-save changes</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Volume</label>
              <input type="range" className="w-full" min="0" max="100" defaultValue="50" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
              <input
                type="text"
                placeholder="Enter name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                placeholder="Enter description..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Apply Changes
            </button>
          </div>
        </FloatingWindowTemplate>
      )}

      {/* Floating Window 2 - Stats Example */}
      {showWindow2 && (
        <FloatingWindowTemplate
          title="Statistics Dashboard"
          initialPos={{ x: 500, y: 200 }}
          initialSize={{ width: 300, height: 250 }}
          minWidth={250}
          minHeight={200}
          onClose={() => setShowWindow2(false)}
        >
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3">
              <div className="text-xs text-blue-600 font-medium">Total Users</div>
              <div className="text-2xl font-bold text-blue-900">1,234</div>
              <div className="text-xs text-blue-600">↑ 12% from last week</div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-3">
              <div className="text-xs text-purple-600 font-medium">Active Sessions</div>
              <div className="text-2xl font-bold text-purple-900">89</div>
              <div className="text-xs text-purple-600">↓ 5% from yesterday</div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3">
              <div className="text-xs text-green-600 font-medium">Revenue</div>
              <div className="text-2xl font-bold text-green-900">$45.2K</div>
              <div className="text-xs text-green-600">↑ 23% from last month</div>
            </div>
          </div>
        </FloatingWindowTemplate>
      )}
    </div>
  );
}
