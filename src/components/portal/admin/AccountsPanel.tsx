"use client";

import { useState, type FormEvent } from "react";
import { noteKindLabels, packLabels, requestKindLabels, type Account, type AccountNoteKind, type AccountStatus } from "@/content/portal-demo";
import {
  accountInsights, accountsByAttention, addAccount, addAccountNote, editAccount, logKegReturn, removeAccountNote, setFollowUp, type AccountText,
} from "@/lib/accounts";
import { merchantStockForecast } from "@/lib/merchant-operations";
import { dayDate, lineText, liters, newId, productName, shortDate, type PanelProps } from "../format";
import { slotText } from "./AdminOrders";

const statusLabel: Record<AccountStatus, string> = { prospect: "Prospect", active: "Active", paused: "Paused" };
const fields: { key: AccountText; label: string; wide?: boolean }[] = [
  { key: "contactName", label: "Contact" }, { key: "contactRole", label: "Role" },
  { key: "phone", label: "Phone" }, { key: "email", label: "Email" },
  { key: "address", label: "Address", wide: true }, { key: "type", label: "Kind of account" },
  { key: "terms", label: "Payment terms" }, { key: "licenseType", label: "License type" }, { key: "licenseNumber", label: "License number" },
  { key: "receiving", label: "Receiving hours" }, { key: "deliveryNotes", label: "Delivery notes", wide: true },
];

/** Wholesale accounts: a list sorted by who needs attention, and a full page per account. */
export function AccountsPanel(props: PanelProps & { openId: string | null; onOpen: (id: string | null) => void }) {
  const { state, run, today, openId, onOpen } = props;
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const account = state.accounts.find(x => x.id === openId);
  if (account) return <AccountPage {...props} account={account}/>;
  const rows = accountsByAttention(state, today).filter(x =>
    !search.trim() || [x.account.name, x.account.contactName, x.account.address, ...x.account.tags].join(" ").toLowerCase().includes(search.trim().toLowerCase()));
  return <section className="cm-portal__panel">
    <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">Accounts</p><h2>Wholesale accounts</h2></div><span>{state.accounts.length} accounts</span></div>
    <div className="cm-portal__catalog-filter">
      <label htmlFor="account-search">Find an account<input id="account-search" type="search" value={search} placeholder="Name, contact, town or tag" onChange={e => setSearch(e.target.value)}/></label>
    </div>
    <ul className="cm-portal__accounts">{rows.map(({ account: row, insights }) => <li key={row.id}>
      <button type="button" onClick={() => onOpen(row.id)}>
        <span className="cm-portal__overline">{statusLabel[row.status]}{row.type ? " · " + row.type : ""}</span>
        <strong>{row.name}</strong>
        <span>{insights.lastOrderDate ? "Last order " + shortDate(insights.lastOrderDate) : "No orders yet"} · {insights.openOrders} open</span>
        <span className="cm-portal__flags">
          {insights.followUpDue && <b>Follow-up due</b>}{insights.reorderDue && <b>Gone quiet</b>}
          {insights.requests.some(x => x.status === "new") && <b>New request</b>}{insights.kegsOut > 0 && <i>{insights.kegsOut} kegs out</i>}
        </span>
      </button>
    </li>)}</ul>
    {rows.length === 0 && <p className="cm-portal__muted">No account matches.</p>}
    <form className="cm-portal__inline-form" onSubmit={(event: FormEvent<HTMLFormElement>) => {
      event.preventDefault(); const id = newId("ACC");
      if (run("Added account: " + name.trim(), s => addAccount(s, name, today, id))) { setName(""); onOpen(id); }
    }}>
      <label>New account or prospect<input type="text" required maxLength={80} value={name} placeholder="Business name" onChange={e => setName(e.target.value)}/></label>
      <button type="submit" className="cm-portal__button cm-portal__button--dark">Add account</button>
    </form>
    <p className="cm-portal__muted">Accounts with a follow-up due come first, then accounts that have gone quiet. Every account and contact here is invented.</p>
  </section>;
}

