"use client";

import { useCallback, useEffect, useState } from "react";
import type { GalleryImage } from "@/lib/supabase/types";

// Thumbnail grid plus a lightbox. Kept client-side so the album page itself can
// stay a server component that only passes rows down.
export default function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (direction: -1 | 1) => {
      setOpenIndex((prev) => {
        if (prev === null) return prev;
        const next = prev + direction;
        if (next < 0 || next >= images.length) return prev;
        return next;
      });
    },
    [images.length]
  );

  useEffect(() => {
    if (openIndex === null) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    }

    window.addEventListener("keydown", onKey);
    // Stop the page behind the lightbox from scrolling.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex, close, step]);

  const current = openIndex !== null ? images[openIndex] : null;

  return (
    <>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, i) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="group relative aspect-square rounded-lg overflow-hidden bg-saffron-50 focus:outline-none focus:ring-2 focus:ring-saffron-400"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.image_url}
              alt={image.caption || ""}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {image.caption && (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6 text-left text-xs text-white line-clamp-2">
                {image.caption}
              </span>
            )}
          </button>
        ))}
      </div>

      {current && (
        /* Column layout, not a centred block: the photo takes the space that
           is left over so the caption below it always keeps its own row. A
           centred figure lets a tall photo plus a long caption overflow the
           viewport, which on a phone pushes the caption off screen. */
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex flex-col"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={current.caption || "Gallery photo"}
        >
          <div className="shrink-0 flex justify-end p-3">
            <button
              type="button"
              onClick={close}
              className="p-2 text-white/70 hover:text-white"
              aria-label="Close"
            >
              <svg
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* min-h-0 lets this row shrink below the image's natural height
              instead of pushing the caption out of the flex container. */}
          <div className="relative flex-1 min-h-0 flex items-center justify-center px-2 sm:px-16">
            {openIndex !== null && openIndex > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                className="absolute left-1 sm:left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-3xl leading-none text-white/80 hover:bg-black/70 hover:text-white"
                aria-label="Previous photo"
              >
                ‹
              </button>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.image_url}
              alt={current.caption || ""}
              onClick={(e) => e.stopPropagation()}
              className="max-h-full max-w-full object-contain"
            />

            {openIndex !== null && openIndex < images.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                className="absolute right-1 sm:right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-3xl leading-none text-white/80 hover:bg-black/70 hover:text-white"
                aria-label="Next photo"
              >
                ›
              </button>
            )}
          </div>

          {/* Capped and scrollable so a long caption cannot crowd out the
              photo on a short screen. */}
          <div
            className="shrink-0 max-h-[30vh] overflow-y-auto px-4 py-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {current.caption && (
              <p className="mx-auto max-w-3xl text-sm sm:text-base text-white/90">
                {current.caption}
              </p>
            )}
            <p className="mt-1 text-xs text-white/50">
              {(openIndex ?? 0) + 1} of {images.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
