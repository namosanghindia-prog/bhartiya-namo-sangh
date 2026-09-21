import type { PublicMember } from "@/lib/supabase/types";
import { displayName } from "@/lib/member-order";

export type MemberTier =
  | "national"
  | "state"
  | "district"
  | "mandal"
  | "local"
  | "volunteer"
  | "member";

export const TIER_LABEL: Record<MemberTier, { en: string; hi: string }> = {
  national: { en: "National Leadership", hi: "राष्ट्रीय नेतृत्व" },
  state: { en: "State Leadership", hi: "प्रदेश नेतृत्व" },
  district: { en: "District Leadership", hi: "जिला नेतृत्व" },
  mandal: { en: "Mandal / Block Leadership", hi: "मंडल / ब्लॉक नेतृत्व" },
  local: { en: "Local Leadership", hi: "स्थानीय नेतृत्व" },
  volunteer: { en: "Volunteers", hi: "स्वयंसेवक" },
  member: { en: "Members", hi: "सदस्य" },
};

const TITLE_HI: Record<string, string> = {
  president: "राष्ट्रीय अध्यक्ष",
  "national president": "राष्ट्रीय अध्यक्ष",
  "vice president": "राष्ट्रीय उपाध्यक्ष",
  "national vice president": "राष्ट्रीय उपाध्यक्ष",
  "general secretary": "राष्ट्रीय महासचिव",
  "national general secretary": "राष्ट्रीय महासचिव",
  secretary: "सचिव",
  "national secretary": "राष्ट्रीय सचिव",
  treasurer: "कोषाध्यक्ष",
  "national treasurer": "राष्ट्रीय कोषाध्यक्ष",
  "joint secretary": "संयुक्त सचिव",
  spokesperson: "प्रवक्ता",
  "it head": "आईटी प्रमुख",
  volunteer: "स्वयंसेवक",
  member: "सदस्य",
};

const NATIONAL_TITLES = new Set([
  "president",
  "vice president",
  "general secretary",
  "secretary",
  "treasurer",
  "joint secretary",
  "spokesperson",
  "it head",
  "national president",
  "national vice president",
  "national general secretary",
  "national secretary",
  "national treasurer",
]);

export { displayName };

export function initials(member: PublicMember): string {
  return `${member.first_name?.[0] ?? ""}${member.last_name?.[0] ?? ""}`.toUpperCase();
}

export function memberSlug(member: PublicMember): string {
  const name = displayName(member)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${name || "member"}-${member.id.slice(0, 8)}`;
}

export function memberHref(member: PublicMember): string {
  return `/members/${memberSlug(member)}`;
}

export function designationKey(designation: string | null): string {
  return (designation ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function designationHi(designation: string | null): string | null {
  if (!designation) return null;
  return TITLE_HI[designationKey(designation)] ?? designation;
}

export function classifyTier(designation: string | null): MemberTier {
  const d = designationKey(designation);
  if (!d) return "member";
  if (/volunteer|स्वयंसेवक/.test(d)) return "volunteer";
  if (/mandal|block|मंडल|ब्लॉक/.test(d)) return "mandal";
  if (/district|जिला|jila/.test(d)) return "district";
  if (/\bstate\b|प्रदेश|pradesh/.test(d) && !/national/.test(d)) return "state";
  if (/national|राष्ट्रीय/.test(d)) return "national";
  if (/local|town|ward|village|नगर|वार्ड|ग्राम/.test(d)) return "local";
  if (NATIONAL_TITLES.has(d)) return "national";
  return "member";
}

export function isPresident(member: PublicMember): boolean {
  const d = designationKey(member.designation);
  const name = displayName(member).toLowerCase();
  return (
    d === "president" ||
    d === "national president" ||
    name.includes("mannu") ||
    (name.includes("manoj") && name.includes("tomar"))
  );
}

export function portraitSrc(member: PublicMember): string | null {
  if (member.avatar_url) return member.avatar_url;
  if (isPresident(member)) return "/leadership/mannu.png";
  return null;
}

export function memberLocation(member: PublicMember): string | null {
  return (
    [member.city, member.branch_state || member.state, member.branch_name]
      .filter((part, i, arr) => part && arr.indexOf(part) === i)
      .join(" · ") || member.branch_name
  );
}

export type BranchLookup = {
  name: string;
  city: string;
  state: string;
};

export function enrichMember(
  member: PublicMember,
  branches: BranchLookup[]
): PublicMember {
  if (member.branch_state && member.city) return member;
  const branch = branches.find(
    (b) => b.name === member.branch_name || b.city === member.branch_name
  );
  if (!branch) return member;
  return {
    ...member,
    city: member.city ?? branch.city,
    state: member.state ?? branch.state,
    branch_state: member.branch_state ?? branch.state,
  };
}

export function matchesSlug(member: PublicMember, slug: string): boolean {
  if (member.id === slug) return true;
  if (memberSlug(member) === slug) return true;
  const prefix = slug.split("-").pop() ?? "";
  return prefix.length >= 8 && member.id.startsWith(prefix);
}
