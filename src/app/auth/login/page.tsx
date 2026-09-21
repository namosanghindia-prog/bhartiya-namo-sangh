"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { flushPendingAvatar } from "@/lib/pending-avatar";
import { redeemPendingVipCoupon } from "@/lib/vip-coupon";
import GoogleIcon from "@/components/GoogleIcon";

const FIELD =
  "w-full min-h-11 rounded-xl border border-navy/15 bg-white px-4 text-sm text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-saffron-400 disabled:cursor-not-allowed disabled:bg-[#f6f4f0] disabled:text-navy/50";

function Spinner({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-25" />
      <path
        d="M21 12a9 9 0 00-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="opacity-70"
      />
    </svg>
  );
}

function LoginSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f4f0] px-5">
      <div className="w-full max-w-md rounded-3xl bg-white p-9" aria-busy="true" aria-live="polite">
        <p className="text-sm text-navy/50">Preparing sign-in…</p>
        <div className="mt-6 h-10 w-2/3 rounded-lg bg-navy/5" />
        <div className="mt-4 h-12 rounded-xl bg-navy/5" />
        <div className="mt-3 h-12 rounded-xl bg-navy/5" />
        <div className="mt-6 h-12 rounded-full bg-navy/10" />
      </div>
    </div>
  );
}

const GENERIC_SIGNIN =
  "We couldn't sign you in. Please check your email/mobile number and password and try again.";
