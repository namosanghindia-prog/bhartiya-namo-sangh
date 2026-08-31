"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface OrgSettings {
  org_name: string;
  founded_year: number | null;
  primary_email: string | null;
}

interface Office {
  label: string;
  address: string;
}

interface ContactSettings {
  phone_primary: string | null;
  phone_secondary: string | null;
  phone_tertiary: string | null;
  whatsapp_number: string | null;
  offices: Office[];
  founder_name: string | null;
  founder_title: string | null;
  website_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
}

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<"general" | "contact" | "email" | "payments">("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [settings, setSettings] = useState<OrgSettings>({
    org_name: "",
    founded_year: null,
    primary_email: null,
  });
  const [contactSettings, setContactSettings] = useState<ContactSettings>({
    phone_primary: null,
    phone_secondary: null,
    phone_tertiary: null,
    whatsapp_number: null,
    offices: [],
    founder_name: null,
    founder_title: null,
    website_url: null,
    facebook_url: null,
    instagram_url: null,
    youtube_url: null,
  });

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("organization_settings")
        // Whole row, so a failed read cannot leave the form blank and let a save
        // write nulls over live contact details. See migration 010.
        .select("*")
        .eq("id", 1)
        .single();

      if (error) {
        console.error("Failed to load settings:", error);
      } else if (data) {
        setSettings({
          org_name: data.org_name || "",
          founded_year: data.founded_year,
          primary_email: data.primary_email,
        });
        setContactSettings({
          phone_primary: data.phone_primary,
          phone_secondary: data.phone_secondary,
          phone_tertiary: data.phone_tertiary,
          whatsapp_number: data.whatsapp_number,
          offices: Array.isArray(data.offices) ? (data.offices as Office[]) : [],
          founder_name: data.founder_name,
          founder_title: data.founder_title,
          website_url: data.website_url,
          facebook_url: data.facebook_url,
          instagram_url: data.instagram_url,
          youtube_url: data.youtube_url,
        });
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  async function handleSaveGeneral() {
    setSaving(true);
    setSaveSuccess(false);

    const supabase = createClient();

    const { error } = await supabase
      .from("organization_settings")
      .update({
        org_name: settings.org_name.trim(),
        founded_year: settings.founded_year,
        primary_email: settings.primary_email?.trim() || null,
      })
      .eq("id", 1);

    setSaving(false);

    if (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings: " + error.message);
      return;
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  }

  async function handleSaveContact() {
    setSaving(true);
    setSaveSuccess(false);

    const supabase = createClient();

    const { error } = await supabase
      .from("organization_settings")
      .update({
        phone_primary: contactSettings.phone_primary?.trim() || null,
        phone_secondary: contactSettings.phone_secondary?.trim() || null,
        phone_tertiary: contactSettings.phone_tertiary?.trim() || null,
        whatsapp_number: contactSettings.whatsapp_number?.trim() || null,
        offices: contactSettings.offices
          .map((o) => ({ label: o.label.trim(), address: o.address.trim() }))
          .filter((o) => o.address),
        founder_name: contactSettings.founder_name?.trim() || null,
        founder_title: contactSettings.founder_title?.trim() || null,
        website_url: contactSettings.website_url?.trim() || null,
        facebook_url: contactSettings.facebook_url?.trim() || null,
        instagram_url: contactSettings.instagram_url?.trim() || null,
        youtube_url: contactSettings.youtube_url?.trim() || null,
      })
      .eq("id", 1);

    setSaving(false);

    if (error) {
      console.error("Failed to save contact settings:", error);
      alert("Failed to save contact settings: " + error.message);
      return;
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  }

  function updateOffice(index: number, patch: Partial<Office>) {
    setContactSettings({
      ...contactSettings,
      offices: contactSettings.offices.map((o, i) =>
        i === index ? { ...o, ...patch } : o
      ),
    });
  }

  function addOffice() {
    setContactSettings({
      ...contactSettings,
      offices: [...contactSettings.offices, { label: "", address: "" }],
    });
  }

  function removeOffice(index: number) {
    setContactSettings({
      ...contactSettings,
      offices: contactSettings.offices.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-heading text-2xl font-semibold text-navy">
        Settings
      </h1>

      <div className="flex flex-wrap gap-2 border-b border-saffron-200">
        {(["general", "contact", "email", "payments"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${
              tab === t
                ? "border-saffron-700 text-saffron-800"
                : "border-transparent text-navy/60 hover:text-navy"
            }`}
          >
            {t === "contact" ? "Contact Info" : t}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div className="rounded-xl border border-saffron-200 bg-white p-6 space-y-4">
          <h2 className="font-heading text-lg font-semibold text-navy">
            General settings
          </h2>

          {loading ? (
            <p className="text-sm text-navy/60">Loading settings...</p>
          ) : (
            <>
              <div>
                <label className="block text-sm text-navy/70 mb-1">
                  Organization name
                </label>
                <input
                  type="text"
                  value={settings.org_name}
                  onChange={(e) =>
                    setSettings({ ...settings, org_name: e.target.value })
                  }
                  className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-navy/70 mb-1">
                    Founded year
                  </label>
                  <input
                    type="number"
                    value={settings.founded_year || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        founded_year: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-navy/70 mb-1">
                    Primary email
                  </label>
                  <input
                    type="email"
                    value={settings.primary_email || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, primary_email: e.target.value })
                    }
                    placeholder="contact@example.org"
                    className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveGeneral}
                  disabled={saving}
                  className="rounded-md bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Update"}
                </button>
                {saveSuccess && (
                  <span className="text-sm text-forest font-medium">
                    Settings saved successfully
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "contact" && (
        <div className="rounded-xl border border-saffron-200 bg-white p-6 space-y-4">
          <h2 className="font-heading text-lg font-semibold text-navy">
            Contact Information
          </h2>
          <p className="text-sm text-navy/60">
            This information is displayed on the public Contact page.
          </p>

          {loading ? (
            <p className="text-sm text-navy/60">Loading settings...</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-navy/70 mb-1">
                    Primary Phone
                  </label>
                  <input
                    type="tel"
                    value={contactSettings.phone_primary || ""}
                    onChange={(e) =>
                      setContactSettings({ ...contactSettings, phone_primary: e.target.value })
                    }
                    placeholder="+91 11 4567 8900"
                    className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-navy/70 mb-1">
                    Secondary Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={contactSettings.phone_secondary || ""}
                    onChange={(e) =>
                      setContactSettings({ ...contactSettings, phone_secondary: e.target.value })
                    }
                    placeholder="+91 98765 43210"
                    className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-navy/70 mb-1">
                    Third Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={contactSettings.phone_tertiary || ""}
                    onChange={(e) =>
                      setContactSettings({ ...contactSettings, phone_tertiary: e.target.value })
                    }
                    placeholder="+91 98765 43210"
                    className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-navy/70 mb-1">
                  WhatsApp Number (optional)
                </label>
                <input
                  type="tel"
                  value={contactSettings.whatsapp_number || ""}
                  onChange={(e) =>
                    setContactSettings({ ...contactSettings, whatsapp_number: e.target.value })
                  }
                  placeholder="+91 98765 43210"
                  className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
              </div>

              <hr className="border-saffron-100" />

              <div>
                <label className="block text-sm text-navy/70 mb-1">
                  Website URL
                </label>
                <input
                  type="text"
                  value={contactSettings.website_url || ""}
                  onChange={(e) =>
                    setContactSettings({ ...contactSettings, website_url: e.target.value })
                  }
                  placeholder="https://www.example.org"
                  className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
              </div>

              <hr className="border-saffron-100" />

              <p className="text-sm font-medium text-navy/70">
                Founder / Head of Organization
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-navy/70 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={contactSettings.founder_name || ""}
                    onChange={(e) =>
                      setContactSettings({ ...contactSettings, founder_name: e.target.value })
                    }
                    placeholder="Dr. Manoj Kumar Tomar"
                    className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-navy/70 mb-1">
                    Title / Designation
                  </label>
                  <input
                    type="text"
                    value={contactSettings.founder_title || ""}
                    onChange={(e) =>
                      setContactSettings({ ...contactSettings, founder_title: e.target.value })
                    }
                    placeholder="National President & Founder"
                    className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  />
                </div>
              </div>

              <hr className="border-saffron-100" />

              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-navy/70">Offices</p>
                <button
                  type="button"
                  onClick={addOffice}
                  className="text-sm font-medium text-saffron-700 hover:text-saffron-800"
                >
                  + Add office
                </button>
              </div>

              {contactSettings.offices.length === 0 && (
                <p className="text-sm text-navy/50">
                  No offices added yet. Click &ldquo;Add office&rdquo; to add one.
                </p>
              )}

              {contactSettings.offices.map((office, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-saffron-100 bg-saffron-50/40 p-4 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={office.label}
                      onChange={(e) => updateOffice(index, { label: e.target.value })}
                      placeholder="Office label (e.g. Head Office)"
                      className="flex-1 rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                    />
                    <button
                      type="button"
                      onClick={() => removeOffice(index)}
                      className="text-sm text-red-600 hover:text-red-700"
                      aria-label={`Remove ${office.label || "office"}`}
                    >
                      Remove
                    </button>
                  </div>
                  <textarea
                    value={office.address}
                    onChange={(e) => updateOffice(index, { address: e.target.value })}
                    placeholder="Full address including city and pincode"
                    rows={2}
                    className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  />
                </div>
              ))}

              <hr className="border-saffron-100" />

              <p className="text-sm font-medium text-navy/70">
                Social Media Links (optional)
              </p>

              <div>
                <label className="block text-sm text-navy/70 mb-1">
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={contactSettings.facebook_url || ""}
                  onChange={(e) =>
                    setContactSettings({ ...contactSettings, facebook_url: e.target.value })
                  }
                  placeholder="https://facebook.com/yourpage"
                  className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
              </div>

              <div>
                <label className="block text-sm text-navy/70 mb-1">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={contactSettings.instagram_url || ""}
                  onChange={(e) =>
                    setContactSettings({ ...contactSettings, instagram_url: e.target.value })
                  }
                  placeholder="https://instagram.com/yourhandle"
                  className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
              </div>

              <div>
                <label className="block text-sm text-navy/70 mb-1">
                  YouTube URL
                </label>
                <input
                  type="url"
                  value={contactSettings.youtube_url || ""}
                  onChange={(e) =>
                    setContactSettings({ ...contactSettings, youtube_url: e.target.value })
                  }
                  placeholder="https://youtube.com/@yourchannel"
                  className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSaveContact}
                  disabled={saving}
                  className="rounded-md bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Update Contact Info"}
                </button>
                {saveSuccess && (
                  <span className="text-sm text-forest font-medium">
                    Contact info saved successfully
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "email" && (
        <div className="rounded-xl border border-saffron-200 bg-white p-6 space-y-4">
          <h2 className="font-heading text-lg font-semibold text-navy">
            Email settings
          </h2>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <div className="flex gap-3">
              <span className="text-amber-600 text-lg">📧</span>
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Email sending is not connected yet
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  Transactional emails (welcome, password reset, receipts) will
                  be configured via environment variables once an email provider
                  (SendGrid, AWS SES, or Resend) is set up. This is typically
                  done during deployment configuration, not through this admin
                  panel.
                </p>
              </div>
            </div>
          </div>

          <div className="text-sm text-navy/60 space-y-2">
            <p className="font-medium text-navy/70">Required environment variables:</p>
            <ul className="list-disc list-inside space-y-1 text-navy/50">
              <li>
                <code className="text-xs bg-navy/5 px-1 rounded">SMTP_HOST</code> — SMTP server address
              </li>
              <li>
                <code className="text-xs bg-navy/5 px-1 rounded">SMTP_USER</code> — SMTP username/API key
              </li>
              <li>
                <code className="text-xs bg-navy/5 px-1 rounded">SMTP_PASS</code> — SMTP password/secret
              </li>
              <li>
                <code className="text-xs bg-navy/5 px-1 rounded">EMAIL_FROM</code> — Sender email address
              </li>
            </ul>
          </div>
        </div>
      )}

      {tab === "payments" && (
        <div className="rounded-xl border border-saffron-200 bg-white p-6 space-y-4">
          <h2 className="font-heading text-lg font-semibold text-navy">
            Payment settings (Razorpay)
          </h2>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <div className="flex gap-3">
              <span className="text-amber-600 text-lg">💳</span>
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Payment processing is not connected yet
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  Razorpay keys will be configured via environment variables
                  once set up. Payment credentials are sensitive and should
                  never be stored in the database — they belong only in
                  server-side environment variables.
                </p>
              </div>
            </div>
          </div>

          <div className="text-sm text-navy/60 space-y-2">
            <p className="font-medium text-navy/70">Required environment variables:</p>
            <ul className="list-disc list-inside space-y-1 text-navy/50">
              <li>
                <code className="text-xs bg-navy/5 px-1 rounded">RAZORPAY_KEY_ID</code> — Your Razorpay Key ID
              </li>
              <li>
                <code className="text-xs bg-navy/5 px-1 rounded">RAZORPAY_KEY_SECRET</code> — Your Razorpay Secret (server-only)
              </li>
            </ul>
            <p className="mt-3 text-xs text-navy/40">
              Once configured, members will be able to pay membership fees and
              make donations online.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
