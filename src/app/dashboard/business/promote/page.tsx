"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Business, BusinessPromotion } from "@/lib/supabase/types";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  requested: { label: "Requested", color: "bg-blue-100 text-blue-800" },
  approved_awaiting_payment: { label: "Awaiting Payment", color: "bg-amber-100 text-amber-800" },
  payment_submitted: { label: "Payment Submitted", color: "bg-purple-100 text-purple-800" },
  payment_confirmed: { label: "Under Review", color: "bg-indigo-100 text-indigo-800" },
  live: { label: "Live", color: "bg-forest/10 text-forest" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
  expired: { label: "Expired", color: "bg-gray-100 text-gray-600" },
};

export default function PromotePage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [promotions, setPromotions] = useState<BusinessPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number; valid: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [businessRes, promotionsRes] = await Promise.all([
        supabase.from("businesses").select("*").eq("member_id", user.id).single(),
        supabase.from("business_promotions").select("*").eq("member_id", user.id).order("created_at", { ascending: false }),
      ]);

      if (businessRes.data) setBusiness(businessRes.data);
      if (promotionsRes.data) setPromotions(promotionsRes.data);
      setLoading(false);
    }
    loadData();
  }, []);

  async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const dims = { width: img.width, height: img.height };
        URL.revokeObjectURL(img.src);
        resolve(dims);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setImageDimensions(null);
      setImagePreview(null);
      return;
    }

    setMessage(null);
    setImageDimensions(null);

    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: "error", text: "Please select a JPG or PNG image" });
      e.target.value = "";
      return;
    }

    try {
      const dims = await getImageDimensions(file);
      const valid = dims.width === 1920 && dims.height === 800;
      setImageDimensions({ ...dims, valid });

      if (!valid) {
        e.target.value = "";
        setImagePreview(null);
        return;
      }

      setImagePreview(URL.createObjectURL(file));
    } catch {
      setMessage({ type: "error", text: "Failed to read image dimensions" });
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!business) return;

    const formData = new FormData(e.currentTarget);
    const file = (fileInputRef.current?.files)?.[0];

    if (!file) {
      setMessage({ type: "error", text: "Please upload an image" });
      return;
    }

    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Upload image
    const promotionId = `promo-${Date.now()}`;
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${promotionId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("business-assets")
      .upload(filePath, file);

    if (uploadError) {
      setSaving(false);
      setMessage({ type: "error", text: uploadError.message });
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("business-assets")
      .getPublicUrl(filePath);

    // Create promotion record
    const { data, error } = await supabase
      .from("business_promotions")
      .insert({
        business_id: business.id,
        member_id: user.id,
        mobile: formData.get("mobile") as string,
        email: formData.get("email") as string,
        website_link: formData.get("website_link") as string,
        image_url: publicUrl,
        status: "requested",
      })
      .select()
      .single();

    setSaving(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setPromotions([data, ...promotions]);
    setShowForm(false);
    setImagePreview(null);
    setImageDimensions(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMessage({ type: "success", text: "Promotion request submitted! Admin will review shortly." });
  }

  async function handlePaymentSubmitted(promotionId: string) {
    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("business_promotions")
      .update({
        status: "payment_submitted",
        payment_submitted_at: new Date().toISOString(),
      })
      .eq("id", promotionId);

    setSaving(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setPromotions(promotions.map(p =>
      p.id === promotionId
        ? { ...p, status: "payment_submitted", payment_submitted_at: new Date().toISOString() }
        : p
    ));
    setMessage({ type: "success", text: "Payment notification sent!" });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-navy/60">Loading...</div>
      </div>
    );
  }

  if (!business || business.status !== "active") {
    return (
      <div className="max-w-2xl">
        <h1 className="font-heading text-2xl font-semibold text-navy">
          Slider Promotion
        </h1>
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm text-amber-800">
            You need an active business listing to request slider promotions.
          </p>
          <Link
            href="/dashboard/business"
            className="mt-4 inline-block rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Register Your Business
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy">
            Slider Promotions
          </h1>
          <p className="mt-1 text-sm text-navy/60">
            Promote your business on the homepage slider — ₹15,000/month
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
          >
            Request New Promotion
          </button>
        )}
      </div>

      {message && (
        <p className={`text-sm rounded-md px-3 py-2 ${
          message.type === "error" ? "bg-red-50 text-red-600" : "bg-forest/10 text-forest"
        }`}>
          {message.text}
        </p>
      )}

      {/* New Promotion Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-saffron-200 bg-white p-6 space-y-4">
          <h2 className="font-heading text-lg font-semibold text-navy">
            Request New Promotion
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy/80 mb-1">
                Mobile *
              </label>
              <input
                name="mobile"
                type="tel"
                required
                className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy/80 mb-1">
                Email *
              </label>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy/80 mb-1">
              Website Link *
            </label>
            <input
              name="website_link"
              type="url"
              required
              placeholder="https://yourbusiness.com"
              className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy/80 mb-2">
              Promotion Image *
            </label>

            {/* Clear instructions box */}
            <div className="mb-3 rounded-lg border border-saffron-300 bg-saffron-50 p-3">
              <p className="text-sm font-semibold text-saffron-900 mb-1">
                Image Requirements
              </p>
              <ul className="text-sm text-saffron-800 space-y-0.5">
                <li>• Dimensions: exactly <strong>1920 × 800 pixels</strong></li>
                <li>• Format: JPG or PNG only</li>
                <li>• Max size: 3 MB</li>
              </ul>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileSelect}
              required
              className="w-full text-sm text-navy/70 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-saffron-100 file:text-saffron-800 hover:file:bg-saffron-200 cursor-pointer"
            />

            {/* Dimension feedback after file selection */}
            {imageDimensions && (
              <div className={`mt-2 rounded-md px-3 py-2 text-sm ${
                imageDimensions.valid
                  ? "bg-forest/10 text-forest"
                  : "bg-red-50 text-red-700"
              }`}>
                {imageDimensions.valid ? (
                  <>✓ {imageDimensions.width} × {imageDimensions.height}px — looks good</>
                ) : (
                  <>Selected image: {imageDimensions.width} × {imageDimensions.height}px — doesn't match required 1920 × 800px</>
                )}
              </div>
            )}
          </div>

          {imagePreview && (
            <div className="rounded-md overflow-hidden border border-saffron-200">
              <img src={imagePreview} alt="Preview" className="w-full aspect-[2.4/1] object-cover" />
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-60"
            >
              {saving ? "Submitting..." : "Submit Request"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setImagePreview(null);
                setImageDimensions(null);
              }}
              className="rounded-md border border-saffron-300 px-5 py-2 text-sm font-medium text-navy hover:bg-saffron-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Past/Current Promotions */}
      <div className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-navy">
          Your Promotions
        </h2>

        {promotions.length === 0 ? (
          <div className="rounded-xl border border-saffron-200 bg-white p-6 text-center">
            <p className="text-sm text-navy/60">No promotion requests yet.</p>
          </div>
        ) : (
          promotions.map((promo) => (
            <div key={promo.id} className="rounded-xl border border-saffron-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_LABELS[promo.status]?.color || "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABELS[promo.status]?.label || promo.status}
                  </span>
                  <p className="mt-2 text-sm text-navy/70">
                    Requested: {new Date(promo.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
                {promo.image_url && (
                  <img src={promo.image_url} alt="" className="h-16 w-40 rounded object-cover" />
                )}
              </div>

              {/* Status-specific content */}
              {promo.status === "approved_awaiting_payment" && (
                <div className="mt-4 rounded-md bg-amber-50 border border-amber-200 p-4">
                  <p className="text-sm font-medium text-amber-800">
                    Promotion Fee: ₹15,000/month
                  </p>
                  <p className="mt-2 text-sm text-amber-700">
                    Pay within 24 hours of approval.
                    {promo.payment_deadline && (
                      <> Deadline: <strong>{new Date(promo.payment_deadline).toLocaleString("en-IN")}</strong></>
                    )}
                  </p>
                  <div className="mt-3 text-sm text-amber-700">
                    <p>UPI: [placeholder]</p>
                    <p>Bank: [placeholder]</p>
                  </div>
                  <button
                    onClick={() => handlePaymentSubmitted(promo.id)}
                    disabled={saving}
                    className="mt-4 rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                  >
                    {saving ? "Submitting..." : "I've Made the Payment"}
                  </button>
                </div>
              )}

              {promo.status === "payment_confirmed" && (
                <div className="mt-4 rounded-md bg-indigo-50 border border-indigo-200 p-3">
                  <p className="text-sm text-indigo-800">
                    Payment confirmed — ad under review (admin will approve within 72 hours)
                  </p>
                </div>
              )}

              {promo.status === "live" && (
                <div className="mt-4 rounded-md bg-forest/10 border border-forest/20 p-3">
                  <p className="text-sm text-forest">
                    Your ad is live until <strong>{promo.live_until ? new Date(promo.live_until).toLocaleDateString("en-IN") : "—"}</strong>
                  </p>
                </div>
              )}

              {promo.status === "rejected" && promo.rejection_reason && (
                <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-700">
                    <strong>Rejection reason:</strong> {promo.rejection_reason}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="text-sm text-navy/50">
        <Link href="/dashboard/business" className="text-saffron-700 hover:text-saffron-800">
          ← Back to Business
        </Link>
      </div>
    </div>
  );
}
