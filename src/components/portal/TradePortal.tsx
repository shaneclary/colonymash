"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  demoProducts, demoTradeStatus, demoStatusText, merchantDemoId, plusDays,
  type MerchantStock, type PackFormat, type TradeLine,
} from "@/content/portal-demo";
import {
  createTradeRequest, finishedUnitAvailability, quantityForTrade, updateTradeCart, volumeLiters,
} from "@/lib/portal-forecast";
import {
  amendRequestedMerchantOrder, cancelRequestedMerchantOrder,
  createMerchantSeries, editMerchantStock, extendMerchantSeries,
  merchantFormats, merchantIncomingUnits, merchantInventoryRow, merchantOrders,
  merchantStockForecast, receiveMerchantOrder, recordMerchantCount,
  recordMerchantUsage, setSeriesActive,
} from "@/lib/merchant-operations";
import { PortalFrame } from "./PortalFrame";
import { useDemoLedger } from "./useDemoPortal";

type View = "inventory" | "catalog" | "schedule" | "requests" | "activity" | "account";
const sections: {id:View;label:string}[]=[
  {id:"inventory",label:"My inventory"},
  {id:"catalog",label:"Reorder & catalog"},
  {id:"schedule",label:"Future orders"},
  {id:"requests",label:"Order history"},
  {id:"activity",label:"Stock activity"},
  {id:"account",label:"Account"},
];
const company="Coastal Partner — Demo";
const dateLabel=(iso:string)=>{
  const d=new Date(iso+"T12:00:00Z");
  return Number.isFinite(d.getTime())?new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"}).format(d):iso;
};
const productName=(id:string)=>demoProducts.find(p=>p.id===id)?.name ?? id;
const packName=(format:PackFormat)=>merchantFormats.find(f=>f.id===format)?.label ?? format;

function Stepper({value,onChange,label,disableAdd=false}:{
  value:number; onChange:(delta:number)=>void;label:string;disableAdd?:boolean;
}){
  return <div className="cm-portal__stepper">
    <button type="button" disabled={value<=0} onClick={()=>onChange(-1)} aria-label={"Remove "+label}>−</button>
    <output aria-label={label+" quantity"}>{value}</output>
    <button type="button" disabled={value>=99||disableAdd} onClick={()=>onChange(1)} aria-label={"Add "+label}>+</button>
  </div>;
}

function QuantityField({value,onChange,label,step=1,min=0,max=10000}:{
  value:number;onChange:(v:number)=>void;label:string;step?:number;min?:number;max?:number;
}){
  return <input className="cm-portal__compact-number" type="number" aria-label={label}
    min={min} max={max} step={step} value={value} onChange={e=>{
      if(e.target.value.trim()==="")return;
      const x=Number(e.target.value);
      if(Number.isFinite(x)&&x>=min&&x<=max)onChange(x);
    }}/>;
}

