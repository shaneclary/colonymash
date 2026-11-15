import Link from "next/link";
import { formatAbv, seltzersPouring } from "@/content/drinks";
import { drinkPath } from "@/content/site";

/** The thin line under the header: one stripe per seltzer pouring. It is the only color in the site's frame. */
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

/** The tall version: each seltzer pouring as a block of its own color, linked to its page. */
export function Flight() {
  if (seltzersPouring.length === 0) return null;
  return (
    <ul className="cm-flight" aria-label="Seltzers on tap">
      {seltzersPouring.map((seltzer) => (
        <li key={seltzer.slug}>
          <Link className={`cm-flight__glass cm-flavor--${seltzer.flavor}`} href={drinkPath(seltzer.slug)}>
            <span className="cm-body-strong">{seltzer.name}</span>
            <span className="cm-data">{formatAbv(seltzer.abv)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
