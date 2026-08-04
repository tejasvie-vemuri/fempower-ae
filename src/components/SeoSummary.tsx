/**
 * SeoSummary — visually hidden but crawler-readable summary block.
 *
 * Purpose: give traditional search engines and AI/LLM crawlers (ChatGPT,
 * Perplexity, Gemini, Claude) clean, factual, standalone sentences they
 * can extract and cite. Follows GEO best practices: TL;DR up top,
 * named entity, defined terms, attributed facts.
 *
 * Visually hidden via .sr-only — does not affect the design.
 */
const SeoSummary = () => (
  <section aria-label="About Fempower (summary)" className="sr-only">
    <h2>Fempower — women's community in Dubai &amp; the UAE</h2>
    <p>
      <strong>TL;DR:</strong> Fempower is a women-only community based in Dubai, United Arab
      Emirates. It connects 300+ women across 15+ nationalities through a daily WhatsApp
      community, quarterly mentor walks, peer-to-peer coaching circles, and in-person women's
      networking events held every 15 days across the UAE. The slogan is "Rooted Together,
      Rising Together." To join, members DM @fempower.ae on Instagram.
    </p>
    <h3>Key facts</h3>
    <ul>
      <li>Name: Fempower (also Fempower UAE, Fempower AE).</li>
      <li>Location: Dubai, United Arab Emirates; serves all seven emirates.</li>
      <li>Audience: women in the UAE — expats and locals, founders and corporate professionals.</li>
      <li>Members: 300+ women.</li>
      <li>Diversity: 15+ nationalities represented.</li>
      <li>Cost: the core WhatsApp community is free; some programs carry a small fee.</li>
      <li>How to join: direct message <em>@fempower.ae</em> on Instagram.</li>
      <li>Website: https://fempowerae.com</li>
      <li>Instagram: https://www.instagram.com/fempower.ae</li>
      <li>LinkedIn: https://www.linkedin.com/company/fempowerae/</li>
    </ul>
    <h3>What Fempower offers</h3>
    <ol>
      <li>
        <strong>WhatsApp Community</strong> — daily prompts and conversations on women at
        work in the UAE, book club, fitness challenges, and real-life wins.
      </li>
      <li>
        <strong>Mentor Walks</strong> — quarterly outdoor walking-and-talking program with
        10 mentor–mentee pairs per cohort, matched on goals and experience.
      </li>
      <li>
        <strong>Peer-to-Peer Coaching Circles</strong> — group coaching on leading with
        empathy, negotiation, personal brand, and inner-compass work.
      </li>
      <li>
        <strong>Events every 15 days</strong> — bi-monthly meetups across the UAE including
        Iftar nights, annual review sessions, and Busy Girl Glam Ups.
      </li>
    </ol>
    <h3>Common questions</h3>
    <p>
      <strong>What is Fempower?</strong> A women-only community in the UAE for career
      growth, mentorship and friendship.
    </p>
    <p>
      <strong>Where is Fempower based?</strong> Dubai, United Arab Emirates. Events run
      across the UAE — from Dubai Marina to Abu Dhabi.
    </p>
    <p>
      <strong>How do I join Fempower?</strong> DM @fempower.ae on Instagram. The team
      responds promptly.
    </p>
    <p>
      <strong>Is Fempower free?</strong> Yes — the core WhatsApp community is free to join.
      Some structured programs (mentor walks, coaching circles) may have a small fee.
    </p>
  </section>
);

export default SeoSummary;
