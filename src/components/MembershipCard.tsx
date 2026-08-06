"use client";

import { useRef, useEffect } from "react";
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
  normal: { label: "Member", labelHi: "सदस्य" },
  premium: { label: "Premium Member", labelHi: "प्रीमियम सदस्य" },
  lifetime: { label: "Lifetime Member", labelHi: "आजीवन सदस्य" },
};

function formatMembershipNumber(membershipNumber: number, issuedAt: string): string {
  const year = new Date(issuedAt).getFullYear().toString().slice(-2);
  const paddedNumber = membershipNumber.toString().padStart(4, "0");
  return `BNMS/MEM/${paddedNumber}/${year}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
    }
    generateQR();
  }, [verificationUrl]);

  const handleDownload = async () => {
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
          <h1 className="font-heading text-lg font-bold text-white">
            भारतीय नमो संघ
          </h1>
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

      {/* Download button */}
      {showDownload && (
        <button
          onClick={handleDownload}
          className="w-[360px] rounded-md bg-saffron-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800 transition-colors flex items-center justify-center gap-2"
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
          Download as Image
        </button>
      )}
    </div>
  );
}
