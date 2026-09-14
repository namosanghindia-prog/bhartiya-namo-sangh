"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Branch } from "@/lib/supabase/types";
import StateDistrictSelect, { type StateDistrict } from "@/components/StateDistrictSelect";
import BranchSelect, { branchesInState } from "@/components/BranchSelect";
import GoogleIcon from "@/components/GoogleIcon";
import MembershipDeclaration from "@/components/MembershipDeclaration";
import MembershipTierPicker from "@/components/MembershipTierPicker";
import { MEMBERSHIP_TIERS, type MembershipTier } from "@/lib/membership-tiers";
import {
  AVATAR_ACCEPTED_TYPES,
  AVATAR_MAX_BYTES,
  AVATAR_MAX_MB,
} from "@/lib/avatar";
import { blobToDataUrl, shrinkImage } from "@/lib/image";
import {
  storePendingAvatar,
  clearPendingAvatar,
  flushPendingAvatar,
} from "@/lib/pending-avatar";
import { redeemPendingVipCoupon } from "@/lib/vip-coupon";

export default function SignupPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [vipNotice, setVipNotice] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [membershipType, setMembershipType] = useState<MembershipTier>("volunteer");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  // Kept alongside the preview so the photo can be uploaded server-side the
  // moment the account exists, instead of waiting for a later login.
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoType, setPhotoType] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [showVipCode, setShowVipCode] = useState(false);
  const [vipCode, setVipCode] = useState("");
  const [location, setLocation] = useState<StateDistrict>({ state: "", district: "" });
  const [branchId, setBranchId] = useState("");
  // Once the applicant picks a branch themselves, changing state stops re-picking it.
  const [branchPicked, setBranchPicked] = useState(false);

  function handleLocationChange(next: StateDistrict) {
    setLocation(next);
    // Every state has its own office: preselect it when the state has exactly one.
    if (!branchPicked && next.state !== location.state) {
      const local = branchesInState(branches, next.state);
      setBranchId(local.length === 1 ? local[0].id : "");
    }
  }

  async function handleGoogleSignup() {
    setError(null);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Google supplies only a name and an email, so a new account is sent on
        // to fill in the rest of the application.
        redirectTo: window.location.origin + "/auth/callback?redirect=/auth/complete-application",
      },
    });
    if (oauthError) setError(oauthError.message);
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function clearPhoto() {
    setPhotoPreview(null);
    setPhotoBlob(null);
    setPhotoType(null);
    clearPendingAvatar();
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPhotoError(null);

    // Selecting nothing (cancelling the picker) must not wipe a photo that was
    // already chosen.
    if (!file) return;

    if (!AVATAR_ACCEPTED_TYPES.includes(file.type)) {
      clearPhoto();
      setPhotoError("Please select a JPG, PNG, or WebP image");
      window.alert("Please select a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > AVATAR_MAX_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const message =
        `यह फ़ोटो ${sizeMb}MB की है। अधिकतम ${AVATAR_MAX_MB}MB की फ़ोटो ही अपलोड करें।\n\n` +
        `This photo is ${sizeMb}MB. Please choose an image under ${AVATAR_MAX_MB}MB.`;
      clearPhoto();
      setPhotoError(
        `Photo is ${sizeMb}MB — please choose an image under ${AVATAR_MAX_MB}MB`
      );
      window.alert(message);
      // Let the same file be picked again after it has been resized.
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setPhotoBusy(true);
    try {
      // Camera photos are far larger than an avatar needs; shrinking here keeps
      // the upload quick and the local fallback copy inside its quota.
      const { blob, contentType } = await shrinkImage(file);
      const dataUrl = await blobToDataUrl(blob);

      setPhotoBlob(blob);
      setPhotoType(contentType);
      setPhotoPreview(dataUrl);
      storePendingAvatar(dataUrl, contentType);
    } catch (err) {
      console.error("[signup] Could not read the selected photo:", err);
      clearPhoto();
      setPhotoError("Could not read that image. Please try another photo.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function saveSignupDetails(
    userId: string,
    details: {
      email: string;
      fatherName: string;
      address: string;
      city: string;
      state: string;
    }
  ) {
    try {
      const payload = new FormData();
      payload.set("userId", userId);
      payload.set("email", details.email);
      payload.set("fatherName", details.fatherName ?? "");
      payload.set("address", details.address ?? "");
      payload.set("city", details.city ?? "");
      payload.set("state", details.state ?? "");

      if (photoBlob && photoType) {
        payload.set("photo", photoBlob, "avatar");
      }

      const res = await fetch("/api/signup/complete", {
        method: "POST",
        body: payload,
      });

      if (!res.ok) {
        console.error("[signup] Could not save details:", await res.text());
        return;
      }

      const result = await res.json();
      if (result?.photoSaved) {
        // Safely stored against the account; no need to keep the local copy.
        clearPendingAvatar();
      } else if (result?.photoError) {
        console.error("[signup] Photo rejected by the server:", result.photoError);
      }
    } catch (err) {
      console.error("[signup] Could not reach /api/signup/complete:", err);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!photoPreview) {
      setError("Profile photo is required. Please upload a photo.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (!declarationAccepted) {
      setError("You must accept the declaration to proceed.");
      return;
    }

    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const phone = formData.get("phone") as string;
    const branchId = formData.get("branch") as string;
    const fatherName = formData.get("fatherName") as string;
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;

    const supabase = createClient();

    const hasVipCode = showVipCode && vipCode.trim();
    const membershipFeeAmount = hasVipCode ? 0 : MEMBERSHIP_TIERS[membershipType].price;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone,
          branch_id: branchId || null,
          father_name: fatherName,
          address,
          city,
          state,
          declaration_accepted: true,
          membership_type: hasVipCode ? null : membershipType,
          membership_fee_amount: membershipFeeAmount,
          vip_coupon_code: hasVipCode ? vipCode.trim().toUpperCase() : null,
        },
      },
    });

    if (signUpError) {
      setSubmitting(false);
      const msg = signUpError.message.toLowerCase();
      if (
        msg.includes("already registered") ||
        msg.includes("already exists") ||
        msg.includes("user already")
      ) {
        setError("EMAIL_EXISTS");
        return;
      }
      if (msg.includes("valid email")) {
        setError("Please enter a valid email address.");
      } else if (msg.includes("password")) {
        setError("Password must be at least 8 characters with a mix of letters and numbers.");
      } else {
        setError(signUpError.message);
      }
      return;
    }

    if (
      signUpData?.user &&
      (!signUpData.user.identities || signUpData.user.identities.length === 0)
    ) {
      setSubmitting(false);
      setError("EMAIL_EXISTS");
      return;
    }

    // signUp hands back no session while email confirmation is on, so the
    // browser cannot write the photo or the address itself. The server does
    // both with the service role. Failure is not fatal: the photo is still
    // stashed on this device and retried at first login, and the member can
    // fill the address in from their profile page.
    if (signUpData?.user) {
      await saveSignupDetails(signUpData.user.id, {
        email,
        fatherName,
        address,
        city,
        state,
      });
    }

    // Email confirmation is off, so signUp signs the member in. There is no
    // inbox round trip to wait for and nothing to "check your email" about —
    // take them to their account, where the status page explains that their
    // application is with the admins.
    if (signUpData?.session && signUpData.user) {
      // Belt and braces on the photo: if the server call above did not get
      // through, this member now has a session of their own to upload with.
      await flushPendingAvatar(supabase, signUpData.user.id);

      const outcome = await redeemPendingVipCoupon(supabase, signUpData.user);

      setSubmitting(false);

      if (outcome === "redeemed") {
        setVipNotice("🎉 VIP membership activated!");
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 2000);
        return;
      }

      router.push("/dashboard");
      router.refresh();
      return;
    }

    // Confirmation is still switched on for this project: the account exists
    // but cannot be used until the link in the email is clicked.
    setSubmitting(false);
    setSuccess(true);
  }

  if (vipNotice) {
    return (
      <div className="text-center">
        <h1 className="font-heading text-2xl font-semibold text-navy">
          {vipNotice}
        </h1>
        <p className="mt-3 text-sm text-navy/70">
          Taking you to your dashboard...
        </p>
      </div>
    );
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
        भारतीय नमो संघ में शामिल हों
      </h1>
      <p className="text-center text-sm text-navy/60 mt-1">
        Join Bhartiya Namo Sangh
      </p>

      <button
        type="button"
        onClick={handleGoogleSignup}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-md border border-saffron-200 px-4 py-2.5 text-sm font-medium text-navy hover:bg-saffron-50 transition-colors"
      >
        <GoogleIcon />
        Google से जुड़ें / Continue with Google
      </button>

      <div className="mt-6 flex items-center gap-3">
        <div className="flex-1 border-t border-saffron-100" />
        <span className="text-xs text-navy/40">या फ़ॉर्म भरें / OR fill in the form</span>
        <div className="flex-1 border-t border-saffron-100" />
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* Profile Photo Upload */}
        <div className="rounded-lg border-2 border-dashed border-saffron-300 bg-saffron-50/50 p-4">
          <label className="block text-sm font-medium text-navy/80 mb-2">
            <span className="block">प्रोफ़ाइल फ़ोटो <span className="text-red-600">*</span></span>
            <span className="text-xs text-navy/60">Profile Photo (Required)</span>
          </label>
          <div className="flex items-center gap-4">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Preview"
                className="h-20 w-20 rounded-full object-cover border-2 border-saffron-300"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-saffron-200 flex items-center justify-center text-saffron-600">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoBusy}
                className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                  photoPreview
                    ? "border-saffron-300 text-navy hover:bg-saffron-100"
                    : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                {photoBusy
                  ? "Processing..."
                  : photoPreview
                  ? "Change Photo"
                  : "Upload Photo"}
              </button>
              <p className="mt-1 text-xs text-navy/50">
                JPG, PNG or WebP. Max {AVATAR_MAX_MB}MB.
              </p>
              {photoError && (
                <p className="mt-1 text-xs text-red-600">{photoError}</p>
              )}
              {!photoPreview && !photoError && (
                <p className="mt-1 text-xs text-red-600">Photo is required for membership</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-navy/80 mb-1"
            >
              <span className="block">प्रथम नाम</span>
              <span className="text-xs text-navy/60">First Name</span>
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
              <span className="block">अंतिम नाम</span>
              <span className="text-xs text-navy/60">Last Name</span>
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
            htmlFor="fatherName"
            className="block text-sm font-medium text-navy/80 mb-1"
          >
            <span className="block">पिता/माता/पति का नाम</span>
            <span className="text-xs text-navy/60">
              Father&apos;s / Mother&apos;s / Husband&apos;s Name
            </span>
          </label>
          <input
            id="fatherName"
            name="fatherName"
            required
            className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-navy/80 mb-1"
          >
            <span className="block">ईमेल</span>
            <span className="text-xs text-navy/60">Email</span>
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
            <span className="block">मोबाइल नंबर</span>
            <span className="text-xs text-navy/60">Phone</span>
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
            htmlFor="address"
            className="block text-sm font-medium text-navy/80 mb-1"
          >
            <span className="block">पूर्ण पता</span>
            <span className="text-xs text-navy/60">Full Address</span>
          </label>
          <textarea
            id="address"
            name="address"
            required
            rows={2}
            className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StateDistrictSelect
            value={location}
            onChange={handleLocationChange}
            stateId="state"
            stateName="state"
            districtId="city"
            districtName="city"
            required
            labelClassName="block text-sm font-medium text-navy/80 mb-1"
            fieldClassName="w-full rounded-md border border-saffron-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
            stateLabel={
              <>
                <span className="block">राज्य</span>
                <span className="text-xs text-navy/60">State</span>
              </>
            }
            districtLabel={
              <>
                <span className="block">जिला</span>
                <span className="text-xs text-navy/60">District</span>
              </>
            }
          />
        </div>

        <BranchSelect
          branches={branches}
          loading={branchesLoading}
          state={location.state}
          value={branchId}
          onChange={(id) => {
            setBranchId(id);
            setBranchPicked(true);
          }}
        />

        {/* VIP Code Toggle */}
        <div className="border-t border-saffron-100 pt-4">
          <button
            type="button"
            onClick={() => setShowVipCode(!showVipCode)}
            className="text-sm font-medium text-saffron-700 hover:text-saffron-800 flex items-center gap-1"
          >
            <span>{showVipCode ? "−" : "+"}</span>
            <span>Have a VIP Code?</span>
          </button>

          {showVipCode && (
            <div className="mt-3 rounded-lg border border-purple-200 bg-purple-50 p-4">
              <label className="block text-sm font-medium text-purple-800 mb-2">
                Enter your VIP Code
              </label>
              <input
                type="text"
                value={vipCode}
                onChange={(e) => setVipCode(e.target.value.toUpperCase())}
                placeholder="VIP-XXXXXX"
                className="w-full rounded-md border border-purple-300 px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              {vipCode.trim() && (
                <p className="mt-2 text-xs text-purple-700">
                  Your VIP code will grant you membership automatically — no tier selection or payment needed.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Membership Type Selection - hidden when VIP code is entered */}
        {!(showVipCode && vipCode.trim()) && (
          <MembershipTierPicker value={membershipType} onChange={setMembershipType} />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-navy/80 mb-1"
            >
              <span className="block">पासवर्ड</span>
              <span className="text-xs text-navy/60">Password</span>
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
              <span className="block">पुष्टि करें</span>
              <span className="text-xs text-navy/60">Confirm</span>
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

        <MembershipDeclaration accepted={declarationAccepted} onChange={setDeclarationAccepted} />

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
          <div className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
            {error === "EMAIL_EXISTS" ? (
              <>
                An account with this email already exists. Please{" "}
                <Link
                  href="/auth/login"
                  className="font-medium underline hover:text-red-700"
                >
                  log in instead
                </Link>
                .
              </>
            ) : (
              error
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || photoBusy}
          className="w-full rounded-md bg-saffron-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800 transition-colors disabled:opacity-60"
        >
          {submitting ? "Creating account..." : "Create Account / खाता बनाएं"}
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
