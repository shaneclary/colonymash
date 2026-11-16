
import { test } from "node:test";
import assert from "node:assert/strict";
import { adjustQuantity, canRequest, eligibility, formatLabels, kegCount, quantityFor, sanitizeCart, totalUnits } from "./commerce.ts";
const kegs = (quantity: number) => [{ slug: "purple-reign", format: "keg" as const, quantity }];
test("SLO county delivery proposal requires more than two kegs", () => {
  assert.equal(eligibility(kegs(2)).county, false);
  assert.equal(eligibility(kegs(3)).county, true);
});
test("regional delivery proposal requires at least five kegs", () => {
  assert.equal(eligibility(kegs(4)).regional, false);
  assert.equal(eligibility(kegs(5)).regional, true);
  assert.equal(canRequest(kegs(4), "regional"), false);
});
test("single cans and 6-packs never count as kegs", () => {
  assert.equal(kegCount([
    { slug: "purple-reign", format: "can", quantity: 24 },
    { slug: "purple-reign", format: "six_pack", quantity: 4 },
  ]), 0);
});
test("each flavor has independent quantities in three formats", () => {
  const a = adjustQuantity([], "purple-reign", "can", 2);
  const b = adjustQuantity(a, "purple-reign", "six_pack", 1);
  const c = adjustQuantity(b, "cherry-limeade", "keg", 3);
  assert.equal(quantityFor(c, "purple-reign", "can"), 2);
  assert.equal(quantityFor(c, "purple-reign", "six_pack"), 1);
  assert.equal(quantityFor(c, "cherry-limeade", "keg"), 3);
  assert.equal(eligibility(c).county, true);
  assert.equal(totalUnits(c), 6);
  assert.equal(formatLabels.six_pack, "6-pack");
  assert.equal(adjustQuantity(c, "purple-reign", "can", -2).length, 2);
});
test("quantities never go negative or exceed 99", () => {
  assert.equal(quantityFor(adjustQuantity([], "x", "can", -1), "x", "can"), 0);
  assert.equal(quantityFor(adjustQuantity([], "x", "can", 150), "x", "can"), 99);
});
test("persisted cart rejects untrusted IDs, invalid variants and invalid quantities", () => {
  const slugs = new Set(["purple-reign"]);
  const hydrated = sanitizeCart([
    { slug: "purple-reign", format: "six_pack", quantity: 2 },
    { slug: "purple-reign", format: "six_pack", quantity: 3 },
    { slug: "fake", format: "keg", quantity: 8 },
    { slug: "purple-reign", format: "can", quantity: -3 },
    { slug: "purple-reign", format: "ten_pack", quantity: 1 },
  ], slugs);
  assert.deepEqual(hydrated, [{ slug: "purple-reign", format: "six_pack", quantity: 5 }]);
});
test("old V2 carts remain explicitly ambiguous rather than silently converting to single cans", () => {
  const hydrated = sanitizeCart([{ slug: "purple-reign", format: "cans", quantity: 4 }], new Set(["purple-reign"]));
  assert.equal(hydrated[0].format, "cans");
  assert.match(formatLabels.cans, /format TBD/);
});
