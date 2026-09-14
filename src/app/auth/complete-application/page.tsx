"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Branch } from "@/lib/supabase/types";
import { AVATAR_ACCEPTED_TYPES, AVATAR_MAX_BYTES, AVATAR_MAX_MB } from "@/lib/avatar";
import { blobToDataUrl, shrinkImage } from "@/lib/image";
import { canonicalStateName } from "@/lib/india-locations";
import type { MembershipTier } from "@/lib/membership-tiers";
import { redeemPendingVipCoupon } from "@/lib/vip-coupon";
import BranchSelect, { branchesInState } from "@/components/BranchSelect";
import MembershipDeclaration from "@/components/MembershipDeclaration";
import MembershipTierPicker from "@/components/MembershipTierPicker";
import StateDistrictSelect, { type StateDistrict } from "@/components/StateDistrictSelect";

/**
 * The rest of the membership application, for accounts made with "Continue
 * with Google". Google supplies a name and an email; everything else the email
 * form asks for is asked for here, and the proxy keeps the member on this page
 * until it has been sent.
 */

const inputClass =
  "w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400";
const labelClass = "block text-sm font-medium text-navy/80 mb-1";

type Fields = {
  firstName: string;
  lastName: string;
  fatherName: string;
  phone: string;
  address: string;
};

/** Google's profile name, split the way the form asks for it. */
function nameFromGoogle(user: User): { first: string; last: string } {
  const meta = user.user_metadata ?? {};
  const full = String(meta.full_name ?? meta.name ?? "").trim();
  const words = full.split(/\s+/).filter(Boolean);
  return {
    first: String(meta.given_name ?? "").trim() || words[0] || "",
    last: String(meta.family_name ?? "").trim() || words.slice(1).join(" "),
  };
}

