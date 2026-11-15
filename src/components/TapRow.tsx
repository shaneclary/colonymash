import Link from "next/link";
import { formatAbv, type Drink } from "@/content/drinks";
import { drinkPath } from "@/content/site";
import { DrinkChip } from "./DrinkChip";

/** One line of the tap list: chip, name, style, ABV. */
export function TapRow({ drink }: { drink: Drink }) {
  const kicked = Boolean(drink.kickedAt);
  const meta = [drink.style, drink.detail].filter(Boolean).join(" · ");
  return (
    <li className={`cm-tap${kicked ? " cm-tap--kicked" : ""}`}>
      <DrinkChip drink={drink} />
      <div className="cm-tap__main">
        <p className="cm-tap__name">
          <Link className="cm-tap__beer cm-body-strong" href={drinkPath(drink.slug)}>
            {drink.name}
          </Link>
          {drink.isNew ? <span className="cm-tag cm-tag--solid cm-label">New</span> : null}
          {drink.lastKeg && !kicked ? <span className="cm-tag cm-label">Last keg</span> : null}
          {kicked ? <span className="cm-tag cm-tag--dashed cm-label">Kicked {drink.kickedAt}</span> : null}
        </p>
        {meta ? <p className="cm-tap__meta cm-data">{meta}</p> : null}
      </div>
      <p className="cm-tap__abv cm-data-lg">{formatAbv(drink.abv)}</p>
    </li>
  );
}
