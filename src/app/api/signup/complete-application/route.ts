import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  AVATAR_ACCEPTED_TYPES,
  AVATAR_MAX_BYTES,
  AVATAR_MAX_MB,
  uploadAvatar,
} from "@/lib/avatar";
import { MEMBERSHIP_TIERS, isMembershipTier } from "@/lib/membership-tiers";
import { sendNewApplicationEmails } from "@/lib/signup-notifications";

/**
 * Turns an account made with "Continue with Google" into a membership
 * application.
 *
 * Google hands over a name and an email and nothing more, so handle_new_user()
 * leaves such a member pending with no father's name, address, branch, photo,
 * plan or declaration — nothing an admin could judge. The proxy holds those
 * members on /auth/complete-application until this route has filled the gaps.
 *
 * Signed-in callers only, and only once: the row must still be pending with the
 * declaration unaccepted, which an application sent through the email form
 * never is. The service role does the write because the name columns refuse
 * changes a member makes to their own row, and the fee is worked out here from
 * the plan instead of being taken from the browser.
 */

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(form: FormData, key: string, maxLength: number): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return fail("Your session has ended. Please sign in again.", 401);
  }

  const supabaseAdmin = createServiceClient();
  if (!supabaseAdmin) return fail("Server configuration error", 500);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Invalid request body", 400);
  }

  const fields = {
    first_name: text(form, "firstName", 60),
    last_name: text(form, "lastName", 60),
    father_name: text(form, "fatherName", 120),
    phone: text(form, "phone", 20),
    address: text(form, "address", 500),
    city: text(form, "city", 100),
    state: text(form, "state", 100),
  };
  const branchId = text(form, "branch", 36);
  const vipCode = text(form, "vipCode", 40);
  const membershipType = text(form, "membershipType", 20);
  const tier = isMembershipTier(membershipType) ? membershipType : null;

  if (Object.values(fields).some((value) => !value)) {
    return fail("Please fill in every field.", 400);
  }
  if (fields.phone.replace(/\D/g, "").length < 10) {
    return fail("Please enter a valid mobile number.", 400);
  }
  if (!UUID_PATTERN.test(branchId)) {
    return fail("Please choose a branch.", 400);
  }
  if (!vipCode && !tier) {
    return fail("Please choose a membership type.", 400);
  }
  if (form.get("declaration") !== "true") {
    return fail("You must accept the declaration to proceed.", 400);
  }

  const { data: member, error: memberError } = await supabaseAdmin
    .from("members")
    .select("status, declaration_accepted, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (memberError) {
    console.error("[complete-application] Could not read the member row:", memberError);
    return fail("Could not load your profile. Please try again.", 500);
  }
  if (!member) {
    return fail("Your account is still being set up. Please try again in a moment.", 409);
  }
  if (member.declaration_accepted || member.status !== "pending") {
    return fail("Your application has already been submitted.", 409);
  }

  const { data: branch } = await supabaseAdmin
    .from("branches")
    .select("id")
    .eq("id", branchId)
    .eq("is_active", true)
    .maybeSingle();

  if (!branch) return fail("Please choose a branch from the list.", 400);

  const updates: Record<string, string | number | boolean | null> = {
    ...fields,
    branch_id: branchId,
    declaration_accepted: true,
    // Same as the email form: a VIP code stands in for a plan and a fee.
    membership_type: vipCode ? null : tier,
    membership_fee_amount: vipCode || !tier ? 0 : MEMBERSHIP_TIERS[tier].price,
  };

  const photo = form.get("photo");

  if (photo instanceof File && photo.size > 0) {
    if (!AVATAR_ACCEPTED_TYPES.includes(photo.type)) {
      return fail("Please upload a JPG, PNG or WebP photo.", 400);
    }
    if (photo.size > AVATAR_MAX_BYTES) {
      return fail(`The photo must be smaller than ${AVATAR_MAX_MB}MB.`, 400);
    }

    const { publicUrl, error: uploadError } = await uploadAvatar(
      supabaseAdmin,
      user.id,
      photo,
      photo.type
    );

    if (uploadError || !publicUrl) {
      console.error("[complete-application] Avatar upload failed:", uploadError);
      return fail("Could not store the photo. Please try again.", 500);
    }
    updates.avatar_url = publicUrl;
  } else if (!member.avatar_url) {
    return fail("Profile photo is required.", 400);
  }

  // Guarded on the declaration too, so a double submit cannot send the
  // application — and its emails — twice.
  const { data: saved, error: updateError } = await supabaseAdmin
    .from("members")
    .update(updates)
    .eq("id", user.id)
    .eq("declaration_accepted", false)
    .select("id");

  if (updateError) {
    console.error("[complete-application] Could not save the application:", updateError);
    return fail("Could not save your application. Please try again.", 500);
  }
  if (!saved?.length) {
    return fail("Your application has already been submitted.", 409);
  }

  const { welcomeEmailSent, adminAlertSent } = await sendNewApplicationEmails(supabaseAdmin, {
    firstName: fields.first_name,
    lastName: fields.last_name,
    email: user.email,
    phone: fields.phone,
    city: fields.city,
  });

  return NextResponse.json({ success: true, welcomeEmailSent, adminAlertSent });
}
