/**
 * Canonicalize a customer name so the same person is recognized regardless
 * of capitalization, double spaces, or stray whitespace.
 *
 *   "  Biruk   Abebe  "  -> displayName "Biruk Abebe", key "biruk abebe"
 *
 * Wildcards (%, _) are stripped so a customer can't type "%" and see every
 * order in the database via a substring search.
 */
export function normalizeCustomerName(raw: string): {
  displayName: string;
  key: string;
} {
  const display = raw
    .replace(/[%_]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  return { displayName: display, key: display.toLocaleLowerCase() };
}

/**
 * Phone normalizer for Ethiopian (and general) numbers. Keeps a leading "+"
 * if present; otherwise stores digits only. Doesn't reformat — staff still
 * see what the customer typed. Returns null if there aren't enough digits.
 */
export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return null;
  return (hasPlus ? "+" : "") + digits;
}

export function isPhoneValid(raw: string): boolean {
  return normalizePhone(raw) !== null;
}
