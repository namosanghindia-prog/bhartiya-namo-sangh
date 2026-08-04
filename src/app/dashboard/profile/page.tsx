"use client";

import { useState } from "react";
import { CURRENT_MEMBER } from "@/lib/dashboard-data";
import { BRANCHES } from "@/lib/branches-data";

export default function ProfilePage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    // NOTE: PATCH to /api/users/[id] once Supabase is connected.
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    setSaved(true);
  }

  const nextMilestone = 200;
  const pct = Math.min(
    Math.round((CURRENT_MEMBER.volunteerHours / nextMilestone) * 100),
    100
  );

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="rounded-xl border border-saffron-200 bg-white p-6 flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-saffron-200 flex items-center justify-center font-heading text-xl font-semibold text-saffron-800">
          {CURRENT_MEMBER.firstName[0]}
          {CURRENT_MEMBER.lastName[0]}
        </div>
        <div>
          <h1 className="font-heading text-xl font-semibold text-navy">
            {CURRENT_MEMBER.firstName} {CURRENT_MEMBER.lastName}
          </h1>
          <p className="text-sm text-navy/60">{CURRENT_MEMBER.email}</p>
          <span className="mt-1 inline-block rounded-full bg-forest/10 px-2 py-0.5 text-xs font-medium text-forest">
            Active Member
          </span>
        </div>
      </div>

      {/* Editable details */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-saffron-200 bg-white p-6 space-y-4"
      >
        <h2 className="font-heading text-lg font-semibold text-navy">
          Member details
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-navy/70 mb-1">
              First name
            </label>
            <input
              defaultValue={CURRENT_MEMBER.firstName}
              className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
          </div>
          <div>
            <label className="block text-sm text-navy/70 mb-1">
              Last name
            </label>
            <input
              defaultValue={CURRENT_MEMBER.lastName}
              className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-navy/70 mb-1">Phone</label>
          <input
            defaultValue={CURRENT_MEMBER.phone}
            className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
          />
        </div>
        <div>
          <label className="block text-sm text-navy/70 mb-1">Branch</label>
          <select
            defaultValue={
              BRANCHES.find((b) => b.name === CURRENT_MEMBER.branch)?.id
            }
            className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
          >
            {BRANCHES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} — {b.city}, {b.state}
              </option>
            ))}
          </select>
        </div>

        {saved && (
          <p className="text-sm text-forest bg-forest/10 rounded-md px-3 py-2">
            Profile updated (locally only — not yet saved to a database).
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Update Profile"}
          </button>
          <button
            type="button"
            className="rounded-md border border-saffron-200 px-5 py-2 text-sm font-medium text-navy hover:bg-saffron-50"
          >
            Change Password
          </button>
        </div>
      </form>

      {/* Volunteer hours / achievements */}
      <div className="rounded-xl border border-saffron-200 bg-white p-6">
        <h2 className="font-heading text-lg font-semibold text-navy mb-3">
          Volunteer hours & achievements
        </h2>
        <div className="flex justify-between text-sm text-navy/70 mb-1">
          <span>{CURRENT_MEMBER.volunteerHours} hours logged</span>
          <span>{nextMilestone} hours to Gold Member</span>
        </div>
        <div className="h-2 rounded-full bg-saffron-100 overflow-hidden">
          <div
            className="h-full bg-saffron-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-navy/50">
          Current badge: Silver Member (100+ hours)
        </p>
      </div>

      {/* Notification preferences */}
      <div className="rounded-xl border border-saffron-200 bg-white p-6">
        <h2 className="font-heading text-lg font-semibold text-navy mb-3">
          Notification preferences
        </h2>
        <div className="space-y-2 text-sm text-navy/70">
          {[
            "Email for event reminders",
            "Weekly activity newsletter",
            "New opportunities in my interest area",
            "Marketing & promotional emails",
          ].map((label, i) => (
            <label key={label} className="flex items-center gap-2">
              <input
                type="checkbox"
                defaultChecked={i < 3}
                className="rounded border-saffron-300"
              />
              {label}
            </label>
          ))}
        </div>
        <button className="mt-4 rounded-md bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800">
          Save Preferences
        </button>
      </div>
    </div>
  );
}
