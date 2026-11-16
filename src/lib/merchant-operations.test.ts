import { test } from "node:test";
import assert from "node:assert/strict";
import { demoSeed, merchantDemoId } from "../content/portal-demo.ts";
import {
  amendRequestedMerchantOrder, cancelRequestedMerchantOrder, createMerchantSeries, dateAfter,
  editMerchantStock, extendMerchantSeries, merchantIncomingUnits, merchantInventoryRow,
  merchantOrders, merchantStockForecast, receiveMerchantOrder, recordMerchantCount, recordMerchantUsage,
  setSeriesActive, upgradeDemoLedger,
} from "./merchant-operations.ts";
import { transitionOrder } from "./portal-forecast.ts";

const today="2026-11-15";
const state=demoSeed(new Date("2026-11-15T12:00:00"));
test("stock forecasting distinguishes wholesale merchant on-hand from brewery stock",()=>{
 const cherry=merchantInventoryRow(state,merchantDemoId,"cherry-limeade","six_pack");
 assert.equal(cherry.onHand,7);
 assert.equal(state.finished.find(x=>x.productId==="cherry-limeade")?.six_pack,9);
 const alert=merchantStockForecast(state,merchantDemoId,today).find(x=>x.stock.productId==="purple-reign"&&x.stock.format==="six_pack");
 assert.ok(alert && alert.status==="low" && alert.suggested>0);
 const venue=merchantStockForecast(state,"venue-demo",today);
 assert.equal(venue.find(x=>x.stock.productId==="cherry-limeade"&&x.stock.format==="six_pack")?.stock.onHand,0);
});
test("merchant incoming counts only accepted and scheduled, within cutoff",()=>{
 assert.equal(merchantIncomingUnits(state,merchantDemoId,"cherry-limeade","keg","2026-11-20"),0);
 assert.equal(merchantIncomingUnits(state,merchantDemoId,"cherry-limeade","keg","2026-11-22"),2);
 assert.equal(merchantIncomingUnits(state,merchantDemoId,"cherry-limeade","six_pack","2026-12-30"),0);
});
test("usage and count events change merchant stock but not brewery stock, and prevent negatives",()=>{
 let updated=recordMerchantUsage(state,merchantDemoId,"purple-reign","six_pack",2,today,"t1");
 assert.equal(merchantInventoryRow(updated,merchantDemoId,"purple-reign","six_pack").onHand,1);
 assert.equal(updated.finished, state.finished);
 assert.equal(recordMerchantUsage(updated,merchantDemoId,"purple-reign","six_pack",2,today,"t2"),updated);
 updated=recordMerchantCount(updated,merchantDemoId,"purple-reign","six_pack",9,today,"t3");
 assert.equal(merchantInventoryRow(updated,merchantDemoId,"purple-reign","six_pack").onHand,9);
 assert.equal(updated.merchantMovements[0].delta,8);
 assert.equal(recordMerchantCount(updated,merchantDemoId,"purple-reign","six_pack",9,today,"t4"),updated);
 assert.equal(recordMerchantUsage(updated,merchantDemoId,"purple-reign","six_pack",1,today,"t1"),updated);
});
test("merchant par and velocity are editable with bounded values",()=>{
 const x=editMerchantStock(state,merchantDemoId,"purple-reign","six_pack","targetStock",25);
 assert.equal(merchantInventoryRow(x,merchantDemoId,"purple-reign","six_pack").targetStock,25);
 assert.equal(editMerchantStock(x,merchantDemoId,"purple-reign","six_pack","weeklyUse",-1),x);
});
test("merchant receipt requires fulfilled order, matches tenant and cannot double receive",()=>{
 assert.equal(receiveMerchantOrder(state,merchantDemoId,"DEMO-1001",today),state);
 const accepted=transitionOrder(state,"DEMO-1001","scheduled");
 const fulfilled=transitionOrder(accepted,"DEMO-1001","fulfilled");
 const received=receiveMerchantOrder(fulfilled,merchantDemoId,"DEMO-1001",today);
 assert.equal(merchantInventoryRow(received,merchantDemoId,"cherry-limeade","keg").onHand,3);
 assert.equal(merchantInventoryRow(received,merchantDemoId,"rickys-rice-lager","six_pack").onHand,14);
 assert.equal(receiveMerchantOrder(received,merchantDemoId,"DEMO-1001",today),received);
 assert.equal(receiveMerchantOrder(fulfilled,"venue-demo","DEMO-1001",today),fulfilled);
 assert.equal(merchantIncomingUnits(received,merchantDemoId,"cherry-limeade","keg","2026-12-01"),0);
 assert.equal(received.merchantReceipts.length,1);
});
test("buyer can change or cancel only their own pending requests",()=>{
 const changed=amendRequestedMerchantOrder(state,merchantDemoId,"DEMO-1003","2026-12-05",today);
 assert.equal(changed.orders.find(x=>x.id==="DEMO-1003")?.neededBy,"2026-12-05");
 assert.equal(amendRequestedMerchantOrder(state,"venue-demo","DEMO-1003","2026-12-05",today),state);
 assert.equal(amendRequestedMerchantOrder(state,merchantDemoId,"DEMO-1001","2026-12-05",today),state);
 assert.equal(cancelRequestedMerchantOrder(state,merchantDemoId,"DEMO-1001"),state);
 assert.equal(cancelRequestedMerchantOrder(state,merchantDemoId,"DEMO-1003").orders.find(x=>x.id==="DEMO-1003")?.status,"cancelled");
});
test("recurring series creates explicit future requested orders, not accepted commitments",()=>{
 const result=createMerchantSeries(state,merchantDemoId,"Demo partner",
  [{productId:"purple-reign",format:"six_pack",quantity:4}],"2026-11-22",7,4,today,"SERIES-A","weekly replenishment");
 assert.equal(result.createdOrders,4);
 assert.deepEqual(result.state.orders.filter(x=>x.seriesId==="SERIES-A").map(x=>x.neededBy),
 ["2026-11-22","2026-11-29","2026-12-06","2026-12-13"]);
 assert.equal(result.state.merchantSeries[0].nextDate,"2026-12-20");
 assert.ok(result.state.orders.filter(x=>x.seriesId==="SERIES-A").every(x=>x.status==="requested"));
 assert.equal(merchantOrders(result.state,merchantDemoId).length,6);
 assert.equal(merchantIncomingUnits(result.state,merchantDemoId,"purple-reign","six_pack","2026-12-31"),0);
 const paused=setSeriesActive(result.state,merchantDemoId,"SERIES-A",false);
 assert.equal(extendMerchantSeries(paused,merchantDemoId,"SERIES-A",today).createdOrders,0);
 const extended=extendMerchantSeries(result.state,merchantDemoId,"SERIES-A",today);
 assert.equal(extended.createdOrders,2);
 assert.equal(extended.state.merchantSeries[0].nextDate,"2027-01-03");
 assert.equal(extended.state.orders.filter(x=>x.seriesId==="SERIES-A").length,6);
});
test("future scheduling rejects empty carts, past starts and excessive occurrences",()=>{
 const line=[{productId:"purple-reign",format:"keg" as const,quantity:1}];
 assert.equal(createMerchantSeries(state,merchantDemoId,"Demo",[], "2026-11-22",7,4,today,"s","").createdOrders,0);
 assert.equal(createMerchantSeries(state,merchantDemoId,"Demo",line,"2026-11-01",7,4,today,"s","").createdOrders,0);
 assert.equal(createMerchantSeries(state,merchantDemoId,"Demo",line,"2026-11-22",7,100,today,"s","").createdOrders,0);
 assert.equal(dateAfter("2026-12-31",7),"2027-01-07");
});
test("browser data saved by older versions upgrades and keeps its orders", () => {
 const seed=demoSeed(new Date("2026-11-15T12:00:00"));
 const v1: Record<string,unknown>={version:1,ingredients:seed.ingredients,finished:seed.finished,production:[],orders:seed.orders.filter(x=>x.id!=="DEMO-0998")};
 const fromV1=upgradeDemoLedger(v1,seed);
 assert.equal(fromV1?.version,4);
 assert.equal(fromV1?.orders.length,seed.orders.length);
 assert.ok(fromV1?.merchantStock.length && fromV1.recipes.length && fromV1.accounts.length);
 const custom={...seed.merchantStock[0],onHand:77};
 const v3: Record<string,unknown>={version:3,ingredients:seed.ingredients,finished:seed.finished,production:[],
  orders:[...seed.orders,{...seed.orders[1],id:"BONUS-1",bonus:true}],merchantStock:[custom],merchantMovements:[],merchantSeries:[],merchantReceipts:[],
  referrals:[{id:"r"}],referralRedemptions:[]};
 const fromV3=upgradeDemoLedger(v3,seed);
 assert.equal(fromV3?.version,4);
 assert.equal(fromV3?.merchantStock[0].onHand,77);
 assert.equal(fromV3?.orders.some(x=>x.id==="BONUS-1"),false);
 assert.equal("referrals" in (fromV3??{}),false);
 assert.equal(upgradeDemoLedger(seed,seed),seed);
 assert.equal(upgradeDemoLedger({...seed,accounts:undefined},seed),null);
 assert.equal(upgradeDemoLedger({version:9,ingredients:[],finished:[],orders:[]},seed),null);
});