export function TradePortal(){
  const {state,setState,loaded}=useDemoLedger();
  const [view,setView]=useState<View>("inventory");
  const [catalogSearch,setCatalogSearch]=useState("");
  const [catalogKind,setCatalogKind]=useState<"all"|"beer"|"seltzer">("all");
  const [trackProduct,setTrackProduct]=useState(demoProducts[0]?.id??"");
  const [trackFormat,setTrackFormat]=useState<PackFormat>("six_pack");
  const [cart,setCart]=useState<TradeLine[]>([]);
  const [date,setDate]=useState(()=>plusDays(14));
  const [notes,setNotes]=useState("");
  const [feedback,setFeedback]=useState("");
  const [scheduleDate,setScheduleDate]=useState(()=>plusDays(14));
  const [frequency,setFrequency]=useState<7|14|28>(14);
  const [occurrences,setOccurrences]=useState(4);
  const [scheduleNotes,setScheduleNotes]=useState("");
  const [countEdits,setCountEdits]=useState<Record<string,string>>({});
  const [saleEdits,setSaleEdits]=useState<Record<string,string>>({});
  const [orderDates,setOrderDates]=useState<Record<string,string>>({});
  const today=plusDays(0);
  const forecasts=useMemo(()=>merchantStockForecast(state,merchantDemoId,today),[state,today]);
  const orders=useMemo(()=>merchantOrders(state,merchantDemoId),[state]);
  const mySeries=state.merchantSeries.filter(x=>x.merchantId===merchantDemoId);
  const movements=state.merchantMovements.filter(x=>x.merchantId===merchantDemoId);
  const pending=orders.filter(o=>o.status==="requested");
  const awaitingDelivery=orders.filter(o=>o.status==="fulfilled"&&!state.merchantReceipts.some(r=>r.orderId===o.id&&r.merchantId===merchantDemoId));
  const low=forecasts.filter(x=>x.status==="low");
  const restock=forecasts.filter(x=>x.suggested>0&&x.stock.targetStock>0&&
    demoTradeStatus(x.stock.productId,x.stock.format)!=="unavailable");
  const units=cart.reduce((sum,x)=>sum+x.quantity,0);
  const trackedRows=forecasts.filter(x=>x.stock.targetStock>0||x.stock.minStock>0||
    x.stock.weeklyUse>0||x.stock.onHand>0||x.inbound>0);
  const countTracked=trackedRows.length;
  const trackedProducts=demoProducts.filter(product=>trackedRows.some(x=>x.stock.productId===product.id));
  const visibleCatalog=demoProducts.filter(product=>
    (catalogKind==="all"||catalogKind===product.kind)&&
    (!catalogSearch.trim()||[product.name,product.description].join(" ").toLowerCase().includes(catalogSearch.trim().toLowerCase())));

  function modifyCart(productId:string,format:PackFormat,delta:number){
    if(delta>0&&demoTradeStatus(productId,format)==="unavailable"){
      setFeedback("That package is marked unavailable in this DEMO. Ask Erik for real wholesale terms.");
      return;
    }
    setCart(current=>updateTradeCart(current,productId,format,delta));
    setFeedback("");
  }
  function preload(lines:TradeLine[],mode:View="catalog"){
    setCart(lines.map(x=>({...x})));setView(mode);
    setFeedback("Your sample request is ready to review; choose a date before submitting.");
  }
  function suggestedToCart(){
    if(!restock.length){setFeedback("No configured products currently need replenishment.");return;}
    setCart(current=>{
      let next=[...current];
      restock.forEach(x=>{
        const existing=quantityForTrade(next,x.stock.productId,x.stock.format);
        next=updateTradeCart(next,x.stock.productId,x.stock.format,Math.max(0,x.suggested-existing));
      });
      return next;
    });
    setView("catalog");
    setFeedback("Suggested quantities were added using your par levels and estimated usage. Verify before requesting.");
  }
  function orderOnce(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!cart.length){setFeedback("Add a product to your request first.");return;}
    if(!date||date<today){setFeedback("Choose a current or future delivery request date.");return;}
    const id="DEMO-REQ-"+String(Date.now());
    let saved=false;
    setState(current=>{
      const next=createTradeRequest(current,merchantDemoId,company,cart,date,notes,id,today);
      saved=next!==current;
      return next;
    });
    // The visible message describes a client-side request, never a real submission.
    setCart([]);setNotes("");setView("requests");
    setFeedback(saved?"Sample request recorded. Erik's demo can review it.":"Sample request queued locally; check Order history.");
  }
  function submitSeries(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const res=createMerchantSeries(state,merchantDemoId,company,cart,scheduleDate,frequency,occurrences,
      today,"DEMO-SER-"+String(Date.now()),scheduleNotes);
    if(res.error){setFeedback(res.error);return;}
    setState(res.state);setCart([]);setScheduleNotes("");setView("schedule");
    setFeedback(res.createdOrders+" separate future requests created for staff approval. No automatic purchases or delivery promises.");
  }
  function recordUsage(productId:string,format:PackFormat,key:string){
    const quantity=Number(saleEdits[key]??"1");
    if(!Number.isSafeInteger(quantity)||quantity<=0){
      setFeedback("Enter a positive whole-unit usage quantity.");return;
    }
    const result=recordMerchantUsage(state,merchantDemoId,productId,format,quantity,today,"DEMO-MOVE-"+Date.now());
    if(result===state){setFeedback("That quantity exceeds the simulated on-hand stock.");return;}
    setState(result);
    setSaleEdits(current=>({...current,[key]:"1"}));
    setFeedback("Recorded "+quantity+" "+packName(format)+" as used/sold in this browser only.");
  }
  function recordCount(productId:string,format:PackFormat,key:string){
    const quantity=Number(countEdits[key]);
    if(!Number.isSafeInteger(quantity)||quantity<0){setFeedback("Enter a nonnegative whole-unit physical count.");return;}
    const result=recordMerchantCount(state,merchantDemoId,productId,format,quantity,today,"DEMO-COUNT-"+Date.now());
    if(result===state){setFeedback("No adjustment necessary, or the count could not be applied.");return;}
    setState(result);setCountEdits(current=>({...current,[key]:""}));
    setFeedback("Physical count correction recorded in the simulated stock ledger.");
  }
  function handleReceive(orderId:string){
    const updated=receiveMerchantOrder(state,merchantDemoId,orderId,today);
    if(updated===state){setFeedback("Cannot receive that order twice or before staff marks it fulfilled.");return;}
    setState(updated);
    setFeedback("Received sample packages were added to your own merchant stock. Brewery inventory was not changed.");
  }
  const tabs=<nav className="cm-portal__tabs" aria-label="Merchant dashboard sections">
    {sections.map(x=><button type="button" key={x.id} aria-current={view===x.id?"page":undefined}
      onClick={()=>{setView(x.id);setFeedback("");}}>{x.label}</button>)}
  </nav>;

  return <PortalFrame role="merchant" title="Your Colony Mash stock"
    subtitle="Count what's on your shelves, forecast what to buy, and schedule your next deliveries.">
    <div className="cm-portal__merchant-band"><span>COASTAL PARTNER — FICTIONAL MERCHANT</span>
      <strong>Wholesale partner workspace</strong><span>ALL INVENTORY &amp; ORDERS BELOW ARE DEMO DATA</span></div>
    {tabs}
    {feedback&&<div className="cm-portal__feedback" role="status">{feedback}</div>}
    {!loaded&&<p className="cm-portal__muted">Opening local sample inventory…</p>}

    {view==="inventory"&&<>
      <section className="cm-portal__metrics" aria-label="Merchant stock summary">
        <div><span>Tracked formats</span><strong>{countTracked}</strong><small>Of {demoProducts.length*merchantFormats.length} historical-release format combinations</small></div>
        <div><span>Needs attention</span><strong>{low.length}</strong><small>Below minimum or lead-time coverage</small></div>
        <div><span>Upcoming requests</span><strong>{pending.length}</strong><small>Not yet approved by brewery</small></div>
        <div><span>Ready to receive</span><strong>{awaitingDelivery.length}</strong><small>Staff marked fulfilled; not counted in stock</small></div>
      </section>
      <section className="cm-portal__panel">
        <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">YOUR OWN VENUE INVENTORY</p>
          <h2>Counts, par levels & reorder alerts</h2></div>
          <button type="button" onClick={suggestedToCart}>Build suggested reorder ↗</button></div>
        <p className="cm-portal__muted">These are your venue's stock counts—not Colony Mash brewery stock. Adjust an on-hand count, log sell-through, and set your minimum and target quantity for each package format. Incoming counts refer only to accepted/scheduled sample orders, not guaranteed shipments.</p>
        <div className="cm-portal__track-new">
          <div><strong>Track another archived release</strong>
            <p className="cm-portal__muted">All 35 releases can be added to your venue inventory. Products without counts or par levels stay out of the main stock dashboard.</p></div>
          <label>Flavor
            <select value={trackProduct} onChange={e=>setTrackProduct(e.target.value)}>
              {demoProducts.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label>Package
            <select value={trackFormat} onChange={e=>setTrackFormat(e.target.value as PackFormat)}>
              {merchantFormats.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </label>
          <button className="cm-portal__button cm-portal__button--dark" type="button" onClick={()=>{
            if(!trackProduct)return;
            setState(current=>editMerchantStock(current,merchantDemoId,trackProduct,trackFormat,"targetStock",
              Math.max(1,merchantInventoryRow(current,merchantDemoId,trackProduct,trackFormat).targetStock)));
            setFeedback("This historical product is now tracked in your simulated venue inventory.");
          }}>Track item ↗</button>
        </div>
        <div className="cm-portal__merchant-inventory">
          {trackedProducts.map(product=><section key={product.id} className="cm-portal__stock-group">
            <h3><span className={"cm-portal__stock-dot "+(product.kind==="seltzer"?"cm-fill--"+product.color:"cm-fill--b2")} aria-hidden="true"/>
              {product.name}</h3>
            <div className="cm-portal__stock-rows">{merchantFormats.map(({id:format,label})=>{
              const forecast=forecasts.find(x=>x.stock.productId===product.id&&x.stock.format===format);
              if(!forecast)return null;
              const row=forecast.stock;
              const key=product.id+"|"+format;
              return <div className="cm-portal__stock-row" key={format}>
                <div className="cm-portal__stock-identity"><strong>{label}</strong>
                  <span className={"cm-portal__forecast cm-portal__stock-status--"+forecast.status}>
                    {forecast.status==="low"?"Low stock":forecast.status==="plan"?"Reorder planning":
                      forecast.status==="unconfigured"?"Set par levels":"On target"}
                  </span>
                </div>
                <div className="cm-portal__stock-numbers">
                  <div><small>On hand</small><strong>{row.onHand}</strong></div>
                  <div><small>Planned inbound*</small><strong>{forecast.inbound}</strong></div>
                  <div><small>Days cover</small><strong>{forecast.daysCover===null?"—":forecast.daysCover.toFixed(0)}</strong></div>
                  <div><small>Suggested qty</small><strong>{forecast.suggested}</strong></div>
                </div>
                <div className="cm-portal__stock-configuration">
                  <label>Minimum <QuantityField value={row.minStock} label={label+" minimum for "+product.name}
                    onChange={v=>setState(s=>editMerchantStock(s,merchantDemoId,product.id,format,"minStock",v))}/></label>
                  <label>Target / par <QuantityField value={row.targetStock} label={label+" target for "+product.name}
                    onChange={v=>setState(s=>editMerchantStock(s,merchantDemoId,product.id,format,"targetStock",v))}/></label>
                  <label>Weekly use <QuantityField value={row.weeklyUse} step={0.1} label={label+" weekly use for "+product.name}
                    onChange={v=>setState(s=>editMerchantStock(s,merchantDemoId,product.id,format,"weeklyUse",v))}/></label>
                  <label>Lead days <QuantityField value={row.leadDays} max={365} label={label+" lead days for "+product.name}
                    onChange={v=>setState(s=>editMerchantStock(s,merchantDemoId,product.id,format,"leadDays",v))}/></label>
                </div>
                <div className="cm-portal__stock-actions">
                  <div><label htmlFor={"use-"+key}>Used / sold</label>
                    <input id={"use-"+key} type="number" min={1} max={100000} step={1}
                      value={saleEdits[key]??"1"} onChange={e=>setSaleEdits(p=>({...p,[key]:e.target.value}))}/></div>
                  <button type="button" className="cm-portal__button" onClick={()=>recordUsage(product.id,format,key)}>Log usage</button>
                  <div><label htmlFor={"count-"+key}>Physical count</label>
                    <input id={"count-"+key} type="number" min={0} max={100000} step={1}
                      placeholder={String(row.onHand)} value={countEdits[key]??""}
                      onChange={e=>setCountEdits(p=>({...p,[key]:e.target.value}))}/></div>
                  <button type="button" className="cm-portal__button" onClick={()=>recordCount(product.id,format,key)}>Save count</button>
                  <button type="button" className="cm-portal__button cm-portal__button--dark"
                    onClick={()=>{modifyCart(product.id,format,Math.max(1,forecast.suggested));setView("catalog");}}>
                    Add to reorder ↗</button>
                </div>
              </div>;
            })}</div>
          </section>)}
        </div>
        <p className="cm-portal__muted">*Inbound is based on accepted/scheduled orders with requested dates inside the lead-time window; it is not a dispatch confirmation. Suggested quantity is a rough par/usage model, not a purchase instruction. Inventory changes remain only in this browser.</p>
      </section>
    </>}

    {view==="catalog"&&<div className="cm-portal__trade-layout">
      <section className="cm-portal__panel">
        <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">REPLENISHMENT / WHOLESALE DEMO</p>
          <h2>Choose products to reorder</h2></div><span>{demoProducts.length} sample releases</span></div>
        <p className="cm-portal__muted">Browse all {demoProducts.length} recorded Colony Mash releases. Package badges are <strong>examples only</strong>: “Request availability”, “Special order only”, or “Unavailable in keg” are NOT verified by Erik. A future live catalog requires actual SKU, packaging and inventory confirmation. No checkout or live reservations.</p>
        <div className="cm-portal__catalog-filter">
          <label htmlFor="merchant-catalog-search">Find a flavor
            <input type="search" id="merchant-catalog-search" value={catalogSearch}
              onChange={e=>setCatalogSearch(e.target.value)}
              placeholder="Search the full release library…"/>
          </label>
          <div role="group" aria-label="Filter trade releases" className="cm-portal__catalog-filter-buttons">
            {([["all","All releases"],["seltzer","Seltzers"],["beer","Beer"]] as const).map(([key,label])=>
              <button type="button" key={key} aria-pressed={catalogKind===key} onClick={()=>setCatalogKind(key)}>{label}</button>)}
          </div>
          <p className="cm-portal__muted">{visibleCatalog.length} of {demoProducts.length} historical releases · format labels are illustrative and must be configured by Erik.</p>
        </div>
        {visibleCatalog.length===0 && <p className="cm-portal__muted">No releases match those filters. Try another flavor name or choose All releases.</p>}
        <div className="cm-portal__catalog">{visibleCatalog.map(product=><article key={product.id} className="cm-portal__product">
          <span className={"cm-portal__product-stripe "+(product.kind==="seltzer"?"cm-fill--"+product.color:"cm-fill--b2")} aria-hidden="true"/>
          <div className="cm-portal__product-info"><p className="cm-portal__overline">{product.kind==="seltzer"?"HARD SELTZER":"BEER"}</p>
            <h3>{product.name}</h3><p>{product.description}</p></div>
          <div className="cm-portal__product-packs">{merchantFormats.map(({id:format,label})=>{
            const stock=merchantInventoryRow(state,merchantDemoId,product.id,format);
            const brewery=finishedUnitAvailability(state,product.id,format);
            const q=quantityForTrade(cart,product.id,format);
            const status=demoTradeStatus(product.id,format);
            return <div className={"cm-portal__pack cm-portal__pack--"+status} key={format}>
              <div><strong>{label}</strong>
                <span className={"cm-portal__package-status cm-portal__package-status--"+status}>
                  {demoStatusText(status,format)}
                </span>
                <small>Your venue: {stock.onHand} · {brewery.stock>0?
                  "Example brewery stock: "+brewery.stock:"No example brewery stock assigned"}</small>
              </div>
              {status==="unavailable"?<span className="cm-portal__not-offered">Not selectable in demo</span>:
                <Stepper value={q} label={label+" of "+product.name}
                  onChange={delta=>modifyCart(product.id,format,delta)}/>}
            </div>;
          })}</div>
        </article>)}</div>
      </section>
      <aside className="cm-portal__panel cm-portal__cart">
        <div className="cm-portal__panel-head"><h2>Replenishment cart</h2><strong>{units} units</strong></div>
        {cart.length===0?<p className="cm-portal__muted">Select a format with the + controls or build a suggested order from your inventory page.</p>:
          <ul className="cm-portal__cart-list">{cart.map(x=><li key={x.productId+x.format}>
            <span><strong>{productName(x.productId)}</strong><small>{packName(x.format)}</small></span>
            <Stepper label={packName(x.format)+" of "+productName(x.productId)} value={x.quantity}
              onChange={delta=>modifyCart(x.productId,x.format,delta)}/>
          </li>)}</ul>}
        <form onSubmit={orderOnce} className="cm-portal__form">
          <label htmlFor="merchant-date">One-time requested date
            <input id="merchant-date" type="date" min={today} required value={date} onChange={e=>setDate(e.target.value)}/>
          </label>
          <label htmlFor="merchant-notes">Notes / PO reference (sample)
            <textarea id="merchant-notes" rows={3} maxLength={500} value={notes}
              onChange={e=>setNotes(e.target.value)} placeholder="Reference, pickup/delivery preference…"/>
          </label>
          <p className="cm-portal__muted">Estimated package volume: {volumeLiters(cart).toFixed(1)} L. Uses fictitious sizes; no price is calculated.</p>
          <button type="submit" disabled={!cart.length} className="cm-portal__button cm-portal__button--dark">Request for one date ↗</button>
          <button type="button" disabled={!cart.length} className="cm-portal__button" onClick={()=>setView("schedule")}>
            Schedule multiple future orders ↗
          </button>
        </form>
        <p className="cm-portal__notice">Requests exist only in the demonstration browser. No checkout, brewery reservation, invoice or real delivery is created.</p>
      </aside>
    </div>}

    {view==="schedule"&&<>
      <div className="cm-portal__two">
        <section className="cm-portal__panel">
          <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">SCHEDULED REPLENISHMENT</p>
            <h2>Plan upcoming requests</h2></div></div>
          <p className="cm-portal__muted">Set a recurring rhythm and queue 2–6 separately dated requests for Erik to approve. This demonstration does not run a background task or automatically purchase anything.</p>
          {cart.length===0?<div className="cm-portal__notice">No schedule products selected. <button type="button" className="cm-portal__button" onClick={()=>setView("catalog")}>Choose products ↗</button></div>:
            <ul className="cm-portal__bill">{cart.map(x=><li key={x.productId+x.format}>
              <span>{productName(x.productId)} · {packName(x.format)}</span><strong>× {x.quantity}</strong>
            </li>)}</ul>}
          <form onSubmit={submitSeries} className="cm-portal__form">
            <label htmlFor="schedule-start">First requested date
              <input id="schedule-start" type="date" min={today} required value={scheduleDate}
                onChange={e=>setScheduleDate(e.target.value)}/></label>
            <label htmlFor="schedule-frequency">Replenishment frequency
              <select id="schedule-frequency" value={frequency} onChange={e=>setFrequency(Number(e.target.value) as 7|14|28)}>
                <option value={7}>Every week</option><option value={14}>Every 2 weeks</option><option value={28}>Every 4 weeks</option>
              </select></label>
            <label htmlFor="schedule-occurrences">Number of future requests (2–6)
              <select id="schedule-occurrences" value={occurrences} onChange={e=>setOccurrences(Number(e.target.value))}>
                {[2,3,4,5,6].map(n=><option key={n} value={n}>{n} occurrences</option>)}
              </select></label>
            <label htmlFor="schedule-notes">Standing notes
              <textarea id="schedule-notes" rows={2} maxLength={250} value={scheduleNotes}
                onChange={e=>setScheduleNotes(e.target.value)} placeholder="Venue opening, receiving hours, delivery preference…"/>
            </label>
            <button type="submit" disabled={!cart.length} className="cm-portal__button cm-portal__button--dark">
              Queue {occurrences} future sample requests ↗
            </button>
          </form>
        </section>
        <section className="cm-portal__panel">
          <div className="cm-portal__panel-head"><h2>Upcoming request calendar</h2><span>{pending.length} awaiting approval</span></div>
          <div className="cm-portal__orderlist">{orders.filter(x=>x.neededBy>=today&&
            (x.status==="requested"||x.status==="accepted"||x.status==="scheduled")).slice(0,12).map(o=>
            <div className="cm-portal__upcoming" key={o.id}>
              <div><span>{dateLabel(o.neededBy)} / {o.status.toUpperCase()}</span>
                <strong>{o.lines.map(l=>l.quantity+" "+packName(l.format)+" "+productName(l.productId)).join(" · ")}</strong></div>
              <span className={"cm-portal__status cm-portal__status--"+o.status}>{o.status}</span>
            </div>)}</div>
          <p className="cm-portal__muted">Requested dates are customer preferences, not guaranteed arrival dates. Admin approval is required for each occurrence.</p>
        </section>
      </div>
      <section className="cm-portal__panel">
        <div className="cm-portal__panel-head"><h2>Replenishment schedules</h2><span>{mySeries.length} series</span></div>
        {mySeries.length===0?<p className="cm-portal__muted">No repeat schedules yet. Add some products from the catalog to create one.</p>:
          <div className="cm-portal__series-grid">{mySeries.map(series=><article key={series.id} className="cm-portal__recipe">
            <p className="cm-portal__overline">{series.active?"ACTIVE":"PAUSED"} · EVERY {series.cadenceDays} DAYS</p>
            <h3>{series.lines.map(x=>productName(x.productId)).join(" / ")}</h3>
            <p>{series.lines.map(x=>x.quantity+" "+packName(x.format)).join(" · ")}</p>
            <p>Next unqueued request date: <strong>{dateLabel(series.nextDate)}</strong></p>
            <p>Existing dated requests remain active even if you pause future extensions.</p>
            <div className="cm-portal__order-actions">
              <button type="button" className="cm-portal__button"
                onClick={()=>setState(s=>setSeriesActive(s,merchantDemoId,series.id,!series.active))}>
                {series.active?"Pause future queuing":"Resume"} ↗
              </button>
              <button type="button" disabled={!series.active} className="cm-portal__button cm-portal__button--dark"
                onClick={()=>{
                  const result=extendMerchantSeries(state,merchantDemoId,series.id,today,2);
                  if(result.error){setFeedback(result.error);return;}
                  setState(result.state);setFeedback("Added two more future requested dates to the sample admin queue.");
                }}>Queue next 2 ↗</button>
            </div>
          </article>)}</div>}
      </section>
    </>}

    {view==="requests"&&<section className="cm-portal__panel">
      <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">WHOLESALE ORDER PIPELINE</p>
        <h2>Requests, deliveries & reorders</h2></div><span>{orders.length} total</span></div>
      <p className="cm-portal__muted">You can change dates or cancel your own Requested entries. Accepted/Scheduled entries are controlled by staff. Once marked Fulfilled, choose Receive to add delivered units to your venue inventory; this prevents double-counting.</p>
      <div className="cm-portal__orderlist">{[...orders].sort((a,b)=>b.neededBy.localeCompare(a.neededBy)).map(o=>{
        const received=state.merchantReceipts.find(r=>r.orderId===o.id&&r.merchantId===merchantDemoId);
        return <article key={o.id} className="cm-portal__order">
          <div className="cm-portal__order-top"><div><p className="cm-portal__overline">{o.id} · {dateLabel(o.neededBy)}</p>
            <h3>{o.seriesId?"Scheduled replenishment":"Wholesale request"}</h3></div>
            <span className={"cm-portal__status cm-portal__status--"+o.status}>{o.status}</span></div>
          <ul className="cm-portal__bill">{o.lines.map(l=><li key={l.productId+l.format}>
            <span>{productName(l.productId)} · {packName(l.format)}</span><strong>× {l.quantity}</strong>
          </li>)}</ul>
          {o.notes&&<p className="cm-portal__muted">{o.notes}</p>}
          <div className="cm-portal__order-actions">
            <button type="button" className="cm-portal__button" onClick={()=>preload(o.lines)}>Reorder / copy ↗</button>
            <button type="button" className="cm-portal__button" onClick={()=>preload(o.lines,"schedule")}>Use in new schedule ↗</button>
            {o.status==="requested"&&<>
              <label className="cm-portal__order-date">Change requested date
                <input type="date" min={today} value={orderDates[o.id]??o.neededBy}
                  onChange={e=>setOrderDates(p=>({...p,[o.id]:e.target.value}))}/>
              </label>
              <button type="button" className="cm-portal__button" onClick={()=>{
                const result=amendRequestedMerchantOrder(state,merchantDemoId,o.id,orderDates[o.id]??o.neededBy,today);
                if(result===state){setFeedback("Choose a valid current or future date.");return;}
                setState(result);setFeedback("Updated your pending demo request date.");
              }}>Save date</button>
              <button type="button" className="cm-portal__button" onClick={()=>{
                if(window.confirm("Cancel this pending sample request?")) {
                  setState(s=>cancelRequestedMerchantOrder(s,merchantDemoId,o.id));
                  setFeedback("Cancelled pending request. Existing schedules remain separately editable.");
                }
              }}>Cancel request</button>
            </>}
            {o.status==="fulfilled"&&!received&&<button type="button" className="cm-portal__button cm-portal__button--dark"
              onClick={()=>handleReceive(o.id)}>Receive into my inventory ↗</button>}
            {received&&<span className="cm-portal__status cm-portal__status--fulfilled">Received {dateLabel(received.receivedAt)}</span>}
          </div>
        </article>;
      })}</div>
    </section>}

    {view==="activity"&&<section className="cm-portal__panel">
      <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">YOUR VENUE'S STOCK LEDGER</p>
        <h2>Inventory movement history</h2></div><span>{movements.length} events</span></div>
      <p className="cm-portal__muted">Inventory changes are recorded as sample sell-through, physical counts and received deliveries. All movements stay in the local demo and are not sent to the brewery.</p>
      <div className="cm-portal__tablewrap"><table className="cm-portal__table cm-portal__table--finished">
        <thead><tr><th>Date</th><th>Product / format</th><th>Type</th><th>Delta</th></tr></thead>
        <tbody>{movements.slice(0,100).map(m=><tr key={m.id}>
          <td>{dateLabel(m.at)}</td><th scope="row">{productName(m.productId)}<small>{packName(m.format)}</small></th>
          <td>{m.kind==="sale"?"Sold / used":m.kind==="count"?"Count correction":"Received"}</td>
          <td><strong>{m.delta>0?"+":""}{m.delta}</strong></td>
        </tr>)}</tbody>
      </table></div>
    </section>}

    {view==="account"&&<div className="cm-portal__two">
      <section className="cm-portal__panel"><p className="cm-portal__overline">VENUE / DEMO TENANT</p>
        <h2>{company}</h2><dl className="cm-portal__details">
          <dt>Merchant account</dt><dd>{merchantDemoId}</dd>
          <dt>Account status</dt><dd>Fictional review account</dd>
          <dt>Inventory ownership</dt><dd>Buyer-entered venue stock, not brewery stock</dd>
          <dt>Wholesale authorization</dt><dd>Not implemented</dd>
          <dt>Recurring purchasing</dt><dd>Dated review requests, not automatic purchases</dd>
          <dt>Authentication</dt><dd>Public sample login; not secure</dd>
        </dl></section>
      <section className="cm-portal__panel"><p className="cm-portal__overline">HOW TO USE THIS WORKSPACE</p>
        <h2>Make restocking simpler</h2>
        <ol className="cm-portal__feature-list">
          <li>Set your starting on-hand inventory and target quantities.</li>
          <li>Log sell-through or perform a physical count when stock changes.</li>
          <li>Review the low-stock list and load suggested quantities into your reorder cart.</li>
          <li>Submit a dated wholesale request, or queue 2–6 future requests on a rhythm.</li>
          <li>Mark a fulfilled order received to increase your own stock ledger once.</li>
        </ol>
        <p className="cm-portal__muted">Real production would require per-merchant secure accounts and automated data sync if the buyer wants POS sales to update stock.</p>
      </section>
    </div>}

    <nav className="cm-portal__trade-actions" aria-label="Primary merchant actions">
      <button type="button" className={view==="catalog"?"cm-portal__trade-action--active":""}
        aria-current={view==="catalog"?"page":undefined}
        onClick={()=>{setView("catalog");setFeedback("");}}>
        <span>Order</span><small>{units>0?units+" selected":"Build request"}</small>
      </button>
      <button type="button" className={view==="schedule"?"cm-portal__trade-action--active":""}
        aria-current={view==="schedule"?"page":undefined}
        onClick={()=>{setView("schedule");setFeedback("");}}>
        <span>Schedule</span><small>Plan future orders</small>
      </button>
    </nav>
    <p className="cm-portal__demo-note">THIS IS FICTIONAL MERCHANT INVENTORY. ACCOUNTS ARE NOT SECURE OR ISOLATED SERVER-SIDE. NO STOCK, PAYMENTS, WHOLESALE APPROVAL OR BACKGROUND ORDERING OCCURS. <a href="/portal">Sample logins ↗</a></p>
  </PortalFrame>;
}
