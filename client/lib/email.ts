import "server-only";
import nodemailer from "nodemailer";
import { env } from "@/lib/env";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort ?? 587,
    secure: env.smtpSecure ?? false,
    auth: { user: env.smtpUser, pass: env.smtpPass },
  });
  return transporter;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const from = env.smtpFrom ?? "Ikigai <hello@findingyourikigai.org>";
  const tx = getTransporter();
  if (!tx) {
    // No SMTP configured — and the SMTP vars are optional (lib/env.ts), so this
    // branch is not just a local-dev convenience: it is what runs on any deploy
    // where they were never set. Log that an email was attempted and to whom,
    // never the body. These bodies carry guardian invite codes, mentor
    // verification decisions and safeguarding correspondence; printing them puts
    // that in retained platform logs, readable by anyone with dashboard access
    // and outliving the account deletions in lib/purge.ts. A single-use invite
    // code sitting in a log is a working credential.
    console.log(`[email:dev] to=${opts.to} subject=${opts.subject}`);
    return { dev: true };
  }
  return tx.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
}

export function pwaInstallUrl(): string {
  // App URL derived from NEXT_PUBLIC_APP_HOSTNAME (see lib/env.client.ts)
  return env.appUrl;
}
