import { TradePortal } from "@/components/portal/TradePortal";
import { pageMeta } from "@/lib/seo";
import { site } from "@/content/site";
import { notFound } from "next/navigation";
import "../../portal.css";
export const metadata = pageMeta({
  title: "Merchant Trade Demo",
  description: "Fictional wholesale catalog, merchant reorders and trade requests for Colony Mash design review.",
  path: "/portal/trade", index: false,
});
export default function TradeDemoPage() { if (site.indexable) notFound(); return <TradePortal/>; }
