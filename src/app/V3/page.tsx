import { V3Experience } from "@/components/V3Experience";
import { drinks } from "@/content/drinks";
import { pageMeta } from "@/lib/seo";
import "../v3.css";

export const metadata = pageMeta({
  title: "V3 Experience Preview — Find Your Color",
  description: "An interactive preview of the Colony Mash Flavor DNA, release archive, Cabana Lab and flavor passport.",
  path: "/V3",
  index: false,
});

export default function V3ReviewPage() {
  return <V3Experience drinks={drinks} />;
}
