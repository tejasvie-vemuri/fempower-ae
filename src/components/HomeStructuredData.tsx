/**
 * Homepage-only JSON-LD: FAQPage + BreadcrumbList.
 * Rendered in the body — Google reads JSON-LD from anywhere in the document.
 */
const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Fempower?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Fempower is a women-only community in the UAE built for career growth, mentorship and friendship. It runs a daily WhatsApp community, quarterly mentor walks, peer coaching circles, and in-person events every 15 days across Dubai and the UAE.",
      },
    },
    {
      "@type": "Question",
      name: "Is Fempower only for women in Dubai?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Fempower welcomes women across all seven emirates of the UAE. Events run in different cities and the WhatsApp community connects women everywhere in the country.",
      },
    },
    {
      "@type": "Question",
      name: "How do I join Fempower?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "DM the @fempower.ae account on Instagram to join. The team responds promptly and adds approved members to the WhatsApp community.",
      },
    },
    {
      "@type": "Question",
      name: "How does the Fempower WhatsApp community work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Members receive daily prompts and join unfiltered conversations on women at work in the UAE, book club, fitness challenges, and real-life wins.",
      },
    },
    {
      "@type": "Question",
      name: "How do Mentor Walks work at Fempower?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Mentor Walks run quarterly with limited slots. Each cohort matches 10 mentor–mentee pairs based on goals and experience and meets for structured outdoor walking conversations.",
      },
    },
    {
      "@type": "Question",
      name: "Are coaching circles free or paid?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The core WhatsApp community is free. Coaching circles and mentor walks may carry a small fee to ensure commitment and quality. Details are shared when applications open.",
      },
    },
    {
      "@type": "Question",
      name: "How often are Fempower events and where are they held?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Fempower hosts events every 15 days across the UAE — from Dubai Marina to Abu Dhabi — including Iftar nights, annual review sessions and Busy Girl Glam Ups.",
      },
    },
    {
      "@type": "Question",
      name: "Is Fempower for founders or corporate professionals?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Both. Fempower is for any woman in the UAE who wants growth — whether building a startup, climbing the corporate ladder, or exploring a career pivot.",
      },
    },
  ],
};

const BREADCRUMB_JSONLD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://fempowerae.com/" },
  ],
};

const HomeStructuredData = () => (
  <>
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
    />
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_JSONLD) }}
    />
  </>
);

export default HomeStructuredData;
