"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { SessionUser } from "@/lib/auth/getCurrentUser";

type Props = {
  user: SessionUser;
  children: React.ReactNode;
};

export function Shell({ user, children }: Props) {
  async function handleSignOut() {
    await signOut({ callbackUrl: "/" });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <header className="bg-brand-bg border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Title */}
            <div className="flex items-center gap-6">
              <Link href="/dashboard">
                <h1 className="text-xl font-bold text-white">
                  Taylor Products DAM
                </h1>
              </Link>
              <nav className="hidden md:flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="text-sm text-slate-300 hover:text-white transition-colors"
                >
                  My Media
                </Link>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-sm text-slate-300 hover:text-white transition-colors"
                  >
                    Admin
                  </Link>
                )}
              </nav>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
