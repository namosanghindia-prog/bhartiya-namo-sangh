import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number }
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
// 128 * N * r = 16 MB of working memory; maxmem sits above that so Node does
// not reject the call with its own 32 MB default.
const PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

/** Wrong MPIN attempts allowed before the MPIN locks out. */
export const MAX_FAILED_ATTEMPTS = 5;
/** How long the lockout lasts once MAX_FAILED_ATTEMPTS is reached. */
export const LOCKOUT_MINUTES = 15;

/**
 * Hashes to `scrypt$N$r$p$salt$key`, all base64. The parameters travel with the
 * hash so they can be raised later without invalidating MPINs already set.
 */
export async function hashMpin(mpin: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await scryptAsync(mpin, salt, KEY_LENGTH, PARAMS);
  return [
    "scrypt",
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString("base64"),
    key.toString("base64"),
  ].join("$");
}

/** Constant-time check of an MPIN against a hash produced by hashMpin. */
export async function verifyMpin(mpin: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, n, r, p, saltB64, keyB64] = parts;
  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(keyB64, "base64");
  if (salt.length === 0 || expected.length === 0) return false;

  const options = {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: PARAMS.maxmem,
  };
  if (!Number.isInteger(options.N) || !Number.isInteger(options.r) || !Number.isInteger(options.p)) {
    return false;
  }

  let actual: Buffer;
  try {
    actual = await scryptAsync(mpin, salt, expected.length, options);
  } catch {
    return false;
  }
  return timingSafeEqual(actual, expected);
}

/**
 * Returns null when the MPIN is acceptable, otherwise the reason to show.
 *
 * Six digits is a million combinations before you rule anything out, and the
 * handful of PINs everybody reaches for first are the ones an attacker tries
 * first too — so straight runs and single-digit repeats are refused.
 */
export function validateMpin(mpin: unknown): string | null {
  if (typeof mpin !== "string" || !/^\d{6}$/.test(mpin)) {
    return "MPIN must be exactly 6 digits.";
  }
  if (/^(\d)\1{5}$/.test(mpin)) {
    return "MPIN cannot be the same digit repeated.";
  }
  const digits = mpin.split("").map(Number);
  const ascending = digits.every((d, i) => i === 0 || d === (digits[i - 1] + 1) % 10);
  const descending = digits.every((d, i) => i === 0 || d === (digits[i - 1] + 9) % 10);
  if (ascending || descending) {
    return "MPIN cannot be a sequence of consecutive digits.";
  }
  return null;
}
