import { PortalLogin } from "@/components/portal/PortalLogin";
import { pageMeta } from "@/lib/seo";
import { site } from "@/content/site";
import { notFound } from "next/navigation";
import "../portal.css";

export const metadata = pageMeta({
  title: "Operations & Merchant Demo Login",
  description: "Review an illustrative Colony Mash staff operations and wholesale merchant portal. Fictional data only.",
  path: "/portal",
  index: false,
});
export default function PortalPage() { if (site.indexable) notFound(); return <PortalLogin/>; }
