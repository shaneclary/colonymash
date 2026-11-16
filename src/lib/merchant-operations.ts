import {
  demoProducts, plusDays, type DemoState, type MerchantMovement, type MerchantSeries,
  type MerchantStock, type PackFormat, type TradeLine, type TradeOrder,
} from "../content/portal-demo.ts";
import { isTradeLine, sanitizeTradeLines } from "./portal-forecast.ts";

export const merchantFormats: { id: PackFormat; label: string }[] = [
  { id: "can", label: "Single cans" },
  { id: "six_pack", label: "6-packs" },
  { id: "keg", label: "Kegs" },
];
const validProduct = new Set(demoProducts.map(x => x.id));
const validFormat = new Set<PackFormat>(["can", "six_pack", "keg"]);
const validDay = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(new Date(value + "T12:00:00Z").getTime()) &&
  new Date(value + "T12:00:00Z").toISOString().slice(0, 10) === value;

export function dateAfter(iso: string, days: number): string {
  if (!validDay(iso) || !Number.isSafeInteger(days)) return "";
  const day = new Date(iso + "T12:00:00Z");
  day.setUTCDate(day.getUTCDate() + days);
  return day.toISOString().slice(0, 10);
}
export function merchantInventoryRow(state: DemoState, merchantId: string, productId: string, format: PackFormat): MerchantStock {
  return state.merchantStock.find(x=>x.merchantId===merchantId && x.productId===productId && x.format===format) ??
    { merchantId, productId, format, onHand: 0, minStock: 0, targetStock: 0, weeklyUse: 0, leadDays: 7 };
}
export function merchantIncomingUnits(
  state: DemoState, merchantId: string, productId: string, format: PackFormat, byDate?: string,
) {
  return state.orders.filter(o=>o.merchantId===merchantId && (o.status==="accepted" || o.status==="scheduled") &&
    (!byDate || o.neededBy<=byDate) && !state.merchantReceipts.some(x=>x.orderId===o.id && x.merchantId===merchantId))
    .flatMap(o=>o.lines).filter(x=>x.productId===productId && x.format===format)
    .reduce((sum,x)=>sum+x.quantity,0);
}

export type MerchantStockForecast = {
  stock: MerchantStock;
  inbound: number;
  expectedUse: number;
  projected: number;
  suggested: number;
  daysCover: number | null;
  status: "low" | "plan" | "covered" | "unconfigured";
};
export function merchantStockForecast(state: DemoState, merchantId: string, today: string): MerchantStockForecast[] {
  return demoProducts.flatMap(product=>merchantFormats.map(({id:format})=>{
    const stock=merchantInventoryRow(state,merchantId,product.id,format);
    const onHand=Math.max(0,stock.onHand);
    const daysCover=stock.weeklyUse>0 ? onHand*7/stock.weeklyUse : null;
    const deliveryWindow=dateAfter(today,stock.leadDays);
    const inbound=merchantIncomingUnits(state,merchantId,product.id,format,deliveryWindow);
    const expectedUse=Math.ceil(stock.weeklyUse*stock.leadDays/7);
    const projected=Math.max(0,onHand-expectedUse)+inbound;
    const suggested=Math.min(99,Math.max(0,Math.ceil(stock.targetStock-projected)));
    const status: MerchantStockForecast["status"] = stock.minStock===0 && stock.targetStock===0 && stock.weeklyUse===0
      ? "unconfigured" : onHand<=stock.minStock || (daysCover!==null && daysCover<=stock.leadDays)
      ? "low" : suggested>0 ? "plan" : "covered";
    return {stock,inbound,expectedUse,projected,suggested,daysCover,status};
  }));
}
export function editMerchantStock(
  state: DemoState, merchantId: string, productId: string, format: PackFormat,
  key: "minStock" | "targetStock" | "weeklyUse" | "leadDays", value: number,
): DemoState {
  if(!merchantId || !validProduct.has(productId) || !validFormat.has(format) ||
    !Number.isFinite(value) || value<0 || value>10000 || (key==="leadDays" && !Number.isSafeInteger(value))) return state;
  const current=merchantInventoryRow(state,merchantId,productId,format);
  const updated={...current,[key]:value};
  const others=state.merchantStock.filter(x=>!(x.merchantId===merchantId && x.productId===productId && x.format===format));
  return {...state,merchantStock:[...others,updated]};
}
function recordMerchantDelta(
  state: DemoState, merchantId: string, productId: string, format: PackFormat,
  delta: number, kind: MerchantMovement["kind"], date: string, eventId: string, note: string, orderId?: string,
): DemoState {
  if (!merchantId || !validProduct.has(productId) || !validFormat.has(format) ||
      !Number.isSafeInteger(delta) || Math.abs(delta)>100000 || !validDay(date) ||
      !eventId || state.merchantMovements.some(m=>m.id===eventId)) return state;
  const current=merchantInventoryRow(state,merchantId,productId,format);
  const next=current.onHand+delta;
  if (next<0 || next>100000 || delta===0) return state;
  const update={...current,onHand:next};
  const others=state.merchantStock.filter(x=>!(x.merchantId===merchantId && x.productId===productId && x.format===format));
  const movement:MerchantMovement={id:eventId,merchantId,productId,format,delta,kind,at:date,note:note.slice(0,160),...(orderId?{orderId}:{})};
  return {...state,merchantStock:[...others,update],merchantMovements:[movement,...state.merchantMovements].slice(0,500)};
}
export function recordMerchantUsage(
  state: DemoState, merchantId: string, productId: string, format: PackFormat,
  used: number, date: string, id: string,
): DemoState {
  if(!Number.isSafeInteger(used) || used<=0) return state;
  return recordMerchantDelta(state,merchantId,productId,format,-used,"sale",date,id,"Sold / used by merchant (simulated)");
}
export function recordMerchantCount(
  state: DemoState, merchantId: string, productId: string, format: PackFormat,
  counted: number, date: string, id: string,
): DemoState {
  if(!Number.isSafeInteger(counted) || counted<0 || counted>100000) return state;
  const before=merchantInventoryRow(state,merchantId,productId,format).onHand;
  return recordMerchantDelta(state,merchantId,productId,format,counted-before,"count",date,id,"Physical count correction (simulated)");
}

