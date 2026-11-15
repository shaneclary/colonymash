import { BookingCard } from "@/components/BookingCard";
import { Photo } from "@/components/Photo";
import { booking } from "@/content/booking";
import { photos } from "@/content/photos";
import { routes } from "@/content/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Private events",
  description: "Book the Colony Mash taproom in Atascadero for a private event. Saturdays are set aside for one group at a time.",
  path: routes.privateEvents,
});

export default function PrivateEventsPage() {
  return (
    <section data-theme="paper" className="cm-section cm-root" aria-label={booking.title}>
      <div className="cm-wrap cm-split">
        <BookingCard headingLevel="h1" />
        <Photo slot={photos.privateRoom} />
      </div>
    </section>
  );
}
