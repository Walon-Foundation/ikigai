// Shared pieces for every outbound email.
//
// escapeHtml and sendableAddress used to be defined twice, once in the mentor
// verification action and once in the enquiries action, which is exactly the
// arrangement where one copy quietly gets a fix and the other does not. They
// live here now; the security reasoning for each is in its own comment.

const AMP = /&/g;
const LT = /</g;
const GT = />/g;
const QUOT = /"/g;
const APOS = /'/g;

/** Escape a value before it goes anywhere near an HTML email body. */
export function escapeHtml(value: string): string {
  return value
    .replace(AMP, "&amp;")
    .replace(LT, "&lt;")
    .replace(GT, "&gt;")
    .replace(QUOT, "&quot;")
    .replace(APOS, "&#39;");
}

/**
 * Nodemailer's `to` accepts a comma-separated address LIST, so a stored value
 * like "attacker@evil.com, victim@school.edu" fans one message out to
 * recipients Ikigai never intended, over Ikigai's own signed domain — a spam
 * relay driven by whatever ended up in an email column. Only a single, plainly
 * well-formed address is sendable; anything else gets no mail rather than a
 * best-effort guess at what was meant.
 */
export function sendableAddress(
  value: string | null | undefined,
): string | null {
  if (typeof value !== "string") return null;
  const address = value.trim();
  if (address.length > 254) return null;
  return /^[^\s@,;:<>"()[\]\\]+@[^\s@,;:<>"()[\]\\]+\.[a-z]{2,}$/i.test(address)
    ? address
    : null;
}

/**
 * The house email shell: forest green heading, optional golden call-to-action,
 * and a plaintext alternative built from the same inputs so the two can't drift.
 *
 * Table-free and inline-styled on purpose — this is read on cheap Android mail
 * clients over a slow connection, where a stylesheet is a second request that
 * may never arrive.
 */
export function notificationEmail(input: {
  title: string;
  body: string;
  actionLabel?: string;
  actionUrl?: string;
  footer?: string;
}): { html: string; text: string } {
  const { title, body, actionLabel, actionUrl, footer } = input;

  const button =
    actionLabel && actionUrl
      ? `<p style="margin:28px 0 0"><a href="${escapeHtml(actionUrl)}" style="background:#1A5C3A;color:#fff;text-decoration:none;padding:12px 22px;border-radius:12px;display:inline-block;font-weight:600">${escapeHtml(actionLabel)}</a></p>`
      : "";

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1c1917">
<h1 style="font-size:20px;line-height:1.3;margin:0 0 12px;color:#1A5C3A">${escapeHtml(title)}</h1>
<p style="font-size:15px;line-height:1.6;margin:0;color:#44403c">${escapeHtml(body)}</p>
${button}
<p style="margin:32px 0 0;font-size:12px;line-height:1.5;color:#78716c">${escapeHtml(footer ?? "You're receiving this because of your Ikigai account. You can change what you're notified about in Settings.")}</p>
</div>`;

  const text = [title, "", body, actionUrl ? `\n${actionUrl}` : ""]
    .join("\n")
    .trim();

  return { html, text };
}
