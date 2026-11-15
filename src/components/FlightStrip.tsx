import Link from "next/link";
import { allSeltzers, formatAbv, isPouring, seltzersPouring } from "@/content/drinks";
import { drinkPath } from "@/content/site";

/** The thin line under the header: one stripe per seltzer on tap. */
export function FlightStrip() {
  if (seltzersPouring.length === 0) return <div className="cm-strip" aria-hidden="true" />;
  const names = seltzersPouring.map((seltzer) => seltzer.name).join(", ");
  return (
    <div className="cm-strip" role="img" aria-label={`Seltzers on tap: ${names}`}>
      {seltzersPouring.map((seltzer) => (
        <span className={`cm-fill--${seltzer.flavor}`} key={seltzer.slug} />
      ))}
    </div>
  );
}

/**
 * The wall of color: every seltzer as a block of its own color, red around to berry, each linked to its page.
 * A full dot marks the ones on tap. An empty ring means not pouring right now.
 */
export function Flight() {
  return (
    <ul className="cm-flight" aria-label="Every seltzer flavor">
      {allSeltzers.map((seltzer) => {
        const pouring = isPouring(seltzer);
        return (
          <li key={seltzer.slug}>
            <Link className={`cm-flight__glass cm-flavor--${seltzer.flavor}`} href={drinkPath(seltzer.slug)}>
              <span className={`cm-dot${pouring ? " cm-dot--full" : ""}`} aria-hidden="true" />
              <span className="cm-flight__name cm-body-strong">
                {seltzer.name}
                <span className="cm-sr">{pouring ? ", on tap" : ", not pouring right now"}</span>
              </span>
              <span className="cm-data">{formatAbv(seltzer.abv)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
