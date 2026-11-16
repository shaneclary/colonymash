import {
  demoPackVolumes, demoProducts, demoTradeStatus,
  type Batch, type BillLine, type DemoState, type Ingredient, type PackFormat, type RecipeProfile,
  type TradeLine, type TradeOrder, type TradeOrderStatus,
} from "../content/portal-demo.ts";

export const activeOrderStatuses: TradeOrderStatus[] = ["accepted", "scheduled"];
export const reviewOrderStatuses: TradeOrderStatus[] = ["requested", "accepted", "scheduled"];
const formatIds = ["can", "six_pack", "keg"] as const;
const productIds = new Set(demoProducts.map((product) => product.id));

export function isTradeLine(line: unknown): line is TradeLine {
  if (!line || typeof line !== "object") return false;
  const value = line as Record<string, unknown>;
  return typeof value.productId === "string" && productIds.has(value.productId) &&
    formatIds.includes(value.format as PackFormat) &&
    demoTradeStatus(value.productId, value.format as PackFormat) !== "unavailable" &&
    Number.isSafeInteger(value.quantity) && Number(value.quantity) > 0 && Number(value.quantity) <= 99;
}

export function sanitizeTradeLines(data: unknown): TradeLine[] {
  if (!Array.isArray(data)) return [];
  const grouped = new Map<string, TradeLine>();
  for (const value of data.slice(0, 75)) {
    if (!isTradeLine(value)) continue;
    const key = value.productId + "|" + value.format;
    const old = grouped.get(key);
    grouped.set(key, { ...value, quantity: Math.min(99, value.quantity + (old?.quantity ?? 0)) });
  }
  return [...grouped.values()];
}

export function updateTradeCart(lines: readonly TradeLine[], productId: string, format: PackFormat, change: number): TradeLine[] {
  if (!productIds.has(productId) || !formatIds.includes(format) || !Number.isSafeInteger(change)) return [...lines];
  const prev = lines.find((x) => x.productId === productId && x.format === format)?.quantity ?? 0;
  const next = Math.max(0, Math.min(99, prev + change));
  const others = lines.filter((x) => !(x.productId === productId && x.format === format));
  return next > 0 ? [...others, { productId, format, quantity: next }] : others;
}
export const quantityForTrade = (lines: readonly TradeLine[], productId: string, format: PackFormat) =>
  lines.find((x) => x.productId === productId && x.format === format)?.quantity ?? 0;

export function volumeLiters(lines: readonly TradeLine[]): number {
  return lines.reduce((total, x) =>
    total + (isTradeLine(x) ? x.quantity * demoPackVolumes[x.format] : 0), 0);
}
export function committedOrderLines(state: DemoState): TradeLine[] {
  return state.orders.filter(o => activeOrderStatuses.includes(o.status)).flatMap(o => o.lines);
}
export function finishedUnitAvailability(state: DemoState, productId: string, format: PackFormat) {
  const inStock = state.finished.find(s => s.productId === productId)?.[format] ?? 0;
  const committed = state.orders.filter(o => activeOrderStatuses.includes(o.status))
    .flatMap(o => o.lines).filter(l => l.productId === productId && l.format === format)
    .reduce((sum, line) => sum + line.quantity, 0);
  return { stock: inStock, committed, unallocated: inStock - committed };
}

export type ProductionEstimate = {
  productId: string;
  productName: string;
  /** The saved recipe used to size any extra batches. Missing when only one-off batches exist. */
  recipe?: RecipeProfile;
  /** Batches on the schedule that are not packaged yet. */
  batches: Batch[];
  plannedLiters: number;
  extraBatches: number;
  demandLiters: number;
  finishedLiters: number;
  targetDate: string;
};

