// The one-line banner above the header. One at a time, and every notice expires on its own.
import type { WheelFlavor } from "../lib/flavors.ts";

export type Notice = {
  /** One or two words: "Heads up", "New on tap", "Closed Thursday". */
  label: string;
  text: string;
  link?: { label: string; href: string };
  /** "plain" for a change to today's visit, "loud" for a whole day off, a flavor for a new seltzer. */
  tone: "plain" | "loud" | WheelFlavor;
  /** ISO date-time in Pacific time, e.g. "2026-11-27T16:00:00-08:00". After this the banner is gone. */
  expires: string;
};

// Example:
// { label: "Closed Thursday", text: "Happy Thanksgiving. Open again Friday at 4.", tone: "loud", expires: "2026-11-27T16:00:00-08:00" }
export const notice: Notice | null = null;
