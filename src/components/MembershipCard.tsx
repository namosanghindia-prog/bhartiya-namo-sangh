"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { toPng } from "html-to-image";
import { createClient } from "@/lib/supabase/client";
import { formatMembershipId, barcodeValue, verificationUrl as buildVerificationUrl } from "@/lib/membership";

export { formatMembershipId, barcodeValue, getStateCode } from "@/lib/membership";

/* ------------------------------------------------------------------ */
/*  Physical size: ISO/IEC 7810 ID-1 (Aadhaar / PAN / bank card)       */
/*  85.6mm × 53.98mm  →  1.586:1                                        */
/* ------------------------------------------------------------------ */
const CARD_MM_W = 85.6;
const CARD_MM_H = 53.98;
/** On-screen design canvas (CSS px). Everything inside is laid out at this size. */
const CARD_W = 400;
const CARD_H = 252; // 400 / 1.586
/** 300 DPI raster size used for PNG + PDF. */
const PRINT_W = 1013;
const PRINT_RATIO = PRINT_W / CARD_W; // ≈ 2.53 → 1013 × 638
/** 1 mm = 72 / 25.4 pt */
const MM_TO_PT = 72 / 25.4;
/** QR display size on the design canvas (CSS px) ≈ 11.8 mm on the printed card. */
const QR_SIZE = 44;

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
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#0a1929" />
    </svg>
  );
}

/* ---------- Shared card chrome ---------- */

