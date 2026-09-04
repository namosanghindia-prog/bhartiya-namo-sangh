"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadAvatar } from "@/lib/avatar";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // The proxy redirects here with ?error=unavailable when Supabase does not
  // answer within its deadline, so the user gets an explanation instead of a
  // silent bounce back to the login form.
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "unavailable"
      ? "We could not reach the server just then. Please try signing in again."
      : null
  );
  const [vipMessage, setVipMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const supabase = createClient();

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setSubmitting(false);
      if (signInError.message.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please try again.");
      } else if (signInError.message.includes("Email not confirmed")) {
        setError("Please confirm your email address before logging in. Check your inbox for the confirmation link.");
      } else if (signInError.message.includes("Too many requests")) {
        setError("Too many login attempts. Please wait a few minutes and try again.");
      } else {
        setError(signInError.message);
      }
      return;
    }

    if (signInData?.user) {
      const pendingAvatar = sessionStorage.getItem("pending_avatar");
      const pendingAvatarType = sessionStorage.getItem("pending_avatar_type");

      console.log("[login] Checking for pending avatar:", {
        hasPendingAvatar: !!pendingAvatar,
        hasPendingAvatarType: !!pendingAvatarType,
        avatarLength: pendingAvatar?.length,
      });

      if (pendingAvatar && pendingAvatarType) {
        try {
          console.log("[login] Processing pending avatar upload...");
          const base64Data = pendingAvatar.split(",")[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: pendingAvatarType });

          console.log("[login] Uploading pending avatar to storage...");
          const { publicUrl, error: uploadError } = await uploadAvatar(
            supabase,
            signInData.user.id,
            blob,
            pendingAvatarType
          );

          if (uploadError || !publicUrl) {
            console.error("[login] Avatar upload failed:", uploadError);
          } else {
            console.log("[login] Public URL:", publicUrl);
            const { error: updateError } = await supabase
              .from("members")
              .update({ avatar_url: publicUrl })
              .eq("id", signInData.user.id);

            if (updateError) {
              console.error("[login] Failed to update member avatar_url:", updateError);
            } else {
              console.log("[login] Member avatar_url updated successfully");
            }
          }

          sessionStorage.removeItem("pending_avatar");
          sessionStorage.removeItem("pending_avatar_type");
          console.log("[login] Cleared pending avatar from sessionStorage");
        } catch (err) {
          console.error("[login] Failed to upload pending avatar:", err);
        }
      }

      // Check for VIP coupon code in user metadata
      const vipCouponCode = signInData.user.user_metadata?.vip_coupon_code;
      if (vipCouponCode) {
        try {
          const { data: redeemResult, error: redeemError } = await supabase.rpc(
            "redeem_vip_coupon",
            { coupon_code: vipCouponCode, member_id: signInData.user.id }
          );

          // Clear the vip_coupon_code from metadata regardless of result
          await supabase.auth.updateUser({
            data: { vip_coupon_code: null },
          });

          if (redeemError) {
            console.error("VIP coupon redemption error:", redeemError);
            setVipMessage({
              type: "error",
              text: "This VIP code is invalid or already used. Your application will go through standard review.",
            });
            setSubmitting(false);
            setTimeout(() => {
              router.push(redirectTo);
              router.refresh();
            }, 3000);
            return;
          }

          if (redeemResult === true) {
            setVipMessage({
              type: "success",
              text: "🎉 VIP membership activated!",
            });
            setSubmitting(false);
            setTimeout(() => {
              router.push("/dashboard");
              router.refresh();
            }, 2000);
            return;
          } else {
            setVipMessage({
              type: "error",
              text: "This VIP code is invalid or already used. Your application will go through standard review.",
            });
            setSubmitting(false);
            setTimeout(() => {
              router.push(redirectTo);
              router.refresh();
            }, 3000);
            return;
          }
        } catch (err) {
          console.error("Failed to redeem VIP coupon:", err);
        }
      }
    }

    setSubmitting(false);
    router.push(redirectTo);
    router.refresh();
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirectTo}`,
      },
    });
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

        {vipMessage && (
          <div
            className={`text-sm rounded-md px-4 py-3 ${
              vipMessage.type === "success"
                ? "bg-forest/10 text-forest border border-forest/20"
                : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}
          >
            {vipMessage.text}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || vipMessage !== null}
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
          onClick={handleGoogleLogin}
          className="w-full rounded-md border border-saffron-200 px-4 py-2.5 text-sm font-medium text-navy hover:bg-saffron-50 transition-colors"
        >
          Continue with Google
        </button>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-navy/60">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
