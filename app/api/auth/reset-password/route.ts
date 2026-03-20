import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  getPasswordResetByToken,
  markPasswordResetUsed,
  getUserByEmail,
  updateUserPassword,
} from "@/lib/db/queries";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const reset = await getPasswordResetByToken(token);

    if (!reset) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    if (reset.used_at) {
      return NextResponse.json(
        { error: "This reset link has already been used" },
        { status: 400 }
      );
    }

    if (new Date(reset.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This reset link has expired" },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(reset.email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await updateUserPassword(user.id, passwordHash);
    await markPasswordResetUsed(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
