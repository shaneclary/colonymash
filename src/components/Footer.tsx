import Link from "next/link";
import { schedule } from "@/content/hours";
import { questions } from "@/content/questions";
import { nav, routes, site } from "@/content/site";
import { summarizeWeek } from "@/lib/status";

export function Footer() {
  const week = summarizeWeek(schedule.weekly);
  return (
    <footer data-theme="ink" className="cm-section cm-root">
      <div className="cm-wrap">
        <div className="cm-footer">
          <span className="cm-logo cm-logo--footer" role="img" aria-label={`${site.fullName} logo`} />
          <div className="cm-stack">
            <h2 className="cm-label">Find us</h2>
            <address className="cm-loc__addr cm-body">
              {site.address.street}
              <br />
              {site.address.city}, {site.address.region} {site.address.postalCode}
            </address>
            <p className="cm-small cm-soft">{site.landmark}.</p>
            <a className="cm-link cm-body-strong" href={site.directionsUrl}>
              Get directions
            </a>
          </div>
          <div className="cm-stack">
            <h2 className="cm-label">Hours</h2>
            <ul className="cm-footer__list">
              {week.map((group) => (
                <li className="cm-data" key={group.days}>
                  {group.days} · {group.text}
                </li>
              ))}
            </ul>
            <p className="cm-small cm-soft">Pacific time.</p>
          </div>
          <div className="cm-stack">
            <h2 className="cm-label">Say hello</h2>
            <ul className="cm-footer__list">
              <li>
                <a className="cm-link cm-body" href={site.phone.href}>
                  {site.phone.display}
                </a>
              </li>
              <li>
                <a className="cm-link cm-body" href={`mailto:${site.email}`}>
                  {site.email}
                </a>
              </li>
              <li>
                <a className="cm-link cm-body" href={site.instagram.url}>
                  Instagram {site.instagram.handle}
                </a>
              </li>
            </ul>
            <ul className="cm-footer__list">
              {[...nav, { label: "Our story", href: routes.story }].map((link) => (
                <li key={link.href}>
                  <Link className="cm-link cm-body" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="cm-footer__base cm-small">
          <span>
            © {new Date().getFullYear()} {site.fullName}
          </span>
          {site.reviewMode ? (
            <>
              <Link className="cm-link" href={routes.confirm}>Draft site: {questions.length} things to confirm</Link>
              <Link className="cm-link" href={routes.portal}>Staff &amp; Merchant Demo ↗</Link>
            </>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
