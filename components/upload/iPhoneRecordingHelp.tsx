"use client";

import { useState } from "react";

/**
 * Two iPhone camera settings that make uploads smaller and playable
 * everywhere. Collapsed by default.
 */
export function IPhoneRecordingHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          iPhone camera settings (one-time)
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-4 text-sm text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700 pt-3">
          <div>
            <p className="font-medium text-slate-900 dark:text-white">1. Formats: Most Compatible</p>
            <p className="mt-1">
              Settings → Camera → Formats → <strong>Most Compatible</strong>.
              Photos save as JPEG and videos as H.264 instead of HEIC and HEVC,
              so they open on every computer and phone. HEIC photos are converted
              here automatically, but videos aren&apos;t, so this setting matters
              most for video.
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-white">2. Record Video: 1080p at 30 fps</p>
            <p className="mt-1">
              Settings → Camera → Record Video → <strong>1080p at 30 fps</strong>.
              Plenty for web and social, and a two-minute clip is about 100MB
              instead of 500MB at 4K.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
