import { Resend } from "resend";

// Initialize Resend with API key if available
// If not available, invitations will fail at runtime but build will succeed
export const resend = new Resend(
  process.env.RESEND_API_KEY || "dummy_key_for_build"
);

export const isEmailConfigured = !!process.env.RESEND_API_KEY;
