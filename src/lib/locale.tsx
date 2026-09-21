"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Locale = "en" | "hi";
export type Copy = { en: string; hi: string };

const STORAGE_KEY = "bns-locale";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => {},
});

function subscribeLocale(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function readLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "hi" || stored === "en") return stored;
  } catch {
    // Private mode or blocked storage — stay on English.
  }
  return "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const stored = useSyncExternalStore(subscribeLocale, readLocale, () => "en");
  const [override, setOverride] = useState<Locale | null>(null);
  const locale = override ?? stored;

  const setLocale = useCallback((next: Locale) => {
    setOverride(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore persistence failures.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "hi" ? "hi" : "en";
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function useT() {
  const { locale } = useLocale();
  return (copy: Copy | string) => (typeof copy === "string" ? copy : copy[locale]);
}

export function T({
  children,
  className = "",
  as: Tag = "span",
}: {
  children: Copy;
  className?: string;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "h4" | "li" | "em" | "strong";
}) {
  const { locale } = useLocale();
  return (
    <Tag
      lang={locale === "hi" ? "hi" : undefined}
      className={locale === "hi" ? `font-devanagari ${className}` : className}
    >
      {children[locale]}
    </Tag>
  );
}
