"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PublicMember } from "@/lib/supabase/types";

export default function MembersPage() {
  const [members, setMembers] = useState<PublicMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");

  useEffect(() => {
    async function fetchMembers() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("public_members")
        .select("*")
        .order("first_name")
        .order("last_name");

      if (error) {
        console.error("Failed to fetch members:", error);
      } else if (data) {
        setMembers(data);
      }
      setLoading(false);
    }
    fetchMembers();
  }, []);

  const branches = useMemo(() => {
    const uniqueBranches = new Set(
      members.map((m) => m.branch_name).filter((b): b is string => b !== null)
    );
    return Array.from(uniqueBranches).sort();
  }, [members]);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
      const matchesQuery =
        query.trim() === "" ||
        fullName.includes(query.toLowerCase()) ||
        m.designation?.toLowerCase().includes(query.toLowerCase());
      const matchesBranch =
        branchFilter === "all" || m.branch_name === branchFilter;
      return matchesQuery && matchesBranch;
    });
  }, [members, query, branchFilter]);

  return (
    <>
      {/* PAGE HEADER */}
      <section className="bg-saffron-gradient text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="font-heading text-4xl sm:text-5xl font-semibold">
            Our Members
          </h1>
          <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">
            Meet the dedicated volunteers and leaders who make Bhartiya Namo
            Sangh&apos;s mission possible
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
              placeholder="Search by name or designation..."
              className="flex-1 rounded-md border border-saffron-200 px-4 py-2 text-sm text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="rounded-md border border-saffron-200 px-4 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-saffron-400"
            >
              <option value="all">All Branches</option>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* MEMBERS GRID */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12 text-navy/60">
              Loading members...
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-12 text-navy/60">
              {members.length === 0
                ? "No members to display yet."
                : "No members match your search."}
            </p>
          ) : (
            <>
              <p className="text-sm text-navy/60 mb-6">
                Showing {filtered.length} of {members.length} members
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filtered.map((member, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-saffron-200 bg-white p-5 text-center hover:border-saffron-400 transition-colors"
                  >
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt=""
                        className="mx-auto h-20 w-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="mx-auto h-20 w-20 rounded-full bg-saffron-200 flex items-center justify-center font-heading text-2xl font-semibold text-saffron-800">
                        {member.first_name[0]}
                        {member.last_name[0]}
                      </div>
                    )}
                    <h3 className="mt-4 font-heading font-semibold text-navy">
                      {member.first_name} {member.last_name}
                    </h3>
                    {member.designation && (
                      <p className="mt-1 text-sm text-navy/70">
                        {member.designation}
                      </p>
                    )}
                    {member.branch_name && (
                      <p className="mt-2 text-xs text-saffron-700 flex items-center justify-center gap-1">
                        <span aria-hidden="true">📍</span>
                        {member.branch_name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
