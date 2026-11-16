import type { MetadataRoute } from "next";
import { drinks } from "@/content/drinks";
import { drinkPath, routes, site } from "@/content/site";

/** Every public page. Empty on staging, where nothing should be indexed. */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!site.indexable) return [];
  const pages = [routes.home, routes.onTap, routes.seltzer, routes.visit, routes.community, routes.explore, routes.order, routes.privateEvents, routes.story];
  const drinkPages = drinks.map((drink) => drinkPath(drink.slug));
  return [...pages, ...drinkPages].map((path) => ({ url: `${site.url}${path === "/" ? "" : path}` }));
}