export function receiveMerchantOrder(state:DemoState, merchantId:string, orderId:string, date:string):DemoState {
  const order=state.orders.find(x=>x.id===orderId && x.merchantId===merchantId);
  if(!order || order.status!=="fulfilled" || !validDay(date) ||
    state.merchantReceipts.some(x=>x.orderId===orderId && x.merchantId===merchantId)) return state;
  const lines=sanitizeTradeLines(order.lines);
  if(!lines.length) return state;
  let next=state;
  for (const [index,line] of lines.entries()) {
    const updated=recordMerchantDelta(next,merchantId,line.productId,line.format,line.quantity,
      "receipt",date,"RECEIPT-"+orderId+"-"+index,"Trade delivery received (simulated)",orderId);
    // All lines must succeed: no partial receipts or falsely marked orders.
    if(updated===next) return state;
    next=updated;
  }
  return {...next,merchantReceipts:[...state.merchantReceipts,{merchantId,orderId,receivedAt:date}]};
}

export function merchantOrders(state: DemoState,merchantId:string):TradeOrder[] {
  return state.orders.filter(x=>x.merchantId===merchantId).sort((a,b)=>a.neededBy.localeCompare(b.neededBy));
}
export function amendRequestedMerchantOrder(
  state:DemoState,merchantId:string,orderId:string,newDate:string,today:string,
):DemoState {
  if(!validDay(newDate)||newDate<today) return state;
  const current=state.orders.find(x=>x.id===orderId && x.merchantId===merchantId);
  if(!current||current.status!=="requested")return state;
  return {...state,orders:state.orders.map(x=>x.id===orderId?{...x,neededBy:newDate}:x)};
}
export function cancelRequestedMerchantOrder(state:DemoState,merchantId:string,orderId:string):DemoState {
  const current=state.orders.find(x=>x.id===orderId && x.merchantId===merchantId);
  if(!current||current.status!=="requested") return state;
  return {...state,orders:state.orders.map(x=>x.id===orderId?{...x,status:"cancelled" as const}:x)};
}
export function setSeriesActive(state:DemoState,merchantId:string,seriesId:string,active:boolean):DemoState {
  if(!state.merchantSeries.some(x=>x.id===seriesId && x.merchantId===merchantId))return state;
  return {...state,merchantSeries:state.merchantSeries.map(x=>x.id===seriesId && x.merchantId===merchantId?{...x,active}:x)};
}
export type ScheduleResult = { state:DemoState; error?:string; createdOrders:number };
export function createMerchantSeries(
  state:DemoState, merchantId:string,merchantName:string, lines:TradeLine[],
  firstDate:string,cadenceDays:7|14|28,occurrences:number,today:string,seriesId:string,notes:string,
):ScheduleResult {
  const clean=sanitizeTradeLines(lines);
  if(!clean.length)return {state,error:"Select at least one packaged product.",createdOrders:0};
  if(!validDay(firstDate)||firstDate<today)return {state,error:"Choose a future starting date.",createdOrders:0};
  if(![7,14,28].includes(cadenceDays)||!Number.isSafeInteger(occurrences)||occurrences<2||occurrences>6)
    return {state,error:"Select 2–6 future occurrences and a supported cadence.",createdOrders:0};
  if(!merchantId||!seriesId||state.merchantSeries.some(x=>x.id===seriesId)||
      state.orders.length+occurrences>100)return {state,error:"This schedule cannot be added. Reset demo data if needed.",createdOrders:0};
  const nextDate=dateAfter(firstDate,cadenceDays*occurrences);
  const series:MerchantSeries={id:seriesId,merchantId,merchantName,lines:clean,cadenceDays,nextDate,active:true,notes:notes.slice(0,250)};
  const generated:TradeOrder[]=Array.from({length:occurrences},(_,i)=>({
    id:seriesId+"-"+(i+1),merchantId,merchantName,createdAt:today,
    neededBy:dateAfter(firstDate,cadenceDays*i),lines:clean.map(x=>({...x})),
    status:"requested",notes:"Scheduled series (demo). "+series.notes,seriesId,
  }));
  return {state:{...state,merchantSeries:[series,...state.merchantSeries],orders:[...generated,...state.orders]},createdOrders:generated.length};
}
export function extendMerchantSeries(state:DemoState,merchantId:string,seriesId:string,today:string,count=2):ScheduleResult {
  const series=state.merchantSeries.find(x=>x.id===seriesId && x.merchantId===merchantId);
  if(!series || !series.active || count<1 || count>4 || !Number.isSafeInteger(count) ||
    state.orders.length+count>100)return {state,error:"Series is paused or cannot be extended.",createdOrders:0};
  const first=series.nextDate<today?today:series.nextDate;
  const nextDate=dateAfter(first,series.cadenceDays*count);
  const base=state.orders.filter(x=>x.seriesId===seriesId).length;
  const generated:TradeOrder[]=Array.from({length:count},(_,i)=>({
    id:seriesId+"-"+(base+i+1)+"-"+dateAfter(first,series.cadenceDays*i),
    merchantId,merchantName:series.merchantName,createdAt:today,seriesId,
    neededBy:dateAfter(first,series.cadenceDays*i),status:"requested",
    lines:series.lines.map(x=>({...x})),notes:"Extended scheduled series (demo). "+series.notes,
  }));
  return {state:{...state,
    orders:[...generated,...state.orders],
    merchantSeries:state.merchantSeries.map(x=>x.id===seriesId?{...x,nextDate}:x),
  },createdOrders:count};
}

/** Sample stock + order history only; no actual customer account security. */
export function upgradeDemoLedger(raw:unknown, seed:DemoState):DemoState|null {
  if (!raw || typeof raw!=="object")return null;
  const data=raw as Record<string,unknown>;
  const validBase=Array.isArray(data.ingredients)&&Array.isArray(data.finished)&&
    Array.isArray(data.production)&&Array.isArray(data.orders);
  if(!validBase)return null;
  if(data.version===1)return {
    ...seed,ingredients:data.ingredients as DemoState["ingredients"],
    finished:data.finished as DemoState["finished"],production:data.production as DemoState["production"],
    orders:data.orders as DemoState["orders"],
  };
  if(data.version!==2 || !Array.isArray(data.merchantStock) || !Array.isArray(data.merchantMovements) ||
    !Array.isArray(data.merchantSeries) || !Array.isArray(data.merchantReceipts))return null;
  return data as DemoState;
}
