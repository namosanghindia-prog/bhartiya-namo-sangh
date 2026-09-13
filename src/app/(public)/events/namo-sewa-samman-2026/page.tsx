import type { Metadata } from "next";
import Image from "next/image";
import { EVENT } from "@/lib/namo-sewa-samman";
import RegistrationForm from "./RegistrationForm";

export const metadata: Metadata = {
  title: `${EVENT.nameHi} — ${EVENT.taglineHi} | Bhartiya Namo Sangh`,
  description: `Register for ${EVENT.nameHi} — ${EVENT.dateEn}, ${EVENT.venue}.`,
  openGraph: {
    title: EVENT.nameHi,
    description: `${EVENT.taglineHi} · ${EVENT.dateEn} · ${EVENT.venue}`,
    images: [EVENT.poster],
  },
};

export default function NamoSewaSammanPage() {
  return (
    <div className="bg-saffron-50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
        {/* Poster */}
        <div className="overflow-hidden rounded-2xl border border-saffron-200 bg-white shadow-lg">
          <Image
            src={EVENT.poster}
            alt={`${EVENT.nameHi} — ${EVENT.taglineHi}`}
            width={1024}
            height={1536}
            preload
            sizes="(max-width: 768px) 100vw, 720px"
            className="h-auto w-full"
          />
        </div>

        {/* Event details */}
        <div className="mt-6 rounded-2xl border border-saffron-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-1.5 w-40 overflow-hidden rounded-full">
            <div className="flex-1 bg-[#FF9933]" />
            <div className="flex-1 bg-[#e5e7eb]" />
            <div className="flex-1 bg-[#138808]" />
          </div>
          <h1 className="font-devanagari text-3xl font-bold text-saffron-800">{EVENT.nameHi}</h1>
          <p className="font-devanagari mt-1 text-lg font-semibold text-[#138808]">
            {EVENT.taglineHi}
          </p>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-lg bg-saffron-50 px-3 py-2">
              <dt className="text-xs uppercase tracking-wide text-navy/50">दिनांक / Date</dt>
              <dd className="font-devanagari mt-0.5 font-semibold text-navy">{EVENT.dateHi}</dd>
            </div>
            <div className="rounded-lg bg-saffron-50 px-3 py-2">
              <dt className="text-xs uppercase tracking-wide text-navy/50">समय / Time</dt>
              <dd className="font-devanagari mt-0.5 font-semibold text-navy">{EVENT.timeHi}</dd>
            </div>
            <div className="rounded-lg bg-saffron-50 px-3 py-2">
              <dt className="text-xs uppercase tracking-wide text-navy/50">स्थान / Venue</dt>
              <dd className="mt-0.5 font-semibold text-navy">{EVENT.venue}</dd>
            </div>
          </dl>
        </div>

        {/* Registration */}
        <div className="mt-6 rounded-2xl border border-saffron-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-devanagari text-2xl font-bold text-navy">पंजीकरण फॉर्म</h2>
          <p className="mt-1 text-sm text-navy/60">
            Registration form — your invitation letter will be emailed to you.
          </p>
          <RegistrationForm />
        </div>
      </div>
    </div>
  );
}
