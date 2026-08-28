"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  NOTICE_LOCALES,
  NOTICE_STORAGE_KEY,
  NOTICE_LANG_KEY,
  OFFICIAL_ACCOUNTS,
  pickLocale,
  type NoticeLocale,
} from "@/lib/paymentNotice";

/**
 * Payment-safety notice, shown once per browser.
 *
 * Gating lives in localStorage, so it survives page reloads and later visits;
 * bumping NOTICE_STORAGE_KEY re-shows it to everyone. Every storage access is
 * wrapped, because private windows and blocked site-data make these throw
 * rather than return null — and a notice that crashes the page is worse than a
 * notice that shows twice.
 */
export default function PaymentSafetyNotice() {
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState<NoticeLocale>(NOTICE_LOCALES[0]);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let seen = false;
    try {
      seen = window.localStorage.getItem(NOTICE_STORAGE_KEY) === "1";
    } catch {
      // Storage unavailable — show it rather than suppress a safety notice.
    }
    if (seen) return;

    // Deferred rather than set synchronously: the page paints behind the modal
    // first, so a visitor sees the site they asked for and then the notice over
    // it, instead of a dialog on a blank page.
    const t = setTimeout(() => {
      let chosen: NoticeLocale | undefined;
      try {
        const saved = window.localStorage.getItem(NOTICE_LANG_KEY);
        if (saved) chosen = NOTICE_LOCALES.find((l) => l.code === saved);
      } catch {
        /* ignore */
      }
      setLocale(chosen ?? pickLocale(navigator.languages ?? [navigator.language]));
      setOpen(true);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  const dismiss = useCallback(() => {
    setOpen(false);
    try {
      window.localStorage.setItem(NOTICE_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  // Lock background scroll and wire up Escape while the dialog is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, dismiss]);

  function changeLocale(code: string) {
    const next = NOTICE_LOCALES.find((l) => l.code === code);
    if (!next) return;
    setLocale(next);
    try {
      window.localStorage.setItem(NOTICE_LANG_KEY, code);
    } catch {
      /* ignore */
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-notice-heading"
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div
        lang={locale.code}
        dir={locale.dir ?? "ltr"}
        className="my-auto w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="bg-[#0a1929] px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#f2c94c]">
                {locale.subheading}
              </p>
              <h2
                id="payment-notice-heading"
                className="mt-1 font-heading text-xl sm:text-2xl font-bold leading-tight text-white"
              >
                <span aria-hidden="true">⚠️ </span>
                {locale.heading}
              </h2>
            </div>
            <button
              ref={closeRef}
              onClick={dismiss}
              aria-label="Close"
              className="flex-shrink-0 rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Language picker */}
          <div className="mt-3">
            <label htmlFor="notice-lang" className="sr-only">
              Choose language
            </label>
            <select
              id="notice-lang"
              value={locale.code}
              onChange={(e) => changeLocale(e.target.value)}
              dir="ltr"
              className="w-full sm:w-auto rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white outline-none focus:border-[#f2c94c]"
            >
              {NOTICE_LOCALES.map((l) => (
                <option key={l.code} value={l.code} className="text-navy">
                  {l.label} — {l.englishLabel}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-5 sm:px-6">
          <div className="space-y-3 text-sm leading-relaxed text-navy/80">
            {locale.before.map((p) => (
              <p key={p}>{p}</p>
            ))}

            <div className="rounded-lg border-2 border-[#138808]/40 bg-[#138808]/5 px-4 py-3">
              <p className="font-semibold text-[#0f6b1f]">{locale.accountsIntro}</p>
              <ul className="mt-2 space-y-1">
                {OFFICIAL_ACCOUNTS.map((a) => (
                  <li key={a} className="flex items-start gap-2 font-semibold text-navy" dir="ltr">
                    <span aria-hidden="true" className="text-[#138808]">✓</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>

            {locale.after.map((p) => (
              <p key={p}>{p}</p>
            ))}

            <p className="pt-1 font-semibold text-navy">{locale.closing}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-saffron-200 bg-saffron-50 px-5 py-4 sm:px-6">
          <p className="text-center font-heading text-sm font-bold uppercase tracking-wide text-[#b00020]">
            {locale.footer}
          </p>
          <div className="mt-3 flex flex-col-reverse sm:flex-row items-center justify-center gap-2 sm:gap-3">
            <a
              href="/contact"
              onClick={dismiss}
              className="w-full sm:w-auto text-center rounded-md border border-saffron-300 px-4 py-2 text-sm font-semibold text-saffron-800 hover:bg-saffron-100 transition-colors"
            >
              {locale.verifyLink}
            </a>
            <button
              onClick={dismiss}
              className="w-full sm:w-auto rounded-md bg-saffron-700 px-6 py-2 text-sm font-semibold text-white hover:bg-saffron-800 transition-colors"
            >
              {locale.cta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
