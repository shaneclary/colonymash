import { elsewhere } from "@/content/elsewhere";

const dateLabel = (isoDate: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${isoDate}T12:00:00Z`));

/** Other places pouring Colony Mash. Stays off the page until src/content/elsewhere.ts has accounts and a date. */
export function OnTapElsewhere() {
  if (elsewhere.accounts.length === 0 || !elsewhere.updated) return null;
  return (
    <section data-theme="paper" className="cm-section cm-root" aria-labelledby="elsewhere">
      <div className="cm-wrap cm-stack cm-stack--fill">
        <div className="cm-section__head">
          <h2 className="cm-sign-lg" id="elsewhere">
            On tap elsewhere
          </h2>
          <span className="cm-fresh cm-data">Checked {dateLabel(elsewhere.updated)}</span>
        </div>
        <p className="cm-note cm-small">Kegs move fast. Call ahead before you make the drive.</p>
        <ul className="cm-results">
          {elsewhere.accounts.map((account) => (
            <li className="cm-result" key={account.name}>
              <span className="cm-result__name cm-body-strong">{account.name}</span>
              <span className="cm-result__dist cm-data">{account.town}</span>
              <span className="cm-result__meta cm-small">
                {account.type} · {account.pouring}
              </span>
              <span className="cm-result__actions">
                {account.directionsUrl ? (
                  <a className="cm-btn cm-body-strong" href={account.directionsUrl}>
                    Directions
                  </a>
                ) : null}
                {account.phone ? (
                  <a className="cm-btn cm-body-strong" href={account.phone.href}>
                    Call {account.phone.display}
                  </a>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
