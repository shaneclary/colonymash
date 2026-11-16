import { demoProducts, type DemoState, type PackFormat, type TradeLine, type TradeOrder } from "../content/portal-demo.ts";

const validDay = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(new Date(value + "T12:00:00Z").getTime());

/** A real brewery starts with nothing in it: no sample orders, accounts, recipes or stock. */
export function emptyLedger(): DemoState {
  return {
    version: 4, ingredients: [], finished: [], recipes: [], batches: [], orders: [],
    merchantStock: [], merchantMovements: [], merchantSeries: [], merchantReceipts: [],
    weekHours: {}, events: [], requests: [], accounts: [], accountNotes: [],
  };
}

const formats: PackFormat[] = ["can", "six_pack", "keg"];
const productIds = new Set(demoProducts.map(x => x.id));
export type OrderResult = { state: DemoState; error?: string };

/**
 * Staff enter an order taken by phone, text or in person. It starts as Accepted, because staff took it.
 * Uses the real drink list and ignores the demo's example availability labels.
 */
export function staffCreateOrder(
  state: DemoState, accountId: string, lines: readonly TradeLine[], neededBy: string, notes: string, today: string, id: string,
): OrderResult {
  const account = state.accounts.find(x => x.id === accountId);
  if (!account) return { state, error: "Choose the account. Add it under Accounts first if it is new." };
  const merged = new Map<string, TradeLine>();
  for (const line of lines) {
    if (!productIds.has(line.productId) || !formats.includes(line.format) || !Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 999) continue;
    const key = line.productId + "|" + line.format;
    merged.set(key, { productId: line.productId, format: line.format, quantity: Math.min(999, (merged.get(key)?.quantity ?? 0) + line.quantity) });
  }
  if (merged.size === 0) return { state, error: "Add at least one drink and a quantity." };
  if (!validDay(neededBy) || !validDay(today) || neededBy < today) return { state, error: "Choose today or a later date." };
  if (!id || state.orders.some(x => x.id === id) || state.orders.length >= 2000) return { state, error: "This order cannot be added." };
  const order: TradeOrder = {
    id, merchantId: account.id, merchantName: account.name, createdAt: today, neededBy, lines: [...merged.values()],
    status: "accepted", notes: notes.trim().slice(0, 500),
    history: [{ status: "requested", at: today }, { status: "accepted", at: today }],
  };
  return { state: { ...state, orders: [order, ...state.orders] } };
}
