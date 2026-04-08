type SendArgs = {
  to: string;
  resetUrl: string;
  fullName: string;
};

export type SendPasswordResetResult =
  | { sent: true }
  | { sent: false; devFallbackUrl?: string; logMessage: string };

/**
 * Sends a password reset email via Resend when `RESEND_API_KEY` is set.
 * In development without a key, returns a one-time link you can open locally (never use in production without email).
 */
export async function sendPasswordResetEmail(args: SendArgs): Promise<SendPasswordResetResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Workflow <onboarding@resend.dev>";

  if (!apiKey) {
    const isDev = process.env.NODE_ENV === "development";
    const msg =
      "[password reset] RESEND_API_KEY is not set. Configure Resend to send reset emails in production.";
    if (isDev) {
      return {
        sent: false,
        devFallbackUrl: args.resetUrl,
        logMessage: `${msg} Dev link (use within 1 hour): ${args.resetUrl}`,
      };
    }
    return { sent: false, logMessage: msg };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: "Reset your Workflow password",
      html: `
        <p>Hi ${escapeHtml(args.fullName)},</p>
        <p>We received a request to reset your password. Use the link below (valid for one hour):</p>
        <p><a href="${escapeHtml(args.resetUrl)}">Reset password</a></p>
        <p>If you didn’t ask for this, you can ignore this email.</p>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return {
      sent: false,
      logMessage: `[password reset] Resend error ${res.status}: ${body}`,
    };
  }

  return { sent: true };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
