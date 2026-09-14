"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_MODERATOR_DAYS,
  formatDateTime,
  isActiveGrant,
  isExpiredGrant,
  MODERATOR_DURATIONS,
  type ModeratorRequest,
} from "@/lib/moderator";

interface RequestWithMember extends ModeratorRequest {
  member: {
    first_name: string;
    last_name: string;
    email: string | null;
    avatar_url: string | null;
    membership_number: number | null;
  } | null;
}

function MemberHeader({ req, right }: { req: RequestWithMember; right?: React.ReactNode }) {
  const m = req.member;
  return (
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
          {m?.first_name?.[0] ?? "?"}
          {m?.last_name?.[0] ?? ""}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-navy truncate">
          {m ? `${m.first_name} ${m.last_name}` : "Unknown member"}
        </p>
        <p className="text-xs text-navy/60 truncate">
          {m?.email ?? "—"}
          {m?.membership_number ? ` · Member #${m.membership_number}` : ""}
        </p>
      </div>
      {right}
    </div>
  );
}

function historyLabel(req: ModeratorRequest): { text: string; className: string } {
  if (req.status === "rejected") return { text: "Rejected", className: "bg-red-100 text-red-800" };
  if (req.status === "revoked") return { text: "Revoked", className: "bg-red-100 text-red-800" };
  return { text: "Expired", className: "bg-gray-100 text-gray-700" };
}

