"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function InviteRegisterPage({
  params,
}: {
  params: { token: string };
}) {
  const router = useRouter();
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      try {
        // We don't have a separate validation endpoint, so we'll just check on submit
        // For now, just mark as loaded
        setLoading(false);
      } catch (err) {
        setError("Invalid or expired invitation");
        setLoading(false);
      }
    }

    validateToken();
  }, [params.token]);

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: params.token,
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
        setIsSubmitting(false);
        return;
      }

      // Redirect to login on success
      router.push("/login?registered=true");
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-bg via-slate-900 to-brand-primary px-4 py-8">
        <Card className="w-full max-w-md p-8" variant="elevated">
          <div className="text-center">
            <p className="text-slate-600">Validating invitation...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-bg via-slate-900 to-brand-primary px-4 py-8">
      <Card className="w-full max-w-md p-8" variant="elevated">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Accept Invitation
          </h1>
          <p className="text-slate-600">Create your account to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
            fullWidth
            autoComplete="name"
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
            fullWidth
            autoComplete="email"
            placeholder="you@taylorproducts.com"
          />

          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            required
            fullWidth
            autoComplete="new-password"
          />

          <Input
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            required
            fullWidth
            autoComplete="new-password"
          />

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isSubmitting}
            className="mt-6"
          >
            {isSubmitting ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-brand-primary-light hover:text-brand-primary font-semibold"
          >
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}
