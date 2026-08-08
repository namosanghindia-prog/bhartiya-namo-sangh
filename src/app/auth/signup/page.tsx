"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
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
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [membershipType, setMembershipType] = useState<"volunteer" | "normal" | "premium" | "lifetime">("volunteer");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MEMBERSHIP_TIERS = {
    volunteer: { name: "Volunteer", nameHi: "स्वयंसेवक", price: 101, period: "/year", periodHi: "/वर्ष" },
    normal: { name: "Normal", nameHi: "सामान्य", price: 1100, period: "/year", periodHi: "/वर्ष" },
    premium: { name: "Premium", nameHi: "प्रीमियम", price: 11000, period: "/year", periodHi: "/वर्ष" },
    lifetime: { name: "Lifetime", nameHi: "आजीवन", price: 99999, period: "one-time", periodHi: "एकमुश्त" },
  };

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

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPhotoError(null);

    if (!file) {
      setPhotoPreview(null);
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setPhotoError("Please select a JPG, PNG, or WebP image");
      setPhotoPreview(null);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("Image must be less than 2MB");
      setPhotoPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPhotoPreview(dataUrl);
      sessionStorage.setItem("pending_avatar", dataUrl);
      sessionStorage.setItem("pending_avatar_type", file.type);
    };
    reader.readAsDataURL(file);
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

    const membershipFeeAmount = MEMBERSHIP_TIERS[membershipType].price;

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
          membership_type: membershipType,
          membership_fee_amount: membershipFeeAmount,
        },
      },
    });

    setSubmitting(false);

    if (signUpError) {
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
      setError("EMAIL_EXISTS");
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
        भारतीय नमो संघ में शामिल हों
      </h1>
      <p className="text-center text-sm text-navy/60 mt-1">
        Join Bhartiya Namo Sangh
      </p>

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
                className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                  photoPreview
                    ? "border-saffron-300 text-navy hover:bg-saffron-100"
                    : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                {photoPreview ? "Change Photo" : "Upload Photo"}
              </button>
              <p className="mt-1 text-xs text-navy/50">JPG, PNG or WebP. Max 2MB.</p>
              {photoError && (
                <p className="mt-1 text-xs text-red-600">{photoError}</p>
              )}
              {!photoPreview && !photoError && (
                <p className="mt-1 text-xs text-red-600">Photo is required for membership</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
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
            <span className="block">पिता/पति का नाम</span>
            <span className="text-xs text-navy/60">Father&apos;s / Husband&apos;s Name</span>
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="city"
              className="block text-sm font-medium text-navy/80 mb-1"
            >
              <span className="block">जिला</span>
              <span className="text-xs text-navy/60">District</span>
            </label>
            <input
              id="city"
              name="city"
              required
              className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
          </div>
          <div>
            <label
              htmlFor="state"
              className="block text-sm font-medium text-navy/80 mb-1"
            >
              <span className="block">राज्य</span>
              <span className="text-xs text-navy/60">State</span>
            </label>
            <input
              id="state"
              name="state"
              required
              className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="branch"
            className="block text-sm font-medium text-navy/80 mb-1"
          >
            <span className="block">शाखा चुनें</span>
            <span className="text-xs text-navy/60">Select your Branch</span>
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

        {/* Membership Type Selection */}
        <div>
          <label className="block text-sm font-medium text-navy/80 mb-2">
            <span className="block">सदस्यता प्रकार चुनें</span>
            <span className="text-xs text-navy/60">Select Membership Type</span>
          </label>
          <div className="grid grid-cols-1 gap-3">
            {(Object.keys(MEMBERSHIP_TIERS) as Array<keyof typeof MEMBERSHIP_TIERS>).map((tier) => {
              const info = MEMBERSHIP_TIERS[tier];
              const isSelected = membershipType === tier;
              const isLifetime = tier === "lifetime";
              const isPremium = tier === "premium";
              return (
                <label
                  key={tier}
                  className={`relative flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-all ${
                    isSelected
                      ? isLifetime
                        ? "border-gold bg-gold/5"
                        : isPremium
                        ? "border-saffron-500 bg-saffron-50"
                        : "border-saffron-400 bg-saffron-50"
                      : "border-saffron-200 hover:border-saffron-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="membershipType"
                    value={tier}
                    checked={isSelected}
                    onChange={() => setMembershipType(tier)}
                    className="sr-only"
                  />
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected
                      ? isLifetime
                        ? "border-gold"
                        : "border-saffron-600"
                      : "border-saffron-300"
                  }`}>
                    {isSelected && (
                      <div className={`h-2.5 w-2.5 rounded-full ${
                        isLifetime ? "bg-gold" : "bg-saffron-600"
                      }`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${
                        isLifetime ? "text-gold" : isPremium ? "text-saffron-700" : "text-navy"
                      }`}>
                        {info.nameHi} / {info.name}
                      </span>
                      {isLifetime && (
                        <span className="text-[10px] bg-gold/20 text-gold px-1.5 py-0.5 rounded font-medium">
                          BEST VALUE
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-navy/70">
                      <span className="font-semibold text-navy">₹{info.price.toLocaleString("en-IN")}</span>
                      <span className="text-xs"> {info.period}</span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
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

        {/* Declaration Section */}
        <div className="rounded-lg border border-saffron-300 bg-saffron-50 p-4 mt-6">
          <h3 className="font-heading text-sm font-semibold text-navy mb-2">
            घोषणा / Declaration
          </h3>
          <p className="text-sm text-navy/80 leading-relaxed mb-3">
            मैं भारतीय नमो संघ की विचारधारा, उद्देश्यों एवं संविधान का पूर्ण सम्मान
            करते हुए संगठन के नियमों का पालन करने का संकल्प लेता/लेती हूँ। मुझे
            विश्वास है कि यदि मुझे संगठन में मेरी योग्यता एवं क्षमता के अनुरूप किसी
            पद पर सेवा करने का अवसर प्रदान किया जाता है, तो मैं पूर्ण निष्ठा,
            ईमानदारी एवं समर्पण के साथ अपने दायित्वों का निर्वहन करूँगा/करूँगी तथा
            संगठन के विस्तार एवं समाजहित के कार्यों में सक्रिय योगदान दूँगा/दूँगी।
          </p>
          <p className="text-xs text-navy/60 italic mb-4">
            I pledge to uphold the organization&apos;s principles and serve with full dedication and integrity.
          </p>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={declarationAccepted}
              onChange={(e) => setDeclarationAccepted(e.target.checked)}
              className="mt-0.5 rounded border-saffron-400 text-saffron-700 focus:ring-saffron-400"
            />
            <span className="text-sm text-navy/80">
              मैं उपरोक्त घोषणा से सहमत हूँ / I agree to the above declaration
            </span>
          </label>
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
          disabled={submitting}
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
