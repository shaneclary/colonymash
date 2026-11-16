import { test } from "node:test";
import assert from "node:assert/strict";
import { merchantNotes, merchantTabs, staffNotes, staffTabs, tours } from "../content/portal-tour.ts";
import { freshTour, readTour, tourBack, tourClose, tourGoTo, tourIsOpen, tourNext, tourRestart } from "./portal-tour.ts";

test("a first visit starts the walkthrough at step one", () => {
  assert.deepEqual(readTour(null, 8), { status: "active", step: 0 });
  assert.deepEqual(readTour("", 8), freshTour);
  assert.equal(tourIsOpen(readTour(null, 8)), true);
  assert.equal(tourIsOpen(null), false);
});

test("saved state is restored, and bad data starts over", () => {
  assert.deepEqual(readTour('{"status":"closed","step":3}', 8), { status: "closed", step: 3 });
  assert.deepEqual(readTour('{"status":"active","step":99}', 8), { status: "active", step: 7 }); // tour got shorter
  assert.deepEqual(readTour('{"status":"gone","step":1}', 8), freshTour);
  assert.deepEqual(readTour("not json", 8), freshTour);
  assert.deepEqual(readTour('{"status":"done"}', 8), freshTour);
});

test("next and back move one step and stop at the ends", () => {
  let state = freshTour;
  assert.equal(tourBack(state), state);
  state = tourNext(state, 3);
  assert.deepEqual(state, { status: "active", step: 1 });
  assert.deepEqual(tourBack(state), { status: "active", step: 0 });
  state = tourNext(tourNext(state, 3), 3);
  assert.deepEqual(state, { status: "done", step: 2 }); // finishing from the last step
  assert.equal(tourNext(state, 3), state);
  assert.equal(tourIsOpen(state), false);
});

test("the X closes it and keeps the place; Help can restart or jump", () => {
  const closed = tourClose({ status: "active", step: 4 });
  assert.deepEqual(closed, { status: "closed", step: 4 });
  assert.equal(tourNext(closed, 8), closed);
  assert.equal(tourClose(closed), closed);
  assert.deepEqual(tourRestart(), { status: "active", step: 0 });
  assert.deepEqual(tourGoTo(5, 8), { status: "active", step: 5 });
  assert.deepEqual(tourGoTo(50, 8), { status: "active", step: 7 });
  assert.deepEqual(tourGoTo(-2, 8), { status: "active", step: 0 });
});

test("every tour step points at a real screen and says something short", () => {
  const screens = { admin: staffTabs.map(x => x.id as string), merchant: merchantTabs.map(x => x.id as string) };
  for (const role of ["admin", "merchant"] as const) {
    const steps = tours[role];
    assert.ok(steps.length >= 6, role);
    assert.equal(new Set(steps.map(x => x.id)).size, steps.length, role + " step ids repeat");
    for (const step of steps) {
      assert.ok(screens[role].includes(step.view), role + ": " + step.id + " opens an unknown screen");
      assert.ok(step.title.length >= 4 && step.title.length <= 40, step.id);
      assert.ok(step.body.length >= 30 && step.body.length <= 240, step.id + " body length " + step.body.length);
      assert.equal(/!/.test(step.title + step.body + (step.tryIt ?? "")), false, step.id + " has an exclamation mark");
    }
    assert.equal(steps.at(-1)?.view, "help", role + " should end where the tour can be restarted");
    // The tour visits every screen that does real work.
    const visited = new Set(steps.map(x => x.view));
    const skipped = screens[role].filter(x => !visited.has(x));
    assert.deepEqual(skipped, role === "merchant" ? ["activity", "account"] : []);
  }
});

test("every screen has an info note", () => {
  for (const tab of staffTabs) assert.ok(staffNotes[tab.id].length > 20, tab.id);
  for (const tab of merchantTabs) assert.ok(merchantNotes[tab.id].length > 20, tab.id);
});
