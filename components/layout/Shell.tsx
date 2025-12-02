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

            {/* Right Side: Theme Toggle + Profile Menu */}
            <div className="flex items-center gap-2">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
