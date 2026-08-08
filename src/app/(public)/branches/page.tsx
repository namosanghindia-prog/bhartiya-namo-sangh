"use client";

import { useMemo, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Branch } from "@/lib/supabase/types";

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [selected, setSelected] = useState<Branch | null>(null);

  useEffect(() => {
    async function loadBranches() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error("Failed to load branches:", error);
      } else if (data) {
        setBranches(data);
      }
      setLoading(false);
    }
    loadBranches();
  }, []);

  const states = useMemo(() => {
    return Array.from(new Set(branches.map((b) => b.state))).sort();
  }, [branches]);

  const filtered = useMemo(() => {
    return branches.filter((b) => {
      const matchesQuery =
        query.trim() === "" ||
        b.name.toLowerCase().includes(query.toLowerCase()) ||
        b.city.toLowerCase().includes(query.toLowerCase());
      const matchesState = stateFilter === "all" || b.state === stateFilter;
      return matchesQuery && matchesState;
    });
  }, [branches, query, stateFilter]);

  return (
    <>
      {/* PAGE HEADER */}
      <section className="bg-saffron-gradient text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="font-heading text-4xl sm:text-5xl font-semibold">
            Our Branches
          </h1>
          <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">
            {loading ? "Loading..." : `${branches.length} branches and growing, serving communities across India`}
          </p>
        </div>
      </section>

      {/* SEARCH & FILTER */}
      <section className="bg-white border-b border-saffron-100 sticky top-16 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by branch or city..."
              className="flex-1 rounded-md border border-saffron-200 px-4 py-2 text-sm text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="rounded-md border border-saffron-200 px-4 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-saffron-400"
            >
              <option value="all">All States</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* BRANCHES GRID + DETAIL */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Grid */}
          <div className="lg:col-span-2">
            {loading ? (
              <p className="text-navy/60 text-sm">Loading branches...</p>
            ) : filtered.length === 0 ? (
              <p className="text-navy/60 text-sm">
                No branches match your search.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {filtered.map((branch) => (
                  <button
                    key={branch.id}
                    onClick={() => setSelected(branch)}
                    className={`text-left rounded-xl border p-5 transition-colors ${
                      selected?.id === branch.id
                        ? "border-saffron-700 bg-saffron-50"
                        : "border-saffron-200 bg-white hover:border-saffron-400"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-saffron-700 font-heading font-semibold">
                      <span aria-hidden="true">📍</span>
                      {branch.name}
                    </div>
                    <p className="mt-1 text-sm text-navy/70">
                      {branch.city}, {branch.state}
                    </p>
                    <p className="mt-2 text-xs text-navy/50">
                      {branch.member_count.toLocaleString()} members
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-36 rounded-xl border border-saffron-200 bg-white p-6">
              {selected ? (
                <>
                  <h2 className="font-heading text-xl font-semibold text-navy">
                    {selected.name}
                  </h2>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-navy/60">Location</dt>
                      <dd className="font-medium text-navy">
                        {selected.city}, {selected.state}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-navy/60">Branch Manager</dt>
                      <dd className="font-medium text-navy">
                        {selected.manager_name || "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-navy/60">Members</dt>
                      <dd className="font-medium text-navy">
                        {selected.member_count.toLocaleString()}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-navy/60">Established</dt>
                      <dd className="font-medium text-navy">
                        {selected.established_year || "—"}
                      </dd>
                    </div>
                    {selected.phone && (
                      <div className="flex justify-between">
                        <dt className="text-navy/60">Phone</dt>
                        <dd className="font-medium text-navy">{selected.phone}</dd>
                      </div>
                    )}
                    {selected.email && (
                      <div className="flex justify-between">
                        <dt className="text-navy/60">Email</dt>
                        <dd className="font-medium text-navy">{selected.email}</dd>
                      </div>
                    )}
                  </dl>
                  <div className="mt-6 flex gap-3">
                    <a
                      href="/auth/signup"
                      className="flex-1 text-center rounded-md bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
                    >
                      Join Branch
                    </a>
                    <a
                      href="/contact"
                      className="flex-1 text-center rounded-md border border-saffron-300 px-4 py-2 text-sm font-semibold text-saffron-800 hover:bg-saffron-50"
                    >
                      Contact
                    </a>
                  </div>
                </>
              ) : (
                <p className="text-sm text-navy/60">
                  Select a branch from the list to see details.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
