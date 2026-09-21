"use client";

import { useRef, useState } from "react";
import {
  AVATAR_ACCEPTED_TYPES,
  AVATAR_MAX_BYTES,
  AVATAR_MAX_MB,
} from "@/lib/avatar";
import { blobToDataUrl, rotateImageClockwise, shrinkImage } from "@/lib/image";
import { storePendingAvatar } from "@/lib/pending-avatar";

export default function PhotoPicker({
  preview,
  error,
  busy,
  onBusy,
  onChange,
  onError,
}: {
  preview: string | null;
  error: string | null;
  busy: boolean;
  onBusy: (busy: boolean) => void;
  onChange: (preview: string, blob: Blob, type: string) => void;
  onError: (message: string | null) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rotating, setRotating] = useState(false);

  async function apply(blob: Blob, contentType: string) {
    const dataUrl = await blobToDataUrl(blob);
    onChange(dataUrl, blob, contentType);
    storePendingAvatar(dataUrl, contentType);
  }

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    onError(null);
    if (!file) return;

    if (!AVATAR_ACCEPTED_TYPES.includes(file.type)) {
      onError("Please select a JPG, PNG, or WebP image.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > AVATAR_MAX_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      onError(`This photo is ${sizeMb}MB. Please choose an image under ${AVATAR_MAX_MB}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    onBusy(true);
    try {
      const { blob, contentType } = await shrinkImage(file);
      await apply(blob, contentType);
    } catch (err) {
      console.error("[signup] Could not read the selected photo:", err);
      onError("Could not read that image. Please try another photo.");
    } finally {
      onBusy(false);
    }
  }

  async function handleRotate() {
    if (!preview) return;
    setRotating(true);
    onError(null);
    try {
      const res = await fetch(preview);
      const blob = await res.blob();
      const rotated = await rotateImageClockwise(blob);
      await apply(rotated.blob, rotated.contentType);
    } catch (err) {
      console.error("[signup] Could not rotate photo:", err);
      onError("Could not rotate that photo. Please try another.");
    } finally {
      setRotating(false);
    }
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="user"
        onChange={handleSelect}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={busy}
        className="group mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-navy/20 bg-[#f6f4f0] disabled:opacity-60"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className="h-full w-full object-cover object-top" />
        ) : (
          <span className="px-4 text-center text-sm font-medium text-navy/55">
            +
            <span className="mt-1 block">Add Photo</span>
          </span>
        )}
      </button>
      <p className="mt-3 text-center text-sm text-navy/60">
        Upload a clear recent photograph
      </p>
      <p className="text-center text-xs text-navy/40">
        JPG • PNG • WebP • Max {AVATAR_MAX_MB}MB
      </p>
      {preview ? (
        <div className="mt-3 flex justify-center gap-3">
          <button
            type="button"
            onClick={handleRotate}
            disabled={rotating || busy}
            className="rounded-full border border-navy/15 px-4 py-1.5 text-xs font-semibold text-navy disabled:opacity-60"
          >
            {rotating ? "Rotating…" : "Rotate"}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full border border-navy/15 px-4 py-1.5 text-xs font-semibold text-navy"
          >
            Change
          </button>
        </div>
      ) : null}
      {error ? <p className="mt-2 text-center text-sm text-red-600">{error}</p> : null}
      {!preview && !error ? (
        <p className="mt-2 text-center text-xs text-navy/45">Required for membership</p>
      ) : null}
    </div>
  );
}
