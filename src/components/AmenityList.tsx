import { amenities, type AmenityAnswer } from "@/content/amenities";
import { site } from "@/content/site";
import { Confirm } from "./Confirm";

const dotClass: Record<AmenityAnswer, string> = {
  yes: "cm-dot cm-dot--full",
  limit: "cm-dot cm-dot--half",
  no: "cm-dot",
  unknown: "cm-dot",
};

/** The house rules: one word and one sentence each. Unanswered rows only show on the staging site. */
export function AmenityList() {
  const rows = amenities.filter((amenity) => amenity.kind !== "unknown" || site.reviewMode);
  return (
    <dl className="cm-amen">
      {rows.map((amenity) => (
        <div className="cm-amen__row" key={amenity.term}>
          <dt className="cm-amen__term cm-body-strong">{amenity.term}</dt>
          <dd className={`cm-amen__answer cm-body${amenity.kind === "no" ? " cm-amen__answer--no" : ""}`}>
            {amenity.kind === "unknown" ? (
              amenity.question && <Confirm id={amenity.question} />
            ) : (
              <>
                <span className={dotClass[amenity.kind]} aria-hidden="true" />
                {amenity.answer}
              </>
            )}
          </dd>
          <dd className="cm-amen__detail cm-small cm-inline">
            {amenity.kind === "unknown" ? "Not answered yet." : amenity.detail}
            {amenity.kind !== "unknown" && amenity.question ? <Confirm id={amenity.question} /> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
