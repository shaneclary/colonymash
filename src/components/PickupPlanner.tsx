"use client";

import { useEffect, useMemo, useState } from "react";
import { isPouring, tapList, type Drink } from "@/content/drinks";
import {
  adjustQuantity, canRequest, deliveryProposal, eligibility,
  formatLabels, quantityFor, sanitizeCart, totalUnits,
  type Fulfillment, type NewFormat, type RequestLine,
} from "@/lib/commerce";

const storageKey = "cm-pickup-cart-v2";
const formatChoices: { id: NewFormat; label: string; note: string }[] = [
  { id: "can", label: "Single cans", note: "Request individual cans" },
  { id: "six_pack", label: "6-packs", note: "Each quantity represents one 6-pack" },
  { id: "keg", label: "Kegs", note: "Size and deposit to confirm" },
];
type Category = "all" | "seltzer" | "beer";
const formatWords = { can: "single cans", six_pack: "6-packs", keg: "kegs" } as const;

function QuantityStepper({ label, quantity, onChange }: {
  label: string;
  quantity: number;
  onChange: (delta: number) => void;
}) {
  return <div className="cm-orderflow__stepper" aria-label={label}>
    <button type="button" disabled={quantity === 0} aria-label={"Remove one " + label} onClick={() => onChange(-1)}>−</button>
    <output aria-label={"Quantity of " + label} aria-live="polite">{quantity}</output>
    <button type="button" disabled={quantity >= 99} aria-label={"Add one " + label} onClick={() => onChange(1)}>+</button>
  </div>;
}

