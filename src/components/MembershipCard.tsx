"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { toPng } from "html-to-image";

interface MembershipCardProps {
  member: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    membership_number: number;
    membership_issued_at: string;
    membership_type?: string | null;
    membership_expires_at?: string | null;
    branch?: { name: string } | null;
  };
  showDownload?: boolean;
}

const MEMBERSHIP_TYPE_LABELS: Record<string, { label: string; labelHi: string }> = {
  volunteer: { label: "Volunteer Member", labelHi: "स्वयंसेवक सदस्य" },
  normal: { label: "Member", labelHi: "सदस्य" },
  premium: { label: "Premium Member", labelHi: "प्रीमियम सदस्य" },
  lifetime: { label: "Lifetime Member", labelHi: "आजीवन सदस्य" },
};

function formatMembershipNumber(membershipNumber: number, issuedAt: string): string {
  const year = new Date(issuedAt).getFullYear().toString().slice(-2);
  const paddedNumber = membershipNumber.toString().padStart(4, "0");
  return `BNMS/MEM/${paddedNumber}/${year}`;
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MembershipCard({ member, showDownload = true }: MembershipCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const verificationUrl = `https://bhartiya-namo-sangh-git-main-namosangh.vercel.app/verify/${member.id}`;
  const membershipNumberFormatted = formatMembershipNumber(
    member.membership_number,
    member.membership_issued_at
  );

  const membershipType = member.membership_type || "normal";
  const isPremiumOrLifetime = membershipType === "premium" || membershipType === "lifetime";
  const isLifetime = membershipType === "lifetime";
  const typeInfo = MEMBERSHIP_TYPE_LABELS[membershipType] || MEMBERSHIP_TYPE_LABELS.normal;

  useEffect(() => {
    async function generateQR() {
      if (qrCanvasRef.current) {
        await QRCode.toCanvas(qrCanvasRef.current, verificationUrl, {
          width: 80,
          margin: 1,
          color: {
            dark: "#0a1929",
            light: "#ffffff",
          },
        });
      }
      // Also generate data URL for PDF
      const dataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 80,
        margin: 1,
        color: {
          dark: "#0a1929",
          light: "#ffffff",
        },
      });
      setQrDataUrl(dataUrl);
    }
    generateQR();
  }, [verificationUrl]);

  const handleDownloadPng = async () => {
    if (!cardRef.current) return;

    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `membership-card-${member.membership_number}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to download card:", error);
      alert("Failed to download the ID card. Please try again.");
    }
  };

  const handleDownloadPdf = async () => {
    if (!qrDataUrl) return;
    setDownloadingPdf(true);

    try {
      // Dynamically import react-pdf to avoid SSR issues
      const { pdf, Document, Page, View, Text, Image: PdfImage, StyleSheet } = await import("@react-pdf/renderer");

      const styles = StyleSheet.create({
        page: {
          backgroundColor: "#ffffff",
          padding: 20,
        },
        card: {
          width: 360,
          borderRadius: 12,
          border: "1px solid #f5d5b0",
          overflow: "hidden",
        },
        tricolor: {
          flexDirection: "row",
          height: 8,
        },
        saffron: {
          flex: 1,
          backgroundColor: "#FF9933",
        },
        white: {
          flex: 1,
          backgroundColor: "#ffffff",
        },
        green: {
          flex: 1,
          backgroundColor: "#138808",
        },
        header: {
          backgroundColor: "#c05621",
          padding: 12,
          alignItems: "center",
        },
        headerRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        },
        logo: {
          width: 32,
          height: 32,
        },
        headerText: {
          color: "#ffffff",
          fontSize: 16,
          fontWeight: "bold",
        },
        headerSubtext: {
          color: "#ffffff",
          fontSize: 9,
          marginTop: 2,
          opacity: 0.9,
        },
        headerTagline: {
          color: "#ffffff",
          fontSize: 8,
          marginTop: 2,
          opacity: 0.7,
        },
        badge: {
          backgroundColor: isLifetime ? "#d4af37" : "#c05621",
          paddingVertical: 4,
          paddingHorizontal: 12,
          borderRadius: 12,
          alignSelf: "center",
          marginTop: -8,
          marginBottom: 8,
        },
        badgeText: {
          color: "#ffffff",
          fontSize: 9,
          fontWeight: "bold",
        },
        content: {
          padding: 16,
          flexDirection: "row",
          gap: 16,
        },
        avatar: {
          width: 70,
          height: 70,
          borderRadius: 35,
          backgroundColor: "#fef3e2",
        },
        avatarImage: {
          width: 70,
          height: 70,
          borderRadius: 35,
        },
        initials: {
          width: 70,
          height: 70,
          borderRadius: 35,
          backgroundColor: "#fef3e2",
          alignItems: "center",
          justifyContent: "center",
        },
        initialsText: {
          fontSize: 24,
          fontWeight: "bold",
          color: "#c05621",
        },
        details: {
          flex: 1,
        },
        name: {
          fontSize: 14,
          fontWeight: "bold",
          color: "#0a1929",
        },
        label: {
          fontSize: 8,
          color: "#666666",
          marginTop: 6,
        },
        value: {
          fontSize: 10,
          color: "#0a1929",
          fontWeight: "semibold",
        },
        valueGold: {
          fontSize: 10,
          color: "#d4af37",
          fontWeight: "bold",
        },
        row: {
          flexDirection: "row",
          gap: 16,
        },
        qrSection: {
          borderTop: "1px solid #fef3e2",
          marginTop: 12,
          paddingTop: 12,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
        qrText: {
          fontSize: 7,
          color: "#999999",
          maxWidth: 180,
        },
        qrCode: {
          width: 70,
          height: 70,
        },
        footer: {
          backgroundColor: "#0a1929",
          padding: 8,
          alignItems: "center",
        },
        footerText: {
          fontSize: 7,
          color: "#ffffff",
          opacity: 0.7,
        },
      });

      const CardPdf = () => (
        <Document>
          <Page size={[400, 320]} style={styles.page}>
            <View style={styles.card}>
              {/* Tricolor */}
              <View style={styles.tricolor}>
                <View style={styles.saffron} />
                <View style={styles.white} />
                <View style={styles.green} />
              </View>

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerRow}>
                  <PdfImage src="/logo.png" style={styles.logo} />
                  <Text style={styles.headerText}>भारतीय नमो संघ</Text>
                </View>
                <Text style={styles.headerSubtext}>BHARTIYA NAMO SANGH (BNMS)</Text>
                <Text style={styles.headerTagline}>राष्ट्र सेवा | समाज सेवा | जन सेवा</Text>
              </View>

              {/* Badge */}
              {isPremiumOrLifetime && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {isLifetime ? "★ " : ""}{typeInfo.label}
                  </Text>
                </View>
              )}

              {/* Content */}
              <View style={styles.content}>
                {/* Avatar */}
                {member.avatar_url ? (
                  <PdfImage src={member.avatar_url} style={styles.avatarImage} />
                ) : (
                  <View style={styles.initials}>
                    <Text style={styles.initialsText}>
                      {member.first_name[0]}{member.last_name[0]}
                    </Text>
                  </View>
                )}

                {/* Details */}
                <View style={styles.details}>
                  <Text style={styles.name}>
                    {member.first_name} {member.last_name}
                  </Text>

                  <Text style={styles.label}>Membership No.</Text>
                  <Text style={styles.value}>{membershipNumberFormatted}</Text>

                  <Text style={styles.label}>Branch</Text>
                  <Text style={styles.value}>{member.branch?.name || "—"}</Text>

                  <View style={styles.row}>
                    <View>
                      <Text style={styles.label}>Member Since</Text>
                      <Text style={styles.value}>{formatShortDate(member.membership_issued_at)}</Text>
                    </View>
                    <View>
                      <Text style={styles.label}>Valid Until</Text>
                      <Text style={isLifetime ? styles.valueGold : styles.value}>
                        {isLifetime
                          ? "Lifetime"
                          : member.membership_expires_at
                          ? formatShortDate(member.membership_expires_at)
                          : "—"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* QR Section */}
              <View style={{ paddingHorizontal: 16 }}>
                <View style={styles.qrSection}>
                  <Text style={styles.qrText}>Scan QR code to verify membership</Text>
                  {qrDataUrl && <PdfImage src={qrDataUrl} style={styles.qrCode} />}
                </View>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  This card is the property of Bhartiya Namo Sangh
                </Text>
              </View>
            </View>
          </Page>
        </Document>
      );

      const blob = await pdf(<CardPdf />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `membership-card-${member.membership_number}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const initials = `${member.first_name[0]}${member.last_name[0]}`;

  return (
    <div className="space-y-4">
      {/* Card */}
      <div
        ref={cardRef}
        className="w-[360px] rounded-xl overflow-hidden shadow-lg border border-saffron-200 bg-white"
      >
        {/* Tricolor header */}
        <div className="h-3 flex">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#138808]" />
        </div>

        {/* Organization header */}
        <div className="bg-gradient-to-r from-saffron-700 to-saffron-500 px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Image
              src="/logo.png"
              alt="BNMS"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <h1 className="font-heading text-lg font-bold text-white">
              भारतीय नमो संघ
            </h1>
          </div>
          <p className="text-xs text-white/90">
            BHARTIYA NAMO SANGH (BNMS)
          </p>
          <p className="text-[10px] text-white/70 mt-0.5">
            राष्ट्र सेवा | समाज सेवा | जन सेवा
          </p>
        </div>

        {/* Membership type badge */}
        {isPremiumOrLifetime && (
          <div className="flex justify-center -mb-3 relative z-10">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                isLifetime
                  ? "bg-gradient-to-r from-gold to-yellow-500 text-white"
                  : "bg-gradient-to-r from-saffron-600 to-saffron-400 text-white"
              }`}
            >
              {isLifetime && <span>★</span>}
              {typeInfo.label}
            </span>
          </div>
        )}

        {/* Member details */}
        <div className={`p-4 ${isPremiumOrLifetime ? "pt-5" : ""}`}>
          <div className="flex items-start gap-4">
            {/* Photo */}
            <div className="flex-shrink-0 relative">
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt=""
                  className={`h-20 w-20 rounded-full object-cover border-2 ${
                    isLifetime
                      ? "border-gold"
                      : isPremiumOrLifetime
                      ? "border-saffron-400"
                      : "border-saffron-200"
                  }`}
                />
              ) : (
                <div
                  className={`h-20 w-20 rounded-full bg-saffron-100 flex items-center justify-center border-2 ${
                    isLifetime
                      ? "border-gold"
                      : isPremiumOrLifetime
                      ? "border-saffron-400"
                      : "border-saffron-200"
                  }`}
                >
                  <span className="font-heading text-2xl font-bold text-saffron-700">
                    {initials}
                  </span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h2 className="font-heading text-lg font-semibold text-navy truncate">
                {member.first_name} {member.last_name}
              </h2>

              <div className="mt-2 space-y-1 text-sm">
                <div>
                  <span className="text-navy/60 text-xs">Membership No.</span>
                  <p className="font-mono font-semibold text-navy text-sm">
                    {membershipNumberFormatted}
                  </p>
                </div>

                <div>
                  <span className="text-navy/60 text-xs">Branch</span>
                  <p className="text-navy font-medium text-sm">
                    {member.branch?.name || "—"}
                  </p>
                </div>

                <div className="flex gap-4">
                  <div>
                    <span className="text-navy/60 text-xs">Member Since</span>
                    <p className="text-navy text-sm">
                      {formatShortDate(member.membership_issued_at)}
                    </p>
                  </div>
                  <div>
                    <span className="text-navy/60 text-xs">Valid Until</span>
                    <p className={`text-sm font-medium ${isLifetime ? "text-gold" : "text-navy"}`}>
                      {isLifetime
                        ? "Lifetime"
                        : member.membership_expires_at
                        ? formatShortDate(member.membership_expires_at)
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code section */}
          <div className="mt-4 pt-3 border-t border-saffron-100 flex items-center justify-between">
            <div className="text-[10px] text-navy/50 max-w-[180px]">
              Scan QR code to verify membership
            </div>
            <canvas
              ref={qrCanvasRef}
              className="rounded"
              style={{ width: 80, height: 80 }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-navy px-4 py-2 text-center">
          <p className="text-[10px] text-white/70">
            This card is the property of Bhartiya Namo Sangh
          </p>
        </div>
      </div>

      {/* Download buttons */}
      {showDownload && (
        <div className="w-[360px] flex gap-2">
          <button
            onClick={handleDownloadPng}
            className="flex-1 rounded-md bg-saffron-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800 transition-colors flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            PNG
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf || !qrDataUrl}
            className="flex-1 rounded-md border-2 border-saffron-700 px-4 py-2.5 text-sm font-semibold text-saffron-700 hover:bg-saffron-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            {downloadingPdf ? "..." : "PDF"}
          </button>
        </div>
      )}
    </div>
  );
}
