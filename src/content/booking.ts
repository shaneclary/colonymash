// The private-event offer. From the Instagram bio: Saturdays are private events, booked by message.
import type { QuestionId } from "./questions.ts";

export const booking = {
  title: "Saturdays are yours",
  body: "The taproom is closed to the public on Saturdays so one group can have the whole room.",
  /** Rows without a value are shown as "Confirm" in review mode and hidden once live. */
  facts: [
    { label: "When", value: "Saturdays" },
    { label: "Room", value: "The whole taproom", question: "private-events" },
    { label: "Size", value: "", question: "private-events" },
    { label: "Food", value: "", question: "private-events" },
  ] as { label: string; value: string; question?: QuestionId }[],
  primaryAction: "Message us on Instagram",
  secondaryAction: "Email instead",
  emailSubject: "Private event at Colony Mash",
};
