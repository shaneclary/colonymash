"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { demoSeed, plusDays, type DemoState, type Ingredient } from "@/content/portal-demo";
import { activeOrderStatuses, finishedUnitAvailability, ingredientForecast, updateIngredient } from "@/lib/portal-forecast";
import { calendarEntries } from "@/lib/staff-calendar";
import { accountsByAttention } from "@/lib/accounts";
import { addIngredient } from "@/lib/production";
import { newRequestCount } from "@/lib/staff-requests";
import { PortalFrame } from "./PortalFrame";
import { useDemoLedger } from "./useDemoPortal";
import { amount, dayDate, newId, shortDate, type Run } from "./format";
import { AdminCalendar } from "./admin/AdminCalendar";
import { AdminOrders } from "./admin/AdminOrders";
import { WeekPanel } from "./admin/WeekPanel";
import { RequestsPanel } from "./admin/RequestsPanel";
import { ProductionPanel } from "./admin/ProductionPanel";
import { StockPanel } from "./admin/StockPanel";
import { AccountsPanel } from "./admin/AccountsPanel";

type View = "overview" | "calendar" | "orders" | "requests" | "week" | "production" | "ingredients" | "finished" | "accounts";
const tabs: { id: View; label: string }[] = [
  { id: "overview", label: "Overview" }, { id: "calendar", label: "Calendar" }, { id: "orders", label: "Orders" },
  { id: "requests", label: "Requests" }, { id: "week", label: "Hours & events" }, { id: "production", label: "Production" },
  { id: "ingredients", label: "Ingredients" }, { id: "finished", label: "Packaged stock" }, { id: "accounts", label: "Accounts" },
];

function NumberBox({ value, unit, max = 100000, step = 1, onChange, ariaLabel }: {
  value: number; unit?: string; max?: number; step?: number; onChange: (value: number) => void; ariaLabel: string;
}) {
  return <div className="cm-portal__number">
    <input type="number" inputMode="decimal" value={value} step={step} min={0} max={max} aria-label={ariaLabel}
      onChange={e => { const n = Number(e.target.value); if (e.target.value !== "" && Number.isFinite(n) && n >= 0 && n <= max) onChange(n); }}/>
    {unit && <span>{unit}</span>}
  </div>;
}

