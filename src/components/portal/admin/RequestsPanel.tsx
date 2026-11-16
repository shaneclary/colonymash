"use client";

import { useState } from "react";
import { requestKindLabels, type StaffRequest, type StaffRequestKind, type StaffRequestStatus } from "@/content/portal-demo";
import { decideRequest, nextRequestStatuses, setRequestReply } from "@/lib/staff-requests";
import { Confirm } from "@/components/Confirm";
import { dayDate, productName, shortDate, type PanelProps } from "../format";

type KindFilter = "all" | StaffRequestKind;
const verbs: Record<StaffRequestStatus, string> = { approved: "Approve", declined: "Decline", done: "Mark done", new: "Reopen" };
const statusLabel: Record<StaffRequestStatus, string> = { new: "New", approved: "Approved", declined: "Declined", done: "Done" };

/** Inbox for private event requests and for sample or staff-demo requests from wholesale accounts. */
export function RequestsPanel({ state, commit, onOpenAccount }: PanelProps & { onOpenAccount: (id: string) => void }) {
  const [kind, setKind] = useState<KindFilter>("all");
  const [showClosed, setShowClosed] = useState(false);
  const isClosed = (x: StaffRequest) => x.status === "declined" || x.status === "done";
  const shown = state.requests.filter(x => (kind === "all" || x.kind === kind) && (showClosed || !isClosed(x)))
    .sort((a, b) => Number(isClosed(a)) - Number(isClosed(b)) || a.date.localeCompare(b.date));
  const count = (key: KindFilter) => state.requests.filter(x => !isClosed(x) && (key === "all" || x.kind === key)).length;

  return <section className="cm-portal__panel" data-tour="requests">
    <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">Requests</p><h2>Events, samples and demos to review</h2></div>
      <span>{state.requests.filter(x => x.status === "new").length} new</span></div>
    <p className="cm-portal__muted">Private event requests, and sample or staff-demo requests from wholesale accounts. Approved ones go on the calendar. Samples to licensed accounts have state limits and must be recorded. This list is that record. <Confirm id="samples"/></p>
    <div role="group" aria-label="Filter requests" className="cm-portal__catalog-filter-buttons">
      {([["all", "All"], ["private_event", "Private events"], ["sample", "Samples"], ["demo", "Staff demos"]] as const).map(([key, label]) =>
        <button type="button" key={key} aria-pressed={kind === key} onClick={() => setKind(key)}>{label} ({count(key)})</button>)}
      <button type="button" aria-pressed={showClosed} onClick={() => setShowClosed(!showClosed)}>Show closed</button>
    </div>
    {shown.length === 0 && <p className="cm-portal__muted">Nothing waiting.</p>}
    <div className="cm-portal__orderlist">{shown.map(request => <article className="cm-portal__order" key={request.id}>
      <div className="cm-portal__order-top"><div>
        <span className="cm-portal__overline">{requestKindLabels[request.kind]} · for {dayDate(request.date)} · asked {shortDate(request.createdAt)}</span>
        <h3>{request.merchantId && state.accounts.some(x => x.id === request.merchantId)
          ? <button type="button" className="cm-portal__linkbutton" onClick={() => onOpenAccount(request.merchantId!)}>{request.from}</button> : request.from}</h3></div>
        <span className={"cm-portal__status cm-portal__status--" + (request.status === "new" ? "requested" : request.status === "approved" ? "accepted" : "cancelled")}>{statusLabel[request.status]}</span></div>
      <dl className="cm-portal__details">
        {request.guests ? <><dt>Guests</dt><dd>{request.guests}</dd></> : null}
        {request.productIds.length > 0 && <><dt>Drinks</dt><dd>{request.productIds.map(productName).join(", ")}</dd></>}
        {request.contact && <><dt>Contact</dt><dd>{request.contact}</dd></>}
        {request.notes && <><dt>Notes</dt><dd>{request.notes}</dd></>}
      </dl>
      <label className="cm-portal__stack">Reply the requester sees
        <input type="text" maxLength={300} value={request.reply} placeholder="Date works. We will bring a case."
          onChange={e => commit("Edited the reply to " + request.from, s => setRequestReply(s, request.id, e.target.value))}/></label>
      <div className="cm-portal__order-actions">{nextRequestStatuses(request.status).map(next =>
        <button type="button" key={next} className={"cm-portal__button" + (next === "approved" || next === "done" ? " cm-portal__button--dark" : "")}
          onClick={() => commit(verbs[next] + ": " + requestKindLabels[request.kind].toLowerCase() + " for " + request.from, s => decideRequest(s, request.id, next))}>{verbs[next]}</button>)}
      </div>
    </article>)}</div>
  </section>;
}
