"use client";

import Link from "next/link";
import { T } from "@/lib/locale";
import { WORK_SHOWCASE } from "@/lib/about-content";
import type { HomePhoto } from "@/lib/home-content";
import Reveal from "@/components/home/Reveal";

export default function WorkGallery({ photos }: { photos: HomePhoto[] }) {
  const live = photos.slice(0, 9).map((photo) => ({
    id: photo.id,
    src: photo.imageUrl,
    title: {
      en: photo.caption || photo.folderName || "From our work",
      hi: photo.caption || photo.folderName || "हमारे कार्य से",
    },
  }));
  const items =
    live.length >= 6
      ? live
      : [
          ...live,
          ...WORK_SHOWCASE.filter((w) => !live.some((l) => l.src === w.image)).map(
            (w, i) => ({
              id: `fallback-${i}`,
              src: w.image,
              title: w.title,
            })
          ),
        ].slice(0, 9);

  return (
    <section id="our-work" className="bg-[#f6f4f0] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p
            lang="hi"
            className="font-devanagari text-xs font-semibold uppercase tracking-[0.22em] text-saffron-800"
          >
            सेवा की झलक
          </p>
          <T
            as="h2"
            className="mt-3 font-heading text-3xl font-semibold tracking-tight text-navy sm:text-5xl"
          >
            {{ en: "A glimpse of the work.", hi: "कार्य की एक झलक।" }}
          </T>
        </Reveal>

        <div className="mt-12 columns-2 gap-4 sm:columns-3">
          {items.map((item) => (
            <figure key={item.id} className="mb-4 break-inside-avoid overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.src} alt={item.title.en} className="w-full object-cover" />
              <figcaption className="bg-white px-3 py-2 text-xs text-navy/60">
                <T>{item.title}</T>
              </figcaption>
            </figure>
          ))}
        </div>

        <Link
          href="/gallery"
          className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-navy hover:text-saffron-800"
        >
          <T>{{ en: "View gallery", hi: "गैलरी देखें" }}</T>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