export function AdminPortal() {
  const { state, loaded, commit, undo, undoStack } = useDemoLedger();
  const [view, setView] = useState<View>("overview");
  const [message, setMessage] = useState("");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [ingredientName, setIngredientName] = useState("");
  const [ingredientUnit, setIngredientUnit] = useState<Ingredient["unit"]>("kg");
  const today = plusDays(0);

  /** Run a change that can refuse. A refusal shows its reason instead of changing anything. */
  const run: Run = useCallback((label, change) => {
    let error = "";
    const changed = commit(label, current => { const result = change(current); error = result.error ?? ""; return result.error ? current : result.state; });
    setMessage(error);
    return changed && !error;
  }, [commit]);
  const record = useCallback((label: string, change: (current: DemoState) => DemoState) => { setMessage(""); return commit(label, change); }, [commit]);
  const panel = { state, commit: record, run, today };
  const openAccount = (id: string | null) => { setAccountId(id); setView("accounts"); };

  const forecasts = useMemo(() => ingredientForecast(state, today), [state, today]);
  const entries = useMemo(() => calendarEntries(state, today), [state, today]);
  const requested = state.orders.filter(o => o.status === "requested");
  const committed = state.orders.filter(o => activeOrderStatuses.includes(o.status));
  const toSchedule = state.orders.filter(o => o.status === "accepted");
  const warning = forecasts.filter(x => x.suggestedOrder > 0);
  const short = state.finished.flatMap(x => (["can", "six_pack", "keg"] as const).map(format => finishedUnitAvailability(state, x.productId, format))).filter(x => x.unallocated < 0);
  const attention = accountsByAttention(state, today).filter(x => x.insights.followUpDue || x.insights.reorderDue);
  const week = entries.filter(x => x.date >= today && x.date <= plusDays(7));
  const last = undoStack[0];

  const actions = <button type="button" className="cm-portal__button" onClick={() => record("Reset the demo data", () => demoSeed())}>Reset demo data</button>;

  return <PortalFrame role="admin" title="Brewery command center"
    subtitle="Calendar, orders, requests, production, stock and accounts in one place." actions={actions}>
    <nav className="cm-portal__tabs" aria-label="Operations views">
      {tabs.map(tab => <button type="button" key={tab.id} onClick={() => { setView(tab.id); setMessage(""); if (tab.id === "accounts") setAccountId(null); }}
        aria-current={view === tab.id ? "page" : undefined}>{tab.label}</button>)}
    </nav>
    {last && <div className="cm-portal__undo" role="status">
      <span><strong>Done:</strong> {last.label}.</span>
      <button type="button" className="cm-portal__button cm-portal__button--dark" onClick={() => { const label = undo(); setMessage(label ? "Undone: " + label + "." : ""); }}>
        ↩ Undo{undoStack.length > 1 ? " (" + undoStack.length + ")" : ""}</button>
    </div>}
    {message && <div className="cm-portal__feedback" role="alert">{message}</div>}
    {!loaded && <p className="cm-portal__muted">Loading the local sample ledger…</p>}

    {view === "overview" && <>
      <section className="cm-portal__metrics" aria-label="What needs you">
        <button type="button" onClick={() => setView("orders")}><span>Orders to act on</span><strong>{requested.length + toSchedule.length}</strong><small>{requested.length} to review · {toSchedule.length} to schedule</small></button>
        <button type="button" onClick={() => setView("requests")}><span>New requests</span><strong>{newRequestCount(state)}</strong><small>Events, samples, demos</small></button>
        <button type="button" onClick={() => setView("ingredients")}><span>Ingredients to buy</span><strong>{warning.length}</strong><small>{short.length} packaged shortfalls</small></button>
        <button type="button" onClick={() => openAccount(null)}><span>Accounts to call</span><strong>{attention.length}</strong><small>Follow-up due or gone quiet</small></button>
      </section>
      <div className="cm-portal__two">
        <section className="cm-portal__panel">
          <div className="cm-portal__panel-head"><h2>Next 7 days</h2><button type="button" onClick={() => setView("calendar")}>Open calendar ↗</button></div>
          {week.length === 0 && <p className="cm-portal__muted">Nothing dated this week.</p>}
          {week.slice(0, 8).map(entry => <div key={entry.id} className="cm-portal__upcoming">
            <div><span>{dayDate(entry.date)}{entry.tentative ? " · unconfirmed" : ""}</span><strong>{entry.title}</strong></div></div>)}
        </section>
        <section className="cm-portal__panel">
          <div className="cm-portal__panel-head"><h2>Accounts needing a call</h2><button type="button" onClick={() => openAccount(null)}>All accounts ↗</button></div>
          {attention.length === 0 && <p className="cm-portal__muted">No follow-ups due.</p>}
          {attention.slice(0, 6).map(({ account, insights }) => <div key={account.id} className="cm-portal__upcoming">
            <div><span>{insights.followUpDue ? "Follow-up due " + shortDate(account.followUpOn) : "Gone quiet"}</span>
              <strong><button type="button" className="cm-portal__linkbutton" onClick={() => openAccount(account.id)}>{account.name}</button></strong></div></div>)}
          <div className="cm-portal__panel-head"><h2>Committed orders</h2><span>{committed.length}</span></div>
          {committed.slice(0, 5).map(order => <div key={order.id} className="cm-portal__upcoming">
            <div><span>{order.id} · {order.slot ? dayDate(order.slot.date) : "wanted " + dayDate(order.neededBy)}</span><strong>{order.merchantName}</strong></div>
            <span className={"cm-portal__status cm-portal__status--" + order.status}>{order.status}</span></div>)}
        </section>
      </div>
    </>}

    {view === "calendar" && <AdminCalendar {...panel}/>}
    {view === "orders" && <AdminOrders {...panel} onOpenAccount={openAccount}/>}
    {view === "requests" && <RequestsPanel {...panel} onOpenAccount={openAccount}/>}
    {view === "week" && <WeekPanel {...panel}/>}
    {view === "production" && <ProductionPanel {...panel}/>}
    {view === "finished" && <StockPanel {...panel}/>}
    {view === "accounts" && <AccountsPanel {...panel} openId={accountId} onOpen={setAccountId}/>}

    {view === "ingredients" && <section className="cm-portal__panel">
      <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">Ingredients</p><h2>Stock and what to buy</h2></div><span>{forecasts.length} ingredients</span></div>
      <p className="cm-portal__muted">Need comes from the batch schedule, plus any extra batches committed orders call for. A suggested amount is not a purchase order.</p>
      <div className="cm-portal__tablewrap"><table className="cm-portal__table">
        <thead><tr><th>Ingredient</th><th>On hand</th><th>Incoming</th><th>Needed</th><th>Safety</th><th>Reorder point</th><th>Lead</th><th>Suggested / by</th><th>Order</th></tr></thead>
        <tbody>{forecasts.map(entry => {
          const set = (key: "onHand" | "incoming" | "safety" | "reorderPoint" | "leadDays") => (n: number) =>
            record("Edited " + entry.item.name, s => updateIngredient(s, entry.item.id, key, n));
          return <tr key={entry.item.id}>
            <th scope="row"><strong>{entry.item.name}</strong><small>{entry.item.supplier || "No supplier set"} · {entry.item.unit}</small></th>
            <td><NumberBox value={entry.item.onHand} unit={entry.item.unit} step={0.1} ariaLabel={"On hand " + entry.item.name} onChange={set("onHand")}/></td>
            <td><NumberBox value={entry.item.incoming} unit={entry.item.unit} step={0.1} ariaLabel={"Incoming " + entry.item.name} onChange={set("incoming")}/></td>
            <td>{amount(entry.required)} {entry.item.unit}<small>Left after: {amount(entry.projected)}</small></td>
            <td><NumberBox value={entry.item.safety} unit={entry.item.unit} step={0.1} ariaLabel={"Safety stock " + entry.item.name} onChange={set("safety")}/></td>
            <td><NumberBox value={entry.item.reorderPoint} unit={entry.item.unit} step={0.1} ariaLabel={"Reorder point " + entry.item.name} onChange={set("reorderPoint")}/></td>
            <td><NumberBox value={entry.item.leadDays} unit="days" max={365} ariaLabel={"Lead time " + entry.item.name} onChange={set("leadDays")}/></td>
            <td><span className={"cm-portal__forecast cm-portal__forecast--" + entry.status}>{entry.status === "order-now" ? "Order now" : entry.status === "watch" ? "Soon" : "Covered"}</span>
              <strong>{amount(entry.suggestedOrder)} {entry.item.unit}</strong><small>{entry.reorderBy ? "By " + shortDate(entry.reorderBy) : "As needed"}</small></td>
            <td><button type="button" disabled={entry.suggestedOrder <= 0} className="cm-portal__button"
              onClick={() => record("Marked " + entry.item.name + " as ordered", s => updateIngredient(s, entry.item.id, "incoming", Math.min(100000, entry.item.incoming + Math.ceil(entry.suggestedOrder * 100) / 100)))}>Mark ordered</button></td>
          </tr>;
        })}</tbody>
      </table></div>
      <form className="cm-portal__inline-form" onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (run("Added ingredient: " + ingredientName.trim(), s => addIngredient(s, ingredientName, ingredientUnit, newId("ING")))) setIngredientName("");
      }}>
        <label>New ingredient<input type="text" required maxLength={60} value={ingredientName} onChange={e => setIngredientName(e.target.value)}/></label>
        <label>Unit<select value={ingredientUnit} onChange={e => setIngredientUnit(e.target.value as Ingredient["unit"])}>
          <option value="kg">kg</option><option value="L">L</option><option value="ea">each</option></select></label>
        <button type="submit" className="cm-portal__button cm-portal__button--dark">Add ingredient</button>
      </form>
      <p className="cm-portal__muted">Every ingredient, amount and supplier here is an invented sample.</p>
    </section>}

    <div className="cm-portal__demo-note">THIS IS A FICTIONAL PLANNING SANDBOX — NOT A LIVE INVENTORY, PURCHASE ORDER, OR MERCHANT AUTHORIZATION SYSTEM. <Link href="/portal">Sample logins ↗</Link></div>
  </PortalFrame>;
}
