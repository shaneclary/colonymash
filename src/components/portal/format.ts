import { demoProducts, litersPerBarrel, packLabels, type DemoState, type TradeLine } from "@/content/portal-demo";

const formatDay = (iso: string, options: Intl.DateTimeFormatOptions) => {
  const date = new Date(iso + "T12:00:00Z");
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(date) : iso;
};
/** "Nov 19" */
export const shortDate = (iso: string) => formatDay(iso, { month: "short", day: "numeric" });
/** "Thu, Nov 19" */
export const dayDate = (iso: string) => formatDay(iso, { weekday: "short", month: "short", day: "numeric" });
export const monthTitle = (year: number, month: number) =>
  formatDay(year + "-" + String(month).padStart(2, "0") + "-01", { month: "long", year: "numeric" });
export const liters = (value: number) => Number(value.toFixed(1)).toLocaleString("en-US") + " L";
export const barrels = (value: number) => (value / litersPerBarrel).toFixed(1) + " bbl";
export const amount = (value: number) => Number(value.toFixed(2)).toLocaleString("en-US");
export const productName = (id: string) => demoProducts.find(x => x.id === id)?.name ?? id;
export const lineText = (lines: readonly TradeLine[]) =>
  lines.map(x => x.quantity + " " + packLabels[x.format].toLowerCase() + " " + productName(x.productId)).join(" · ");
export const newId = (prefix: string) => prefix + "-" + Date.now().toString(36).toUpperCase().slice(-6);
/** Record a change with a label the undo bar can show. False when nothing changed. */
export type Commit = (label: string, change: (state: DemoState) => DemoState) => boolean;
/** Run a change that can refuse. Shows the reason when it does. */
export type Run = (label: string, change: (state: DemoState) => { state: DemoState; error?: string }) => boolean;
export type PanelProps = { state: DemoState; commit: Commit; run: Run; today: string; /** Real data, not the sample demo. */ live?: boolean };
