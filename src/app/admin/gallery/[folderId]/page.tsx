"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  GALLERY_ACCEPTED_TYPES,
  GALLERY_BUCKET,
  GALLERY_MAX_BYTES,
} from "@/lib/gallery";
import type { GalleryFolder, GalleryImage } from "@/lib/supabase/types";

type UploadProgress = { done: number; total: number };

export default function AdminGalleryFolderPage() {
  const params = useParams<{ folderId: string }>();
  const folderId = params.folderId;
  const router = useRouter();

  const [folder, setFolder] = useState<GalleryFolder | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [uploading, setUploading] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [captionDrafts, setCaptionDrafts] = useState<Record<string, string>>({});
  const [savingCaption, setSavingCaption] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function loadFolder() {
    setLoading(true);
    const supabase = createClient();

    const [folderRes, imagesRes] = await Promise.all([
      supabase.from("gallery_folders").select("*").eq("id", folderId).single(),
      supabase
        .from("gallery_images")
        .select("*")
        .eq("folder_id", folderId)
        .order("sort_order", { ascending: true }),
    ]);

    if (folderRes.error || !folderRes.data) {
      console.error("Failed to load folder:", folderRes.error);
      setNotFound(true);
      setLoading(false);
      return;
    }

    setFolder(folderRes.data as GalleryFolder);
    setImages((imagesRes.data || []) as GalleryImage[]);
    setLoading(false);
  }

  useEffect(() => {
    loadFolder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  async function handleFiles(fileList: FileList) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const rejected = files.find(
      (f) => !GALLERY_ACCEPTED_TYPES.includes(f.type) || f.size > GALLERY_MAX_BYTES
    );
    if (rejected) {
      setError(
        `"${rejected.name}" was skipped — images must be JPG, PNG or WebP and under ${Math.round(GALLERY_MAX_BYTES / (1024 * 1024))}MB.`
      );
    }

    const accepted = files.filter(
      (f) => GALLERY_ACCEPTED_TYPES.includes(f.type) && f.size <= GALLERY_MAX_BYTES
    );
    if (accepted.length === 0) return;

    setUploading({ done: 0, total: accepted.length });
    const supabase = createClient();
    let nextSort = images.length > 0
      ? Math.max(...images.map((i) => i.sort_order)) + 1
      : 0;
    const uploaded: GalleryImage[] = [];

    for (const file of accepted) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      // Foldering the object by folder id keeps the bucket browsable and makes
      // a stray file easy to trace back to a gallery folder.
      const storagePath = `${folderId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(GALLERY_BUCKET)
        .upload(storagePath, file, { upsert: false });

      if (uploadError) {
        setError(`Upload failed for "${file.name}": ${uploadError.message}`);
        break;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(storagePath);

      const { data: row, error: insertError } = await supabase
        .from("gallery_images")
        .insert({
          folder_id: folderId,
          image_url: publicUrl,
          storage_path: storagePath,
          sort_order: nextSort,
        })
        .select()
        .single();

      if (insertError || !row) {
        // Don't leave an orphan file behind if the row could not be written.
        await supabase.storage.from(GALLERY_BUCKET).remove([storagePath]);
        setError(
          `Saving "${file.name}" failed: ${insertError?.message || "unknown error"}`
        );
        break;
      }

      uploaded.push(row as GalleryImage);
      nextSort += 1;
      setUploading((prev) =>
        prev ? { ...prev, done: prev.done + 1 } : prev
      );
    }

    if (uploaded.length > 0) {
      setImages((prev) => [...prev, ...uploaded]);
    }
    setUploading(null);
  }

  async function handleDeleteImage(image: GalleryImage) {
    if (!confirm("Delete this photo? This cannot be undone.")) return;

    const supabase = createClient();

    const { error: deleteError } = await supabase
      .from("gallery_images")
      .delete()
      .eq("id", image.id);

    if (deleteError) {
      setError("Failed to delete photo: " + deleteError.message);
      return;
    }

    await supabase.storage.from(GALLERY_BUCKET).remove([image.storage_path]);

    setImages((prev) => prev.filter((i) => i.id !== image.id));
    if (folder?.cover_image_id === image.id) {
      // The FK clears it in the database; mirror that locally.
      setFolder({ ...folder, cover_image_id: null });
    }
  }

  async function moveImage(image: GalleryImage, direction: -1 | 1) {
    const idx = images.findIndex((i) => i.id === image.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= images.length) return;

    const reordered = [...images];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    const renumbered = reordered.map((img, i) => ({ ...img, sort_order: i }));
    setImages(renumbered);

    const supabase = createClient();
    await Promise.all(
      renumbered.map((img) =>
        supabase
          .from("gallery_images")
          .update({ sort_order: img.sort_order })
          .eq("id", img.id)
      )
    );
  }

  async function setAsCover(image: GalleryImage) {
    if (!folder) return;
    const supabase = createClient();

    setFolder({ ...folder, cover_image_id: image.id });

    const { error: coverError } = await supabase
      .from("gallery_folders")
      .update({ cover_image_id: image.id })
      .eq("id", folder.id);

    if (coverError) {
      setError("Failed to set cover: " + coverError.message);
      setFolder({ ...folder });
    }
  }

  async function saveCaption(image: GalleryImage) {
    const caption = (captionDrafts[image.id] ?? image.caption ?? "").trim();
    setSavingCaption(image.id);

    const supabase = createClient();
    const { error: captionError } = await supabase
      .from("gallery_images")
      .update({ caption: caption || null })
      .eq("id", image.id);

    setSavingCaption(null);

    if (captionError) {
      setError("Failed to save caption: " + captionError.message);
      return;
    }

    setImages((prev) =>
      prev.map((i) => (i.id === image.id ? { ...i, caption: caption || null } : i))
    );
    setCaptionDrafts((prev) => {
      const next = { ...prev };
      delete next[image.id];
      return next;
    });
  }

  if (loading) {
    return <p className="text-sm text-navy/60">Loading folder...</p>;
  }

  if (notFound || !folder) {
    return (
      <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center space-y-3">
        <p className="text-navy/60">This gallery folder no longer exists.</p>
        <button
          onClick={() => router.push("/admin/gallery")}
          className="rounded-md bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
        >
          Back to Gallery
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/gallery"
          className="text-xs font-medium text-saffron-700 hover:text-saffron-800"
        >
          ← All folders
        </Link>
        <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-navy">
              {folder.name}
            </h1>
            <p className="text-sm text-navy/60 mt-1">
              {images.length} photo{images.length === 1 ? "" : "s"}
              {!folder.is_published && " · hidden from the public gallery"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={GALLERY_ACCEPTED_TYPES.join(",")}
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
                e.target.value = "";
              }}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!!uploading}
              className="rounded-md bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-60"
            >
              {uploading
                ? `Uploading ${uploading.done + 1} of ${uploading.total}...`
                : "+ Upload Photos"}
            </button>
          </div>
        </div>
      </div>

      {folder.description && (
        <p className="text-sm text-navy/70 max-w-2xl">{folder.description}</p>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
          {error}{" "}
          <button
            onClick={() => setError(null)}
            className="underline hover:no-underline"
          >
            Dismiss
          </button>
        </p>
      )}

      {images.length === 0 ? (
        <div className="rounded-xl border border-dashed border-saffron-300 bg-white p-12 text-center space-y-2">
          <p className="text-navy/60">No photos in this folder yet.</p>
          <p className="text-xs text-navy/50">
            JPG, PNG or WebP, up to{" "}
            {Math.round(GALLERY_MAX_BYTES / (1024 * 1024))}MB each. You can
            select several files at once.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {images.map((image, i) => {
            const isCover = folder.cover_image_id === image.id;
            const draft = captionDrafts[image.id];
            const captionChanged =
              draft !== undefined && draft !== (image.caption || "");

            return (
              <div
                key={image.id}
                className="rounded-xl border border-saffron-200 bg-white overflow-hidden flex flex-col"
              >
                <div className="relative aspect-[4/3] bg-saffron-50">
                  <img
                    src={image.image_url}
                    alt={image.caption || ""}
                    className="w-full h-full object-cover"
                  />
                  {isCover && (
                    <span className="absolute top-2 left-2 rounded-full bg-saffron-700 px-2 py-0.5 text-xs font-medium text-white">
                      Cover
                    </span>
                  )}
                </div>

                <div className="p-3 flex-1 flex flex-col gap-2">
                  <input
                    type="text"
                    value={draft ?? image.caption ?? ""}
                    onChange={(e) =>
                      setCaptionDrafts((prev) => ({
                        ...prev,
                        [image.id]: e.target.value,
                      }))
                    }
                    placeholder="Add a caption"
                    className="w-full rounded-md border border-saffron-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  />
                  {captionChanged && (
                    <button
                      onClick={() => saveCaption(image)}
                      disabled={savingCaption === image.id}
                      className="self-start rounded-md bg-saffron-700 px-3 py-1 text-xs font-semibold text-white hover:bg-saffron-800 disabled:opacity-60"
                    >
                      {savingCaption === image.id ? "Saving..." : "Save caption"}
                    </button>
                  )}

                  <div className="mt-auto pt-1 flex flex-wrap items-center gap-3 text-xs">
                    {!isCover && (
                      <button
                        onClick={() => setAsCover(image)}
                        className="text-navy/60 hover:text-navy"
                      >
                        Set as cover
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteImage(image)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                    <span className="ml-auto flex items-center gap-1">
                      <button
                        onClick={() => moveImage(image, -1)}
                        disabled={i === 0}
                        className="text-navy/60 hover:text-saffron-700 disabled:opacity-30"
                        aria-label="Move photo earlier"
                      >
                        ←
                      </button>
                      <button
                        onClick={() => moveImage(image, 1)}
                        disabled={i === images.length - 1}
                        className="text-navy/60 hover:text-saffron-700 disabled:opacity-30"
                        aria-label="Move photo later"
                      >
                        →
                      </button>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
