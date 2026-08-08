"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string | null;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const TYPE_ICON: Record<string, string> = {
  event: "📅",
  donation: "💚",
  hours: "⏱️",
  badge: "🏆",
  profile: "👤",
  login: "🔑",
  message: "💬",
  registration: "📝",
};

export default function ActivityPage() {
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadActivity() {
      setLoading(true);
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("activity_logs")
        .select("id, type, title, description, created_at")
        .eq("member_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Failed to load activity:", error);
      } else if (data) {
        setActivity(data);
      }
      setLoading(false);
    }
    loadActivity();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const date = formData.get("date") as string;
    const hours = parseFloat(formData.get("hours") as string);
    const description = formData.get("description") as string;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("Not logged in");
      setSubmitting(false);
      return;
    }

    // Log the activity
    const { error } = await supabase.from("activity_logs").insert({
      member_id: user.id,
      type: "hours",
      title: `Logged ${hours} volunteer hours`,
      description: description,
      metadata: { date, hours },
    });

    if (error) {
      console.error("Failed to log hours:", error);
      alert("Failed to submit hours: " + error.message);
      setSubmitting(false);
      return;
    }

    // Update member's volunteer_hours
    const { data: member } = await supabase
      .from("members")
      .select("volunteer_hours")
      .eq("id", user.id)
      .single();

    if (member) {
      await supabase
        .from("members")
        .update({ volunteer_hours: (member.volunteer_hours || 0) + hours })
        .eq("id", user.id);
    }

    setSubmitting(false);
    setSubmitted(true);
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold text-navy">
        Activity & Hours
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity feed */}
        <div className="rounded-xl border border-saffron-200 bg-white p-6">
          <h2 className="font-heading text-lg font-semibold text-navy mb-4">
            Activity feed
          </h2>
          {loading ? (
            <p className="text-sm text-navy/60">Loading...</p>
          ) : activity.length === 0 ? (
            <p className="text-sm text-navy/60">No activity recorded yet.</p>
          ) : (
            <ul className="space-y-4">
              {activity.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <span aria-hidden="true">{TYPE_ICON[item.type] || "📋"}</span>
                  <div>
                    <p className="text-sm text-navy">{item.title}</p>
                    {item.description && (
                      <p className="text-xs text-navy/60">{item.description}</p>
                    )}
                    <p className="text-xs text-navy/40">
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Manual hours log */}
        <div className="rounded-xl border border-saffron-200 bg-white p-6">
          <h2 className="font-heading text-lg font-semibold text-navy mb-4">
            Log volunteer hours
          </h2>
          {submitted ? (
            <div className="space-y-3">
              <p className="text-sm text-forest bg-forest/10 rounded-md px-3 py-2">
                Hours submitted successfully!
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  window.location.reload();
                }}
                className="text-sm text-saffron-700 hover:text-saffron-800"
              >
                Log more hours →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm text-navy/70 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
              </div>
              <div>
                <label className="block text-sm text-navy/70 mb-1">
                  Hours
                </label>
                <input
                  type="number"
                  name="hours"
                  min={0.5}
                  step={0.5}
                  max={24}
                  required
                  className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
              </div>
              <div>
                <label className="block text-sm text-navy/70 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  required
                  placeholder="What did you work on?"
                  className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-saffron-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Hours"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
