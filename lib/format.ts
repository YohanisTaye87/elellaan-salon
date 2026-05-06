export function formatBirr(amount: number): string {
  return new Intl.NumberFormat("en-US").format(amount) + " ETB";
}

export function formatPriceRange(min: number, max: number | null): string {
  if (max == null || max === min) return formatBirr(min);
  return `${new Intl.NumberFormat("en-US").format(min)}–${new Intl.NumberFormat("en-US").format(max)} ETB`;
}
