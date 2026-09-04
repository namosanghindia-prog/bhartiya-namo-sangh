// Shared bits for the photo gallery, used by both the admin screens and the
// public pages so the bucket name and slug rules only live in one place.

export const GALLERY_BUCKET = "gallery-images";

export const GALLERY_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

// Supabase Storage caps free-tier uploads well above this; 8MB keeps the
// public gallery quick to load without rejecting ordinary phone photos.
export const GALLERY_MAX_BYTES = 8 * 1024 * 1024;

export function galleryFolderSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "folder"
  );
}

export function formatGalleryDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
