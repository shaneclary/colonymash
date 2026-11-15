
"use client";
import { useState } from "react";
import Link from "next/link";
import { FlavorCard } from "@/components/FlavorCard";
import { DrinkChip } from "@/components/DrinkChip";
import { drinkPath } from "@/content/site";
import { formatAbv, type Drink, type Seltzer, type Beer } from "@/content/drinks";
export function CatalogExplorer({ drinks }: { drinks: Drink[] }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const found = drinks.filter((drink) => (kind === "all" || drink.kind === kind) &&
    [drink.name, drink.style, drink.detail ?? "", drink.description ?? ""].join(" ").toLowerCase().includes(query.trim().toLowerCase()));
  const seltzers = found.filter((drink): drink is Seltzer => drink.kind === "seltzer");
  const beers = found.filter((drink): drink is Beer => drink.kind === "beer");
  return <div className="cm-stack cm-stack--lg cm-stack--fill">
    <label className="cm-body-strong" htmlFor="flavor-search">Find a release
      <input className="cm-field" id="flavor-search" type="search" placeholder="Flavor, beer or style" value={query} onChange={(e) => setQuery(e.target.value)} />
    </label>
    <div className="cm-chips" role="group" aria-label="Beverage type">
      {["all","seltzer","beer"].map((item) => <button key={item} type="button" className="cm-chip cm-body-strong" aria-pressed={kind === item} onClick={() => setKind(item)}>
        {item === "all" ? "Everything" : item === "seltzer" ? "Hard seltzer" : "Beer"}
      </button>)}
    </div>
    <p className="cm-data" role="status">{found.length} releases</p>
    {seltzers.length > 0 && <section className="cm-stack cm-stack--lg cm-stack--fill">
      <h2 className="cm-sign-lg">Seltzer in color</h2><ul className="cm-cards">{seltzers.map((drink) => <li key={drink.slug}><FlavorCard seltzer={drink} /></li>)}</ul>
    </section>}
    {beers.length > 0 && <section className="cm-stack cm-stack--lg cm-stack--fill">
      <h2 className="cm-sign-lg">Beer in black and white</h2><ul className="cm-order-lines">
        {beers.map((beer) => <li className="cm-explore-beer" key={beer.slug}><DrinkChip drink={beer} />
          <Link className="cm-body-strong" href={drinkPath(beer.slug)}>{beer.name}</Link>
          <span className="cm-data">{beer.style} · {formatAbv(beer.abv)}</span></li>)}
      </ul>
    </section>}
    {found.length === 0 && <p className="cm-body">No matching releases. Try another name or style.</p>}
    <p className="cm-small cm-soft">Historical releases, not a verified inventory or live tap list. Product and pickup availability must be confirmed by the brewery.</p>
  </div>;
}
