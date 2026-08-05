"use client";

import { useEffect, useState, useRef } from "react";
import { DEFAULT_SLIDES, type Slide } from "@/lib/slider-types";
import { createClient } from "@/lib/supabase/client";

const COLOR_PRESETS = [
  "#FF6B35",
  "#E65C00",
  "#CC5500",
  "#0A1929",
  "#2D5016",
];

function emptySlide(): Slide {
  return {
    id: `slide-${Date.now()}`,
    headline: "",
    subtext: "",
    ctaLabel: "Learn More",
    ctaHref: "/about",
    bgColor: "#FF6B35",
  };
}

export default function HomepageSliderAdminPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetch("/api/slider")
      .then((r) => r.json())
      .then((data) => {
        setSlides(
          Array.isArray(data.slides) && data.slides.length > 0
            ? data.slides
            : DEFAULT_SLIDES
        );
      })
      .catch(() => setSlides(DEFAULT_SLIDES))
      .finally(() => setLoading(false));
  }, []);

  function updateSlide(id: string, patch: Partial<Slide>) {
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }

  function addSlide() {
    setSlides((prev) => [...prev, emptySlide()]);
  }

  function removeSlide(id: string) {
    setSlides((prev) => prev.filter((s) => s.id !== id));
  }

  function moveSlide(id: string, direction: -1 | 1) {
    setSlides((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  }

  async function handleImageUpload(slideId: string, file: File) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Please select a JPG, PNG, or WebP image");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setUploadError("Image must be less than 3MB");
      return;
    }

    setUploadingId(slideId);
    setUploadError(null);

    const supabase = createClient();
    const fileExt = file.name.split(".").pop();
    const filePath = `${slideId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("slider-images")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setUploadingId(null);
      setUploadError(uploadError.message);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("slider-images")
      .getPublicUrl(filePath);

    updateSlide(slideId, { imageUrl: publicUrl });
    setUploadingId(null);
  }

  function handleFileChange(slideId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(slideId, file);
    }
    e.target.value = "";
  }

  function removeImage(slideId: string) {
    updateSlide(slideId, { imageUrl: undefined });
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/slider", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides }),
      });
      if (!res.ok) throw new Error("Save failed");
      setMessage("Saved — the homepage slider is now updated live.");
    } catch {
      setMessage("Something went wrong saving the slides. Please retry.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-navy/60">Loading slides...</p>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy">
            Homepage Slider
          </h1>
          <p className="text-sm text-navy/60 mt-1">
            Manage the rotating hero banner shown at the top of the homepage.
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-saffron-700 hover:text-saffron-800"
        >
          Preview homepage →
        </a>
      </div>

      {uploadError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
          {uploadError}
        </p>
      )}

      <div className="space-y-4">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className="rounded-xl border border-saffron-200 bg-white p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-navy/50">
                Slide {i + 1}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveSlide(slide.id, -1)}
                  disabled={i === 0}
                  className="text-xs text-navy/60 hover:text-saffron-700 disabled:opacity-30"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveSlide(slide.id, 1)}
                  disabled={i === slides.length - 1}
                  className="text-xs text-navy/60 hover:text-saffron-700 disabled:opacity-30"
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeSlide(slide.id)}
                  className="text-xs font-medium text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-navy/60 mb-1">
                Headline
              </label>
              <input
                value={slide.headline}
                onChange={(e) =>
                  updateSlide(slide.id, { headline: e.target.value })
                }
                className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
              />
            </div>

            <div>
              <label className="block text-xs text-navy/60 mb-1">
                Subtext
              </label>
              <textarea
                value={slide.subtext}
                onChange={(e) =>
                  updateSlide(slide.id, { subtext: e.target.value })
                }
                rows={2}
                className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-navy/60 mb-1">
                  Button label
                </label>
                <input
                  value={slide.ctaLabel}
                  onChange={(e) =>
                    updateSlide(slide.id, { ctaLabel: e.target.value })
                  }
                  className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
              </div>
              <div>
                <label className="block text-xs text-navy/60 mb-1">
                  Button link
                </label>
                <input
                  value={slide.ctaHref}
                  onChange={(e) =>
                    updateSlide(slide.id, { ctaHref: e.target.value })
                  }
                  placeholder="/donate"
                  className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
              </div>
            </div>

            {/* Slide Image Upload */}
            <div>
              <label className="block text-xs text-navy/60 mb-1">
                Slide Image
              </label>
              {slide.imageUrl ? (
                <div className="space-y-2">
                  <div className="relative rounded-md overflow-hidden aspect-[2.4/1] bg-gray-100">
                    <img
                      src={slide.imageUrl}
                      alt="Slide preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(slide.id)}
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    ref={(el) => { fileInputRefs.current[slide.id] = el; }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleFileChange(slide.id, e)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[slide.id]?.click()}
                    disabled={uploadingId === slide.id}
                    className="rounded-md border border-saffron-300 px-4 py-2 text-sm font-medium text-navy hover:bg-saffron-50 disabled:opacity-60"
                  >
                    {uploadingId === slide.id ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Uploading...
                      </span>
                    ) : (
                      "Upload Slide Image"
                    )}
                  </button>
                  <p className="text-xs text-navy/50">
                    Recommended: 1920×800px widescreen, under 500KB for best performance
                  </p>
                </div>
              )}
            </div>

            {/* Background color (fallback when no image) */}
            {!slide.imageUrl && (
              <div>
                <label className="block text-xs text-navy/60 mb-1">
                  Background color (used when no image)
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => updateSlide(slide.id, { bgColor: c })}
                      className={`h-7 w-7 rounded-full border-2 ${
                        slide.bgColor === c
                          ? "border-navy"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                      aria-label={`Use color ${c}`}
                    />
                  ))}
                  <input
                    type="color"
                    value={slide.bgColor}
                    onChange={(e) =>
                      updateSlide(slide.id, { bgColor: e.target.value })
                    }
                    className="h-7 w-10 rounded border border-saffron-200"
                    aria-label="Custom color"
                  />
                </div>
              </div>
            )}

            {/* Live mini preview */}
            <div
              className="rounded-md p-4 text-white text-center relative overflow-hidden"
              style={slide.imageUrl ? undefined : { backgroundColor: slide.bgColor }}
            >
              {slide.imageUrl && (
                <>
                  <img
                    src={slide.imageUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/30" />
                </>
              )}
              <div className="relative z-10">
                <p className="font-heading text-sm font-semibold drop-shadow">
                  {slide.headline || "Headline preview"}
                </p>
                <p className="text-xs text-white/80 mt-1 line-clamp-1 drop-shadow">
                  {slide.subtext || "Subtext preview"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={addSlide}
          className="rounded-md border border-saffron-300 px-4 py-2 text-sm font-medium text-saffron-800 hover:bg-saffron-50"
        >
          + Add Slide
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {message && (
        <p className="text-sm text-forest bg-forest/10 rounded-md px-3 py-2">
          {message}
        </p>
      )}
    </div>
  );
}
