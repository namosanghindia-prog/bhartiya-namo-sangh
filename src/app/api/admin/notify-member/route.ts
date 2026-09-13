import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import {
  applicationApprovedEmail,
  membershipActivatedEmail,
} from "@/lib/email/templates";

/**
 * Tells a member what an admin just decided about their membership.
 *
 * Called by the admin pages after the status change itself has succeeded, so a
 * mail failure can never leave a member approved-but-unnotified *and* show the
 * admin an error about work that did in fact complete. The response says
 * whether the mail went out; the admin pages do not block on it.
 */

const EVENTS = ["approved", "activated"] as const;
type NotifyEvent = (typeof EVENTS)[number];

function isEvent(value: unknown): value is NotifyEvent {
  return typeof value === "string" && (EVENTS as readonly string[]).includes(value);
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

  let body: { memberId?: unknown; event?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { memberId, event } = body;

  if (typeof memberId !== "string" || !memberId || !isEvent(event)) {
    return NextResponse.json(
      { error: "memberId and a valid event are required" },
      { status: 400 }
    );
  }

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("first_name, last_name, email, membership_fee_amount, membership_number")
    .eq("id", memberId)
    .single();

  if (memberError || !member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (!member.email) {
    return NextResponse.json({ sent: false, reason: "Member has no email address" });
  }

  const who = { firstName: member.first_name, lastName: member.last_name };

  const content =
    event === "approved"
      ? applicationApprovedEmail(who, member.membership_fee_amount)
      : membershipActivatedEmail(who, member.membership_number);

  const result = await sendEmail({
    to: member.email,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });

  return NextResponse.json(
    result.sent
      ? { sent: true, id: result.id }
      : { sent: false, reason: result.reason }
  );
}