function AccountPage({ state, commit, run, today, onOpen, account }: PanelProps & { onOpen: (id: string | null) => void; account: Account }) {
  const [kind, setKind] = useState<AccountNoteKind>("note");
  const [text, setText] = useState("");
  const [kegs, setKegs] = useState("1");
  const insights = accountInsights(state, account.id, today);
  const stock = merchantStockForecast(state, account.id, today).filter(x => x.stock.targetStock > 0 || x.stock.onHand > 0);
  const series = state.merchantSeries.filter(x => x.merchantId === account.id);
  const edit = (field: AccountText | "status" | "tags", value: string) => commit("Edited " + account.name, s => editAccount(s, account.id, field, value));
  return <>
    <section className="cm-portal__panel">
      <button type="button" className="cm-portal__button cm-portal__back" onClick={() => onOpen(null)}>← All accounts</button>
      <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">Account since {shortDate(account.since)}</p><h2>{account.name}</h2></div>
        <label className="cm-portal__stack">Status<select value={account.status} onChange={e => edit("status", e.target.value)}>
          {(Object.keys(statusLabel) as AccountStatus[]).map(x => <option key={x} value={x}>{statusLabel[x]}</option>)}</select></label></div>
      <div className="cm-portal__order-actions">
        {account.phone && <a className="cm-portal__button" href={"tel:" + account.phone.replace(/[^\d+]/g, "")}>Call</a>}
        {account.email && <a className="cm-portal__button" href={"mailto:" + account.email}>Email</a>}
        {account.address && <a className="cm-portal__button" target="_blank" rel="noreferrer" href={"https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(account.address)}>Map ↗</a>}
      </div>
      <div className="cm-portal__metrics cm-portal__metrics--small" aria-label="Account summary">
        <div><span>Open orders</span><strong>{insights.openOrders}</strong><small>{insights.filledOrders} filled so far</small></div>
        <div><span>Last order</span><strong>{insights.daysSinceLast === null ? "—" : insights.daysSinceLast + "d"}</strong>
          <small>{insights.usualGapDays ? "Usually every " + insights.usualGapDays + " days" : "No rhythm yet"}{insights.reorderDue ? " · gone quiet" : ""}</small></div>
        <div><span>Filled volume</span><strong>{liters(insights.filledLiters)}</strong>
          <small>{insights.topProducts.length ? "Most: " + insights.topProducts.map(x => productName(x.productId)).join(", ") : "Nothing filled yet"}</small></div>
        <div><span>Kegs out</span><strong>{insights.kegsOut}</strong><small>{account.kegsReturned} returned</small></div>
      </div>
    </section>
    <div className="cm-portal__two">
      <section className="cm-portal__panel">
        <div className="cm-portal__panel-head"><h2>Notes and contact log</h2><span>{insights.notes.length}</span></div>
        <form className="cm-portal__form" onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          if (run("Added a " + noteKindLabels[kind].toLowerCase() + " on " + account.name, s => addAccountNote(s, account.id, kind, text, today, newId("N")))) setText("");
        }}>
          <label htmlFor="note-kind">Kind<select id="note-kind" value={kind} onChange={e => setKind(e.target.value as AccountNoteKind)}>
            {(Object.keys(noteKindLabels) as AccountNoteKind[]).map(x => <option key={x} value={x}>{noteKindLabels[x]}</option>)}</select></label>
          <label htmlFor="note-text">What happened<textarea id="note-text" rows={3} required maxLength={600} value={text} onChange={e => setText(e.target.value)}/></label>
          <button type="submit" className="cm-portal__button cm-portal__button--dark">Add note</button>
        </form>
        <ul className="cm-portal__agenda">{insights.notes.map(note => <li className="cm-portal__agenda-item" key={note.id}>
          <p className="cm-portal__overline">{noteKindLabels[note.kind]} · {dayDate(note.at)}</p><span>{note.text}</span>
          <button type="button" className="cm-portal__linkbutton" onClick={() => commit("Removed a note on " + account.name, s => removeAccountNote(s, note.id))}>Remove</button>
        </li>)}</ul>
        <div className="cm-portal__inline-form">
          <label>Next follow-up<input type="date" value={account.followUpOn} onChange={e => commit("Set a follow-up for " + account.name, s => setFollowUp(s, account.id, e.target.value))}/></label>
          <button type="button" className="cm-portal__button" disabled={!account.followUpOn} onClick={() => commit("Cleared the follow-up for " + account.name, s => setFollowUp(s, account.id, ""))}>Done, clear it</button>
        </div>
        {insights.followUpDue && <p className="cm-portal__feedback">Follow-up was due {dayDate(account.followUpOn)}.</p>}
      </section>
      <section className="cm-portal__panel">
        <div className="cm-portal__panel-head"><h2>Details</h2></div>
        <div className="cm-portal__fields">{fields.map(field => <label key={field.key} className={field.wide ? "cm-portal__field--wide" : ""}>{field.label}
          <input type="text" maxLength={200} value={account[field.key]} onChange={e => edit(field.key, e.target.value)}/></label>)}
          <label className="cm-portal__field--wide">Tags, separated by commas
            <input type="text" defaultValue={account.tags.join(", ")} key={account.id + account.tags.join()} onBlur={e => edit("tags", e.target.value)}/></label>
        </div>
      </section>
    </div>
    <section className="cm-portal__panel">
      <div className="cm-portal__panel-head"><h2>Order history</h2><span>{insights.orders.length} orders</span></div>
      {insights.orders.length === 0 && <p className="cm-portal__muted">No orders yet.</p>}
      {insights.orders.map(order => <div className="cm-portal__upcoming" key={order.id}>
        <div><span>{order.id} · placed {shortDate(order.createdAt)} · wanted {shortDate(order.neededBy)}{order.slot ? " · " + slotText(order.slot) : ""}</span>
          <strong>{lineText(order.lines)}</strong></div>
        <span className={"cm-portal__status cm-portal__status--" + order.status}>{order.status}</span></div>)}
    </section>
    <div className="cm-portal__two">
      <section className="cm-portal__panel">
        <div className="cm-portal__panel-head"><h2>Their stock of your drinks</h2><span>Buyer-reported</span></div>
        {stock.length === 0 ? <p className="cm-portal__muted">This account has not entered any counts.</p> :
          <ul className="cm-portal__bill">{stock.map(x => <li key={x.stock.productId + x.stock.format}>
            <span>{productName(x.stock.productId)} · {packLabels[x.stock.format]}{x.status === "low" ? " · low" : ""}</span>
            <strong>{x.stock.onHand} of {x.stock.targetStock}</strong></li>)}</ul>}
        {series.map(plan => <p className="cm-portal__muted" key={plan.id}>{plan.active ? "Repeat order" : "Paused repeat order"} every {plan.cadenceDays} days: {lineText(plan.lines)}.</p>)}
      </section>
      <section className="cm-portal__panel">
        <div className="cm-portal__panel-head"><h2>Kegs and requests</h2></div>
        <form className="cm-portal__inline-form" onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          if (!commit("Logged kegs back from " + account.name, s => logKegReturn(s, account.id, Number(kegs), today))) return;
          setKegs("1");
        }}>
          <label>Empty kegs returned<input type="number" inputMode="numeric" min={1} max={Math.max(1, insights.kegsOut)} step={1} value={kegs} onChange={e => setKegs(e.target.value)}/></label>
          <button type="submit" className="cm-portal__button" disabled={insights.kegsOut === 0}>Log return</button>
        </form>
        <p className="cm-portal__muted">{insights.kegsOut} out now. Kegs count as out once an order is filled.</p>
        {insights.requests.length === 0 ? <p className="cm-portal__muted">No sample or demo requests.</p> :
          <ul className="cm-portal__bill">{insights.requests.map(x => <li key={x.id}>
            <span>{requestKindLabels[x.kind]} for {shortDate(x.date)}: {x.productIds.map(productName).join(", ")}</span><strong>{x.status}</strong></li>)}</ul>}
      </section>
    </div>
  </>;
}
