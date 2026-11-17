import "server-only";

import nodemailer from "nodemailer";

type MailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendMail(input: MailInput): Promise<void> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.MAIL_FROM ?? "SI-PKL <no-reply@si-pkl.local>";

  if (!host) {
    // Fallback aman untuk deployment tanpa SMTP: tautan tercatat di log container.
    console.info("[mail:fallback] %s -> %s\n%s", from, input.to, input.text);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: user ? { user, pass } : undefined,
    tls: { rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== "false" },
  });

  await transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}
