import { test } from "node:test";
import assert from "node:assert/strict";
import { demoSeed, merchantDemoId } from "../content/portal-demo.ts";
import { previousStatus, runDates, runSheet, scheduleOrder, stepBackOrder, usualOrder } from "./order-schedule.ts";
import { createTradeRequest } from "./portal-forecast.ts";
import { transitionOrder } from "./portal-forecast.ts";
import { receiveMerchantOrder } from "./merchant-operations.ts";

const today = "2026-11-15";
const seed = demoSeed(new Date("2026-11-15T12:00:00"));
const get = (state: typeof seed, id: string) => state.orders.find(x => x.id === id)!;
const slot = { date: "2026-11-20", method: "delivery" as const, window: "Morning" };

test("scheduling an accepted order sets the day, hand-off and window", () => {
  const result = scheduleOrder(seed, "DEMO-1001", slot, today);
  assert.equal(result.error, undefined);
  const order = get(result.state, "DEMO-1001");
  assert.equal(order.status, "scheduled");
  assert.deepEqual(order.slot, slot);
  assert.deepEqual(order.history?.at(-1), { status: "scheduled", at: today });
});

test("an order must be accepted first, and the day cannot be in the past", () => {
  assert.ok(scheduleOrder(seed, "DEMO-1003", slot, today).error);          // still requested
  assert.ok(scheduleOrder(seed, "DEMO-0998", slot, today).error);          // already filled
  assert.ok(scheduleOrder(seed, "DEMO-1001", { ...slot, date: "2026-11-01" }, today).error);
  assert.ok(scheduleOrder(seed, "DEMO-1001", { ...slot, date: "next week" }, today).error);
  assert.equal(scheduleOrder(seed, "DEMO-1001", { ...slot, date: "2026-11-01" }, today).state, seed);
});

test("rescheduling changes the slot without adding a second history entry", () => {
  const before = get(seed, "DEMO-1002").history?.length;
  const moved = scheduleOrder(seed, "DEMO-1002", { date: "2026-12-01", method: "pickup", window: "Afternoon" }, today).state;
  assert.deepEqual(get(moved, "DEMO-1002").slot, { date: "2026-12-01", method: "pickup", window: "Afternoon" });
  assert.equal(get(moved, "DEMO-1002").status, "scheduled");
  assert.equal(get(moved, "DEMO-1002").history?.length, before);
});

test("a status change pressed by mistake steps back one stage", () => {
  const scheduled = scheduleOrder(seed, "DEMO-1001", slot, today).state;
  const back = stepBackOrder(scheduled, "DEMO-1001");
  assert.equal(get(back, "DEMO-1001").status, "accepted");
  assert.equal(get(back, "DEMO-1001").slot, undefined);
  assert.deepEqual(get(back, "DEMO-1001").history, get(seed, "DEMO-1001").history);
  const filled = transitionOrder(scheduled, "DEMO-1001", "fulfilled", today);
  assert.equal(get(stepBackOrder(filled, "DEMO-1001"), "DEMO-1001").status, "scheduled");
  assert.deepEqual(get(stepBackOrder(filled, "DEMO-1001"), "DEMO-1001").slot, slot);
  assert.equal(get(stepBackOrder(seed, "DEMO-1001"), "DEMO-1001").status, "requested");
});

test("a cancelled order returns to the stage it was cancelled from", () => {
  const cancelled = transitionOrder(seed, "DEMO-1002", "cancelled", today);
  assert.equal(previousStatus(cancelled, get(cancelled, "DEMO-1002")), "scheduled");
  const back = stepBackOrder(cancelled, "DEMO-1002");
  assert.equal(get(back, "DEMO-1002").status, "scheduled");
  assert.deepEqual(get(back, "DEMO-1002").history, get(seed, "DEMO-1002").history);
});

test("nothing steps back from requested, or after the buyer has received it", () => {
  assert.equal(stepBackOrder(seed, "DEMO-1003"), seed);
  assert.equal(stepBackOrder(seed, "missing"), seed);
  const filled = transitionOrder(scheduleOrder(seed, "DEMO-1001", slot, today).state, "DEMO-1001", "fulfilled", today);
  const received = receiveMerchantOrder(filled, merchantDemoId, "DEMO-1001", today);
  assert.equal(previousStatus(received, get(received, "DEMO-1001")), null);
  assert.equal(stepBackOrder(received, "DEMO-1001"), received);
});

test("the run sheet lists one day's scheduled stops in working order with account details", () => {
  // Seed: DEMO-1002 is scheduled for a morning delivery on 2026-11-28.
  let state = scheduleOrder(seed, "DEMO-1001", { date: "2026-11-28", method: "pickup", window: "Morning" }, today).state;
  state = scheduleOrder(transitionOrder(state, "DEMO-1003", "accepted", today), "DEMO-1003", { date: "2026-11-28", method: "delivery", window: "Afternoon" }, today).state;
  const stops = runSheet(state, "2026-11-28");
  assert.deepEqual(stops.map(x => x.order.id), ["DEMO-1002", "DEMO-1001", "DEMO-1003"]); // morning delivery, morning pickup, afternoon
  assert.equal(stops[0].account?.address, "200 Sample Road, Paso Robles, CA");
  assert.equal(stops[0].account?.receiving, "Thu 9 AM–noon");
  assert.deepEqual(runSheet(state, "2026-11-29"), []);
  assert.deepEqual(runDates(state, today), ["2026-11-28"]);
  assert.deepEqual(runDates(state, "2026-11-29"), []);
  // Requested and accepted orders are not on the sheet.
  assert.deepEqual(runSheet(seed, "2026-11-21"), []);
});

test("the usual order is what repeats; with no repeats it is the latest order", () => {
  // Seed: two orders that share no items, so the usual is the newest one.
  assert.deepEqual(usualOrder(seed, merchantDemoId), [{ productId: "cherry-limeade", format: "six_pack", quantity: 5 }]);
  const again = createTradeRequest(seed, merchantDemoId, "Coastal", [
    { productId: "cherry-limeade", format: "keg", quantity: 4 }, { productId: "purple-reign", format: "can", quantity: 12 }], "2026-12-05", "", "NEW-1", today);
  // Cherry kegs now appear twice (2 and 4): the usual is 3. Nothing else repeats.
  assert.deepEqual(usualOrder(again, merchantDemoId), [{ productId: "cherry-limeade", format: "keg", quantity: 3 }]);
  assert.deepEqual(usualOrder(seed, "prospect-demo"), []);
  const cancelled = { ...seed, orders: seed.orders.map(x => x.id === "DEMO-1003" ? { ...x, status: "cancelled" as const } : x) };
  assert.equal(usualOrder(cancelled, merchantDemoId).length, 2); // falls back to DEMO-1001
});
