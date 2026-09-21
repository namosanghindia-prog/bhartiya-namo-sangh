/**
 * Browser-only image helpers. Importing this from a server file is fine; the
 * functions themselves need `document`, so only call them from a client
 * component.
 */

/** Longest edge a stored avatar needs. Cards and lists render it far smaller. */
export const AVATAR_MAX_DIMENSION = 1024;

/** Below this, re-encoding buys nothing, so the original file is kept as-is. */
const SHRINK_ABOVE_BYTES = 400 * 1024;

export interface ShrunkImage {
  blob: Blob;
  contentType: string;
}

/**
 * Re-encode an image down to `maxDimension` on its longest edge.
 *
 * Phone cameras produce 3–8 MP JPEGs for what ends up as an 80px circle. The
 * full-size file has to survive a round trip through the signup form (which
 * stashes it in localStorage while the member goes to confirm their email) and
 * an upload, and both of those get unreliable at megabyte scale — localStorage
 * throws past its quota and the upload times out on a phone connection.
 *
 * Every failure path returns the original file: a large photo that uploads is
 * better than no photo, which is what the previous signup flow ended up with.
 */
export async function shrinkImage(
  file: File,
  maxDimension: number = AVATAR_MAX_DIMENSION,
  quality = 0.85
): Promise<ShrunkImage> {
  try {
    const bitmap = await createImageBitmap(file);
    const longestEdge = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, maxDimension / longestEdge);

    if (scale === 1 && file.size <= SHRINK_ABOVE_BYTES) {
      bitmap.close();
      return { blob: file, contentType: file.type };
    }

    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

    // JPEG has no alpha channel, so a transparent PNG would otherwise come out
    // with a black background.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob) throw new Error("canvas.toBlob returned nothing");

    // A tiny source image can encode larger as JPEG than it was as PNG.
    if (blob.size >= file.size && scale === 1) {
      return { blob: file, contentType: file.type };
    }

    return { blob, contentType: "image/jpeg" };
  } catch (err) {
    console.warn("[image] Could not resize, using the original file:", err);
    return { blob: file, contentType: file.type };
  }
}

/** Rotate a photo 90° clockwise. Used on the signup photo editor. */
export async function rotateImageClockwise(blob: Blob): Promise<ShrunkImage> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.height;
  canvas.height = bitmap.width;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
  bitmap.close();
  const out = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9)
  );
  if (!out) throw new Error("canvas.toBlob returned nothing");
  return { blob: out, contentType: "image/jpeg" };
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
    reader.readAsDataURL(blob);
  });
}

export function dataUrlToBlob(dataUrl: string, contentType: string): Blob {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: contentType });
}
