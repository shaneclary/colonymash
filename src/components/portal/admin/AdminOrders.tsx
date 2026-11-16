"use client";

import { useState } from "react";
import { demoProducts, fulfillWindows, packLabels, type FulfillMethod, type OrderSlot, type PackFormat, type TradeLine, type TradeOrder, type TradeOrderStatus } from "@/content/portal-demo";
import { staffCreateOrder } from "@/lib/cloud-ledger";
import { nextOrderStatus, transitionOrder } from "@/lib/portal-forecast";
import { previousStatus, runDates, runSheet, scheduleOrder, stepBackOrder } from "@/lib/order-schedule";
import { trackOrder } from "@/lib/order-tracking";
import { calendarEntries } from "@/lib/staff-calendar";
import { OrderTracker } from "../OrderTracker";
import { CalendarLinks } from "./AdminCalendar";
import { dayDate, lineText, newId, productName, type PanelProps } from "../format";

type Filter = "open" | "closed" | "all";
const isOpen = (order: TradeOrder) => ["requested", "accepted", "scheduled"].includes(order.status);
const verb: Partial<Record<TradeOrderStatus, string>> = { accepted: "Accept", fulfilled: "Mark filled", cancelled: "Cancel order" };
export const slotText = (slot: OrderSlot) =>
  dayDate(slot.date) + " · " + (slot.method === "pickup" ? "Pickup" : "Delivery") + (slot.window ? " · " + slot.window : "");

