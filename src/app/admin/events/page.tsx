"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Branch, EventCategory } from "@/lib/supabase/types";

const CATEGORIES: EventCategory[] = [
  "Social",
  "Charity",
  "Environmental",
  "Education",
  "Political",
  "Cultural",
  "Sports",
  "Health",
];

interface EventWithRegistrations {
  id: string;
  slug: string;
  title: string;
  category: EventCategory;
  description: string | null;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  branch_id: string | null;
  target_participants: number;
  is_published: boolean;
  is_cancelled: boolean;
  agenda: { time: string; activity: string }[];
  branch: { name: string }[] | null;
  registered_count: number;
}

type EventFormData = {
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  branch_id: string;
  target_participants: number;
  is_published: boolean;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

const emptyForm: EventFormData = {
  title: "",
  description: "",
  category: "Social",
  date: "",
  start_time: "10:00 AM",
  end_time: "12:00 PM",
  location: "",
  branch_id: "",
  target_participants: 100,
  is_published: true,
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventWithRegistrations[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventWithRegistrations | null>(null);
  const [formData, setFormData] = useState<EventFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function loadEvents() {
    setLoading(true);
    const supabase = createClient();

    const [eventsRes, branchesRes] = await Promise.all([
      supabase
        .from("events")
        .select(`
          id, slug, title, category, description, date, start_time, end_time,
          location, branch_id, target_participants, is_published, is_cancelled, agenda,
          branch:branches(name)
        `)
        .order("date", { ascending: false }),
      supabase
        .from("branches")
        .select("*")
        .eq("is_active", true)
        .order("name"),
    ]);

    if (eventsRes.error) {
      console.error("Failed to load events:", eventsRes.error);
      setLoading(false);
      return;
    }

    if (branchesRes.data) {
      setBranches(branchesRes.data);
    }

    if (eventsRes.data && eventsRes.data.length > 0) {
      const eventIds = eventsRes.data.map((e) => e.id);
      const { data: regCounts } = await supabase
        .from("event_registrations")
        .select("event_id")
        .in("event_id", eventIds)
        .in("status", ["registered", "confirmed", "attended"]);

      const countMap: Record<string, number> = {};
      regCounts?.forEach((r) => {
        countMap[r.event_id] = (countMap[r.event_id] || 0) + 1;
      });

      const eventsWithCounts = eventsRes.data.map((e) => ({
        ...e,
        agenda: (e.agenda as { time: string; activity: string }[]) || [],
        registered_count: countMap[e.id] || 0,
      }));

      setEvents(eventsWithCounts as EventWithRegistrations[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const filtered = events.filter(
    (e) =>
      query.trim() === "" ||
      e.title.toLowerCase().includes(query.toLowerCase())
  );

  function openNewEventModal() {
    setEditingEvent(null);
    setFormData(emptyForm);
    setShowModal(true);
  }

  function openEditModal(event: EventWithRegistrations) {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      category: event.category,
      date: event.date,
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location,
      branch_id: event.branch_id || "",
      target_participants: event.target_participants,
      is_published: event.is_published,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingEvent(null);
    setFormData(emptyForm);
  }

  async function handleSave() {
    if (!formData.title.trim() || !formData.date || !formData.location.trim()) {
      alert("Please fill in required fields: Title, Date, and Location");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    if (editingEvent) {
      const { error } = await supabase
        .from("events")
        .update({
          title: formData.title,
          description: formData.description || null,
          category: formData.category,
          date: formData.date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          location: formData.location,
          branch_id: formData.branch_id || null,
          target_participants: formData.target_participants,
          is_published: formData.is_published,
        })
        .eq("id", editingEvent.id);

      setSaving(false);

      if (error) {
        console.error("Failed to update event:", error);
        alert("Failed to update event: " + error.message);
        return;
      }
    } else {
      const slug = generateSlug(formData.title) + "-" + Date.now().toString(36);

      const { error } = await supabase.from("events").insert({
        slug,
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        location: formData.location,
        branch_id: formData.branch_id || null,
        target_participants: formData.target_participants,
        is_published: formData.is_published,
        agenda: [],
      });

      setSaving(false);

      if (error) {
        console.error("Failed to create event:", error);
        alert("Failed to create event: " + error.message);
        return;
      }
    }

    await loadEvents();
    closeModal();
  }

  async function handleDelete(event: EventWithRegistrations) {
    const regCount = event.registered_count;
    const message = regCount > 0
      ? `Are you sure you want to delete "${event.title}"?\n\nThis will also remove ${regCount} existing registration${regCount > 1 ? "s" : ""}.`
      : `Are you sure you want to delete "${event.title}"?`;

    if (!confirm(message)) {
      return;
    }

    setDeleting(event.id);
    const supabase = createClient();

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", event.id);

    setDeleting(null);

    if (error) {
      console.error("Failed to delete event:", error);
      alert("Failed to delete event: " + error.message);
      return;
    }

    setEvents((prev) => prev.filter((e) => e.id !== event.id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold text-navy">
          Events
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={loadEvents}
            className="rounded-md border border-saffron-300 px-4 py-2 text-sm font-medium text-navy hover:bg-saffron-50"
          >
            Refresh
          </button>
          <button
            onClick={openNewEventModal}
            className="rounded-md bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
          >
            + New Event
          </button>
        </div>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search events..."
        className="w-full sm:w-96 rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
      />

      {loading ? (
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
          <p className="text-navy/60">Loading events...</p>
        </div>
      ) : (
        <div className="rounded-xl border border-saffron-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-saffron-50 text-navy/70">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Event</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Branch</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Registrations</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const pct = e.target_participants > 0
                  ? Math.round((e.registered_count / e.target_participants) * 100)
                  : 0;
                return (
                  <tr key={e.id} className="border-t border-saffron-100">
                    <td className="px-4 py-3">
                      <span className="font-medium text-navy">{e.title}</span>
                      <span className="ml-2 inline-block rounded-full bg-saffron-100 px-2 py-0.5 text-xs text-saffron-800">
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-navy/70">{formatDate(e.date)}</td>
                    <td className="px-4 py-3 text-navy/70">{e.branch?.[0]?.name || "—"}</td>
                    <td className="px-4 py-3">
                      {e.is_cancelled ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                          Cancelled
                        </span>
                      ) : e.is_published ? (
                        <span className="rounded-full bg-forest/10 px-2 py-0.5 text-xs text-forest">
                          Published
                        </span>
                      ) : (
                        <span className="rounded-full bg-navy/10 px-2 py-0.5 text-xs text-navy/60">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 rounded-full bg-saffron-100 overflow-hidden">
                          <div
                            className="h-full bg-saffron-700"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-navy/60">
                          {e.registered_count}/{e.target_participants}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(e)}
                        className="text-xs font-medium text-saffron-700 hover:text-saffron-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(e)}
                        disabled={deleting === e.id}
                        className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {deleting === e.id ? "..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-navy/50">
                    No events found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Event Modal (Create/Edit) */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={closeModal} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-semibold text-navy">
                  {editingEvent ? "Edit Event" : "New Event"}
                </h2>
                <button onClick={closeModal} className="text-navy/50 hover:text-navy">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy/70 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy/70 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-navy/70 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as EventCategory })}
                      className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy/70 mb-1">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-navy/70 mb-1">Start Time</label>
                    <input
                      type="text"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      placeholder="10:00 AM"
                      className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy/70 mb-1">End Time</label>
                    <input
                      type="text"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      placeholder="12:00 PM"
                      className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy/70 mb-1">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-navy/70 mb-1">Branch</label>
                    <select
                      value={formData.branch_id}
                      onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                      className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                    >
                      <option value="">Select branch</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy/70 mb-1">Target Participants</label>
                    <input
                      type="number"
                      value={formData.target_participants}
                      onChange={(e) => setFormData({ ...formData, target_participants: parseInt(e.target.value) || 0 })}
                      min={0}
                      className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                      className="rounded border-saffron-300 text-saffron-700 focus:ring-saffron-400"
                    />
                    <span className="text-sm text-navy/70">Publish immediately</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={closeModal}
                    className="rounded-md border border-saffron-300 px-4 py-2 text-sm font-medium text-navy hover:bg-saffron-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-md bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : editingEvent ? "Save Changes" : "Create Event"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
