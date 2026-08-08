import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { Redis } from "@upstash/redis";
import { DEFAULT_SLIDES, type Slide } from "./slider-types";

export type { Slide };
export { DEFAULT_SLIDES };

const REDIS_KEY = "bns:homepage-slides";
const DATA_FILE = path.join(process.cwd(), "data", "slider.json");

// Uses Upstash Redis when the integration is connected. Supports both naming
// conventions: UPSTASH_REDIS_REST_URL/TOKEN (direct Upstash) and
// KV_REST_API_URL/TOKEN (Vercel KV integration). Falls back to a local JSON
// file for local development without Redis configured. This fallback does NOT
// work reliably on Vercel's serverless filesystem — Redis is required in production.
function getRedis(): Redis | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function readSlides(): Promise<Slide[]> {
  const redis = getRedis();

  if (redis) {
    const slides = await redis.get<Slide[]>(REDIS_KEY);
    if (Array.isArray(slides) && slides.length > 0) return slides;
    return DEFAULT_SLIDES;
  }

  // Local dev fallback (file-based)
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return DEFAULT_SLIDES;
  } catch {
    return DEFAULT_SLIDES;
  }
}

export async function writeSlides(slides: Slide[]): Promise<void> {
  const redis = getRedis();

  if (redis) {
    await redis.set(REDIS_KEY, slides);
    return;
  }

  // Local dev fallback (file-based)
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(slides, null, 2), "utf-8");
}
