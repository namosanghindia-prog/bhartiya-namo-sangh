"use client";

import { useState } from "react";

type Fields = {
  fullName: string;
  guardianName: string;
  mobile: string;
  email: string;
  address: string;
};

const EMPTY: Fields = { fullName: "", guardianName: "", mobile: "", email: "", address: "" };

interface Success {
  registrationNumber: string;
  invitationSent: boolean;
  alreadyRegistered: boolean;
}

const inputClass =
  "mt-1 block w-full rounded-md border border-saffron-200 px-3 py-2 text-navy outline-none focus:border-saffron-500 focus:ring-1 focus:ring-saffron-500";

export default function RegistrationForm() {
  const [fields, setFields] = useState<Fields>(EMPTY);
  // Honeypot: hidden from people, filled in by naive bots.
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Success | null>(null);

  function set<K extends keyof Fields>(key: K, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const mobile = fields.mobile.replace(/[\s-]/g, "");
    if (!/^(\+91)?[6-9]\d{9}$/.test(mobile)) {
      setError("कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें। / Please enter a valid 10-digit mobile number.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/events/namo-sewa-samman-2026/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, mobile, website }),
      });
      const body = await res.json().catch(() => null);

      if (!res.ok || !body?.registrationNumber) {
        setError(body?.error ?? "पंजीकरण नहीं हो सका, कृपया पुनः प्रयास करें। / Registration failed, please try again.");
        return;
      }

      setSuccess({
        registrationNumber: body.registrationNumber,
        invitationSent: Boolean(body.invitationSent),
        alreadyRegistered: Boolean(body.alreadyRegistered),
      });
      setFields(EMPTY);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("सर्वर से संपर्क नहीं हो सका। / Could not reach the server.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#138808] text-2xl text-white">
          ✓
        </div>
        <h3 className="font-devanagari mt-3 text-xl font-bold text-[#138808]">
          {success.alreadyRegistered ? "आप पहले से पंजीकृत हैं" : "पंजीकरण सफल!"}
        </h3>
        <p className="mt-1 text-sm text-navy/70">
          {success.alreadyRegistered
            ? "You are already registered for this event."
            : "Your registration is confirmed."}
        </p>
        <div className="mx-auto mt-4 inline-block rounded-lg border border-saffron-200 bg-white px-5 py-3">
          <div className="text-xs uppercase tracking-wide text-navy/50">
            पंजीकरण संख्या / Registration No.
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-saffron-800">
            {success.registrationNumber}
          </div>
        </div>
        <p className="font-devanagari mt-4 text-sm text-navy/80">
          {success.invitationSent
            ? "आपका आमंत्रण पत्र आपकी ईमेल पर भेज दिया गया है। कृपया कार्यक्रम में इसे साथ लाएँ।"
            : "आमंत्रण पत्र ईमेल अभी नहीं भेजा जा सका — हमारी टीम शीघ्र ही आपसे संपर्क करेगी। कृपया अपनी पंजीकरण संख्या सुरक्षित रखें।"}
        </p>
        <p className="mt-1 text-xs text-navy/60">
          {success.invitationSent
            ? "Your invitation letter has been emailed to you (check spam too). Please bring it to the event."
            : "We could not email your invitation right now — our team will follow up. Please note your registration number."}
        </p>
        <button
          onClick={() => setSuccess(null)}
          className="mt-5 text-sm font-semibold text-saffron-700 hover:text-saffron-800"
        >
          Register another person →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-navy">
          पूरा नाम / Full Name <span className="text-red-600">*</span>
        </label>
        <input
          id="fullName"
          required
          maxLength={120}
          autoComplete="name"
          value={fields.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="guardianName" className="block text-sm font-medium text-navy">
          पिता / माता / पति का नाम / Father/Mother/Husband&apos;s Name{" "}
          <span className="text-red-600">*</span>
        </label>
        <input
          id="guardianName"
          required
          maxLength={120}
          value={fields.guardianName}
          onChange={(e) => set("guardianName", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="mobile" className="block text-sm font-medium text-navy">
            मोबाइल नंबर / Mobile Number <span className="text-red-600">*</span>
          </label>
          <input
            id="mobile"
            type="tel"
            required
            inputMode="numeric"
            autoComplete="tel"
            maxLength={14}
            value={fields.mobile}
            onChange={(e) => set("mobile", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-navy">
            ईमेल / Email <span className="text-red-600">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            value={fields.email}
            onChange={(e) => set("email", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-navy">
          पता / Address <span className="text-red-600">*</span>
        </label>
        <textarea
          id="address"
          required
          rows={3}
          maxLength={500}
          autoComplete="street-address"
          value={fields.address}
          onChange={(e) => set("address", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-saffron-700 px-4 py-3 font-semibold text-white transition-colors hover:bg-saffron-800 disabled:opacity-60"
      >
        {submitting ? "पंजीकरण हो रहा है... / Registering..." : "पंजीकरण करें / Register"}
      </button>
    </form>
  );
}
