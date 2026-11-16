import { AdminPortal } from "@/components/portal/AdminPortal";
import { pageMeta } from "@/lib/seo";
import { site } from "@/content/site";
import { notFound } from "next/navigation";
import "../../portal.css";
export const metadata = pageMeta({
  title: "Staff Operations Demo",
  description: "Private-design prototype for illustrative brewery inventory, production and merchant requests.",
  path: "/portal/admin", index: false,
});
export default function AdminDemoPage() { if (site.indexable) notFound(); return <AdminPortal/>; }
