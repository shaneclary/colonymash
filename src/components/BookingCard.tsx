import { booking } from "@/content/booking";
import { site } from "@/content/site";
import { Confirm } from "./Confirm";

/** The private-event offer. Dashed, because it is by arrangement. */
export function BookingCard({ headingLevel = "h2" }: { headingLevel?: "h1" | "h2" }) {
  const Heading = headingLevel;
  const facts = booking.facts.filter((fact) => fact.value || site.reviewMode);
  const mailto = `mailto:${site.email}?subject=${encodeURIComponent(booking.emailSubject)}`;
  return (
    <article className="cm-booking">
      <Heading className={headingLevel === "h1" ? "cm-sign-lg" : "cm-sign-md"}>{booking.title}</Heading>
      <p className="cm-body">{booking.body}</p>
      <dl className="cm-booking__facts">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="cm-label">{fact.label}</dt>
            <dd className="cm-body cm-inline">
              {fact.value}
              {fact.question ? <Confirm id={fact.question} /> : null}
            </dd>
          </div>
        ))}
      </dl>
      <div className="cm-booking__actions">
        <a className="cm-btn cm-btn--primary cm-body-strong" href={site.instagram.url}>
          {booking.primaryAction}
        </a>
        <a className="cm-btn cm-body-strong" href={mailto}>
          {booking.secondaryAction}
        </a>
      </div>
    </article>
  );
}
