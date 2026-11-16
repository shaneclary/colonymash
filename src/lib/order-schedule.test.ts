import { test } from "node:test";
import assert from "node:assert/strict";
import { demoSeed, merchantDemoId } from "../content/portal-demo.ts";
import { previousStatus, scheduleOrder, stepBackOrder } from "./order-schedule.ts";
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
