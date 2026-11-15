import Link from "next/link";
import { formatAbv, isPouring, tapList, type Seltzer } from "@/content/drinks";
import { drinkPath } from "@/content/site";

/**
 * A seltzer as a block of its own color. Every seltzer wears its color.
 * One that is on tap has a solid edge and a full dot; one that is not pouring has a dashed edge and an empty ring.
 */
export function FlavorCard({ seltzer }: { seltzer: Seltzer }) {
  const pouring = isPouring(seltzer);
  const state = !tapList.confirmed ? "Sample tap status" : pouring ? "On tap" : seltzer.kickedAt ? `Kicked ${seltzer.kickedAt}` : "Not pouring";
  return (
    <article className={`cm-flavorcard cm-flavor cm-flavor--${seltzer.flavor}${pouring ? "" : " cm-flavorcard--rest"}`}>
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
