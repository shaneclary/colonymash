/**
 * SIMULATED COLONY MASH OPERATIONS DATA.
 * No value in this file is an owner-approved stock level, recipe, price,
 * supplier, customer account, licensing status or delivery commitment.
 */
import { drinks } from "./drinks.ts";

export type PortalRole = "admin" | "merchant";
export type PackFormat = "can" | "six_pack" | "keg";
export type TradeOrderStatus = "requested" | "accepted" | "scheduled" | "fulfilled" | "cancelled";
export type Ingredient = { id: string; name: string; unit: "kg" | "L" | "ea"; onHand: number; incoming: number; safety: number; reorderPoint: number; leadDays: number; supplier: string };
export type RecipeLine = { ingredientId: string; perBatch: number };
export type Recipe = { id: string; name: string; yieldLiters: number; bill: RecipeLine[] };
export type Product = { id: string; name: string; kind: "beer" | "seltzer"; color?: string; recipeId: string; description: string };
export type FinishedStock = { productId: string; can: number; six_pack: number; keg: number };
export type ProductionPlan = { recipeId: string; batches: number; targetDate: string };
export type TradeLine = { productId: string; format: PackFormat; quantity: number };
export type TradeOrder = { id: string; merchantId: string; merchantName: string; createdAt: string; neededBy: string; lines: TradeLine[]; status: TradeOrderStatus; notes: string; seriesId?: string };
export type MerchantStock = {
  merchantId: string; productId: string; format: PackFormat; onHand: number;
  minStock: number; targetStock: number; weeklyUse: number; leadDays: number;
};
export type MerchantMovement = {
  id: string; merchantId: string; productId: string; format: PackFormat;
  delta: number; kind: "sale" | "count" | "receipt"; at: string; note: string; orderId?: string;
};
export type MerchantSeries = {
  id: string; merchantId: string; merchantName: string; lines: TradeLine[];
  cadenceDays: 7 | 14 | 28; nextDate: string; active: boolean; notes: string;
};
export type MerchantReceipt = { merchantId: string; orderId: string; receivedAt: string };
export type DemoState = {
  version: 2; ingredients: Ingredient[]; finished: FinishedStock[]; production: ProductionPlan[];
  orders: TradeOrder[]; merchantStock: MerchantStock[]; merchantMovements: MerchantMovement[];
  merchantSeries: MerchantSeries[]; merchantReceipts: MerchantReceipt[];
};

export const demoAccounts = [
  { email: "erik.demo@colonymash.test", password: "MashDemo2026", role: "admin" as const, display: "Erik's operations view", company: "Colony Mash — Demo" },
  { email: "buyer.demo@coastalpartner.test", password: "TradeDemo2026", role: "merchant" as const, display: "Merchant buying view", company: "Coastal Partner — Demo" },
] as const;
export const merchantDemoId = "coastal-partner-demo";

/** Full 35-release history for browsing. This is not a live trade catalog or stock feed. */
export const demoProducts: Product[] = drinks.map(drink => ({
  id: drink.slug,
  name: drink.name,
  kind: drink.kind,
  color: drink.kind === "seltzer" ? drink.flavor : undefined,
  recipeId: ({
    "cherry-limeade": "demo-cherry",
    "purple-reign": "demo-purple",
    "rickys-rice-lager": "demo-lager",
  } as Record<string,string>)[drink.slug] ?? "",
  description: (drink.style || (drink.kind==="seltzer"?"Hard seltzer":"Beer")) +
    " · Archived release. Package options below are illustrative, not confirmed availability.",
}));
export type DemoTradeStatus = "request" | "special_order" | "unavailable";
/**
 * Illustrative per-package merchandising labels.
 * NO badge is a statement about Colony Mash's actual wholesale availability.
 * Actual SKUs/statuses must come from Erik's approved inventory & merchandising data.
 */
