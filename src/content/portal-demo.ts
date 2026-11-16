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
/** One ingredient amount for one batch at the batch's own size. */
export type BillLine = { ingredientId: string; amount: number };
/** A saved recipe: a name, a batch size and an ingredient bill. Staff edit and reuse these. */
export type RecipeProfile = { id: string; name: string; productId: string; batchLiters: number; bill: BillLine[] };
/** A batch on the production schedule. Copied from a recipe, then free to change. */
export type Batch = {
  id: string; recipeId: string | null; name: string; productId: string; date: string;
  batchLiters: number; bill: BillLine[]; status: "planned" | "packaged"; notes: string;
};
export type Product = { id: string; name: string; kind: "beer" | "seltzer"; color?: string; description: string };
export type FinishedStock = { productId: string; can: number; six_pack: number; keg: number };
export type TradeLine = { productId: string; format: PackFormat; quantity: number };
export type OrderEvent = { status: TradeOrderStatus; at: string };
export type TradeOrder = {
  id: string; merchantId: string; merchantName: string; createdAt: string; neededBy: string;
  lines: TradeLine[]; status: TradeOrderStatus; notes: string; seriesId?: string;
  /** Dated status changes, oldest first. Older demo orders have none. */
  history?: OrderEvent[];
  /** Set when staff schedule the order: the day, the hand-off and the time window. */
  slot?: OrderSlot;
};
export type FulfillMethod = "delivery" | "pickup";
export type OrderSlot = { date: string; method: FulfillMethod; window: string };
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
/** One taproom day in a given week. Times are "HH:MM", 24-hour. */
export type WeekDay = { kind: "open" | "closed" | "private"; opens: string; closes: string; note: string };
export type SpecialEvent = { id: string; title: string; date: string; start: string; end: string; note: string; listed: boolean };
export type StaffRequestKind = "private_event" | "sample" | "demo";
export type StaffRequestStatus = "new" | "approved" | "declined" | "done";
/** Something a person asked the brewery for that is not an order. */
export type StaffRequest = {
  id: string; kind: StaffRequestKind; from: string; merchantId?: string; contact: string;
  date: string; guests?: number; productIds: string[]; notes: string;
  status: StaffRequestStatus; createdAt: string; reply: string;
};
export type AccountStatus = "prospect" | "active" | "paused";
export type Account = {
  id: string; name: string; status: AccountStatus; type: string;
  address: string; contactName: string; contactRole: string; phone: string; email: string;
  licenseType: string; licenseNumber: string; receiving: string; deliveryNotes: string; terms: string;
  tags: string[]; followUpOn: string; kegsReturned: number; since: string;
};
export type AccountNoteKind = "note" | "call" | "visit" | "email";
export type AccountNote = { id: string; merchantId: string; at: string; kind: AccountNoteKind; text: string };
export type DemoState = {
  version: 4; ingredients: Ingredient[]; finished: FinishedStock[];
  recipes: RecipeProfile[]; batches: Batch[];
  orders: TradeOrder[]; merchantStock: MerchantStock[]; merchantMovements: MerchantMovement[];
  merchantSeries: MerchantSeries[]; merchantReceipts: MerchantReceipt[];
  /** Taproom hours changed for one week, keyed by that week's Monday. Seven days, Monday first. */
  weekHours: Record<string, WeekDay[]>;
  events: SpecialEvent[]; requests: StaffRequest[];
  accounts: Account[]; accountNotes: AccountNote[];
};

export const demoAccounts = [
  { email: "erik.demo@colonymash.test", password: "MashDemo2026", role: "admin" as const, display: "Erik's operations view", company: "Colony Mash — Demo" },
  { email: "buyer.demo@coastalpartner.test", password: "TradeDemo2026", role: "merchant" as const, display: "Merchant buying view", company: "Coastal Partner — Demo" },
] as const;
export const merchantDemoId = "coastal-partner-demo";
export const demoMerchants = [
  { id: merchantDemoId, name: "Coastal Partner — Demo" },
  { id: "venue-demo", name: "Sample Events Venue — Demo" },
] as const;

export const packLabels: Record<PackFormat, string> = { can: "Cans", six_pack: "Packs", keg: "Kegs" };
export const requestKindLabels: Record<StaffRequestKind, string> = {
  private_event: "Private event", sample: "Samples", demo: "Staff demo",
};
export const fulfillWindows = ["Morning", "Midday", "Afternoon"] as const;
export const noteKindLabels: Record<AccountNoteKind, string> = { note: "Note", call: "Call", visit: "Visit", email: "Email" };
/** US beer barrel, for showing batch sizes both ways. */
export const litersPerBarrel = 117.348;

