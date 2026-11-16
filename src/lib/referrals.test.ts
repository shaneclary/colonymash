import { test } from "node:test";
import assert from "node:assert/strict";
import { demoSeed, merchantDemoId, referralProgram, type DemoState } from "../content/portal-demo.ts";
import {
  inviteReferral, packMl, redeemReferralCredit, redeemableUnits, referralLedger, referralSummary,
} from "./referrals.ts";
import { transitionOrder } from "./portal-forecast.ts";
import { cancelRequestedMerchantOrder, upgradeDemoLedger } from "./merchant-operations.ts";

const today = "2026-11-15";
const seed = demoSeed(new Date("2026-11-15T12:00:00"));
const company = "Coastal Partner — Demo";
const sixPacks = (quantity: number) => ({ productId: "cherry-limeade", format: "six_pack" as const, quantity });

test("the rate is 3% and credit is counted in whole millilitres", () => {
  assert.equal(referralProgram.ratePercent, 3);
  assert.deepEqual([packMl("can"), packMl("six_pack"), packMl("keg")], [473, 2838, 58670]);
});

test("credit is 3% of what the referred account has had filled", () => {
  const summary = referralSummary(seed, merchantDemoId);
  // DEMO-0998: 4 kegs = 234,680 mL. 3% = 7,040.4, kept as 7,040.
  assert.equal(summary.rows.length, 1);
  assert.equal(summary.rows[0].filledMl, 234680);
  assert.equal(summary.rows[0].earnedMl, 7040);
  assert.deepEqual([summary.earnedMl, summary.redeemedMl, summary.balanceMl], [7040, 0, 7040]);
  assert.equal(redeemableUnits(summary.balanceMl, "six_pack"), 2);
  assert.equal(redeemableUnits(summary.balanceMl, "can"), 14);
  assert.equal(redeemableUnits(summary.balanceMl, "keg"), 0);
});

test("only filled orders earn; requested, accepted and scheduled do not", () => {
  // DEMO-1002 (3 kegs) is scheduled in the seed and earns nothing yet.
  const filled = transitionOrder(seed, "DEMO-1002", "fulfilled", today);
  // 410,690 mL filled in total. 3% = 12,320.7, kept as 12,320.
  assert.equal(referralSummary(filled, merchantDemoId).earnedMl, 12320);
  const cancelled = transitionOrder(seed, "DEMO-1002", "cancelled", today);
  assert.equal(referralSummary(cancelled, merchantDemoId).earnedMl, 7040);
});

test("an account earns nothing on its own orders or without a referral", () => {
  assert.equal(referralSummary(seed, "venue-demo").balanceMl, 0);
  const ownFilled = transitionOrder(transitionOrder(seed, "DEMO-1001", "scheduled", today), "DEMO-1001", "fulfilled", today);
  assert.equal(referralSummary(ownFilled, merchantDemoId).earnedMl, 7040);
});

test("orders placed before the referral, and bonus orders, do not earn", () => {
  const early: DemoState = { ...seed, referrals: seed.referrals.map(x => ({ ...x, invitedAt: "2026-11-01" })) };
  assert.equal(referralSummary(early, merchantDemoId).earnedMl, 0); // DEMO-0998 was placed 2026-10-26
  const bonus: DemoState = { ...seed, orders: seed.orders.map(x => x.id === "DEMO-0998" ? { ...x, bonus: true } : x) };
  assert.equal(referralSummary(bonus, merchantDemoId).earnedMl, 0);
});

test("redeeming credit makes a no-charge request for staff to approve", () => {
  const result = redeemReferralCredit(seed, merchantDemoId, company, sixPacks(2), "2026-11-29", today, "BONUS-1");
  assert.equal(result.error, undefined);
  const order = result.state.orders.find(x => x.id === "BONUS-1");
  assert.ok(order);
  assert.equal(order.status, "requested");
  assert.equal(order.bonus, true);
  assert.equal(order.notes, referralProgram.bonusNote);
  assert.deepEqual(order.lines, [sixPacks(2)]);
  assert.deepEqual(order.history, [{ status: "requested", at: today }]);
  const summary = referralSummary(result.state, merchantDemoId);
  assert.deepEqual([summary.redeemedMl, summary.balanceMl], [5676, 1364]);
});

