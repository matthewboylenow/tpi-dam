import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getUserByEmail, createPasswordReset } from "@/lib/db/queries";
import { resend, isEmailConfigured } from "@/lib/email/client";
import {
  getPasswordResetEmailHtml,
  getPasswordResetEmailText,
} from "@/lib/email/templates";
import { checkRateLimit } from "@/lib/utils/rateLimit";

const ALLOWED_DOMAIN = "taylorproducts.net";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 requests per IP per 15 minutes
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { allowed } = checkRateLimit(`forgot-password:${ip}`, 5, 15 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a few minutes and try again." },
        { status: 429 }
      );
    }

    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Only allow taylorproducts.net emails
    if (!normalizedEmail.endsWith(`@${ALLOWED_DOMAIN}`)) {
      return NextResponse.json(
        { error: "Password reset is only available for @taylorproducts.net email addresses" },
        { status: 400 }
      );
    }

    // Check if user exists — but always return success to prevent email enumeration
    const user = await getUserByEmail(normalizedEmail);

    if (user) {
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await createPasswordReset(normalizedEmail, token, expiresAt);

      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const resetUrl = `${baseUrl}/reset-password/${token}`;

      if (isEmailConfigured) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || "noreply@taylorproducts.com",
          to: normalizedEmail,
          subject: "Reset Your Password - Taylor Products DAM",
          html: getPasswordResetEmailHtml({ recipientEmail: normalizedEmail, resetUrl, expiresAt }),
          text: getPasswordResetEmailText({ recipientEmail: normalizedEmail, resetUrl, expiresAt }),
        });
      }
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: "If that email exists in our system, you will receive a reset link shortly.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
