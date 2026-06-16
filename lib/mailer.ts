import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });
    }
    return transporter
}

/**
 * Send a one-time passcode to the user's email.
 */
export async function sendOtpEmail(to: string, code: string, purpose: "signup" | "login") {
    const subject =
        purpose === "signup"
            ? "Verify your email - your code"
            : "Your sign-in code";

    const heading =
        purpose === "signup" ? "Confirm your email" : "Sign in to BotSaaS";

    const html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #0f172a;">
    <div style="font-size: 22px; font-weight: 700; margin-bottom: 4px;">🤖 BotSaaS</div>
    <h2 style="font-size: 20px; font-weight: 700; margin: 24px 0 8px;">${heading}</h2>
    <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 24px;">
      Use the code below to ${purpose === "signup" ? "verify your email and finish creating your account" : "sign in to your account"}.
      This code expires in 10 minutes.
    </p>
    <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
      <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2563eb; font-family: monospace;">${code}</span>
    </div>
    <p style="font-size: 12px; color: #94a3b8; line-height: 1.6;">
      If you didn't request this, you can safely ignore this email.
    </p>
  </div>`;

    const text = `Your verification code is: ${code}\n\nThis code expires in 10 minutes. If you didn't request this, you can ignore this email.`;

    await getTransporter().sendMail({
        from: `"BotSaaS" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        text,
        html,
    });
}

/**
 * Generate a 6-digit numeric OTP.
 */
export function generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}