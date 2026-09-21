"use client";

import Link from "next/link";
import { T } from "@/lib/locale";
import type { PublicMember } from "@/lib/supabase/types";
import {
  designationHi,
  initials,
  memberHref,
  memberLocation,
  portraitSrc,
} from "@/lib/members-public";

export default function MemberCard({
  member,
  featured = false,
}: {
  member: PublicMember;
  featured?: boolean;
}) {
  const photo = portraitSrc(member);
  const hi = designationHi(member.designation);
  const location = memberLocation(member);

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_0_rgba(10,25,41,0.06),0_12px_32px_rgba(10,25,41,0.06)] ${
        featured ? "sm:flex-row" : ""
      }`}
    >
      <div
        className={`relative overflow-hidden bg-[#f6f4f0] ${
          featured ? "aspect-[4/5] sm:w-[280px] sm:shrink-0 sm:aspect-auto sm:min-h-[350px]" : "aspect-[4/5]"
        }`}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        ) : (
          <div className="flex h-full min-h-[220px] w-full items-center justify-center font-heading text-4xl font-semibold text-navy/25">
            {initials(member)}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-heading text-xl font-semibold text-navy">
          {member.first_name} {member.last_name}
        </h3>
        {member.designation ? (
          <p className="mt-1 text-sm text-navy/70">
            {member.designation}
            {hi && hi !== member.designation ? (
              <span lang="hi" className="font-devanagari mt-0.5 block text-navy/45">
                {hi}
              </span>
            ) : null}
          </p>
        ) : null}
        {location ? (
          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-saffron-800">
            {location}
          </p>
        ) : null}
        <Link
          href={memberHref(member)}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-navy hover:text-saffron-800"
        >
          <T>{{ en: "View Profile", hi: "प्रोफ़ाइल देखें" }}</T>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
