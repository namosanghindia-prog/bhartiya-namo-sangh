import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import {
  AVATAR_ACCEPTED_TYPES,
  AVATAR_MAX_BYTES,
  AVATAR_MAX_MB,
  uploadAvatar,
} from "@/lib/avatar";
import { sendEmail } from "@/lib/email/send";
import { welcomeEmail } from "@/lib/email/templates";

/**
 * Finishes what the signup form could not.
 *
 * `supabase.auth.signUp` creates the account but issues no session while email
 * confirmation is on, so the browser cannot upload the profile photo it just
 * collected, nor write to the member row the handle_new_user trigger created.
 * The photo used to be parked in sessionStorage and uploaded at the member's
 * next login in that same tab — which almost never happened, because the
 * confirmation link opens a new one. The address went in as auth metadata and
 * only ever reached the members table if the live trigger happened to copy it.
 *
 * This route writes both with the service role, immediately after signUp
 * returns. It is unauthenticated by necessity, so it is deliberately narrow:
 *
 *  - the caller must know the new user's id *and* their email address,
 *  - the account must still be unconfirmed, or under 15 minutes old,
 *  - only columns that are currently empty are filled, so nothing a member or
 *    admin has since edited can be overwritten.
 *
 * The worst it can do to an existing member is nothing: their row is populated
 * and their account is confirmed, so every write is skipped.
 */

const FRESH_ACCOUNT_WINDOW_MS = 15 * 60 * 1000;

/** Free-text fields collected at signup, and the columns they land in. */
const PROFILE_FIELDS = [
  ["fatherName", "father_name"],
  ["address", "address"],
  ["city", "city"],
  ["state", "state"],
] as const;

function text(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error(
      "[signup/complete] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch (err) {
    console.error("[signup/complete] Could not read the request body:", err);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const userId = text(form, "userId");
  const email = text(form, "email");

  if (!userId || !email) {
    return NextResponse.json(
      { error: "userId and email are required" },
      { status: 400 }
    );
  }

  const supabaseAdmin = createServiceClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userError } =
    await supabaseAdmin.auth.admin.getUserById(userId);
  const authUser = userData?.user;

  if (userError || !authUser) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  if ((authUser.email ?? "").toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ error: "Account mismatch" }, { status: 403 });
  }

  const createdAt = Date.parse(authUser.created_at ?? "");
  const isFresh =
    Number.isFinite(createdAt) && Date.now() - createdAt < FRESH_ACCOUNT_WINDOW_MS;

  if (authUser.email_confirmed_at && !isFresh) {
    return NextResponse.json(
      { error: "This account is already set up" },
      { status: 403 }
    );
  }

  // handle_new_user() inserts the row inside the signUp transaction, so it is
  // there by the time the browser calls this. If it somehow is not, there is
  // nothing to fill in yet and a later profile save will cover it.
  const { data: member, error: memberError } = await supabaseAdmin
    .from("members")
    .select("id, avatar_url, father_name, address, city, state, first_name, last_name")
    .eq("id", userId)
    .maybeSingle();

  if (memberError) {
    console.error("[signup/complete] Could not read the member row:", memberError);
    return NextResponse.json(
      { error: "Could not read your new profile" },
      { status: 500 }
    );
  }

  if (!member) {
    return NextResponse.json({ error: "Profile not created yet" }, { status: 409 });
  }

  const updates: Record<string, string> = {};
  const filled: string[] = [];

  for (const [formKey, column] of PROFILE_FIELDS) {
    const value = text(form, formKey);
    const existing = (member[column] as string | null) ?? "";
    if (value && !existing.trim()) {
      updates[column] = value;
      filled.push(column);
    }
  }

  let photoSaved = false;
  let photoError: string | null = null;

  const photo = form.get("photo");

  if (photo instanceof File && photo.size > 0) {
    if (member.avatar_url) {
      // Already has one — most likely a retried request.
      photoSaved = true;
    } else if (!AVATAR_ACCEPTED_TYPES.includes(photo.type)) {
      photoError = "Unsupported image type";
    } else if (photo.size > AVATAR_MAX_BYTES) {
      photoError = `Image must be smaller than ${AVATAR_MAX_MB}MB`;
    } else {
      const { publicUrl, error: uploadError } = await uploadAvatar(
        supabaseAdmin,
        userId,
        photo,
        photo.type
      );

      if (uploadError || !publicUrl) {
        console.error("[signup/complete] Avatar upload failed:", uploadError);
        photoError = "Could not store the photo";
      } else {
        updates.avatar_url = publicUrl;
        photoSaved = true;
      }
    }
  }

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabaseAdmin
      .from("members")
      .update(updates)
      .eq("id", userId);

    if (updateError) {
      console.error("[signup/complete] Could not save the profile:", updateError);
      return NextResponse.json(
        { error: "Could not save your details" },
        { status: 500 }
      );
    }
  }

  // Confirms the application landed. This is the only mail signup sends now
  // that Supabase no longer has a confirmation link to deliver, so a member who
  // hears nothing has genuinely not registered. Never fails the request.
  const welcome = welcomeEmail({
    firstName: member.first_name,
    lastName: member.last_name,
  });

  const mail = await sendEmail({
    to: email,
    subject: welcome.subject,
    html: welcome.html,
    text: welcome.text,
  });

  return NextResponse.json({
    success: true,
    photoSaved,
    photoError,
    fieldsSaved: filled,
    welcomeEmailSent: mail.sent,
  });
}
