import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { idCardEmail, appointmentLetterEmail } from "@/lib/email/templates";

/**
 * Emails a member their ID card or appointment letter, as a PDF attachment.
 *
 * The PDF arrives already rendered, from the admin's browser. Both documents
 * are drawn by React components and rasterised with html-to-image before being
 * wrapped in a PDF at exact ID-1 / A4 dimensions — none of which can run on the
 * server, and re-implementing either design here would leave two renderings of
 * the same card to keep in step. So the admin uploads what they are looking at,
 * and this route's job is to decide who may send it and to whom.
 *
 * The recipient is never taken from the request: it is read from the member row.
 * An admin uploading a file cannot redirect it to an arbitrary address.
 */

const KINDS = ["id_card", "appointment_letter"] as const;
type Kind = (typeof KINDS)[number];

const MAX_PDF_BYTES = 10 * 1024 * 1024;

function isKind(value: unknown): value is Kind {
  return typeof value === "string" && (KINDS as readonly string[]).includes(value);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: caller } = await supabase
    .from("members")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!caller || !["admin", "super_admin", "branch_admin"].includes(caller.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const memberId = form.get("memberId");
  const kind = form.get("kind");
  const file = form.get("file");

  if (typeof memberId !== "string" || !memberId || !isKind(kind)) {
    return NextResponse.json(
      { error: "memberId and a valid kind are required" },
      { status: 400 }
    );
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No document attached" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "The document must be a PDF" }, { status: 400 });
  }

  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json(
      { error: "The document is too large to email" },
      { status: 413 }
    );
  }

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("first_name, last_name, email, membership_number, designation")
    .eq("id", memberId)
    .single();

  if (memberError || !member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (!member.email) {
    return NextResponse.json({
      sent: false,
      reason: "This member has no email address on file",
    });
  }

  const who = { firstName: member.first_name, lastName: member.last_name };

  const content =
    kind === "id_card"
      ? idCardEmail(who, member.membership_number)
      : appointmentLetterEmail(who, member.designation);

  const stem = member.membership_number ?? memberId.slice(0, 8);
  const filename =
    kind === "id_card"
      ? `membership-card-${stem}.pdf`
      : `appointment-letter-${stem}.pdf`;

  const result = await sendEmail({
    to: member.email,
    subject: content.subject,
    html: content.html,
    text: content.text,
    attachments: [
      { filename, content: Buffer.from(await file.arrayBuffer()) },
    ],
  });

  return NextResponse.json(
    result.sent
      ? { sent: true, id: result.id, to: member.email }
      : { sent: false, reason: result.reason }
  );
}
