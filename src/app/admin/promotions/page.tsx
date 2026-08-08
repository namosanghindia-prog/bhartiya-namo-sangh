"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BusinessPromotion, PromotionStatus } from "@/lib/supabase/types";

const STATUS_LABELS: Record<PromotionStatus, { label: string; color: string }> = {
  requested: { label: "Requested", color: "bg-blue-100 text-blue-800" },
  approved_awaiting_payment: { label: "Awaiting Payment", color: "bg-amber-100 text-amber-800" },
  payment_submitted: { label: "Payment Submitted", color: "bg-purple-100 text-purple-800" },
  payment_confirmed: { label: "Under Review", color: "bg-indigo-100 text-indigo-800" },
  live: { label: "Live", color: "bg-forest/10 text-forest" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
  expired: { label: "Expired", color: "bg-gray-100 text-gray-600" },
};

interface PromotionWithDetails extends Omit<BusinessPromotion, 'business' | 'member'> {
  business: { business_name: string } | null;
  member: { first_name: string; last_name: string; email: string } | null;
}

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<PromotionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PromotionStatus | "all">("all");
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    loadPromotions();
  }, []);

  async function loadPromotions() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("business_promotions")
      .select("*, business:businesses(business_name), member:members(first_name, last_name, email)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load promotions:", error);
    } else if (data) {
      setPromotions(data as PromotionWithDetails[]);
    }
    setLoading(false);
  }

  async function handleApproveRequest(promoId: string) {
    setProcessing(promoId);

    const supabase = createClient();
    const paymentDeadline = new Date();
    paymentDeadline.setHours(paymentDeadline.getHours() + 24);

    const { error } = await supabase
      .from("business_promotions")
      .update({
        status: "approved_awaiting_payment",
        admin_approved_at: new Date().toISOString(),
        payment_deadline: paymentDeadline.toISOString(),
      })
      .eq("id", promoId);

    setProcessing(null);
    if (error) {
      alert("Failed: " + error.message);
      return;
    }
    loadPromotions();
  }

  async function handleConfirmPayment(promoId: string) {
    setProcessing(promoId);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Simplified: 72 flat hours, not business-hours-only
    const adReviewDeadline = new Date();
    adReviewDeadline.setHours(adReviewDeadline.getHours() + 72);

    const { error } = await supabase
      .from("business_promotions")
      .update({
        status: "payment_confirmed",
        payment_confirmed_at: new Date().toISOString(),
        payment_confirmed_by: user?.id,
        ad_review_deadline: adReviewDeadline.toISOString(),
      })
      .eq("id", promoId);

    setProcessing(null);
    if (error) {
      alert("Failed: " + error.message);
      return;
    }
    loadPromotions();
  }

  async function handleApproveAd(promoId: string) {
    setProcessing(promoId);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const liveFrom = new Date();
    const liveUntil = new Date();
    liveUntil.setMonth(liveUntil.getMonth() + 1);

    const { error } = await supabase
      .from("business_promotions")
      .update({
        status: "live",
        ad_approved_at: new Date().toISOString(),
        ad_approved_by: user?.id,
        live_from: liveFrom.toISOString(),
        live_until: liveUntil.toISOString(),
      })
      .eq("id", promoId);

    setProcessing(null);
    if (error) {
      alert("Failed: " + error.message);
      return;
    }
    loadPromotions();
  }

  async function handleReject(promoId: string) {
    if (!rejectReason.trim()) {
      alert("Please enter a rejection reason");
      return;
    }

    setProcessing(promoId);

    const supabase = createClient();
    const { error } = await supabase
      .from("business_promotions")
      .update({
        status: "rejected",
        rejection_reason: rejectReason.trim(),
      })
      .eq("id", promoId);

    setProcessing(null);
    setRejectingId(null);
    setRejectReason("");

    if (error) {
      alert("Failed: " + error.message);
      return;
    }
    loadPromotions();
  }

  function isDeadlinePassed(deadline: string | null): boolean {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  }

  const filtered = filter === "all"
    ? promotions
    : promotions.filter((p) => p.status === filter);

  const pendingCount = promotions.filter((p) =>
    ["requested", "payment_submitted", "payment_confirmed"].includes(p.status)
  ).length;

  if (loading) {
    return <p className="text-sm text-navy/60">Loading promotions...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy">
            Manage Promotions
          </h1>
          <p className="mt-1 text-sm text-navy/60">
            Review and manage business slider promotions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadPromotions}
            className="rounded-md border border-saffron-300 px-4 py-2 text-sm font-medium text-navy hover:bg-saffron-50"
          >
            Refresh
          </button>
          <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as PromotionStatus | "all")}
          className="rounded-md border border-saffron-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
        >
          <option value="all">All ({promotions.length})</option>
          <option value="requested">
            Requested ({promotions.filter((p) => p.status === "requested").length})
          </option>
          <option value="approved_awaiting_payment">
            Awaiting Payment ({promotions.filter((p) => p.status === "approved_awaiting_payment").length})
          </option>
          <option value="payment_submitted">
            Payment Submitted ({promotions.filter((p) => p.status === "payment_submitted").length})
          </option>
          <option value="payment_confirmed">
            Under Review ({promotions.filter((p) => p.status === "payment_confirmed").length})
          </option>
          <option value="live">
            Live ({promotions.filter((p) => p.status === "live").length})
          </option>
          <option value="rejected">
            Rejected ({promotions.filter((p) => p.status === "rejected").length})
          </option>
        </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
          <p className="text-navy/60">No promotions found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((promo) => (
            <div key={promo.id} className="rounded-xl border border-saffron-200 bg-white p-4">
              <div className="flex gap-4">
                {promo.image_url && (
                  <img src={promo.image_url} alt="" className="h-24 w-60 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-navy">
                        {promo.business?.business_name || "Unknown Business"}
                      </h3>
                      <p className="text-sm text-navy/60">
                        {promo.member ? `${promo.member.first_name} ${promo.member.last_name}` : "—"}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_LABELS[promo.status]?.color}`}>
                      {STATUS_LABELS[promo.status]?.label}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-navy/60">Mobile:</span> {promo.mobile}
                    </div>
                    <div>
                      <span className="text-navy/60">Email:</span> {promo.email}
                    </div>
                    <div>
                      <span className="text-navy/60">Website:</span>{" "}
                      <a href={promo.website_link} target="_blank" rel="noopener noreferrer" className="text-saffron-700 hover:underline truncate">
                        {promo.website_link}
                      </a>
                    </div>
                  </div>

                  {/* Deadlines */}
                  <div className="mt-2 flex gap-4 text-xs">
                    {promo.payment_deadline && (
                      <span className={isDeadlinePassed(promo.payment_deadline) ? "text-red-600 font-medium" : "text-navy/60"}>
                        Payment deadline: {new Date(promo.payment_deadline).toLocaleString("en-IN")}
                        {isDeadlinePassed(promo.payment_deadline) && " (PASSED)"}
                      </span>
                    )}
                    {promo.ad_review_deadline && (
                      <span className={isDeadlinePassed(promo.ad_review_deadline) ? "text-red-600 font-medium" : "text-navy/60"}>
                        Review deadline: {new Date(promo.ad_review_deadline).toLocaleString("en-IN")}
                        {isDeadlinePassed(promo.ad_review_deadline) && " (PASSED)"}
                      </span>
                    )}
                    {promo.live_until && (
                      <span className="text-navy/60">
                        Live until: {new Date(promo.live_until).toLocaleDateString("en-IN")}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex items-center gap-2">
                    {promo.status === "requested" && (
                      <>
                        <button
                          onClick={() => handleApproveRequest(promo.id)}
                          disabled={processing === promo.id}
                          className="rounded-md bg-forest px-3 py-1.5 text-sm font-medium text-white hover:bg-forest/90 disabled:opacity-60"
                        >
                          Approve Request
                        </button>
                        {rejectingId === promo.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Reason"
                              className="w-40 rounded-md border px-2 py-1 text-sm"
                            />
                            <button
                              onClick={() => handleReject(promo.id)}
                              disabled={processing === promo.id}
                              className="rounded-md bg-red-600 px-2 py-1.5 text-sm font-medium text-white"
                            >
                              Confirm
                            </button>
                            <button onClick={() => { setRejectingId(null); setRejectReason(""); }} className="text-sm text-navy/60">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRejectingId(promo.id)}
                            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                          >
                            Reject
                          </button>
                        )}
                      </>
                    )}

                    {promo.status === "payment_submitted" && (
                      <button
                        onClick={() => handleConfirmPayment(promo.id)}
                        disabled={processing === promo.id}
                        className="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
                      >
                        Confirm Payment Received
                      </button>
                    )}

                    {promo.status === "payment_confirmed" && (
                      <>
                        <button
                          onClick={() => handleApproveAd(promo.id)}
                          disabled={processing === promo.id}
                          className="rounded-md bg-forest px-3 py-1.5 text-sm font-medium text-white hover:bg-forest/90 disabled:opacity-60"
                        >
                          Approve Ad & Go Live
                        </button>
                        {rejectingId === promo.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Reason"
                              className="w-40 rounded-md border px-2 py-1 text-sm"
                            />
                            <button
                              onClick={() => handleReject(promo.id)}
                              className="rounded-md bg-red-600 px-2 py-1.5 text-sm font-medium text-white"
                            >
                              Confirm
                            </button>
                            <button onClick={() => { setRejectingId(null); setRejectReason(""); }} className="text-sm text-navy/60">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRejectingId(promo.id)}
                            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white"
                          >
                            Reject
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
