/**
 * SIMULATED COLONY MASH OPERATIONS DATA.
 * No value in this file is an owner-approved stock level, recipe, price,
 * supplier, customer account, licensing status or delivery commitment.
 */
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
export type TradeOrder = { id: string; merchantId: string; merchantName: string; createdAt: string; neededBy: string; lines: TradeLine[]; status: TradeOrderStatus; notes: string };
export type DemoState = { version: 1; ingredients: Ingredient[]; finished: FinishedStock[]; production: ProductionPlan[]; orders: TradeOrder[] };

export const demoAccounts = [
  { email: "erik.demo@colonymash.test", password: "MashDemo2026", role: "admin" as const, display: "Erik's operations view", company: "Colony Mash — Demo" },
  { email: "buyer.demo@coastalpartner.test", password: "TradeDemo2026", role: "merchant" as const, display: "Merchant buying view", company: "Coastal Partner — Demo" },
] as const;
export const merchantDemoId = "coastal-partner-demo";

export const demoProducts: Product[] = [
  { id: "cherry-limeade", name: "Cherry Limeade", kind: "seltzer", color: "red", recipeId: "demo-cherry", description: "Listed Colony Mash release; all trade inventory and recipes below are fictitious." },
  { id: "purple-reign", name: "Purple Reign", kind: "seltzer", color: "purple", recipeId: "demo-purple", description: "Listed Colony Mash release; all trade inventory and recipes below are fictitious." },
  { id: "rickys-rice-lager", name: "Ricky's Rice Lager", kind: "beer", recipeId: "demo-lager", description: "Listed Colony Mash release; all trade inventory and recipes below are fictitious." },
];
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
    version: 1,
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
