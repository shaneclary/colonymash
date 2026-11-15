import Link from "next/link";
import { routes, site } from "@/content/site";
import { FlightStrip } from "./FlightStrip";
import { StatusMini } from "./LiveStatus";
import { NavLinks } from "./NavLinks";

export function Header() {
  return (
    <header data-theme="ink" className="cm-root">
      <div className="cm-header cm-wrap">
        <Link className="cm-header__brand cm-brand" href={routes.home}>
          <span className="cm-logo" aria-hidden="true" />
          <span className="cm-sign-sm">{site.name}</span>
        </Link>
        <nav className="cm-header__navwrap" aria-label="Main">
          <NavLinks />
        </nav>
        <div className="cm-header__side">
          <StatusMini />
        </div>
      </div>
      <FlightStrip />
    </header>
  );
}
