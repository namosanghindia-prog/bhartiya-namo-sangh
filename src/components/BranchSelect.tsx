"use client";

import { isSameState } from "@/lib/india-locations";
import type { Branch } from "@/lib/supabase/types";

/** Offices in the given state; empty until a state is chosen. */
export function branchesInState(branches: Branch[], state: string): Branch[] {
  return state ? branches.filter((b) => isSameState(b.state, state)) : [];
}

interface Props {
  branches: Branch[];
  loading: boolean;
  /** The applicant's state: its offices are listed first. */
  state: string;
  value: string;
  onChange: (branchId: string) => void;
}

export default function BranchSelect({ branches, loading, state, value, onChange }: Props) {
  const local = branchesInState(branches, state);
  const others = branches.filter((b) => !local.includes(b));

  const option = (b: Branch) => (
    <option key={b.id} value={b.id}>
      {b.name} — {b.city}, {b.state}
    </option>
  );

  return (
    <div>
      <label htmlFor="branch" className="block text-sm font-medium text-navy/80 mb-1">
        <span className="block">शाखा चुनें</span>
        <span className="text-xs text-navy/60">Select your Branch</span>
      </label>
      <select
        id="branch"
        name="branch"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400 disabled:bg-gray-100"
      >
        <option value="" disabled>
          {loading ? "Loading branches..." : "Choose a branch"}
        </option>
        {local.length > 0 ? (
          <>
            <optgroup label={`${state} के कार्यालय / Offices in ${state}`}>{local.map(option)}</optgroup>
            {others.length > 0 && (
              <optgroup label="अन्य कार्यालय / Other offices">{others.map(option)}</optgroup>
            )}
          </>
        ) : (
          branches.map(option)
        )}
      </select>
      {state && !loading && local.length === 0 && (
        <p className="mt-1 text-xs text-navy/60">
          {state} में अभी कोई कार्यालय नहीं है — निकटतम शाखा चुनें। / No office in {state} yet —
          choose the nearest branch.
        </p>
      )}
    </div>
  );
}