/** Per product: what is scheduled, what committed orders need, and any extra batches that implies. */
export function productionEstimates(state: DemoState): ProductionEstimate[] {
  const committed = committedOrderLines(state);
  const planned = state.batches.filter(batch => batch.status === "planned");
  const productIdsInPlay = [...new Set([...state.recipes.map(x => x.productId), ...planned.map(x => x.productId)])];
  return productIdsInPlay.map((productId) => {
    const recipe = state.recipes.find(x => x.productId === productId);
    const batches = planned.filter(x => x.productId === productId).sort((a, b) => a.date.localeCompare(b.date));
    const finished = state.finished.find(x => x.productId === productId);
    const demandLiters = volumeLiters(committed.filter(x => x.productId === productId));
    // Illustrative volume-equivalent planning only. Real cans/kegs need packaging-specific capacity.
    const finishedLiters = finished
      ? finished.can * demoPackVolumes.can + finished.six_pack * demoPackVolumes.six_pack + finished.keg * demoPackVolumes.keg
      : 0;
    const plannedLiters = batches.reduce((sum, batch) => sum + batch.batchLiters, 0);
    const extraBatches = recipe && recipe.batchLiters > 0
      ? Math.ceil(Math.max(0, demandLiters - finishedLiters - plannedLiters) / recipe.batchLiters) : 0;
    return {
      productId, productName: demoProducts.find(p => p.id === productId)?.name ?? productId, recipe, batches,
      plannedLiters, extraBatches, demandLiters, finishedLiters, targetDate: batches[0]?.date ?? "",
    };
  });
}
function addDays(isoDate: string, count: number): string {
  const date = new Date(isoDate + "T12:00:00Z");
  if (!Number.isFinite(date.getTime())) return "";
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

export type IngredientNeed = {
  item: Ingredient;
  required: number;
  projected: number;
  suggestedOrder: number;
  reorderBy: string;
  status: "order-now" | "watch" | "covered";
};
export function ingredientForecast(state: DemoState, today: string): IngredientNeed[] {
  const production = productionEstimates(state);
  const amountOf = (bill: BillLine[], id: string) => bill.find(x => x.ingredientId === id)?.amount ?? 0;
  return state.ingredients.map((item) => {
    const required = production.reduce((sum, estimate) =>
      sum + estimate.batches.reduce((batchSum, batch) => batchSum + amountOf(batch.bill, item.id), 0) +
        estimate.extraBatches * amountOf(estimate.recipe?.bill ?? [], item.id), 0);
    const projected = item.onHand + item.incoming - required;
    const suggestedOrder = Math.max(0,
      item.safety - projected,
      item.reorderPoint - (item.onHand + item.incoming));
    const pertinentDates = production.flatMap(estimate => [
      ...estimate.batches.filter(batch => amountOf(batch.bill, item.id) > 0).map(batch => batch.date),
      ...(estimate.extraBatches > 0 && amountOf(estimate.recipe?.bill ?? [], item.id) > 0 ? [estimate.targetDate] : []),
    ]).filter(Boolean).sort();
    const reorderBy = pertinentDates.length ? addDays(pertinentDates[0], -item.leadDays) : "";
    const status: IngredientNeed["status"] = suggestedOrder > 0 && (!reorderBy || reorderBy <= today)
      ? "order-now" : suggestedOrder > 0 ? "watch" : "covered";
    return { item, required, projected, suggestedOrder, reorderBy, status };
  }).sort((a, b) => {
    const rank = { "order-now": 0, watch: 1, covered: 2 };
    return rank[a.status] - rank[b.status] || b.suggestedOrder - a.suggestedOrder;
  });
}
export function ingredientById(state: DemoState, id: string): Ingredient | undefined {
  return state.ingredients.find(x => x.id === id);
}

export function nextOrderStatus(current: TradeOrderStatus, next: TradeOrderStatus): boolean {
  const permitted: Record<TradeOrderStatus, TradeOrderStatus[]> = {
    requested: ["accepted", "cancelled"],
    accepted: ["scheduled", "cancelled"],
    scheduled: ["fulfilled", "cancelled"],
    fulfilled: [],
    cancelled: [],
  };
  return permitted[current].includes(next);
}
/** Pass `at` (YYYY-MM-DD) to date the change for order tracking. */
export function transitionOrder(state: DemoState, id: string, status: TradeOrderStatus, at?: string): DemoState {
  return {
    ...state, orders: state.orders.map(o => o.id === id && nextOrderStatus(o.status, status)
      ? { ...o, status, ...(at ? { history: [...(o.history ?? []), { status, at }] } : {}) } : o),
  };
}
export function createTradeRequest(
  state: DemoState, merchantId: string, merchantName: string, lines: TradeLine[],
  neededBy: string, notes: string, id: string, createdAt: string,
): DemoState {
  const clean = sanitizeTradeLines(lines);
  if (!clean.length || state.orders.some(o => o.id === id) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(neededBy) || neededBy < createdAt) return state;
  const order: TradeOrder = {
    id, merchantId, merchantName, neededBy, createdAt,
    lines: clean, status: "requested", notes: notes.slice(0, 500),
    history: [{ status: "requested", at: createdAt }],
  };
  return { ...state, orders: [order, ...state.orders].slice(0, 100) };
}

/** Numerical inventory edits represent an admin-only MOCK adjustment, not a stock audit. */
export function updateIngredient(
  state: DemoState, id: string, key: "onHand" | "incoming" | "safety" | "reorderPoint" | "leadDays",
  newValue: number,
): DemoState {
  if (!Number.isFinite(newValue) || newValue < 0 || newValue > 100000 ||
    (key === "leadDays" && !Number.isSafeInteger(newValue))) return state;
  return { ...state, ingredients: state.ingredients.map(item => item.id === id ? { ...item, [key]: newValue } : item) };
}
