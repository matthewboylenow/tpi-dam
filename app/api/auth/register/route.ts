import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  createUser,
  getUserByEmail,
  getInvitationByToken,
  markInvitationUsed,
  getAllUsers,
} from "@/lib/db/queries";
import { acceptInvitationSchema } from "@/lib/validation/invitationSchemas";
import { resend, isEmailConfigured } from "@/lib/email/client";
import { getWelcomeEmailHtml, getWelcomeEmailText } from "@/lib/email/templates";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validation = acceptInvitationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { token, name, email, password } = validation.data;

    // Validate invitation token (REQUIRED)
    const invitation = await getInvitationByToken(token);
    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 403 }
      );
    }

    // Check if invitation is expired
    if (invitation.expires_at < new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 403 }
      );
    }

    // Check if invitation has already been used
    if (invitation.used_at) {
      return NextResponse.json(
        { error: "Invitation has already been used" },
        { status: 403 }
      );
    }

    // Verify email matches invitation
    if (invitation.email !== email) {
      return NextResponse.json(
        { error: "Email does not match invitation" },
        { status: 403 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with role from invitation
    const user = await createUser({
      email,
      name,
      password: passwordHash,
      role: invitation.role,
    });

    // Mark invitation as used
    await markInvitationUsed(token);

    // Send welcome email to new user (non-blocking)
    if (isEmailConfigured) {
      resend.emails.send({
        from: process.env.EMAIL_FROM || "noreply@taylorproducts.com",
        to: email,
        subject: "Welcome to Taylor Products DAM",
        html: getWelcomeEmailHtml({ recipientName: name, recipientEmail: email, role: invitation.role }),
        text: getWelcomeEmailText({ recipientName: name, recipientEmail: email, role: invitation.role }),
      }).catch(err => console.error("Failed to send welcome email:", err));

      // Notify all admins
      getAllUsers().then(users => {
        const admins = users.filter(u => u.role === "admin" && u.email !== email);
        return Promise.all(admins.map(admin =>
          resend.emails.send({
            from: process.env.EMAIL_FROM || "noreply@taylorproducts.com",
            to: admin.email,
            subject: `New user registered: ${name}`,
            html: `<p>A new user has just registered on Taylor Products DAM.</p><p><strong>Name:</strong> ${name}<br><strong>Email:</strong> ${email}<br><strong>Role:</strong> ${invitation.role}</p>`,
            text: `New user registered on Taylor Products DAM.\n\nName: ${name}\nEmail: ${email}\nRole: ${invitation.role}`,
          }).catch(err => console.error("Failed to notify admin:", err))
        ));
      }).catch(err => console.error("Failed to fetch admins for notification:", err));
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
