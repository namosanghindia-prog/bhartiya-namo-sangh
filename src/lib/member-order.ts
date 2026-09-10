import type { SupabaseClient } from "@supabase/supabase-js";
import type { PublicMember } from "@/lib/supabase/types";

// Order of cards on the public members page.
//
// Admins set it by dragging cards on /admin/member-order, saved to the
// member_display_order table. Members with a saved position come first, in that
// order. Anyone without one — joined since the last save — follows in the
// default order below, until an admin places them.

// Office-bearer seniority for the default order. Titles are matched
// case-insensitively and ignoring stray whitespace, since designations are free
// text typed by members. Anything unlisted sorts after all of these,
// alphabetically.
const DESIGNATION_RANK: Record<string, number> = {
  "president": 1,
  "vice president": 2,
  "general secretary": 3,
  "secretary": 4,
  "treasurer": 5,
  "joint secretary": 6,
  "spokesperson": 7,
  "it head": 8,
};

// Manual placement overrides for the default order, keyed by full name exactly
// as stored on the member record — first_name + last_name. The key's card is
// moved to sit immediately after the anchor's card. This predates the admin
// ordering and only shapes the default, so it seeds the editor's first save;
// once both members have a saved position it has no effect.
//
// The president is stored as "Manoj Singh" / "Tomar (Mannu Bhaiya)", so the
// anchor carries the parenthetical.
const PINNED_AFTER: Record<string, string> = {
  "Hemant Sharma": "Manoj Singh Tomar (Mannu Bhaiya)",
};

export function displayName(member: PublicMember): string {
  return `${member.first_name} ${member.last_name}`.trim().replace(/\s+/g, " ");
}

function sameName(member: PublicMember, name: string): boolean {
  return displayName(member).toLowerCase() === name.toLowerCase();
}

// Applies PINNED_AFTER to an already-sorted list, skipping any pin whose names
// no longer resolve.
function applyPins(sorted: PublicMember[]): PublicMember[] {
  const result = [...sorted];
  for (const [name, anchorName] of Object.entries(PINNED_AFTER)) {
    const from = result.findIndex((m) => sameName(m, name));
    const anchor = result.findIndex((m) => sameName(m, anchorName));
    if (from === -1 || anchor === -1) continue;
    const [pinned] = result.splice(from, 1);
    // Pulling the card out shifts the anchor left when it sat to the right.
    result.splice(from < anchor ? anchor : anchor + 1, 0, pinned);
  }
  return result;
}

function seniority(designation: string | null): number {
  if (!designation) return Number.MAX_SAFE_INTEGER;
  return (
    DESIGNATION_RANK[designation.trim().toLowerCase()] ??
    Number.MAX_SAFE_INTEGER
  );
}

function defaultOrder(members: PublicMember[]): PublicMember[] {
  const sorted = [...members].sort((a, b) => {
    const rank = seniority(a.designation) - seniority(b.designation);
    if (rank !== 0) return rank;
    return displayName(a).localeCompare(displayName(b));
  });
  return applyPins(sorted);
}

// Final order for the whole member list. Order before filtering: the default
// order's pins need both cards present, and filtering an ordered list keeps
// the relative order anyway.
export function orderMembers(
  members: PublicMember[],
  positions: Map<string, number>
): PublicMember[] {
  const byDefault = defaultOrder(members);
  const placed = byDefault
    .filter((m) => positions.has(m.id))
    .sort((a, b) => positions.get(a.id)! - positions.get(b.id)!);
  const unplaced = byDefault.filter((m) => !positions.has(m.id));
  return [...placed, ...unplaced];
}

// Loads the saved positions. A failure falls back to the default order rather
// than hiding the members.
export async function fetchPositions(
  supabase: SupabaseClient
): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("member_display_order")
    .select("member_id, position");
  if (error) {
    console.error("Failed to load member order:", error);
    return new Map();
  }
  return new Map(
    (data ?? []).map((r: { member_id: string; position: number }) => [
      r.member_id,
      r.position,
    ])
  );
}