test("credit cannot be overspent or spent twice", () => {
  assert.ok(redeemReferralCredit(seed, merchantDemoId, company, sixPacks(3), "2026-11-29", today, "B").error);
  assert.ok(redeemReferralCredit(seed, merchantDemoId, company,
    { productId: "cherry-limeade", format: "keg", quantity: 1 }, "2026-11-29", today, "B").error);
  const once = redeemReferralCredit(seed, merchantDemoId, company, sixPacks(2), "2026-11-29", today, "B").state;
  const twice = redeemReferralCredit(once, merchantDemoId, company, sixPacks(1), "2026-11-29", today, "B2");
  assert.ok(twice.error);
  assert.equal(twice.state, once);
  assert.ok(redeemReferralCredit(once, merchantDemoId, company, { ...sixPacks(1), format: "can" }, "2026-11-29", today, "B").error); // id reused
});

test("redemption rejects bad lines, past dates and accounts with no credit", () => {
  assert.ok(redeemReferralCredit(seed, merchantDemoId, company, sixPacks(0), "2026-11-29", today, "B").error);
  assert.ok(redeemReferralCredit(seed, merchantDemoId, company, sixPacks(1), "2026-11-01", today, "B").error);
  assert.ok(redeemReferralCredit(seed, merchantDemoId, company,
    { productId: "not-a-drink", format: "can", quantity: 1 }, "2026-11-29", today, "B").error);
  assert.ok(redeemReferralCredit(seed, "venue-demo", "Venue", { ...sixPacks(1), format: "can" }, "2026-11-29", today, "B").error);
  assert.equal(redeemReferralCredit(seed, merchantDemoId, company, sixPacks(0), "2026-11-29", today, "B").state, seed);
});

test("a cancelled bonus order returns its credit", () => {
  const redeemed = redeemReferralCredit(seed, merchantDemoId, company, sixPacks(2), "2026-11-29", today, "BONUS-1").state;
  const cancelled = cancelRequestedMerchantOrder(redeemed, merchantDemoId, "BONUS-1");
  assert.deepEqual(referralSummary(cancelled, merchantDemoId).balanceMl, 7040);
});

test("an invite is listed but earns nothing until the account exists", () => {
  const invited = inviteReferral(seed, merchantDemoId, "  Harbor Bottle Shop  ", today, "REF-2");
  assert.equal(invited.error, undefined);
  const added = invited.state.referrals.find(x => x.id === "REF-2");
  assert.deepEqual(added, { id: "REF-2", referrerId: merchantDemoId, referredId: null,
    referredName: "Harbor Bottle Shop", status: "invited", invitedAt: today });
  assert.equal(referralSummary(invited.state, merchantDemoId).earnedMl, 7040);
  assert.equal(referralSummary(invited.state, merchantDemoId).rows.length, 2);
  assert.ok(inviteReferral(seed, merchantDemoId, " ", today, "REF-3").error);
  assert.ok(inviteReferral(invited.state, merchantDemoId, "harbor bottle shop", today, "REF-3").error);
  assert.ok(inviteReferral(seed, merchantDemoId, "Sample Events Venue — Demo", today, "REF-3").error);
  assert.ok(inviteReferral(invited.state, merchantDemoId, "Another Shop", today, "REF-2").error);
});

test("the staff ledger lists every referring account with its balance", () => {
  const redeemed = redeemReferralCredit(seed, merchantDemoId, company, sixPacks(1), "2026-11-29", today, "BONUS-1").state;
  const ledger = referralLedger(redeemed);
  assert.equal(ledger.length, 1);
  assert.equal(ledger[0].merchantId, merchantDemoId);
  assert.deepEqual([ledger[0].earnedMl, ledger[0].redeemedMl, ledger[0].balanceMl], [7040, 2838, 4202]);
  assert.deepEqual(ledger[0].bonusOrders.map(x => x.id), ["BONUS-1"]);
});

test("a saved version 2 ledger gains the referral data and keeps its orders", () => {
  const legacy: Record<string, unknown> = { ...seed, version: 2, orders: seed.orders.filter(x => x.id !== "DEMO-0998") };
  delete legacy.referrals;
  delete legacy.referralRedemptions;
  const upgraded = upgradeDemoLedger(legacy, seed);
  assert.equal(upgraded?.version, 3);
  assert.equal(upgraded?.referrals.length, 1);
  assert.deepEqual(upgraded?.referralRedemptions, []);
  assert.equal(upgraded?.orders.length, seed.orders.length);
  assert.ok(upgraded?.orders.some(x => x.id === "DEMO-1003"));
  assert.equal(upgraded && referralSummary(upgraded, merchantDemoId).earnedMl, 7040);
});
