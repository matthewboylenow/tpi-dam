type InvitationEmailParams = {
  recipientEmail: string;
  inviterName: string;
  inviteUrl: string;
  expiresAt: Date;
  role: "admin" | "sales";
};

export function getInvitationEmailHtml(params: InvitationEmailParams): string {
  const { recipientEmail, inviterName, inviteUrl, expiresAt, role } = params;
  const expiryDate = expiresAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Taylor Products DAM</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1C4E80 0%, #2F6FB2 100%); padding: 40px 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                Taylor Products DAM
              </h1>
              <p style="margin: 10px 0 0; color: #e2e8f0; font-size: 14px;">
                Digital Asset Management
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 24px; font-weight: 600;">
                You've Been Invited!
              </h2>

              <p style="margin: 0 0 16px; color: #475569; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join <strong>Taylor Products Digital Asset Management</strong> as ${role === "admin" ? "an administrator" : "a team member"}.
              </p>

              <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">
                Click the button below to create your account and get started managing digital assets.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 0 24px;">
                <tr>
                  <td style="border-radius: 6px; background: linear-gradient(135deg, #2F6FB2 0%, #1C4E80 100%);">
                    <a href="${inviteUrl}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 12px; color: #64748b; font-size: 14px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 24px; color: #3b82f6; font-size: 14px; word-break: break-all;">
                ${inviteUrl}
              </p>

              <!-- Info Box -->
              <table role="presentation" style="width: 100%; background-color: #f1f5f9; border-left: 4px solid #00A3A3; border-radius: 4px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 8px; color: #334155; font-size: 14px; font-weight: 600;">
                      Invitation Details
                    </p>
                    <p style="margin: 0 0 4px; color: #64748b; font-size: 14px;">
                      <strong>Email:</strong> ${recipientEmail}
                    </p>
                    <p style="margin: 0 0 4px; color: #64748b; font-size: 14px;">
                      <strong>Role:</strong> ${role === "admin" ? "Administrator" : "Sales Team Member"}
                    </p>
                    <p style="margin: 0; color: #64748b; font-size: 14px;">
                      <strong>Expires:</strong> ${expiryDate}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; color: #94a3b8; font-size: 13px; line-height: 1.6;">
                This invitation will expire on <strong>${expiryDate}</strong>. If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8fafc; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                © ${new Date().getFullYear()} Taylor Products. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function getInvitationEmailText(params: InvitationEmailParams): string {
  const { recipientEmail, inviterName, inviteUrl, expiresAt, role } = params;
  const expiryDate = expiresAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `
You've Been Invited to Taylor Products DAM

${inviterName} has invited you to join Taylor Products Digital Asset Management as ${role === "admin" ? "an administrator" : "a team member"}.

Accept your invitation by visiting this link:
${inviteUrl}

Invitation Details:
- Email: ${recipientEmail}
- Role: ${role === "admin" ? "Administrator" : "Sales Team Member"}
- Expires: ${expiryDate}

This invitation will expire on ${expiryDate}. If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} Taylor Products. All rights reserved.
  `.trim();
}
