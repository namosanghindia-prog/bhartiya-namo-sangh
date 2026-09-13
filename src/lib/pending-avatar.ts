import type { SupabaseClient } from "@supabase/supabase-js";
import { uploadAvatar } from "@/lib/avatar";
import { dataUrlToBlob } from "@/lib/image";

/**
 * The signup photo, held on the device until the member has an account that
 * can own it.
 *
 * Signup has no session — Supabase only issues one after the confirmation link
 * is clicked — so the photo cannot be uploaded from the browser at the moment
 * it is chosen. /api/signup/complete takes care of it server-side, and this is
 * the fallback for when that call does not get through.
 *
 * It used to be sessionStorage, which is per-tab and dies with the tab: the
 * member confirmed their email in a mail-client tab, logged in there, and the
 * photo was already gone. localStorage survives the tab, the browser restart
 * and the trip through the inbox.
 */
const KEY = "pending_avatar";
const TYPE_KEY = "pending_avatar_type";

function read(key: string): string | null {
  try {
    // sessionStorage is read too so photos stashed by the previous version of
    // the signup form still get picked up.
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function storePendingAvatar(dataUrl: string, contentType: string): void {
  try {
    localStorage.setItem(KEY, dataUrl);
    localStorage.setItem(TYPE_KEY, contentType);
  } catch (err) {
    // Over quota, or storage blocked (private mode, third-party cookie
    // settings). The server-side upload is the primary path, so losing the
    // local copy is not worth interrupting signup for.
    console.warn("[pending-avatar] Could not stash the photo locally:", err);
  }
}

export function readPendingAvatar(): { dataUrl: string; contentType: string } | null {
  const dataUrl = read(KEY);
  const contentType = read(TYPE_KEY);
  if (!dataUrl || !contentType) return null;
  return { dataUrl, contentType };
}

export function clearPendingAvatar(): void {
  for (const key of [KEY, TYPE_KEY]) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Upload the stashed signup photo for a member who now has a session, and
 * point their profile at it. No-op when there is nothing stashed.
 *
 * Returns the public URL when a photo was saved, so a caller holding member
 * state can update it without re-reading the row.
 */
export async function flushPendingAvatar(
  supabase: SupabaseClient,
  memberId: string
): Promise<string | null> {
  const pending = readPendingAvatar();
  if (!pending) return null;

  try {
    const blob = dataUrlToBlob(pending.dataUrl, pending.contentType);

    const { publicUrl, error: uploadError } = await uploadAvatar(
      supabase,
      memberId,
      blob,
      pending.contentType
    );

    if (uploadError || !publicUrl) {
      console.error("[pending-avatar] Upload failed:", uploadError);
      // Left in storage on purpose: the next login gets another try.
      return null;
    }

    const { error: updateError } = await supabase
      .from("members")
      .update({ avatar_url: publicUrl })
      .eq("id", memberId);

    if (updateError) {
      console.error("[pending-avatar] Could not set avatar_url:", updateError);
      return null;
    }

    clearPendingAvatar();
    return publicUrl;
  } catch (err) {
    console.error("[pending-avatar] Unexpected failure:", err);
    return null;
  }
}
