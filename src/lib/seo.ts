import type { Metadata } from "next";
import { schedule } from "@/content/hours";
import { site } from "@/content/site";
import { dayOrder, type DayKey } from "@/lib/status";

/**
 * Page metadata with a canonical URL and the right robots setting.
 * A page is indexable only when the whole site is (NEXT_PUBLIC_INDEXABLE=true)
 * and the page itself is meant to be found (index !== false).
 */
export function pageMeta(input: {
  title: string;
  description: string;
  path: string;
  index?: boolean;
  /** Use the title as written, without " | Colony Mash" after it. */
  absoluteTitle?: boolean;
}): Metadata {
  const indexable = site.indexable && input.index !== false;
  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: { canonical: input.path },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title: input.title,
      description: input.description,
      url: input.path,
      siteName: site.fullName,
      type: "website",
      locale: "en_US",
    },
    twitter: { card: "summary", title: input.title, description: input.description },
  };
}

const schemaDay: Record<DayKey, string> = {
  mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday",
};

/** The brewery as search engines read it. Only rendered once the site is live and the facts are confirmed. */
export function breweryLd() {
  const openDays = dayOrder.flatMap((day) => {
    const hours = schedule.weekly[day];
    return hours.kind === "open"
      ? [{ "@type": "OpeningHoursSpecification", dayOfWeek: schemaDay[day], opens: hours.opens, closes: hours.closes }]
      : [];
  });
  return {
    "@context": "https://schema.org",
    "@type": "Brewery",
    "@id": `${site.url}/#brewery`,
    name: site.fullName,
    description: site.description,
    url: site.url,
    telephone: site.phone.href.replace("tel:", ""),
    email: site.email,
    image: `${site.url}/icon.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    openingHoursSpecification: openDays,
    sameAs: [site.instagram.url],
  };
}
