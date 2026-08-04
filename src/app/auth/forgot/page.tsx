"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    // NOTE: Wire this up to send a password reset email via SendGrid/AWS SES
    // once the backend + NextAuth are connected.
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setSent(true);
  }

  return (
    <>
      <h1 className="font-heading text-2xl font-semibold text-navy text-center">
        Reset your password
      </h1>
      <p className="text-center text-sm text-navy/60 mt-1">
        We&apos;ll email you a link to reset it
      </p>

      {sent ? (
        <div className="mt-6 rounded-md bg-forest/10 border border-forest/20 px-4 py-3 text-sm text-forest">
          If an account exists with that email, a reset link has been sent.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-navy/80 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-saffron-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800 transition-colors disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-navy/70">
        <Link href="/auth/login" className="font-medium text-saffron-700 hover:text-saffron-800">
          ← Back to login
        </Link>
      </p>
    </>
  );
}
