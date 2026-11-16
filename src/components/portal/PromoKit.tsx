"use client";

import { useState } from "react";
import { drinks, seltzerProcess, type Drink } from "@/content/drinks";
import { photos, type PhotoSlot } from "@/content/photos";
import { story } from "@/content/story";
import { site } from "@/content/site";
import { Confirm } from "@/components/Confirm";

const menuLine = (drink: Drink) => drink.name + " · " + (drink.style || (drink.kind === "seltzer" ? "Hard seltzer" : "Beer")) + " · " + drink.abv.toFixed(1) + "% ABV";
const withNote = (drink: Drink) => menuLine(drink) + ("description" in drink && drink.description ? "\n" + drink.description : "");
const pictures = (Object.values(photos) as PhotoSlot[]).filter(x => x.src);

/** Names, descriptions, the story and photos a wholesale account can put on menus and ads. */
export function PromoKit({ onFeedback }: { onFeedback: (message: string) => void }) {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<"all" | "seltzer" | "beer">("all");
  const shown = drinks.filter(x => (kind === "all" || x.kind === kind) && (!search.trim() || x.name.toLowerCase().includes(search.trim().toLowerCase())));
  async function copy(text: string, what: string) {
    try { await navigator.clipboard.writeText(text); onFeedback("Copied " + what + "."); }
    catch { onFeedback("Copy is blocked in this browser. Select the text and copy it by hand."); }
  }
  return <>
    <section className="cm-portal__panel" data-tour="promo">
      <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">Promo kit</p><h2>For your menus, ads and posts</h2></div></div>
      <p>Copy a menu line, the brewery's story, or download a photo. Everything here is the same wording the brewery's own site uses.</p>
    </section>
    <div className="cm-portal__two">
      <section className="cm-portal__panel">
        <div className="cm-portal__panel-head"><h2>About {site.name}</h2>{story.draft && <Confirm id="story"/>}</div>
        <p><strong>{story.lede}</strong></p>
        {story.paragraphs.slice(0, 3).map(text => <p className="cm-portal__muted" key={text}>{text}</p>)}
        <div className="cm-portal__order-actions">
          <button type="button" className="cm-portal__button cm-portal__button--dark" onClick={() => copy(story.lede, "the one-line description")}>Copy one line</button>
          <button type="button" className="cm-portal__button" onClick={() => copy([story.lede, ...story.paragraphs].join("\n\n"), "the full story")}>Copy the full story</button>
        </div>
        {story.draft && <p className="cm-portal__muted">Draft wording. The owners have not approved it yet.</p>}
        <div className="cm-portal__panel-head"><h2>How the seltzers are made</h2><Confirm id="process"/></div>
        <p>{seltzerProcess}</p>
        <button type="button" className="cm-portal__button" onClick={() => copy(seltzerProcess, "the seltzer line")}>Copy</button>
      </section>
      <section className="cm-portal__panel">
        <div className="cm-portal__panel-head"><h2>Photos</h2><span>{pictures.length} files</span></div>
        <div className="cm-portal__promo-photos">{pictures.map(photo => <figure key={photo.id}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.src} alt={photo.alt ?? photo.title} width={photo.width} height={photo.height} loading="lazy"
            className={photo.treatment === "bw" ? "cm-portal__promo-bw" : ""}/>
          <figcaption><strong>{photo.title}</strong>
            {photo.rightsConfirmed
              ? <a className="cm-portal__button" href={photo.src} download>Download ↓</a>
              : <span className="cm-portal__muted">Not cleared for use yet. <Confirm id="photos"/></span>}
          </figcaption>
        </figure>)}</div>
        <p className="cm-portal__muted">Only photos the brewery has cleared can be downloaded. Logo files come once the owners supply them. <Confirm id="brand-files"/></p>
      </section>
    </div>
    <section className="cm-portal__panel cm-portal__print">
      <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">Menu lines</p><h2>Names, styles and ABV</h2></div>
        <span className="cm-portal__no-print cm-portal__order-actions">
          <button type="button" onClick={() => copy(shown.map(menuLine).join("\n"), shown.length + " menu lines")}>Copy all {shown.length} shown ↗</button>
          <button type="button" onClick={() => window.print()}>Print this list ↗</button></span></div>
      <div className="cm-portal__catalog-filter cm-portal__no-print">
        <label htmlFor="promo-search">Find a drink<input id="promo-search" type="search" value={search} onChange={e => setSearch(e.target.value)}/></label>
        <div role="group" aria-label="Filter drinks" className="cm-portal__catalog-filter-buttons">
          {([["all", "All"], ["seltzer", "Seltzers"], ["beer", "Beer"]] as const).map(([key, label]) =>
            <button type="button" key={key} aria-pressed={kind === key} onClick={() => setKind(key)}>{label}</button>)}
        </div>
      </div>
      <ul className="cm-portal__promo-lines">{shown.map(drink => <li key={drink.slug}>
        <span className={"cm-portal__stock-dot " + (drink.kind === "seltzer" ? "cm-fill--" + drink.flavor : "cm-fill--b2")} aria-hidden="true"/>
        <div><strong>{drink.name}</strong><span>{(drink.style || (drink.kind === "seltzer" ? "Hard seltzer" : "Beer"))} · {drink.abv.toFixed(1)}% ABV</span>
          {"description" in drink && drink.description && <span>{drink.description}</span>}</div>
        <button type="button" className="cm-portal__button cm-portal__no-print" onClick={() => copy(withNote(drink), drink.name)}>Copy</button>
      </li>)}</ul>
      <p className="cm-portal__muted cm-portal__no-print">This is the full release list, not what is available to order today. Check the catalog for that. Filter the list first to print only the drinks you carry.</p>
    </section>
  </>;
}
