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
