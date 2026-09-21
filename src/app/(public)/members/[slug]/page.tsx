import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import type { PublicMember } from "@/lib/supabase/types";
import { fetchPositions, orderMembers } from "@/lib/member-order";
import {
  designationHi,
  enrichMember,
  initials,
  matchesSlug,
  memberLocation,
  portraitSrc,
  type BranchLookup,
} from "@/lib/members-public";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const member = await loadMember(slug);
  if (!member) return { title: "Member | Bhartiya Namo Sangh" };
  return {
    title: `${member.first_name} ${member.last_name} | Members | Bhartiya Namo Sangh`,
    description: [member.designation, member.branch_name].filter(Boolean).join(" · "),
  };
}

async function loadMember(slug: string): Promise<PublicMember | null> {
  const supabase = createPublicClient();
  const [{ data }, positions, branchesRes] = await Promise.all([
    supabase.from("public_members").select("*"),
    fetchPositions(supabase),
    supabase.from("branches").select("name, city, state").eq("is_active", true),
  ]);
  if (!data) return null;
  const branches = (branchesRes.data || []) as BranchLookup[];
  const ordered = orderMembers(data, positions).map((m) => enrichMember(m, branches));
  return ordered.find((m) => matchesSlug(m, slug)) ?? null;
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const member = await loadMember(slug);
  if (!member) notFound();

  const photo = portraitSrc(member);
  const hi = designationHi(member.designation);
  const location = memberLocation(member);

  return (
    <article className="bg-[#f6f4f0] pb-24">
      <div className="bg-navy text-white">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-28">
          <div className="relative mx-auto h-64 w-64 overflow-hidden rounded-2xl bg-white/10 lg:col-span-4 lg:mx-0 lg:h-80 lg:w-full">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt={`${member.first_name} ${member.last_name}`}
                className="h-full w-full object-cover object-[center_18%]"
              />
            ) : (
              <div className="flex h-full items-center justify-center font-heading text-6xl text-white/30">
                {initials(member)}
              </div>
            )}
          </div>
          <div className="lg:col-span-8 lg:self-center">
            <p className="text-xs uppercase tracking-[0.28em] text-saffron-300">
              Verified Member · सत्यापित सदस्य
            </p>
            <h1 className="mt-4 font-heading text-4xl font-semibold sm:text-5xl">
              {member.first_name} {member.last_name}
            </h1>
            {member.designation ? (
              <p className="mt-3 text-lg text-white/80">
                {member.designation}
                {hi && hi !== member.designation ? (
                  <span lang="hi" className="font-devanagari mt-1 block text-white/55">
                    {hi}
                  </span>
                ) : null}
              </p>
            ) : null}
            {location ? (
              <p className="mt-4 text-sm uppercase tracking-[0.16em] text-saffron-300">
                {location}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-1 gap-6 rounded-2xl bg-white p-8 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-navy/40">Name · नाम</dt>
            <dd className="mt-1 text-lg text-navy">
              {member.first_name} {member.last_name}
            </dd>
          </div>
          {member.designation ? (
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-navy/40">
                Designation · पद
              </dt>
              <dd className="mt-1 text-lg text-navy">{member.designation}</dd>
            </div>
          ) : null}
          {member.branch_name ? (
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-navy/40">
                Branch · शाखा
              </dt>
              <dd className="mt-1 text-lg text-navy">{member.branch_name}</dd>
            </div>
          ) : null}
          {member.branch_state || member.state ? (
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-navy/40">
                State · राज्य
              </dt>
              <dd className="mt-1 text-lg text-navy">
                {member.branch_state || member.state}
              </dd>
            </div>
          ) : null}
          {member.city ? (
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-navy/40">
                District / City · जिला / शहर
              </dt>
              <dd className="mt-1 text-lg text-navy">{member.city}</dd>
            </div>
          ) : null}
        </dl>
        <p className="mt-8 text-sm text-navy/50">
          This public profile shows only information the organisation publishes in
          the member directory.
        </p>
        <Link
          href="/members"
          className="mt-8 inline-flex text-sm font-semibold text-navy hover:text-saffron-800"
        >
          ← Back to directory
        </Link>
      </div>
    </article>
  );
}
