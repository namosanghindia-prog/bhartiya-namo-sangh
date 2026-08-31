"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { createClient } from "@/lib/supabase/client";
import { getStateCode, verificationUrl as buildVerificationUrl } from "@/lib/membership";
import OrgHeader from "@/components/OrgHeader";

/* ------------------------------------------------------------------ */
/*  Physical size: ISO A4 portrait — 210mm × 297mm                      */
/* ------------------------------------------------------------------ */
const PAGE_MM_W = 210;
const PAGE_MM_H = 297;
/** On-screen design canvas (CSS px) — A4 at 96 DPI. Everything is laid out here. */
const PAGE_W = 794;
const PAGE_H = 1123;
/** Raster scale used for the PDF: 794 × 2.5 ≈ 1985 px wide ≈ 240 DPI on A4. */
const PRINT_RATIO = 2.5;
/** 1 mm = 72 / 25.4 pt → A4 is 595.28 × 841.89 pt. */
const MM_TO_PT = 72 / 25.4;
/** QR display size on the design canvas (CSS px) ≈ 22 mm on the printed page. */
const QR_SIZE = 84;

interface AppointmentLetterProps {
  member: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    membership_number: number;
    membership_issued_at: string;
    designation?: string | null;
    branch?: { name: string; state?: string | null } | null;
  };
  showDownload?: boolean;
}

interface OrgContact {
  phone_primary: string | null;
  phone_secondary: string | null;
  primary_email: string | null;
  website_url: string | null;
}

const TOP_TAGLINE = "सेवा ही संगठन, संगठन ही शक्ति, शक्ति ही विजय";

/** Statutory registration details, reproduced verbatim from the printed letterhead. */
const REGISTRATION_LINES = [
  "Reg. by Planning Commission NITI Aayog",
  "Unique ID of NGO: DL/2018/0185185",
  "Certificate No.: IN-DL8246933040808BP",
  "Registration CSR Activities: CSR00062225",
  "National Level Society/NGO/Trust | Regd. No. 1086",
];

const OBJECTIVES = [
  "भारत सरकार की जनकल्याणकारी योजनाओं को जन-जन तक पहुँचाना।",
  "समाज के अंतिम व्यक्ति तक योजनाओं का लाभ पहुँचाने में सहयोग करना।",
  "राष्ट्रहित, समाजहित एवं मानव सेवा के कार्यों को बढ़ावा देना।",
  "युवाओं, महिलाओं एवं किसानों को सशक्त बनाना।",
  "स्वच्छ, स्वस्थ एवं आत्मनिर्भर भारत के निर्माण में योगदान देना।",
];

/** Fixed for every letter — these are the signing office-bearers, not member data. */
const SIGNATORIES = [
  {
    image: "/signature-president.png",
    name: "डॉ. मनोज कुमार (मन्नू तोमर)",
    role: "राष्ट्रीय अध्यक्ष",
    org: "भारतीय नमो संघ (BNMS)",
    note: "पूर्व राष्ट्रीय प्रवक्ता – वर्ल्ड वेदांत इंस्टीट्यूट",
  },
  {
    image: "/signature-secretary.png",
    name: "बिंदेश शर्मा",
    role: "राष्ट्रीय कार्यकारी राष्ट्रीय प्रभारी",
    org: "भारतीय नमो संघ (BNMS)",
    note: "पूर्व राष्ट्रीय प्रवक्ता – वर्ल्ड वेदांत इंस्टीट्यूट",
  },
] as const;

const BODY_PARAGRAPH_1 =
  "यह नियुक्ति तत्काल प्रभाव से लागू होगी तथा आगामी 2 वर्षों तक मान्य रहेगी।";
const BODY_PARAGRAPH_2 =
  "हमें पूर्ण विश्वास है कि आप संगठन के उद्देश्यों, सिद्धांतों एवं मूल्यों के प्रति पूर्ण निष्ठा एवं समर्पण के साथ कार्य करेंगे तथा संगठन को मजबूती, सक्रियता एवं जन-जन तक पहुँचाने के लिए अथक प्रयास करेंगे। आपसे अपेक्षा की जाती है कि आप संगठन के सभी कार्यक्रमों, अभियानों एवं जनकल्याणकारी योजनाओं का सफल संचालन करते हुए समाज एवं राष्ट्र निर्माण में अपना अमूल्य योगदान देंगे।";
