"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Member, Branch } from "@/lib/supabase/types";

export default function ProfilePage() {
  const [member, setMember] = useState<Member | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [memberRes, branchesRes] = await Promise.all([
        supabase.from("members").select("*").eq("id", user.id).single(),
        supabase.from("branches").select("*").eq("is_active", true).order("name"),
      ]);

      if (memberRes.data) setMember(memberRes.data);
      if (branchesRes.data) setBranches(branchesRes.data);
      setLoading(false);
    }
    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!member) return;

    setSaving(true);
    setSaved(false);
    setError(null);

    if (!member.avatar_url) {
      setError("Profile photo is required. Please upload a photo before saving.");
      setSaving(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const updates = {
      first_name: formData.get("firstName") as string,
      last_name: formData.get("lastName") as string,
      phone: formData.get("phone") as string,
      branch_id: formData.get("branch") as string || null,
      address: formData.get("address") as string || null,
      designation: formData.get("designation") as string || null,
    };

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("members")
      .update(updates)
      .eq("id", member.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMember({ ...member, ...updates });
    setSaved(true);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !member) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG, or WebP image");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be less than 2MB");
      return;
    }

    setUploading(true);
    setError(null);

    const supabase = createClient();
    const fileExt = file.name.split(".").pop();
    const filePath = `${member.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("members")
      .update({ avatar_url: publicUrl })
      .eq("id", member.id);

    setUploading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMember({ ...member, avatar_url: publicUrl });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-navy/60">Loading profile...</div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">Could not load profile</div>
      </div>
    );
  }

  const nextMilestone = 200;
  const pct = Math.min(
    Math.round((member.volunteer_hours / nextMilestone) * 100),
    100
  );

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="rounded-xl border border-saffron-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            {member.avatar_url ? (
              <img
                src={member.avatar_url}
                alt=""
                className="h-20 w-20 rounded-full object-cover border-2 border-saffron-200"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-saffron-200 flex items-center justify-center font-heading text-2xl font-semibold text-saffron-800 border-2 border-saffron-300">
                {member.first_name[0]}
                {member.last_name[0]}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-xl font-semibold text-navy">
              {member.first_name} {member.last_name}
            </h1>
            <p className="text-sm text-navy/60">{member.email}</p>
            {member.designation && (
              <p className="text-sm text-navy/70">{member.designation}</p>
            )}
            <span className="mt-1 inline-block rounded-full bg-forest/10 px-2 py-0.5 text-xs font-medium text-forest capitalize">
              {member.status} Member
            </span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-saffron-100">
          <label className="block text-sm text-navy/70 mb-2">
            Profile Photo <span className="text-red-600">*</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                member.avatar_url
                  ? "border-saffron-300 text-navy hover:bg-saffron-50"
                  : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
              }`}
            >
              {uploading ? "Uploading..." : member.avatar_url ? "Change Photo" : "Upload Photo"}
            </button>
            <span className="text-xs text-navy/50">JPG, PNG or WebP. Max 2MB.</span>
          </div>
          {!member.avatar_url && (
            <p className="mt-2 text-xs text-red-600">
              Profile photo is required to complete your profile.
            </p>
          )}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-navy/70 mb-1">
              First name
            </label>
            <input
              name="firstName"
              defaultValue={member.first_name}
              required
              className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
          </div>
          <div>
            <label className="block text-sm text-navy/70 mb-1">
              Last name
            </label>
            <input
              name="lastName"
              defaultValue={member.last_name}
              required
              className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-navy/70 mb-1">Designation</label>
          <input
            name="designation"
            defaultValue={member.designation ?? ""}
            placeholder="e.g. Volunteer Coordinator, Event Manager"
            className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
          />
        </div>

        <div>
          <label className="block text-sm text-navy/70 mb-1">Phone</label>
          <input
            name="phone"
            defaultValue={member.phone ?? ""}
            className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
          />
        </div>

        <div>
          <label className="block text-sm text-navy/70 mb-1">Address</label>
          <input
            name="address"
            defaultValue={member.address ?? ""}
            placeholder="Your full address"
            className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
          />
        </div>

        <div>
          <label className="block text-sm text-navy/70 mb-1">Branch</label>
          <select
            name="branch"
            defaultValue={member.branch_id ?? ""}
            className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
          >
            <option value="">No branch selected</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} — {b.city}, {b.state}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        {saved && (
          <p className="text-sm text-forest bg-forest/10 rounded-md px-3 py-2">
            Profile updated successfully!
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
          <span>{member.volunteer_hours} hours logged</span>
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
