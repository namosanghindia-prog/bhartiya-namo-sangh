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
 * Registration is the part that must not fail. A PDF or mail failure still
 * returns the number, with invitationSent false, and the admin list shows who
 * is still waiting for their letter.
 *
 * Re-submitting the same mobile + email returns the existing registration
 * instead of a second number, and only re-sends the letter if the first one
 * never went out — so the form cannot be used to mail-bomb an address.
 */

const MAX_LENGTHS = {
  fullName: 120,
  guardianName: 120,
  email: 254,
  address: 500,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RegistrationRow {
  id: string;
  registration_number: number;
  full_name: string;
  guardian_name: string;
  invitation_sent: boolean;
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

/** Renders and emails the letter; true only if Resend accepted it. */
async function sendInvitation(
  supabase: SupabaseClient,
  row: RegistrationRow,
  email: string
): Promise<boolean> {
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
    return false;
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

  const mail = await sendEmail({
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

  if (!mail.sent) return false;

  const { error } = await supabase
    .from("public_event_registrations")
    .update({ invitation_sent: true })
    .eq("id", row.id);

  if (error) {
    console.error("[event-register] Sent, but could not set invitation_sent:", error);
  }
  return true;
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Honeypot field, invisible on the form.
  if (field(body, "website")) {
    return NextResponse.json({ error: "Registration failed" }, { status: 400 });
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
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const columns = "id, registration_number, full_name, guardian_name, invitation_sent";

  const { data: existing, error: lookupError } = await supabase
    .from("public_event_registrations")
    .select(columns)
    .eq("event_slug", EVENT_SLUG)
    .eq("mobile", mobile)
    .eq("email", email)
    .order("registration_number", { ascending: true })
    .limit(1)
    .maybeSingle<RegistrationRow>();

  if (lookupError) {
    console.error("[event-register] Duplicate lookup failed:", lookupError);
  }

  if (existing) {
    const invitationSent =
      existing.invitation_sent || (await sendInvitation(supabase, existing, email));
    return NextResponse.json({
      registrationNumber: formatRegistrationNumber(existing.registration_number),
      invitationSent,
      alreadyRegistered: true,
    });
  }

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
    .select(columns)
    .single<RegistrationRow>();

  if (insertError || !row) {
    console.error("[event-register] Insert failed:", insertError);
    return NextResponse.json(
      { error: "पंजीकरण नहीं हो सका, कृपया पुनः प्रयास करें। / Registration failed, please try again." },
      { status: 500 }
    );
  }

  const invitationSent = await sendInvitation(supabase, row, email);

  return NextResponse.json({
    registrationNumber: formatRegistrationNumber(row.registration_number),
    invitationSent,
    alreadyRegistered: false,
  });
}
