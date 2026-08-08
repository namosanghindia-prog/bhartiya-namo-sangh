"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const MEMBERSHIP_LABELS: Record<string, string> = {
  volunteer: "Volunteer Membership",
  normal: "Normal Membership",
  premium: "Premium Membership",
  lifetime: "Lifetime Membership",
};

const statusConfig = {
  pending: {
    icon: "⏳",
    title: "Account Awaiting Approval",
    message:
      "Thank you for signing up! Your account is currently being reviewed by our administrators. You'll receive an email notification once your account has been approved.",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  suspended: {
    icon: "🚫",
    title: "Account Suspended",
    message:
      "Your account has been suspended. If you believe this is an error or would like to appeal this decision, please contact our support team.",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  inactive: {
    icon: "💤",
    title: "Account Inactive",
    message:
      "Your account is currently inactive. Please contact our support team to reactivate your membership.",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
  approved_awaiting_payment: {
    icon: "✅",
    title: "Application Approved!",
    message:
      "Congratulations! Your membership application has been approved. Please complete your payment to activate your membership.",
    color: "text-forest",
    bgColor: "bg-forest/5",
    borderColor: "border-forest/20",
  },
};

interface MemberInfo {
  id: string;
  membership_type: string | null;
  membership_fee_amount: number | null;
  membership_payment_status: string | null;
}

function AccountStatusContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "pending";
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  useEffect(() => {
    async function loadMemberInfo() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("members")
          .select("id, membership_type, membership_fee_amount, membership_payment_status")
          .eq("id", user.id)
          .single();
        if (data) {
          setMemberInfo(data);
          if (data.membership_payment_status === "submitted") {
            setPaymentSubmitted(true);
          }
        }
      }
    }
    if (status === "approved_awaiting_payment") {
      loadMemberInfo();
    }
  }, [status]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function handlePaymentSubmit() {
    if (!memberInfo) return;
    setSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("members")
      .update({
        membership_payment_status: "submitted",
        membership_payment_submitted_at: new Date().toISOString(),
      })
      .eq("id", memberInfo.id);

    if (error) {
      console.error("Failed to submit payment:", error);
      alert("Failed to submit payment confirmation. Please try again.");
    } else {
      setPaymentSubmitted(true);
    }
    setSubmitting(false);
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  if (status === "approved_awaiting_payment") {
    return (
      <div className={`rounded-xl ${config.bgColor} ${config.borderColor} border p-8`}>
        <div className="text-center">
          <div className="text-5xl mb-4">{config.icon}</div>
          <h1 className={`font-heading text-xl font-semibold ${config.color}`}>
            {config.title}
          </h1>
          <p className="mt-4 text-sm text-navy/70 leading-relaxed">
            {config.message}
          </p>
        </div>

        {memberInfo && !paymentSubmitted && (
          <div className="mt-6 bg-white rounded-lg border border-saffron-200 p-5">
            <h2 className="font-heading text-lg font-semibold text-navy mb-4">
              Payment Details
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-navy/60">Membership Type:</span>
                <span className="font-medium text-navy">
                  {memberInfo.membership_type
                    ? MEMBERSHIP_LABELS[memberInfo.membership_type]
                    : "Standard"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy/60">Amount:</span>
                <span className="font-semibold text-lg text-navy">
                  ₹{memberInfo.membership_fee_amount?.toLocaleString("en-IN") || "1,100"}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-saffron-100">
              <h3 className="font-medium text-navy mb-3">Payment Methods</h3>

              <div className="space-y-3">
                <div className="bg-saffron-50 rounded-lg p-3">
                  <div className="font-medium text-navy text-sm">UPI</div>
                  <div className="text-navy/70 text-sm mt-1">
                    Pay to: <span className="font-mono font-medium">bnms@upi</span>
                  </div>
                </div>

                <div className="bg-saffron-50 rounded-lg p-3">
                  <div className="font-medium text-navy text-sm">Bank Transfer</div>
                  <div className="text-navy/70 text-xs mt-1 space-y-0.5">
                    <div>Account: <span className="font-mono">1234567890123456</span></div>
                    <div>IFSC: <span className="font-mono">SBIN0001234</span></div>
                    <div>Name: Bhartiya Namo Sangh</div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handlePaymentSubmit}
              disabled={submitting}
              className="w-full mt-5 rounded-md bg-forest px-4 py-3 text-sm font-semibold text-white hover:bg-forest/90 transition-colors disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "I've Made the Payment"}
            </button>

            <p className="mt-3 text-xs text-navy/50 text-center">
              After clicking, an admin will verify your payment and activate your membership.
            </p>
          </div>
        )}

        {paymentSubmitted && (
          <div className="mt-6 bg-white rounded-lg border border-saffron-200 p-5 text-center">
            <div className="text-3xl mb-3">📨</div>
            <h2 className="font-heading text-lg font-semibold text-navy">
              Payment Confirmation Submitted
            </h2>
            <p className="mt-2 text-sm text-navy/70">
              Thank you! An administrator will verify your payment and activate
              your membership. You&apos;ll receive an email notification once complete.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-saffron-100 px-3 py-1 text-sm text-saffron-800">
              <span className="h-2 w-2 rounded-full bg-saffron-500 animate-pulse" />
              Payment verification pending
            </div>
          </div>
        )}

        <div className="mt-6 space-y-3">
          <Link
            href="/contact"
            className="block w-full rounded-md border border-saffron-300 px-4 py-2.5 text-sm font-medium text-navy hover:bg-saffron-50 transition-colors text-center"
          >
            Contact Support
          </Link>
          <button
            onClick={handleLogout}
            className="w-full rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy/90 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl ${config.bgColor} ${config.borderColor} border p-8 text-center`}>
      <div className="text-5xl mb-4">{config.icon}</div>
      <h1 className={`font-heading text-xl font-semibold ${config.color}`}>
        {config.title}
      </h1>
      <p className="mt-4 text-sm text-navy/70 leading-relaxed">
        {config.message}
      </p>

      {status === "pending" && (
        <div className="mt-6 p-4 bg-white rounded-lg border border-amber-100">
          <p className="text-xs text-navy/60">
            Typical approval time: <strong>1-2 business days</strong>
          </p>
        </div>
      )}

      <div className="mt-8 space-y-3">
        <Link
          href="/contact"
          className="block w-full rounded-md border border-saffron-300 px-4 py-2.5 text-sm font-medium text-navy hover:bg-saffron-50 transition-colors"
        >
          Contact Support
        </Link>
        <button
          onClick={handleLogout}
          className="w-full rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy/90 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function AccountStatusPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-saffron-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Bhartiya Namo Sangh"
              width={48}
              height={48}
              className="h-12 w-12"
            />
            <span className="font-heading text-xl font-semibold text-navy">
              Bhartiya Namo Sangh
            </span>
          </Link>
        </div>

        <Suspense fallback={
          <div className="rounded-xl bg-saffron-50 border border-saffron-200 p-8 text-center">
            <div className="text-navy/60">Loading...</div>
          </div>
        }>
          <AccountStatusContent />
        </Suspense>

        <p className="mt-6 text-center text-xs text-navy/50">
          <Link href="/" className="hover:text-saffron-700">
            ← Return to homepage
          </Link>
        </p>
      </div>
    </div>
  );
}
