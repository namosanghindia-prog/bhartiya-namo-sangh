import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import QRCode from "qrcode";
import { renderToBuffer } from "@react-pdf/renderer";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/send";
import { eventInvitationEmail } from "@/lib/email/templates";
import {
  EventInvitationLetter,
  type InvitationOrgContact,
} from "@/lib/event-invitation-pdf";
import {
  EVENT,
  EVENT_SLUG,
  formatRegistrationNumber,
  registrationVerificationUrl,
} from "@/lib/namo-sewa-samman";

/**
 * Public registration for नमो सेवा सम्मान - 2026: stores the registration,
 * renders the invitation letter PDF and emails it.
 *
 * Unauthenticated by design, and handled here rather than as a browser insert
 * because public_event_registrations is admin-only under RLS: a browser insert
 * would skip this validation and the honeypot, could never learn the
 * registration number the sequence gave it, and could not set invitation_sent
 * afterwards. The service role does all three, and only ever hands back the
 * caller's own number.
 *
 * Registration is the part that must not fail. Once the row is in, nothing
 * that happens afterwards — PDF, mail, the invitation_sent flag, even a bug —
 * can turn the response into an error: the number always goes back, with
 * invitationSent false, and the admin list shows who is still waiting for
 * their letter.
 *
 * Every failure before the row is in says so explicitly, tells the person
 * nothing was saved, and carries a short reference (DB-UNAVAILABLE, DB-23514,
 * …) so a screenshot of the message is enough to know what went wrong. The
 * old catch-all "Registration failed, please try again" covered a Supabase
 * outage, a rejected row and a crash alike, and a report of it meant digging
 * through function logs to find out which.
 *
 * Re-submitting the same mobile + email returns the existing registration
 * instead of a second number, and only re-sends the letter if the first one
 * never went out — so the form cannot be used to mail-bomb an address. The
 * database enforces the same rule with a unique index, so two submissions
 * racing each other cannot both get a number either.
 */

