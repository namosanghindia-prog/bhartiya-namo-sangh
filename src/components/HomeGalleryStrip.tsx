import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";

const STRIP_SIZE = 6;

type ImageRow = {
  id: string;
  image_url: string;
  caption: string | null;
  folder: { slug: string; name: string }[] | { slug: string; name: string } | null;
};

// Supabase returns an embedded row as an object or a single-element array
// depending on how it infers the relationship, so normalise before use.
function folderOf(row: ImageRow) {
  if (!row.folder) return null;
  return Array.isArray(row.folder) ? (row.folder[0] ?? null) : row.folder;
}

// The newest photos from published folders. Rendered on the homepage; RLS
// already limits this to folders an admin has published, so there is no
// visibility filter here.
export default async function HomeGalleryStrip() {
  const supabase = createPublicClient();

  // Two foreign keys join these tables — images.folder_id and the folder's
  // cover_image_id — so the embed has to name the one it means or PostgREST
  // rejects it as ambiguous (PGRST201).
  const { data, error } = await supabase
    .from("gallery_images")
    .select(
      "id, image_url, caption, folder:gallery_folders!gallery_images_folder_id_fkey(slug, name)"
    )
    .order("created_at", { ascending: false })
    .limit(STRIP_SIZE);

  if (error) {
    // A gallery hiccup must not take the homepage down — fall back to the
    // plain call to action the section renders without photos.
    console.error("Failed to load homepage gallery strip:", error);
    return null;
  }

  const images = (data || []) as ImageRow[];
  if (images.length === 0) return null;

  return (
    <div className="mt-8 grid grid-cols-3 sm:grid-cols-6 gap-3">
      {images.map((image) => {
        const folder = folderOf(image);
        return (
          <Link
            key={image.id}
            href={folder ? `/gallery/${folder.slug}` : "/gallery"}
            className="group relative aspect-square rounded-lg overflow-hidden bg-white"
            title={image.caption || folder?.name || "View gallery"}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.image_url}
              alt={image.caption || folder?.name || ""}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </Link>
        );
      })}
    </div>
  );
}
