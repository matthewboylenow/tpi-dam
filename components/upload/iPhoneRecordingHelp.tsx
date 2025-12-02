"use client";

import { useState } from "react";

export function IPhoneRecordingHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm font-medium text-blue-900">
            💡 iPhone Video Recording Tips
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-blue-600 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3 text-sm text-blue-900">
          <p className="font-medium">
            For faster uploads and smaller file sizes, record at 1080p:
          </p>

          <ol className="space-y-2 list-decimal list-inside">
            <li>
              Open <strong>Settings</strong> on your iPhone
            </li>
            <li>
              Scroll down and tap <strong>Camera</strong>
            </li>
            <li>
              Tap <strong>Record Video</strong>
            </li>
            <li>
              Select <strong>1080p at 30 fps</strong> or{" "}
              <strong>1080p at 60 fps</strong>
            </li>
          </ol>

          <div className="bg-white rounded-lg p-3 mt-3 border border-blue-200">
            <p className="font-medium mb-2">File Size Comparison:</p>
            <ul className="space-y-1 text-xs">
              <li className="flex justify-between">
                <span>4K/60fps (2 min):</span>
                <span className="font-mono text-red-600">~500MB ❌</span>
              </li>
              <li className="flex justify-between">
                <span>4K/30fps (2 min):</span>
                <span className="font-mono text-amber-600">~350MB ⚠️</span>
              </li>
              <li className="flex justify-between">
                <span>1080p/60fps (2 min):</span>
                <span className="font-mono text-green-600">~150MB ✅</span>
              </li>
              <li className="flex justify-between">
                <span>1080p/30fps (2 min):</span>
                <span className="font-mono text-green-600">~100MB ✅</span>
              </li>
            </ul>
          </div>

          <p className="text-xs text-blue-700 mt-3">
            <strong>Note:</strong> 1080p is perfect for web viewing and social
            media. Files upload faster and take less storage space.
          </p>
        </div>
      )}
    </div>
  );
}
