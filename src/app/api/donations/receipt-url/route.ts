import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { donationId } = await request.json();
  if (!donationId) {
    return NextResponse.json(
      { error: "donationId is required" },
      { status: 400 }
    );
  }

  const { data: member } = await supabase
    .from("members")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: donation, error: donationError } = await supabase
    .from("donations")
    .select("id, member_id, receipt_url")
    .eq("id", donationId)
    .single();

  if (donationError || !donation) {
    return NextResponse.json({ error: "Donation not found" }, { status: 404 });
  }

  const isAdmin = member?.role === "admin" || member?.role === "super_admin";
  const isOwner = donation.member_id === user.id;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!donation.receipt_url) {
    return NextResponse.json(
      { error: "No receipt available for this donation" },
      { status: 404 }
    );
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from("receipts")
    .createSignedUrl(donation.receipt_url, 60);

  if (signedUrlError || !signedUrlData) {
    console.error("Failed to create signed URL:", signedUrlError);
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: signedUrlData.signedUrl });
}
