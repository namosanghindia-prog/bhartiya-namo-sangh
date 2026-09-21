"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Branch } from "@/lib/supabase/types";
import StateDistrictSelect, { type StateDistrict } from "@/components/StateDistrictSelect";
import BranchSelect, { branchesInState } from "@/components/BranchSelect";
import GoogleIcon from "@/components/GoogleIcon";
import MembershipDeclaration from "@/components/MembershipDeclaration";
import PhotoPicker from "@/components/signup/PhotoPicker";
import {
  MEMBERSHIP_SHARED_BENEFITS,
  MEMBERSHIP_TIERS,
  type MembershipTier,
} from "@/lib/membership-tiers";
import { clearPendingAvatar, flushPendingAvatar } from "@/lib/pending-avatar";
import { redeemPendingVipCoupon } from "@/lib/vip-coupon";

const STEPS = [
  { en: "Personal", hi: "व्यक्तिगत" },
  { en: "Location", hi: "स्थान" },
  { en: "Membership", hi: "सदस्यता" },
  { en: "Account", hi: "खाता" },
  { en: "Confirm", hi: "पुष्टि" },
] as const;

const FIELD =
  "w-full min-h-11 rounded-xl border border-navy/15 bg-white px-4 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-saffron-400";
const LABEL = "mb-1 block text-sm font-medium text-navy/80";

