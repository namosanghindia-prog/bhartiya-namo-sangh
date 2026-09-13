"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EVENT, EVENT_SLUG, formatRegistrationNumber } from "@/lib/namo-sewa-samman";

interface Registration {
  id: string;
  registration_number: number;
  full_name: string;
  guardian_name: string;
  mobile: string;
  email: string;
  address: string;
  invitation_sent: boolean;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Quotes every field, and neutralises a leading =+-@ so Excel will not run it as a formula. */
function csvCell(value: string | number | boolean): string {
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

function downloadCsv(rows: Registration[]) {
  const header = [
    "Registration No.",
    "Full Name",
    "Father/Mother/Husband's Name",
    "Mobile",
    "Email",
    "Address",
    "Invitation Sent",
    "Registered On",
  ];
  const lines = rows.map((r) =>
    [
      formatRegistrationNumber(r.registration_number),
      r.full_name,
      r.guardian_name,
      r.mobile,
      r.email,
      r.address,
      r.invitation_sent ? "Yes" : "No",
      new Date(r.created_at).toLocaleString("en-IN"),
    ]
      .map(csvCell)
      .join(",")
  );

  // BOM so Excel opens the Devanagari names as UTF-8 rather than mojibake.
  const blob = new Blob(["﻿" + [header.map(csvCell).join(","), ...lines].join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${EVENT_SLUG}-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminEventRegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("public_event_registrations")
        .select(
          "id, registration_number, full_name, guardian_name, mobile, email, address, invitation_sent, created_at"
        )
        .eq("event_slug", EVENT_SLUG)
        .order("registration_number", { ascending: false });

      if (cancelled) return;
      if (error) {
        console.error("Failed to load event registrations:", error);
        setLoadError("Could not load registrations.");
      } else {
        setRegistrations((data ?? []) as Registration[]);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return registrations;
    return registrations.filter((r) =>
      [
        r.full_name,
        r.guardian_name,
        r.mobile,
        r.email,
        formatRegistrationNumber(r.registration_number),
        String(r.registration_number),
      ].some((field) => field.toLowerCase().includes(q))
    );
  }, [registrations, search]);

  const sentCount = registrations.filter((r) => r.invitation_sent).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy">Event Registrations</h1>
          <p className="mt-1 text-sm text-navy/60">
            <span className="font-devanagari">{EVENT.nameHi}</span> · {EVENT.dateEn}
            {!loading && (
              <>
                {" "}
                · {registrations.length} registered, {sentCount} invitations sent
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, mobile, email, reg. no."
            className="w-64 max-w-full rounded-md border border-saffron-200 px-3 py-2 text-sm text-navy outline-none focus:border-saffron-500"
          />
          <button
            onClick={() => downloadCsv(filtered)}
            disabled={filtered.length === 0}
            className="rounded-md bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
          <p className="text-navy/60">Loading...</p>
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-red-200 bg-white p-12 text-center">
          <p className="text-red-600">{loadError}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
          <div className="text-4xl mb-3">🎫</div>
          <p className="text-navy/60">
            {registrations.length === 0 ? "No registrations yet." : "No registrations match your search."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-saffron-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-saffron-50 text-left text-xs uppercase tracking-wide text-navy/60">
              <tr>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Reg. No.</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Father/Mother/Husband</th>
                <th className="px-4 py-3 font-semibold">Mobile</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Invitation</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-saffron-100">
              {filtered.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-xs font-semibold text-navy">
                    {formatRegistrationNumber(r.registration_number)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-navy">{r.full_name}</div>
                    <div className="max-w-xs text-xs text-navy/50">{r.address}</div>
                  </td>
                  <td className="px-4 py-3 text-navy/80">{r.guardian_name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-navy/80">{r.mobile}</td>
                  <td className="px-4 py-3 text-navy/80 break-all">{r.email}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={
                        "inline-block rounded-full px-2.5 py-1 text-xs font-semibold " +
                        (r.invitation_sent
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800")
                      }
                    >
                      {r.invitation_sent ? "Sent" : "Not sent"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-navy/60">
                    {formatDate(r.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
