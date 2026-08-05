"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Branch } from "@/lib/supabase/types";

export default function SignupPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);

  useEffect(() => {
    async function fetchBranches() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("branches")
          .select("*")
          .eq("is_active", true)
          .order("name");
        if (error) {
          console.error("Failed to fetch branches:", error);
          return;
        }
        if (data) setBranches(data);
      } catch (err) {
        console.error("Exception fetching branches:", err);
      } finally {
        setBranchesLoading(false);
      }
    }
    fetchBranches();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const phone = formData.get("phone") as string;
    const branchId = formData.get("branch") as string;

    const supabase = createClient();

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone,
          branch_id: branchId || null,
        },
      },
    });

    setSubmitting(false);

    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        setError("This email is already registered. Please login instead.");
      } else if (signUpError.message.includes("valid email")) {
        setError("Please enter a valid email address.");
      } else if (signUpError.message.includes("password")) {
        setError("Password must be at least 8 characters with a mix of letters and numbers.");
      } else {
        setError(signUpError.message);
      }
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <>
        <h1 className="font-heading text-2xl font-semibold text-navy text-center">
          Check your email
        </h1>
        <div className="mt-6 rounded-md bg-forest/10 border border-forest/20 px-4 py-3 text-sm text-forest">
          We&apos;ve sent a confirmation link to your email. Please click it to
          activate your account, then{" "}
          <Link href="/auth/login" className="font-medium underline">
            login here
          </Link>
          .
        </div>
        <p className="mt-6 text-center text-sm text-navy/70">
          Didn&apos;t receive it?{" "}
          <button
            onClick={() => setSuccess(false)}
            className="font-medium text-saffron-700 hover:text-saffron-800"
          >
            Try again
          </button>
        </p>
      </>
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
            disabled={branchesLoading}
            className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400 disabled:bg-gray-100"
          >
            <option value="" disabled>
              {branchesLoading ? "Loading branches..." : "Choose a branch"}
            </option>
            {branches.map((b) => (
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
