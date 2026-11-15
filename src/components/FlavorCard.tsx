import Link from "next/link";
import { formatAbv, isPouring, type Seltzer } from "@/content/drinks";
import { drinkPath } from "@/content/site";

/**
 * A seltzer as a block of its own color. Only a seltzer that is pouring gets the color;
 * one that is off the list is a dashed, grey card with the same words.
 */
export function FlavorCard({ seltzer }: { seltzer: Seltzer }) {
  const pouring = isPouring(seltzer);
  const state = pouring ? "On tap" : seltzer.kickedAt ? `Kicked ${seltzer.kickedAt}` : "Not pouring";
  return (
    <article className={pouring ? `cm-flavorcard cm-flavor cm-flavor--${seltzer.flavor}` : "cm-flavorcard cm-flavorcard--off"}>
      <div className="cm-flavorcard__top">
        <span className="cm-label">Hard seltzer</span>
        <span className="cm-mini cm-small">
          <span className={`cm-dot${pouring ? " cm-dot--full" : ""}`} aria-hidden="true" />
          {state}
        </span>
      </div>
      <div className="cm-flavorcard__name">
        <h3 className="cm-shout">
          <Link href={drinkPath(seltzer.slug)}>{seltzer.name}</Link>
        </h3>
      </div>
      <div className="cm-flavorcard__foot">
        <span className="cm-data-lg">{formatAbv(seltzer.abv)}</span>
      </div>
    </article>
  );
}
