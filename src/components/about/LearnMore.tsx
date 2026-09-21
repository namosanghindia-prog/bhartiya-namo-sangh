"use client";

import { useState, type ReactNode } from "react";
import { T } from "@/lib/locale";

export default function LearnMore({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {open ? <div className="mt-6 space-y-4">{children}</div> : null}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-5 text-sm font-semibold text-saffron-800 underline-offset-4 hover:underline"
        aria-expanded={open}
      >
        <T>
          {open
            ? { en: "Show less", hi: "संक्षेप दिखाएँ" }
            : { en: "Learn more", hi: "और पढ़ें" }}
        </T>
      </button>
    </div>
  );
}