export default function CompleteApplicationPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [fields, setFields] = useState<Fields>({
    firstName: "",
    lastName: "",
    fatherName: "",
    phone: "",
    address: "",
  });
  const [location, setLocation] = useState<StateDistrict>({ state: "", district: "" });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("");
  const [branchPicked, setBranchPicked] = useState(false);
  const [membershipType, setMembershipType] = useState<MembershipTier>("volunteer");
  const [showVipCode, setShowVipCode] = useState(false);
  const [vipCode, setVipCode] = useState("");
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [photo, setPhoto] = useState<{ blob: Blob; preview: string } | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!user) {
        router.replace("/auth/login?redirect=/auth/complete-application");
        return;
      }

      const [memberRes, branchesRes] = await Promise.all([
        supabase
          .from("members")
          .select("first_name, last_name, phone, father_name, address, city, state, branch_id, status, declaration_accepted")
          .eq("id", user.id)
          .maybeSingle(),
        supabase.from("branches").select("*").eq("is_active", true).order("name"),
      ]);
      if (cancelled) return;

      const member = memberRes.data;
      if (member && (member.declaration_accepted || member.status !== "pending")) {
        router.replace("/dashboard");
        return;
      }

      // handle_new_user() names a member "New Member" when the auth metadata
      // carries no first/last name, which is always the case with Google.
      const hasPlaceholderName =
        !member || (member.first_name === "New" && member.last_name === "Member");
      const google = nameFromGoogle(user);

      setEmail(user.email ?? "");
      setFields({
        firstName: hasPlaceholderName ? google.first : member.first_name,
        lastName: hasPlaceholderName ? google.last : member.last_name,
        fatherName: member?.father_name ?? "",
        phone: member?.phone ?? "",
        address: member?.address ?? "",
      });
      setLocation({
        state: canonicalStateName(member?.state),
        district: member?.city ?? "",
      });
      setBranchId(member?.branch_id ?? "");
      setBranches((branchesRes.data as Branch[] | null) ?? []);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function set<K extends keyof Fields>(key: K, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function handleLocationChange(next: StateDistrict) {
    setLocation(next);
    // Every state has its own office: preselect it when the state has exactly one.
    if (!branchPicked && next.state !== location.state) {
      const local = branchesInState(branches, next.state);
      setBranchId(local.length === 1 ? local[0].id : "");
    }
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Let the same file be picked again after a rejection.
    e.target.value = "";
    if (!file) return;
    setError(null);

    if (!AVATAR_ACCEPTED_TYPES.includes(file.type)) {
      setError("Please select a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setError(
        `यह फ़ोटो ${sizeMb}MB की है। अधिकतम ${AVATAR_MAX_MB}MB की फ़ोटो ही अपलोड करें। / This photo is ${sizeMb}MB. Please choose an image under ${AVATAR_MAX_MB}MB.`
      );
      return;
    }

    setPhotoBusy(true);
    try {
      const { blob } = await shrinkImage(file);
      setPhoto({ blob, preview: await blobToDataUrl(blob) });
    } catch (err) {
      console.error("[complete-application] Could not read the selected photo:", err);
      setError("Could not read that image. Please try another photo.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.replace("/auth/login");
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!photo) {
      setError("Profile photo is required. Please upload a photo.");
      return;
    }
    if (!declarationAccepted) {
      setError("You must accept the declaration to proceed.");
      return;
    }

    setSubmitting(true);
    const code = showVipCode ? vipCode.trim().toUpperCase() : "";

    const payload = new FormData();
    for (const [key, value] of Object.entries(fields)) payload.set(key, value);
    payload.set("state", location.state);
    payload.set("city", location.district);
    payload.set("branch", branchId);
    payload.set("membershipType", membershipType);
    payload.set("vipCode", code);
    payload.set("declaration", "true");
    payload.set("photo", photo.blob, "avatar");

    try {
      const res = await fetch("/api/signup/complete-application", {
        method: "POST",
        body: payload,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error ?? "Could not submit your application. Please try again.");
        setSubmitting(false);
        return;
      }
    } catch {
      setError("Could not reach the server. Please try again.");
      setSubmitting(false);
      return;
    }

    if (code) {
      // The VIP redemption runs as the member, from the code on their metadata,
      // exactly as it does after an email signup.
      const supabase = createClient();
      const { data } = await supabase.auth.updateUser({ data: { vip_coupon_code: code } });
      const outcome = data.user ? await redeemPendingVipCoupon(supabase, data.user) : "none";

      if (outcome !== "none") {
        setNotice(
          outcome === "redeemed"
            ? "🎉 VIP membership activated!"
            : "This VIP code is invalid or already used. Your application will go through standard review."
        );
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }
    }

    router.replace("/dashboard");
    router.refresh();
  }

  if (loading) {
    return <div className="text-center text-navy/60">Loading...</div>;
  }

  if (notice) {
    return (
      <div className="text-center">
        <h1 className="font-heading text-xl font-semibold text-navy">{notice}</h1>
        <p className="mt-3 text-sm text-navy/70">Taking you to your dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-heading text-2xl font-semibold text-navy text-center">
        आवेदन पूरा करें
      </h1>
      <p className="text-center text-sm text-navy/60 mt-1">Complete your membership application</p>
      <p className="mt-4 rounded-md bg-saffron-50 px-3 py-2 text-center text-xs text-navy/70">
        Google से <span className="font-medium text-navy">{email}</span> के रूप में जुड़े हैं। कुछ और
        जानकारी भरें, फिर आपका आवेदन समीक्षा के लिए भेजा जाएगा।
        <br />
        Signed in with Google. A few more details and your application goes to our team for review.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="rounded-lg border-2 border-dashed border-saffron-300 bg-saffron-50/50 p-4">
          <label className="block text-sm font-medium text-navy/80 mb-2">
            <span className="block">
              प्रोफ़ाइल फ़ोटो <span className="text-red-600">*</span>
            </span>
            <span className="text-xs text-navy/60">Profile Photo (Required)</span>
          </label>
          <div className="flex items-center gap-4">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element -- a local data: URL preview
              <img
                src={photo.preview}
                alt="Preview"
                className="h-20 w-20 rounded-full object-cover border-2 border-saffron-300"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-saffron-200" />
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
                  photo
                    ? "border-saffron-300 text-navy hover:bg-saffron-100"
                    : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                {photoBusy ? "Processing..." : photo ? "Change Photo" : "Upload Photo"}
              </button>
              <p className="mt-1 text-xs text-navy/50">JPG, PNG or WebP. Max {AVATAR_MAX_MB}MB.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className={labelClass}>
              <span className="block">प्रथम नाम</span>
              <span className="text-xs text-navy/60">First Name</span>
            </label>
            <input
              id="firstName"
              required
              maxLength={60}
              value={fields.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="lastName" className={labelClass}>
              <span className="block">अंतिम नाम</span>
              <span className="text-xs text-navy/60">Last Name</span>
            </label>
            <input
              id="lastName"
              required
              maxLength={60}
              value={fields.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="fatherName" className={labelClass}>
            <span className="block">पिता/माता/पति का नाम</span>
            <span className="text-xs text-navy/60">
              Father&apos;s / Mother&apos;s / Husband&apos;s Name
            </span>
          </label>
          <input
            id="fatherName"
            required
            maxLength={120}
            value={fields.fatherName}
            onChange={(e) => set("fatherName", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="phone" className={labelClass}>
            <span className="block">मोबाइल नंबर</span>
            <span className="text-xs text-navy/60">Phone</span>
          </label>
          <input
            id="phone"
            type="tel"
            required
            maxLength={20}
            placeholder="+91 98765 43210"
            autoComplete="tel"
            value={fields.phone}
            onChange={(e) => set("phone", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="address" className={labelClass}>
            <span className="block">पूर्ण पता</span>
            <span className="text-xs text-navy/60">Full Address</span>
          </label>
          <textarea
            id="address"
            required
            rows={2}
            maxLength={500}
            value={fields.address}
            onChange={(e) => set("address", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StateDistrictSelect
            value={location}
            onChange={handleLocationChange}
            stateId="state"
            districtId="city"
            required
            labelClassName={labelClass}
            fieldClassName={`${inputClass} bg-white`}
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
          loading={false}
          state={location.state}
          value={branchId}
          onChange={(id) => {
            setBranchId(id);
            setBranchPicked(true);
          }}
        />

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
              <label htmlFor="vipCode" className="block text-sm font-medium text-purple-800 mb-2">
                Enter your VIP Code
              </label>
              <input
                id="vipCode"
                type="text"
                value={vipCode}
                onChange={(e) => setVipCode(e.target.value.toUpperCase())}
                placeholder="VIP-XXXXXX"
                className="w-full rounded-md border border-purple-300 px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          )}
        </div>

        {!(showVipCode && vipCode.trim()) && (
          <MembershipTierPicker value={membershipType} onChange={setMembershipType} />
        )}

        <MembershipDeclaration accepted={declarationAccepted} onChange={setDeclarationAccepted} />

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting || photoBusy}
          className="w-full rounded-md bg-saffron-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800 transition-colors disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "आवेदन भेजें / Submit Application"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-navy/70">
        Not you?{" "}
        <button
          type="button"
          onClick={handleSignOut}
          className="font-medium text-saffron-700 hover:text-saffron-800"
        >
          Sign out
        </button>
      </p>
    </>
  );
}
