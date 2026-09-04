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
/** QR display size on the design canvas (CSS px) ≈ 19 mm on the printed page. */
const QR_SIZE = 72;

/* Brand colours the Tailwind theme does not expose as utilities. */
const GOLD = "#d4af37";
const BANNER_GREEN = "#0d4f1c";
const TRICOLOR_GREEN = "#138808";
const TRICOLOR_SAFFRON = "#FF9933";

interface AppointmentLetterProps {
  member: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    membership_number: number;
    membership_issued_at: string;
    designation?: string | null;
    /** members.gender — drives the honorific. Absent or unset renders none. */
    gender?: string | null;
    branch?: { name: string; state?: string | null } | null;
  };
  showDownload?: boolean;
}

interface OrgContact {
  phone_primary: string | null;
  phone_secondary: string | null;
  phone_tertiary: string | null;
  primary_email: string | null;
  website_url: string | null;
  address_line: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
}

const TOP_TAGLINE = "सेवा ही संगठन, संगठन ही शक्ति, शक्ति ही विजय";

/** Caption under the portrait artwork in the letterhead's right corner. */
const PORTRAIT_CAPTION = "नया भारत सशक्त भारत";

/** Centred strapline standing just above the signature block. */
const CLOSING_TAGLINE = "एक संगठन  |  एक संकल्प  |  एक बेहतर भारत";

/**
 * Honorifics the schema's gender values map to.
 *
 * `other` and an unset gender deliberately have no entry: members.gender is
 * nullable and is currently empty for every row, so anything but an explicit
 * male/female must render no honorific rather than guess at one.
 */
const HONORIFICS: Record<string, string> = { male: "Shri", female: "Smt." };

function honorificFor(gender: string | null | undefined): string {
  if (!gender) return "";
  return HONORIFICS[gender.trim().toLowerCase()] ?? "";
}

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