const BLESSING = "आपके उज्ज्वल भविष्य के लिए हार्दिक शुभकामनाएँ!";

function formatDDMMYYYY(dateStr: string): string {
  const d = new Date(dateStr);
  const dd = d.getDate().toString().padStart(2, "0");
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** Same shape as the ID card's membership id, with NIYUKTI in place of MEM. */
export function formatAppointmentSerial(
  membershipNumber: number,
  state: string | null | undefined
): string {
  const padded = membershipNumber.toString().padStart(4, "0");
  return `BNMS/${getStateCode(state)}/NIYUKTI/${padded}`;
}

function websiteLabel(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

/* ---------- Small inline icons ---------- */
const iconProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

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
function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} {...iconProps} strokeWidth={3}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** Decorative flourish beside the "नियुक्ति पत्र" heading. */
function Flourish({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      width="96"
      height="14"
      viewBox="0 0 96 14"
      aria-hidden="true"
      style={flip ? { transform: "scaleX(-1)" } : undefined}
      className="flex-shrink-0"
    >
      <path d="M0 7h62" stroke="#ff8c42" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M70 7 76 1l6 6-6 6z" fill="#ff6b35" />
      <circle cx="88" cy="7" r="3" fill="#138808" />
    </svg>
  );
}

/** Signature image that degrades to a labelled grey box when the file is absent. */
function SignatureImage({ src, alt }: { src: string; alt: string }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);

  // The <img> is server-rendered, so a missing file can 404 before React
  // attaches onError. Re-check the decoded size once mounted.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) {
    return (
      <div className="flex h-[64px] w-[190px] items-center justify-center rounded-md border border-dashed border-[#c4cbd3] bg-[#eef1f4]">
        <span className="px-2 text-center text-[9px] font-medium leading-tight text-[#0a1929]/40">
          {src.replace(/^\//, "")}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className="h-[64px] w-[190px] object-contain object-center"
      onError={() => setFailed(true)}
    />
  );
}

function SignatureBlock({
  signatory,
  align,
}: {
  signatory: (typeof SIGNATORIES)[number];
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex w-[240px] flex-col ${
        align === "left" ? "items-start text-left" : "items-end text-right"
      }`}
    >
      <SignatureImage src={signatory.image} alt={signatory.name} />
      <div className="mt-[4px] h-[1px] w-[190px] bg-[#0a1929]/40" />
      <p className="mt-[4px] text-[12.5px] font-bold leading-tight">{signatory.name}</p>
      <p className="text-[11px] font-semibold leading-tight text-saffron-800">{signatory.role}</p>
      <p className="text-[10.5px] leading-tight text-[#0a1929]/75">{signatory.org}</p>
      <p className="text-[9px] leading-tight text-[#0a1929]/60">{signatory.note}</p>
    </div>
  );
}

/** Keeps the fixed-size A4 canvas and scales it down to fit narrow containers. */
function ScaledPage({ children }: { children: React.ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? PAGE_W;
      setScale(Math.min(1, w / PAGE_W));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={outerRef}
      className="w-full max-w-[794px]"
      style={{ aspectRatio: `${PAGE_MM_W} / ${PAGE_MM_H}` }}
    >
      <div
        style={{
          width: PAGE_W,
          height: PAGE_H,
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

export default function AppointmentLetter({
  member,
  showDownload = true,
}: AppointmentLetterProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [org, setOrg] = useState<OrgContact | null>(null);

  // Same /verify/{id} URL the ID card encodes — one QR, one verification target.
  const verificationUrl = buildVerificationUrl(member.id);
  const stateName = member.branch?.state ?? null;
  const stateLabel = stateName ?? "भारत";
  const serial = formatAppointmentSerial(member.membership_number, stateName);
  const letterDate = formatDDMMYYYY(member.membership_issued_at);
  const fullName = `${member.first_name} ${member.last_name}`.trim();
  const initials = `${member.first_name[0] ?? ""}${member.last_name[0] ?? ""}`;

  // Organisation contact details for the bottom bar.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("organization_settings")
        .select("phone_primary, phone_secondary, primary_email, website_url")
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
      width: 264,
      margin: 1,
      color: { dark: "#0a1929", light: "#ffffff" },
    })
      .then(() => {
        canvas.style.width = `${QR_SIZE}px`;
        canvas.style.height = `${QR_SIZE}px`;
      })
      .catch((err) => console.error("QR generation failed:", err));
  }, [verificationUrl]);

  const handleDownloadPdf = useCallback(async () => {
    const el = pageRef.current;
    if (!el) return;
    setDownloading(true);
    try {
      const png = await toPng(el, {
        cacheBust: true,
        pixelRatio: PRINT_RATIO,
        width: PAGE_W,
        height: PAGE_H,
        backgroundColor: "#ffffff",
      });

      const { pdf, Document, Page, Image: PdfImage } = await import("@react-pdf/renderer");
      const pageW = PAGE_MM_W * MM_TO_PT;
      const pageH = PAGE_MM_H * MM_TO_PT;

      const LetterPdf = () => (
        <Document title={`BNMS Appointment Letter ${serial}`}>
          <Page size={[pageW, pageH]} style={{ padding: 0, backgroundColor: "#ffffff" }}>
            <PdfImage src={png} style={{ width: pageW, height: pageH }} />
          </Page>
        </Document>
      );

      const blob = await pdf(<LetterPdf />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `appointment-letter-${member.membership_number}.pdf`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Failed to generate the appointment letter PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }, [member.membership_number, serial]);

  const phones = [org?.phone_primary, org?.phone_secondary].filter(Boolean) as string[];
  const site = websiteLabel(org?.website_url);

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <ScaledPage>
        <div
          ref={pageRef}
          className="relative flex flex-col overflow-hidden bg-white text-[#0a1929] border border-[#d7dde4] shadow-md"
          style={{ width: PAGE_W, height: PAGE_H }}
        >
          {/* Tricolor top edge */}
          <div className="flex h-[7px] w-full flex-shrink-0" aria-hidden="true">
            <div className="flex-1 bg-[#FF9933]" />
            <div className="flex-1 bg-[#f4f4f4]" />
            <div className="flex-1 bg-[#138808]" />
          </div>

          {/* Faint watermark emblem */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.045]"
          />

          <div className="relative z-10 flex flex-1 flex-col px-[44px] pt-[12px] pb-0">
            {/* 1 — Top tagline */}
            <p className="text-center text-[13px] font-semibold tracking-wide text-saffron-800">
              {TOP_TAGLINE}
            </p>

            {/* 2 — Letterhead */}
            <div className="mt-[10px] flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <OrgHeader variant="letter" />
              </div>
              {/* Mirrored so the portrait faces back into the letterhead rather
                  than off the page edge. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/letter-portrait-silhouette.png"
                alt=""
                aria-hidden="true"
                className="h-[84px] flex-shrink-0 object-contain"
                style={{ transform: "scaleX(-1)" }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/nm.png" alt="" className="h-[70px] w-[70px] flex-shrink-0 object-contain" />
            </div>

            {/* 3 — Registration details */}
            <div className="mt-[10px] rounded-md border border-saffron-200 bg-saffron-50 px-3 py-[7px]">
              <div className="flex flex-wrap items-center justify-center gap-y-[2px] text-[9.5px] leading-[1.5] text-[#0a1929]/75">
                {REGISTRATION_LINES.map((line, i) => (
                  <span key={line} className="whitespace-nowrap">
                    {i > 0 && <span className="mx-2 text-saffron-500">•</span>}
                    {line}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-[10px] h-[2px] w-full bg-gradient-to-r from-[#FF9933] via-[#d7dde4] to-[#138808]" />

            {/* 4 — Date / serial on the left, member photo on the right */}
            <div className="mt-[12px] flex items-start justify-between gap-4">
              <div className="text-[12px] leading-[1.7]">
                <div>
                  <span className="font-semibold">दिनांक:</span>{" "}
                  <span className="font-mono">{letterDate}</span>
                </div>
                <div>
                  <span className="font-semibold">S. No.:</span>{" "}
                  <span className="font-mono font-semibold text-saffron-800">{serial}</span>
                </div>
              </div>

              <div className="relative flex-shrink-0">
                <div className="h-[108px] w-[108px] overflow-hidden rounded-full border-[3px] border-saffron-400 bg-saffron-50">
                  {member.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-heading text-[34px] font-bold text-saffron-700">
                      {initials}
                    </div>
                  )}
                </div>
                {/* Small logo badge overlapping the photo's bottom-right corner */}
                <div className="absolute -bottom-[2px] -right-[2px] h-[38px] w-[38px] overflow-hidden rounded-full border-2 border-white bg-white shadow-sm flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="" className="h-[32px] w-[32px] object-contain" />
                </div>
              </div>
            </div>

            {/* 5 — Heading */}
            <div className="mt-[6px] flex items-center justify-center gap-4">
              <Flourish />
              <h1 className="font-heading text-[30px] font-extrabold leading-none text-[#0a1929] whitespace-nowrap">
                नियुक्ति पत्र
              </h1>
              <Flourish flip />
            </div>

            {/* 6 — Body */}
            <div className="mt-[22px] text-center">
              <p className="text-[13.5px] leading-[1.6]">
                भारतीय नमो संघ परिवार, <span className="font-semibold">{stateLabel}</span> की कार्यकारिणी में
              </p>
              <p className="mt-[8px] font-heading text-[27px] font-extrabold leading-tight text-saffron-800">
                {fullName}
              </p>
              <p className="mt-[8px] text-[13.5px] leading-[1.6]">
                को भारतीय नमो संघ, <span className="font-semibold">{stateLabel}</span> का
              </p>
              <div className="mt-[10px] flex justify-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#138808] px-4 py-[6px] text-[14px] font-bold text-white">
                  <IconBadge className="h-[15px] w-[15px]" />
                  {member.designation ?? "पदाधिकारी"}
                </span>
              </div>
              <p className="mt-[10px] text-[13.5px] leading-[1.6]">
                के पद पर नियुक्त किया जाता है।
              </p>
              <p className="mt-[14px] text-[12.5px] leading-[1.6]">{BODY_PARAGRAPH_1}</p>
              <p className="mt-[12px] text-justify text-[12.5px] leading-[1.65] text-[#0a1929]/85">
                {BODY_PARAGRAPH_2}
              </p>
              <p className="mt-[14px] text-[14px] font-bold text-[#138808]">{BLESSING}</p>
            </div>

            {/* 7 — Objectives */}
            <div className="mt-[20px] rounded-lg border border-saffron-200 bg-saffron-50/70 px-4 py-[13px]">
              <h2 className="font-heading text-[15px] font-bold text-saffron-800">
                संगठन के उद्देश्य
              </h2>
              <ul className="mt-[8px] space-y-[7px]">
                {OBJECTIVES.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[12px] leading-[1.45]">
                    <IconCheck className="mt-[2px] h-[12px] w-[12px] flex-shrink-0 text-[#138808]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 8 — Signatures, with the verification QR between them */}
            <div className="mt-auto mb-[14px] flex items-end justify-between gap-3 pt-[22px]">
              <SignatureBlock signatory={SIGNATORIES[0]} align="left" />

              {/* Same /verify/{id} target as the ID card — one QR per member, not a second one. */}
              <div className="flex flex-col items-center pb-[2px]">
                <canvas
                  ref={qrCanvasRef}
                  className="rounded-[3px] border border-[#d7dde4] bg-white"
                  style={{ width: QR_SIZE, height: QR_SIZE }}
                  aria-label="Verification QR code"
                />
                <span className="mt-[3px] text-[8px] font-semibold text-[#0a1929]/60">
                  स्कैन कर सत्यापित करें
                </span>
              </div>

              <SignatureBlock signatory={SIGNATORIES[1]} align="right" />
            </div>
          </div>

          {/* 9 — Contact bar */}
          <div className="relative z-10 flex items-center justify-center gap-6 bg-[#0a1929] px-[44px] py-[9px] text-[10.5px] font-medium text-white">
            <span className="inline-flex items-center gap-1.5">
              <IconPhone className="h-[12px] w-[12px] text-saffron-400" />
              {phones.length ? phones.join(", ") : "—"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <IconGlobe className="h-[12px] w-[12px] text-saffron-400" />
              {site ?? "—"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <IconMail className="h-[12px] w-[12px] text-saffron-400" />
              {org?.primary_email ?? "—"}
            </span>
          </div>
        </div>
      </ScaledPage>

      {showDownload && (
        <div className="w-full max-w-[794px]">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="w-full rounded-md bg-saffron-700 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-saffron-800 disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" {...iconProps}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {downloading ? "Preparing PDF..." : "Download PDF"}
          </button>
        </div>
      )}
    </div>
  );
}
