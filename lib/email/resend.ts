import "server-only";

import { Resend } from "resend";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function getFrom(): string {
  return (
    process.env.RESEND_FROM_EMAIL ||
    "DataFast <onboarding@resend.dev>"
  );
}

function logDevFallback(subject: string, to: string, body: string) {
  console.log(
    `\n[email:dev] (no RESEND_API_KEY configured)\n  To: ${to}\n  Subject: ${subject}\n  ${body.replace(/\n/g, "\n  ")}\n`,
  );
}

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  line-height: 1.6;
  color: #111827;
`;

const buttonStyle = `
  display: inline-block;
  padding: 12px 20px;
  background: #111827;
  color: #ffffff !important;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
`;

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  const subject = "Verify your DataFast Dashboard email";
  const html = `<div style="${baseStyle}">
  <h2 style="margin:0 0 16px 0;">Welcome to DataFast Dashboard</h2>
  <p>Confirm your email address to finish setting up your account.</p>
  <p><a href="${verifyUrl}" style="${buttonStyle}">Verify email</a></p>
  <p style="color:#6b7280;font-size:12px;">Or paste this link into your browser:<br/>${verifyUrl}</p>
</div>`;
  const text = `Welcome to DataFast Dashboard.\n\nVerify your email: ${verifyUrl}`;

  const resend = getResend();
  if (!resend) {
    logDevFallback(subject, to, text);
    return;
  }
  await resend.emails.send({ from: getFrom(), to, subject, html, text });
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendInvitationEmail(
  to: string,
  inviteUrl: string,
  organizationName: string,
  inviterLabel: string,
) {
  const safeOrg = escapeHtml(organizationName);
  const safeInviter = escapeHtml(inviterLabel);
  const subject = `Join ${organizationName} on DataFast`;
  const html = `<div style="${baseStyle}">
  <h2 style="margin:0 0 16px 0;">You've been invited to join ${safeOrg}</h2>
  <p>${safeInviter} invited you to collaborate on their DataFast dashboard.</p>
  <p><a href="${inviteUrl}" style="${buttonStyle}">Accept invitation</a></p>
  <p style="color:#6b7280;font-size:12px;">Expires in 48 hours. If you weren't expecting this, you can ignore it safely.</p>
  <p style="color:#6b7280;font-size:12px;">Or paste this link into your browser:<br/>${inviteUrl}</p>
</div>`;
  const text = `${inviterLabel} invited you to join ${organizationName} on DataFast.\n\nAccept: ${inviteUrl}\n\nExpires in 48 hours.`;

  const resend = getResend();
  if (!resend) {
    logDevFallback(subject, to, text);
    return;
  }
  await resend.emails.send({ from: getFrom(), to, subject, html, text });
}

export async function sendResetPasswordEmail(to: string, resetUrl: string) {
  const subject = "Reset your DataFast Dashboard password";
  const html = `<div style="${baseStyle}">
  <h2 style="margin:0 0 16px 0;">Password reset</h2>
  <p>Someone (hopefully you) requested to reset the password for your account.</p>
  <p><a href="${resetUrl}" style="${buttonStyle}">Reset password</a></p>
  <p style="color:#6b7280;font-size:12px;">If you didn't request this, you can ignore the message. The link expires in 1 hour.</p>
  <p style="color:#6b7280;font-size:12px;">Or paste this link into your browser:<br/>${resetUrl}</p>
</div>`;
  const text = `Reset your DataFast Dashboard password: ${resetUrl}\n\nIf you didn't request this, ignore this email.`;

  const resend = getResend();
  if (!resend) {
    logDevFallback(subject, to, text);
    return;
  }
  await resend.emails.send({ from: getFrom(), to, subject, html, text });
}
