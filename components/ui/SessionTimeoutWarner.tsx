"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";

const WARNING_BEFORE_MS = 5 * 60 * 1000; // Show warning 5 min before expiry

export function SessionTimeoutWarner() {
  const { data: session } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [isExtending, setIsExtending] = useState(false);

  useEffect(() => {
    if (!session?.expires) return;

    const expiresAt = new Date(session.expires).getTime();

    function check() {
      const now = Date.now();
      const remaining = expiresAt - now;
      setShowWarning(remaining > 0 && remaining <= WARNING_BEFORE_MS);
    }

    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [session?.expires]);

  async function handleExtend() {
    setIsExtending(true);
    try {
      // Trigger a soft sign-in to refresh the session
      await signIn(undefined, { redirect: false });
      setShowWarning(false);
    } catch {
      // ignore
    } finally {
      setIsExtending(false);
    }
  }

  if (!showWarning) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-white dark:bg-slate-800 border border-amber-200 rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-4 max-w-sm">
        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Session expiring soon</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Click to stay signed in</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setShowWarning(false)}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors px-2 py-1"
          >
            Dismiss
          </button>
          <button
            onClick={handleExtend}
            disabled={isExtending}
            className="text-xs font-semibold text-white bg-brand-primary hover:bg-brand-secondary px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {isExtending ? "..." : "Stay logged in"}
          </button>
        </div>
      </div>
    </div>
  );
}