function isValidMobile(value: string) {
  return /^[6-9]\d{9}$/.test(value.replace(/\D/g, ""));
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [vipNotice, setVipNotice] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<StateDistrict>({ state: "", district: "" });
  const [branchId, setBranchId] = useState("");
  const [branchPicked, setBranchPicked] = useState(false);
  const [membershipType, setMembershipType] = useState<MembershipTier>("volunteer");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [vipCode, setVipCode] = useState("");
  const [vipApplied, setVipApplied] = useState(false);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoType, setPhotoType] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);

  const hasVip = vipApplied && vipCode.trim().length > 0;
  const localBranches = branchesInState(branches, location.state);

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

  function handleLocationChange(next: StateDistrict) {
    setLocation(next);
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
        redirectTo: window.location.origin + "/auth/callback?redirect=/auth/complete-application",
      },
    });
    if (oauthError) setError(oauthError.message);
  }

  function validateStep(current: number): string | null {
    if (current === 0) {
      if (!photoPreview) return "Please upload a clear recent photograph.";
      if (!firstName.trim()) return "Please enter your first name.";
      if (!lastName.trim()) return "Please enter your last name.";
      if (!fatherName.trim()) return "Please enter your father/mother/husband name.";
    }
    if (current === 1) {
      if (!email.trim() || !email.includes("@")) return "Please enter a valid email address.";
      if (!isValidMobile(phone)) return "Please enter a valid 10-digit mobile number.";
      if (!address.trim()) return "Please enter your full address.";
      if (!location.state) return "Please select your state.";
      if (!location.district) return "Please select your district.";
      if (!branchId) return "Please select a branch.";
    }
    if (current === 2 && !hasVip && !membershipType) {
      return "Please choose a membership plan.";
    }
    if (current === 3) {
      if (password.length < 8) return "Password must be at least 8 characters.";
      if (password !== confirmPassword) return "Passwords don't match.";
    }
    if (current === 4) {
      if (!declarationAccepted) return "You must accept the declaration to proceed.";
      if (!termsAccepted) return "Please agree to the Terms & Conditions.";
    }
    return null;
  }

  function goNext() {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function handleSubmit() {
    const message = validateStep(4);
    if (message) {
      setError(message);
      return;
    }
    if (!photoPreview) {
      setError("Profile photo is required. Please upload a photo.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const digits = phone.replace(/\D/g, "").slice(-10);
    const membershipFeeAmount = hasVip ? 0 : MEMBERSHIP_TIERS[membershipType].price;

    const supabase = createClient();
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: `+91${digits}`,
          branch_id: branchId || null,
          father_name: fatherName.trim(),
          address: address.trim(),
          city: location.district,
          state: location.state,
          declaration_accepted: true,
          membership_type: hasVip ? null : membershipType,
          membership_fee_amount: membershipFeeAmount,
          vip_coupon_code: hasVip ? vipCode.trim().toUpperCase() : null,
        },
      },
    });

    if (signUpError) {
      setSubmitting(false);
      const msg = signUpError.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("user already")) {
        setSuccess(true);
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

    if (signUpData?.user && (!signUpData.user.identities || signUpData.user.identities.length === 0)) {
      setSubmitting(false);
      setSuccess(true);
      return;
    }

    if (signUpData?.user) {
      try {
        const payload = new FormData();
        payload.set("userId", signUpData.user.id);
        payload.set("email", email);
        payload.set("fatherName", fatherName.trim());
        payload.set("address", address.trim());
        payload.set("city", location.district);
        payload.set("state", location.state);
        if (photoBlob && photoType) payload.set("photo", photoBlob, "avatar");
        const res = await fetch("/api/signup/complete", { method: "POST", body: payload });
        if (res.ok) {
          const result = await res.json();
          if (result?.photoSaved) clearPendingAvatar();
        }
      } catch (err) {
        console.error("[signup] Could not reach /api/signup/complete:", err);
      }
    }

    if (signUpData?.session && signUpData.user) {
      await flushPendingAvatar(supabase, signUpData.user.id);
      const outcome = await redeemPendingVipCoupon(supabase, signUpData.user);
      setSubmitting(false);
      if (outcome === "redeemed") {
        setVipNotice("VIP membership activated.");
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

    setSubmitting(false);
    setSuccess(true);
  }

  if (vipNotice) {
    return (
      <CenteredNote title={vipNotice} body="Taking you to your dashboard…" />
    );
  }

  if (success) {
    return (
      <CenteredNote
        title="Check your email"
        body="If this address can be used for a new account, we sent a confirmation link. If you already have a membership, log in instead."
      />
    );
  }

  return (
    <div className="pb-16">
      <header className="border-b border-navy/8 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="" width={40} height={40} className="h-10 w-10" />
            <span className="font-heading text-lg font-semibold text-navy">Bhartiya Namo Sangh</span>
          </Link>
          <Link href="/auth/login" className="text-sm font-semibold text-saffron-800">
            Already a member? Login
          </Link>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-navy text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/home/community.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/70 to-navy/90" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70">
            Become Part of the Journey
          </p>
          <h1 lang="hi" className="font-devanagari mt-4 text-3xl font-semibold sm:text-5xl">
            भारतीय नमो संघ से जुड़ें
          </h1>
          <p lang="hi" className="font-devanagari mt-4 text-base text-white/80 sm:text-lg">
            राष्ट्रहित, समाजसेवा और जनभागीदारी के लिए अपनी भूमिका निभाइए।
          </p>
        </div>
      </section>

      <div className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-12">
        <aside className="relative hidden overflow-hidden rounded-3xl bg-navy text-white lg:col-span-5 lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/home/youth.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/55 to-navy/20" />
          <div className="relative flex h-full min-h-[640px] flex-col justify-end p-8">
            <p className="font-heading text-3xl font-semibold">Together, We Build Bharat.</p>
            <ul className="mt-6 space-y-3 text-sm text-white/85">
              <li>✓ Serve your community</li>
              <li>✓ Participate in initiatives</li>
              <li>✓ Connect with the organisation</li>
            </ul>
          </div>
        </aside>

        <div className="lg:col-span-7">
          <div className="rounded-3xl bg-white p-6 shadow-[0_12px_40px_rgba(10,25,41,0.08)] sm:p-8">
            <h2 className="font-heading text-2xl font-semibold text-navy">Create Your Membership</h2>
            <ol className="mt-6 flex gap-2 overflow-x-auto text-[11px] uppercase tracking-[0.12em] text-navy/40">
              {STEPS.map((item, i) => (
                <li key={item.en} className="flex items-center gap-2">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${
                      i === step ? "bg-navy text-white" : i < step ? "bg-saffron-700 text-white" : "bg-navy/10"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={i === step ? "text-navy" : ""}>{item.en}</span>
                  {i < STEPS.length - 1 ? <span className="hidden w-6 border-t border-navy/15 sm:block" /> : null}
                </li>
              ))}
            </ol>

            <div className="mt-8">
              {step === 0 ? (
                <div className="space-y-4">
                  <PhotoPicker
                    preview={photoPreview}
                    error={photoError}
                    busy={photoBusy}
                    onBusy={setPhotoBusy}
                    onError={setPhotoError}
                    onChange={(preview, blob, type) => {
                      setPhotoPreview(preview);
                      setPhotoBlob(blob);
                      setPhotoType(type);
                    }}
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="First name" hi="प्रथम नाम" htmlFor="firstName">
                      <input id="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={FIELD} autoComplete="given-name" />
                    </Field>
                    <Field label="Last name" hi="अंतिम नाम" htmlFor="lastName">
                      <input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} className={FIELD} autoComplete="family-name" />
                    </Field>
                  </div>
                  <Field label="Father / Mother / Husband name" hi="पिता/माता/पति का नाम" htmlFor="fatherName">
                    <input id="fatherName" required value={fatherName} onChange={(e) => setFatherName(e.target.value)} className={FIELD} />
                  </Field>
                  <button
                    type="button"
                    onClick={handleGoogleSignup}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-navy/15 px-4 py-2.5 text-sm font-medium text-navy hover:bg-[#f6f4f0]"
                  >
                    <GoogleIcon />
                    Continue with Google
                  </button>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-4">
                  <Field label="Email" hi="ईमेल" htmlFor="email">
                    <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={FIELD} autoComplete="email" inputMode="email" />
                  </Field>
                  <Field label="Mobile number" hi="मोबाइल नंबर" htmlFor="phone">
                    <div className="flex">
                      <span className="inline-flex min-h-11 items-center rounded-l-xl border border-r-0 border-navy/15 bg-[#f6f4f0] px-3 text-sm text-navy/70">
                        +91
                      </span>
                      <input
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="9876543210"
                        className={`${FIELD} rounded-l-none`}
                      />
                    </div>
                  </Field>
                  <Field label="Full address" hi="पूर्ण पता" htmlFor="address">
                    <textarea id="address" required rows={3} value={address} onChange={(e) => setAddress(e.target.value)} className={`${FIELD} py-3`} />
                  </Field>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <StateDistrictSelect
                      value={location}
                      onChange={handleLocationChange}
                      stateId="state"
                      stateName="state"
                      districtId="city"
                      districtName="city"
                      required
                      labelClassName={LABEL}
                      fieldClassName={FIELD}
                      stateLabel={<>State · राज्य</>}
                      districtLabel={<>District · जिला</>}
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
                  {location.state && !branchesLoading && localBranches.length === 0 ? (
                    <p className="text-sm text-navy/60">
                      Don&apos;t see your branch?{" "}
                      <Link href="/contact" className="font-semibold text-saffron-800 underline-offset-4 hover:underline">
                        Request a new branch
                      </Link>
                    </p>
                  ) : null}
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-navy/10 p-4">
                    <p className="text-sm font-medium text-navy">Have an invitation code?</p>
                    <div className="mt-3 flex gap-2">
                      <input
                        value={vipCode}
                        onChange={(e) => {
                          setVipCode(e.target.value.toUpperCase());
                          setVipApplied(false);
                        }}
                        placeholder="VIP / Referral code"
                        className={FIELD}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!vipCode.trim()) return;
                          setVipApplied(true);
                        }}
                        className="shrink-0 rounded-xl bg-navy px-4 text-sm font-semibold text-white"
                      >
                        Apply
                      </button>
                    </div>
                    {hasVip ? (
                      <p className="mt-2 text-sm text-navy/70">
                        Code saved. It will be checked when your account is created. No plan or payment is needed if it is valid.
                      </p>
                    ) : null}
                  </div>

                  {hasVip ? null : (
                    <>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {(Object.keys(MEMBERSHIP_TIERS) as MembershipTier[]).map((tier) => {
                          const info = MEMBERSHIP_TIERS[tier];
                          const selected = membershipType === tier;
                          return (
                            <button
                              key={tier}
                              type="button"
                              onClick={() => setMembershipType(tier)}
                              className={`rounded-2xl border p-5 text-left ${
                                selected ? "border-saffron-700 bg-saffron-50" : "border-navy/10 hover:border-navy/25"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-navy/50">
                                  {info.name}
                                </span>
                                {tier === "lifetime" ? (
                                  <span className="rounded-full bg-navy px-2 py-0.5 text-[10px] font-semibold text-white">
                                    Best value
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-2 font-heading text-2xl font-semibold text-navy">
                                ₹{info.price.toLocaleString("en-IN")}
                                <span className="ml-1 text-sm font-normal text-navy/50">{info.period}</span>
                              </p>
                              <p lang="hi" className="font-devanagari text-sm text-navy/55">{info.nameHi}</p>
                              <p className="mt-2 text-sm leading-relaxed text-navy/70">{info.blurbEn}</p>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-sm text-navy/55">
                        All four plans confer membership. They differ in the contribution and whether it is annual or one-time.
                      </p>
                      <button
                        type="button"
                        onClick={() => setCompareOpen(true)}
                        className="text-sm font-semibold text-saffron-800 underline-offset-4 hover:underline"
                      >
                        Compare memberships
                      </button>
                    </>
                  )}
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-4">
                  <Field label="Password" hi="पासवर्ड" htmlFor="password">
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        className={`${FIELD} pr-20`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-navy/55"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </Field>
                  <Field label="Confirm password" hi="पुष्टि करें" htmlFor="confirmPassword">
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      className={FIELD}
                    />
                  </Field>
                  <p className="text-xs text-navy/50">At least 8 characters, with a mix of letters and numbers.</p>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="space-y-5">
                  <MembershipDeclaration accepted={declarationAccepted} onChange={setDeclarationAccepted} />
                  <label className="flex items-start gap-2 text-sm text-navy/80">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5"
                    />
                    I agree to the organisation&apos;s membership process and rules.
                  </label>
                  <label className="flex items-start gap-2 text-sm text-navy/80">
                    <input type="checkbox" className="mt-0.5" />
                    I would like to receive official updates and newsletters.
                  </label>
                </div>
              ) : null}
            </div>

            {error ? (
              <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="sticky bottom-0 mt-8 flex gap-3 border-t border-navy/8 bg-white pt-4">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep((s) => s - 1);
                  }}
                  className="min-h-12 flex-1 rounded-full border border-navy/15 text-sm font-semibold text-navy"
                >
                  Back
                </button>
              ) : null}
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={photoBusy}
                  className="min-h-12 flex-[2] rounded-full bg-saffron-700 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-60"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || photoBusy}
                  className="min-h-12 flex-[2] rounded-full bg-saffron-700 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-60"
                >
                  {submitting ? "Creating account…" : "Complete registration"}
                </button>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-navy/45">
            Official BNMS membership process. Your application is reviewed after you register. HTTPS and account passwords are used to protect sign-in.
          </p>
        </div>
      </div>

      <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
        <h2 className="font-heading text-2xl font-semibold text-navy">After you join</h2>
        <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[
            { n: "01", t: "Registration", d: "Complete your application." },
            { n: "02", t: "Verification", d: "The organisation reviews your information." },
            { n: "03", t: "Confirmation", d: "You receive membership confirmation." },
            { n: "04", t: "Participate", d: "Connect with your branch and take part in activities." },
          ].map((item) => (
            <li key={item.n} className="rounded-2xl bg-white p-5">
              <p className="text-xs tracking-[0.2em] text-saffron-800">{item.n}</p>
              <p className="mt-2 font-heading text-lg font-semibold text-navy">{item.t}</p>
              <p className="mt-1 text-sm text-navy/60">{item.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4 pb-8 text-center sm:px-6">
        <p className="font-heading text-xl text-navy">Not ready to become a member?</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/contact" className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy">
            Volunteer your time
          </Link>
          <Link href="/contact" className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy">
            Contact us
          </Link>
          <Link href="/about" className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white">
            Explore BNMS
          </Link>
        </div>
      </section>

      {compareOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-navy/50 p-4 sm:items-center">
          <div role="dialog" aria-modal="true" className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-xl font-semibold text-navy">Compare memberships</h3>
              <button type="button" onClick={() => setCompareOpen(false)} className="text-sm font-semibold">
                Close
              </button>
            </div>
            <p className="mt-3 text-sm text-navy/60">
              Every plan is membership in BNMS. They differ in contribution and duration.
            </p>
            <table className="mt-6 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-navy/10 text-navy/50">
                  <th className="py-2 font-medium"> </th>
                  {(Object.keys(MEMBERSHIP_TIERS) as MembershipTier[]).map((tier) => (
                    <th key={tier} className="py-2 font-medium">{MEMBERSHIP_TIERS[tier].name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MEMBERSHIP_SHARED_BENEFITS.map((row) => (
                  <tr key={row.en} className="border-b border-navy/5">
                    <td className="py-2 pr-3 text-navy/70">{row.en}</td>
                    {(Object.keys(MEMBERSHIP_TIERS) as MembershipTier[]).map((tier) => (
                      <td key={tier} className="py-2">✓</td>
                    ))}
                  </tr>
                ))}
                <tr className="border-b border-navy/5">
                  <td className="py-2 pr-3 text-navy/70">Contribution</td>
                  {(Object.keys(MEMBERSHIP_TIERS) as MembershipTier[]).map((tier) => (
                    <td key={tier} className="py-2">
                      ₹{MEMBERSHIP_TIERS[tier].price.toLocaleString("en-IN")}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 pr-3 text-navy/70">Duration</td>
                  {(Object.keys(MEMBERSHIP_TIERS) as MembershipTier[]).map((tier) => (
                    <td key={tier} className="py-2">{MEMBERSHIP_TIERS[tier].period}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  hi,
  htmlFor,
  children,
}: {
  label: string;
  hi: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={LABEL}>
        <span className="block">{label}</span>
        <span lang="hi" className="font-devanagari text-xs text-navy/50">{hi}</span>
      </label>
      {children}
    </div>
  );
}

function CenteredNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
        <h1 className="font-heading text-2xl font-semibold text-navy">{title}</h1>
        <p className="mt-3 text-sm text-navy/70">{body}</p>
        <Link href="/auth/login" className="mt-6 inline-block text-sm font-semibold text-saffron-800">
          Login
        </Link>
      </div>
    </div>
  );
}
