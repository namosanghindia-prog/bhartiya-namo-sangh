"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { T, useLocale } from "@/lib/locale";
import {
  FALLBACK_MEDIA,
  MEDIA_CATEGORIES,
  type HomePhoto,
  type MediaCategory,
  type MediaItem,
} from "@/lib/home-content";
import Reveal from "@/components/home/Reveal";

function guessCategory(photo: HomePhoto): MediaItem["category"] {
  const blob = `${photo.caption ?? ""} ${photo.folderName ?? ""}`.toLowerCase();
  if (blob.includes("women") || blob.includes("महिला")) return "women";
  if (blob.includes("farm") || blob.includes("किसान")) return "farmers";
  if (blob.includes("educat") || blob.includes("शिक्षा") || blob.includes("school")) return "education";
  if (blob.includes("tree") || blob.includes("environment") || blob.includes("green") || blob.includes("पर्यावरण")) {
    return "environment";
  }
  if (blob.includes("blood") || blob.includes("seva") || blob.includes("service") || blob.includes("सेवा")) {
    return "service";
  }
  if (blob.includes("campaign") || blob.includes("अभियान")) return "campaigns";
  return "events";
}

export default function MediaWall({ photos }: { photos: HomePhoto[] }) {
  const { locale } = useLocale();
  const [filter, setFilter] = useState<MediaCategory>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const items = useMemo<MediaItem[]>(() => {
    const live: MediaItem[] = photos.map((photo) => ({
      id: photo.id,
      src: photo.imageUrl,
      caption: {
        en: photo.caption || photo.folderName || "From our work",
        hi: photo.caption || photo.folderName || "हमारे कार्य से",
      },
      category: guessCategory(photo),
      href: photo.folderSlug ? `/gallery/${photo.folderSlug}` : "/gallery",
    }));
    const used = new Set(live.map((item) => item.src));
    const extras = FALLBACK_MEDIA.filter((item) => !used.has(item.src));
    return [...live, ...extras];
  }, [photos]);

  const visible = filter === "all" ? items : items.filter((item) => item.category === filter);

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (direction: -1 | 1) => {
      setOpenIndex((prev) => {
        if (prev === null) return prev;
        const next = prev + direction;
        if (next < 0 || next >= visible.length) return prev;
        return next;
      });
    },
    [visible.length]
  );

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    }
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [openIndex, close, step]);

  const current = openIndex !== null ? visible[openIndex] : null;

  return (
    <section id="moments" className="bg-[#f6f4f0] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-800">
            <T>{{ en: "Photo + Video Wall", hi: "चित्र और चलचित्र" }}</T>
          </p>
          <T
            as="h2"
            className="mt-3 font-heading text-3xl font-semibold tracking-tight text-navy sm:text-5xl"
          >
            {{ en: "Moments from the work.", hi: "कार्य के क्षण।" }}
          </T>
        </Reveal>

        <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
          {MEDIA_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setFilter(cat.id);
                setOpenIndex(null);
              }}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                filter === cat.id
                  ? "bg-navy text-white"
                  : "bg-white text-navy/70 hover:text-navy"
              }`}
              aria-pressed={filter === cat.id}
            >
              <T>{cat.label}</T>
            </button>
          ))}
        </div>

        <div className="mt-8 columns-2 gap-4 sm:columns-3 lg:columns-4">
          {visible.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setOpenIndex(i)}
              className="mb-4 block w-full break-inside-avoid overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron-600"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.caption[locale]}
                loading="lazy"
                className="w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
              />
            </button>
          ))}
        </div>
      </div>

      {current ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/92"
          role="dialog"
          aria-modal="true"
          aria-label={current.caption[locale]}
          onClick={close}
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <T as="p" className="text-sm text-white/80">
              {current.caption}
            </T>
            <button
              type="button"
              onClick={close}
              className="rounded-full px-3 py-1 text-sm hover:bg-white/10"
            >
              <T>{{ en: "Close", hi: "बंद करें" }}</T>
            </button>
          </div>
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.src}
              alt={current.caption[locale]}
              className="max-h-full max-w-full object-contain"
            />
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={openIndex === 0}
              className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white disabled:opacity-30 sm:flex"
              aria-label={locale === "hi" ? "पिछला" : "Previous"}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={openIndex === visible.length - 1}
              className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white disabled:opacity-30 sm:flex"
              aria-label={locale === "hi" ? "अगला" : "Next"}
            >
              ›
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
