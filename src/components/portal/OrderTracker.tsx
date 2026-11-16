import { trackingCopy } from "@/content/portal-demo";
import type { OrderTracking } from "@/lib/order-tracking";

const shortDate = (iso: string) => {
  const date = new Date(iso + "T12:00:00Z");
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(date) : iso;
};
const stateText = { done: "Done", current: "Now", upcoming: "Not yet" } as const;

/** Five-stage progress strip for one trade order. Black, white and grey only. */
export function OrderTracker({ tracking }: { tracking: OrderTracking }) {
  return <div className={"cm-portal__track" + (tracking.cancelled ? " cm-portal__track--cancelled" : "")}>
    <ol className="cm-portal__track-steps" aria-label="Order progress">
      {tracking.steps.map(step => <li key={step.id}
        className={"cm-portal__track-step cm-portal__track-step--" + step.state}
        aria-current={step.state === "current" ? "step" : undefined}>
        <span className="cm-portal__track-mark" aria-hidden="true"/>
        <strong>{step.label}</strong>
        <small>{step.at ? shortDate(step.at) : stateText[step.state]}
          <span className="cm-portal__sr">{step.at ? ", " + stateText[step.state] : ""}</span></small>
      </li>)}
    </ol>
    <p className="cm-portal__track-next">
      {tracking.late && <strong>{trackingCopy.late} </strong>}{tracking.next}
    </p>
  </div>;
}
