import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-bg via-slate-900 to-brand-primary px-4">
      <Card className="w-full max-w-md p-8" variant="elevated">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-brand-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-brand-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Registration is Invite-Only
          </h1>
          <p className="text-slate-600">
            Taylor Products DAM uses invitation-based registration to ensure
            security and proper access control.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-slate-900 mb-2">
            Need an account?
          </h2>
          <p className="text-sm text-slate-600">
            Please contact your administrator to receive an invitation link via
            email. The invitation will include all the information you need to
            create your account.
          </p>
        </div>

        <Link href="/login">
          <Button variant="primary" fullWidth>
            Go to Login
          </Button>
        </Link>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Already have an invitation link? Use the link from your email to
            register.
          </p>
        </div>
      </Card>
    </div>
  );
}
