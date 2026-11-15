
"use client";
import { useEffect, useState } from "react";
import type { Drink } from "@/content/drinks";
import { canRequest, deliveryProposal, eligibility, type Format, type Fulfillment, type RequestLine } from "@/lib/commerce";
const storageKey = "cm-pickup-cart-v2";
function cleanCart(data: unknown, drinks: Drink[]): RequestLine[] {
  if (!Array.isArray(data)) return [];
  const known = new Set(drinks.map((drink) => drink.slug));
  return data.filter((line): line is RequestLine => Boolean(line && typeof line === "object" &&
    known.has(line.slug) && (line.format === "keg" || line.format === "cans") &&
    Number.isSafeInteger(line.quantity) && line.quantity > 0 && line.quantity <= 99)).slice(0, 70);
}
export function PickupPlanner({ drinks, initialSlug, contactEmail }: { drinks: Drink[]; initialSlug: string; contactEmail: string }) {
  const [slug, setSlug] = useState(initialSlug || drinks[0]?.slug || "");
  const [format, setFormat] = useState<Format>("cans");
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState<RequestLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [destination, setDestination] = useState<Fulfillment>("pickup");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  useEffect(() => {
    try { setCart(cleanCart(JSON.parse(localStorage.getItem(storageKey) || "[]"), drinks)); }
    catch { setCart([]); }
    setLoaded(true);
  }, [drinks]);
  useEffect(() => {
    if (loaded) try { localStorage.setItem(storageKey, JSON.stringify(cart)); } catch { /* unavailable storage */ }
  }, [loaded, cart]);
  const eligible = eligibility(cart);
  const allowed = canRequest(cart, destination);
  function add() {
    if (!drinks.some((drink) => drink.slug === slug)) return;
    const n = Number.isFinite(qty) ? Math.max(1, Math.min(99, Math.floor(qty))) : 1;
    setCart((current) => {
      const match = current.find((line) => line.slug === slug && line.format === format);
      return match ? current.map((line) => line === match ? { ...line, quantity: Math.min(99, line.quantity + n) } : line) :
        [...current, { slug, format, quantity: n }];
    });
  }
  const rows = cart.map((line) => ({ ...line, name: drinks.find((drink) => drink.slug === line.slug)?.name || line.slug }));
  const details = [
    "Colony Mash: product availability inquiry (NOT an order or payment)", "",
    ...rows.map((line) => line.quantity + " x " + line.name + " — " + (line.format === "keg" ? "keg (size TBD)" : "cans (pack TBD)")),
    "", "Preference: " + (destination === "pickup" ? "Taproom pickup" : destination === "county" ? "Proposed SLO County delivery" : "Proposed delivery within 150 miles"),
    "Name: " + (name.trim() || "Not supplied"), "Preferred date: " + (date || "Flexible"),
    "Notes / delivery address: " + (notes.trim() || "None"), "",
    "Please confirm products, packaging, price, deposits, fees, sale eligibility, delivery area, timing and payment instructions."
  ].join("\n");
  const mailto = "mailto:" + contactEmail + "?subject=" + encodeURIComponent("Colony Mash cans & kegs request") + "&body=" + encodeURIComponent(details);
  return <div className="cm-order-layout">
    <div className="cm-stack cm-stack--lg cm-stack--fill">
      <label className="cm-body-strong" htmlFor="order-drink">01 / Choose a release
        <select className="cm-field" id="order-drink" value={slug} onChange={(event) => setSlug(event.target.value)}>
          {drinks.map((drink) => <option key={drink.slug} value={drink.slug}>{drink.name} — {drink.kind === "seltzer" ? "Seltzer" : "Beer"}</option>)}
        </select>
      </label>
      <label className="cm-body-strong" htmlFor="order-format">02 / Choose a format
        <select className="cm-field" id="order-format" value={format} onChange={(event) => setFormat(event.target.value as Format)}>
          <option value="cans">Cans — pack size to confirm</option><option value="keg">Keg — size and deposit to confirm</option>
        </select>
      </label>
      <label className="cm-body-strong" htmlFor="order-qty">03 / Quantity
        <input className="cm-field" id="order-qty" type="number" min="1" max="99" value={qty} onChange={(event) => setQty(Number(event.target.value))} />
      </label>
      <button type="button" className="cm-btn cm-btn--primary cm-body-strong" onClick={add}>Add to request</button>
      <p className="cm-small cm-soft">This is the full release library, not confirmed packaged stock. The brewery must verify which beers or seltzers are available in cans or kegs.</p>
      <div className="cm-stack cm-stack--fill">
        <h2 className="cm-sign-md">04 / Pickup or delivery</h2>
        <div className="cm-chips" role="group" aria-label="Fulfillment preference">
          <button type="button" className="cm-chip cm-body-strong" aria-pressed={destination === "pickup"} onClick={() => setDestination("pickup")}>Pickup</button>
          <button type="button" className="cm-chip cm-body-strong" aria-pressed={destination === "county"} disabled={!eligible.county} onClick={() => setDestination("county")}>SLO County · 3+ kegs</button>
          <button type="button" className="cm-chip cm-body-strong" aria-pressed={destination === "regional"} disabled={!eligible.regional} onClick={() => setDestination("regional")}>Within 150 mi · 5+ kegs</button>
        </div>
        <p className="cm-small cm-soft">Delivery is a <strong>proposal for Erik to confirm</strong>: more than 2 kegs for SLO County; 5 or more kegs for up to {deliveryProposal.regionalMaxMiles} miles. Eligibility by keg count does not verify the destination, price, or legal authorization.</p>
        {!allowed && <p className="cm-small" role="status">The request no longer meets that delivery threshold. Add kegs or choose pickup.</p>}
      </div>
    </div>
    <aside className="cm-stack cm-stack--lg cm-stack--fill">
      <h2 className="cm-sign-md">Your request</h2>
      {rows.length === 0 ? <p className="cm-body">Nothing selected yet.</p> : <ul className="cm-order-lines">
        {rows.map((line) => <li className="cm-order-line" key={line.slug + line.format}>
          <strong className="cm-body-strong">{line.quantity} × {line.name}</strong>
          <span className="cm-data">{line.format === "keg" ? "Keg" : "Cans"}</span>
          <button className="cm-link cm-small" type="button" onClick={() => setCart((previous) => previous.filter((item) => !(item.slug === line.slug && item.format === line.format)))}>Remove</button>
        </li>)}
      </ul>}
      <p className="cm-data">{eligible.kegs} keg(s) · Price to confirm</p>
      <label className="cm-body-strong" htmlFor="request-name">Name (optional)
        <input className="cm-field" id="request-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="cm-body-strong" htmlFor="request-date">Preferred date (optional)
        <input className="cm-field" id="request-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label className="cm-body-strong" htmlFor="request-notes">Notes or delivery address
        <textarea className="cm-field" id="request-notes" rows={3} value={notes} maxLength={900} onChange={(e) => setNotes(e.target.value)} />
      </label>
      {rows.length > 0 && allowed ? <a className="cm-btn cm-btn--primary cm-body-strong" href={mailto}>Email availability request</a> :
        <button className="cm-btn cm-body-strong" type="button" disabled>Email availability request</button>}
      <p className="cm-small cm-soft">Opens your email app. This does not submit a paid or confirmed order. Online checkout requires the brewery's POS, verified inventory and prices, and approval of compliant sale and pickup procedures.</p>
    </aside>
  </div>;
}