function TricolorCorners() {
  // Diagonal saffron / white / green bands tucked into each top corner.
  const bands = (angle: number) =>
    `linear-gradient(${angle}deg, #FF9933 0 8px, #f4f4f4 8px 15px, #138808 15px 23px, transparent 23px)`;
  return (
    <>
      <div
        className="pointer-events-none absolute top-0 left-0 h-8 w-8"
        style={{ background: bands(135), clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-0 right-0 h-8 w-8"
        style={{ background: bands(225), clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}
        aria-hidden="true"
      />
    </>
  );
}

function LanyardHole() {
  return (
    <div
      className="absolute left-1/2 top-[5px] -translate-x-1/2 h-[6px] w-7 rounded-full bg-[#e9eef3] border border-[#c9d3dd]"
      aria-hidden="true"
    />
  );
}

function OrgHeader({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 ${compact ? "pt-[14px]" : "pt-4"}`}>
      <div
        className={`flex-shrink-0 rounded-full bg-white border-[1.5px] border-saffron-500 flex items-center justify-center overflow-hidden ${
          compact ? "h-7 w-7" : "h-9 w-9"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="BNMS" className={compact ? "h-6 w-6" : "h-[30px] w-[30px]"} />
      </div>
      <div className="min-w-0">
        <div
          className={`font-heading font-extrabold leading-none text-[#0a1929] ${
            compact ? "text-[12px]" : "text-[15px]"
          }`}
        >
          भारतीय नमो संघ
        </div>
        <div className="mt-[3px] flex items-center gap-1.5">
          <span className={`font-semibold text-[#0a1929]/70 ${compact ? "text-[6.5px]" : "text-[7.5px]"}`}>
            (BNMS)
          </span>
          <span
            className={`inline-block rounded-full bg-saffron-600 text-white font-semibold leading-none ${
              compact ? "px-1.5 py-[2px] text-[6px]" : "px-1.5 py-[2.5px] text-[6.5px]"
            }`}
          >
            राष्ट्र सेवा में समर्पित सामाजिक महासंघ
          </span>
        </div>
      </div>
    </div>
  );
}

/** Keeps the fixed-size design canvas and scales it down to fit narrow containers. */
function ScaledCard({ children }: { children: React.ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? CARD_W;
      setScale(Math.min(1, w / CARD_W));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={outerRef}
      className="w-full max-w-[400px]"
      style={{ aspectRatio: `${CARD_MM_W} / ${CARD_MM_H}` }}
    >
      <div
        style={{
          width: CARD_W,
          height: CARD_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------- Component ---------- */

export default function MembershipCard({ member, showDownload = true }: MembershipCardProps) {
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);

  const [downloading, setDownloading] = useState<"front" | "back" | "pdf" | null>(null);
  const [side, setSide] = useState<"front" | "back">("front");
  const [org, setOrg] = useState<OrgContact | null>(null);

  const verificationUrl = buildVerificationUrl(member.id);
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

  // QR code — rendered at print resolution, displayed smaller via CSS so it stays crisp.
  useEffect(() => {
    if (!qrCanvasRef.current) return;
    const canvas = qrCanvasRef.current;
    QRCode.toCanvas(canvas, verificationUrl, {
      width: 176,
      margin: 1,
      color: { dark: "#0a1929", light: "#ffffff" },
    })
      .then(() => {
        // qrcode writes its own inline size; shrink it back to the card's QR slot.
        canvas.style.width = `${QR_SIZE}px`;
        canvas.style.height = `${QR_SIZE}px`;
      })
      .catch((err) => console.error("QR generation failed:", err));
  }, [verificationUrl]);

  // Barcode — same idea: large intrinsic canvas, CSS-scaled.
  useEffect(() => {
    if (!barcodeCanvasRef.current) return;
    try {
      JsBarcode(barcodeCanvasRef.current, barcodeText, {
        format: "CODE128",
        displayValue: false,
        width: 2,
        height: 64,
        margin: 0,
        background: "#ffffff",
        lineColor: "#0a1929",
      });
    } catch (err) {
      console.error("Barcode generation failed:", err);
    }
  }, [barcodeText]);

  /** Rasterise one side at 300 DPI (1013 × 638). */
  const snapshot = useCallback(async (el: HTMLElement) => {
    return toPng(el, {
      cacheBust: true,
      pixelRatio: PRINT_RATIO,
      width: CARD_W,
      height: CARD_H,
      backgroundColor: "#ffffff",
    });
  }, []);

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
  };

  const handleDownloadPng = async (which: "front" | "back") => {
    const el = which === "front" ? frontRef.current : backRef.current;
    if (!el) return;
    setDownloading(which);
    try {
      const dataUrl = await snapshot(el);
      downloadDataUrl(dataUrl, `membership-card-${member.membership_number}-${which}.png`);
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

      const { pdf, Document, Page, Image: PdfImage } = await import("@react-pdf/renderer");
      // Page is exactly ID-1 size so "print at 100%" gives a true-to-size card.
      const pageW = CARD_MM_W * MM_TO_PT;
      const pageH = CARD_MM_H * MM_TO_PT;
      const pageStyle = { padding: 0, backgroundColor: "#ffffff" };
      const imgStyle = { width: pageW, height: pageH };

      const CardPdf = () => (
        <Document title={`BNMS Membership Card ${membershipId}`}>
          <Page size={[pageW, pageH]} style={pageStyle}>
            <PdfImage src={frontPng} style={imgStyle} />
          </Page>
          <Page size={[pageW, pageH]} style={pageStyle}>
            <PdfImage src={backPng} style={imgStyle} />
          </Page>
        </Document>
      );

      const blob = await pdf(<CardPdf />).toBlob();
      const url = URL.createObjectURL(blob);
      downloadDataUrl(url, `membership-card-${member.membership_number}.pdf`);
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
    "relative flex flex-col overflow-hidden rounded-[10px] bg-white border border-[#d7dde4] text-[#0a1929] shadow-md";
  const cardStyle = { width: CARD_W, height: CARD_H };

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Front / Back toggle — both sides show side-by-side on xl */}
      <div className="flex xl:hidden rounded-md border border-saffron-200 overflow-hidden text-xs font-semibold">
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

      <div className="w-full flex flex-col xl:flex-row items-center xl:items-start justify-center gap-5">
        {/* ================= FRONT ================= */}
        <div className={`w-full max-w-[400px] ${side === "front" ? "" : "hidden xl:block"}`}>
          <ScaledCard>
            <div ref={frontRef} className={cardBase} style={cardStyle}>
              <TricolorCorners />
              <LanyardHole />
              <span className="absolute top-[13px] right-6 z-10 text-[6.5px] font-semibold text-[#0a1929]/70 tracking-wide">
                {REGD_NO}
              </span>

              <div className="relative z-10">
                <OrgHeader />
              </div>

              {/* Photo + identity + ID bar */}
              <div className="relative z-10 px-3 pt-2 flex items-start gap-2.5">
                <div className="flex-shrink-0 h-[104px] w-[82px] rounded-md overflow-hidden border-[1.5px] border-saffron-400 bg-saffron-50">
                  {member.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center font-heading text-xl font-bold text-saffron-700">
                      {initials}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 h-[104px] flex flex-col">
                  <h2 className="font-heading text-[13px] font-bold leading-[1.15] line-clamp-2 break-words">
                    {member.first_name} {member.last_name}
                  </h2>
                  {member.designation && (
                    <p className="mt-[3px] text-[9px] font-semibold leading-tight text-[#138808] truncate">
                      {member.designation}
                    </p>
                  )}
                  {stateName && (
                    <p className="mt-[2px] text-[8px] leading-tight text-[#0a1929]/70 truncate">
                      {stateName}
                    </p>
                  )}

                  {/* Member number bar */}
                  <div className="mt-auto h-[50px] rounded-md bg-[#0a1929] text-white pl-2 pr-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <IconUser className="h-3.5 w-3.5 flex-shrink-0 text-saffron-400" />
                      <div className="min-w-0">
                        <div className="text-[6.5px] text-white/70 leading-none">सदस्य क्रमांक</div>
                        <div className="mt-[3px] font-mono text-[10px] font-bold text-[#ff5a5a] tracking-wide leading-none whitespace-nowrap">
                          {membershipId}
                        </div>
                      </div>
                    </div>
                    <canvas
                      ref={qrCanvasRef}
                      className="rounded-[2px] bg-white flex-shrink-0"
                      style={{ width: QR_SIZE, height: QR_SIZE }}
                      aria-label="Verification QR code"
                    />
                  </div>
                </div>
              </div>

              {/* Detail rows */}
              <div className="relative z-10 px-3 flex-1 flex flex-col justify-center gap-[5px] text-[8px] leading-none">
                <div className="flex items-center gap-1.5">
                  <IconCalendar className="h-[9px] w-[9px] flex-shrink-0 text-saffron-700" />
                  <span className="text-[#0a1929]/60">निर्गमन तिथि:</span>
                  <span className="font-semibold">{issued}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <IconBadge className="h-[9px] w-[9px] flex-shrink-0 text-saffron-700" />
                  <span className="text-[#0a1929]/60">वैधता अवधि:</span>
                  <span className={`font-semibold ${isLifetime ? "text-gold" : ""}`}>{validity}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <IconPhone className="h-[9px] w-[9px] flex-shrink-0 text-saffron-700" />
                  <span className="text-[#0a1929]/60">संपर्क:</span>
                  <span className="font-semibold">{phones.length ? phones.join(", ") : "—"}</span>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="relative z-10 bg-[#0a1929] text-white px-3 h-[18px] flex items-center justify-center gap-1.5 text-[7.5px] font-semibold tracking-wide">
                <IconGlobe className="h-[9px] w-[9px] text-saffron-400" />
                <span>{WEBSITE_LABEL}</span>
              </div>
            </div>
          </ScaledCard>
        </div>

        {/* ================= BACK ================= */}
        <div className={`w-full max-w-[400px] ${side === "back" ? "" : "hidden xl:block"}`}>
          <ScaledCard>
            <div ref={backRef} className={cardBase} style={cardStyle}>
              <TricolorCorners />
              <LanyardHole />

              <div className="relative z-10">
                <OrgHeader compact />
              </div>

              <div className="relative z-10 px-3 pt-2 pb-1.5 flex-1 min-h-0 flex gap-2.5">
                {/* Terms + barcode */}
                <div className="w-[56%] min-w-0 flex flex-col">
                  <h3 className="text-[7.5px] font-bold leading-none text-saffron-800 border-b border-saffron-200 pb-[3px] mb-[4px]">
                    निर्देश / शर्तें
                  </h3>
                  <ol className="space-y-[3px] text-[7.5px] leading-[1.35] text-[#0a1929]/85 list-decimal pl-[11px]">
                    {TERMS.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ol>
                  <div className="mt-auto pt-1 flex flex-col items-center">
                    <canvas
                      ref={barcodeCanvasRef}
                      style={{ height: 34, width: "auto", maxWidth: "100%" }}
                      aria-label={`Barcode ${barcodeText}`}
                    />
                    <span className="mt-[2px] font-mono text-[6.5px] leading-none tracking-[0.25em] text-[#0a1929]/80">
                      {barcodeText}
                    </span>
                  </div>
                </div>

                {/* Contact + social */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="rounded-md border border-saffron-200 bg-saffron-50 px-2 py-1.5">
                    <h3 className="text-[7.5px] font-bold leading-none text-saffron-800 mb-[5px]">संपर्क करें</h3>
                    <ul className="space-y-[3px] text-[7px] leading-[1.3]">
                      <li className="flex items-start gap-1">
                        <IconPhone className="h-[8px] w-[8px] flex-shrink-0 text-saffron-700 mt-[0.5px]" />
                        <span className="truncate">{phones.length ? phones.join(", ") : "—"}</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <IconMail className="h-[8px] w-[8px] flex-shrink-0 text-saffron-700 mt-[0.5px]" />
                        <span className="truncate">{org?.primary_email ?? "—"}</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <IconGlobe className="h-[8px] w-[8px] flex-shrink-0 text-saffron-700 mt-[0.5px]" />
                        <span className="truncate">{WEBSITE_LABEL}</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <IconPin className="h-[8px] w-[8px] flex-shrink-0 text-saffron-700 mt-[0.5px]" />
                        <span className="line-clamp-2">{address ?? "—"}</span>
                      </li>
                    </ul>
                  </div>

                  {/* Social row */}
                  <div className="mt-auto flex items-center justify-center gap-1.5 text-[6.5px] text-[#0a1929]/70">
                    {hasSocial && (
                      <div className="flex items-center gap-1">
                        {org?.facebook_url && (
                          <span className="h-[14px] w-[14px] rounded-full bg-[#0a1929] text-white flex items-center justify-center">
                            <IconFacebook className="h-[8px] w-[8px]" />
                          </span>
                        )}
                        {org?.instagram_url && (
                          <span className="h-[14px] w-[14px] rounded-full bg-[#0a1929] text-white flex items-center justify-center">
                            <IconInstagram className="h-[8px] w-[8px]" />
                          </span>
                        )}
                        {org?.youtube_url && (
                          <span className="h-[14px] w-[14px] rounded-full bg-[#0a1929] text-white flex items-center justify-center">
                            <IconYoutube className="h-[8px] w-[8px]" />
                          </span>
                        )}
                      </div>
                    )}
                    <span className="font-semibold">{SOCIAL_HANDLE}</span>
                  </div>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="relative z-10 bg-[#0a1929] px-3 py-[3px] text-center">
                <p className="text-[6px] leading-[1.3] font-semibold text-[#f2c94c]">{BACK_TAGLINE}</p>
              </div>
            </div>
          </ScaledCard>
        </div>
      </div>

      {/* Download buttons */}
      {showDownload && (
        <div className="w-full max-w-[400px] flex gap-2">
          <button
            onClick={() => handleDownloadPng("front")}
            disabled={downloading !== null}
            className="flex-1 rounded-md bg-saffron-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" {...iconProps}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {downloading === "front" ? "..." : "PNG Front"}
          </button>
          <button
            onClick={() => handleDownloadPng("back")}
            disabled={downloading !== null}
            className="flex-1 rounded-md bg-saffron-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" {...iconProps}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {downloading === "back" ? "..." : "PNG Back"}
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloading !== null}
            className="flex-1 rounded-md border-2 border-saffron-700 px-3 py-2.5 text-sm font-semibold text-saffron-700 hover:bg-saffron-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" {...iconProps}>
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
