
export type Format = "cans" | "keg";
export type RequestLine = { slug: string; format: Format; quantity: number };
export type Fulfillment = "pickup" | "county" | "regional";

/** Proposed thresholds only. Erik must confirm them before delivery is offered. */
export const deliveryProposal = { countyMinKegs: 3, regionalMinKegs: 5, regionalMaxMiles: 150 } as const;

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
