"use client";

// The whole tap list with three filter chips. Seltzers come first, in color order; beers follow, light to dark.
import { useState } from "react";
import { beersOnTap, seltzersOnTap, type Drink } from "@/content/drinks";
import { TapRow } from "./TapRow";

type Filter = "all" | "seltzer" | "beer";
const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "seltzer", label: "Seltzer" },
  { id: "beer", label: "Beer" },
];

function Group({ title, drinks }: { title: string; drinks: Drink[] }) {
  if (drinks.length === 0) return null;
  return (
    <section aria-label={title}>
      <h2 className="cm-taps__group">
        <span className="cm-sign-sm">{title}</span>
        <span className="cm-data">{drinks.length}</span>
      </h2>
      <ul className="cm-taps__list">
        {drinks.map((drink) => (
          <TapRow drink={drink} key={drink.slug} />
        ))}
      </ul>
    </section>
  );
}

export function TapList() {
  const [filter, setFilter] = useState<Filter>("all");
  return (
    <div className="cm-taps">
      <div className="cm-chips" role="group" aria-label="Show">
        {filters.map((option) => (
          <button className="cm-chip cm-body-strong" type="button" aria-pressed={filter === option.id} onClick={() => setFilter(option.id)} key={option.id}>
            {option.label}
          </button>
        ))}
      </div>
      {filter !== "beer" ? <Group title="Seltzer" drinks={seltzersOnTap} /> : null}
      {filter !== "seltzer" ? <Group title="Beer" drinks={beersOnTap} /> : null}
    </div>
  );
}
