"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ID_CARD_STATUS_LABELS,
  ID_CARD_STATUS_STYLES,
  formatRupees,
  type IdCardOrder,
  type IdCardOrderStatus,
} from "@/lib/idCardOrders";

interface OrderRow extends IdCardOrder {
  member: {
    first_name: string;
    last_name: string;
    membership_number: number | null;
    email: string | null;
  } | null;
}

const STATUS_FLOW: IdCardOrderStatus[] = [
  "pending_payment",
  "paid",
  "printing",
  "shipped",
  "delivered",
  "cancelled",
];

export default function IdCardOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<IdCardOrderStatus | "all">("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    const supabase = createClient();
    let query = supabase
      .from("id_card_orders")
      .select(
        "*, member:members(first_name, last_name, membership_number, email)"
      )
      .order("created_at", { ascending: false });

    if (filter !== "all") query = query.eq("status", filter);

    const { data, error } = await query;
    if (error) {
      console.error("Failed to load ID card orders:", error);
    } else if (data) {
      setOrders(data as unknown as OrderRow[]);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await loadOrders();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [loadOrders]);

  async function handleStatusChange(id: string, status: IdCardOrderStatus) {
    setUpdating(id);
    const supabase = createClient();
    const { error } = await supabase
      .from("id_card_orders")
      .update({ status })
      .eq("id", id);
    setUpdating(null);

    if (error) {
      console.error("Failed to update order status:", error);
      alert("Could not update the order status.");
      return;
    }
    await loadOrders();
  }

  const pendingCount = orders.filter((o) => o.status === "pending_payment").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy">
            ID Card Orders
          </h1>
          <p className="mt-1 text-sm text-navy/60">
            Printed membership card orders placed by members.
            {filter === "all" && pendingCount > 0 && (
              <> {pendingCount} awaiting payment.</>
            )}
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => {
            setLoading(true);
            setFilter(e.target.value as IdCardOrderStatus | "all");
          }}
          className="rounded-md border border-saffron-200 px-3 py-2 text-sm text-navy outline-none focus:border-saffron-500"
        >
          <option value="all">All statuses</option>
          {STATUS_FLOW.map((s) => (
            <option key={s} value={s}>
              {ID_CARD_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
          <p className="text-navy/60">Loading...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
          <div className="text-4xl mb-3">📦</div>
          <p className="text-navy/60">No orders yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-saffron-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-saffron-50 text-left text-xs uppercase tracking-wide text-navy/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Member</th>
                <th className="px-4 py-3 font-semibold">Deliver to</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Qty</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Amount</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Ordered</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-saffron-100">
              {orders.map((o) => (
                <tr key={o.id} className="align-top">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-navy">
                      {o.member
                        ? `${o.member.first_name} ${o.member.last_name}`
                        : "—"}
                    </div>
                    <div className="text-xs text-navy/50">
                      {o.member?.membership_number
                        ? `#${o.member.membership_number}`
                        : "No membership no."}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="text-navy/80">{o.delivery_name}</div>
                    <div className="text-xs text-navy/60">
                      {o.address_line}, {o.city}, {o.state} — {o.pincode}
                    </div>
                    <div className="text-xs text-navy/50">{o.phone}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-navy/80">
                    {o.quantity}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-semibold text-navy">
                    {formatRupees(o.amount_paise)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-navy/60">
                    {new Date(o.created_at).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-block rounded-full px-2.5 py-1 text-xs font-semibold " +
                        ID_CARD_STATUS_STYLES[o.status]
                      }
                    >
                      {ID_CARD_STATUS_LABELS[o.status]}
                    </span>
                    <select
                      value={o.status}
                      disabled={updating === o.id}
                      onChange={(e) =>
                        handleStatusChange(
                          o.id,
                          e.target.value as IdCardOrderStatus
                        )
                      }
                      className="mt-2 block w-full rounded-md border border-saffron-200 px-2 py-1 text-xs text-navy outline-none focus:border-saffron-500 disabled:opacity-60"
                    >
                      {STATUS_FLOW.map((s) => (
                        <option key={s} value={s}>
                          {ID_CARD_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
