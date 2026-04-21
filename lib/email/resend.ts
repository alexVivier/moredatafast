import "server-only";

import { Resend } from "resend";

import { emailT, resolveEmailLocale } from "./i18n";

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

export async function sendVerificationEmail(
  to: string,
  verifyUrl: string,
  localeOverride?: string | null,
) {
  const locale = await resolveEmailLocale(localeOverride);
  const subject = emailT(locale, "emails.verify.subject");
  const html = `<div style="${baseStyle}">
  <h2 style="margin:0 0 16px 0;">${emailT(locale, "emails.verify.title")}</h2>
  <p>${emailT(locale, "emails.verify.body")}</p>
  <p><a href="${verifyUrl}" style="${buttonStyle}">${emailT(locale, "emails.verify.cta")}</a></p>
  <p style="color:#6b7280;font-size:12px;">${emailT(locale, "emails.verify.fallbackLabel")}<br/>${verifyUrl}</p>
</div>`;
  const text = emailT(locale, "emails.verify.textBody", { url: verifyUrl });

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
  localeOverride?: string | null,
) {
  const locale = await resolveEmailLocale(localeOverride);
  const safeOrg = escapeHtml(organizationName);
  const safeInviter = escapeHtml(inviterLabel);
  const subject = emailT(locale, "emails.invite.subject", {
    org: organizationName,
  });
  const html = `<div style="${baseStyle}">
  <h2 style="margin:0 0 16px 0;">${emailT(locale, "emails.invite.title", { org: safeOrg })}</h2>
  <p>${emailT(locale, "emails.invite.body", { inviter: safeInviter })}</p>
  <p><a href="${inviteUrl}" style="${buttonStyle}">${emailT(locale, "emails.invite.cta")}</a></p>
  <p style="color:#6b7280;font-size:12px;">${emailT(locale, "emails.invite.expires")}</p>
  <p style="color:#6b7280;font-size:12px;">${emailT(locale, "emails.invite.fallbackLabel")}<br/>${inviteUrl}</p>
</div>`;
  const text = emailT(locale, "emails.invite.textBody", {
    inviter: inviterLabel,
    org: organizationName,
    url: inviteUrl,
  });

  const resend = getResend();
  if (!resend) {
    logDevFallback(subject, to, text);
    return;
  }
  await resend.emails.send({ from: getFrom(), to, subject, html, text });
}

export async function sendResetPasswordEmail(
  to: string,
  resetUrl: string,
  localeOverride?: string | null,
) {
  const locale = await resolveEmailLocale(localeOverride);
  const subject = emailT(locale, "emails.reset.subject");
  const html = `<div style="${baseStyle}">
  <h2 style="margin:0 0 16px 0;">${emailT(locale, "emails.reset.title")}</h2>
  <p>${emailT(locale, "emails.reset.body")}</p>
  <p><a href="${resetUrl}" style="${buttonStyle}">${emailT(locale, "emails.reset.cta")}</a></p>
  <p style="color:#6b7280;font-size:12px;">${emailT(locale, "emails.reset.hint")}</p>
  <p style="color:#6b7280;font-size:12px;">${emailT(locale, "emails.reset.fallbackLabel")}<br/>${resetUrl}</p>
</div>`;
  const text = emailT(locale, "emails.reset.textBody", { url: resetUrl });

  const resend = getResend();
  if (!resend) {
    logDevFallback(subject, to, text);
    return;
  }
  await resend.emails.send({ from: getFrom(), to, subject, html, text });
}
