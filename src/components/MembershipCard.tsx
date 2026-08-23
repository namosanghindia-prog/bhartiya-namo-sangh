"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { toPng } from "html-to-image";
import { createClient } from "@/lib/supabase/client";

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
    designation?: string | null;
    branch?: { name: string; state?: string | null } | null;
  };
  showDownload?: boolean;
}

interface Office {
  label: string;
  address: string;
}

interface OrgContact {
  phone_primary: string | null;
  phone_secondary: string | null;
  primary_email: string | null;
  offices: Office[] | null;
  address_line: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
}

const STATE_CODES: Record<string, string> = {
  delhi: "DL",
  maharashtra: "MH",
  karnataka: "KA",
  rajasthan: "RJ",
  "uttar pradesh": "UP",
  gujarat: "GJ",
  "west bengal": "WB",
  "tamil nadu": "TN",
  "madhya pradesh": "MP",
};

const WEBSITE_LABEL = "www.bhartiyanamosangh.com";
const SOCIAL_HANDLE = "/ BNMSOfficial";
const REGD_NO = "Regd. No. 1086";

const TERMS = [
  "यह पहचान पत्र केवल भारतीय नमो संघ (BNMS) के कार्य हेतु मान्य है।",
  "यह कार्ड किसी अन्य को हस्तांतरित नहीं किया जा सकता।",
  "इस कार्ड का दुरुपयोग करने वाले सदस्य के विरुद्ध संगठन द्वारा अनुशासनात्मक कार्यवाही की जा सकती है।",
  "कार्ड खोने/क्षतिग्रस्त होने पर तुरंत संगठन कार्यालय को सूचित करें।",
  "यह कार्ड संगठन की संपत्ति है, आवश्यकता पड़ने पर लौटाना अनिवार्य है।",
];

const BACK_TAGLINE =
  "एक संगठन जो भारत द्वारा जन कल्याणकारी योजनाओं की हर कड़ी एवं जन-जन तक पहुंचाने के लिए प्रतिबद्ध हैं।";

export function getStateCode(state: string | null | undefined): string {
  if (!state) return "IN";
  return STATE_CODES[state.trim().toLowerCase()] || "IN";
}

export function formatMembershipId(
  membershipNumber: number,
  state: string | null | undefined
): string {
  const padded = membershipNumber.toString().padStart(4, "0");
  return `BNMS/${getStateCode(state)}/MEM/${padded}`;
}

export function barcodeValue(membershipNumber: number): string {
  return `BNMS${membershipNumber.toString().padStart(4, "0")}`;
}