const examplePackageExceptions: Partial<Record<string,Partial<Record<PackFormat,DemoTradeStatus>>>> = {
  "coconut-horchata": { keg: "unavailable", six_pack: "special_order" },
  "pink-lightning": { keg: "special_order" },
  "painkiller": { keg: "special_order" },
  "mexican-imperial-stout": { keg: "special_order", can: "unavailable" },
  "cabana-punch": { keg: "unavailable", six_pack: "special_order" },
  "kiwi-canoe": { keg: "special_order" },
  "sicilian-lemonade": { keg: "unavailable" },
  "boysenberry-vanilla": { keg: "special_order" },
  "super-soft-birthday": { six_pack: "special_order" },
};
export function demoTradeStatus(productId:string,format:PackFormat): DemoTradeStatus {
  return examplePackageExceptions[productId]?.[format] ?? "request";
}
export function demoStatusText(status:DemoTradeStatus,format:PackFormat):string {
  return status==="unavailable"
    ? ("Unavailable in " + (format==="keg"?"kegs":format==="six_pack"?"6-packs":"single cans") + " (demo)")
    : status==="special_order" ? "Special order only (demo)" : "Request availability";
}

export const demoRecipes: Recipe[] = [
  { id: "demo-cherry", name: "Illustrative Cherry Limeade process", yieldLiters: 200,
    bill: [{ ingredientId: "base", perBatch: 25 }, { ingredientId: "fruit", perBatch: 14 }, { ingredientId: "nutrient", perBatch: 1 }, { ingredientId: "co2", perBatch: 2 }] },
  { id: "demo-purple", name: "Illustrative Purple Reign process", yieldLiters: 200,
    bill: [{ ingredientId: "base", perBatch: 25 }, { ingredientId: "berry", perBatch: 16 }, { ingredientId: "nutrient", perBatch: 1 }, { ingredientId: "co2", perBatch: 2 }] },
  { id: "demo-lager", name: "Illustrative rice lager process", yieldLiters: 200,
    bill: [{ ingredientId: "malt", perBatch: 36 }, { ingredientId: "hops", perBatch: 1.2 }, { ingredientId: "yeast", perBatch: 0.7 }, { ingredientId: "co2", perBatch: 2 }] },
];
export const demoPackVolumes: Record<PackFormat, number> = {
  can: 0.473, six_pack: 2.838, keg: 58.67,
}; // illustrative 16 oz can and 1/2 bbl keg; Erik must confirm actual formats

export function plusDays(dayOffset: number, reference = new Date()): string {
  const date = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() + dayOffset);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}
