import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GalleryGrid from "@/components/GalleryGrid";
import { createClient } from "@/lib/supabase/server";
import { formatGalleryDate } from "@/lib/gallery";
import type { GalleryFolder, GalleryImage } from "@/lib/supabase/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: folder } = await supabase
    .from("gallery_folders")
    .select("name, description")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!folder) return { title: "Gallery — Bhartiya Namo Sangh" };

  return {
    title: `${folder.name} — Photo Gallery — Bhartiya Namo Sangh`,
    description: folder.description || undefined,
  };
}

export default async function GalleryFolderPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: folder, error } = await supabase
    .from("gallery_folders")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !folder) {
    notFound();
  }

  const { data: imageRows } = await supabase
    .from("gallery_images")
    .select("*")
    .eq("folder_id", (folder as GalleryFolder).id)
    .order("sort_order", { ascending: true });

  const images = (imageRows || []) as GalleryImage[];

  return (
    <>
      {/* PAGE HEADER */}
      <section className="bg-saffron-gradient text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <Link
            href="/gallery"
            className="text-sm text-white/80 hover:text-white"
          >
            ← Back to gallery
          </Link>
          <h1 className="mt-3 font-heading text-3xl sm:text-4xl font-semibold">
            {(folder as GalleryFolder).name}
          </h1>
          {(folder as GalleryFolder).description && (
            <p className="mt-3 text-lg text-white/90 max-w-3xl">
              {(folder as GalleryFolder).description}
            </p>
          )}
          <p className="mt-3 text-sm text-white/70">
            {images.length} photo{images.length === 1 ? "" : "s"} ·{" "}
            {formatGalleryDate((folder as GalleryFolder).created_at)}
          </p>
        </div>
      </section>

      {/* PHOTOS */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {images.length === 0 ? (
            <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
              <p className="text-navy/60">
                No photos have been added to this album yet.
              </p>
            </div>
          ) : (
            <GalleryGrid images={images} />
          )}
        </div>
      </section>
    </>
  );
}
