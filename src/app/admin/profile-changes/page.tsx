"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface ChangeRequest {
  id: string;
  member_id: string;
  current_first_name: string | null;
  current_last_name: string | null;
  current_designation: string | null;
  requested_first_name: string | null;
  requested_last_name: string | null;
  requested_designation: string | null;
  status: string;
  requested_at: string;
  member: {
    first_name: string;
    last_name: string;
    designation: string | null;
    email: string | null;
    avatar_url: string | null;
    membership_number: number | null;
  } | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Diff({
  label,
  current,
  requested,
}: {
  label: string;
  current: string | null;
  requested: string | null;
}) {
  const changed = (current ?? "").trim() !== (requested ?? "").trim();
  return (
    <div className="grid grid-cols-[90px_1fr] sm:grid-cols-[110px_1fr_auto_1fr] gap-x-3 gap-y-1 items-center text-sm">
      <span className="text-navy/60">{label}</span>
      <span className={`${changed ? "line-through text-navy/50" : "text-navy"} break-words`}>
        {current || <span className="italic text-navy/40">—</span>}
      </span>
      <span className="hidden sm:inline text-navy/40" aria-hidden="true">→</span>
      <span
        className={`break-words col-start-2 sm:col-start-4 ${
          changed ? "font-semibold text-forest" : "text-navy/60"
        }`}
      >
        {requested || <span className="italic text-navy/40">—</span>}
      </span>
    </div>
  );
}

