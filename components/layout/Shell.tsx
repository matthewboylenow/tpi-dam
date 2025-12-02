"use client";

import { useState } from "react";
import Link from "next/link";
import { SessionUser } from "@/lib/auth/getCurrentUser";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ProfileMenu } from "@/components/ui/ProfileMenu";
import { ChangePasswordModal } from "@/components/ui/ChangePasswordModal";

type Props = {
  user: SessionUser;
  children: React.ReactNode;
};

export function Shell({ user, children }: Props) {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Top Navigation */}
      <header className="bg-brand-bg border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo / Title */}
            <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
              <Link href="/dashboard" className="min-w-0 flex-shrink">
                <h1 className="text-base sm:text-xl font-bold text-white truncate">
                  Taylor Products DAM
                </h1>
              </Link>
              <nav className="hidden md:flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="text-sm text-slate-300 hover:text-white transition-colors whitespace-nowrap"
                >
                  My Media
                </Link>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-sm text-slate-300 hover:text-white transition-colors whitespace-nowrap"
                  >
                    Admin
                  </Link>
                )}
              </nav>
            </div>

            {/* Right Side: Theme Toggle + Profile Menu */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <ThemeToggle />
              <ProfileMenu
                user={user}
                onChangePassword={() => setIsPasswordModalOpen(true)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {children}
      </main>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}