export default function AdminModeratorsPage() {
  const [requests, setRequests] = useState<RequestWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("moderator_requests")
        .select(
          `id, member_id, reason, status, requested_at, reviewed_by, reviewed_at,
           rejection_reason, expires_at, revoked_at,
           member:members!moderator_requests_member_id_fkey(first_name, last_name, email, avatar_url, membership_number)`
        )
        .order("requested_at", { ascending: false });

      if (error) {
        console.error("Failed to load moderator requests:", error);
        setMessage({ type: "err", text: "Failed to load requests: " + error.message });
      } else if (data) {
        // Supabase may return a to-one FK relation as a single-element array
        setRequests(
          data.map((r) => ({
            ...r,
            member: Array.isArray(r.member) ? r.member[0] ?? null : r.member,
          })) as RequestWithMember[]
        );
      }
      setLoading(false);
    }
    load();
  }, []);

  function replace(updated: RequestWithMember) {
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  function memberName(req: RequestWithMember) {
    return req.member ? `${req.member.first_name} ${req.member.last_name}` : "Member";
  }

  async function handleApprove(req: RequestWithMember) {
    const days = durations[req.id] ?? DEFAULT_MODERATOR_DAYS;
    setProcessing(req.id);
    setMessage(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const now = new Date();
    const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("moderator_requests")
      .update({
        status: "approved",
        reviewed_by: user?.id ?? null,
        reviewed_at: now.toISOString(),
        rejection_reason: null,
        expires_at: expiresAt,
      })
      .eq("id", req.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (error || !data) {
      console.error("Failed to approve moderator request:", error);
      setMessage({
        type: "err",
        text: error
          ? "Failed to approve: " + error.message
          : "This request is no longer pending — the member may have withdrawn it.",
      });
    } else {
      replace({
        ...req,
        status: "approved",
        reviewed_by: user?.id ?? null,
        reviewed_at: now.toISOString(),
        expires_at: expiresAt,
      });
      setMessage({
        type: "ok",
        text: `${memberName(req)} is a moderator until ${formatDateTime(expiresAt)}.`,
      });
    }
    setProcessing(null);
  }

  async function handleReject(req: RequestWithMember) {
    const reason = rejectReason.trim();
    if (!reason) {
      setMessage({ type: "err", text: "Please enter a reason for rejecting this request." });
      return;
    }

    setProcessing(req.id);
    setMessage(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("moderator_requests")
      .update({
        status: "rejected",
        reviewed_by: user?.id ?? null,
        reviewed_at: now,
        rejection_reason: reason,
      })
      .eq("id", req.id)
      .eq("status", "pending");

    if (error) {
      console.error("Failed to reject moderator request:", error);
      setMessage({ type: "err", text: "Failed to reject: " + error.message });
    } else {
      replace({
        ...req,
        status: "rejected",
        reviewed_by: user?.id ?? null,
        reviewed_at: now,
        rejection_reason: reason,
      });
      setRejectingId(null);
      setRejectReason("");
      setMessage({ type: "ok", text: "Request rejected." });
    }
    setProcessing(null);
  }

  async function handleRevoke(req: RequestWithMember) {
    setProcessing(req.id);
    setMessage(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("moderator_requests")
      .update({ status: "revoked", revoked_by: user?.id ?? null, revoked_at: now })
      .eq("id", req.id)
      .eq("status", "approved");

    if (error) {
      console.error("Failed to revoke moderator access:", error);
      setMessage({ type: "err", text: "Failed to revoke: " + error.message });
    } else {
      replace({ ...req, status: "revoked", revoked_at: now });
      setMessage({ type: "ok", text: `Moderator access revoked for ${memberName(req)}.` });
    }
    setProcessing(null);
  }

  const pending = requests.filter((r) => r.status === "pending");
  const active = requests.filter(isActiveGrant);
  const history = requests.filter(
    (r) => r.status === "rejected" || r.status === "revoked" || isExpiredGrant(r)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-navy">Moderators</h1>
        <p className="mt-1 text-sm text-navy/60">
          Members request moderator mode from their dashboard. Approved moderators
          can view — but not change or export — every event registration until
          their access expires or you revoke it.
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
      ) : (
        <>
          {/* Pending */}
          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-navy">
              Pending requests ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <div className="rounded-xl border border-saffron-200 bg-white p-8 text-center text-sm text-navy/60">
                No requests waiting for review.
              </div>
            ) : (
              pending.map((req) => {
                const isProcessing = processing === req.id;
                const isRejecting = rejectingId === req.id;
                return (
                  <div
                    key={req.id}
                    className="rounded-xl border border-saffron-200 bg-white p-5 space-y-4"
                  >
                    <MemberHeader
                      req={req}
                      right={
                        <span className="text-xs text-navy/50 whitespace-nowrap">
                          {formatDateTime(req.requested_at)}
                        </span>
                      }
                    />
                    <p className="rounded-lg bg-saffron-50 border border-saffron-100 p-3 text-sm text-navy whitespace-pre-wrap break-words">
                      {req.reason}
                    </p>

                    {isRejecting ? (
                      <div className="space-y-2">
                        <label className="block text-sm text-navy/70">Reason for rejection</label>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          maxLength={500}
                          rows={2}
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
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="text-sm text-navy/70" htmlFor={`duration-${req.id}`}>
                          Grant for
                        </label>
                        <select
                          id={`duration-${req.id}`}
                          value={durations[req.id] ?? DEFAULT_MODERATOR_DAYS}
                          onChange={(e) =>
                            setDurations((prev) => ({ ...prev, [req.id]: Number(e.target.value) }))
                          }
                          disabled={isProcessing}
                          className="rounded-md border border-saffron-200 px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-saffron-400"
                        >
                          {MODERATOR_DURATIONS.map((d) => (
                            <option key={d.days} value={d.days}>
                              {d.label}
                            </option>
                          ))}
                        </select>
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
              })
            )}
          </section>

          {/* Active */}
          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-navy">
              Active moderators ({active.length})
            </h2>
            {active.length === 0 ? (
              <div className="rounded-xl border border-saffron-200 bg-white p-8 text-center text-sm text-navy/60">
                Nobody has moderator access right now.
              </div>
            ) : (
              active.map((req) => (
                <div key={req.id} className="rounded-xl border border-saffron-200 bg-white p-5">
                  <MemberHeader
                    req={req}
                    right={
                      <div className="flex flex-wrap items-center justify-end gap-3">
                        <span className="text-xs text-navy/60 whitespace-nowrap">
                          Until {req.expires_at ? formatDateTime(req.expires_at) : "—"}
                        </span>
                        <button
                          onClick={() => handleRevoke(req)}
                          disabled={processing === req.id}
                          className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                        >
                          {processing === req.id ? "Revoking..." : "Revoke"}
                        </button>
                      </div>
                    }
                  />
                </div>
              ))
            )}
          </section>

          {/* History */}
          {history.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-heading text-lg font-semibold text-navy">History</h2>
              <div className="divide-y divide-saffron-100 rounded-xl border border-saffron-200 bg-white">
                {history.map((req) => {
                  const label = historyLabel(req);
                  return (
                    <div key={req.id} className="p-4">
                      <MemberHeader
                        req={req}
                        right={
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${label.className}`}
                          >
                            {label.text}
                          </span>
                        }
                      />
                      {req.status === "rejected" && req.rejection_reason && (
                        <p className="mt-2 text-xs text-navy/60">Reason: {req.rejection_reason}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
