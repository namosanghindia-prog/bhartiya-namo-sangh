"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";

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
};

function AccountStatusContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "pending";

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

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
