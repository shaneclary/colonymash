"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  demoPackVolumes, demoProducts, demoRecipes, plusDays,
  type TradeOrder, type TradeOrderStatus, type PackFormat,
} from "@/content/portal-demo";
import {
  activeOrderStatuses, changePlannedBatches, finishedUnitAvailability,
  ingredientForecast, nextOrderStatus, productionEstimates, transitionOrder,
  updateIngredient,
} from "@/lib/portal-forecast";
import { PortalFrame } from "./PortalFrame";
import { useDemoLedger } from "./useDemoPortal";

type View = "overview" | "orders" | "ingredients" | "production" | "finished";
const tabs: { id: View; label: string }[] = [
  { id: "overview", label: "Overview" }, { id: "orders", label: "Orders" },
  { id: "ingredients", label: "Ingredients" }, { id: "production", label: "Production & recipes" },
  { id: "finished", label: "Packaged stock" },
];
const formatLabels: Record<PackFormat, string> = {
  can: "Single cans (demo)", six_pack: "6-packs (demo)", keg: "Kegs (demo)",
};
function dayLabel(iso: string) {
  const date = new Date(iso + "T12:00:00Z");
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("en-US", {month:"short",day:"numeric",timeZone:"UTC"}).format(date) : iso;
}
const amount = (n: number) => Number(n.toFixed(2)).toLocaleString("en-US");
function formatOrder(order: TradeOrder) {
  return order.lines.map(line => {
    const product = demoProducts.find(p => p.id === line.productId);
    return line.quantity + " × " + (product?.name ?? line.productId) + " / " + formatLabels[line.format];
  }).join(" · ");
}
function StatusLabel({ status }: { status: TradeOrderStatus }) {
  return <span className={"cm-portal__status cm-portal__status--" + status}>{status}</span>;
}
function DemoQuantity({ value, unit, min = 0, max = 100000, step = 1, onChange, ariaLabel }: {
  value: number; unit?: string; min?: number; max?: number; step?: number;
  onChange: (value: number) => void; ariaLabel: string;
}) {
  return <div className="cm-portal__number">
    <input type="number" value={value} step={step} min={min} max={max} aria-label={ariaLabel}
      onChange={e => {
        const parsed = Number(e.target.value);
        if (e.target.value !== "" && Number.isFinite(parsed) && parsed >= min && parsed <= max) onChange(parsed);
      }}/>
    {unit && <span>{unit}</span>}
  </div>;
}

