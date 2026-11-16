"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  demoPackVolumes, demoProducts, merchantDemoId, plusDays,
  type PackFormat, type TradeLine,
} from "@/content/portal-demo";
import {
  createTradeRequest, finishedUnitAvailability, quantityForTrade,
  updateTradeCart, volumeLiters,
} from "@/lib/portal-forecast";
import { PortalFrame } from "./PortalFrame";
import { useDemoLedger } from "./useDemoPortal";

type View = "catalog" | "requests" | "account";
const formats: { format: PackFormat; label: string }[] = [
  { format:"can", label:"Single cans" }, { format:"six_pack", label:"6-packs" }, { format:"keg", label:"Kegs" },
];
function dateLabel(iso: string) {
  const date = new Date(iso+"T12:00:00Z");
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"}).format(date) : iso;
}

export function TradePortal() {
  const { state, setState, loaded } = useDemoLedger();
  const [view,setView] = useState<View>("catalog");
  const [cart,setCart] = useState<TradeLine[]>([]);
  const [date,setDate] = useState(() => plusDays(14));
  const [notes,setNotes] = useState("");
  const [message,setMessage] = useState("");
  const myOrders = useMemo(()=>state.orders.filter(o=>o.merchantId===merchantDemoId)
    .sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),[state.orders]);
  const units=cart.reduce((sum,x)=>sum+x.quantity,0);
  function change(productId: string, format: PackFormat, delta: number) {
    setCart(current=>updateTradeCart(current,productId,format,delta));
    setMessage("");
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(!cart.length) {setMessage("Add at least one product to your sample request.");return;}
    if(!date||date<plusDays(0)) {setMessage("Choose a current or future requested date.");return;}
    const id="DEMO-"+String(Date.now());
    setState(current=>createTradeRequest(current,merchantDemoId,"Coastal Partner — Demo",cart,date,notes,id,plusDays(0)));
    setCart([]);setNotes("");setMessage("Sample request saved to this browser. Switch to the admin demo to review it.");
    setView("requests");
  }
  function reorder(lines: TradeLine[]) {
    setCart(lines.map(x=>({...x})));
    setView("catalog");
    setMessage("Previous request copied into your sample cart. Check quantities and requested date.");
  }
  return <PortalFrame role="merchant" title="Partner trade portal"
    subtitle="Find products, request wholesale packages and track the status of your trade inquiries.">
    <div className="cm-portal__merchant-band"><span>COASTAL PARTNER — DEMO / EXAMPLE APPROVED ACCOUNT</span>
      <strong>Trade account preview</strong><span>NOT REAL WHOLESALE PRICING OR AVAILABILITY</span></div>
    <nav className="cm-portal__tabs" aria-label="Merchant sections">
      {[{id:"catalog",label:"Trade catalog"},{id:"requests",label:"My requests"},{id:"account",label:"Account details"}].map(t=>
        <button type="button" key={t.id} aria-current={view===t.id?"page":undefined}
          onClick={()=>setView(t.id as View)}>{t.label}</button>)}
    </nav>
    {message&&<div className="cm-portal__feedback" role="status">{message}</div>}
    {!loaded&&<p className="cm-portal__muted">Opening your sample account…</p>}

    {view==="catalog"&&<div className="cm-portal__trade-layout">
      <section className="cm-portal__panel">
        <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">WHOLESALE / SIMULATED CATALOG</p><h2>Build a trade request</h2></div>
          <span>{demoProducts.length} example releases</span></div>
        <p className="cm-portal__muted">Actual wholesale eligibility, prices, case sizes, keg deposits, inventory, and delivery limits are not verified. These figures exist solely to demonstrate buyer and staff workflows.</p>
        <div className="cm-portal__catalog">{demoProducts.map(product=><article key={product.id} className="cm-portal__product">
          <span className={"cm-portal__product-stripe "+(product.kind==="seltzer"?"cm-fill--"+product.color:"cm-fill--b2")} aria-hidden="true"/>
          <div className="cm-portal__product-info">
            <p className="cm-portal__overline">{product.kind==="seltzer"?"HARD SELTZER":"BEER"} / ILLUSTRATIVE TRADE LIST</p>
            <h3>{product.name}</h3>
            <p>{product.description}</p>
          </div>
          <div className="cm-portal__product-packs">{formats.map(({format,label})=>{
            const demo=finishedUnitAvailability(state,product.id,format);
            const count=quantityForTrade(cart,product.id,format);
            return <div className="cm-portal__pack" key={format}>
              <div><strong>{label}</strong><small>Demo stock: {demo.stock} · sample unallocated: {demo.unallocated}</small></div>
              <div className="cm-portal__stepper">
                <button type="button" aria-label={"Remove one "+label+" of "+product.name}
                  disabled={count===0} onClick={()=>change(product.id,format,-1)}>−</button>
                <output aria-label={"Requested "+label+" of "+product.name}>{count}</output>
                <button type="button" aria-label={"Add one "+label+" of "+product.name}
                  disabled={count>=99} onClick={()=>change(product.id,format,1)}>+</button>
              </div>
            </div>;
          })}</div>
        </article>)}</div>
      </section>
      <aside className="cm-portal__panel cm-portal__cart" aria-labelledby="trade-cart-title">
        <div className="cm-portal__panel-head"><h2 id="trade-cart-title">Your request</h2><strong>{units} units</strong></div>
        {cart.length===0?<p className="cm-portal__muted">Choose + beneath a flavor to begin. Multiple products and pack formats can be combined.</p>:
          <ul className="cm-portal__cart-list">{cart.map(line=><li key={line.productId+line.format}>
            <span><strong>{demoProducts.find(p=>p.id===line.productId)?.name??line.productId}</strong>
              <small>{formats.find(x=>x.format===line.format)?.label}</small></span>
            <div className="cm-portal__stepper">
              <button type="button" aria-label={"Remove "+line.format+" of "+line.productId}
                onClick={()=>change(line.productId,line.format,-1)}>−</button>
              <output>{line.quantity}</output>
              <button type="button" aria-label={"Add "+line.format+" of "+line.productId}
                onClick={()=>change(line.productId,line.format,1)}>+</button>
            </div>
          </li>)}</ul>}
        <form onSubmit={submit} className="cm-portal__form">
          <label htmlFor="trade-date">Requested pickup / delivery date
            <input id="trade-date" required type="date" min={plusDays(0)} value={date} onChange={e=>setDate(e.target.value)}/>
          </label>
          <label htmlFor="trade-notes">Notes or PO reference (demo)
            <textarea id="trade-notes" rows={4} maxLength={500} value={notes} onChange={e=>setNotes(e.target.value)}
              placeholder="Preferred pickup / destination, reference number, keg questions…"/>
          </label>
          <p className="cm-portal__muted">Approximate packaged volume for planning: {volumeLiters(cart).toFixed(1)} L (demo assumptions only). No unit prices or payments.</p>
          <button type="submit" disabled={!cart.length} className="cm-portal__button cm-portal__button--dark">Send sample request for approval ↗</button>
        </form>
        <p className="cm-portal__notice">This submits only to the browser-local simulated ledger. It does not email the brewery, reserve inventory, process payment, create a real order or authorize wholesale delivery.</p>
      </aside>
    </div>}

    {view==="requests"&&<section className="cm-portal__panel">
      <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">ORDER HISTORY / DEMO</p><h2>My trade requests</h2></div><span>{myOrders.length} sample requests</span></div>
      <p className="cm-portal__muted">Requested means awaiting staff review. Only a demo administrator can advance the status. No real order confirmation or delivery is sent.</p>
      <div className="cm-portal__orderlist">{myOrders.map(order=><article key={order.id} className="cm-portal__order">
        <div className="cm-portal__order-top">
          <div><span className="cm-portal__overline">{order.id} · requested for {dateLabel(order.neededBy)}</span><h3>Trade request</h3></div>
          <span className={"cm-portal__status cm-portal__status--"+order.status}>{order.status}</span>
        </div>
        <ul className="cm-portal__bill">{order.lines.map(line=><li key={line.productId+line.format}>
          <span>{demoProducts.find(p=>p.id===line.productId)?.name??line.productId} · {formats.find(x=>x.format===line.format)?.label}</span><strong>× {line.quantity}</strong>
        </li>)}</ul>
        {order.notes&&<p className="cm-portal__muted">Note: {order.notes}</p>}
        <button type="button" className="cm-portal__button" onClick={()=>reorder(order.lines)}>Copy to new request ↗</button>
      </article>)}</div>
      <p className="cm-portal__muted">If you switch to the admin demo in this browser, you can accept or schedule a sample request, then return here to observe its updated status.</p>
    </section>}

    {view==="account"&&<div className="cm-portal__two">
      <section className="cm-portal__panel">
        <p className="cm-portal__overline">ACCOUNT / FICTIONAL</p><h2>Coastal Partner — Demo</h2>
        <dl className="cm-portal__details">
          <dt>Account type</dt><dd>Wholesale merchant (preview)</dd>
          <dt>Sample contact</dt><dd>buyer.demo@coastalpartner.test</dd>
          <dt>Trade terms</dt><dd>To be established by brewery</dd>
          <dt>Licensing / resale verification</dt><dd>Not implemented</dd>
          <dt>Delivery eligibility</dt><dd>Not approved</dd>
          <dt>Payment terms</dt><dd>Not configured</dd>
        </dl>
      </section>
      <section className="cm-portal__panel">
        <p className="cm-portal__overline">FUTURE ACCOUNT CONTROLS</p><h2>Before going live</h2>
        <ul className="cm-portal__feature-list">
          <li>Verified merchant identity and applicable resale or liquor credentials</li>
          <li>Trade-specific pricing, keg deposits and credit limits</li>
          <li>Real fulfillment and invoice history</li>
          <li>Authenticated team members, account approval and permissions</li>
          <li>Permitted delivery routes and pickup options</li>
        </ul>
      </section>
    </div>}

    <p className="cm-portal__demo-note">SIMULATED WHOLESALE EXPERIENCE. SAMPLE INVENTORY IS NOT LIVE AND DOES NOT INDICATE ACTUAL PACKAGE AVAILABILITY. SAMPLE LOGINS ARE PUBLIC. <a href="/portal">Sign in as staff ↗</a></p>
  </PortalFrame>;
}