export function PickupPlanner({ drinks, initialSlug, contactEmail }: {
  drinks: Drink[];
  initialSlug: string;
  contactEmail: string;
}) {
  const [format, setFormat] = useState<NewFormat>("can");
  const [category, setCategory] = useState<Category>("all");
  const [showArchive, setShowArchive] = useState(!tapList.confirmed);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<RequestLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [fulfillment, setFulfillment] = useState<Fulfillment>("pickup");
  const [name, setName] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    try {
      const raw: unknown = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
      setCart(sanitizeCart(raw, new Set(drinks.map((drink) => drink.slug))));
    } catch { setCart([]); }
    const selected = drinks.find((drink) => drink.slug === initialSlug);
    if (selected) {
      setSearch(selected.name);
      setCategory("all");
      if (!tapList.confirmed || !isPouring(selected)) setShowArchive(true);
    }
    setLoaded(true);
  }, [drinks, initialSlug]);

  useEffect(() => {
    if (!loaded) return;
    try { window.localStorage.setItem(storageKey, JSON.stringify(cart)); }
    catch { /* Private browsing may disable browser storage. */ }
  }, [cart, loaded]);

  const catalog = useMemo(() => {
    const term = search.trim().toLowerCase();
    return drinks.filter((drink) =>
      (showArchive || isPouring(drink)) &&
      (category === "all" || drink.kind === category) &&
      (!term || [drink.name, drink.style, drink.detail ?? ""].join(" ").toLowerCase().includes(term)));
  }, [drinks, search, category, showArchive]);
  const valid = canRequest(cart, fulfillment);
  const allowed = eligibility(cart);
  const count = totalUnits(cart);
  const rows = cart.map((line) => ({
    ...line,
    name: drinks.find((drink) => drink.slug === line.slug)?.name ?? line.slug,
  }));
  const details = [
    "Colony Mash — availability inquiry. Not a paid order.", "",
    ...rows.map((line) => line.quantity + " × " + line.name + " — " + formatLabels[line.format]),
    "", "Preferred fulfillment: " + (fulfillment === "pickup" ? "Pickup at taproom" :
      fulfillment === "county" ? "Proposed delivery in SLO County" : "Proposed delivery within 150 miles"),
    "Customer name: " + (name.trim() || "Not provided"),
    "Preferred date: " + (preferredDate || "Flexible"),
    "Delivery address and notes: " + (notes.trim() || "None"),
    "", "Please confirm which packaged products are available, sizes, prices, deposits, delivery terms, age and ID checks, pickup time and payment steps.",
  ].join("\n");
  const mailto = "mailto:" + contactEmail +
    "?subject=" + encodeURIComponent("Colony Mash cans and kegs — availability inquiry") +
    "&body=" + encodeURIComponent(details);
  const selectedChoice = formatChoices.find((choice) => choice.id === format) ?? formatChoices[0];
  const update = (slug: string, choice: NewFormat, delta: number) => {
    if (drinks.some((drink) => drink.slug === slug)) setCart((current) => adjustQuantity(current, slug, choice, delta));
  };

  return <div className="cm-orderflow">
    <div className="cm-orderflow__steps" aria-label="How it works">
      <span><b>1</b> Choose format</span><span><b>2</b> Tap + beside flavors</span><span><b>3</b> Review request</span>
    </div>

    <section className="cm-orderflow__controls" aria-labelledby="order-format-heading">
      <h3 id="order-format-heading" className="cm-sign-sm">01 / What would you like?</h3>
      <div role="group" aria-label="Choose can or keg format" className="cm-orderflow__formats">
        {formatChoices.map((choice) => <button key={choice.id} type="button"
          className={"cm-orderflow__format" + (choice.id === format ? " cm-orderflow__format--active" : "")}
          aria-pressed={format === choice.id} onClick={() => setFormat(choice.id)}>
          {choice.label}
        </button>)}
      </div>
      <p className="cm-orderflow__hint" role="status">{selectedChoice.note}. Draft pours and packaged stock are separate; availability and prices must be confirmed.</p>
      {tapList.confirmed ?
        <div className="cm-orderflow__categories" role="group" aria-label="Which flavor list to browse">
          <button type="button" aria-pressed={!showArchive} onClick={() => { setShowArchive(false); setSearch(""); }}>Current rotation</button>
          <button type="button" aria-pressed={showArchive} onClick={() => { setShowArchive(true); setSearch(""); }}>All past releases</button>
        </div> :
        <p className="cm-orderflow__hint">The brewery's live rotation is not verified yet. Browse the historical library to ask about a product; none of these formats are confirmed in stock.</p>}
      <div className="cm-orderflow__filters">
        <label className="cm-orderflow__search" htmlFor="order-search">
          <span>Find a flavor</span>
          <input id="order-search" type="search" value={search}
            placeholder="Search flavors or styles…" onChange={(e) => setSearch(e.target.value)} />
        </label>
        <div className="cm-orderflow__categories" role="group" aria-label="Filter by beverage type">
          {([["all", "All"], ["seltzer", "Seltzer"], ["beer", "Beer"]] as const).map(([id,label]) =>
            <button key={id} type="button" aria-pressed={category === id}
              onClick={() => setCategory(id)}>{label}</button>)}
        </div>
      </div>
      <p className="cm-orderflow__count" role="status">{catalog.length} {showArchive ? "CATALOGED RELEASES" : "CURRENT ROTATION RELEASES"} · SELECT {formatWords[format].toUpperCase()}</p>
    </section>

    <section aria-labelledby="order-flavors-heading">
      <h3 id="order-flavors-heading" className="cm-orderflow__heading">02 / Pick your flavors</h3>
      <div className="cm-orderflow__catalog">
        {catalog.map((drink) => {
          const n = quantityFor(cart, drink.slug, format);
          const other = cart.filter((line) => line.slug === drink.slug && line.format !== format);
          return <article key={drink.slug} className="cm-orderflow__item" id={"order-" + drink.slug}>
            <div className={"cm-orderflow__color " + (drink.kind === "seltzer" ?
              "cm-fill--" + drink.flavor : "cm-fill--b" + (drink.shade ?? 3))} aria-hidden="true" />
            <div className="cm-orderflow__item-main">
              <strong className="cm-orderflow__name">{drink.name}</strong>
              <span className="cm-orderflow__detail">{drink.kind === "seltzer" ? "Hard seltzer" : (drink.style || "Beer")} · {drink.abv.toFixed(1)}% ABV</span>
              {other.length > 0 && <span className="cm-orderflow__also">
                Also selected: {other.map((line) => line.quantity + " " + formatLabels[line.format]).join(" · ")}
              </span>}
            </div>
            <QuantityStepper label={formatLabels[format] + " of " + drink.name}
              quantity={n} onChange={(delta) => update(drink.slug, format, delta)} />
          </article>;
        })}
        {catalog.length === 0 && <p className="cm-orderflow__empty">No releases match your search. Try another flavor name or style.</p>}
      </div>
    </section>

    <section id="order-review" className="cm-orderflow__review" aria-labelledby="order-review-heading">
      <div className="cm-orderflow__review-head">
        <div>
          <p className="cm-orderflow__count">03 / YOUR REQUEST</p>
          <h3 id="order-review-heading" className="cm-sign-md">Ready to request?</h3>
        </div>
        <strong className="cm-orderflow__total">{count} selected</strong>
      </div>
      {rows.length === 0 ? <p className="cm-orderflow__empty">Your list is empty. Choose single cans, 6-packs or kegs, then tap + beside any flavor.</p> :
        <ul className="cm-orderflow__summary">
          {rows.map((line) => <li key={line.slug + "|" + line.format}>
            <div className="cm-orderflow__summary-label">
              <strong>{line.name}</strong><span>{formatLabels[line.format]}</span>
            </div>
            <QuantityStepper label={formatLabels[line.format] + " of " + line.name}
              quantity={line.quantity} onChange={(delta) => setCart((current) => adjustQuantity(current, line.slug, line.format, delta))} />
          </li>)}
        </ul>}
      <p className="cm-orderflow__hint">{allowed.kegs} keg{allowed.kegs === 1 ? "" : "s"} in request · Price and package sizes to confirm.</p>
      <div className="cm-orderflow__fulfillment">
        <h4>Pickup or delivery preference</h4>
        <div role="group" aria-label="Fulfillment preference" className="cm-orderflow__destinations">
          <button type="button" aria-pressed={fulfillment === "pickup"} onClick={() => setFulfillment("pickup")}>Taproom pickup</button>
          <button type="button" disabled={!allowed.county} aria-pressed={fulfillment === "county"}
            onClick={() => setFulfillment("county")}>SLO County / 3+ kegs</button>
          <button type="button" disabled={!allowed.regional} aria-pressed={fulfillment === "regional"}
            onClick={() => setFulfillment("regional")}>Up to 150 mi / 5+ kegs</button>
        </div>
        <p className="cm-orderflow__hint">Delivery is not active or guaranteed. These are proposed terms awaiting Erik's approval:
          more than 2 kegs for SLO County; 5 or more kegs for a region up to {deliveryProposal.regionalMaxMiles} miles.
          Address, fees, legal eligibility and scheduling must be confirmed.</p>
        {!valid && <p role="status">Your chosen delivery tier no longer qualifies. Add kegs or choose pickup.</p>}
      </div>
      <div className="cm-orderflow__details">
        <label htmlFor="order-name">Your name <span>(optional)</span>
          <input id="order-name" autoComplete="name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        </label>
        <label htmlFor="order-date">Preferred date <span>(optional)</span>
          <input id="order-date" type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />
        </label>
        <label className="cm-orderflow__notes" htmlFor="order-notes">Notes or delivery address
          <textarea id="order-notes" rows={3} maxLength={900} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Event date, keg details, delivery address, questions…" />
        </label>
      </div>
      {cart.length > 0 && valid ?
        <a className="cm-orderflow__submit" href={mailto}>Open email availability request ↗</a> :
        <button type="button" className="cm-orderflow__submit" disabled>Open email availability request ↗</button>}
      <p className="cm-orderflow__fine">This opens your email app. The request is not submitted until you send the email, and it is not a confirmed or paid order. Brewery staff must confirm products, prices, ID requirements, pickup or delivery arrangements and next steps.</p>
    </section>
    <a className="cm-orderflow__mobilecart" href="#order-review" aria-label={"Review request, " + count + " selected units"}>
      <span>REVIEW REQUEST</span><strong>{count} selected ↗</strong>
    </a>
  </div>;
}