/** Order tracking stages, in order. `waiting` says who moves the order next. */
export const trackingSteps = [
  { id: "requested", label: "Requested", waiting: "The brewery reviews the request." },
  { id: "accepted", label: "Accepted", waiting: "The brewery sets a fill date." },
  { id: "scheduled", label: "Scheduled", waiting: "The brewery fills the order." },
  { id: "fulfilled", label: "Filled", waiting: "The buyer confirms receipt." },
  { id: "received", label: "Received", waiting: "" },
] as const;
export const trackingCopy = {
  cancelled: "Cancelled. Nothing more happens on this order.",
  complete: "Complete.",
  late: "Past the requested date.",
} as const;

/** Full 35-release history for browsing. This is not a live trade catalog or stock feed. */
export const demoProducts: Product[] = drinks.map(drink => ({
  id: drink.slug,
  name: drink.name,
  kind: drink.kind,
  color: drink.kind === "seltzer" ? drink.flavor : undefined,
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
    ? ("Unavailable in " + (format==="keg"?"kegs":format==="six_pack"?"packs":"single cans") + " (demo)")
    : status==="special_order" ? "Special order only (demo)" : "Request availability";
}

/** Starting recipe profiles. Invented amounts. Staff replace them with their own. */
export const seedRecipes: RecipeProfile[] = [
  { id: "demo-cherry", name: "Cherry Limeade (sample)", productId: "cherry-limeade", batchLiters: 200,
    bill: [{ ingredientId: "base", amount: 25 }, { ingredientId: "fruit", amount: 14 }, { ingredientId: "nutrient", amount: 1 }, { ingredientId: "co2", amount: 2 }] },
  { id: "demo-purple", name: "Purple Reign (sample)", productId: "purple-reign", batchLiters: 200,
    bill: [{ ingredientId: "base", amount: 25 }, { ingredientId: "berry", amount: 16 }, { ingredientId: "nutrient", amount: 1 }, { ingredientId: "co2", amount: 2 }] },
  { id: "demo-lager", name: "Rice lager (sample)", productId: "rickys-rice-lager", batchLiters: 200,
    bill: [{ ingredientId: "malt", amount: 36 }, { ingredientId: "hops", amount: 1.2 }, { ingredientId: "yeast", amount: 0.7 }, { ingredientId: "co2", amount: 2 }] },
];
export const demoPackVolumes: Record<PackFormat, number> = {
  can: 0.473, six_pack: 2.838, keg: 58.67,
}; // illustrative 16 oz can, a pack counted as six cans, and a 1/2 bbl keg. Pack size is unconfirmed: see the "pack-size" question.

export function plusDays(dayOffset: number, reference = new Date()): string {
  const date = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() + dayOffset);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}
export function demoSeed(reference = new Date()): DemoState {
  return {
    version: 4,
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
    recipes: seedRecipes.map(recipe => ({ ...recipe, bill: recipe.bill.map(line => ({ ...line })) })),
    batches: [
      ...[["DEMO-B1", "demo-cherry", 5], ["DEMO-B2", "demo-cherry", 5], ["DEMO-B3", "demo-purple", 8], ["DEMO-B4", "demo-lager", 11]].map(([id, recipeId, offset]): Batch => {
        const recipe = seedRecipes.find(x => x.id === recipeId)!;
        return { id: String(id), recipeId: recipe.id, name: recipe.name, productId: recipe.productId, date: plusDays(Number(offset), reference),
          batchLiters: recipe.batchLiters, bill: recipe.bill.map(line => ({ ...line })), status: "planned", notes: "" };
      }),
    ],
    weekHours: {},
    events: [
      { id: "DEMO-EV1", title: "Sample release night", date: plusDays(4, reference), start: "16:00", end: "20:00",
        note: "Invented event to show the list.", listed: true },
    ],
    requests: [
      { id: "DEMO-RQ1", kind: "private_event", from: "Sample Birthday Group", contact: "host@example.test",
        date: plusDays(13, reference), guests: 35, productIds: [], notes: "Saturday evening. Asking about bringing food.",
        status: "new", createdAt: plusDays(-2, reference), reply: "" },
      { id: "DEMO-RQ2", kind: "sample", from: "Sample Bottle Shop — Demo", merchantId: "prospect-demo", contact: "buyer@example.test",
        date: plusDays(6, reference), productIds: ["cherry-limeade", "purple-reign"], notes: "New account. Wants to taste before a first order.",
        status: "new", createdAt: plusDays(-1, reference), reply: "" },
      { id: "DEMO-RQ3", kind: "demo", from: "Coastal Partner — Demo", merchantId: merchantDemoId, contact: "buyer.demo@coastalpartner.test",
        date: plusDays(9, reference), productIds: ["rickys-rice-lager"], notes: "Staff tasting before the weekend shift.",
        status: "approved", createdAt: plusDays(-5, reference), reply: "Booked. Bringing one case." },
    ],
    accounts: [
      { id: merchantDemoId, name: "Coastal Partner — Demo", status: "active", type: "Bar / restaurant",
        address: "100 Sample Street, Morro Bay, CA", contactName: "Sample Buyer", contactRole: "Bar manager",
        phone: "805-555-0101", email: "buyer.demo@coastalpartner.test", licenseType: "Type 47 (sample)", licenseNumber: "DEMO-470001",
        receiving: "Tue–Fri 10 AM–2 PM", deliveryNotes: "Back door on the alley. Kegs go in the walk-in.", terms: "Net 15 (sample)",
        tags: ["draft", "seltzer"], followUpOn: plusDays(3, reference), kegsReturned: 0, since: plusDays(-200, reference) },
      { id: "venue-demo", name: "Sample Events Venue — Demo", status: "active", type: "Event venue",
        address: "200 Sample Road, Paso Robles, CA", contactName: "Sample Coordinator", contactRole: "Events",
        phone: "805-555-0102", email: "events@example.test", licenseType: "Type 41 (sample)", licenseNumber: "DEMO-410002",
        receiving: "Thu 9 AM–noon", deliveryNotes: "Call on arrival. Loading dock is shared.", terms: "Pay on delivery (sample)",
        tags: ["kegs only", "seasonal"], followUpOn: "", kegsReturned: 2, since: plusDays(-90, reference) },
      { id: "prospect-demo", name: "Sample Bottle Shop — Demo", status: "prospect", type: "Bottle shop",
        address: "300 Sample Avenue, Atascadero, CA", contactName: "Sample Owner", contactRole: "Owner",
        phone: "805-555-0103", email: "buyer@example.test", licenseType: "Type 20 (sample)", licenseNumber: "DEMO-200003",
        receiving: "", deliveryNotes: "", terms: "", tags: ["cans"], followUpOn: plusDays(-1, reference), kegsReturned: 0, since: plusDays(-6, reference) },
    ],
    accountNotes: [
      { id: "DEMO-N1", merchantId: merchantDemoId, at: plusDays(-7, reference), kind: "visit", text: "Dropped off the rice lager. They want it on a permanent handle." },
      { id: "DEMO-N2", merchantId: "prospect-demo", at: plusDays(-6, reference), kind: "call", text: "Owner asked for samples of two seltzers." },
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
      { id: "DEMO-0998", merchantId: "venue-demo", merchantName: "Sample Events Venue — Demo",
        createdAt: plusDays(-20, reference), neededBy: plusDays(-9, reference), status: "fulfilled",
        lines: [{ productId: "purple-reign", format: "keg", quantity: 4 }],
        notes: "Sample filled order.",
        history: [{ status: "requested", at: plusDays(-20, reference) }, { status: "accepted", at: plusDays(-18, reference) },
          { status: "scheduled", at: plusDays(-15, reference) }, { status: "fulfilled", at: plusDays(-9, reference) }] },
      { id: "DEMO-1001", merchantId: merchantDemoId, merchantName: "Coastal Partner — Demo",
        createdAt: plusDays(-4, reference), neededBy: plusDays(6, reference), status: "accepted",
        lines: [{ productId: "cherry-limeade", format: "keg", quantity: 2 }, { productId: "rickys-rice-lager", format: "six_pack", quantity: 4 }],
        notes: "Sample trade delivery; not a real booking.",
        history: [{ status: "requested", at: plusDays(-4, reference) }, { status: "accepted", at: plusDays(-3, reference) }] },
      { id: "DEMO-1002", merchantId: "venue-demo", merchantName: "Sample Events Venue — Demo",
        createdAt: plusDays(-2, reference), neededBy: plusDays(13, reference), status: "scheduled",
        lines: [{ productId: "purple-reign", format: "keg", quantity: 3 }],
        notes: "Illustrative scheduled order.", slot: { date: plusDays(13, reference), method: "delivery", window: "Morning" },
        history: [{ status: "requested", at: plusDays(-2, reference) }, { status: "accepted", at: plusDays(-2, reference) },
          { status: "scheduled", at: plusDays(-1, reference) }] },
      { id: "DEMO-1003", merchantId: merchantDemoId, merchantName: "Coastal Partner — Demo",
        createdAt: plusDays(-1, reference), neededBy: plusDays(17, reference), status: "requested",
        lines: [{ productId: "cherry-limeade", format: "six_pack", quantity: 5 }],
        notes: "Pending review; excluded from committed-demand forecast.",
        history: [{ status: "requested", at: plusDays(-1, reference) }] },
    ],
  };
}
