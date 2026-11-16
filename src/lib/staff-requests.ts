import {
  demoProducts, type DemoState, type StaffRequest, type StaffRequestKind, type StaffRequestStatus,
} from "../content/portal-demo.ts";

export type RequestResult = { state: DemoState; error?: string };
const validDay = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value + "T12:00:00Z").toISOString().slice(0, 10) === value;
const productIds = new Set(demoProducts.map(x => x.id));

export type RequestInput = {
  kind: StaffRequestKind; from: string; merchantId?: string; contact: string;
  date: string; guests?: number; productIds: string[]; notes: string;
};

/** File a request for staff to review. Wholesale accounts ask for samples or a staff demo. */
export function submitRequest(state: DemoState, input: RequestInput, today: string, id: string): RequestResult {
  const from = input.from.trim().slice(0, 80);
  if (from.length < 2) return { state, error: "Say who is asking." };
  if (!["private_event", "sample", "demo"].includes(input.kind)) return { state, error: "Choose what you are asking for." };
  if (!validDay(input.date) || !validDay(today) || input.date < today) return { state, error: "Choose today or a later date." };
  const wanted = [...new Set(input.productIds.filter(x => productIds.has(x)))].slice(0, 12);
  if (input.kind !== "private_event" && wanted.length === 0) return { state, error: "Choose at least one drink." };
  if (input.kind === "private_event" && (!Number.isSafeInteger(input.guests) || Number(input.guests) < 1 || Number(input.guests) > 1000))
    return { state, error: "Enter the number of guests." };
  if (!id || state.requests.some(x => x.id === id) || state.requests.length >= 300) return { state, error: "This request cannot be added." };
  const request: StaffRequest = {
    id, kind: input.kind, from, contact: input.contact.trim().slice(0, 120), date: input.date,
    productIds: wanted, notes: input.notes.trim().slice(0, 500), status: "new", createdAt: today, reply: "",
    ...(input.merchantId ? { merchantId: input.merchantId } : {}),
    ...(input.kind === "private_event" ? { guests: Number(input.guests) } : {}),
  };
  return { state: { ...state, requests: [request, ...state.requests] } };
}

const allowed: Record<StaffRequestStatus, StaffRequestStatus[]> = {
  new: ["approved", "declined"],
  approved: ["done", "declined", "new"],
  declined: ["new"],
  done: ["approved"],
};
export const nextRequestStatuses = (status: StaffRequestStatus): StaffRequestStatus[] => allowed[status];

/** Move a request, and optionally leave the reply the requester sees. */
export function decideRequest(state: DemoState, id: string, status: StaffRequestStatus, reply?: string): DemoState {
  const request = state.requests.find(x => x.id === id);
  if (!request || !allowed[request.status].includes(status)) return state;
  return { ...state, requests: state.requests.map(x => x.id === id
    ? { ...x, status, reply: (reply ?? x.reply).trim().slice(0, 300) } : x) };
}

export function setRequestReply(state: DemoState, id: string, reply: string): DemoState {
  return state.requests.some(x => x.id === id)
    ? { ...state, requests: state.requests.map(x => x.id === id ? { ...x, reply: reply.slice(0, 300) } : x) } : state;
}

export const requestsFor = (state: DemoState, merchantId: string): StaffRequest[] =>
  state.requests.filter(x => x.merchantId === merchantId);
export const newRequestCount = (state: DemoState): number => state.requests.filter(x => x.status === "new").length;
