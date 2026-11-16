import {
  demoPackVolumes, type Account, type AccountNote, type AccountNoteKind, type AccountStatus,
  type DemoState, type StaffRequest, type TradeOrder,
} from "../content/portal-demo.ts";

export type AccountResult = { state: DemoState; error?: string };
const validDay = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value + "T12:00:00Z").toISOString().slice(0, 10) === value;
const daysBetween = (from: string, to: string) =>
  Math.round((new Date(to + "T12:00:00Z").getTime() - new Date(from + "T12:00:00Z").getTime()) / 86400000);

export type AccountInsights = {
  /** Newest first. */
  orders: TradeOrder[];
  openOrders: number;
  filledOrders: number;
  lastOrderDate: string;
  daysSinceLast: number | null;
  /** Average days between orders, once there are two. */
  usualGapDays: number | null;
  /** An active account that has gone quiet for longer than its own rhythm. */
  reorderDue: boolean;
  filledLiters: number;
  topProducts: { productId: string; liters: number }[];
  /** Kegs filled for the account and not logged back. */
  kegsOut: number;
  followUpDue: boolean;
  requests: StaffRequest[];
  notes: AccountNote[];
};

/** What staff want to know about one account before they pick up the phone. */
export function accountInsights(state: DemoState, accountId: string, today: string): AccountInsights {
  const account = state.accounts.find(x => x.id === accountId);
  const orders = state.orders.filter(x => x.merchantId === accountId).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
  const live = orders.filter(x => x.status !== "cancelled");
  const filled = orders.filter(x => x.status === "fulfilled");
  const dates = [...new Set(live.map(x => x.createdAt))].sort();
  const lastOrderDate = dates.at(-1) ?? "";
  const daysSinceLast = lastOrderDate ? Math.max(0, daysBetween(lastOrderDate, today)) : null;
  const usualGapDays = dates.length >= 2 ? Math.round(daysBetween(dates[0], dates.at(-1)!) / (dates.length - 1)) : null;
  const quietLimit = usualGapDays ? Math.max(7, Math.round(usualGapDays * 1.5)) : 30;
  const liters = new Map<string, number>();
  for (const line of filled.flatMap(x => x.lines))
    liters.set(line.productId, (liters.get(line.productId) ?? 0) + line.quantity * demoPackVolumes[line.format]);
  const kegsFilled = filled.flatMap(x => x.lines).filter(x => x.format === "keg").reduce((sum, x) => sum + x.quantity, 0);
  return {
    orders, openOrders: orders.filter(x => ["requested", "accepted", "scheduled"].includes(x.status)).length,
    filledOrders: filled.length, lastOrderDate, daysSinceLast, usualGapDays,
    reorderDue: account?.status === "active" && daysSinceLast !== null && daysSinceLast > quietLimit,
    filledLiters: [...liters.values()].reduce((sum, x) => sum + x, 0),
    topProducts: [...liters].map(([productId, value]) => ({ productId, liters: value })).sort((a, b) => b.liters - a.liters).slice(0, 3),
    kegsOut: Math.max(0, kegsFilled - (account?.kegsReturned ?? 0)),
    followUpDue: Boolean(account?.followUpOn) && account!.followUpOn <= today,
    requests: state.requests.filter(x => x.merchantId === accountId),
    notes: state.accountNotes.filter(x => x.merchantId === accountId).sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id)),
  };
}

const textFields = ["name", "type", "address", "contactName", "contactRole", "phone", "email", "licenseType", "licenseNumber", "receiving", "deliveryNotes", "terms"] as const;
export type AccountText = (typeof textFields)[number];
const statuses: AccountStatus[] = ["prospect", "active", "paused"];

/** Change one field on an account. */
export function editAccount(state: DemoState, id: string, field: AccountText | "status" | "tags", value: string): DemoState {
  const account = state.accounts.find(x => x.id === id);
  if (!account) return state;
  let next: Account;
  if (field === "status") { if (!statuses.includes(value as AccountStatus)) return state; next = { ...account, status: value as AccountStatus }; }
  else if (field === "tags") next = { ...account, tags: [...new Set(value.split(",").map(x => x.trim().toLowerCase().slice(0, 24)).filter(Boolean))].slice(0, 8) };
  else if (!textFields.includes(field)) return state;
  else if (field === "name" && value.trim().length < 2) return state;
  else next = { ...account, [field]: value.slice(0, 200) };
  return { ...state, accounts: state.accounts.map(x => x.id === id ? next : x) };
}

/** Start a new account as a prospect. */
export function addAccount(state: DemoState, name: string, today: string, id: string): AccountResult {
  const clean = name.trim().replace(/\s+/g, " ").slice(0, 80);
  if (clean.length < 2) return { state, error: "Enter the business name." };
  if (state.accounts.some(x => x.name.toLowerCase() === clean.toLowerCase())) return { state, error: "That account already exists." };
  if (!validDay(today) || !id || state.accounts.some(x => x.id === id) || state.accounts.length >= 500) return { state, error: "This account cannot be added." };
  const account: Account = { id, name: clean, status: "prospect", type: "", address: "", contactName: "", contactRole: "", phone: "", email: "",
    licenseType: "", licenseNumber: "", receiving: "", deliveryNotes: "", terms: "", tags: [], followUpOn: "", kegsReturned: 0, since: today };
  return { state: { ...state, accounts: [...state.accounts, account] } };
}

/** Log a note, call, visit or email against an account. */
export function addAccountNote(state: DemoState, accountId: string, kind: AccountNoteKind, text: string, today: string, id: string): AccountResult {
  const clean = text.trim().slice(0, 600);
  if (!state.accounts.some(x => x.id === accountId)) return { state, error: "That account is gone." };
  if (!clean) return { state, error: "Write the note first." };
  if (!["note", "call", "visit", "email"].includes(kind) || !validDay(today) || !id || state.accountNotes.some(x => x.id === id))
    return { state, error: "This note cannot be added." };
  return { state: { ...state, accountNotes: [{ id, merchantId: accountId, at: today, kind, text: clean }, ...state.accountNotes].slice(0, 2000) } };
}
export function removeAccountNote(state: DemoState, id: string): DemoState {
  return state.accountNotes.some(x => x.id === id) ? { ...state, accountNotes: state.accountNotes.filter(x => x.id !== id) } : state;
}

/** Set the next follow-up date. An empty date clears it. */
export function setFollowUp(state: DemoState, id: string, date: string): DemoState {
  if (!state.accounts.some(x => x.id === id) || (date !== "" && !validDay(date))) return state;
  return { ...state, accounts: state.accounts.map(x => x.id === id ? { ...x, followUpOn: date } : x) };
}

/** Log empty kegs coming back. Cannot return more than are out. */
export function logKegReturn(state: DemoState, id: string, quantity: number, today: string): DemoState {
  if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > accountInsights(state, id, today).kegsOut) return state;
  return { ...state, accounts: state.accounts.map(x => x.id === id ? { ...x, kegsReturned: x.kegsReturned + quantity } : x) };
}

/** Accounts in the order staff should look at them: follow-ups due, then quiet accounts, then by name. */
export function accountsByAttention(state: DemoState, today: string): { account: Account; insights: AccountInsights }[] {
  const rank = (x: AccountInsights) => x.followUpDue ? 0 : x.reorderDue ? 1 : 2;
  return state.accounts.map(account => ({ account, insights: accountInsights(state, account.id, today) }))
    .sort((a, b) => rank(a.insights) - rank(b.insights) || a.account.name.localeCompare(b.account.name));
}
