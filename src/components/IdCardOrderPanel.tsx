"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ID_CARD_MAX_QUANTITY,
  ID_CARD_STATUS_LABELS,
  ID_CARD_STATUS_STYLES,
  ID_CARD_UNIT_PRICE_PAISE,
  formatRupees,
  type IdCardOrder,
} from "@/lib/idCardOrders";

interface Props {
  member: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
  };
}

interface FormState {
  quantity: number;
  delivery_name: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
}

export default function IdCardOrderPanel({ member }: Props) {
  const [orders, setOrders] = useState<IdCardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justOrdered, setJustOrdered] = useState(false);

  // Prefill from the member's profile — most people ship to their own address.
  const [form, setForm] = useState<FormState>({
    quantity: 1,
    delivery_name: [member.first_name, member.last_name].filter(Boolean).join(" "),
    phone: member.phone ?? "",
    address_line: member.address ?? "",
    city: member.city ?? "",
    state: member.state ?? "",
    pincode: member.pincode ?? "",
  });

  const loadOrders = useCallback(async () => {
    const supabase = createClient();
    const { data, error: loadError } = await supabase
      .from("id_card_orders")
      .select("*")
      .eq("member_id", member.id)
      .order("created_at", { ascending: false });

    if (loadError) {
      console.error("Failed to load ID card orders:", loadError);
    } else if (data) {
      setOrders(data as IdCardOrder[]);
    }
    setLoading(false);
  }, [member.id]);

  useEffect(() => {
    // Wrapped rather than called directly so the state updates land after the
    // await, not synchronously inside the effect body.
    let cancelled = false;
    void (async () => {
      await loadOrders();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [loadOrders]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^\d{6}$/.test(form.pincode.trim())) {
      setError("Please enter a valid 6-digit pincode.");
      return;
    }
    if (form.phone.trim().length < 10) {
      setError("Please enter a valid contact number.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    // amount_paise is deliberately not sent — a database trigger derives it from
    // quantity, so the price cannot be set from the browser.
    const { error: insertError } = await supabase.from("id_card_orders").insert({
      member_id: member.id,
      quantity: form.quantity,
      delivery_name: form.delivery_name.trim(),
      phone: form.phone.trim(),
      address_line: form.address_line.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
    });
    setSubmitting(false);

    if (insertError) {
      console.error("Failed to place ID card order:", insertError);
      setError(insertError.message || "Could not place the order. Please try again.");
      return;
    }

    setOpen(false);
    setJustOrdered(true);
    await loadOrders();
  }

  const total = form.quantity * ID_CARD_UNIT_PRICE_PAISE;
  const inputClass =
    "w-full rounded-md border border-saffron-200 px-3 py-2 text-sm text-navy outline-none focus:border-saffron-500";

  return (
    <div className="rounded-xl border border-saffron-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-navy">
            Order a printed ID card
          </h2>
          <p className="mt-1 text-sm text-navy/60">
            Get a durable PVC copy of your membership card delivered to your address —{" "}
            <span className="font-semibold text-navy">
              {formatRupees(ID_CARD_UNIT_PRICE_PAISE)} per card
            </span>
            , inclusive of delivery.
          </p>
        </div>
        {!open && (
          <button
            onClick={() => {
              setOpen(true);
              setJustOrdered(false);
            }}
            className="rounded-md bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800 transition-colors"
          >
            Order now
          </button>
        )}
      </div>

      {justOrdered && (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-semibold">Order placed.</p>
          <p className="mt-0.5">
            Our office will contact you to collect payment and confirm dispatch.
            Online payment will be available here soon.
          </p>
        </div>
      )}

      {open && (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-navy/70 mb-1">
                Delivery name
              </label>
              <input
                required
                value={form.delivery_name}
                onChange={(e) => update("delivery_name", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy/70 mb-1">
                Contact number
              </label>
              <input
                required
                inputMode="numeric"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy/70 mb-1">
              Address
            </label>
            <textarea
              required
              rows={2}
              value={form.address_line}
              onChange={(e) => update("address_line", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-navy/70 mb-1">City</label>
              <input
                required
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy/70 mb-1">State</label>
              <input
                required
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy/70 mb-1">Pincode</label>
              <input
                required
                inputMode="numeric"
                maxLength={6}
                value={form.pincode}
                onChange={(e) => update("pincode", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy/70 mb-1">
                Quantity
              </label>
              <select
                value={form.quantity}
                onChange={(e) => update("quantity", Number(e.target.value))}
                className={inputClass + " w-24"}
              >
                {Array.from({ length: ID_CARD_MAX_QUANTITY }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-right">
              <p className="text-xs text-navy/60">Total payable</p>
              <p className="font-heading text-xl font-semibold text-navy">
                {formatRupees(total)}
              </p>
            </div>
          </div>

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {/* Razorpay is not connected yet — orders are recorded here and settled
              offline until the payment link is added. */}
          <p className="rounded-md border border-saffron-200 bg-saffron-50 px-3 py-2 text-xs text-saffron-900">
            Online payment is coming soon. Place your order now and our office will
            contact you to collect payment before dispatch.
          </p>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800 transition-colors disabled:opacity-60"
            >
              {submitting ? "Placing order..." : "Place order"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-saffron-200 px-4 py-2 text-sm font-semibold text-navy/70 hover:bg-saffron-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Past orders */}
      {!loading && orders.length > 0 && (
        <div className="mt-6 pt-5 border-t border-saffron-100">
          <h3 className="font-heading text-sm font-semibold text-navy mb-3">
            Your orders
          </h3>
          <ul className="space-y-2">
            {orders.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-saffron-100 bg-saffron-50/50 px-3 py-2 text-sm"
              >
                <div className="text-navy/80">
                  <span className="font-semibold">
                    {o.quantity} card{o.quantity > 1 ? "s" : ""}
                  </span>{" "}
                  · {formatRupees(o.amount_paise)}
                  <span className="block text-xs text-navy/50">
                    Ordered {new Date(o.created_at).toLocaleDateString("en-IN")} · to{" "}
                    {o.city}, {o.state} {o.pincode}
                  </span>
                </div>
                <span
                  className={
                    "rounded-full px-2.5 py-1 text-xs font-semibold " +
                    ID_CARD_STATUS_STYLES[o.status]
                  }
                >
                  {ID_CARD_STATUS_LABELS[o.status]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
