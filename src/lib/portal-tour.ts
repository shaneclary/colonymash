/** State of a portal walkthrough. Kept per role in the browser so it stays closed once dismissed. */
export type TourState = { status: "active" | "closed" | "done"; step: number };

export const freshTour: TourState = { status: "active", step: 0 };
const clamp = (step: number, count: number) => Math.max(0, Math.min(Math.max(0, count - 1), Math.trunc(step)));

/** Read saved state. A first visit, or anything unreadable, starts the tour at the first step. */
export function readTour(raw: string | null, stepCount: number): TourState {
  if (!raw) return freshTour;
  try {
    const value = JSON.parse(raw) as Partial<TourState> | null;
    if (!value || !["active", "closed", "done"].includes(String(value.status)) || !Number.isFinite(value.step)) return freshTour;
    return { status: value.status as TourState["status"], step: clamp(Number(value.step), stepCount) };
  } catch { return freshTour; }
}

/** Forward one step. From the last step the tour finishes. */
export function tourNext(state: TourState, stepCount: number): TourState {
  if (state.status !== "active") return state;
  return state.step >= stepCount - 1 ? { status: "done", step: clamp(state.step, stepCount) } : { status: "active", step: state.step + 1 };
}
export function tourBack(state: TourState): TourState {
  return state.status === "active" && state.step > 0 ? { status: "active", step: state.step - 1 } : state;
}
/** The X. The step is kept so reopening can pick up where it stopped. */
export function tourClose(state: TourState): TourState {
  return state.status === "active" ? { status: "closed", step: state.step } : state;
}
export const tourRestart = (): TourState => freshTour;
/** Open the tour at a chosen step, from the Help screen. */
export function tourGoTo(step: number, stepCount: number): TourState {
  return { status: "active", step: clamp(step, stepCount) };
}
export const tourIsOpen = (state: TourState | null): boolean => state?.status === "active";