export function demoSeed(reference = new Date()): DemoState {
  return {
    version: 2,
    ingredients: [
      { id: "base", name: "Fermentable base (illustrative)", unit: "kg", onHand: 31, incoming: 0, safety: 12, reorderPoint: 24, leadDays: 5, supplier: "Demo Ingredient Supplier" },
      { id: "fruit", name: "Fruit blend (illustrative)", unit: "L", onHand: 9, incoming: 0, safety: 5, reorderPoint: 14, leadDays: 7, supplier: "Demo Fruit Supplier" },
      { id: "berry", name: "Berry concentrate (illustrative)", unit: "L", onHand: 24, incoming: 5, safety: 6, reorderPoint: 10, leadDays: 8, supplier: "Demo Fruit Supplier" },
      { id: "nutrient", name: "Fermentation nutrient (illustrative)", unit: "kg", onHand: 3, incoming: 0, safety: 1, reorderPoint: 2, leadDays: 6, supplier: "Demo Ingredient Supplier" },
      { id: "co2", name: "CO₂ supply (illustrative)", unit: "kg", onHand: 8, incoming: 0, safety: 3, reorderPoint: 5, leadDays: 4, supplier: "Demo Gas Supplier" },
      { id: "malt", name: "Malt blend (illustrative)", unit: "kg", onHand: 47, incoming: 0, safety: 18, reorderPoint: 35, leadDays: 10, supplier: "Demo Malt Supplier" },
      { id: "hops", name: "Hop product (illustrative)", unit: "kg", onHand: 2.2, incoming: 0, safety: 0.5, reorderPoint: 1.5, leadDays: 9, supplier: "Demo Hop Supplier" },
      { id: "yeast", name: "Yeast supply (illustrative)", unit: "kg", onHand: 1.1, incoming: 0, safety: 0.5, reorderPoint: 0.8, leadDays: 5, supplier: "Demo Yeast Supplier" },
    ],
    finished: [
      { productId: "cherry-limeade", can: 18, six_pack: 9, keg: 1 },
      { productId: "purple-reign", can: 24, six_pack: 8, keg: 1 },
      { productId: "rickys-rice-lager", can: 12, six_pack: 6, keg: 2 },
    ],
    production: [
      { recipeId: "demo-cherry", batches: 2, targetDate: plusDays(5, reference) },
      { recipeId: "demo-purple", batches: 1, targetDate: plusDays(8, reference) },
      { recipeId: "demo-lager", batches: 1, targetDate: plusDays(11, reference) },
    ],

    merchantStock: [
      { merchantId: merchantDemoId, productId: "cherry-limeade", format: "six_pack", onHand: 7, minStock: 5, targetStock: 16, weeklyUse: 5, leadDays: 7 },
      { merchantId: merchantDemoId, productId: "cherry-limeade", format: "keg", onHand: 1, minStock: 1, targetStock: 3, weeklyUse: 1.2, leadDays: 10 },
      { merchantId: merchantDemoId, productId: "purple-reign", format: "six_pack", onHand: 3, minStock: 4, targetStock: 14, weeklyUse: 6, leadDays: 7 },
      { merchantId: merchantDemoId, productId: "purple-reign", format: "keg", onHand: 0, minStock: 1, targetStock: 2, weeklyUse: 0.6, leadDays: 10 },
      { merchantId: merchantDemoId, productId: "rickys-rice-lager", format: "six_pack", onHand: 10, minStock: 5, targetStock: 18, weeklyUse: 7, leadDays: 7 },
      { merchantId: merchantDemoId, productId: "rickys-rice-lager", format: "keg", onHand: 1, minStock: 1, targetStock: 3, weeklyUse: 1, leadDays: 10 },
      { merchantId: merchantDemoId, productId: "rickys-rice-lager", format: "can", onHand: 14, minStock: 6, targetStock: 30, weeklyUse: 9, leadDays: 7 },
      { merchantId: "venue-demo", productId: "purple-reign", format: "keg", onHand: 1, minStock: 1, targetStock: 3, weeklyUse: 1.1, leadDays: 9 },
    ],
    merchantMovements: [
      { id:"DEMO-MOV-1", merchantId: merchantDemoId, productId: "purple-reign", format: "six_pack",
        delta: -2, kind: "sale", at: plusDays(-2, reference), note: "Sample sell-through event (already reflected in sample on-hand)." },
    ],
    merchantSeries: [],
    merchantReceipts: [],
    orders: [
      { id: "DEMO-1001", merchantId: merchantDemoId, merchantName: "Coastal Partner — Demo",
        createdAt: plusDays(-4, reference), neededBy: plusDays(6, reference), status: "accepted",
        lines: [{ productId: "cherry-limeade", format: "keg", quantity: 2 }, { productId: "rickys-rice-lager", format: "six_pack", quantity: 4 }],
        notes: "Sample trade delivery; not a real booking." },
      { id: "DEMO-1002", merchantId: "venue-demo", merchantName: "Sample Events Venue — Demo",
        createdAt: plusDays(-2, reference), neededBy: plusDays(13, reference), status: "scheduled",
        lines: [{ productId: "purple-reign", format: "keg", quantity: 3 }],
        notes: "Illustrative scheduled order." },
      { id: "DEMO-1003", merchantId: merchantDemoId, merchantName: "Coastal Partner — Demo",
        createdAt: plusDays(-1, reference), neededBy: plusDays(17, reference), status: "requested",
        lines: [{ productId: "cherry-limeade", format: "six_pack", quantity: 5 }],
        notes: "Pending review; excluded from committed-demand forecast." },
    ],
  };
}
