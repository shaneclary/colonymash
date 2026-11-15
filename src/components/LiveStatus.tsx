"use client";

// Open or closed, right now. Worked out in the visitor's browser from the taproom's clock,
// so a page built on Tuesday is still right on Thursday. Until the script runs (or if it
// never does) the hours are shown as plain text instead.
import { useEffect, useState } from "react";
import { schedule } from "@/content/hours";
import { describeStatus, statusAt, type Status } from "@/lib/status";

const REFRESH_MS = 30_000;

function useStatus(): Status | null {
  const [status, setStatus] = useState<Status | null>(null);
  useEffect(() => {
    const read = () => setStatus(statusAt(new Date(), schedule));
    read();
    const timer = setInterval(read, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);
  return status;
}

// Full dot: yes. Half dot: partly. Empty ring: no.
const dotClass: Record<Status["state"], string> = {
  open: "cm-dot cm-dot--full",
  soon: "cm-dot cm-dot--half",
  private: "cm-dot",
  closed: "cm-dot",
};

/** The pill and the line beside it: "Open" "until 8 PM". */
export function StatusPill({ fallback, size = "lg" }: { fallback: string; size?: "lg" | "md" }) {
  const status = useStatus();
  if (!status) {
    return (
      <p className="cm-statusline">
        <span className="cm-statusline__detail cm-data">{fallback}</span>
      </p>
    );
  }
  const { label, detail } = describeStatus(status);
  const sizeClass = size === "lg" ? " cm-status--lg cm-sign-md" : " cm-sign-sm";
  return (
    <p className="cm-statusline">
      <span className={`cm-status cm-status--${status.state}${sizeClass}`}>
        <span className={dotClass[status.state]} aria-hidden="true" />
        {label}
      </span>
      {detail ? <span className="cm-statusline__detail cm-data">{detail}</span> : null}
    </p>
  );
}

/** The one-line version for the header: a dot and "Open until 8 PM". */
export function StatusMini() {
  const status = useStatus();
  if (!status) return null;
  const { label, detail } = describeStatus(status);
  const quiet = status.state === "closed" ? " cm-mini--closed" : "";
  return (
    <span className={`cm-mini cm-small${quiet}`}>
      <span className={dotClass[status.state]} aria-hidden="true" />
      {label}
      {detail ? ` ${detail}` : ""}
    </span>
  );
}
