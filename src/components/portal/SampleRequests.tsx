"use client";

import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { demoProducts, plusDays, requestKindLabels, type DemoState } from "@/content/portal-demo";
import { requestsFor, submitRequest } from "@/lib/staff-requests";
import { dayDate, newId, productName } from "./format";

const statusText = { new: "Waiting on the brewery", approved: "Approved", declined: "Declined", done: "Done" } as const;

/** Merchant side: ask the brewery for samples or a staff demo, and see the answer. */
export function SampleRequests({ state, setState, merchantId, company, contact, today, onFeedback }: {
  state: DemoState; setState: Dispatch<SetStateAction<DemoState>>; merchantId: string; company: string; contact: string; today: string;
  onFeedback: (message: string) => void;
}) {
  const [kind, setKind] = useState<"sample" | "demo">("sample");
  const [picked, setPicked] = useState<string[]>([]);
  const [next, setNext] = useState(demoProducts[0]?.id ?? "");
  const [date, setDate] = useState(() => plusDays(10));
  const [notes, setNotes] = useState("");
  const mine = requestsFor(state, merchantId);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = submitRequest(state, { kind, from: company, merchantId, contact, date, productIds: picked, notes }, today, newId("RQ"));
    if (result.error) { onFeedback(result.error); return; }
    setState(result.state); setPicked([]); setNotes("");
    onFeedback("Request sent. The brewery will answer here.");
  }
  return <div className="cm-portal__two" data-tour="samples">
    <section className="cm-portal__panel">
      <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">Samples and demos</p><h2>Ask the brewery</h2></div></div>
      <form className="cm-portal__form" onSubmit={submit}>
        <label htmlFor="sample-kind">What do you need?
          <select id="sample-kind" value={kind} onChange={e => setKind(e.target.value as "sample" | "demo")}>
            <option value="sample">Samples to taste</option><option value="demo">A demo for my staff</option></select></label>
        <div className="cm-portal__inline-form">
          <label>Drink<select value={next} onChange={e => setNext(e.target.value)}>
            {demoProducts.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <button type="button" className="cm-portal__button" onClick={() => setPicked(current => current.includes(next) ? current : [...current, next].slice(0, 12))}>Add drink</button>
        </div>
        {picked.length === 0 ? <p className="cm-portal__muted">No drinks chosen yet.</p> :
          <ul className="cm-portal__bill">{picked.map(id => <li key={id}><span>{productName(id)}</span>
            <button type="button" className="cm-portal__linkbutton" onClick={() => setPicked(current => current.filter(x => x !== id))}>Remove</button></li>)}</ul>}
        <label htmlFor="sample-date">Date you would like<input id="sample-date" type="date" min={today} required value={date} onChange={e => setDate(e.target.value)}/></label>
        <label htmlFor="sample-notes">Notes<textarea id="sample-notes" rows={3} maxLength={500} value={notes} onChange={e => setNotes(e.target.value)} placeholder="New menu, staff of eight, best time to come by…"/></label>
        <button type="submit" disabled={picked.length === 0} className="cm-portal__button cm-portal__button--dark">Send request ↗</button>
      </form>
    </section>
    <section className="cm-portal__panel">
      <div className="cm-portal__panel-head"><h2>Your requests</h2><span>{mine.length}</span></div>
      {mine.length === 0 && <p className="cm-portal__muted">Nothing asked yet.</p>}
      <ul className="cm-portal__agenda">{mine.map(request => <li className="cm-portal__agenda-item" key={request.id}>
        <p className="cm-portal__overline">{requestKindLabels[request.kind]} · {dayDate(request.date)} · {statusText[request.status]}</p>
        <strong>{request.productIds.map(productName).join(", ")}</strong>
        {request.notes && <span>{request.notes}</span>}
        {request.reply && <span><b>Brewery:</b> {request.reply}</span>}
      </li>)}</ul>
    </section>
  </div>;
}
