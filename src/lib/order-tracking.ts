import {
  trackingCopy, trackingSteps, type DemoState, type TradeOrder,
} from "../content/portal-demo.ts";

export type TrackStepId = (typeof trackingSteps)[number]["id"];
export type TrackStep = { id: TrackStepId; label: string; state: "done" | "current" | "upcoming"; at?: string };
export type OrderTracking = {
  steps: TrackStep[];
  /** Who moves the order next, or why nothing will. */
  next: string;
  cancelled: boolean;
  complete: boolean;
  /** Still open and past the requested date. */
  late: boolean;
};

const pipeline = ["requested", "accepted", "scheduled", "fulfilled"] as const;

/** Where one order stands, from its status, its dated history and the buyer's receipt. */
export function trackOrder(state: DemoState, order: TradeOrder, today: string): OrderTracking {
  const history = order.history ?? [];
  const receipt = state.merchantReceipts.find(x => x.orderId === order.id && x.merchantId === order.merchantId);
  const dateOf = (id: TrackStepId): string | undefined =>
    id === "received" ? receipt?.receivedAt
      : history.find(event => event.status === id)?.at ?? (id === "requested" ? order.createdAt : undefined);
  const cancelled = order.status === "cancelled";
  const complete = order.status === "fulfilled" && Boolean(receipt);

  // A cancelled order shows only the stages its history proves it reached.
  const reached = cancelled
    ? Math.max(0, ...pipeline.map((id, index) => history.some(event => event.status === id) ? index : 0))
    : pipeline.indexOf(order.status as (typeof pipeline)[number]);

  const steps = trackingSteps.map((step, index): TrackStep => {
    const stepState: TrackStep["state"] = complete || index < reached || (cancelled && index === reached) ? "done"
      : index === reached ? "current" : "upcoming";
    const at = stepState === "upcoming" ? undefined : dateOf(step.id);
    return { id: step.id, label: step.label, state: stepState, ...(at ? { at } : {}) };
  });
  const next = cancelled ? trackingCopy.cancelled : complete ? trackingCopy.complete : trackingSteps[reached].waiting;
  const late = !cancelled && order.status !== "fulfilled" && order.neededBy < today;
  return { steps, next, cancelled, complete, late };
}

/** One account's order by its number, or the end of it. Nothing when the text matches several. */
export function findOrder(state: DemoState, merchantId: string, query: string): TradeOrder | undefined {
  const text = query.trim().toLowerCase();
  if (!text) return undefined;
  const mine = state.orders.filter(x => x.merchantId === merchantId);
  const exact = mine.find(x => x.id.toLowerCase() === text);
  if (exact) return exact;
  const partial = mine.filter(x => x.id.toLowerCase().includes(text));
  return partial.length === 1 ? partial[0] : undefined;
}
