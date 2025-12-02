import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import {
  createInvitation,
  getActiveInvitations,
} from "@/lib/db/queries";
import { createInvitationSchema } from "@/lib/validation/invitationSchemas";
import { resend } from "@/lib/email/client";
import {
  getInvitationEmailHtml,
  getInvitationEmailText,
} from "@/lib/email/templates";
import { randomUUID } from "crypto";

/**
 * POST /api/invitations
 * Create a new invitation (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = createInvitationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, role } = validation.data;

    // Generate unique token
    const token = randomUUID();

    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation in database
    const invitation = await createInvitation({
      email,
      token,
      role,
      invited_by: user.id,
      expires_at: expiresAt,
    });

    // Build invitation URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/register/${token}`;

    // Send invitation email
    try {
      const emailFrom = process.env.EMAIL_FROM || "noreply@taylorproducts.com";

      await resend.emails.send({
        from: emailFrom,
        to: email,
        subject: "You're invited to Taylor Products DAM",
        html: getInvitationEmailHtml({
          recipientEmail: email,
          inviterName: user.name || user.email,
          inviteUrl,
          expiresAt,
          role,
        }),
        text: getInvitationEmailText({
          recipientEmail: email,
          inviterName: user.name || user.email,
          inviteUrl,
          expiresAt,
          role,
        }),
      });
    } catch (emailError: any) {
      console.error("Failed to send invitation email:", emailError);
      // Don't fail the whole request if email fails
      // The invitation is still created and admin can copy the link
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expires_at: invitation.expires_at,
        invite_url: inviteUrl,
      },
    });
  } catch (error: any) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invitations
 * List active invitations (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const invitations = await getActiveInvitations();

    return NextResponse.json({ invitations });
  } catch (error: any) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}
