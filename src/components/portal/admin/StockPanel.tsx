"use client";

import { useState, type FormEvent } from "react";
import { demoProducts, packLabels, type PackFormat } from "@/content/portal-demo";
import { finishedUnitAvailability } from "@/lib/portal-forecast";
import { addFinishedStock, setFinishedStock, type PackCounts } from "@/lib/production";
import { Confirm } from "@/components/Confirm";
import { productName, type PanelProps } from "../format";

const formats: PackFormat[] = ["can", "six_pack", "keg"];
const zero: PackCounts = { can: 0, six_pack: 0, keg: 0 };
const whole = (text: string) => { const n = Number(text); return text.trim() !== "" && Number.isSafeInteger(n) && n >= 0 ? n : null; };

/** Number boxes for cans, packs and kegs. Shared by Add stock and Package a batch. */
export function PackFields({ value, onChange, idPrefix }: { value: PackCounts; onChange: (next: PackCounts) => void; idPrefix: string }) {
  return <div className="cm-portal__triple">{formats.map(format => <label key={format} htmlFor={idPrefix + format}>{packLabels[format]}
    <input id={idPrefix + format} type="number" inputMode="numeric" min={0} max={100000} step={1} value={value[format]}
      onChange={e => { const n = whole(e.target.value); if (n !== null) onChange({ ...value, [format]: n }); }}/></label>)}</div>;
}

/** Packaged stock: add cans, packs and kegs for any drink, and correct counts. */
export function StockPanel({ state, commit, run }: PanelProps) {
  const [productId, setProductId] = useState(demoProducts[0]?.id ?? "");
  const [add, setAdd] = useState<PackCounts>(zero);
  const rows = [...state.finished].sort((a, b) => productName(a.productId).localeCompare(productName(b.productId)));
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (run("Added stock: " + productName(productId), s => addFinishedStock(s, productId, add))) setAdd(zero);
  }
  return <>
    <section className="cm-portal__panel">
      <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">Packaged stock</p><h2>Add cans, packs and kegs</h2></div><Confirm id="pack-size"/></div>
      <form className="cm-portal__form" onSubmit={submit}>
        <label htmlFor="stock-product">Drink
          <select id="stock-product" value={productId} onChange={e => setProductId(e.target.value)}>
            {demoProducts.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <PackFields value={add} onChange={setAdd} idPrefix="stock-add-"/>
        <button type="submit" className="cm-portal__button cm-portal__button--dark">Add to stock</button>
      </form>
      <p className="cm-portal__muted">Adds to what is already there. Packaging a batch from Production adds stock the same way.</p>
    </section>
    <section className="cm-portal__panel">
      <div className="cm-portal__panel-head"><h2>On hand</h2><span>{rows.length} drinks in stock</span></div>
      <p className="cm-portal__muted">Type over a count to correct it. Committed is what accepted and scheduled orders have claimed. Free below zero means a shortfall.</p>
      {rows.length === 0 && <p className="cm-portal__muted">Nothing in stock yet.</p>}
      <div className="cm-portal__stock-cards">{rows.map(row => <article className="cm-portal__stock-card" key={row.productId}>
        <h3>{productName(row.productId)}</h3>
        <div className="cm-portal__triple">{formats.map(format => {
          const balance = finishedUnitAvailability(state, row.productId, format);
          return <label key={format}>{packLabels[format]}
            <input type="number" inputMode="numeric" min={0} max={100000} step={1} value={balance.stock}
              aria-label={packLabels[format] + " of " + productName(row.productId)}
              onChange={e => { const n = whole(e.target.value); if (n !== null) commit("Corrected " + packLabels[format].toLowerCase() + " of " + productName(row.productId), s => setFinishedStock(s, row.productId, format, n)); }}/>
            <small>{balance.committed} committed · <b className={balance.unallocated < 0 ? "cm-portal__negative" : ""}>{balance.unallocated} free</b></small>
          </label>;
        })}</div>
      </article>)}</div>
    </section>
  </>;
}
