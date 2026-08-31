"use client";

/**
 * Organisation letterhead block: emblem + "भारतीय नमो संघ (BNMS)" + tagline pill.
 *
 * Shared by MembershipCard (the small ID-1 card) and AppointmentLetter (A4), so
 * every BNMS document carries an identical header. The `card`/`compact`
 * variants are the two sizes the ID card already used; `letter` is the same
 * design scaled up for a full page.
 */

export type OrgHeaderVariant = "card" | "compact" | "letter";

interface OrgHeaderProps {
  /** Back-compat with the ID card's original boolean API. */
  compact?: boolean;
  variant?: OrgHeaderVariant;
}

export default function OrgHeader({ compact = false, variant }: OrgHeaderProps) {
  const v: OrgHeaderVariant = variant ?? (compact ? "compact" : "card");
  const isCompact = v === "compact";
  const isLetter = v === "letter";

  const wrap = isLetter ? "flex items-center gap-4" : `flex items-center gap-2 px-3 ${isCompact ? "pt-[14px]" : "pt-4"}`;

  const ring = isLetter
    ? "h-[74px] w-[74px] border-2"
    : isCompact
    ? "h-7 w-7 border-[1.5px]"
    : "h-12 w-12 border-[1.5px]";

  const logo = isLetter ? "h-[64px] w-[64px]" : isCompact ? "h-6 w-6" : "h-[42px] w-[42px]";

  const title = isLetter ? "text-[51px]" : isCompact ? "text-[12px]" : "text-[15px]";
  const abbr = isLetter ? "text-[22px]" : isCompact ? "text-[6.5px]" : "text-[7.5px]";
  const pill = isLetter
    ? "px-4 py-[5px] text-[14px]"
    : isCompact
    ? "px-1.5 py-[2px] text-[6px]"
    : "px-2 py-[2.5px] text-[6.5px]";

  return (
    <div className={wrap}>
      <div
        className={`flex-shrink-0 rounded-full bg-white border-saffron-500 flex items-center justify-center overflow-hidden ${ring}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="BNMS" className={logo} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`flex items-baseline ${isLetter ? "gap-2.5" : "gap-1.5"}`}>
          <span
            className={`font-heading font-extrabold leading-none text-[#0a1929] whitespace-nowrap ${title}`}
          >
            भारतीय नमो संघ
          </span>
          <span className={`font-semibold text-[#0a1929]/70 leading-none ${abbr}`}>(BNMS)</span>
        </div>
        <div className={isLetter ? "mt-2" : "mt-[3px]"}>
          <span
            className={`inline-block max-w-full rounded-full bg-saffron-600 text-white font-semibold leading-none whitespace-nowrap ${pill}`}
          >
            राष्ट्र सेवा में समर्पित सामाजिक महासंघ
          </span>
        </div>
      </div>
    </div>
  );
}