export default function ProfileChangesPage() {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profile_change_requests")
        .select(
          `id, member_id, current_first_name, current_last_name, current_designation,
           requested_first_name, requested_last_name, requested_designation,
           status, requested_at,
           member:members!profile_change_requests_member_id_fkey(first_name, last_name, designation, email, avatar_url, membership_number)`
        )
        .eq("status", "pending")
        .order("requested_at", { ascending: true });

      if (error) {
        console.error("Failed to load change requests:", error);
        setMessage({ type: "err", text: "Failed to load requests: " + error.message });
      } else if (data) {
        // Supabase may return a to-one FK relation as a single-element array
        const normalized = data.map((r) => ({
          ...r,
          member: Array.isArray(r.member) ? r.member[0] ?? null : r.member,
        })) as ChangeRequest[];
        setRequests(normalized);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleApprove(req: ChangeRequest) {
    setProcessing(req.id);
    setMessage(null);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    // 1. Apply the requested values to the member record
    const { error: memberError } = await supabase
      .from("members")
      .update({
        first_name: req.requested_first_name ?? req.member?.first_name ?? req.current_first_name,
        last_name: req.requested_last_name ?? req.member?.last_name ?? req.current_last_name,
        designation: req.requested_designation,
      })
      .eq("id", req.member_id);

    if (memberError) {
      console.error("Failed to update member:", memberError);
      setMessage({ type: "err", text: "Failed to update member: " + memberError.message });
      setProcessing(null);
      return;
    }

    // 2. Mark the request approved
    const { error: reqError } = await supabase
      .from("profile_change_requests")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id ?? null,
        rejection_reason: null,
      })
      .eq("id", req.id);

    if (reqError) {
      console.error("Failed to mark request approved:", reqError);
      setMessage({
        type: "err",
        text: "Member was updated but the request could not be marked approved: " + reqError.message,
      });
      setProcessing(null);
      return;
    }

    setRequests((prev) => prev.filter((r) => r.id !== req.id));
    setMessage({
      type: "ok",
      text: `Approved: ${req.requested_first_name} ${req.requested_last_name}${
        req.requested_designation ? ` — ${req.requested_designation}` : ""
      }`,
    });
    setProcessing(null);
  }

  async function handleReject(req: ChangeRequest) {
    const reason = rejectReason.trim();
    if (!reason) {
      setMessage({ type: "err", text: "Please enter a reason for rejecting this request." });
      return;
    }

    setProcessing(req.id);
    setMessage(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("profile_change_requests")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id ?? null,
        rejection_reason: reason,
      })
      .eq("id", req.id);

    if (error) {
      console.error("Failed to reject request:", error);
      setMessage({ type: "err", text: "Failed to reject request: " + error.message });
      setProcessing(null);
      return;
    }

    setRequests((prev) => prev.filter((r) => r.id !== req.id));
    setRejectingId(null);
    setRejectReason("");
    setMessage({ type: "ok", text: "Request rejected." });
    setProcessing(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-navy">
          Profile Change Requests
        </h1>
        <p className="mt-1 text-sm text-navy/60">
          Members&apos; requests to change their name or designation. Approved
          changes are applied to the member record and their ID card immediately.
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

      {loading ? (
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center text-navy/60">
          Loading requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="font-semibold text-navy">No pending requests</p>
          <p className="mt-1 text-sm text-navy/60">
            All name/designation change requests have been reviewed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const m = req.member;
            const isProcessing = processing === req.id;
            const isRejecting = rejectingId === req.id;
            return (
              <div
                key={req.id}
                className="rounded-xl border border-saffron-200 bg-white p-5 space-y-4"
              >
                {/* Member header */}
                <div className="flex items-center gap-3">
                  {m?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.avatar_url}
                      alt=""
                      className="h-11 w-11 rounded-full object-cover border border-saffron-200"
                    />
                  ) : (
                    <div className="h-11 w-11 rounded-full bg-saffron-100 flex items-center justify-center font-semibold text-saffron-800">
                      {(m?.first_name?.[0] ?? req.current_first_name?.[0] ?? "?")}
                      {(m?.last_name?.[0] ?? req.current_last_name?.[0] ?? "")}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-navy truncate">
                      {m ? `${m.first_name} ${m.last_name}` : `${req.current_first_name} ${req.current_last_name}`}
                    </p>
                    <p className="text-xs text-navy/60 truncate">
                      {m?.email ?? "—"}
                      {m?.membership_number ? ` · Member #${m.membership_number}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-navy/50 whitespace-nowrap">
                    {formatDate(req.requested_at)}
                  </span>
                </div>

                {/* Diff */}
                <div className="rounded-lg bg-saffron-50 border border-saffron-100 p-4 space-y-2">
                  <div className="hidden sm:grid grid-cols-[110px_1fr_auto_1fr] gap-x-3 text-[11px] uppercase tracking-wide text-navy/50">
                    <span />
                    <span>Current</span>
                    <span />
                    <span>Requested</span>
                  </div>
                  <Diff
                    label="First name"
                    current={m?.first_name ?? req.current_first_name}
                    requested={req.requested_first_name}
                  />
                  <Diff
                    label="Last name"
                    current={m?.last_name ?? req.current_last_name}
                    requested={req.requested_last_name}
                  />
                  <Diff
                    label="Designation"
                    current={m?.designation ?? req.current_designation}
                    requested={req.requested_designation}
                  />
                </div>

                {/* Actions */}
                {isRejecting ? (
                  <div className="space-y-2">
                    <label className="block text-sm text-navy/70">
                      Reason for rejection
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={2}
                      placeholder="e.g. Name does not match the ID proof on file"
                      className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(req)}
                        disabled={isProcessing}
                        className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {isProcessing ? "Rejecting..." : "Confirm Reject"}
                      </button>
                      <button
                        onClick={() => {
                          setRejectingId(null);
                          setRejectReason("");
                        }}
                        disabled={isProcessing}
                        className="rounded-md border border-saffron-200 px-4 py-2 text-sm font-medium text-navy hover:bg-saffron-50 disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleApprove(req)}
                      disabled={isProcessing}
                      className="rounded-md bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-forest/90 disabled:opacity-60"
                    >
                      {isProcessing ? "Approving..." : "Approve"}
                    </button>
                    <button
                      onClick={() => {
                        setRejectingId(req.id);
                        setRejectReason("");
                        setMessage(null);
                      }}
                      disabled={isProcessing}
                      className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
