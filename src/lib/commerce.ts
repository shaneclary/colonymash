
/**
 * V3.1 inquiry cart. Formats are requested packaging, not claims of available SKUs.
 * "cans" only exists to preserve customers' older V2 draft selections.
 */
export type Format = "can" | "six_pack" | "keg" | "cans";
export type NewFormat = Exclude<Format, "cans">;
export type RequestLine = { slug: string; format: Format; quantity: number };
export type Fulfillment = "pickup" | "county" | "regional";
export const formatLabels: Record<Format, string> = {
  can: "Single can",
  six_pack: "6-pack",
  keg: "Keg (size TBD)",
  cans: "Cans (old request; format TBD)",
};
export const deliveryProposal = { countyMinKegs: 3, regionalMinKegs: 5, regionalMaxMiles: 150 } as const;
export const maximumQuantity = 99;
const isFormat = (value: unknown): value is Format =>
  value === "can" || value === "six_pack" || value === "keg" || value === "cans";

/** Safely hydrate the browser cart. Never trust localStorage quantities or product IDs. */
export function sanitizeCart(raw: unknown, allowedSlugs: ReadonlySet<string>): RequestLine[] {
  if (!Array.isArray(raw)) return [];
  const collected = new Map<string, RequestLine>();
  for (const row of raw.slice(0, 100)) {
    if (!row || typeof row !== "object") continue;
    const line = row as Record<string, unknown>;
    if (typeof line.slug !== "string" || !allowedSlugs.has(line.slug) ||
        !isFormat(line.format) || !Number.isSafeInteger(line.quantity) ||
        (line.quantity as number) < 1 || (line.quantity as number) > maximumQuantity) continue;
    const key = line.slug + "|" + line.format;
    const previous = collected.get(key);
    collected.set(key, {
      slug: line.slug,
      format: line.format,
      quantity: Math.min(maximumQuantity, (previous?.quantity ?? 0) + (line.quantity as number)),
    });
    if (collected.size >= 80) break;
  }
  return [...collected.values()];
}

export function quantityFor(lines: readonly RequestLine[], slug: string, format: Format): number {
  return lines.find((line) => line.slug === slug && line.format === format)?.quantity ?? 0;
}

export function adjustQuantity(lines: readonly RequestLine[], slug: string, format: Format, delta: number): RequestLine[] {
  if (!slug || !isFormat(format) || !Number.isSafeInteger(delta) || delta === 0) return [...lines];
  const prior = quantityFor(lines, slug, format);
  const next = Math.max(0, Math.min(maximumQuantity, prior + delta));
  if (!prior && next > 0 && lines.length >= 80) return [...lines];
  if (next === 0) return lines.filter((line) => !(line.slug === slug && line.format === format));
  if (prior === 0) return [...lines, { slug, format, quantity: next }];
  return lines.map((line) => line.slug === slug && line.format === format ? { ...line, quantity: next } : line);
}

export const totalUnits = (lines: readonly RequestLine[]) =>
  lines.reduce((sum, line) => sum + line.quantity, 0);

export function kegCount(lines: readonly RequestLine[]) {
  return lines.reduce((sum, line) => sum + (line.format === "keg" && Number.isSafeInteger(line.quantity) && line.quantity > 0 ? line.quantity : 0), 0);
}
export function eligibility(lines: readonly RequestLine[]) {
  const kegs = kegCount(lines);
  return { kegs, county: kegs >= deliveryProposal.countyMinKegs, regional: kegs >= deliveryProposal.regionalMinKegs };
}
export function canRequest(lines: readonly RequestLine[], destination: Fulfillment) {
  const eligible = eligibility(lines);
  return destination === "pickup" || (destination === "county" && eligible.county) || (destination === "regional" && eligible.regional);
}
export const commerceStatus = {
  onlineSalesEnabled: false,
  deliveryConfirmed: false,
  pricesConfirmed: false,
  inventoryConnected: false,
  posConnected: false,
} as const;