/** Postal address assembled from the organization_settings address columns. */
function postalAddress(c: OrgContact | null): string | null {
  if (!c) return null;
  const parts = [c.address_line, c.city, c.state, c.pincode].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

/* ------------------------------------------------------------------ */
/*  Inline icons                                                       */
/*                                                                     */
/*  Drawn in the lucide style rather than imported from an icon         */
/*  package: the whole page is rasterised by html-to-image for the PDF, */
/*  and inline paths are the convention MembershipCard already uses.    */
/* ------------------------------------------------------------------ */
const iconProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

type IconProps = { className?: string };
type IconComponent = (props: IconProps) => React.ReactElement;

function IconCamera({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <path d="M3 8h3l2-3h8l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
function IconHexagon({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <path d="M12 2.5 20.5 7.2v9.6L12 21.5 3.5 16.8V7.2z" />
      <path d="M12 8.5v7" />
    </svg>
  );
}
function IconCheck({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps} strokeWidth={3}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function IconShield({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <path d="M12 2.5 20 5.5v6c0 5-3.4 8.6-8 10.5-4.6-1.9-8-5.5-8-10.5v-6z" />
    </svg>
  );
}
function IconLotus({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <path d="M12 4c2 2.3 3 4.6 3 7s-1 4.4-3 6.2C10 15.4 9 13.3 9 11s1-4.7 3-7z" />
      <path d="M15 18c3.2-.6 5.4-2.4 6.5-5.4-2.6-1-4.9-.7-6.9.9" />
      <path d="M9 18c-3.2-.6-5.4-2.4-6.5-5.4 2.6-1 4.9-.7 6.9.9" />
    </svg>
  );
}
function IconHeart({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <path d="M12 20.5 5 14a4 4 0 0 1 6-5.2A4 4 0 0 1 19 14z" />
    </svg>
  );
}
function IconUsers({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20" />
      <circle cx="9.5" cy="7.5" r="3.5" />
      <path d="M17 11.2a3.4 3.4 0 0 0 0-6.4M21 20v-1.5a4 4 0 0 0-3-3.8" />
    </svg>
  );
}
function IconZap({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
    </svg>
  );
}
function IconTrendingUp({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <path d="M3 17.5 9.5 11l4 4L21 7.5" />
      <path d="M15.5 7.5H21v5.5" />
    </svg>
  );
}
function IconFlag({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <path d="M5 22V3.5M5 4h13l-2.5 4L18 12H5" />
    </svg>
  );
}
function IconMegaphone({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <path d="M3.5 10v4a1 1 0 0 0 1 1H8l8 5V4L8 9H4.5a1 1 0 0 0-1 1z" />
      <path d="M19 9.5a4 4 0 0 1 0 5" />
    </svg>
  );
}
function IconHandHeart({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <path d="M11.5 9.5 8.8 7a2.6 2.6 0 0 0-3.7 3.7l6.4 6.4 6.4-6.4A2.6 2.6 0 0 0 14.2 7z" />
      <path d="M3 20.5h18" />
    </svg>
  );
}
function IconSprout({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <path d="M12 21V10" />
      <path d="M12 12c0-4 3-7 8-7 0 5-3 8-8 8z" />
      <path d="M12 15C9 15 6 13 6 9c4 0 6 2.5 6 6z" />
    </svg>
  );
}
function IconPhone({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function IconGlobe({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
function IconMail({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 7L2 7" />
    </svg>
  );
}
function IconMapPin({ className }: IconProps) {
  return (
    <svg className={className} {...iconProps}>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/** Small leaf flanking the "नियुक्ति पत्र" banner. */
function BannerLeaf({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      width="15"
      height="20"
      viewBox="0 0 15 20"
      aria-hidden="true"
      className="flex-shrink-0"
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path d="M13 1C5.5 2.5 1 6.5 1 12c0 3.4 1.8 6 4.5 7C4 15 6 9 13 1z" fill={GOLD} />
      <path d="M11 3.5C7 7 5 11.5 5.2 18" stroke={BANNER_GREEN} strokeWidth="0.9" fill="none" />
    </svg>
  );
}

/* ---------- The Footer's social marks, restyled small and monochrome ---------- */
function SocialFacebook({ className }: IconProps) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
function SocialInstagram({ className }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
function SocialYouTube({ className }: IconProps) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#0a1929" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Static content                                                     */
/* ------------------------------------------------------------------ */

/** Statutory registration details, reproduced verbatim from the printed letterhead. */
const REGISTRATIONS: { Icon: IconComponent; label: string; value: string }[] = [
  { Icon: IconCamera, label: "Reg. by Planning Commission", value: "NITI Aayog" },
  { Icon: IconHexagon, label: "Unique ID of NGO", value: "DL/2018/0185185" },
  { Icon: IconCheck, label: "Certificate No.", value: "IN-DL8246933040808BP" },
  { Icon: IconShield, label: "Registration CSR Activities", value: "CSR00062225" },
  { Icon: IconLotus, label: "National Level Society/NGO/Trust", value: "Regd. No. 1086" },
];

/** Decorative values row under the wordmark. */
const VALUE_CHIPS: { Icon: IconComponent; label: string }[] = [
  { Icon: IconHeart, label: "सेवा" },
  { Icon: IconUsers, label: "संगठन" },
  { Icon: IconZap, label: "शक्ति" },
  { Icon: IconTrendingUp, label: "विकास" },
  { Icon: IconFlag, label: "समर्पण" },
];

const OBJECTIVES: { Icon: IconComponent; text: string }[] = [
  { Icon: IconMegaphone, text: "भारत सरकार की जनकल्याणकारी योजनाओं को जन-जन तक पहुँचाना" },
  { Icon: IconHandHeart, text: "समाज के अंतिम व्यक्ति तक लाभ पहुँचाने में सहयोग करना" },
  { Icon: IconFlag, text: "राष्ट्रहित एवं मानव सेवा के कार्यों को बढ़ावा देना" },
  { Icon: IconUsers, text: "युवाओं, महिलाओं एवं किसानों को सशक्त बनाना" },
  { Icon: IconSprout, text: "स्वच्छ, स्वस्थ एवं आत्मनिर्भर भारत के निर्माण में योगदान देना" },
];

/** Fixed for every letter — the signing office-bearer, not member data. */
const SIGNATORY = {
  image: "/signature-president.png",
  name: "डॉ. मनोज कुमार (मनु तोमर)",
  role: "राष्ट्रीय अध्यक्ष",
  org: "भारतीय नमो संघ (BNMS)",
  note: "पूर्व राष्ट्रीय प्रवक्ता – वर्ल्ड वेदांत इंस्टीट्यूट",
} as const;

const BODY_PARAGRAPH_1 =
  "यह नियुक्ति तत्काल प्रभाव से लागू होगी तथा आगामी 2 वर्षों तक मान्य रहेगी।";
const BODY_PARAGRAPH_2 =
  "हमें पूर्ण विश्वास है कि आप संगठन के उद्देश्यों, सिद्धांतों एवं मूल्यों के प्रति पूर्ण निष्ठा एवं समर्पण के साथ कार्य करेंगे तथा संगठन को मजबूती, सक्रियता एवं जन-जन तक पहुँचाने के लिए अथक प्रयास करेंगे। आपसे अपेक्षा की जाती है कि आप संगठन के सभी कार्यक्रमों, अभियानों एवं जनकल्याणकारी योजनाओं का सफल संचालन करते हुए समाज एवं राष्ट्र निर्माण में अपना अमूल्य योगदान देंगे।";
const BLESSING = '" आपके उज्ज्वल भविष्य के लिए हार्दिक शुभकामनाएँ! "';

/* ------------------------------------------------------------------ */
/*  Decorative pieces                                                  */
/* ------------------------------------------------------------------ */

/**
 * Rotated slogan pinned into one of the page's side margins, over a tricolor
 * gradient swoosh. A fixed box with a centred child, so the rotation pivots on
 * the text's own centre and the block stays clear of the letter body.
 */
function MarginSlogan({ side, lines }: { side: "left" | "right"; lines: string[] }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute top-[400px] z-0 flex h-[290px] w-[42px] items-center justify-center ${
        side === "left" ? "left-0" : "right-0"
      }`}
    >
      <div
        className="relative flex flex-col items-center justify-center whitespace-nowrap px-3 py-[3px]"
        style={{ transform: `rotate(${side === "left" ? -90 : 90}deg)` }}
      >
        {/* Tricolor swoosh behind the text */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,153,51,0.32) 0%, rgba(255,153,51,0.10) 48%, rgba(19,136,8,0.28) 100%)",
          }}
        />
        {lines.map((line) => (
          <span
            key={line}
            className="relative text-[11.5px] font-extrabold leading-[1.25] tracking-wide text-saffron-800"
          >
            {line}
          </span>
        ))}
        <div
          className="relative mt-[2px] h-[2.5px] w-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${TRICOLOR_SAFFRON} 0%, #ffffff 50%, ${TRICOLOR_GREEN} 100%)`,
          }}
        />
      </div>
    </div>
  );
}

/**
 * Monument skyline standing behind the signature row: India Gate, a domed
 * fort, and the Taj Mahal. Built here from plain arcs and rectangles rather
 * than sourced, so the letter carries no third-party artwork.
 */
function MonumentSkyline({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 720 96" preserveAspectRatio="none" aria-hidden="true">
      <g fill="#eaeef4">
        {/* India Gate */}
        <rect x="44" y="88" width="142" height="8" />
        <rect x="56" y="30" width="118" height="58" />
        <rect x="48" y="21" width="134" height="9" rx="2" />
        <rect x="84" y="11" width="62" height="10" rx="2" />

        {/* Domed fort */}
        <rect x="236" y="88" width="222" height="8" />
        <rect x="248" y="52" width="198" height="36" />
        <rect x="248" y="40" width="24" height="48" />
        <rect x="422" y="40" width="24" height="48" />
        <path d="M248 40a12 10 0 0 1 24 0z" />
        <path d="M422 40a12 10 0 0 1 24 0z" />
        <rect x="316" y="34" width="62" height="54" />
        <path d="M316 34a31 27 0 0 1 62 0z" />
        <rect x="345.5" y="14" width="3" height="12" />
        <circle cx="347" cy="11" r="3.2" />

        {/* Taj Mahal */}
        <rect x="496" y="88" width="196" height="8" />
        <rect x="518" y="74" width="152" height="14" />
        <rect x="540" y="46" width="108" height="28" />
        <path d="M556 47a38 33 0 0 1 76 0z" />
        <rect x="592.5" y="7" width="3" height="9" />
        <circle cx="594" cy="5" r="3.2" />
        <rect x="536" y="52" width="20" height="22" />
        <path d="M536 52a10 9 0 0 1 20 0z" />
        <rect x="632" y="52" width="20" height="22" />
        <path d="M632 52a10 9 0 0 1 20 0z" />
        <rect x="504" y="30" width="9" height="58" />
        <path d="M504 30a4.5 5 0 0 1 9 0z" />
        <rect x="675" y="30" width="9" height="58" />
        <path d="M675 30a4.5 5 0 0 1 9 0z" />
      </g>

      {/* Openings, cut back to the page so the shapes read as monuments */}
      <g fill="#ffffff">
        <path d="M92 88V60a23 23 0 0 1 46 0v28z" />
        <path d="M334 88V66a13 13 0 0 1 26 0v22z" />
        <path d="M574 88V62a20 20 0 0 1 40 0v26z" />
      </g>
    </svg>
  );
}

/**
 * Signature image that degrades to blank signing space when the file is absent.
 *
 * The letter is a member-facing document, so a missing scan must not surface a
 * developer placeholder on it. Reserving the same height instead leaves the
 * signature rule intact and the letter ready to be signed by hand.
 */
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
    return <div className="h-[60px] w-[190px]" aria-hidden="true" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className="h-[60px] w-[190px] object-contain object-left"
      onError={() => setFailed(true)}
    />
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

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

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
  const honorific = honorificFor(member.gender);
  const displayName = honorific ? `${honorific} ${fullName}` : fullName;
  const initials = `${member.first_name[0] ?? ""}${member.last_name[0] ?? ""}`;

  // Organisation contact details for the bottom bar.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("organization_settings")
        // Whole row: phone_tertiary arrives with migration 010, and naming it in an
        // explicit select would fail the entire query until that has been applied.
        .select("*")
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

  const phones = [org?.phone_primary, org?.phone_secondary, org?.phone_tertiary].filter(
    Boolean
  ) as string[];
  const site = websiteLabel(org?.website_url);
  const address = postalAddress(org);

  // The Footer's links, reused verbatim. Only the channels the organisation
  // actually publishes are rendered, so the bar never shows a dead icon.
  const socials = (
    [
      { url: org?.facebook_url, Icon: SocialFacebook, label: "Facebook" },
      { url: org?.instagram_url, Icon: SocialInstagram, label: "Instagram" },
      { url: org?.youtube_url, Icon: SocialYouTube, label: "YouTube" },
    ] as const
  ).filter((s) => Boolean(s.url));

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

          {/* Decorative margin slogans */}
          <MarginSlogan side="left" lines={["राष्ट्र के लिए समर्पित लोगों का संगठन"]} />
          <MarginSlogan
            side="right"
            lines={["Together we build a better Bharat.", "Make Bharat tricolor like Indian flag."]}
          />

          <div className="relative z-10 flex flex-1 flex-col px-[42px] pt-[9px] pb-0">
            {/* 1 — Top tagline */}
            <p className="text-center text-[12.5px] font-semibold tracking-wide text-saffron-800">
              {TOP_TAGLINE}
            </p>

            {/* 2 — Letterhead, with the portrait artwork in its top-right corner */}
            <div className="mt-[8px]">
              <OrgHeader
                variant="letter"
                rightSlot={
                  <div className="flex h-full flex-col items-center justify-start pt-[4px]">
                    {/* Mirrored so the portrait faces back into the letterhead
                        rather than off the page edge. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/letter-portrait-silhouette.png"
                      alt=""
                      aria-hidden="true"
                      className="h-[72px] w-auto object-contain"
                      style={{ transform: "scaleX(-1)" }}
                    />
                    <span className="mt-[3px] whitespace-nowrap text-[9px] font-extrabold leading-none text-saffron-700">
                      {PORTRAIT_CAPTION}
                    </span>
                  </div>
                }
              />
            </div>

            {/* 3 — Decorative values row */}
            <div className="mt-[7px] flex items-center justify-center gap-[10px]">
              {VALUE_CHIPS.map(({ Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-[5px] rounded-full border border-saffron-200 bg-saffron-50 px-[10px] py-[3px]"
                >
                  <Icon className="h-[11px] w-[11px] text-saffron-700" />
                  <span className="text-[10px] font-bold leading-none text-[#0a1929]/80">
                    {label}
                  </span>
                </span>
              ))}
            </div>

            {/* 4 — Registration details */}
            <div className="mt-[8px] rounded-lg border border-[#e3e8ee] bg-[#f7f9fb] px-[10px] py-[7px]">
              <div className="grid grid-cols-5 gap-x-[6px]">
                {REGISTRATIONS.map(({ Icon, label, value }) => (
                  <div key={label} className="flex flex-col items-center text-center">
                    <span className="flex h-[19px] w-[19px] items-center justify-center rounded-full bg-white ring-1 ring-saffron-200">
                      <Icon className="h-[11px] w-[11px] text-saffron-700" />
                    </span>
                    <span className="mt-[3px] text-[7px] leading-[1.25] text-[#0a1929]/60">
                      {label}
                    </span>
                    <span className="text-[7.5px] font-bold leading-[1.25] text-[#0a1929]/85">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-[9px] h-[2px] w-full bg-gradient-to-r from-[#FF9933] via-[#d7dde4] to-[#138808]" />

            {/* 5 — Date / serial on the left, member photo on the right */}
            <div className="mt-[9px] flex items-start justify-between gap-4">
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

              <div className="flex flex-shrink-0 items-center gap-[10px]">
                {/* Static caption badge beside the photo */}
                <div className="rounded-md border border-saffron-300 bg-saffron-50 px-[7px] py-[4px] text-right">
                  <p className="text-[8px] font-extrabold uppercase leading-[1.35] tracking-[0.08em] text-saffron-800">
                    PEOPLE FOR
                    <br />
                    A BETTER
                    <br />
                    BHARAT
                  </p>
                </div>

                <div className="relative">
                  {/* Gold ring around the member portrait */}
                  <div
                    className="h-[100px] w-[100px] overflow-hidden rounded-full bg-saffron-50"
                    style={{ border: `3px solid ${GOLD}` }}
                  >
                    {member.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-heading text-[32px] font-bold text-saffron-700">
                        {initials}
                      </div>
                    )}
                  </div>
                  {/* Small logo badge overlapping the photo's bottom-right corner */}
                  <div className="absolute -bottom-[2px] -right-[2px] flex h-[34px] w-[34px] items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.png" alt="" className="h-[28px] w-[28px] object-contain" />
                  </div>
                </div>
              </div>
            </div>

            {/* 6 — Heading banner */}
            <div className="mt-[6px] flex justify-center">
              <div
                className="inline-flex items-center gap-[14px] rounded-xl px-[28px] py-[7px]"
                style={{ backgroundColor: BANNER_GREEN, border: `2px solid ${GOLD}` }}
              >
                <BannerLeaf />
                <div className="text-center">
                  <span className="block font-heading text-[26px] font-extrabold leading-none text-white">
                    नियुक्ति पत्र
                  </span>
                  <span
                    className="mt-[4px] block text-[9px] font-bold leading-none tracking-[0.3em]"
                    style={{ color: "#f2dfa4" }}
                  >
                    APPOINTMENT LETTER
                  </span>
                </div>
                <BannerLeaf flip />
              </div>
            </div>

            {/* 7 — Body */}
            <div className="mt-[11px] text-center">
              <p className="text-[13.5px] leading-[1.6]">
                भारतीय नमो संघ परिवार, <span className="font-semibold">{stateLabel}</span> की कार्यकारिणी में
              </p>
              <p className="mt-[7px] font-heading text-[27px] font-extrabold leading-tight text-saffron-800">
                {displayName}
              </p>
              <p className="mt-[7px] text-[13.5px] leading-[1.6]">
                को भारतीय नमो संघ, <span className="font-semibold">{stateLabel}</span> का
              </p>
              <div className="mt-[9px] flex justify-center">
                <span
                  className="inline-flex items-center gap-2 rounded-full px-[18px] py-[6px] text-[14px] font-bold text-white"
                  style={{ backgroundColor: BANNER_GREEN }}
                >
                  <IconUsers className="h-[15px] w-[15px]" />
                  {member.designation ?? "पदाधिकारी"}
                </span>
              </div>
              <p className="mt-[9px] text-[13.5px] leading-[1.6]">के पद पर नियुक्त किया जाता है।</p>
              <p className="mt-[8px] text-[12.5px] leading-[1.6]">{BODY_PARAGRAPH_1}</p>
              <p className="mt-[8px] text-justify text-[12.5px] leading-[1.55] text-[#0a1929]/85">
                {BODY_PARAGRAPH_2}
              </p>
              <p className="mt-[9px] text-[14px] font-bold text-[#138808]">{BLESSING}</p>
            </div>

            {/* 8 — Objectives, five across */}
            <div className="mt-[12px] rounded-lg border border-saffron-200 bg-saffron-50/70 px-[12px] pb-[11px] pt-[9px]">
              <h2 className="text-center font-heading text-[15px] font-bold text-saffron-800">
                संगठन के उद्देश्य
              </h2>
              <div className="mt-[8px] grid grid-cols-5 gap-x-[8px]">
                {OBJECTIVES.map(({ Icon, text }) => (
                  <div key={text} className="flex flex-col items-center text-center">
                    <span
                      className="flex h-[33px] w-[33px] flex-shrink-0 items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: TRICOLOR_GREEN }}
                    >
                      <Icon className="h-[17px] w-[17px]" />
                    </span>
                    <p className="mt-[6px] text-[9px] leading-[1.35] text-[#0a1929]/85">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 9 — Closing strapline */}
            <p className="mt-[10px] text-center text-[12.5px] font-bold tracking-wide text-saffron-800">
              {CLOSING_TAGLINE}
            </p>

            {/* 10 — Signature, monument skyline and verification QR */}
            <div className="relative mt-auto mb-[12px] pt-[8px]">
              {/* Skyline spans the full width, behind the signature and the QR */}
              <MonumentSkyline className="pointer-events-none absolute inset-x-0 bottom-[26px] h-[82px] w-full" />

              <div className="relative flex items-end justify-between gap-3">
                <div className="flex w-[240px] flex-col items-start text-left">
                  <SignatureImage src={SIGNATORY.image} alt={SIGNATORY.name} />
                  <div className="mt-[3px] h-[1px] w-[190px] bg-[#0a1929]/40" />
                  <p className="mt-[4px] text-[12.5px] font-bold leading-tight text-saffron-800">
                    {SIGNATORY.name}
                  </p>
                  <p className="text-[11px] font-bold leading-tight">{SIGNATORY.role}</p>
                  <p className="text-[10.5px] leading-tight text-[#0a1929]/75">{SIGNATORY.org}</p>
                  <p className="text-[9px] leading-tight text-[#0a1929]/60">{SIGNATORY.note}</p>
                </div>

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
              </div>

              <div className="relative mt-[4px] text-center">
                <p className="text-[13px] font-extrabold leading-none tracking-[0.22em] text-[#0a1929]">
                  BHARATIYA NAMO SANGH
                </p>
                <p className="mt-[3px] text-[8.5px] font-semibold leading-none tracking-[0.3em] text-[#0a1929]/60">
                  NATION FIRST | SERVICE ALWAYS
                </p>
              </div>
            </div>
          </div>

          {/* 11 — Contact bar */}
          <div className="relative z-10 flex items-center justify-between gap-3 bg-[#0a1929] px-[22px] py-[8px] text-white">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-[12px] gap-y-[2px] text-[8px] font-medium leading-[1.4]">
              <span className="inline-flex items-center gap-[4px]">
                <IconPhone className="h-[10px] w-[10px] flex-shrink-0 text-saffron-400" />
                {phones.length ? phones.join(" | ") : "—"}
              </span>
              <span className="inline-flex items-center gap-[4px]">
                <IconGlobe className="h-[10px] w-[10px] flex-shrink-0 text-saffron-400" />
                {site ?? "—"}
              </span>
              <span className="inline-flex items-center gap-[4px]">
                <IconMail className="h-[10px] w-[10px] flex-shrink-0 text-saffron-400" />
                {org?.primary_email ?? "—"}
              </span>
              <span className="inline-flex items-center gap-[4px]">
                <IconMapPin className="h-[10px] w-[10px] flex-shrink-0 text-saffron-400" />
                {address ?? "—"}
              </span>
            </div>

            <div className="flex flex-shrink-0 items-center gap-[6px]">
              {socials.map(({ Icon, label }) => (
                <span
                  key={label}
                  aria-label={label}
                  className="flex h-[16px] w-[16px] items-center justify-center rounded-full bg-white/15 text-white"
                >
                  <Icon className="h-[9px] w-[9px]" />
                </span>
              ))}
              <span className="rounded-full bg-saffron-600 px-[7px] py-[2.5px] text-[8px] font-bold leading-none text-white">
                #NamoSangh
              </span>
            </div>
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
