import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { DonationReceipt } from "@/lib/receipt-pdf";
import { promises as fs } from "fs";
import path from "path";

function formatReceiptNumber(seqNum: number, donatedAt: string): string {
  const year = new Date(donatedAt).getFullYear();
  const yearSuffix = String(year).slice(-2);
  const paddedNum = String(seqNum).padStart(4, "0");
  return `BNMS/DON/${paddedNum}/${yearSuffix}`;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: member } = await supabase
    .from("members")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = member?.role === "admin" || member?.role === "super_admin";
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { donationId } = await request.json();
  if (!donationId) {
    return NextResponse.json(
      { error: "donationId is required" },
      { status: 400 }
    );
  }

  const { data: donation, error: donationError } = await supabase
    .from("donations")
    .select("*")
    .eq("id", donationId)
    .single();

  if (donationError || !donation) {
    return NextResponse.json({ error: "Donation not found" }, { status: 404 });
  }

let logoBase64: string | undefined;
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const logoBuffer = await fs.readFile(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  } catch {
    console.warn("Could not load logo for receipt");
  }

  let receiptNumber = donation.receipt_number;

  if (!receiptNumber) {
    const { data: seqData, error: seqError } = await supabase.rpc(
      "nextval_donation_receipt_seq"
    );

    if (seqError) {
      console.error("Failed to get sequence value:", seqError);
      return NextResponse.json(
        { error: "Failed to generate receipt number" },
        { status: 500 }
      );
    }

    receiptNumber = formatReceiptNumber(seqData, donation.donated_at);

    const { error: updateNumError } = await supabase
      .from("donations")
      .update({ receipt_number: receiptNumber })
      .eq("id", donationId);

    if (updateNumError) {
      console.error("Failed to save receipt number:", updateNumError);
    }
  }

  const pdfBuffer = await renderToBuffer(
    DonationReceipt({
      data: {
        receiptNumber,
        donorName: donation.donor_name,
        amount: donation.amount,
        date: donation.donated_at,
        category: donation.category,
        paymentMethod: donation.payment_method || "cash",
        logoBase64,
      },
    })
  );

  const storagePath = `${donation.member_id || "guest"}/${donation.id}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(storagePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    console.error("Failed to upload receipt:", uploadError);
    return NextResponse.json(
      { error: "Failed to upload receipt PDF" },
      { status: 500 }
    );
  }

  const { error: updateError } = await supabase
    .from("donations")
    .update({ receipt_url: storagePath })
    .eq("id", donationId);

  if (updateError) {
    console.error("Failed to update receipt_url:", updateError);
  }

  return NextResponse.json({
    success: true,
    receiptNumber,
    receiptUrl: storagePath,
  });
}
