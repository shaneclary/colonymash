import {
  demoPackVolumes, demoProducts, demoRecipes,
  type DemoState, type Ingredient, type PackFormat, type Recipe,
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
  recipe: Recipe;
  productName: string;
  plannedBatches: number;
  extraBatches: number;
  totalBatches: number;
  demandLiters: number;
  finishedLiters: number;
  plannedLiters: number;
  targetDate: string;
};

export function productionEstimates(state: DemoState): ProductionEstimate[] {
  const committed = committedOrderLines(state);
  return demoRecipes.map((recipe) => {
    const product = demoProducts.find(p => p.recipeId === recipe.id);
    const productId = product?.id ?? "";
    const plan = state.production.find(p => p.recipeId === recipe.id);
    const productLines = committed.filter(x => x.productId === productId);
    const finished = state.finished.find(x => x.productId === productId);
    const demandLiters = volumeLiters(productLines);
    // Illustrative volume-equivalent planning only. Real cans/kegs need packaging-specific capacity.
    const finishedLiters = finished
      ? finished.can * demoPackVolumes.can + finished.six_pack * demoPackVolumes.six_pack + finished.keg * demoPackVolumes.keg
      : 0;
    const plannedBatches = Math.max(0, plan?.batches ?? 0);
    const plannedLiters = plannedBatches * recipe.yieldLiters;
    const extraBatches = Math.ceil(Math.max(0, demandLiters - finishedLiters - plannedLiters) / recipe.yieldLiters);
    return {
      recipe, productName: product?.name ?? recipe.name, plannedBatches, extraBatches,
      totalBatches: plannedBatches + extraBatches,
      demandLiters, finishedLiters, plannedLiters,
      targetDate: plan?.targetDate ?? "",
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
  return state.ingredients.map((item) => {
    const required = production.reduce((sum, estimate) => {
      const line = estimate.recipe.bill.find(x => x.ingredientId === item.id);
      return sum + (line?.perBatch ?? 0) * estimate.totalBatches;
    }, 0);
    const projected = item.onHand + item.incoming - required;
    const suggestedOrder = Math.max(0,
      item.safety - projected,
      item.reorderPoint - (item.onHand + item.incoming));
    const pertinentDates = production.filter(estimate =>
      estimate.totalBatches > 0 && estimate.recipe.bill.some(line => line.ingredientId === item.id))
      .map(estimate => estimate.targetDate).filter(Boolean).sort();
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
export function transitionOrder(state: DemoState, id: string, status: TradeOrderStatus): DemoState {
  return {
    ...state, orders: state.orders.map(o => o.id === id && nextOrderStatus(o.status, status) ? { ...o, status } : o),
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

export function changePlannedBatches(state: DemoState, recipeId: string, value: number): DemoState {
  if (!demoRecipes.some(x => x.id === recipeId) || !Number.isSafeInteger(value) || value < 0 || value > 100) return state;
  return {
    ...state,
    production: state.production.map(plan => plan.recipeId === recipeId ? { ...plan, batches: value } : plan),
  };
}
