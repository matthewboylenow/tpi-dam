"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Props = {
  onSuccess: () => void;
};

export function InvitationForm({ onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "sales">("sales");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send invitation");
        setIsLoading(false);
        return;
      }

      setSuccess(
        `Invitation sent to ${email}! They will receive an email with a registration link.`
      );
      setEmail("");
      setRole("sales");
      setIsLoading(false);
      onSuccess();
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@taylorproducts.com"
          required
          fullWidth
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "sales")}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          >
            <option value="sales">Sales Team Member</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        disabled={isLoading}
        className="w-full md:w-auto"
      >
        {isLoading ? "Sending..." : "Send Invitation"}
      </Button>
    </form>
  );
}