export function AdminOrders({ state, commit, run, today, onOpenAccount }: PanelProps & { onOpenAccount: (id: string) => void }) {
  const [filter, setFilter] = useState<Filter>("open");
  const [drafts, setDrafts] = useState<Record<string, OrderSlot>>({});
  const days = runDates(state, today);
  const [runDay, setRunDay] = useState("");
  const sheetDay = days.includes(runDay) ? runDay : days[0] ?? "";
  const stops = sheetDay ? runSheet(state, sheetDay) : [];
  const [adding, setAdding] = useState(false);
  const [newAccount, setNewAccount] = useState("");
  const [newLines, setNewLines] = useState<TradeLine[]>([]);
  const [pick, setPick] = useState<TradeLine>({ productId: demoProducts[0]?.id ?? "", format: "keg", quantity: 1 });
  const [newDate, setNewDate] = useState(today);
  const [newNotes, setNewNotes] = useState("");
  const accountChoice = state.accounts.some(x => x.id === newAccount) ? newAccount : state.accounts[0]?.id ?? "";
  const orders = [...state.orders].filter(x => filter === "all" || (filter === "open") === isOpen(x))
    .sort((a, b) => (a.slot?.date ?? a.neededBy).localeCompare(b.slot?.date ?? b.neededBy));
  const entries = calendarEntries(state, today);
  const draftFor = (order: TradeOrder): OrderSlot => drafts[order.id] ?? order.slot ??
    { date: order.neededBy >= today ? order.neededBy : today, method: "delivery", window: fulfillWindows[0] };
  const setDraft = (order: TradeOrder, patch: Partial<OrderSlot>) =>
    setDrafts(current => ({ ...current, [order.id]: { ...draftFor(order), ...patch } }));

  return <>
  <section className="cm-portal__panel" data-tour="orders">
    <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">Orders</p><h2>Accept, schedule and fill</h2></div>
      <span>{state.orders.filter(isOpen).length} open · {state.orders.length} total</span></div>
    <p className="cm-portal__muted">Accept a request, then give it a day, a hand-off and a time window. Every change can be undone from the bar at the top, or stepped back on the order itself.</p>
    <div role="group" aria-label="Filter orders" className="cm-portal__catalog-filter-buttons">
      {([["open", "Open"], ["closed", "Closed"], ["all", "All"]] as const).map(([key, label]) =>
        <button type="button" key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}
      <button type="button" aria-pressed={adding} onClick={() => setAdding(!adding)}>+ Add an order</button>
    </div>
    {adding && <form className="cm-portal__form cm-portal__subform" onSubmit={event => {
      event.preventDefault();
      if (run("Added an order for " + (state.accounts.find(x => x.id === accountChoice)?.name ?? "an account"),
        s => staffCreateOrder(s, accountChoice, newLines, newDate, newNotes, today, newId("ORD")))) { setNewLines([]); setNewNotes(""); setAdding(false); }
    }}>
      <strong>An order taken by phone, text or in person</strong>
      {state.accounts.length === 0 ? <p className="cm-portal__muted">Add the account under Accounts first.</p> : <>
        <label>Account<select value={accountChoice} onChange={e => setNewAccount(e.target.value)}>
          {state.accounts.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <div className="cm-portal__inline-form">
          <label>Drink<select value={pick.productId} onChange={e => setPick({ ...pick, productId: e.target.value })}>
            {demoProducts.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label>Package<select value={pick.format} onChange={e => setPick({ ...pick, format: e.target.value as PackFormat })}>
            {(Object.keys(packLabels) as PackFormat[]).map(x => <option key={x} value={x}>{packLabels[x]}</option>)}</select></label>
          <label>How many<input type="number" inputMode="numeric" min={1} max={999} step={1} value={pick.quantity}
            onChange={e => { const n = Number(e.target.value); if (Number.isSafeInteger(n) && n >= 1 && n <= 999) setPick({ ...pick, quantity: n }); }}/></label>
          <button type="button" className="cm-portal__button" onClick={() => setNewLines(current => [...current, pick])}>Add line</button>
        </div>
        {newLines.length === 0 ? <p className="cm-portal__muted">No lines yet.</p> :
          <ul className="cm-portal__bill">{newLines.map((line, index) => <li key={index}>
            <span>{line.quantity} {packLabels[line.format].toLowerCase()} · {productName(line.productId)}</span>
            <button type="button" className="cm-portal__linkbutton" onClick={() => setNewLines(current => current.filter((_, i) => i !== index))}>Remove</button></li>)}</ul>}
        <div className="cm-portal__pair">
          <label>Wanted by<input type="date" min={today} required value={newDate} onChange={e => setNewDate(e.target.value)}/></label>
          <label>Note<input type="text" maxLength={500} value={newNotes} onChange={e => setNewNotes(e.target.value)}/></label>
        </div>
        <button type="submit" disabled={newLines.length === 0} className="cm-portal__button cm-portal__button--dark">Save order</button>
        <p className="cm-portal__muted">It is saved as Accepted. Schedule it below.</p>
      </>}
    </form>}
    {orders.length === 0 && <p className="cm-portal__muted">No orders here.</p>}
    <div className="cm-portal__orderlist">{orders.map(order => {
      const back = previousStatus(state, order);
      const draft = draftFor(order);
      const entry = entries.find(x => x.id === "order-" + order.id);
      const canSchedule = order.status === "accepted" || order.status === "scheduled";
      return <article key={order.id} className="cm-portal__order">
        <div className="cm-portal__order-top"><div><span className="cm-portal__overline">{order.id} · wanted {dayDate(order.neededBy)}</span>
          <h3><button type="button" className="cm-portal__linkbutton" onClick={() => onOpenAccount(order.merchantId)}>{order.merchantName}</button></h3></div>
          <span className={"cm-portal__status cm-portal__status--" + order.status}>{order.status}</span></div>
        <OrderTracker tracking={trackOrder(state, order, today)}/>
        <p>{lineText(order.lines)}</p>
        {order.notes && <p className="cm-portal__muted">{order.notes}</p>}
        {order.slot && <p className="cm-portal__slot"><strong>Scheduled:</strong> {slotText(order.slot)}{entry && order.status === "scheduled" ? <CalendarLinks entry={entry}/> : null}</p>}
        {canSchedule && <form className="cm-portal__inline-form" onSubmit={event => {
          event.preventDefault();
          if (run((order.status === "scheduled" ? "Changed the slot for " : "Scheduled ") + order.id, s => scheduleOrder(s, order.id, draft, today)))
            setDrafts(current => { const { [order.id]: _done, ...rest } = current; return rest; });
        }}>
          <label>Day<input type="date" min={today} required value={draft.date} onChange={e => setDraft(order, { date: e.target.value })}/></label>
          <label>Hand-off<select value={draft.method} onChange={e => setDraft(order, { method: e.target.value as FulfillMethod })}>
            <option value="delivery">Delivery</option><option value="pickup">Pickup at the brewery</option></select></label>
          <label>Window<select value={draft.window} onChange={e => setDraft(order, { window: e.target.value })}>
            {fulfillWindows.map(x => <option key={x} value={x}>{x}</option>)}</select></label>
          <button type="submit" className="cm-portal__button cm-portal__button--dark">{order.status === "scheduled" ? "Save new slot" : "Schedule"}</button>
        </form>}
        <div className="cm-portal__order-actions">
          {(["accepted", "fulfilled", "cancelled"] as const).filter(next => nextOrderStatus(order.status, next)).map(next =>
            <button type="button" key={next} className={"cm-portal__button" + (next === "cancelled" ? "" : " cm-portal__button--dark")}
              onClick={() => commit((verb[next] ?? next) + ": " + order.id, s => transitionOrder(s, order.id, next, today))}>{verb[next]}</button>)}
          {back && <button type="button" className="cm-portal__button"
            onClick={() => commit("Moved " + order.id + " back to " + back, s => stepBackOrder(s, order.id))}>↩ Back to {back}</button>}
          {!back && !isOpen(order) && <span className="cm-portal__muted">Closed. The buyer has received it.</span>}
        </div>
      </article>;
    })}</div>
  </section>
  <section className="cm-portal__panel cm-portal__print" data-tour="run-sheet">
    <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">Run sheet</p>
      <h2>{sheetDay ? dayDate(sheetDay) : "Nothing scheduled"}</h2></div>
      <span>{stops.length} {stops.length === 1 ? "stop" : "stops"}</span></div>
    {days.length === 0 ? <p className="cm-portal__muted">Schedule an order and its stop shows here.</p> : <>
      <div className="cm-portal__inline-form cm-portal__no-print">
        <label>Day<select value={sheetDay} onChange={e => setRunDay(e.target.value)}>
          {days.map(day => <option key={day} value={day}>{dayDate(day)}</option>)}</select></label>
        <button type="button" className="cm-portal__button cm-portal__button--dark" onClick={() => window.print()}>Print the sheet</button>
      </div>
      <ol className="cm-portal__run">{stops.map(({ order, slot, account }) => <li key={order.id}>
        <p className="cm-portal__overline">{slot.window || "Any time"} · {slot.method === "pickup" ? "Pickup at the brewery" : "Delivery"} · {order.id}</p>
        <strong>{order.merchantName}</strong>
        <span>{lineText(order.lines)}</span>
        {slot.method === "delivery" && account?.address && <span>{account.address}
          <a className="cm-portal__no-print" target="_blank" rel="noreferrer" href={"https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(account.address)}> Map ↗</a></span>}
        {account?.receiving && <span>Receiving: {account.receiving}</span>}
        {account?.deliveryNotes && <span>{account.deliveryNotes}</span>}
        {account?.phone && <span>{account.contactName ? account.contactName + ", " : ""}<a href={"tel:" + account.phone.replace(/[^\d+]/g, "")}>{account.phone}</a></span>}
        {order.notes && <span>Order note: {order.notes}</span>}
      </li>)}</ol>
    </>}
  </section>
  </>;
}
