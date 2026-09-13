import type { SupabaseClient, User } from "@supabase/supabase-js";

export type VipOutcome = "none" | "redeemed" | "rejected";

/**
 * Redeem the VIP code a member typed on the signup form, if they typed one.
 *
 * The code travels on the auth user's metadata rather than being redeemed on
 * the spot, because `redeem_vip_coupon` has to run as the member and signup
 * used to have no session to run it with. This is called from both ends of that
 * journey: straight after signup now that email confirmation is off, and at
 * login for anyone whose code is still waiting there from before.
 */
export async function redeemPendingVipCoupon(
  supabase: SupabaseClient,
  user: User
): Promise<VipOutcome> {
  const code = user.user_metadata?.vip_coupon_code;
  if (!code) return "none";

  try {
    const { data, error } = await supabase.rpc("redeem_vip_coupon", {
      coupon_code: code,
      member_id: user.id,
    });

    // Cleared whatever the outcome. A code that was refused once will be
    // refused every time, and leaving it in metadata retries it on every
    // single login.
    await supabase.auth.updateUser({ data: { vip_coupon_code: null } });

    if (error) {
      console.error("[vip] Redemption failed:", error);
      return "rejected";
    }

    return data === true ? "redeemed" : "rejected";
  } catch (err) {
    // Could not reach the RPC at all — distinct from a refused code, so the
    // caller carries on quietly instead of telling the member their code is bad.
    console.error("[vip] Could not redeem the coupon:", err);
    return "none";
  }
}
