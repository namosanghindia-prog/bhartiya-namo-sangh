import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { adminNotificationAddress } from "@/lib/email/recipients";
import { paymentSubmittedAdminEmail } from "@/lib/email/templates";

/**
 * Alerts the admins that a member has pressed "I have paid".
 *
 * Called by the member themselves, so it takes no arguments at all: the only
 * row it will look at is the caller's own, and it only sends if that row
 * actually says the payment is submitted. Otherwise this would be a way for any
 * signed-in member to mail the admin inbox on demand.
 */
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: member, error } = await supabase
    .from("members")
    .select("first_name, last_name, membership_fee_amount, membership_payment_status")
    .eq("id", user.id)
    .single();

  if (error || !member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (member.membership_payment_status !== "submitted") {
    return NextResponse.json(
      { sent: false, reason: "No submitted payment on this account" },
      { status: 409 }
    );
  }

  const to = await adminNotificationAddress(supabase);

  if (!to) {
    return NextResponse.json({
      sent: false,
      reason: "No admin address configured (set ADMIN_EMAIL or the org primary email)",
    });
  }

  const content = paymentSubmittedAdminEmail(
    { firstName: member.first_name, lastName: member.last_name },
    member.membership_fee_amount
  );

  const result = await sendEmail({
    to,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });

  return NextResponse.json(
    result.sent ? { sent: true, id: result.id } : { sent: false, reason: result.reason }
  );
}
