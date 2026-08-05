"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Business, BusinessCategory } from "@/lib/supabase/types";

const CATEGORIES: BusinessCategory[] = [
  "Retail", "Services", "Food & Beverage", "Healthcare", "Education",
  "Technology", "Manufacturing", "Real Estate", "Finance", "Other"
];

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    async function fetchBusinesses() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("status", "active")
        .order("business_name");

      if (error) {
        console.error("Failed to fetch businesses:", error);
      } else if (data) {
        setBusinesses(data);
      }
      setLoading(false);
    }
    fetchBusinesses();
  }, []);

  const filtered = useMemo(() => {
    return businesses.filter((b) => {
      const matchesQuery =
        query.trim() === "" ||
        b.business_name.toLowerCase().includes(query.toLowerCase()) ||
        b.description?.toLowerCase().includes(query.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || b.category === categoryFilter;
      return matchesQuery && matchesCategory;
    });
  }, [businesses, query, categoryFilter]);

  return (
    <>
      {/* PAGE HEADER */}
      <section className="bg-saffron-gradient text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="font-heading text-4xl sm:text-5xl font-semibold">
            Business Directory
          </h1>
          <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">
            Discover and support businesses owned by our members
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
              placeholder="Search businesses..."
              className="flex-1 rounded-md border border-saffron-200 px-4 py-2 text-sm text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-md border border-saffron-200 px-4 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-saffron-400"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* BUSINESSES GRID */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12 text-navy/60">
              Loading businesses...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🏪</div>
              <p className="text-navy/60">
                {businesses.length === 0
                  ? "No businesses listed yet."
                  : "No businesses match your search."}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-navy/60 mb-6">
                Showing {filtered.length} of {businesses.length} businesses
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((business) => (
                  <div
                    key={business.id}
                    className="rounded-xl border border-saffron-200 bg-white p-6 hover:border-saffron-400 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {business.logo_url ? (
                        <img
                          src={business.logo_url}
                          alt=""
                          className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-saffron-100 flex items-center justify-center text-2xl flex-shrink-0">
                          🏢
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-semibold text-navy truncate">
                          {business.business_name}
                        </h3>
                        <span className="inline-block mt-1 text-xs bg-saffron-100 text-saffron-800 px-2 py-0.5 rounded-full">
                          {business.category}
                        </span>
                      </div>
                    </div>

                    {business.description && (
                      <p className="mt-4 text-sm text-navy/70 line-clamp-2">
                        {business.description}
                      </p>
                    )}

                    <div className="mt-4 space-y-2 text-sm">
                      {business.phone && (
                        <div className="flex items-center gap-2 text-navy/70">
                          <span>📞</span>
                          <a href={`tel:${business.phone}`} className="hover:text-saffron-700">
                            {business.phone}
                          </a>
                        </div>
                      )}
                      {business.email && (
                        <div className="flex items-center gap-2 text-navy/70">
                          <span>✉️</span>
                          <a href={`mailto:${business.email}`} className="hover:text-saffron-700 truncate">
                            {business.email}
                          </a>
                        </div>
                      )}
                      {business.website && (
                        <div className="flex items-center gap-2 text-navy/70">
                          <span>🌐</span>
                          <a
                            href={business.website.startsWith("http") ? business.website : `https://${business.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-saffron-700 truncate"
                          >
                            {business.website.replace(/^https?:\/\//, "")}
                          </a>
                        </div>
                      )}
                    </div>
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
