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

/** Height of the `letter` letterhead band, in design-canvas px.
 *  Doubles as the emblem's diameter and as the wordmark's side reservation, so
 *  raising it enlarges the emblem and narrows the space left for the title. */
export const LETTER_HEADER_H = 155;

interface OrgHeaderProps {
  /** Back-compat with the ID card's original boolean API. */
  compact?: boolean;
  variant?: OrgHeaderVariant;
  /**
   * `letter` only: artwork pinned to the band's right edge and stretched to the
   * full band height. Passed in rather than hardcoded because it is specific to
   * the appointment letter, while the emblem and wordmark are shared.
   */
  rightSlot?: React.ReactNode;
}

export default function OrgHeader({
  compact = false,
  variant,
  rightSlot,
}: OrgHeaderProps) {
  const v: OrgHeaderVariant = variant ?? (compact ? "compact" : "card");
  const isCompact = v === "compact";
  const isLetter = v === "letter";

  /**
   * The letterhead band centres its wordmark on the page, so it cannot be a
   * plain flex row — a row would centre the text in the gap *between* the
   * emblem and the artwork, which sit at different widths and would push the
   * title off-centre. Both flanking images are absolutely positioned against
   * the band's top and bottom edges instead, and the text is centred inside
   * symmetric padding wide enough to clear the wider of the two.
   */
  if (isLetter) {
    return (
      <div className="relative w-full" style={{ height: LETTER_HEADER_H }}>
        {/* Emblem — square, so its width equals the band height. */}
        <div
          className="absolute left-0 top-0 bottom-0 flex items-center justify-center overflow-hidden rounded-full border-2 border-saffron-500 bg-white"
          style={{ width: LETTER_HEADER_H }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="BNMS" className="h-[90%] w-[90%] object-contain" />
        </div>

        {rightSlot && (
          <div className="absolute right-0 top-0 bottom-0 flex items-center">
            {rightSlot}
          </div>
        )}

        <div
          className="flex h-full flex-col items-center justify-center text-center"
          style={{
            // Clear the emblem on both sides so the wordmark is centred on the
            // page rather than in the leftover space.
            paddingLeft: LETTER_HEADER_H + 10,
            paddingRight: LETTER_HEADER_H + 10,
          }}
        >
          <div className="flex items-baseline justify-center gap-2.5">
            <span className="font-heading text-[48px] font-extrabold leading-none text-[#0a1929] whitespace-nowrap">
              भारतीय नमो संघ
            </span>
            <span className="text-[20px] font-semibold leading-none text-[#0a1929]/70">
              (BNMS)
            </span>
          </div>
          <div className="mt-2.5">
            <span className="inline-block max-w-full whitespace-nowrap rounded-full bg-saffron-600 px-4 py-[5px] text-[14.5px] font-semibold leading-none text-white">
              राष्ट्र सेवा में समर्पित सामाजिक महासंघ
            </span>
          </div>
        </div>
      </div>
    );
  }

  const wrap = `flex items-center gap-2 px-3 ${isCompact ? "pt-[14px]" : "pt-4"}`;

  const ring = isCompact ? "h-7 w-7 border-[1.5px]" : "h-12 w-12 border-[1.5px]";

  const logo = isCompact ? "h-6 w-6" : "h-[42px] w-[42px]";

  const title = isCompact ? "text-[12px]" : "text-[15px]";
  const abbr = isCompact ? "text-[6.5px]" : "text-[7.5px]";
  const pill = isCompact
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
        <div className="flex items-baseline gap-1.5">
          <span
            className={`font-heading font-extrabold leading-none text-[#0a1929] whitespace-nowrap ${title}`}
          >
            भारतीय नमो संघ
          </span>
          <span className={`font-semibold text-[#0a1929]/70 leading-none ${abbr}`}>(BNMS)</span>
        </div>
        <div className="mt-[3px]">
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
