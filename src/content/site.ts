// Facts about the brewery. One place, used by pages, the footer and structured data.
// These were gathered from public listings while the brewery's own site was down.
// Anything the owners have not confirmed is listed in questions.ts and tagged on the
// page while the site is in review mode.

const indexable = process.env.NEXT_PUBLIC_INDEXABLE === "true";

export const site = {
  name: "Colony Mash",
  fullName: "Colony Mash Brewing Co.",
  description:
    "A brewery and seltzery in Atascadero, California. Twelve taps of beer and hard seltzer at 3164 El Camino Real.",
  // Live address. Canonical URLs and the sitemap are built from this.
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.colonymashbrewing.com").replace(/\/$/, ""),
  // Staging stays out of search engines until this is set to "true" at launch.
  indexable,
  // Review mode: unconfirmed facts show a dashed "Confirm" tag and empty photo slots show their brief.
  reviewMode: !indexable,
  address: {
    street: "3164 El Camino Real",
    city: "Atascadero",
    region: "CA",
    postalCode: "93422",
    country: "US",
  },
  landmark: "Next to Joebella Coffee",
  phone: { display: "(805) 460-7225", href: "tel:+18054607225" },
  email: "colonymashbrewing@gmail.com",
  instagram: { handle: "@colonymashbrewing", url: "https://www.instagram.com/colonymashbrewing/" },
  directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=3164+El+Camino+Real%2C+Atascadero%2C+CA+93422",
  tapCount: 12,
  legalAge: 21,
  /** Ask visitors to confirm they are of age before the site. Set to false to remove the gate. */
  ageGateEnabled: true,
  /** How long a "yes" at the age gate is remembered on a device. */
  ageGateDays: 30,
} as const;

export const routes = {
  home: "/",
  onTap: "/on-tap",
  seltzer: "/seltzer",
  visit: "/visit",
  privateEvents: "/private-events",
  story: "/story",
  confirm: "/confirm",
  under21: "/under-21",
  explore: "/explore",
  order: "/order",
  updates: "/updates",
  community: "/community",
} as const;

export const drinkPath = (slug: string) => `${routes.onTap}/${slug}`;

/** Main navigation. All ordering remains an availability inquiry until integration. */
export const nav = [
  { label: "On tap", href: routes.onTap },
  { label: "Cans & kegs", href: routes.order },
  { label: "The Colony", href: routes.community },
  { label: "Visit", href: routes.visit },
] as const;
