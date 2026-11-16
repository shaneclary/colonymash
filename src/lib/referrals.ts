import {
  demoPackVolumes, referralProgram, type DemoState, type PackFormat, type Referral,
  type ReferralRedemption, type TradeLine, type TradeOrder,
} from "../content/portal-demo.ts";
import { isTradeLine } from "./portal-forecast.ts";

/** Credit is kept in whole millilitres so 3% never drifts on floating point. */
export const packMl = (format: PackFormat): number => Math.round(demoPackVolumes[format] * 1000);
const linesMl = (lines: readonly TradeLine[]): number =>
  lines.reduce((total, line) => total + line.quantity * packMl(line.format), 0);
const validDay = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value + "T12:00:00Z").toISOString().slice(0, 10) === value;

export type ReferralRow = { referral: Referral; filledMl: number; earnedMl: number };
export type ReferralSummary = { rows: ReferralRow[]; earnedMl: number; redeemedMl: number; balanceMl: number };

/**
 * What one account has earned and spent. An order earns once it is filled, if the referred account
 * placed it on or after the referral date and it is not itself bonus product.
 */
export function referralSummary(state: DemoState, merchantId: string): ReferralSummary {
  const rows = state.referrals.filter(x => x.referrerId === merchantId).map((referral): ReferralRow => {
    const filledMl = referral.status !== "active" || !referral.referredId || referral.referredId === merchantId ? 0
      : linesMl(state.orders.filter(order => order.merchantId === referral.referredId &&
          order.status === "fulfilled" && !order.bonus && order.createdAt >= referral.invitedAt)
          .flatMap(order => order.lines));
    return { referral, filledMl, earnedMl: Math.floor(filledMl * referralProgram.ratePercent / 100) };
  });
  const earnedMl = rows.reduce((total, row) => total + row.earnedMl, 0);
  const redeemedMl = state.referralRedemptions.filter(x => x.merchantId === merchantId &&
    state.orders.some(order => order.id === x.orderId && order.status !== "cancelled"))
    .reduce((total, x) => total + x.ml, 0);
  return { rows, earnedMl, redeemedMl, balanceMl: Math.max(0, earnedMl - redeemedMl) };
}

export const redeemableUnits = (balanceMl: number, format: PackFormat): number =>
  Math.max(0, Math.floor(balanceMl / packMl(format)));

export type ReferralResult = { state: DemoState; error?: string };

/** Spend credit on one product line. It becomes a no-charge request that staff still approve. */
export function redeemReferralCredit(
  state: DemoState, merchantId: string, merchantName: string, line: TradeLine,
  neededBy: string, today: string, id: string,
): ReferralResult {
  if (!isTradeLine(line)) return { state, error: "Choose a product, a package and a quantity." };
  if (!validDay(neededBy) || !validDay(today) || neededBy < today) return { state, error: "Choose today or a later date." };
  const cost = linesMl([line]);
  if (cost > referralSummary(state, merchantId).balanceMl) return { state, error: "That is more than the credit available." };
  if (!merchantId || !id || state.orders.some(x => x.id === id) || state.orders.length >= 100)
    return { state, error: "This request cannot be added. Reset the demo data if needed." };
  const order: TradeOrder = {
    id, merchantId, merchantName, createdAt: today, neededBy, status: "requested", bonus: true,
    lines: [{ productId: line.productId, format: line.format, quantity: line.quantity }],
    notes: referralProgram.bonusNote, history: [{ status: "requested", at: today }],
  };
  const redemption: ReferralRedemption = { id: "RED-" + id, merchantId, orderId: id, ml: cost, at: today };
  return { state: { ...state, orders: [order, ...state.orders], referralRedemptions: [redemption, ...state.referralRedemptions] } };
}

/** Put a business forward. It earns nothing until the brewery opens an account for it. */
export function inviteReferral(state: DemoState, merchantId: string, name: string, today: string, id: string): ReferralResult {
  const referredName = name.trim().replace(/\s+/g, " ").slice(0, 80);
  if (referredName.length < 2) return { state, error: "Enter the business name." };
  if (!validDay(today) || !merchantId || !id || state.referrals.some(x => x.id === id))
    return { state, error: "This referral cannot be added." };
  const mine = state.referrals.filter(x => x.referrerId === merchantId);
  if (mine.some(x => x.referredName.toLowerCase() === referredName.toLowerCase()))
    return { state, error: "You have already referred that business." };
  if (mine.length >= 20) return { state, error: "Twenty referrals is the limit in this demo." };
  const referral: Referral = { id, referrerId: merchantId, referredId: null, referredName, status: "invited", invitedAt: today };
  return { state: { ...state, referrals: [...state.referrals, referral] } };
}

export type ReferralAccount = ReferralSummary & { merchantId: string; bonusOrders: TradeOrder[] };

/** Staff view: every account that has referred someone, with what it is owed in product. */
export function referralLedger(state: DemoState): ReferralAccount[] {
  return [...new Set(state.referrals.map(x => x.referrerId))].map(merchantId => ({
    merchantId, ...referralSummary(state, merchantId),
    bonusOrders: state.orders.filter(x => x.merchantId === merchantId && x.bonus),
  }));
}
