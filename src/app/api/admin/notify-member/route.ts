import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import {
  applicationApprovedEmail,
  applicationRejectedEmail,
  membershipActivatedEmail,
  idCardStatusEmail,
  businessApprovedEmail,
  businessRejectedEmail,
  type EmailContent,
} from "@/lib/email/templates";

/**
 * Tells a member what an admin just decided about them.
 *
 * Called by the admin pages *after* the change itself has been written, so a
 * mail failure can never leave a member approved-but-unnotified while showing
 * the admin an error about work that did in fact complete.
 *
 * Only an id is accepted for each event; the wording is built from what the
 * database says, never from anything the browser passes in. An admin session is
 * still a session, and a rejection reason or a business name arriving as request
 * body text would be repeated verbatim into an email.
 */

type Body = {
  event?: unknown;
  memberId?: unknown;
  orderId?: unknown;
  businessId?: unknown;
};

interface Recipient {
  email: string;
  firstName: string;
  lastName: string;
}

async function loadMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  memberId: string
): Promise<
  | { member: Recipient; feeAmount: number | null; membershipNumber: number | null }
  | { error: string; status: number }
> {
  const { data, error } = await supabase
    .from("members")
    .select("first_name, last_name, email, membership_fee_amount, membership_number")
    .eq("id", memberId)
    .single();

  if (error || !data) return { error: "Member not found", status: 404 };
  if (!data.email) return { error: "Member has no email address", status: 422 };

  return {
    member: {
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
    },
    feeAmount: data.membership_fee_amount,
    membershipNumber: data.membership_number,
  };
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

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const event = typeof body.event === "string" ? body.event : "";

  let to: string;
  let content: EmailContent;

  switch (event) {
    case "approved":
    case "rejected":
    case "activated": {
      if (typeof body.memberId !== "string" || !body.memberId) {
        return NextResponse.json({ error: "memberId is required" }, { status: 400 });
      }

      const loaded = await loadMember(supabase, body.memberId);
      if ("error" in loaded) {
        return loaded.status === 422
          ? NextResponse.json({ sent: false, reason: loaded.error })
          : NextResponse.json({ error: loaded.error }, { status: loaded.status });
      }

      to = loaded.member.email;
      content =
        event === "approved"
          ? applicationApprovedEmail(loaded.member, loaded.feeAmount)
          : event === "rejected"
          ? applicationRejectedEmail(loaded.member)
          : membershipActivatedEmail(loaded.member, loaded.membershipNumber);
      break;
    }

    case "id_card_status": {
      if (typeof body.orderId !== "string" || !body.orderId) {
        return NextResponse.json({ error: "orderId is required" }, { status: 400 });
      }

      const { data: order, error: orderError } = await supabase
        .from("id_card_orders")
        .select("member_id, status, delivery_name, address_line, city, state, pincode")
        .eq("id", body.orderId)
        .single();

      if (orderError || !order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      // The initial state is not news to the person who just placed the order.
      if (order.status === "pending_payment") {
        return NextResponse.json({ sent: false, reason: "Nothing to announce yet" });
      }

      const loaded = await loadMember(supabase, order.member_id);
      if ("error" in loaded) {
        return loaded.status === 422
          ? NextResponse.json({ sent: false, reason: loaded.error })
          : NextResponse.json({ error: loaded.error }, { status: loaded.status });
      }

      const address = [order.address_line, order.city, order.state, order.pincode]
        .filter(Boolean)
        .join(", ");

      to = loaded.member.email;
      content = idCardStatusEmail(loaded.member, order.status, address || null);
      break;
    }

    case "business_decision": {
      if (typeof body.businessId !== "string" || !body.businessId) {
        return NextResponse.json({ error: "businessId is required" }, { status: 400 });
      }

      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .select("member_id, business_name, status, rejection_reason, expires_at")
        .eq("id", body.businessId)
        .single();

      if (businessError || !business) {
        return NextResponse.json({ error: "Business not found" }, { status: 404 });
      }

      if (business.status !== "active" && business.status !== "rejected") {
        return NextResponse.json({
          sent: false,
          reason: `No email for status "${business.status}"`,
        });
      }

      const loaded = await loadMember(supabase, business.member_id);
      if ("error" in loaded) {
        return loaded.status === 422
          ? NextResponse.json({ sent: false, reason: loaded.error })
          : NextResponse.json({ error: loaded.error }, { status: loaded.status });
      }

      to = loaded.member.email;
      content =
        business.status === "active"
          ? businessApprovedEmail(
              loaded.member,
              business.business_name,
              business.expires_at
            )
          : businessRejectedEmail(
              loaded.member,
              business.business_name,
              business.rejection_reason
            );
      break;
    }

    default:
      return NextResponse.json({ error: "Unknown event" }, { status: 400 });
  }

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
