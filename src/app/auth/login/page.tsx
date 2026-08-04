"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // NOTE: NextAuth.js is not wired up yet — this is a UI-only placeholder.
    // Once Supabase + NextAuth credentials/env vars are configured, replace
    // this with: await signIn("credentials", { email, password })
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setError(
      "Login isn't connected to a database yet — this form is UI-only for now."
    );
  }

  return (
    <>
      <h1 className="font-heading text-2xl font-semibold text-navy text-center">
        Login to your account
      </h1>

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

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-navy/80 mb-1"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-saffron-200 px-3 py-2 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-saffron-700"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-navy/70">
            <input type="checkbox" className="rounded border-saffron-300" />
            Remember me
          </label>
          <Link href="/auth/forgot" className="text-saffron-700 hover:text-saffron-800">
            Forgot password?
          </Link>
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
          {submitting ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-navy/70">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="font-medium text-saffron-700 hover:text-saffron-800">
          Sign up
        </Link>
      </p>

      <div className="mt-6 flex items-center gap-3">
        <div className="flex-1 border-t border-saffron-100" />
        <span className="text-xs text-navy/40">OR</span>
        <div className="flex-1 border-t border-saffron-100" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3">
        <button
          type="button"
          className="w-full rounded-md border border-saffron-200 px-4 py-2.5 text-sm font-medium text-navy hover:bg-saffron-50 transition-colors"
        >
          Continue with Google
        </button>
      </div>
    </>
  );
}
