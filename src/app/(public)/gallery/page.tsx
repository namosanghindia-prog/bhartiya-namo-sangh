import Link from "next/link";
import type { Metadata } from "next";
import GalleryGrid from "@/components/GalleryGrid";
import { createClient } from "@/lib/supabase/server";
import { formatGalleryDate } from "@/lib/gallery";
import type { GalleryFolder, GalleryImage } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Photo Gallery — Bhartiya Namo Sangh",
  description:
    "Photographs from Bhartiya Namo Sangh events, drives and community programs across India.",
};

// Folders and photos change whenever an admin edits them, so don't serve a
// build-time snapshot.
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const supabase = await createClient();

  // RLS keeps this to published folders and their images, so no extra filter
  // is needed here beyond the ordering.
  const [foldersRes, imagesRes] = await Promise.all([
    supabase
      .from("gallery_folders")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("gallery_images")
      .select("*")
      .order("sort_order", { ascending: true }),
  ]);

  const folders = (foldersRes.data || []) as GalleryFolder[];
  const images = (imagesRes.data || []) as GalleryImage[];

  const byFolder: Record<string, GalleryImage[]> = {};
  images.forEach((img) => {
    (byFolder[img.folder_id] ||= []).push(img);
  });

  // Every photo is shown on this page, grouped under its folder. An empty
  // folder has nothing to show, so it stays off the page even when an admin
  // published it ahead of the upload.
  const albums = folders
    .map((f) => ({ ...f, images: byFolder[f.id] || [] }))
    .filter((f) => f.images.length > 0);

  const totalPhotos = albums.reduce((sum, a) => sum + a.images.length, 0);

  return (
    <>
      {/* PAGE HEADER */}
      <section className="bg-saffron-gradient text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="font-heading text-4xl sm:text-5xl font-semibold">
            Photo Gallery
          </h1>
          <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">
            {albums.length > 0
              ? `${totalPhotos} photo${totalPhotos === 1 ? "" : "s"} across ${albums.length} album${albums.length === 1 ? "" : "s"} from our events and community work`
              : "Photographs from our events, drives and community programs"}
          </p>
        </div>
      </section>

      {/* ALBUM JUMP BAR — only earns its space once there are several albums */}
      {albums.length > 1 && (
        <nav className="bg-white border-b border-saffron-100 sticky top-16 z-40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex gap-2 overflow-x-auto">
              {albums.map((album) => (
                <a
                  key={album.id}
                  href={`#${album.slug}`}
                  className="shrink-0 rounded-full border border-saffron-200 px-3 py-1 text-sm text-navy/70 hover:border-saffron-400 hover:text-saffron-700 transition-colors"
                >
                  {album.name}
                  <span className="ml-1.5 text-xs text-navy/40">
                    {album.images.length}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* ALL PHOTOS, GROUPED BY FOLDER */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {albums.length === 0 ? (
            <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
              <p className="text-4xl">🖼️</p>
              <p className="mt-3 text-navy/60">
                Photos are being added soon. Please check back shortly.
              </p>
            </div>
          ) : (
            <div className="space-y-14">
              {albums.map((album) => (
                <div
                  key={album.id}
                  id={album.slug}
                  /* Clear the sticky navbar (and jump bar) when linked to. */
                  className="scroll-mt-32"
                >
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 mb-6 border-b border-saffron-200">
                    <div>
                      <h2 className="font-heading text-2xl font-semibold text-navy">
                        {album.name}
                      </h2>
                      {album.description && (
                        <p className="mt-1 text-sm text-navy/60 max-w-2xl">
                          {album.description}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-navy/40">
                        {album.images.length} photo
                        {album.images.length === 1 ? "" : "s"} ·{" "}
                        {formatGalleryDate(album.created_at)}
                      </p>
                    </div>
                    <Link
                      href={`/gallery/${album.slug}`}
                      className="shrink-0 text-sm font-medium text-saffron-700 hover:text-saffron-800"
                    >
                      Open album →
                    </Link>
                  </div>

                  <GalleryGrid images={album.images} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
