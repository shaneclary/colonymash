import { test } from "node:test";
import assert from "node:assert/strict";
import { selectConfirmedRotation } from "./rotation.ts";

const sample = [
  { slug: "a", onTap: true },
  { slug: "b", onTap: false },
  { slug: "c", onTap: true, kickedAt: "4:10 PM" },
];
test("unconfirmed samples never appear as current rotation", () => {
  assert.deepEqual(selectConfirmedRotation(sample, false), []);
});
test("confirmed rotation excludes off-list and kicked kegs", () => {
  assert.deepEqual(selectConfirmedRotation(sample, true).map(x=>x.slug), ["a"]);
});
