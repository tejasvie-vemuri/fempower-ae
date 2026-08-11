/**
 * Per-page JSON-LD: FAQPage + BreadcrumbList.
 *
 * Public content pages use this so each one is independently understandable
 * to search engines and AI crawlers, rather than relying on the homepage.
 *
 * Keep answers factual and self-contained. LLMs quote a single Q/A pair out
 * of context, so an answer that only makes sense after reading the one above
 * it will be quoted wrongly or not at all.
 */

export type Faq = { q: string; a: string };

type Props = {
  /** Page title as it should appear in the breadcrumb trail. */
  name: string;
  /** Absolute canonical URL of this page. */
  url: string;
  faqs: Faq[];
};

const PageJsonLd = ({ name, url, faqs }: Props) => {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://fempowerae.com/" },
      { "@type": "ListItem", position: 2, name, item: url },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  );
};

export default PageJsonLd;