function formatDDMMYYYY(dateStr: string): string {
  const d = new Date(dateStr);
  const dd = d.getDate().toString().padStart(2, "0");
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function headOfficeAddress(c: OrgContact | null): string | null {
  if (!c) return null;
  const offices = (c.offices ?? []).filter((o) => o && o.address);
  if (offices.length > 0) {
    const head = offices.find((o) => /head/i.test(o.label || ""));
    return (head ?? offices[0]).address;
  }
  const parts = [c.address_line, c.city, c.state, c.pincode].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

/* ---------- Small inline icons (lucide-style) ---------- */
const iconProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} {...iconProps}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} {...iconProps}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IconBadge({ className }: { className?: string }) {
  return (
    <svg className={className} {...iconProps}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="M15 8h3M15 12h3M7 16h10" />
    </svg>
  );
}
function IconPhone({ className }: { className?: string }) {
  return (
    <svg className={className} {...iconProps}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function IconGlobe({ className }: { className?: string }) {
  return (
    <svg className={className} {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
function IconMail({ className }: { className?: string }) {
  return (
    <svg className={className} {...iconProps}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 7L2 7" />
    </svg>
  );
}
function IconPin({ className }: { className?: string }) {
  return (
    <svg className={className} {...iconProps}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function IconFacebook({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconYoutube({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white" />
    </svg>
  );
}

/* ---------- Shared card chrome ---------- */

function TricolorCorners() {
  // Diagonal saffron / white / green bands tucked into each top corner.
  const bands = (angle: number) =>
    `linear-gradient(${angle}deg, #FF9933 0 14px, #f4f4f4 14px 26px, #138808 26px 40px, transparent 40px)`;
  return (
    <>
      <div
        className="pointer-events-none absolute top-0 left-0 h-14 w-14"
        style={{ background: bands(135), clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-0 right-0 h-14 w-14"
        style={{ background: bands(225), clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}
        aria-hidden="true"
      />
    </>
  );
}

function LanyardHole() {
  return (
    <div
      className="absolute left-1/2 top-2 -translate-x-1/2 h-2.5 w-10 rounded-full bg-[#e9eef3] border border-[#c9d3dd] shadow-inner"
      aria-hidden="true"
    />
  );
}

function OrgHeader({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${compact ? "px-4 pt-6" : "px-4 pt-7"}`}>
      <div
        className={`flex-shrink-0 rounded-full bg-white border-2 border-saffron-500 shadow-sm flex items-center justify-center overflow-hidden ${
          compact ? "h-11 w-11" : "h-14 w-14"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="BNMS" className={compact ? "h-9 w-9" : "h-12 w-12"} />
      </div>
      <div className="min-w-0">
        <div
          className={`font-heading font-extrabold leading-tight text-[#0a1929] ${
            compact ? "text-lg" : "text-[22px]"
          }`}
        >
          भारतीय नमो संघ
        </div>
        <div className={`font-semibold text-[#0a1929]/70 ${compact ? "text-[10px]" : "text-xs"}`}>
          (BNMS)
        </div>
        <span
          className={`mt-1 inline-block rounded-full bg-saffron-600 text-white font-semibold leading-none ${
            compact ? "px-2 py-[3px] text-[8px]" : "px-2.5 py-1 text-[9px]"
          }`}
        >
          राष्ट्र सेवा में समर्पित सामाजिक महासंघ
        </span>
      </div>
    </div>
  );
}

/* ---------- Component ---------- */

export default function MembershipCard({ member, showDownload = true }: MembershipCardProps) {
  const bothRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);

  const [downloading, setDownloading] = useState<"png" | "pdf" | null>(null);
  const [side, setSide] = useState<"front" | "back">("front");
  const [org, setOrg] = useState<OrgContact | null>(null);

  const verificationUrl = `https://bhartiya-namo-sangh-git-main-namosangh.vercel.app/verify/${member.id}`;
  const stateName = member.branch?.state ?? null;
  const membershipId = formatMembershipId(member.membership_number, stateName);
  const barcodeText = barcodeValue(member.membership_number);
  const isLifetime =
    member.membership_type === "lifetime" || !member.membership_expires_at;
  const issued = formatDDMMYYYY(member.membership_issued_at);
  const validity = isLifetime
    ? "आजीवन"
    : `${issued} से ${formatDDMMYYYY(member.membership_expires_at as string)}`;
  const initials = `${member.first_name[0] ?? ""}${member.last_name[0] ?? ""}`;

  // Organisation contact details
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("organization_settings")
        .select(
          "phone_primary, phone_secondary, primary_email, offices, address_line, city, state, pincode, facebook_url, instagram_url, youtube_url"
        )
        .eq("id", 1)
        .single();
      if (!cancelled && data) setOrg(data as OrgContact);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // QR code
  useEffect(() => {
    if (!qrCanvasRef.current) return;
    QRCode.toCanvas(qrCanvasRef.current, verificationUrl, {
      width: 64,
      margin: 1,
      color: { dark: "#0a1929", light: "#ffffff" },
    }).catch((err) => console.error("QR generation failed:", err));
  }, [verificationUrl]);

  // Barcode
  useEffect(() => {
    if (!barcodeCanvasRef.current) return;
    try {
      JsBarcode(barcodeCanvasRef.current, barcodeText, {
        format: "CODE128",
        displayValue: false,
        width: 2,
        height: 40,
        margin: 4,
        background: "#ffffff",
        lineColor: "#0a1929",
      });
    } catch (err) {
      console.error("Barcode generation failed:", err);
    }
  }, [barcodeText]);

  const snapshot = useCallback(async (el: HTMLElement) => {
    return toPng(el, { cacheBust: true, pixelRatio: 3, backgroundColor: "#ffffff" });
  }, []);

  const handleDownloadPng = async () => {
    if (!bothRef.current) return;
    setDownloading("png");
    try {
      const dataUrl = await snapshot(bothRef.current);
      const link = document.createElement("a");
      link.download = `membership-card-${member.membership_number}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to download card:", error);
      alert("Failed to download the ID card. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadPdf = async () => {
    if (!frontRef.current || !backRef.current) return;
    setDownloading("pdf");
    try {
      const [frontPng, backPng] = await Promise.all([
        snapshot(frontRef.current),
        snapshot(backRef.current),
      ]);
      const w = frontRef.current.offsetWidth;
      const h = Math.max(frontRef.current.offsetHeight, backRef.current.offsetHeight);

      const { pdf, Document, Page, Image: PdfImage } = await import("@react-pdf/renderer");
      // 1 CSS px ≈ 0.75pt; keep the card at real ID-card size on the page
      const scale = 0.75;
      const pageW = w * scale + 40;
      const pageH = h * scale + 40;

      const CardPdf = () => (
        <Document title={`BNMS Membership Card ${membershipId}`}>
          <Page size={[pageW, pageH]} style={{ padding: 20, backgroundColor: "#ffffff" }}>
            <PdfImage src={frontPng} style={{ width: w * scale, height: h * scale }} />
          </Page>
          <Page size={[pageW, pageH]} style={{ padding: 20, backgroundColor: "#ffffff" }}>
            <PdfImage src={backPng} style={{ width: w * scale, height: h * scale }} />
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
      setDownloading(null);
    }
  };

  const phones = [org?.phone_primary, org?.phone_secondary].filter(Boolean) as string[];
  const address = headOfficeAddress(org);
  const hasSocial = !!(org?.facebook_url || org?.instagram_url || org?.youtube_url);

  const cardBase =
    "relative w-[320px] min-h-[508px] flex flex-col overflow-hidden rounded-2xl bg-white border border-[#d7dde4] shadow-lg text-[#0a1929]";

  return (
    <div className="space-y-4 w-full flex flex-col items-center">
      {/* Front / Back toggle (small screens only — both sides show on lg+) */}
      <div className="flex lg:hidden rounded-md border border-saffron-200 overflow-hidden text-xs font-semibold">
        <button
          type="button"
          onClick={() => setSide("front")}
          className={`px-4 py-1.5 ${side === "front" ? "bg-saffron-700 text-white" : "text-navy/70"}`}
        >
          Front / आगे
        </button>
        <button
          type="button"
          onClick={() => setSide("back")}
          className={`px-4 py-1.5 ${side === "back" ? "bg-saffron-700 text-white" : "text-navy/70"}`}
        >
          Back / पीछे
        </button>
      </div>

      <div ref={bothRef} className="flex flex-col lg:flex-row gap-6 p-2 bg-white">
        {/* ================= FRONT ================= */}
        <div
          ref={frontRef}
          className={`${cardBase} ${side === "front" ? "" : "hidden lg:flex"}`}
        >
          <TricolorCorners />
          <LanyardHole />
          <span className="absolute top-[34px] right-3 z-10 text-[9px] font-semibold text-[#0a1929]/70 tracking-wide">
            {REGD_NO}
          </span>

          <div className="relative z-10">
            <OrgHeader />
          </div>

          {/* Photo + identity */}
          <div className="relative z-10 px-4 pt-4 flex items-start gap-4">
            <div className="flex-shrink-0 h-[96px] w-[80px] rounded-lg overflow-hidden border-2 border-saffron-400 bg-saffron-50 shadow-sm">
              {member.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center font-heading text-2xl font-bold text-saffron-700">
                  {initials}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <h2 className="font-heading text-xl font-bold leading-tight break-words">
                {member.first_name} {member.last_name}
              </h2>
              {member.designation && (
                <p className="mt-1 text-sm font-semibold text-[#138808] break-words">
                  {member.designation}
                </p>
              )}
              {stateName && (
                <p className="mt-0.5 text-xs text-[#0a1929]/70">{stateName}</p>
              )}
            </div>
          </div>

          {/* Member number bar */}
          <div className="relative z-10 mt-4 mx-4 rounded-lg bg-[#0a1929] text-white px-3 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <IconUser className="h-5 w-5 flex-shrink-0 text-saffron-400" />
              <div className="min-w-0">
                <div className="text-[10px] text-white/70 leading-tight">सदस्य क्रमांक</div>
                <div className="font-mono text-sm font-bold text-[#ff5a5a] tracking-wide leading-tight">
                  {membershipId}
                </div>
              </div>
            </div>
            <canvas
              ref={qrCanvasRef}
              className="rounded-sm bg-white flex-shrink-0"
              style={{ width: 56, height: 56 }}
              aria-label="Verification QR code"
            />
          </div>

          {/* Detail rows */}
          <div className="relative z-10 px-4 pt-3 pb-3 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <IconCalendar className="h-4 w-4 flex-shrink-0 text-saffron-700 mt-0.5" />
              <div>
                <span className="text-[#0a1929]/60">निर्गमन तिथि: </span>
                <span className="font-semibold">{issued}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <IconBadge className="h-4 w-4 flex-shrink-0 text-saffron-700 mt-0.5" />
              <div>
                <span className="text-[#0a1929]/60">वैधता अवधि: </span>
                <span className={`font-semibold ${isLifetime ? "text-gold" : ""}`}>{validity}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <IconPhone className="h-4 w-4 flex-shrink-0 text-saffron-700 mt-0.5" />
              <div>
                <span className="text-[#0a1929]/60">संपर्क: </span>
                <span className="font-semibold">{phones.length ? phones.join(", ") : "—"}</span>
              </div>
            </div>
          </div>

          <div className="flex-1" />

          {/* Bottom bar */}
          <div className="relative z-10 bg-[#0a1929] text-white px-4 py-2 flex items-center justify-center gap-2 text-xs font-semibold tracking-wide">
            <IconGlobe className="h-4 w-4 text-saffron-400" />
            <span>{WEBSITE_LABEL}</span>
          </div>
        </div>

        {/* ================= BACK ================= */}
        <div
          ref={backRef}
          className={`${cardBase} ${side === "back" ? "" : "hidden lg:flex"}`}
        >
          <TricolorCorners />
          <LanyardHole />

          <div className="relative z-10">
            <OrgHeader compact />
          </div>

          {/* Terms */}
          <div className="relative z-10 px-4 pt-3">
            <h3 className="text-xs font-bold text-saffron-800 border-b border-saffron-200 pb-1 mb-1.5">
              निर्देश / शर्तें
            </h3>
            <ol className="space-y-1 text-[9.5px] leading-snug text-[#0a1929]/85 list-decimal pl-4">
              {TERMS.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          </div>

          {/* Contact box */}
          <div className="relative z-10 mx-4 mt-3 rounded-lg border border-saffron-200 bg-saffron-50 px-3 py-2">
            <h3 className="text-[10px] font-bold text-saffron-800 mb-1">संपर्क करें</h3>
            <ul className="space-y-1 text-[9.5px] leading-snug">
              <li className="flex items-start gap-1.5">
                <IconPhone className="h-3 w-3 flex-shrink-0 text-saffron-700 mt-[1px]" />
                <span>{phones.length ? phones.join(", ") : "—"}</span>
              </li>
              <li className="flex items-start gap-1.5">
                <IconMail className="h-3 w-3 flex-shrink-0 text-saffron-700 mt-[1px]" />
                <span className="break-all">{org?.primary_email ?? "—"}</span>
              </li>
              <li className="flex items-start gap-1.5">
                <IconGlobe className="h-3 w-3 flex-shrink-0 text-saffron-700 mt-[1px]" />
                <span>{WEBSITE_LABEL}</span>
              </li>
              <li className="flex items-start gap-1.5">
                <IconPin className="h-3 w-3 flex-shrink-0 text-saffron-700 mt-[1px]" />
                <span>{address ?? "—"}</span>
              </li>
            </ul>
          </div>

          {/* Barcode */}
          <div className="relative z-10 mt-3 px-4 flex flex-col items-center">
            <canvas
              ref={barcodeCanvasRef}
              className="max-w-full"
              style={{ height: 40 }}
              aria-label={`Barcode ${barcodeText}`}
            />
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#0a1929]/80">
              {barcodeText}
            </span>
          </div>

          <div className="flex-1" />

          {/* Social row */}
          <div className="relative z-10 px-4 pb-2 flex items-center justify-center gap-2 text-[10px] text-[#0a1929]/70">
            {hasSocial && (
              <div className="flex items-center gap-1.5">
                {org?.facebook_url && (
                  <span className="h-5 w-5 rounded-full bg-[#0a1929] text-white flex items-center justify-center">
                    <IconFacebook className="h-3 w-3" />
                  </span>
                )}
                {org?.instagram_url && (
                  <span className="h-5 w-5 rounded-full bg-[#0a1929] text-white flex items-center justify-center">
                    <IconInstagram className="h-3 w-3" />
                  </span>
                )}
                {org?.youtube_url && (
                  <span className="h-5 w-5 rounded-full bg-[#0a1929] text-white flex items-center justify-center">
                    <IconYoutube className="h-3 w-3" />
                  </span>
                )}
              </div>
            )}
            <span className="font-semibold">{SOCIAL_HANDLE}</span>
          </div>

          {/* Bottom bar */}
          <div className="relative z-10 bg-[#0a1929] px-4 py-2 text-center">
            <p className="text-[9px] leading-snug font-semibold text-[#f2c94c]">{BACK_TAGLINE}</p>
          </div>
        </div>
      </div>

      {/* Download buttons */}
      {showDownload && (
        <div className="w-full max-w-[320px] flex gap-2">
          <button
            onClick={handleDownloadPng}
            disabled={downloading !== null}
            className="flex-1 rounded-md bg-saffron-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" {...iconProps}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {downloading === "png" ? "..." : "PNG"}
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloading !== null}
            className="flex-1 rounded-md border-2 border-saffron-700 px-4 py-2.5 text-sm font-semibold text-saffron-700 hover:bg-saffron-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" {...iconProps}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            {downloading === "pdf" ? "..." : "PDF"}
          </button>
        </div>
      )}
    </div>
  );
}
