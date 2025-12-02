"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { InvitationWithInviter } from "@/types/invitation";

type Props = {
  invitations: InvitationWithInviter[];
  onUpdate: () => void;
};

export function InvitationList({ invitations, onUpdate }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCopyLink(invitation: InvitationWithInviter) {
    const baseUrl = window.location.origin;
    const inviteUrl = `${baseUrl}/register/${invitation.token}`;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedId(invitation.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm("Are you sure you want to revoke this invitation?")) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`/api/invitations/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (err) {
      console.error("Failed to revoke invitation:", err);
    } finally {
      setDeletingId(null);
    }
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No active invitations</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
              Email
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
              Role
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
              Invited By
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
              Expires
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {invitations.map((invitation) => {
            const expiryDate = new Date(invitation.expires_at);
            const isExpiringSoon =
              expiryDate.getTime() - Date.now() < 24 * 60 * 60 * 1000;

            return (
              <tr key={invitation.id} className="border-b border-slate-100">
                <td className="py-3 px-4 text-sm text-slate-900">
                  {invitation.email}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                      invitation.role === "admin"
                        ? "bg-brand-primary/10 text-brand-primary"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {invitation.role === "admin" ? "Admin" : "Sales"}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-slate-600">
                  {invitation.inviter_name || invitation.inviter_email}
                </td>
                <td className="py-3 px-4 text-sm">
                  <span
                    className={
                      isExpiringSoon ? "text-orange-600" : "text-slate-600"
                    }
                  >
                    {expiryDate.toLocaleDateString()}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleCopyLink(invitation)}
                      className="text-sm text-brand-primary hover:text-brand-primary-light font-medium"
                    >
                      {copiedId === invitation.id ? "Copied!" : "Copy Link"}
                    </button>
                    <button
                      onClick={() => handleRevoke(invitation.id)}
                      disabled={deletingId === invitation.id}
                      className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                    >
                      {deletingId === invitation.id ? "Revoking..." : "Revoke"}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