const RATE_LIMIT = "Please wait a few minutes before trying again.";
const UNVERIFIED =
  "Your account needs verification. Please verify your account before signing in.";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const inFlight = useRef(false);
  const busy = submitting || googleBusy || signedIn;
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "unavailable"
      ? "We could not reach the server just then. Please try signing in again."
      : searchParams.get("error") === "auth_failed"
        ? "Sign-in did not complete. Please try again."
        : null
  );
  const [vipMessage, setVipMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const identifier = String(formData.get("identifier") || "");
    const password = String(formData.get("password") || "");

    let res: Response;
    try {
      res = await fetch("/api/auth/password-sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, redirect: redirectTo || null }),
      });
    } catch {
      inFlight.current = false;
      setSubmitting(false);
      setError("We could not reach the server just then. Please try signing in again.");
      return;
    }
    const payload = (await res.json().catch(() => ({}))) as {
      error?: string;
      ok?: boolean;
      next?: string;
    };
    const nextPath = payload.next || "/dashboard";

    if (!res.ok) {
      inFlight.current = false;
      setSubmitting(false);
      if (res.status === 429 || payload.error === "rate_limited") {
        setError(RATE_LIMIT);
        return;
      }
      if (payload.error === "unverified") {
        setError(UNVERIFIED);
        return;
      }
      setError(GENERIC_SIGNIN);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await flushPendingAvatar(supabase, user.id);
      const outcome = await redeemPendingVipCoupon(supabase, user);

      if (outcome === "redeemed") {
        setSignedIn(true);
        setVipMessage({ type: "success", text: "VIP membership activated." });
        setTimeout(() => {
          router.push(nextPath);
          router.refresh();
        }, 2000);
        return;
      }

      if (outcome === "rejected") {
        setSignedIn(true);
        setVipMessage({
          type: "error",
          text: "This VIP code is invalid or already used. Your application will go through standard review.",
        });
        setTimeout(() => {
          router.push(nextPath);
          router.refresh();
        }, 3000);
        return;
      }
    }

    setSignedIn(true);
    router.push(nextPath);
    router.refresh();
  }

  async function handleGoogleLogin() {
    if (inFlight.current) return;
    inFlight.current = true;
    setGoogleBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback${
            redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""
          }`,
        },
      });
      if (oauthError) {
        inFlight.current = false;
        setGoogleBusy(false);
        setError("Sign-in did not complete. Please try again.");
      }
    } catch {
      inFlight.current = false;
      setGoogleBusy(false);
      setError("We could not reach the server just then. Please try signing in again.");
    }
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-12">
      <aside className="relative hidden overflow-hidden bg-navy text-white lg:col-span-5 lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/home/community.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/55 to-navy/20" />
        <div className="relative flex h-full min-h-screen flex-col justify-end p-8 xl:p-12">
          <Link href="/" className="absolute left-8 top-8 flex items-center gap-3 xl:left-12 xl:top-12">
            <Image src="/logo.png" alt="" width={48} height={48} className="h-12 w-12" />
            <span className="font-heading text-xl font-semibold">Bhartiya Namo Sangh</span>
          </Link>
          <p lang="hi" className="font-devanagari text-lg tracking-[0.18em] text-saffron-300">
            सेवा • सहभागिता • राष्ट्र निर्माण
          </p>
          <div className="mt-6 h-1 w-40 rounded-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />
        </div>
      </aside>

      <div className="flex flex-col bg-[#f6f4f0] lg:col-span-7">
        <header className="flex items-center justify-between px-5 py-4 lg:px-10">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9" />
            <span className="font-heading font-semibold text-navy">Bhartiya Namo Sangh</span>
          </Link>
          <Link href="/auth/signup" className="ml-auto text-sm font-semibold text-saffron-800">
            Create Membership →
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 py-8 lg:px-12">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_12px_40px_rgba(10,25,41,0.08)] sm:p-8">
            <h1 className="font-heading text-2xl font-semibold text-navy">Welcome Back</h1>
            <p lang="hi" className="font-devanagari mt-2 text-navy/70">
              अपने खाते में प्रवेश करें
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-4"
              aria-busy={busy}
            >
              <div>
                <label htmlFor="identifier" className="mb-1 block text-sm font-medium text-navy/80">
                  Email / Mobile Number
                </label>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  autoComplete="username"
                  inputMode="email"
                  placeholder="Enter email or mobile number"
                  disabled={busy}
                  className={FIELD}
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-navy/80">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    disabled={busy}
                    className={`${FIELD} pr-16`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={busy}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-navy/50 disabled:opacity-40"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 text-navy/70">
                  <input type="checkbox" defaultChecked disabled={busy} className="rounded border-navy/20" />
                  Remember me
                </label>
                <Link href="/auth/forgot" className="font-semibold text-saffron-800 hover:underline">
                  Forgot Password?
                </Link>
              </div>

              {error ? (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {error}
                </p>
              ) : null}

              {vipMessage ? (
                <div
                  className={`rounded-xl px-4 py-3 text-sm ${
                    vipMessage.type === "success"
                      ? "border border-forest/20 bg-forest/10 text-forest"
                      : "border border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  {vipMessage.text}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={busy}
                aria-live="polite"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-saffron-700 text-sm font-semibold text-white hover:bg-saffron-800 disabled:pointer-events-none disabled:opacity-60"
              >
                {signedIn ? (
                  "Signed in…"
                ) : submitting ? (
                  <>
                    <Spinner />
                    Signing in…
                  </>
                ) : (
                  "SIGN IN →"
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-navy/10" />
              <span className="text-xs uppercase tracking-[0.18em] text-navy/40">or</span>
              <div className="h-px flex-1 bg-navy/10" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={busy}
              className="mt-6 flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-[#747775] bg-white text-sm font-medium text-[#1F1F1F] hover:bg-[#f8f8f8] disabled:pointer-events-none disabled:opacity-60"
            >
              {googleBusy ? <Spinner /> : <GoogleIcon className="h-5 w-5" />}
              {googleBusy ? "Continuing with Google…" : "Continue with Google"}
            </button>

            <p className="mt-8 text-center text-sm text-navy/65">
              New to Bhartiya Namo Sangh?
            </p>
            <Link
              href="/auth/signup"
              className="mt-2 block text-center text-sm font-semibold text-saffron-800"
            >
              Create Membership →
            </Link>

            <p className="mt-8 text-center text-xs text-navy/40">
              <Link href="/contact" className="underline-offset-2 hover:underline">
                Contact us
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