export function AdminPortal() {
  const {state,setState,loaded,reset,updateFinished} = useDemoLedger();
  const [view,setView] = useState<View>("overview");
  const today = plusDays(0);
  const forecasts = useMemo(() => ingredientForecast(state,today),[state,today]);
  const production = useMemo(() => productionEstimates(state),[state]);
  const requested = state.orders.filter(o => o.status === "requested");
  const active = state.orders.filter(o => activeOrderStatuses.includes(o.status));
  const warning = forecasts.filter(x => x.suggestedOrder > 0);
  const tight = state.finished.flatMap(x => (["can","six_pack","keg"] as const).map(format =>
    ({...finishedUnitAvailability(state,x.productId,format),productId:x.productId,format}))).filter(x=>x.unallocated<0);
  const upcoming = [...state.orders].filter(o => ["requested","accepted","scheduled"].includes(o.status))
    .sort((a,b)=>a.neededBy.localeCompare(b.neededBy));

  function changeOrder(id: string, status: TradeOrderStatus) {setState(current=>transitionOrder(current,id,status));}
  function addIncoming(id: string, suggestedOrder: number) {
    const item = state.ingredients.find(i=>i.id===id);
    if (!item || suggestedOrder <= 0) return;
    const additional = Math.ceil(suggestedOrder*100)/100;
    setState(current=>updateIngredient(current,id,"incoming",Math.min(100000,(current.ingredients.find(i=>i.id===id)?.incoming??0)+additional)));
  }
  const actions = <button type="button" className="cm-portal__button" onClick={() => {
    if (window.confirm("Restore the fictional demo numbers? This clears local changes and sample merchant requests on this browser.")) reset();
  }}>Reset demo data</button>;

  return <PortalFrame role="admin" title="Brewery command center"
    subtitle="Inventory, production, upcoming orders and ingredient purchasing—one operating view."
    actions={actions}>
    <nav className="cm-portal__tabs" aria-label="Operations views">
      {tabs.map(tab=><button type="button" key={tab.id} onClick={()=>setView(tab.id)}
        aria-current={view===tab.id?"page":undefined}>{tab.label}</button>)}
    </nav>
    {!loaded && <p className="cm-portal__muted">Loading the local sample ledger…</p>}
    {view==="overview" && <>
      <section className="cm-portal__metrics" aria-label="Demo operations summary">
        <div><span>Needs approval</span><strong>{requested.length}</strong><small>Merchant requests</small></div>
        <div><span>Committed orders</span><strong>{active.length}</strong><small>Accepted + scheduled</small></div>
        <div><span>Ingredient actions</span><strong>{warning.length}</strong><small>Shortfalls or reorder points</small></div>
        <div><span>Packaged shortfalls</span><strong>{tight.length}</strong><small>Format-specific reserved units</small></div>
      </section>
      <div className="cm-portal__two">
        <section className="cm-portal__panel">
          <div className="cm-portal__panel-head"><h2>Ingredient watchlist</h2>
            <button type="button" onClick={()=>setView("ingredients")}>Manage inventory ↗</button></div>
          {warning.length===0?<p className="cm-portal__muted">No modeled reorder flags.</p>:
            <ul className="cm-portal__watchlist">{warning.slice(0,6).map(x=><li key={x.item.id}>
              <div><strong>{x.item.name}</strong><span>{x.status==="order-now"?"Action due now":"Order soon"} · lead {x.item.leadDays} days</span></div>
              <b>{amount(x.suggestedOrder)} {x.item.unit}</b>
            </li>)}</ul>}
        </section>
        <section className="cm-portal__panel">
          <div className="cm-portal__panel-head"><h2>Upcoming fulfillment</h2>
            <button type="button" onClick={()=>setView("orders")}>All orders ↗</button></div>
          {upcoming.slice(0,5).map(order=><div key={order.id} className="cm-portal__upcoming">
            <div><span>{dayLabel(order.neededBy)} · {order.id}</span><strong>{order.merchantName}</strong></div>
            <StatusLabel status={order.status}/>
          </div>)}
        </section>
      </div>
      <section className="cm-portal__panel">
        <div className="cm-portal__panel-head"><h2>Production pipeline</h2><button type="button" onClick={()=>setView("production")}>Open production plans ↗</button></div>
        <div className="cm-portal__recipe-grid">
          {production.map(item=><div className="cm-portal__recipe" key={item.recipe.id}>
            <span>{dayLabel(item.targetDate)} / TARGET</span><h3>{item.productName}</h3>
            <strong>{item.totalBatches} modeled batches</strong>
            <p>{item.plannedBatches} planned + {item.extraBatches} extra from committed demand</p>
          </div>)}
        </div>
      </section>
    </>}

    {view==="orders" && <section className="cm-portal__panel">
      <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">TRADE PIPELINE / SANDBOX</p><h2>Upcoming & historical orders</h2></div><span>{state.orders.length} total</span></div>
      <p className="cm-portal__muted">New merchant submissions arrive as <strong>Requested</strong>. Only Accepted and Scheduled orders enter production demand and stock reservations. Status changes here do not send emails or dispatch anything.</p>
      <div className="cm-portal__orderlist">{[...state.orders].sort((a,b)=>a.neededBy.localeCompare(b.neededBy)).map(order=><article key={order.id} className="cm-portal__order">
        <div className="cm-portal__order-top"><div><span className="cm-portal__overline">{order.id} · needed {dayLabel(order.neededBy)}</span><h3>{order.merchantName}</h3></div><StatusLabel status={order.status}/></div>
        <p>{formatOrder(order)}</p>
        {order.notes && <p className="cm-portal__muted">{order.notes}</p>}
        <div className="cm-portal__order-actions">
          {(["accepted","scheduled","fulfilled","cancelled"] as const).filter(next=>nextOrderStatus(order.status,next)).map(next=>
            <button type="button" key={next} className="cm-portal__button" onClick={()=>changeOrder(order.id,next)}>
              Mark {next}
            </button>)}
          {!["requested","accepted","scheduled"].includes(order.status) && <span className="cm-portal__muted">Closed in the demo ledger</span>}
        </div>
      </article>)}</div>
    </section>}

    {view==="ingredients" && <section className="cm-portal__panel">
      <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">INGREDIENT REPLENISHMENT</p><h2>Stock & reorder forecast</h2></div><span>{forecasts.length} ingredients</span></div>
      <p className="cm-portal__muted">Calculated from modeled batches, accepted/scheduled trade demand, finished-volume equivalents, lead times and buffer quantities. A suggested purchase is not a real supplier order. Incoming quantities are assumed available for the forecast regardless of delivery timing.</p>
      <div className="cm-portal__tablewrap"><table className="cm-portal__table">
        <thead><tr><th>Ingredient / supplier</th><th>On hand</th><th>Incoming</th><th>Needed for plan</th><th>Safety</th><th>Reorder point</th><th>Lead</th><th>Suggested / by</th><th>Demo action</th></tr></thead>
        <tbody>{forecasts.map(entry=><tr key={entry.item.id}>
          <th scope="row"><strong>{entry.item.name}</strong><small>{entry.item.supplier} · {entry.item.unit}</small></th>
          <td><DemoQuantity value={entry.item.onHand} unit={entry.item.unit} step={0.1}
            ariaLabel={"On hand " + entry.item.name} onChange={n=>setState(current=>updateIngredient(current,entry.item.id,"onHand",n))}/></td>
          <td><DemoQuantity value={entry.item.incoming} unit={entry.item.unit} step={0.1}
            ariaLabel={"Incoming " + entry.item.name} onChange={n=>setState(current=>updateIngredient(current,entry.item.id,"incoming",n))}/></td>
          <td>{amount(entry.required)} {entry.item.unit}<small>Projected: {amount(entry.projected)}</small></td>
          <td><DemoQuantity value={entry.item.safety} unit={entry.item.unit} step={0.1}
            ariaLabel={"Safety stock " + entry.item.name} onChange={n=>setState(current=>updateIngredient(current,entry.item.id,"safety",n))}/></td>
          <td><DemoQuantity value={entry.item.reorderPoint} unit={entry.item.unit} step={0.1}
            ariaLabel={"Reorder point " + entry.item.name} onChange={n=>setState(current=>updateIngredient(current,entry.item.id,"reorderPoint",n))}/></td>
          <td><DemoQuantity value={entry.item.leadDays} unit="days" step={1} max={365}
            ariaLabel={"Lead time " + entry.item.name} onChange={n=>setState(current=>updateIngredient(current,entry.item.id,"leadDays",n))}/></td>
          <td><StatusForecast status={entry.status}/>
            <strong>{amount(entry.suggestedOrder)} {entry.item.unit}</strong>
            <small>Order by {entry.reorderBy?dayLabel(entry.reorderBy):"as needed"}</small></td>
          <td><button type="button" disabled={entry.suggestedOrder<=0} className="cm-portal__button"
            onClick={()=>addIncoming(entry.item.id,entry.suggestedOrder)}>Add simulated PO qty</button></td>
        </tr>)}</tbody>
      </table></div>
      <p className="cm-portal__muted">A real system must model supplier purchase orders with expected receipt dates, actual recipes/yields, ingredient allocations, wastage and packing constraints. This is a transparent planning demonstration only.</p>
    </section>}

    {view==="production" && <section className="cm-portal__panel">
      <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">ILLUSTRATIVE BILL OF MATERIALS</p><h2>Recipes & batch planning</h2></div><span>{demoRecipes.length} sample recipes</span></div>
      <p className="cm-portal__muted">These are <strong>not Erik's recipes</strong>. All ingredient proportions, yields, can volumes and keg sizes are invented solely to demonstrate shortage calculations.</p>
      <div className="cm-portal__recipe-grid">{production.map(item=><article className="cm-portal__recipe" key={item.recipe.id}>
        <p className="cm-portal__overline">PRODUCTION / {item.recipe.yieldLiters}L PER SAMPLE BATCH</p>
        <h3>{item.recipe.name}</h3>
        <label className="cm-portal__recipe-control">Manually planned batches
          <DemoQuantity value={item.plannedBatches} max={100} ariaLabel={"Planned batches of " + item.recipe.name}
            onChange={n=>setState(current=>changePlannedBatches(current,item.recipe.id,n))}/>
        </label>
        <p><strong>+{item.extraBatches}</strong> extra batches from uncovered accepted demand · <strong>{item.totalBatches}</strong> total modeled</p>
        <p>Committed trade demand: <strong>{amount(item.demandLiters)} L</strong> equivalent</p>
        <p>Finished stock: <strong>{amount(item.finishedLiters)} L</strong> equivalent</p>
        <label className="cm-portal__recipe-control">Target production date
          <input type="date" value={item.targetDate} aria-label={"Target date for "+item.recipe.name}
            onChange={e=>setState(current=>({...current,production:current.production.map(x=>x.recipeId===item.recipe.id?{...x,targetDate:e.target.value}:x)}))}/>
        </label>
        <h4>Illustrative ingredient bill / 1 batch</h4>
        <ul className="cm-portal__bill">{item.recipe.bill.map(line=><li key={line.ingredientId}>
          <span>{state.ingredients.find(i=>i.id===line.ingredientId)?.name??line.ingredientId}</span>
          <strong>{line.perBatch} {state.ingredients.find(i=>i.id===line.ingredientId)?.unit}</strong>
        </li>)}</ul>
      </article>)}</div>
      <p className="cm-portal__muted">Sample volume conversions used: {demoPackVolumes.can} L/can; {demoPackVolumes.six_pack} L/6-pack; {demoPackVolumes.keg} L/keg. Real package sizes and production lead times require Erik's approval.</p>
    </section>}

    {view==="finished" && <section className="cm-portal__panel">
      <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">PACKAGED & KEGGED GOODS / SANDBOX</p><h2>Available format inventory</h2></div><span>Units, not prices</span></div>
      <p className="cm-portal__muted">These are fictional stock counts. Quantity reserved by accepted and scheduled orders is shown separately; requested orders are not reserved. Negative unallocated stock flags a shortfall.</p>
      <div className="cm-portal__tablewrap"><table className="cm-portal__table cm-portal__table--finished">
        <thead><tr><th>Catalog item</th><th>Format</th><th>Stock</th><th>Committed</th><th>Unallocated</th></tr></thead>
        <tbody>{demoProducts.flatMap(product=> (["can","six_pack","keg"] as const).map(format=>{
          const bal=finishedUnitAvailability(state,product.id,format);
          return <tr key={product.id+"-"+format}>
            <th scope="row">{product.name}</th><td>{formatLabels[format]}</td>
            <td><DemoQuantity value={bal.stock} max={100000} ariaLabel={"Finished "+format+" stock for "+product.name}
              onChange={n=>updateFinished(product.id,format,n)}/></td>
            <td>{bal.committed}</td><td><strong className={bal.unallocated<0?"cm-portal__negative":""}>{bal.unallocated}</strong></td>
          </tr>;
        }))}</tbody>
      </table></div>
      <p className="cm-portal__muted">Actual sales require separate SKU codes, lot/batch traceability, packaging equipment and deposit tracking, reliable reservations, physical counts and POS reconciliation.</p>
    </section>}
    <div className="cm-portal__demo-note">THIS IS A FICTIONAL PLANNING SANDBOX — NOT A LIVE INVENTORY, PURCHASE ORDER, OR MERCHANT AUTHORIZATION SYSTEM. <Link href="/portal">Sample logins ↗</Link></div>
  </PortalFrame>;
}
function StatusForecast({status}:{status:"order-now"|"watch"|"covered"}) {
  return <span className={"cm-portal__forecast cm-portal__forecast--"+status}>
    {status==="order-now"?"Order now":status==="watch"?"Upcoming":"Covered"}
  </span>;
}
