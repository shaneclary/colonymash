
import { test } from "node:test";
import assert from "node:assert/strict";
import { canRequest, eligibility, kegCount } from "./commerce.ts";
const kegs = (quantity: number) => [{ slug: "purple-reign", format: "keg" as const, quantity }];
test("two kegs do not qualify for the SLO county proposal", () => {
  assert.equal(eligibility(kegs(2)).county, false);
  assert.equal(eligibility(kegs(3)).county, true);
});
test("five kegs qualify for proposed 150 mile delivery", () => {
  assert.equal(eligibility(kegs(4)).regional, false);
  assert.equal(eligibility(kegs(5)).regional, true);
  assert.equal(canRequest(kegs(4), "regional"), false);
});
test("cans do not count toward keg minimums", () => {
  assert.equal(kegCount([{ slug: "purple-reign", format: "cans", quantity: 24 }]), 0);
});
