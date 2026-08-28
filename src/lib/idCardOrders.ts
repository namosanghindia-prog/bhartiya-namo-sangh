/**
 * Printed ID card ordering.
 *
 * IMPORTANT: ID_CARD_UNIT_PRICE_PAISE is for display only. The authoritative
 * price lives in the database (`id_card_unit_price_paise()` in migration 009),
 * and a trigger recomputes `amount_paise` on every insert, so a tampered client
 * cannot choose what it pays. Keep the two in sync when the price changes.
 */
export const ID_CARD_UNIT_PRICE_PAISE = 20000; // ₹200.00 per card
export const ID_CARD_MAX_QUANTITY = 5;

export type IdCardOrderStatus =
  | "pending_payment"
  | "paid"
  | "printing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface IdCardOrder {
  id: string;
  member_id: string;
  quantity: number;
  delivery_name: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  amount_paise: number;
  status: IdCardOrderStatus;
  payment_ref: string | null;
  admin_note: string | null;
  created_at: string;
}

export const ID_CARD_STATUS_LABELS: Record<IdCardOrderStatus, string> = {
  pending_payment: "Payment pending",
  paid: "Payment received",
  printing: "Printing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Tailwind classes for the status pill, keyed by status. */
export const ID_CARD_STATUS_STYLES: Record<IdCardOrderStatus, string> = {
  pending_payment: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  printing: "bg-sky-100 text-sky-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-gray-200 text-gray-600",
};

export function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}