const MAX_LENGTHS = {
  fullName: 120,
  guardianName: 120,
  email: 254,
  address: 500,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COLUMNS = "id, registration_number, full_name, guardian_name, invitation_sent";

interface RegistrationRow {
  id: string;
  registration_number: number;
  full_name: string;
  guardian_name: string;
  invitation_sent: boolean;
}

/**
 * What supabase-js hands back. PostgREST errors have all four fields; a
 * response from the gateway in front of it (Kong, Cloudflare) can be anything,
 * including a whole HTML page in `message` and no code at all.
 */
interface DbError {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
  status?: number | string | null;
}

const UNIQUE_VIOLATION = "23505";
const CHECK_VIOLATION = "23514";

/** Signs that the request never reached Postgres at all. */
const UNREACHABLE_PATTERNS = [
  /<!doctype html/i,
  /cloudflare/i,
  /ssl handshake/i,
  /api key info/i,
  /fetch failed/i,
  /econnreset|econnrefused|etimedout|enotfound/i,
  /socket hang up/i,
  /gateway/i,
];

function isUnreachable(error: DbError): boolean {
  if (error.code && error.code !== "") return false;
  const status = Number(error.status);
  if (status >= 500 && status <= 599) return true;
  const text = `${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`;
  return UNREACHABLE_PATTERNS.some((p) => p.test(text));
}

interface Failure {
  status: number;
  error: string;
  ref: string;
}

/** Turns a database error into the answer the person filling the form gets. */
function describeDbFailure(error: DbError): Failure {
  if (isUnreachable(error)) {
    return {
      status: 503,
      ref: "DB-UNAVAILABLE",
      error:
        "डेटाबेस से अभी संपर्क नहीं हो पा रहा है, इसलिए आपका पंजीकरण सुरक्षित नहीं हुआ। कृपया कुछ मिनट बाद पुनः प्रयास करें। / " +
        "Our database is temporarily unreachable, so your registration was not saved. Please try again in a few minutes. (ref: DB-UNAVAILABLE)",
    };
  }

  if (error.code === CHECK_VIOLATION || error.code?.startsWith("22")) {
    const ref = `DB-${error.code}`;
    return {
      status: 400,
      ref,
      error:
        "भरी गई किसी जानकारी का प्रारूप स्वीकार्य नहीं है। कृपया सभी फ़ील्ड जाँचकर पुनः प्रयास करें। / " +
        `One of the details is not in an acceptable format. Please check every field and try again. (ref: ${ref})`,
    };
  }

  const ref = error.code ? `DB-${error.code}` : "DB-UNKNOWN";
  return {
    status: 500,
    ref,
    error:
      "पंजीकरण सुरक्षित नहीं हो सका और कुछ भी सहेजा नहीं गया। कृपया पुनः प्रयास करें; समस्या बनी रहे तो हमें यह कोड बताएँ: " +
      `${ref} / Your registration could not be saved and nothing was stored. Please try again, and if it keeps failing, contact us quoting: ${ref}`,
  };
}

/** Everything about the error that helps, without an HTML page per line. */
function logDbError(stage: string, error: DbError) {
  const message = (error.message ?? "").replace(/\s+/g, " ").slice(0, 300);
  console.error(
    `[event-register] ${stage} failed:`,
    JSON.stringify({
      code: error.code ?? null,
      status: error.status ?? null,
      message,
      details: error.details ?? null,
      hint: error.hint ?? null,
    })
  );
}

function field(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

/** "+91 98765-43210" → "9876543210"; null unless it is an Indian mobile number. */
function normaliseMobile(raw: string): string | null {
  const digits = raw.replace(/[\s\-()]/g, "").replace(/^(\+91|0091|91(?=\d{10}$)|0(?=\d{10}$))/, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

async function publicFileDataUrl(name: string, mime: string): Promise<string | null> {
  try {
    const buf = await fs.readFile(path.join(process.cwd(), "public", name));
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch (err) {
    console.error(`[event-register] Could not read public/${name}:`, err);
    return null;
  }
}

async function orgContact(supabase: SupabaseClient): Promise<InvitationOrgContact> {
  const { data, error } = await supabase
    .from("organization_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    console.error("[event-register] Could not read organization_settings:", error);
    return { phones: [], email: null, website: null, address: null };
  }

  const offices = ((data.offices ?? []) as { label?: string; address?: string }[]).filter(
    (o) => o && o.address
  );
  const headOffice = offices.find((o) => /head/i.test(o.label ?? "")) ?? offices[0];
  const postal = [data.address_line, data.city, data.state, data.pincode].filter(Boolean).join(", ");

  return {
    phones: [data.phone_primary, data.phone_secondary, data.phone_tertiary].filter(
      Boolean
    ) as string[],
    email: data.primary_email ?? null,
    website: data.website_url
      ? String(data.website_url).replace(/^https?:\/\//i, "").replace(/\/$/, "")
      : null,
    address: headOffice?.address ?? (postal || null),
  };
}

type InvitationResult = { sent: true } | { sent: false; reason: string };

/** Renders and emails the letter; sent only if Resend accepted it. Never throws. */
async function sendInvitation(
  supabase: SupabaseClient,
  row: RegistrationRow,
  email: string
): Promise<InvitationResult> {
  const registrationNumber = formatRegistrationNumber(row.registration_number);
  const verificationUrl = registrationVerificationUrl(row.id);

  let pdf: Buffer;
  try {
    const [qrDataUrl, logoDataUrl, signatureDataUrl, org] = await Promise.all([
      // Same generator and colours as the ID card / appointment letter QR.
      QRCode.toDataURL(verificationUrl, {
        width: 264,
        margin: 1,
        color: { dark: "#0a1929", light: "#ffffff" },
      }),
      publicFileDataUrl("logo.png", "image/png"),
      publicFileDataUrl("signature-president.png", "image/png"),
      orgContact(supabase),
    ]);

    pdf = await renderToBuffer(
      EventInvitationLetter({
        data: {
          eventName: EVENT.nameHi,
          tagline: EVENT.taglineHi,
          dateHi: EVENT.dateHi,
          dateEn: EVENT.dateEn,
          timeHi: EVENT.timeHi,
          timeEn: EVENT.timeEn,
          venue: EVENT.venue,
          fullName: row.full_name,
          guardianName: row.guardian_name,
          registrationNumber,
          issuedOn: new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            timeZone: "Asia/Kolkata",
          }),
          qrDataUrl,
          logoDataUrl,
          signatureDataUrl,
          org,
        },
      })
    );
  } catch (err) {
    console.error("[event-register] Could not render the invitation PDF:", err);
    return { sent: false, reason: `PDF: ${err instanceof Error ? err.message : String(err)}` };
  }

  const content = eventInvitationEmail({
    fullName: row.full_name,
    registrationNumber,
    eventName: EVENT.nameHi,
    tagline: EVENT.taglineHi,
    date: EVENT.dateHi,
    time: EVENT.timeHi,
    venue: EVENT.venue,
    verificationUrl,
  });

  let mail: Awaited<ReturnType<typeof sendEmail>>;
  try {
    mail = await sendEmail({
      to: email,
      subject: content.subject,
      html: content.html,
      text: content.text,
      attachments: [
        {
          filename: `invitation-${registrationNumber.replace(/\//g, "-")}.pdf`,
          content: pdf,
        },
      ],
    });
  } catch (err) {
    console.error("[event-register] Sending the invitation threw:", err);
    return { sent: false, reason: `Mail: ${err instanceof Error ? err.message : String(err)}` };
  }

  if (!mail.sent) return { sent: false, reason: `Mail: ${mail.reason}` };

  // The letter is out either way; a failure here only mis-reports it in the
  // admin list. (Every update on this table failed with `record "new" has no
  // field "updated_at"` until migration 024 added the column the trigger sets.)
  const { error } = await supabase
    .from("public_event_registrations")
    .update({ invitation_sent: true })
    .eq("id", row.id);

  if (error) {
    logDbError("Marking invitation_sent", error);
  }
  return { sent: true };
}

async function findExisting(
  supabase: SupabaseClient,
  mobile: string,
  email: string
): Promise<{ row: RegistrationRow | null; error: DbError | null }> {
  const { data, error } = await supabase
    .from("public_event_registrations")
    .select(COLUMNS)
    .eq("event_slug", EVENT_SLUG)
    .eq("mobile", mobile)
    .eq("email", email)
    .order("registration_number", { ascending: true })
    .limit(1)
    .maybeSingle<RegistrationRow>();

  return { row: data ?? null, error };
}

async function respondWithRegistration(
  supabase: SupabaseClient,
  row: RegistrationRow,
  email: string,
  alreadyRegistered: boolean
) {
  const registrationNumber = formatRegistrationNumber(row.registration_number);

  // Nothing past this point may fail the request: the row is in.
  let invitation: InvitationResult;
  if (row.invitation_sent) {
    invitation = { sent: true };
  } else {
    try {
      invitation = await sendInvitation(supabase, row, email);
    } catch (err) {
      console.error("[event-register] sendInvitation threw:", err);
      invitation = { sent: false, reason: err instanceof Error ? err.message : String(err) };
    }
  }

  console.log(
    `[event-register] ${registrationNumber} ${alreadyRegistered ? "already registered" : "registered"}; invitation ${
      invitation.sent ? "sent" : `NOT sent (${invitation.reason})`
    }`
  );

  return NextResponse.json({
    registrationNumber,
    invitationSent: invitation.sent,
    alreadyRegistered,
  });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Honeypot field, invisible on the form. Distinct wording, so a person whose
  // browser autofilled the hidden field can be told apart from every other
  // failure when they send a screenshot.
  if (field(body, "website")) {
    return NextResponse.json(
      { error: "Registration could not be submitted. Please reload the page and fill the form again. (ref: FORM-CHECK)" },
      { status: 400 }
    );
  }

  const fullName = field(body, "fullName");
  const guardianName = field(body, "guardianName");
  const email = field(body, "email").toLowerCase();
  const address = field(body, "address");
  const mobile = normaliseMobile(field(body, "mobile"));

  if (!fullName || !guardianName || !email || !address || !field(body, "mobile")) {
    return NextResponse.json(
      { error: "सभी फ़ील्ड आवश्यक हैं। / All fields are required." },
      { status: 400 }
    );
  }
  if (!mobile) {
    return NextResponse.json(
      { error: "कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें। / Please enter a valid 10-digit mobile number." },
      { status: 400 }
    );
  }
  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { error: "कृपया वैध ईमेल पता दर्ज करें। / Please enter a valid email address." },
      { status: 400 }
    );
  }
  if (
    fullName.length > MAX_LENGTHS.fullName ||
    guardianName.length > MAX_LENGTHS.guardianName ||
    email.length > MAX_LENGTHS.email ||
    address.length > MAX_LENGTHS.address
  ) {
    return NextResponse.json({ error: "One of the fields is too long." }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Server configuration error: the database is not configured. Nothing was saved. (ref: CONFIG)" },
      { status: 500 }
    );
  }

  // Only the part before the row exists lives in this try: its catch promises
  // the person that nothing was saved, which must stay true.
  let saved: RegistrationRow;
  let alreadyRegistered: boolean;
  try {
    const existing = await findExisting(supabase, mobile, email);
    if (existing.error) {
      // Carry on to the insert: if the database is down the insert reports it
      // properly, and if it is up the unique index still stops a duplicate.
      logDbError("Duplicate lookup", existing.error);
    }

    if (existing.row) {
      saved = existing.row;
      alreadyRegistered = true;
    } else {
      // event_slug and registration_number come from the column defaults.
      const { data: row, error: insertError } = await supabase
        .from("public_event_registrations")
        .insert({
          full_name: fullName,
          guardian_name: guardianName,
          mobile,
          email,
          address,
        })
        .select(COLUMNS)
        .single<RegistrationRow>();

      if (row) {
        saved = row;
        alreadyRegistered = false;
      } else {
        const error: DbError = insertError ?? { message: "Insert returned no row" };

        if (error.code === UNIQUE_VIOLATION) {
          // Lost a race with an identical submission (a double-click, two tabs).
          const again = await findExisting(supabase, mobile, email);
          if (!again.row) {
            logDbError("Lookup after unique violation", again.error ?? { message: "no row" });
            return NextResponse.json(
              {
                error:
                  "इस मोबाइल नंबर और ईमेल से पंजीकरण पहले ही हो चुका है। / A registration with this mobile number and email already exists. (ref: DUPLICATE)",
                ref: "DUPLICATE",
              },
              { status: 409 }
            );
          }
          saved = again.row;
          alreadyRegistered = true;
        } else {
          logDbError("Insert", error);
          const failure = describeDbFailure(error);
          return NextResponse.json(
            { error: failure.error, ref: failure.ref },
            { status: failure.status }
          );
        }
      }
    }
  } catch (err) {
    // supabase-js reports network failures as errors rather than throwing, so
    // this is for genuine bugs. The person still learns nothing was saved.
    console.error("[event-register] Unhandled error before the row was saved:", err);
    return NextResponse.json(
      {
        error:
          "पंजीकरण के दौरान एक अप्रत्याशित त्रुटि हुई और कुछ भी सहेजा नहीं गया। कृपया पुनः प्रयास करें। / " +
          "An unexpected error occurred during registration and nothing was saved. Please try again. (ref: UNEXPECTED)",
        ref: "UNEXPECTED",
      },
      { status: 500 }
    );
  }

  return respondWithRegistration(supabase, saved, email, alreadyRegistered);
}
