"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { SessionUser } from "@/lib/auth/getCurrentUser";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ProfileMenu } from "@/components/ui/ProfileMenu";
import { ChangePasswordModal } from "@/components/ui/ChangePasswordModal";
import { SessionTimeoutWarner } from "@/components/ui/SessionTimeoutWarner";

type Props = {
  user: SessionUser;
  children: React.ReactNode;
};

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex items-baseline gap-2", className)}>
      <span className="font-display font-bold text-lg tracking-tight leading-none">Taylor Products</span>
      <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] leading-none opacity-70">
        Media
      </span>
    </span>
  );
}

export function Shell({ user, children }: Props) {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Library" },
    ...(user.role === "admin" ? [{ href: "/admin", label: "Marketing" }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6 min-w-0">
              <Link href="/dashboard" className="min-w-0 text-slate-900 dark:text-white">
                <Wordmark />
              </Link>
              <nav className="flex items-center gap-1">
                {links.map((link) => {
                  const active = pathname === link.href || pathname.startsWith(link.href + "/");
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={clsx(
                        "px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors",
                        active
                          ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
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

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      <SessionTimeoutWarner />
    </div>
  );
}
