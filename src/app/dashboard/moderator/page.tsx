"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import EventRegistrationsTable from "@/components/EventRegistrationsTable";
import {
  formatDateTime,
  isActiveGrant,
  isExpiredGrant,
  MODERATOR_REASON_MAX,
  type ModeratorRequest,
} from "@/lib/moderator";

const REQUEST_COLUMNS =
  "id, member_id, reason, status, requested_at, reviewed_by, reviewed_at, rejection_reason, expires_at, revoked_at";

export default function ModeratorModePage() {
  const [requests, setRequests] = useState<ModeratorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("moderator_requests")
        .select(REQUEST_COLUMNS)
        .eq("member_id", user.id)
        .order("requested_at", { ascending: false });

      if (cancelled) return;
      if (error) {
        console.error("Failed to load moderator requests:", error);
        setMessage({ type: "err", text: "Could not load your moderator status." });
      } else {
        setRequests((data ?? []) as ModeratorRequest[]);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const active = requests.find(isActiveGrant);
  const pending = requests.find((r) => r.status === "pending");
  const latest = requests[0];

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    const text = reason.trim();
    if (!text) {
      setMessage({ type: "err", text: "Please tell the admin why you need moderator access." });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    const { data, error } = await supabase
      .from("moderator_requests")
      .insert({ member_id: user.id, reason: text })
      .select(REQUEST_COLUMNS)
      .single();

    if (error) {
      console.error("Failed to request moderator access:", error);
      setMessage({
        type: "err",
        text:
          error.code === "23505"
            ? "You already have a request waiting for review."
            : "Could not send your request. Please try again.",
      });
    } else {
      setRequests((prev) => [data as ModeratorRequest, ...prev]);
      setReason("");
      setMessage({ type: "ok", text: "Request sent. An admin will review it." });
    }
    setSubmitting(false);
  }

  async function handleWithdraw(req: ModeratorRequest) {
    setSubmitting(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("moderator_requests")
      .delete()
      .eq("id", req.id)
      .eq("status", "pending");

    if (error) {
      console.error("Failed to withdraw moderator request:", error);
      setMessage({ type: "err", text: "Could not withdraw your request." });
    } else {
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      setMessage({ type: "ok", text: "Request withdrawn." });
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center text-navy/60">
        Loading...
      </div>
    );
  }

  if (active?.expires_at) {
    return (
      <EventRegistrationsTable
        canExport={false}
        subtitle={
          <p className="mt-2 inline-block rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
            🛡️ Moderator access until {formatDateTime(active.expires_at)}
          </p>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-navy">Moderator Mode</h1>
        <p className="mt-1 text-sm text-navy/60">
          Moderators can view all event registrations for a limited time. Access
          has to be approved by an admin, and ends automatically when the period
          they grant runs out.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            message.type === "ok"
              ? "bg-forest/10 text-forest border border-forest/20"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {pending ? (
        <div className="rounded-xl border border-saffron-200 bg-white p-6 space-y-3">
          <span className="inline-block rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-800">
            Awaiting admin approval
          </span>
          <p className="text-sm text-navy/70">
            Requested {formatDateTime(pending.requested_at)}
          </p>
          <p className="rounded-lg bg-saffron-50 border border-saffron-100 p-3 text-sm text-navy whitespace-pre-wrap break-words">
            {pending.reason}
          </p>
          <button
            onClick={() => handleWithdraw(pending)}
            disabled={submitting}
            className="rounded-md border border-saffron-200 px-4 py-2 text-sm font-medium text-navy hover:bg-saffron-50 disabled:opacity-60"
          >
            Withdraw request
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleRequest}
          className="rounded-xl border border-saffron-200 bg-white p-6 space-y-4"
        >
          {latest?.status === "rejected" && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              Your last request was not approved
              {latest.rejection_reason ? `: ${latest.rejection_reason}` : "."}
            </div>
          )}
          {latest?.status === "revoked" && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              Your moderator access was revoked by an admin
              {latest.revoked_at ? ` on ${formatDateTime(latest.revoked_at)}` : ""}.
            </div>
          )}
          {latest && isExpiredGrant(latest) && latest.expires_at && (
            <div className="rounded-md bg-saffron-50 border border-saffron-200 px-4 py-3 text-sm text-navy/70">
              Your moderator access ended on {formatDateTime(latest.expires_at)}.
            </div>
          )}

          <div>
            <label htmlFor="moderator-reason" className="block text-sm font-medium text-navy">
              Why do you need moderator access?
            </label>
            <textarea
              id="moderator-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={MODERATOR_REASON_MAX}
              rows={3}
              placeholder="e.g. Managing the guest check-in desk for नमो सेवा सम्मान - 2026"
              className="mt-1 w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
            <p className="mt-1 text-xs text-navy/50">
              {reason.length}/{MODERATOR_REASON_MAX}
            </p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Request moderator access"}
          </button>
        </form>
      )}
    </div>
  );
}
