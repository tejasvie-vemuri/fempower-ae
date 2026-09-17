/**
 * Byline + freshness signals for public content pages.
 *
 * Search engines and AI assistants strongly favour pages that say who wrote
 * them and when they were last checked. This renders a visible byline and
 * emits matching schema.org Article data (author, publisher, dateModified)
 * so the same facts are machine-readable.
 */

const SITE = "https://fempowerae.com";

type Props = {
  /** Page headline, used as the Article headline. */
  title: string;
  /** Absolute canonical URL of this page. */
  url: string;
  /** Human-readable modified date, e.g. "14 August 2026". */
  updated: string;
  /** ISO date matching `updated`, e.g. "2026-08-14". */
  updatedIso: string;
  /** Optional ISO first-published date. */
  publishedIso?: string;
};

const PageByline = ({ title, url, updated, updatedIso, publishedIso }: Props) => {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    inLanguage: "en-AE",
    dateModified: updatedIso,
    author: {
      "@type": "Organization",
      name: "Fempower",
      url: SITE,
      "@id": `${SITE}/#organization`,
    },
    publisher: { "@id": `${SITE}/#organization` },
  };
  if (publishedIso) jsonLd.datePublished = publishedIso;

  return (
    <>
      <p className="text-sm text-muted-foreground font-body">
        Written by the Fempower editorial team in Dubai ·{" "}
        <span>
          Last updated:{" "}
          <time dateTime={updatedIso}>{updated}</time>
        </span>
      </p>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
};

export default PageByline;
