"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Business, BusinessCategory } from "@/lib/supabase/types";

const CATEGORIES: BusinessCategory[] = [
  "Retail", "Services", "Food & Beverage", "Healthcare", "Education",
  "Technology", "Manufacturing", "Real Estate", "Finance", "Other"
];

export default function BusinessPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadBusiness() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setMemberId(user.id);

      const { data } = await supabase
        .from("businesses")
        .select("*")
        .eq("member_id", user.id)
        .single();

      if (data) setBusiness(data);
      setLoading(false);
    }
    loadBusiness();
  }, []);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !memberId) return;

    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: "error", text: "Please select a JPG or PNG image" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Logo must be less than 2MB" });
      return;
    }

    setUploading(true);
    setMessage(null);

    const supabase = createClient();
    const fileExt = file.name.split(".").pop();
    const filePath = `${memberId}/logo.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("business-assets")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setUploading(false);
      setMessage({ type: "error", text: uploadError.message });
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("business-assets")
      .getPublicUrl(filePath);

    setUploading(false);
    return publicUrl;
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!memberId) return;

    setSaving(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);

    let logoUrl: string | null = null;
    const logoFile = (e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement)?.files?.[0];
    if (logoFile) {
      const allowedTypes = ["image/jpeg", "image/png"];
      if (!allowedTypes.includes(logoFile.type)) {
        setMessage({ type: "error", text: "Please select a JPG or PNG image" });
        setSaving(false);
        return;
      }
      if (logoFile.size > 2 * 1024 * 1024) {
        setMessage({ type: "error", text: "Logo must be less than 2MB" });
        setSaving(false);
        return;
      }

      const supabase = createClient();
      const fileExt = logoFile.name.split(".").pop();
      const filePath = `${memberId}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("business-assets")
        .upload(filePath, logoFile, { upsert: true });

      if (uploadError) {
        setMessage({ type: "error", text: uploadError.message });
        setSaving(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("business-assets")
        .getPublicUrl(filePath);
      logoUrl = publicUrl;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("businesses")
      .insert({
        member_id: memberId,
        business_name: formData.get("business_name") as string,
        category: formData.get("category") as BusinessCategory,
        description: formData.get("description") as string || null,
        phone: formData.get("phone") as string || null,
        email: formData.get("email") as string || null,
        website: formData.get("website") as string || null,
        logo_url: logoUrl,
        status: "pending_payment",
      })
      .select()
      .single();

    setSaving(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setBusiness(data);
    setMessage({ type: "success", text: "Business registered! Please complete payment." });
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!business) return;

    setSaving(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);

    const supabase = createClient();
    const { error } = await supabase
      .from("businesses")
      .update({
        business_name: formData.get("business_name") as string,
        category: formData.get("category") as BusinessCategory,
        description: formData.get("description") as string || null,
        phone: formData.get("phone") as string || null,
        email: formData.get("email") as string || null,
        website: formData.get("website") as string || null,
      })
      .eq("id", business.id);

    setSaving(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setMessage({ type: "success", text: "Business details updated!" });
  }

  async function handlePaymentSubmitted() {
    if (!business) return;

    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("businesses")
      .update({ payment_submitted_at: new Date().toISOString() })
      .eq("id", business.id);

    setSaving(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setBusiness({ ...business, payment_submitted_at: new Date().toISOString() });
    setMessage({ type: "success", text: "Payment notification sent! Admin will verify shortly." });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-navy/60">Loading...</div>
      </div>
    );
  }

  // No business yet - show registration form
  if (!business) {
    return (
      <div className="max-w-2xl">
        <h1 className="font-heading text-2xl font-semibold text-navy">
          Register Your Business
        </h1>
        <p className="mt-2 text-sm text-navy/60">
          List your business in our directory for ₹2,000/year
        </p>

        <form onSubmit={handleRegister} className="mt-6 space-y-4 rounded-xl border border-saffron-200 bg-white p-6">
          <div>
            <label className="block text-sm font-medium text-navy/80 mb-1">
              Business Name *
            </label>
            <input
              name="business_name"
              required
              className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy/80 mb-1">
              Category *
            </label>
            <select
              name="category"
              required
              className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy/80 mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy/80 mb-1">
                Phone
              </label>
              <input
                name="phone"
                type="tel"
                className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy/80 mb-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy/80 mb-1">
              Website
            </label>
            <input
              name="website"
              type="url"
              placeholder="https://example.com"
              className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy/80 mb-1">
              Logo
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="w-full text-sm text-navy/70 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-saffron-100 file:text-saffron-800 hover:file:bg-saffron-200"
            />
            <p className="mt-1 text-xs text-navy/50">JPG or PNG, max 2MB</p>
          </div>

          {message && (
            <p className={`text-sm rounded-md px-3 py-2 ${
              message.type === "error" ? "bg-red-50 text-red-600" : "bg-forest/10 text-forest"
            }`}>
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-saffron-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-60"
          >
            {saving ? "Registering..." : "Register Business"}
          </button>
        </form>
      </div>
    );
  }

  // Business pending payment
  if (business.status === "pending_payment") {
    return (
      <div className="max-w-2xl">
        <h1 className="font-heading text-2xl font-semibold text-navy">
          Complete Your Registration
        </h1>
        <p className="mt-2 text-sm text-navy/60">
          Your business &quot;{business.business_name}&quot; is registered. Please complete payment.
        </p>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="font-heading text-lg font-semibold text-amber-800">
            Registration Fee: ₹2,000/year
          </h2>
          <div className="mt-4 space-y-2 text-sm text-amber-800">
            <p><strong>Pay via UPI or Bank Transfer:</strong></p>
            <p>UPI: [placeholder - admin will update]</p>
            <p>Bank: [placeholder - admin will update]</p>
            <p>Account: [placeholder]</p>
            <p>IFSC: [placeholder]</p>
          </div>

          {business.payment_submitted_at ? (
            <div className="mt-6 rounded-md bg-forest/10 px-4 py-3 text-sm text-forest">
              Payment notification sent on {new Date(business.payment_submitted_at).toLocaleDateString("en-IN")}.
              Awaiting admin verification.
            </div>
          ) : (
            <>
              {message && (
                <p className={`mt-4 text-sm rounded-md px-3 py-2 ${
                  message.type === "error" ? "bg-red-50 text-red-600" : "bg-forest/10 text-forest"
                }`}>
                  {message.text}
                </p>
              )}
              <button
                onClick={handlePaymentSubmitted}
                disabled={saving}
                className="mt-6 rounded-md bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {saving ? "Submitting..." : "I've Made the Payment"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Business rejected
  if (business.status === "rejected") {
    return (
      <div className="max-w-2xl">
        <h1 className="font-heading text-2xl font-semibold text-navy">
          Business Registration Rejected
        </h1>
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-800">
            Your business registration was not approved.
          </p>
          {business.rejection_reason && (
            <p className="mt-2 text-sm text-red-700">
              <strong>Reason:</strong> {business.rejection_reason}
            </p>
          )}
          <p className="mt-4 text-sm text-red-700">
            Please <Link href="/contact" className="underline">contact support</Link> for assistance.
          </p>
        </div>
      </div>
    );
  }

  // Business active - show details and edit form
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy">
            My Business
          </h1>
          <p className="mt-1 text-sm text-navy/60">
            Manage your business listing
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-forest/10 px-3 py-1 text-sm font-medium text-forest">
          Active
        </span>
      </div>

      {business.expires_at && (
        <div className="rounded-md bg-saffron-50 border border-saffron-200 px-4 py-3 text-sm text-navy">
          Listing expires: <strong>{new Date(business.expires_at).toLocaleDateString("en-IN")}</strong>
        </div>
      )}

      <form onSubmit={handleUpdate} className="rounded-xl border border-saffron-200 bg-white p-6 space-y-4">
        <div className="flex items-center gap-4 mb-4">
          {business.logo_url ? (
            <img src={business.logo_url} alt="" className="h-16 w-16 rounded-lg object-cover" />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-saffron-100 flex items-center justify-center text-2xl">🏢</div>
          )}
          <div>
            <h2 className="font-heading font-semibold text-navy">{business.business_name}</h2>
            <span className="text-xs bg-saffron-100 text-saffron-800 px-2 py-0.5 rounded-full">
              {business.category}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy/80 mb-1">Business Name</label>
          <input
            name="business_name"
            defaultValue={business.business_name}
            required
            className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-navy/80 mb-1">Category</label>
          <select
            name="category"
            defaultValue={business.category}
            required
            className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy/80 mb-1">Description</label>
          <textarea
            name="description"
            defaultValue={business.description || ""}
            rows={3}
            className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy/80 mb-1">Phone</label>
            <input
              name="phone"
              type="tel"
              defaultValue={business.phone || ""}
              className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy/80 mb-1">Email</label>
            <input
              name="email"
              type="email"
              defaultValue={business.email || ""}
              className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy/80 mb-1">Website</label>
          <input
            name="website"
            type="url"
            defaultValue={business.website || ""}
            className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
          />
        </div>

        {message && (
          <p className={`text-sm rounded-md px-3 py-2 ${
            message.type === "error" ? "bg-red-50 text-red-600" : "bg-forest/10 text-forest"
          }`}>
            {message.text}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <Link
            href="/dashboard/business/promote"
            className="rounded-md border border-saffron-300 px-5 py-2 text-sm font-medium text-saffron-800 hover:bg-saffron-50"
          >
            Request Slider Promotion
          </Link>
        </div>
      </form>
    </div>
  );
}
