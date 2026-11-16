import { test } from "node:test";
import assert from "node:assert/strict";
import { demoSeed, merchantDemoId } from "../content/portal-demo.ts";
import { findOrder, trackOrder } from "./order-tracking.ts";
import { transitionOrder } from "./portal-forecast.ts";
import { cancelRequestedMerchantOrder, receiveMerchantOrder } from "./merchant-operations.ts";

const today = "2026-11-15";
const seed = demoSeed(new Date("2026-11-15T12:00:00"));
const order = (state: typeof seed, id: string) => {
  const found = state.orders.find(x => x.id === id);
  assert.ok(found, id);
  return found;
};
const states = (state: typeof seed, id: string, day = today) => trackOrder(state, order(state, id), day).steps.map(x => x.state);

test("a requested order sits on the first stage and waits on the brewery", () => {
  const tracking = trackOrder(seed, order(seed, "DEMO-1003"), today);
  assert.deepEqual(tracking.steps.map(x => x.id), ["requested", "accepted", "scheduled", "fulfilled", "received"]);
  assert.deepEqual(tracking.steps.map(x => x.state), ["current", "upcoming", "upcoming", "upcoming", "upcoming"]);
  assert.equal(tracking.steps[0].at, "2026-11-14");
  assert.equal(tracking.next, "The brewery reviews the request.");
  assert.equal(tracking.cancelled, false);
  assert.equal(tracking.complete, false);
  assert.equal(tracking.late, false);
});

test("earlier stages are done and carry their dates", () => {
  assert.deepEqual(states(seed, "DEMO-1001"), ["done", "current", "upcoming", "upcoming", "upcoming"]);
  const tracking = trackOrder(seed, order(seed, "DEMO-1002"), today);
  assert.deepEqual(tracking.steps.map(x => x.state), ["done", "done", "current", "upcoming", "upcoming"]);
  assert.deepEqual(tracking.steps.map(x => x.at), ["2026-11-13", "2026-11-13", "2026-11-14", undefined, undefined]);
});

test("an order with no history falls back to its created date", () => {
  const bare = { ...order(seed, "DEMO-1003"), history: undefined };
  assert.equal(trackOrder(seed, bare, today).steps[0].at, "2026-11-14");
});

test("staff status changes are dated", () => {
  const scheduled = transitionOrder(seed, "DEMO-1001", "scheduled", "2026-11-16");
  assert.deepEqual(order(scheduled, "DEMO-1001").history?.at(-1), { status: "scheduled", at: "2026-11-16" });
  assert.equal(trackOrder(scheduled, order(scheduled, "DEMO-1001"), today).steps[2].at, "2026-11-16");
  // A move the pipeline does not allow records nothing.
  const blocked = transitionOrder(seed, "DEMO-1003", "fulfilled", "2026-11-16");
  assert.equal(order(blocked, "DEMO-1003").history?.length, 1);
  // No date given: status still moves, history is left alone.
  const undated = transitionOrder(seed, "DEMO-1001", "scheduled");
  assert.equal(order(undated, "DEMO-1001").status, "scheduled");
  assert.equal(order(undated, "DEMO-1001").history?.length, 2);
});

test("a filled order waits on the buyer, then completes on receipt", () => {
  const filled = transitionOrder(transitionOrder(seed, "DEMO-1001", "scheduled", "2026-11-16"), "DEMO-1001", "fulfilled", "2026-11-20");
  const waiting = trackOrder(filled, order(filled, "DEMO-1001"), "2026-11-20");
  assert.deepEqual(waiting.steps.map(x => x.state), ["done", "done", "done", "current", "upcoming"]);
  assert.equal(waiting.next, "The buyer confirms receipt.");
  const received = receiveMerchantOrder(filled, merchantDemoId, "DEMO-1001", "2026-11-21");
  const done = trackOrder(received, order(received, "DEMO-1001"), "2026-11-21");
  assert.ok(done.steps.every(x => x.state === "done"));
  assert.equal(done.steps[4].at, "2026-11-21");
  assert.equal(done.complete, true);
  assert.equal(done.next, "Complete.");
});

test("a cancelled order keeps the stages it reached and stops", () => {
  const cancelled = cancelRequestedMerchantOrder(seed, merchantDemoId, "DEMO-1003");
  const tracking = trackOrder(cancelled, order(cancelled, "DEMO-1003"), today);
  assert.equal(tracking.cancelled, true);
  assert.deepEqual(tracking.steps.map(x => x.state), ["done", "upcoming", "upcoming", "upcoming", "upcoming"]);
  assert.equal(tracking.next, "Cancelled. Nothing more happens on this order.");
  const later = transitionOrder(seed, "DEMO-1002", "cancelled", "2026-11-16");
  assert.deepEqual(states(later, "DEMO-1002"), ["done", "done", "done", "upcoming", "upcoming"]);
});

test("late means open and past the requested date", () => {
  assert.equal(trackOrder(seed, order(seed, "DEMO-1003"), "2026-12-25").late, true);
  assert.equal(trackOrder(seed, order(seed, "DEMO-1003"), "2026-12-02").late, false); // needed that day
  assert.equal(trackOrder(seed, order(seed, "DEMO-0998"), today).late, false); // filled
  const cancelled = cancelRequestedMerchantOrder(seed, merchantDemoId, "DEMO-1003");
  assert.equal(trackOrder(cancelled, order(cancelled, "DEMO-1003"), "2026-12-25").late, false);
});

test("order lookup is by number and stays inside one account", () => {
  assert.equal(findOrder(seed, merchantDemoId, " demo-1001 ")?.id, "DEMO-1001");
  assert.equal(findOrder(seed, merchantDemoId, "1003")?.id, "DEMO-1003");
  assert.equal(findOrder(seed, merchantDemoId, "DEMO-1002"), undefined); // another account's order
  assert.equal(findOrder(seed, merchantDemoId, ""), undefined);
  assert.equal(findOrder(seed, merchantDemoId, "DEMO"), undefined); // matches more than one
});
