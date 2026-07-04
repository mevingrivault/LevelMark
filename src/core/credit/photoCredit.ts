/**
 * Photo credit business logic.
 *
 * The user only ever types their name. LevelMark is responsible for prefixing
 * it with a single, centralized label so the final metadata value is always of
 * the form: "Crédit photo : {author}".
 */

/** Centralized credit prefix. The user must never type this themselves. */
export const PHOTO_CREDIT_PREFIX = "Crédit photo : ";

/**
 * Build the full photo-credit string from a raw author name.
 *
 * - Leading/trailing whitespace is trimmed.
 * - An empty (or whitespace-only) author yields `null` — no credit is produced,
 *   so callers can safely skip metadata writing.
 * - Otherwise returns `"Crédit photo : {author}"`.
 *
 * @example generatePhotoCredit("  Mévin Grivault  ") // "Crédit photo : Mévin Grivault"
 * @example generatePhotoCredit("")                    // null
 */
export function generatePhotoCredit(author: string | undefined | null): string | null {
  if (typeof author !== "string") {
    return null;
  }

  const trimmed = author.trim();
  if (trimmed.length === 0) {
    return null;
  }

  return `${PHOTO_CREDIT_PREFIX}${trimmed}`;
}
