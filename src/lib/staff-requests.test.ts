import { test } from "node:test";
import assert from "node:assert/strict";
import { demoSeed, merchantDemoId } from "../content/portal-demo.ts";
import { decideRequest, newRequestCount, nextRequestStatuses, requestsFor, setRequestReply, submitRequest } from "./staff-requests.ts";

const today = "2026-11-15";
const seed = demoSeed(new Date("2026-11-15T12:00:00"));
const sample = { kind: "sample" as const, from: "Coastal Partner — Demo", merchantId: merchantDemoId, contact: "buyer@example.test",
  date: "2026-11-24", productIds: ["cherry-limeade", "cherry-limeade", "not-a-drink", "purple-reign"], notes: " For the new menu. " };

test("a wholesale account can ask for samples or a staff demo", () => {
  const result = submitRequest(seed, sample, today, "RQ-9");
  assert.equal(result.error, undefined);
  assert.deepEqual(result.state.requests[0], { id: "RQ-9", kind: "sample", from: "Coastal Partner — Demo", contact: "buyer@example.test",
    date: "2026-11-24", productIds: ["cherry-limeade", "purple-reign"], notes: "For the new menu.", status: "new", createdAt: today, reply: "",
    merchantId: merchantDemoId });
  assert.equal(newRequestCount(result.state), newRequestCount(seed) + 1);
  assert.equal(requestsFor(result.state, merchantDemoId).length, 2);
  assert.equal(submitRequest(seed, { ...sample, kind: "demo" }, today, "RQ-9").state.requests[0].kind, "demo");
});

test("requests are checked before they reach staff", () => {
  assert.ok(submitRequest(seed, { ...sample, productIds: [] }, today, "RQ-9").error);
  assert.ok(submitRequest(seed, { ...sample, date: "2026-11-01" }, today, "RQ-9").error);
  assert.ok(submitRequest(seed, { ...sample, from: " " }, today, "RQ-9").error);
  assert.ok(submitRequest(seed, sample, today, "DEMO-RQ1").error);
  assert.ok(submitRequest(seed, { ...sample, kind: "private_event", productIds: [] }, today, "RQ-9").error); // no guest count
  const event = submitRequest(seed, { ...sample, kind: "private_event", productIds: [], guests: 40, merchantId: undefined }, today, "RQ-9");
  assert.equal(event.state.requests[0].guests, 40);
  assert.equal(submitRequest(seed, { ...sample, productIds: [] }, today, "RQ-9").state, seed);
});

test("staff approve, decline, finish and reopen requests", () => {
  assert.deepEqual(nextRequestStatuses("new"), ["approved", "declined"]);
  const approved = decideRequest(seed, "DEMO-RQ1", "approved", "Saturday the 28th works.");
  assert.deepEqual([approved.requests.find(x => x.id === "DEMO-RQ1")?.status, approved.requests.find(x => x.id === "DEMO-RQ1")?.reply],
    ["approved", "Saturday the 28th works."]);
  assert.equal(decideRequest(seed, "DEMO-RQ1", "done"), seed);            // not approved yet
  assert.equal(decideRequest(approved, "DEMO-RQ1", "done").requests.find(x => x.id === "DEMO-RQ1")?.status, "done");
  const declined = decideRequest(seed, "DEMO-RQ2", "declined");
  assert.equal(decideRequest(declined, "DEMO-RQ2", "new").requests.find(x => x.id === "DEMO-RQ2")?.status, "new"); // undo a wrong tap
  assert.equal(decideRequest(seed, "missing", "approved"), seed);
  assert.equal(setRequestReply(seed, "DEMO-RQ2", "Will call Tuesday.").requests.find(x => x.id === "DEMO-RQ2")?.reply, "Will call Tuesday.");
});
