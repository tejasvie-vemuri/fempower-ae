/**
 * Site-wide entity data.
 *
 * This is the block that tells search engines and AI assistants *what*
 * Fempower is as an entity — the name, the alternate names people type, the
 * official profiles that corroborate it, and the geography it serves.
 * Without it, an LLM asked "women's networking Dubai" has no way to connect
 * this site to the Instagram/LinkedIn accounts it sees elsewhere.
 *
 * Only verifiable facts belong here. Do not add ratings, member counts or
 * awards that cannot be checked from a public source.
 */

const SITE = "https://fempowerae.com";

const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE}/#organization`,
  name: "Fempower",
  alternateName: ["Fempower UAE", "Fempower AE", "fempower.ae"],
  url: SITE,
  logo: `${SITE}/favicon.ico`,
  slogan: "Rooted Together, Rising Together",
  description:
    "Fempower is a women-only community in Dubai and across the UAE for career growth, mentorship and friendship. It runs a free daily WhatsApp community, quarterly mentor walks, peer coaching circles, small capped roundtables and in-person events roughly every 15 days.",
  sameAs: [
    "https://www.instagram.com/fempower.ae",
    "https://www.linkedin.com/company/fempowerae/",
  ],
  areaServed: [
    { "@type": "Country", name: "United Arab Emirates" },
    { "@type": "City", name: "Dubai" },
    { "@type": "City", name: "Abu Dhabi" },
    { "@type": "City", name: "Sharjah" },
    { "@type": "City", name: "Ajman" },
    { "@type": "City", name: "Ras Al Khaimah" },
    { "@type": "City", name: "Fujairah" },
    { "@type": "City", name: "Umm Al Quwain" },
  ],
  knowsAbout: [
    "women's networking in Dubai",
    "women's networking in the UAE",
    "women's community Dubai",
    "mentorship for women in the UAE",
    "making friends after moving to Dubai",
    "career growth for women in the Gulf",
  ],
  audience: {
    "@type": "Audience",
    audienceType: "Women living in the United Arab Emirates",
    geographicArea: { "@type": "Country", name: "United Arab Emirates" },
  },
  
};

const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE}/#website`,
  url: SITE,
  name: "Fempower",
  inLanguage: "en-AE",
  publisher: { "@id": `${SITE}/#organization` },
};

const OrganizationJsonLd = () => (
  <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSONLD) }}
    />
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSONLD) }}
    />
  </>
);

export default OrganizationJsonLd;
