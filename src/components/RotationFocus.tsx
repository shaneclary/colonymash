import Link from "next/link";
import { drinksOnTap, tapList, type Drink } from "@/content/drinks";
import { drinkPath, routes, site } from "@/content/site";
import { formatAbv } from "@/content/drinks";
import { selectConfirmedRotation } from "@/lib/rotation";

/**
 * The sole launch-facing presentation of the current rotation.
 * IMPORTANT: until Erik verifies the list, the historical sample rows are hidden.
 */
export function RotationFocus({ compact = false }: { compact?: boolean }) {
  if (!tapList.confirmed) {
    return <div className="cm-rotation-pending">
      <span className="cm-rotation-pending__eyebrow">CURRENT TAP ROTATION / AWAITING VERIFICATION</span>
      <h3 className="cm-sign-md">The real tap list comes first.</h3>
      <p className="cm-body">We're confirming the current pours with the brewery. The older release catalog is still available to explore, but we won't call a historical flavor “on tap” until it's verified.</p>
      <div className="cm-rotation-pending__actions">
        <a className="cm-btn cm-btn--primary cm-body-strong" href={site.phone.href}>Ask what's pouring</a>
        <Link className="cm-btn cm-body-strong" href={routes.explore}>Browse past releases</Link>
      </div>
    </div>;
  }

  const current = selectConfirmedRotation(drinksOnTap, tapList.confirmed);
  if (current.length === 0) {
    return <div className="cm-rotation-pending">
      <h3 className="cm-sign-md">Today's list is being updated.</h3>
      <p className="cm-body">No current pours are listed right now. Check back or call the taproom.</p>
      <a className="cm-btn cm-btn--primary cm-body-strong" href={site.phone.href}>Call the taproom</a>
    </div>;
  }

  const seltzers = current.filter((drink) => drink.kind === "seltzer");
  const beers = current.filter((drink) => drink.kind === "beer");

  return <div className={"cm-current-rotation" + (compact ? " cm-current-rotation--compact" : "")}>
    <p className="cm-current-rotation__stamp">
      BREWERY-CONFIRMED ROTATION · {tapList.updated ?? "UPDATE TIME NOT PROVIDED"}
    </p>
    <div className="cm-current-rotation__groups">
      {seltzers.length > 0 && <RotationGroup title="Hard seltzer, in color" drinks={seltzers}/>}
      {beers.length > 0 && <RotationGroup title="Beer, in black and white" drinks={beers}/>}
    </div>
    <p className="cm-small">Tap availability can change during service. Packaged can and keg availability is separate and must be confirmed with staff.</p>
  </div>;
}

function RotationGroup({ title, drinks }: { title: string; drinks: Drink[] }) {
  return <section className="cm-current-rotation__group" aria-label={title}>
    <h3>{title} <span>{drinks.length}</span></h3>
    <ul className="cm-current-rotation__list">
      {drinks.map((drink) => <li key={drink.slug}>
        <span className={"cm-current-rotation__swatch " + (drink.kind === "seltzer" ?
          "cm-fill--" + drink.flavor : "cm-fill--b" + (drink.shade ?? 3))} aria-hidden="true"/>
        <div className="cm-current-rotation__product">
          <Link href={drinkPath(drink.slug)}>{drink.name}</Link>
          <span>{drink.style || (drink.kind === "seltzer" ? "Hard seltzer" : "Beer")} · {formatAbv(drink.abv)}</span>
        </div>
        <Link className="cm-current-rotation__action" href={routes.order + "?drink=" + encodeURIComponent(drink.slug)}>Ask to go ↗</Link>
      </li>)}
    </ul>
  </section>;
}
