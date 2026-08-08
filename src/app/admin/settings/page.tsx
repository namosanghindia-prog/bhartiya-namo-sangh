"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface OrgSettings {
  org_name: string;
  founded_year: number | null;
  primary_email: string | null;
}

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<"general" | "email" | "payments">("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [settings, setSettings] = useState<OrgSettings>({
    org_name: "",
    founded_year: null,
    primary_email: null,
  });

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("organization_settings")
        .select("org_name, founded_year, primary_email")
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

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-heading text-2xl font-semibold text-navy">
        Settings
      </h1>

      <div className="flex gap-2 border-b border-saffron-200">
        {(["general", "email", "payments"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${
              tab === t
                ? "border-saffron-700 text-saffron-800"
                : "border-transparent text-navy/60 hover:text-navy"
            }`}
          >
            {t}
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
              <div className="grid grid-cols-2 gap-3">
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
