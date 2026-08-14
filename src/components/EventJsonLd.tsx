/**
 * schema.org Event markup for a single event page.
 *
 * This is what puts Fempower into "women's events in Dubai this month" style
 * answers: assistants and search engines read dates, place and price from
 * structured data, not from the layout.
 */

const SITE = "https://fempowerae.com";

type Props = {
  slug: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startsAt: string;
  endsAt?: string | null;
  priceCents: number;
  currency: string;
  coverImageUrl?: string | null;
  status: string;
  capacity: number;
  seatsTaken: number;
};

const EventJsonLd = ({
  slug,
  title,
  description,
  location,
  startsAt,
  endsAt,
  priceCents,
  currency,
  coverImageUrl,
  status,
  capacity,
  seatsTaken,
}: Props) => {
  const url = `${SITE}/events/${slug}`;
  const isFull = capacity > 0 && seatsTaken >= capacity;

  const availability =
    status === "cancelled"
      ? "https://schema.org/SoldOut"
      : isFull
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock";

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: title,
    url,
    startDate: startsAt,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus:
      status === "cancelled"
        ? "https://schema.org/EventCancelled"
        : "https://schema.org/EventScheduled",
    description:
      description?.slice(0, 500) ||
      `A Fempower gathering for women in the UAE${location ? ` at ${location}` : ""}.`,
    location: {
      "@type": "Place",
      name: location || "United Arab Emirates",
      address: {
        "@type": "PostalAddress",
        addressLocality: location || "Dubai",
        addressCountry: "AE",
      },
    },
    organizer: {
      "@type": "Organization",
      name: "Fempower",
      url: SITE,
      "@id": `${SITE}/#organization`,
    },
    isAccessibleForFree: priceCents === 0,
    inLanguage: "en-AE",
    audience: {
      "@type": "Audience",
      audienceType: "Women living in the United Arab Emirates",
    },
    offers: {
      "@type": "Offer",
      url,
      price: (priceCents / 100).toFixed(2),
      priceCurrency: currency,
      availability,
      category: "Members only — Fempower membership required to register",
    },
  };

  if (endsAt) jsonLd.endDate = endsAt;
  if (coverImageUrl) jsonLd.image = [coverImageUrl];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};

export default EventJsonLd;
