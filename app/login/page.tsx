"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

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
        setError("Invalid email or password");
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
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-bg via-slate-900 to-brand-primary px-4">
      <Card className="w-full max-w-md p-8" variant="elevated">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-slate-600 dark:text-slate-300">Sign in to Taylor Products DAM</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-brand-primary focus:ring-brand-primary-light accent-brand-primary"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Keep me signed in for 30 days
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Uncheck on a shared device. You&apos;ll be signed out after a day of inactivity instead.
              </span>
            </span>
          </label>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isLoading}
            className="mt-6"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Link
            href="/forgot-password"
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-brand-primary dark:hover:text-brand-accent"
          >
            Forgot your password?
          </Link>
        </div>

        <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
          Need an account?{" "}
          <Link
            href="/register"
            className="text-brand-primary-light hover:text-brand-primary dark:text-brand-accent dark:hover:text-teal-400 font-semibold"
          >
            Register here
          </Link>
        </div>
      </Card>
    </div>
  );
}
