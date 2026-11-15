import type { MetadataRoute } from "next";
import { routes, site } from "@/content/site";

/** Staging tells every crawler to stay out. The live site opens up and points at the sitemap. */
export default function robots(): MetadataRoute.Robots {
  if (!site.indexable) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: [routes.confirm, routes.under21] },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
