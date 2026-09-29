"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Wordmark } from "@/components/layout/Shell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        rememberMe: rememberMe ? "true" : "false",
        redirect: false,
      });

      if (result?.error) {
        setError("That email and password don't match.");
        setIsLoading(false);
        return;
      }

      // Only follow same-site callback paths so the login page can't bounce to another site.
      const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl");
      const destination =
        callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
          ? callbackUrl
          : "/dashboard";
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[5fr_4fr] bg-white dark:bg-slate-950">
      {/* Brand panel */}
      <section className="relative bg-brand-primary text-white px-6 py-8 lg:px-14 lg:py-12 flex flex-col justify-between overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative">
          <Wordmark />
        </div>
        <div className="relative mt-10 lg:mt-0 max-w-md">
          <h1 className="text-3xl lg:text-5xl font-bold leading-[1.05]">
            Digital Asset Manager
          </h1>
          <p className="mt-4 text-blue-100 text-sm lg:text-base leading-relaxed">
            Upload your photos and videos here. Marketing uses them for the
            website and social media.
          </p>
        </div>
        <p className="relative hidden lg:block text-sm text-blue-200/80">
          Taylor Products, Inc.
        </p>
      </section>

      {/* Form */}
      <section className="flex items-center justify-center px-6 py-10 lg:px-14">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Use your Taylor Products email address.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="email"
              placeholder="you@taylorproducts.net"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              autoComplete="current-password"
            />

            <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-600 accent-brand-primary"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Keep me signed in for 30 days
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  Uncheck on a shared device. You&apos;ll be signed out after a day of inactivity instead.
                </span>
              </span>
            </label>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md" role="alert">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <Button type="submit" variant="primary" fullWidth disabled={isLoading} className="mt-2" size="lg">
              {isLoading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link
              href="/forgot-password"
              className="text-slate-500 dark:text-slate-400 hover:text-brand-primary dark:hover:text-white"
            >
              Forgot your password?
            </Link>
            <Link
              href="/register"
              className="text-brand-primary dark:text-blue-300 hover:underline font-medium"
            >
              Need an account?
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
