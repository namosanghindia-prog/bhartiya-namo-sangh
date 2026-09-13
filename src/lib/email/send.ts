import "server-only";
import { Resend } from "resend";

/**
 * Transactional email, sent through Resend.
 *
 * Two separate things send mail for this site and they are easy to confuse:
 *
 *  - Supabase sends the *auth* mail (password reset, email change). That goes
 *    through Resend's SMTP endpoint, configured in the Supabase dashboard, and
 *    never touches this file.
 *  - Everything the organisation itself says to a member — approved, activated,
 *    receipt — goes through here, on the Resend API.
 *
 * With RESEND_API_KEY unset, every send is skipped with a log line instead of
 * throwing. Nothing in this app should fail because an email did not go out: an
 * admin approving a member must not see an error because the mail provider is
 * down, and local development must not need a key at all.
 */

export interface EmailAttachment {
  filename: string;
  content: Buffer;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
}

export type SendResult =
  | { sent: true; id: string | null }
  | { sent: false; reason: string };

/**
 * Sender address. Must be on a domain verified in Resend — bare
 * onboarding@resend.dev only delivers to the Resend account's own address, so
 * it is useless for real members.
 */
const DEFAULT_FROM = "Bhartiya Namo Sangh <noreply@bhartiyanamosangh.com>";

/** `local@domain`, or `Display Name <local@domain>`. What Resend will accept. */
const FROM_PATTERN =
  /^(?:[^<>]*<\s*[^\s@<>]+@[^\s@<>]+\s*>|[^\s@<>]+@[^\s@<>]+)$/;

function fromAddress(): string {
  const raw = process.env.EMAIL_FROM?.trim();
  if (!raw) return DEFAULT_FROM;

  // Env files strip the quotes around a value; a dashboard field keeps them, so
  // a value copied out of .env.example arrives as `"Name <a@b>"` and Resend
  // rejects the whole address with "Invalid `from` field".
  const unquoted = raw.replace(/^(["'])([\s\S]*)\1$/, "$2").trim();

  if (!FROM_PATTERN.test(unquoted)) {
    // Falling back rather than failing: a misconfigured sender should not stop
    // a member hearing that their membership was approved.
    console.error(
      `[email] EMAIL_FROM is not a usable address (${JSON.stringify(
        unquoted
      )}); falling back to ${DEFAULT_FROM}`
    );
    return DEFAULT_FROM;
  }

  return unquoted;
}

export async function sendEmail(options: SendEmailOptions): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn(
      `[email] RESEND_API_KEY is not set — skipped "${options.subject}" to ${options.to}`
    );
    return { sent: false, reason: "RESEND_API_KEY is not configured" };
  }

  if (!options.to.trim()) {
    return { sent: false, reason: "No recipient address" };
  }

  try {
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: fromAddress(),
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content.toString("base64"),
      })),
    });

    if (error) {
      console.error(`[email] Resend refused "${options.subject}":`, error);
      return { sent: false, reason: error.message ?? "Resend rejected the message" };
    }

    return { sent: true, id: data?.id ?? null };
  } catch (err) {
    // Network failure, bad key, quota — never the caller's problem.
    console.error(`[email] Could not send "${options.subject}":`, err);
    return { sent: false, reason: err instanceof Error ? err.message : "Unknown error" };
  }
}
