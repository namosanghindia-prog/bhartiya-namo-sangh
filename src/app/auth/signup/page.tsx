"use client";

import Link from "next/link";
import { useState } from "react";
import { BRANCHES } from "@/lib/branches-data";

export default function SignupPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    // NOTE: NextAuth.js + Supabase are not wired up yet — this is a UI-only
    // placeholder. Once configured, POST to /api/auth/register (create user,
    // hash password, assign branch) then redirect to /dashboard.
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setError(
      "Signup isn't connected to a database yet — this form is UI-only for now."
    );
  }

  return (
    <>
      <h1 className="font-heading text-2xl font-semibold text-navy text-center">
        Join Bhartiya Namo Sangh
      </h1>
      <p className="text-center text-sm text-navy/60 mt-1">
        Create your member account
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-navy/80 mb-1"
            >
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              required
              className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-navy/80 mb-1"
            >
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              required
              className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
          </div>
        </div>

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

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-navy/80 mb-1"
          >
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder="+91 98765 43210"
            className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
          />
        </div>

        <div>
          <label
            htmlFor="branch"
            className="block text-sm font-medium text-navy/80 mb-1"
          >
            Select your branch
          </label>
          <select
            id="branch"
            name="branch"
            required
            defaultValue=""
            className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
          >
            <option value="" disabled>
              Choose a branch
            </option>
            {BRANCHES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} — {b.city}, {b.state}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-navy/80 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-navy/80 mb-1"
            >
              Confirm
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
          </div>
        </div>

        <div className="space-y-2 text-sm text-navy/70">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              required
              className="mt-0.5 rounded border-saffron-300"
            />
            I agree to the Terms &amp; Conditions
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-0.5 rounded border-saffron-300" />
            I want to receive updates &amp; newsletters
          </label>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-saffron-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800 transition-colors disabled:opacity-60"
        >
          {submitting ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-navy/70">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-saffron-700 hover:text-saffron-800"
        >
          Login
        </Link>
      </p>
    </>
  );
}
