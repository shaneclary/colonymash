import {
  type DemoState, type FulfillMethod, type OrderSlot, type TradeOrder, type TradeOrderStatus,
} from "../content/portal-demo.ts";

export type ScheduleResult = { state: DemoState; error?: string };
const validDay = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value + "T12:00:00Z").toISOString().slice(0, 10) === value;
const methods: FulfillMethod[] = ["delivery", "pickup"];

/**
 * Schedule an accepted order for a day, a hand-off and a time window.
 * On an order that is already scheduled this changes the slot and leaves the status alone.
 */
export function scheduleOrder(state: DemoState, id: string, slot: OrderSlot, today: string): ScheduleResult {
  const order = state.orders.find(x => x.id === id);
  if (!order || (order.status !== "accepted" && order.status !== "scheduled"))
    return { state, error: "Only an accepted order can be scheduled." };
  if (!validDay(slot.date) || !validDay(today) || slot.date < today) return { state, error: "Choose today or a later day." };
  if (!methods.includes(slot.method)) return { state, error: "Choose delivery or pickup." };
  const clean: OrderSlot = { date: slot.date, method: slot.method, window: slot.window.trim().slice(0, 40) };
  const next: TradeOrder = order.status === "scheduled" ? { ...order, slot: clean }
    : { ...order, status: "scheduled", slot: clean, history: [...(order.history ?? []), { status: "scheduled", at: today }] };
  return { state: { ...state, orders: state.orders.map(x => x.id === id ? next : x) } };
}

const before: Partial<Record<TradeOrderStatus, TradeOrderStatus>> = {
  accepted: "requested", scheduled: "accepted", fulfilled: "scheduled",
};

/** The status an order would return to, or null when there is nothing to undo. */
export function previousStatus(state: DemoState, order: TradeOrder): TradeOrderStatus | null {
  if (order.status === "requested") return null;
  // Once the buyer has received it, the units are in their stock. Do not unwind that from here.
  if (state.merchantReceipts.some(x => x.orderId === order.id && x.merchantId === order.merchantId)) return null;
  const history = order.history ?? [];
  if (order.status === "cancelled")
    return history.length >= 2 && history.at(-1)?.status === "cancelled" ? history.at(-2)!.status : "requested";
  return before[order.status] ?? null;
}

/** Undo the last status change on one order. Works after a reload, unlike the undo bar. */
export function stepBackOrder(state: DemoState, id: string): DemoState {
  const order = state.orders.find(x => x.id === id);
  const to = order && previousStatus(state, order);
  if (!order || !to) return state;
  const history = order.history ?? [];
  const trimmed = history.at(-1)?.status === order.status ? history.slice(0, -1) : history;
  const { slot, ...rest } = order;
  const keepSlot = to === "scheduled" || to === "fulfilled";
  const next: TradeOrder = { ...rest, status: to, ...(order.history ? { history: trimmed } : {}), ...(keepSlot && slot ? { slot } : {}) };
  return { ...state, orders: state.orders.map(x => x.id === id ? next : x) };
}
