"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GALLERY_BUCKET, galleryFolderSlug } from "@/lib/gallery";
import type { GalleryFolder } from "@/lib/supabase/types";

interface FolderRow extends GalleryFolder {
  image_count: number;
  cover_url: string | null;
}

type FolderFormData = {
  name: string;
  description: string;
  is_published: boolean;
};

const emptyForm: FolderFormData = {
  name: "",
  description: "",
  is_published: true,
};

export default function AdminGalleryPage() {
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderRow | null>(null);
  const [formData, setFormData] = useState<FolderFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function loadFolders() {
    setLoading(true);
    const supabase = createClient();

    const { data: folderData, error } = await supabase
      .from("gallery_folders")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load gallery folders:", error);
      setLoading(false);
      return;
    }

    const rows = (folderData || []) as GalleryFolder[];

    // One pass over every image gives both the per-folder count and the cover
    // thumbnail, which is cheaper than a query per folder.
    const { data: images } = await supabase
      .from("gallery_images")
      .select("id, folder_id, image_url, sort_order")
      .order("sort_order", { ascending: true });

    const counts: Record<string, number> = {};
    const firstImage: Record<string, string> = {};
    const byId: Record<string, string> = {};

    images?.forEach((img) => {
      counts[img.folder_id] = (counts[img.folder_id] || 0) + 1;
      if (!firstImage[img.folder_id]) firstImage[img.folder_id] = img.image_url;
      byId[img.id] = img.image_url;
    });

    setFolders(
      rows.map((f) => ({
        ...f,
        image_count: counts[f.id] || 0,
        cover_url:
          (f.cover_image_id ? byId[f.cover_image_id] : null) ||
          firstImage[f.id] ||
          null,
      }))
    );
    setLoading(false);
  }

  useEffect(() => {
    loadFolders();
  }, []);

  function openNewFolderModal() {
    setEditingFolder(null);
    setFormData(emptyForm);
    setShowModal(true);
  }

  function openEditModal(folder: FolderRow) {
    setEditingFolder(folder);
    setFormData({
      name: folder.name,
      description: folder.description || "",
      is_published: folder.is_published,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingFolder(null);
    setFormData(emptyForm);
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      alert("Please give the folder a name");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    if (editingFolder) {
      const { error } = await supabase
        .from("gallery_folders")
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          is_published: formData.is_published,
        })
        .eq("id", editingFolder.id);

      setSaving(false);

      if (error) {
        console.error("Failed to update folder:", error);
        alert("Failed to update folder: " + error.message);
        return;
      }
    } else {
      // The slug is what the public URL uses, so keep it unique without asking
      // the admin to think about it.
      const slug =
        galleryFolderSlug(formData.name) + "-" + Date.now().toString(36);

      const { error } = await supabase.from("gallery_folders").insert({
        slug,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        is_published: formData.is_published,
        sort_order: folders.length,
      });

      setSaving(false);

      if (error) {
        console.error("Failed to create folder:", error);
        alert("Failed to create folder: " + error.message);
        return;
      }
    }

    await loadFolders();
    closeModal();
  }

  async function togglePublished(folder: FolderRow) {
    const supabase = createClient();
    const next = !folder.is_published;

    setFolders((prev) =>
      prev.map((f) => (f.id === folder.id ? { ...f, is_published: next } : f))
    );

    const { error } = await supabase
      .from("gallery_folders")
      .update({ is_published: next })
      .eq("id", folder.id);

    if (error) {
      console.error("Failed to change visibility:", error);
      alert("Failed to change visibility: " + error.message);
      setFolders((prev) =>
        prev.map((f) =>
          f.id === folder.id ? { ...f, is_published: folder.is_published } : f
        )
      );
    }
  }

  async function moveFolder(folder: FolderRow, direction: -1 | 1) {
    const idx = folders.findIndex((f) => f.id === folder.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= folders.length) return;

    const reordered = [...folders];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    setFolders(reordered.map((f, i) => ({ ...f, sort_order: i })));

    const supabase = createClient();
    await Promise.all(
      reordered.map((f, i) =>
        supabase.from("gallery_folders").update({ sort_order: i }).eq("id", f.id)
      )
    );
  }

  async function handleDelete(folder: FolderRow) {
    const message =
      folder.image_count > 0
        ? `Delete the folder "${folder.name}"?\n\nThis also permanently deletes its ${folder.image_count} image${folder.image_count > 1 ? "s" : ""}.`
        : `Delete the folder "${folder.name}"?`;

    if (!confirm(message)) return;

    setDeleting(folder.id);
    const supabase = createClient();

    // Remove the stored files first. The image rows cascade with the folder,
    // but storage objects are not cleaned up by the database.
    const { data: images } = await supabase
      .from("gallery_images")
      .select("storage_path")
      .eq("folder_id", folder.id);

    if (images && images.length > 0) {
      await supabase.storage
        .from(GALLERY_BUCKET)
        .remove(images.map((i) => i.storage_path));
    }

    const { error } = await supabase
      .from("gallery_folders")
      .delete()
      .eq("id", folder.id);

    setDeleting(null);

    if (error) {
      console.error("Failed to delete folder:", error);
      alert("Failed to delete folder: " + error.message);
      return;
    }

    setFolders((prev) => prev.filter((f) => f.id !== folder.id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy">
            Gallery
          </h1>
          <p className="text-sm text-navy/60 mt-1">
            Group photos into folders. Published folders appear on the public
            gallery page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/gallery"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-saffron-300 px-4 py-2 text-sm font-medium text-navy hover:bg-saffron-50"
          >
            Preview gallery →
          </a>
          <button
            onClick={openNewFolderModal}
            className="rounded-md bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
          >
            + New Folder
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
          <p className="text-navy/60">Loading folders...</p>
        </div>
      ) : folders.length === 0 ? (
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
          <p className="text-navy/60">
            No gallery folders yet. Create one to start uploading photos.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder, i) => (
            <div
              key={folder.id}
              className="rounded-xl border border-saffron-200 bg-white overflow-hidden flex flex-col"
            >
              <Link
                href={`/admin/gallery/${folder.id}`}
                className="block aspect-[4/3] bg-saffron-50 relative"
              >
                {folder.cover_url ? (
                  <img
                    src={folder.cover_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-4xl">
                    🖼️
                  </span>
                )}
                {!folder.is_published && (
                  <span className="absolute top-2 left-2 rounded-full bg-navy/80 px-2 py-0.5 text-xs font-medium text-white">
                    Hidden
                  </span>
                )}
              </Link>

              <div className="p-4 flex-1 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/admin/gallery/${folder.id}`}
                    className="font-medium text-navy hover:text-saffron-700"
                  >
                    {folder.name}
                  </Link>
                  <span className="shrink-0 rounded-full bg-saffron-100 px-2 py-0.5 text-xs text-saffron-800">
                    {folder.image_count} photo
                    {folder.image_count === 1 ? "" : "s"}
                  </span>
                </div>

                {folder.description && (
                  <p className="text-sm text-navy/60 line-clamp-2">
                    {folder.description}
                  </p>
                )}

                <div className="mt-auto pt-2 flex flex-wrap items-center gap-3 text-xs">
                  <Link
                    href={`/admin/gallery/${folder.id}`}
                    className="font-medium text-saffron-700 hover:text-saffron-800"
                  >
                    Manage photos
                  </Link>
                  <button
                    onClick={() => openEditModal(folder)}
                    className="text-navy/60 hover:text-navy"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => togglePublished(folder)}
                    className="text-navy/60 hover:text-navy"
                  >
                    {folder.is_published ? "Hide" : "Publish"}
                  </button>
                  <button
                    onClick={() => handleDelete(folder)}
                    disabled={deleting === folder.id}
                    className="text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    {deleting === folder.id ? "Deleting..." : "Delete"}
                  </button>
                  <span className="ml-auto flex items-center gap-1">
                    <button
                      onClick={() => moveFolder(folder, -1)}
                      disabled={i === 0}
                      className="text-navy/60 hover:text-saffron-700 disabled:opacity-30"
                      aria-label="Move folder earlier"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveFolder(folder, 1)}
                      disabled={i === folders.length - 1}
                      className="text-navy/60 hover:text-saffron-700 disabled:opacity-30"
                      aria-label="Move folder later"
                    >
                      ↓
                    </button>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Folder Modal (Create/Edit) */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={closeModal} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-semibold text-navy">
                  {editingFolder ? "Edit Folder" : "New Folder"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-navy/50 hover:text-navy"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy/70 mb-1">
                    Folder name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Republic Day 2026"
                    className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy/70 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    placeholder="Shown under the folder name on the gallery page."
                    className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-navy/70">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_published: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-saffron-300"
                  />
                  Show this folder on the public gallery page
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  onClick={closeModal}
                  className="rounded-md border border-saffron-300 px-4 py-2 text-sm font-medium text-navy hover:bg-saffron-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-md bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingFolder
                      ? "Save Changes"
                      : "Create Folder"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
