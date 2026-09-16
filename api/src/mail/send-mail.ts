import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../env.js';

export type MailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
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

/**
 * Send an email, or log that one was attempted when SMTP is unconfigured.
 *
 * MailService is the Nest-facing entry point and delegates here. This function
 * exists separately because ported internals (notifications/transport) call it
 * directly and are not Nest providers.
 */
export async function sendMail(opts: MailOptions) {
  const from = env.smtpFrom ?? 'Ikigai <hello@findingyourikigai.org>';
  const tx = getTransporter();
  if (!tx) {
    // Never log the body. These carry guardian invite codes, mentor
    // verification decisions and safeguarding correspondence; printing them
    // puts that in retained logs, readable by anyone with dashboard access and
    // outliving the account deletions the purge job performs. A single-use
    // invite code sitting in a log is a working credential.
    //
    // NOTE this returns a SUCCESS shape while sending nothing. That is a live
    // production bug carried over deliberately rather than changed inside a
    // port — docs/02-auth.md Phase 4 requires it to throw in production before
    // password reset ships, because "check your email" and then no email locks
    // a user out permanently.
    console.warn(`[email:dev] to=${opts.to} subject=${opts.subject}`);
    return { dev: true as const };
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
  return env.appUrl;
}
