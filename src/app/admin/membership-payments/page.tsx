"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface PendingPayment {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  membership_type: string | null;
  membership_fee_amount: number | null;
  membership_payment_submitted_at: string | null;
  membership_payment_status: string | null;
  branch: { name: string }[] | null;
}

const MEMBERSHIP_LABELS: Record<string, string> = {
  volunteer: "Volunteer",
  normal: "Normal",
  premium: "Premium",
  lifetime: "Lifetime",
};

export default function MembershipPaymentsPage() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "submitted" | "not_submitted">(
    "all"
  );

  async function loadPendingPayments() {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setAdminId(user.id);
    }

    const { data, error } = await supabase
      .from("members")
      .select(`
        id, first_name, last_name, email, phone, avatar_url,
        membership_type, membership_fee_amount, membership_payment_submitted_at,
        membership_payment_status,
        branch:branches(name)
      `)
      // Everyone still awaiting payment, not just those who pressed "I have
      // paid": a member who paid in cash or by direct transfer never submits
      // one and would otherwise be invisible here.
      .eq("status", "approved_awaiting_payment")
      // A plain .neq would also drop rows where the column is NULL, since
      // NULL <> 'confirmed' is NULL, not true — and those older rows are
      // precisely the offline payers this list needs to show.
      .or("membership_payment_status.is.null,membership_payment_status.neq.confirmed")
      .order("membership_payment_submitted_at", {
        ascending: true,
        nullsFirst: false,
      });

    if (error) {
      console.error("Failed to load pending payments:", error);
    } else if (data) {
      setPayments(data as PendingPayment[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadPendingPayments();
  }, []);

  async function handleConfirmPayment(memberId: string) {
    if (!adminId) {
      alert("Unable to identify admin user");
      return;
    }

    const member = payments.find((p) => p.id === memberId);

    // Nobody pressed "I have paid" for this one, so there is no submission to
    // check against a bank record. Make the admin say so out loud before it
    // activates a membership.
    if (member && !hasSubmitted(member)) {
      const ok = confirm(
        `${member.first_name} ${member.last_name} has not submitted a payment through the site.\n\n` +
          "Only continue if you have verified the payment yourself — in the bank account, by UPI, or as cash received.\n\n" +
          "Confirming activates the membership and issues a membership number."
      );
      if (!ok) return;
    }

    setProcessing(memberId);
    const supabase = createClient();

    const { error } = await supabase.rpc("confirm_membership_payment", {
      member_id: memberId,
      admin_id: adminId,
    });

    if (error) {
      if (error.message.includes("does not exist")) {
        const isLifetime = member?.membership_type === "lifetime";

        const { error: fallbackError } = await supabase
          .from("members")
          .update({
            status: "active",
            membership_payment_status: "confirmed",
            membership_payment_confirmed_at: new Date().toISOString(),
            membership_payment_confirmed_by: adminId,
            membership_issued_at: new Date().toISOString(),
            membership_expires_at: isLifetime
              ? null
              : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq("id", memberId);

        if (fallbackError) {
          console.error("Failed to confirm payment:", fallbackError);
          alert("Failed to confirm payment: " + fallbackError.message);
          setProcessing(null);
          return;
        }
      } else {
        console.error("Failed to confirm payment:", error);
        alert("Failed to confirm payment: " + error.message);
        setProcessing(null);
        return;
      }
    }

    // Read the row back rather than assuming the write landed. The function is
    // SECURITY DEFINER and its older version silently matched nothing unless
    // the payment was already 'submitted', so an offline confirmation could
    // disappear from this list having changed nothing at all. Checking the
    // stored state works whichever version of the function is deployed.
    const { data: after } = await supabase
      .from("members")
      .select("membership_payment_status")
      .eq("id", memberId)
      .single();

    if (after && after.membership_payment_status !== "confirmed") {
      alert(
        "The payment was not confirmed — nothing changed.\n\n" +
          "If this member paid offline, the database function still needs " +
          "migration 013 applied. Ask a developer to run it, then try again."
      );
      setProcessing(null);
      await loadPendingPayments();
      return;
    }

    setPayments((prev) => prev.filter((p) => p.id !== memberId));
    setProcessing(null);
  }

  // "Submitted" means the member pressed "I have paid" and there is a claimed
  // payment to check. Anything else — 'pending', or null on older rows — is
  // someone who paid offline, or has not paid at all.
  function hasSubmitted(p: PendingPayment) {
    return p.membership_payment_status === "submitted";
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const submittedCount = payments.filter(hasSubmitted).length;
  const offlineCount = payments.length - submittedCount;

  const visible = payments.filter((p) =>
    filter === "all"
      ? true
      : filter === "submitted"
        ? hasSubmitted(p)
        : !hasSubmitted(p)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy">
            Membership Payments
          </h1>
          <p className="mt-1 text-sm text-navy/60">
            Verify and confirm membership fee payments, including those paid
            in cash or by direct transfer
          </p>
        </div>
        <button
          onClick={loadPendingPayments}
          className="rounded-md border border-saffron-300 px-4 py-2 text-sm font-medium text-navy hover:bg-saffron-50"
        >
          Refresh
        </button>
      </div>

      {!loading && payments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {([
            ["all", `All (${payments.length})`],
            ["submitted", `Awaiting review (${submittedCount})`],
            ["not_submitted", `Not submitted (${offlineCount})`],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === value
                  ? "bg-saffron-700 text-white"
                  : "border border-saffron-300 text-navy/70 hover:bg-saffron-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
          <p className="text-navy/60">Loading pending payments...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
          <div className="text-4xl mb-3">💳</div>
          <h2 className="font-heading text-lg font-semibold text-navy">
            No Pending Payments
          </h2>
          <p className="mt-2 text-sm text-navy/60">
            All membership payments have been processed.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
          <p className="text-navy/60">
            {filter === "submitted"
              ? "Nobody is waiting on a submitted payment right now."
              : "No members are awaiting an offline payment right now."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-saffron-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-saffron-50 border-b border-saffron-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-navy/70 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-navy/70 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-navy/70 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-navy/70 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-navy/70 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-saffron-100">
                {visible.map((payment) => (
                  <tr key={payment.id} className="hover:bg-saffron-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {payment.avatar_url ? (
                          <img
                            src={payment.avatar_url}
                            alt=""
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-saffron-200 flex items-center justify-center font-heading text-sm font-semibold text-saffron-800">
                            {payment.first_name[0]}
                            {payment.last_name[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-navy">
                            {payment.first_name} {payment.last_name}
                          </div>
                          <div className="text-xs text-navy/60">
                            {payment.email || payment.phone || "—"}
                          </div>
                          {payment.branch?.[0]?.name && (
                            <div className="text-xs text-navy/50">
                              {payment.branch[0].name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          payment.membership_type === "lifetime"
                            ? "bg-gold/20 text-gold"
                            : payment.membership_type === "premium"
                            ? "bg-saffron-100 text-saffron-800"
                            : "bg-navy/10 text-navy/70"
                        }`}
                      >
                        {payment.membership_type
                          ? MEMBERSHIP_LABELS[payment.membership_type]
                          : "Normal"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-navy">
                        ₹{payment.membership_fee_amount?.toLocaleString("en-IN") || "1,100"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {hasSubmitted(payment) ? (
                        <>
                          <span className="inline-flex items-center rounded-full bg-saffron-100 px-2.5 py-0.5 text-xs font-medium text-saffron-800">
                            Submitted
                          </span>
                          <div className="mt-1 text-xs text-navy/60">
                            {formatDate(
                              payment.membership_payment_submitted_at
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="inline-flex items-center rounded-full bg-navy/10 px-2.5 py-0.5 text-xs font-medium text-navy/70">
                            Not submitted
                          </span>
                          <div className="mt-1 text-xs text-navy/50">
                            Paid offline? Verify first
                          </div>
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleConfirmPayment(payment.id)}
                        disabled={processing === payment.id}
                        className="rounded-md bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest/90 disabled:opacity-60"
                      >
                        {processing === payment.id
                          ? "Processing..."
                          : hasSubmitted(payment)
                            ? "Confirm Payment & Activate"
                            : "Mark Paid & Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-saffron-200 bg-white p-6">
        <h2 className="font-heading text-lg font-semibold text-navy mb-3">
          Payment Verification Guidelines
        </h2>
        <ul className="space-y-2 text-sm text-navy/70">
          <li className="flex items-start gap-2">
            <span className="text-forest">✓</span>
            Verify the payment was received in the organization&apos;s bank account or UPI
          </li>
          <li className="flex items-start gap-2">
            <span className="text-forest">✓</span>
            Confirm the amount matches the membership type selected
          </li>
          <li className="flex items-start gap-2">
            <span className="text-forest">✓</span>
            Check payment reference/UTR number if provided
          </li>
          <li className="flex items-start gap-2">
            <span className="text-forest">✓</span>
            A member marked &quot;Not submitted&quot; never confirmed a payment on
            the site — check your own records before marking them paid
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-600">✗</span>
            Do not confirm until payment is verified in bank records
          </li>
        </ul>
        <p className="mt-4 text-xs text-navy/50">
          Upon confirmation, the member will be fully activated with a membership number
          and ID card access.
        </p>
      </div>
    </div>
  );
}
