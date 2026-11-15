// The house rules on the Visit page. One word and one sentence each.
import type { QuestionId } from "./questions.ts";

/** "yes" is a full dot, "limit" a half dot, "no" an empty ring, "unknown" is blank until confirmed. */
export type AmenityAnswer = "yes" | "limit" | "no" | "unknown";

export type Amenity = {
  term: string;
  kind: AmenityAnswer;
  /** The answer itself. For a limit, the condition is the answer: "Private", "Patio only". */
  answer: string;
  detail: string;
  /** Set while the owners have not confirmed this row. Unknown rows are hidden once the site is live. */
  question?: QuestionId;
};

export const amenities: Amenity[] = [
  {
    term: "Not into beer",
    kind: "yes",
    answer: "Covered",
    detail: "Hard seltzers on tap, in a lot of colors. No wine or cider.",
  },
  {
    term: "Seating",
    kind: "yes",
    answer: "In and out",
    detail: "Long bars inside, seats outside. It's a small room built for talking.",
  },
  {
    term: "Step-free",
    kind: "yes",
    answer: "Yes",
    detail: "Accessible parking and entrance.",
    question: "restroom",
  },
  {
    term: "Saturdays",
    kind: "limit",
    answer: "Private",
    detail: "The room is yours to book.",
    question: "private-events",
  },
  { term: "Dogs", kind: "unknown", answer: "", detail: "", question: "house-rules" },
  { term: "Kids", kind: "unknown", answer: "", detail: "", question: "house-rules" },
  { term: "Food", kind: "unknown", answer: "", detail: "", question: "house-rules" },
];
