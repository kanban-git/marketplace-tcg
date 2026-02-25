/**
 * Shared helpers for card number normalization, search parsing, and display formatting.
 * Used by Home, Marketplace, and CreateListing to ensure consistency.
 */

/**
 * Normalize a collector number input so that "71/182" matches "071/182".
 * - Pads the card number to 3 digits (71 → 071)
 * - Keeps the total as-is (no padding)
 */
export function normalizeCollectorNumber(input: string): string {
  const trimmed = input.trim();
  if (!trimmed.includes("/")) return trimmed;

  const [local, total] = trimmed.split("/");
  const localPadded = local.replace(/^0+/, "").padStart(3, "0");

  if (!total || total === "") {
    // Partial like "71/" → "071/"
    return `${localPadded}/`;
  }

  const totalClean = parseInt(total, 10);
  if (isNaN(totalClean)) return trimmed;

  return `${localPadded}/${totalClean}`;
}

/**
 * Parse a search query into a structured search intent.
 */
export type CardSearchType =
  | { kind: "exact_number"; number: string; total: number }
  | { kind: "prefix_number"; number: string }
  | { kind: "plain_number"; number: string }
  | { kind: "text"; query: string };

export function parseCardSearch(raw: string): CardSearchType {
  const q = raw.trim();
  if (!q) return { kind: "text", query: "" };

  // "071/182" or "71/182" → exact number search
  const exactMatch = /^(\d+)\/(\d+)$/.exec(q);
  if (exactMatch) {
    const num = exactMatch[1].replace(/^0+/, "").padStart(3, "0");
    const total = parseInt(exactMatch[2], 10);
    return { kind: "exact_number", number: num, total };
  }

  // "071/" or "71/" → prefix number search
  const prefixMatch = /^(\d+)\/$/.exec(q);
  if (prefixMatch) {
    const num = prefixMatch[1].replace(/^0+/, "").padStart(3, "0");
    return { kind: "prefix_number", number: num };
  }

  // Pure digits like "71" or "071" → plain number
  if (/^\d+$/.test(q)) {
    // Normalize: remove leading zeros then pad to find in DB
    const num = q.replace(/^0+/, "") || "0";
    return { kind: "plain_number", number: num };
  }

  return { kind: "text", query: q };
}

/**
 * Build a display string for a card's collector number.
 * Always pads to 3 digits: "71" of set with 182 total → "071/182"
 */
export function formatCollectorNumber(
  number: string | null,
  printedTotal: number | null
): string {
  if (!number) return "—";
  const padded = number.toString().padStart(3, "0");
  if (printedTotal != null) return `${padded}/${printedTotal}`;
  return padded;
}

/**
 * Build a subtitle string for card display.
 * Format: "071/182 · Set Name"
 */
export function formatCardSubtitle(
  number: string | null,
  printedTotal: number | null,
  setName: string | null
): string {
  const num = formatCollectorNumber(number, printedTotal);
  if (setName) return `${num} · ${setName}`;
  return num;
}
