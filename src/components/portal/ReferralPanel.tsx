"use client";

import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import {
  demoProducts, demoTradeStatus, plusDays, referralProgram,
  type DemoState, type PackFormat,
} from "@/content/portal-demo";
import { merchantFormats } from "@/lib/merchant-operations";
import { inviteReferral, packMl, redeemReferralCredit, redeemableUnits, referralSummary } from "@/lib/referrals";
import { Confirm } from "@/components/Confirm";

export const liters = (ml: number) => (ml / 1000).toFixed(1) + " L";

/** Merchant side of the proposed referral bonus: refer an account, watch credit build, take it in product. */
export function ReferralPanel({ state, setState, merchantId, company, today, onFeedback, onTrack }: {
  state: DemoState; setState: Dispatch<SetStateAction<DemoState>>;
  merchantId: string; company: string; today: string;
  onFeedback: (message: string) => void; onTrack: () => void;
}) {
  const [name, setName] = useState("");
  const [productId, setProductId] = useState("cherry-limeade");
  const [format, setFormat] = useState<PackFormat>("six_pack");
  const [quantity, setQuantity] = useState(1);
  const [date, setDate] = useState(() => plusDays(14));
  const summary = referralSummary(state, merchantId);
  const cost = quantity * packMl(format);
  const offered = (id: PackFormat) => demoTradeStatus(productId, id) !== "unavailable";
  const canRedeem = offered(format) && quantity >= 1 && cost <= summary.balanceMl;
  const covers = merchantFormats.filter(x => redeemableUnits(summary.balanceMl, x.id) > 0)
    .map(x => redeemableUnits(summary.balanceMl, x.id) + " " + x.label.toLowerCase());

  function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = inviteReferral(state, merchantId, name, today, "DEMO-REF-" + Date.now());
    if (result.error) { onFeedback(result.error); return; }
    setState(result.state); setName("");
    onFeedback("Referral sent. Credit starts once the brewery opens the account and fills an order.");
  }
  function redeem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = redeemReferralCredit(state, merchantId, company,
      { productId, format, quantity }, date, today, "DEMO-B" + String(Date.now()).slice(-7));
    if (result.error) { onFeedback(result.error); return; }
    setState(result.state); setQuantity(1); onTrack();
    onFeedback("Bonus product requested. Staff approve it like any order.");
  }

  return <>
    <section className="cm-portal__metrics" aria-label="Referral credit">
      <div><span>Referral bonus</span><strong>{referralProgram.ratePercent}%</strong><small>Paid in product</small></div>
      <div><span>Earned</span><strong>{liters(summary.earnedMl)}</strong><small>From filled orders</small></div>
      <div><span>Used</span><strong>{liters(summary.redeemedMl)}</strong><small>Bonus product requested</small></div>
      <div><span>Available</span><strong>{liters(summary.balanceMl)}</strong>
        <small>{covers.length ? "Covers " + covers.join(" or ") : "Not enough for a package yet"}</small></div>
    </section>
    <div className="cm-portal__two">
      <section className="cm-portal__panel">
        <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">Referral bonus / proposed</p>
          <h2>Refer a wholesale account</h2></div><Confirm id="referral"/></div>
        <p>{referralProgram.summary}</p>
        <p className="cm-portal__muted">{referralProgram.basis} <strong>{referralProgram.status}</strong></p>
        <form onSubmit={invite} className="cm-portal__form">
          <label htmlFor="referral-name">Business name
            <input id="referral-name" type="text" required maxLength={80} value={name}
              onChange={e => setName(e.target.value)} autoComplete="off"/>
          </label>
          <button type="submit" className="cm-portal__button cm-portal__button--dark">Refer this business ↗</button>
        </form>
        <ul className="cm-portal__referrals">{summary.rows.map(row => <li key={row.referral.id}>
          <div><strong>{row.referral.referredName}</strong>
            <span>{row.referral.status === "active" ? "Active account" : "Invited. Waiting on the brewery."}</span></div>
          <div><b>{liters(row.earnedMl)}</b><span>from {liters(row.filledMl)} filled</span></div>
        </li>)}</ul>
      </section>
      <section className="cm-portal__panel">
        <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">Use your credit</p>
          <h2>Take it in product</h2></div><span>{liters(summary.balanceMl)} available</span></div>
        <form onSubmit={redeem} className="cm-portal__form">
          <label htmlFor="bonus-product">Flavor
            <select id="bonus-product" value={productId} onChange={e => setProductId(e.target.value)}>
              {demoProducts.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
          </label>
          <label htmlFor="bonus-format">Package
            <select id="bonus-format" value={format} onChange={e => setFormat(e.target.value as PackFormat)}>
              {merchantFormats.map(x => <option key={x.id} value={x.id} disabled={!offered(x.id)}>
                {x.label} · {liters(packMl(x.id))} each{offered(x.id) ? "" : " · not offered"}</option>)}
            </select>
          </label>
          <label htmlFor="bonus-quantity">Quantity
            <input id="bonus-quantity" type="number" min={1} max={99} step={1} value={quantity}
              onChange={e => { const n = Number(e.target.value); if (Number.isSafeInteger(n) && n >= 1 && n <= 99) setQuantity(n); }}/>
          </label>
          <label htmlFor="bonus-date">Requested date
            <input id="bonus-date" type="date" min={today} required value={date} onChange={e => setDate(e.target.value)}/>
          </label>
          <p className="cm-portal__muted">Uses <strong>{liters(cost)}</strong> of {liters(summary.balanceMl)}.
            {canRedeem ? "" : offered(format) ? " Not enough credit for that." : " That package is not offered."}</p>
          <button type="submit" disabled={!canRedeem} className="cm-portal__button cm-portal__button--dark">
            Request bonus product ↗</button>
        </form>
        <p className="cm-portal__muted">No charge. Staff approve it like any order, and you can follow it under Track orders. Cancel the request and the credit comes back.</p>
      </section>
    </div>
  </>;
}
