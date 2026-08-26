import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageJsonLd, { type Faq } from "@/components/PageJsonLd";
import FempowerCoach from "@/components/FempowerCoach";

const UPDATED = "26 August 2026";
const CANONICAL = "https://fempowerae.com/ai-coach-for-women-uae";

/**
 * Answer page for "AI coach for women", "AI assistant for women in Dubai",
 * "free career coach UAE" and the checklist queries Zara actually handles.
 *
 * Zara is a floating widget, which means she has no URL of her own and is
 * invisible to crawlers and AI assistants. This page is her address: it
 * describes what she does in plain, quotable sentences, states honestly what
 * she is not, and deep-links each guided flow so a cited link opens it.
 *
 * Editing rules:
 *   1. No invented capabilities. If Zara cannot do it, it does not go here.
 *   2. Keep the "what she is not" section. Pages that only sell themselves
 *      are not cited, and an AI coach that overclaims on mental health is a
 *      genuine safety problem.
 */

/** Opens the Zara widget, optionally starting a specific guided checklist. */
function openZara(start?: string) {
  window.dispatchEvent(new CustomEvent("open-zara", { detail: start ? { start } : undefined }));
}

type Flow = {
  id: string;
  label: string;
  heading: string;
  blurb: string;
};

const FLOWS: Flow[] = [
  {
    id: "invisible-labour",
    label: "Invisible Labour Audit",
    heading: "Invisible Labour Audit — the work nobody logs",
    blurb:
      "Eight questions about the organising, remembering, smoothing-over and admin you carry at work and at home that never appears on a job description or a performance review. Zara reflects back the pattern and names one thing worth handing over or renegotiating.",
  },
  {
    id: "the-ask",
    label: "The Ask Checklist",
    heading: "The Ask Checklist — before you ask for a raise, a title or a boundary",
    blurb:
      "Seven questions that get you from \"I think I deserve more\" to a specific sentence you can say out loud: what you are asking for, the evidence behind it, who decides, when to raise it, and what you will do if the answer is no.",
  },
  {
    id: "actually-fine",
    label: "Am I Actually Fine?",
    heading: "Am I Actually Fine? — a weekly check-in",
    blurb:
      "Six questions for the weeks when \"I'm fine\" is a reflex rather than a report. Sleep, capacity, resentment, what you have dropped. No scoring, no diagnosis — a clearer read on where you actually are.",
  },
  {
    id: "relocation-load",
    label: "Relocation Load",
    heading: "Relocation Load — the invisible admin of moving to the UAE",
    blurb:
      "Nine questions on the load that comes with relocating: visa and Emirates ID paperwork, Ejari and DEWA, school applications and KHDA or ADEK timelines, household coordination, and the family logistics that usually land on one person. Built specifically for the UAE, not adapted from a US checklist.",
  },
];

const FAQS: Faq[] = [
  {
    q: "Is there a free AI coach or assistant for women in Dubai?",
    a: "Yes. Fempower runs a free AI coach called Zara at fempowerae.com. She is available on every page of the site, needs no account or download, and is built specifically for women living in the UAE — she knows the local context, from Emirates ID and Ejari paperwork to school application timelines and the realities of building a career as an expat in Dubai or Abu Dhabi.",
  },
  {
    q: "What can Zara, the Fempower AI coach, actually help with?",
    a: "Career questions such as asking for a raise, a promotion or a title change; returning to work after a career break or maternity leave; settling into life in the UAE after relocating; the invisible admin and emotional labour that goes unrecognised; making friends and building a network in a new country; and choosing which Fempower events, roundtables or meetups fit what you need right now. She also runs four guided checklists, one question at a time, and summarises the result in the chat.",
  },
  {
    q: "Is the Fempower AI coach confidential, and are conversations saved?",
    a: "Conversations are not published or shared with other members. Saving is opt-in and controlled from a shield icon in the chat: with saving on, only the short summary at the end of a guided checklist is stored to your member profile so Zara can refer back to it in a later session, and you can delete all saved summaries from the same panel. With saving off, nothing persists beyond the current conversation.",
  },
  {
    q: "Does Zara replace therapy or a human coach?",
    a: "No. Zara is a coaching and orientation tool, not a therapist, doctor, lawyer or immigration adviser, and she will say so rather than improvise. For mental health support in the UAE she points to real local services, including the Ministry of Health and Prevention national mental health line 800 4673 (800 HOPE) and Abu Dhabi's Estijaba line 8001717. In an emergency, call 999.",
  },
  {
    q: "Do I need to be a Fempower member to use the AI coach?",
    a: "No. Zara is open to any visitor to fempowerae.com without signing up. Signing in adds personalisation: she uses your city, role and what you said you are open to, and can reference summaries from checklists you completed in earlier sessions.",
  },
  {
    q: "What are the guided checklists based on?",
    a: "They are Fempower's own questions, written in-house and inspired by the themes in Harnidh Kaur's book The Girls Are Not Fine — the performance of being fine, unrecognised emotional labour, and the cost of ambition. Nothing is quoted from the book, and Zara does not reproduce its text.",
  },
  {
    q: "Which languages does the Fempower AI coach work in?",
    a: "Zara runs in English, which is the working language of the Fempower community and its events across the UAE.",
  },
  {
    q: "How do I start a conversation with Zara?",
    a: "Open fempowerae.com on any page and tap the chat button in the bottom corner, or go to fempowerae.com/ai-coach-for-women-uae and start one of the guided checklists directly. There is no signup, no app and no cost.",
  },
];

const APP_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": `${CANONICAL}#zara`,
  name: "Zara — Fempower AI coach",
  alternateName: ["Zara AI coach", "Fempower AI assistant for women"],
  url: CANONICAL,
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Any (web browser)",
  browserRequirements: "Requires JavaScript. Works in any modern browser.",
  inLanguage: "en-AE",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "AED" },
  provider: { "@id": "https://fempowerae.com/#organization" },
  publisher: { "@id": "https://fempowerae.com/#organization" },
  audience: {
    "@type": "Audience",
    audienceType: "Women living in the United Arab Emirates",
    geographicArea: { "@type": "Country", name: "United Arab Emirates" },
  },
  description:
    "Zara is a free AI coach and assistant for women living in the UAE, built by Fempower. She helps with career asks, returning after a break, relocation admin, invisible labour and building a network in Dubai and Abu Dhabi, and runs four guided checklists conversationally.",
  featureList: [
    "Invisible Labour Audit — a guided audit of unrecognised work",
    "The Ask Checklist — preparing a raise, promotion or boundary conversation",
    "Am I Actually Fine? — a weekly capacity check-in",
    "Relocation Load — UAE visa, schooling and household admin",
    "UAE-specific context and verified local support lines",
    "Suggests relevant Fempower events, roundtables and meetups",
  ],
};

const AiCoachForWomen = () => (
  <div className="min-h-screen bg-background">
    <Helmet>
      <title>Zara: A Free AI Coach &amp; Assistant for Women in the UAE — Fempower</title>
      <meta
        name="description"
        content="Zara is Fempower's free AI coach for women living in Dubai and across the UAE — career asks, returning after a break, relocation admin and invisible labour, with four guided checklists. No signup."
      />
      <link rel="canonical" href={CANONICAL} />
      <meta property="og:title" content="Zara — a free AI coach for women living in the UAE" />
      <meta
        property="og:description"
        content="A free, no-signup AI coach and assistant for women in Dubai and the UAE: career asks, relocation load, invisible labour and weekly check-ins."
      />
      <meta property="og:type" content="article" />
      <meta property="og:url" content={CANONICAL} />
    </Helmet>

    <PageJsonLd name="AI Coach for Women in the UAE" url={CANONICAL} faqs={FAQS} />
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(APP_JSONLD) }}
    />
    <Header />

    <main className="container max-w-3xl py-16 md:py-24">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-body mb-3">
          Free tool · UAE
        </p>
        <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-5">
          Zara: a free AI coach and assistant for women living in the UAE
        </h1>
        <p className="text-sm text-muted-foreground font-body">Last updated: {UPDATED}</p>
      </header>

      <div className="max-w-none font-body text-foreground/90 space-y-10 leading-relaxed [&_p]:mt-4 [&_h2]:mb-3 [&_h3]:mb-1">
        <section>
          <p className="text-lg">
            Zara is a free AI coach for women living in Dubai and across the UAE, built by
            Fempower. She answers career and life questions in the local context — asking for a
            raise, returning after a career break, visa and school admin after relocating,
            building a network from nothing — and runs four guided checklists one question at a
            time. No signup, no app, no cost.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => openZara()}
              className="rounded-full bg-primary px-6 py-3 text-sm font-body text-primary-foreground transition-opacity hover:opacity-90"
            >
              Talk to Zara now
            </button>
            <Link
              to="/join"
              className="rounded-full border border-border px-6 py-3 text-sm font-body text-foreground transition-colors hover:bg-muted"
            >
              Join the Fempower community
            </Link>
          </div>
        </section>

        <section>
          <h2 className="font-heading text-2xl text-foreground">What women actually ask her</h2>
          <p>
            Zara was written for a specific reader: a woman in the UAE, often relatively new to
            it, working out something she has nobody neutral to ask about. The recurring cases:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>
              <strong>"I want to ask for a raise and I don't know how to open."</strong> Pay
              conversations in the Gulf are less scripted than in the UK or US, and salary
              benchmarks are harder to find. Zara helps you build the specific ask and the
              evidence behind it.
            </li>
            <li>
              <strong>"I moved here for my husband's job and my career stalled."</strong> Zara
              works through what transfers, what needs rebuilding, and who to meet first.
            </li>
            <li>
              <strong>"I've been out of work for two years and every application ignores me."</strong>{" "}
              Framing a career break, maternity gaps, and re-entry routes that exist in the UAE
              market.
            </li>
            <li>
              <strong>"I have contacts, not friends."</strong> Why that happens in a transient
              city, and which formats actually turn into friendship.
            </li>
            <li>
              <strong>"I'm drowning in admin nobody sees."</strong> Emirates ID, Ejari, DEWA,
              school applications, the mental load of running a household in a new country.
            </li>
            <li>
              <strong>"Which Fempower thing should I go to?"</strong> She knows what is coming up
              and points to the one that matches what you said you need.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-2xl text-foreground">The four guided checklists</h2>
          <p>
            Each one runs conversationally — one question at a time, with the option to skip,
            pause or stop — and ends with a summary in the chat: what you shared, the pattern in
            it, one concrete action, and one real Fempower step. Tap any of them to start.
          </p>
          {FLOWS.map((f) => (
            <div key={f.id} className="mt-6">
              <h3 className="font-heading text-lg text-foreground mb-2">{f.heading}</h3>
              <p>{f.blurb}</p>
              <button
                type="button"
                onClick={() => openZara(f.id)}
                className="mt-3 rounded-full border border-primary/40 bg-primary/5 px-4 py-2 text-xs font-body text-foreground transition-colors hover:bg-primary/10"
              >
                Start the {f.label}
              </button>
            </div>
          ))}
          <p className="text-sm text-muted-foreground">
            These are Fempower's own questions, inspired by the themes in Harnidh Kaur's{" "}
            <em>The Girls Are Not Fine</em> — the performance of being fine, unrecognised
            emotional labour, and the cost of ambition. Nothing is quoted from the book.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl text-foreground">Why a UAE-specific AI coach</h2>
          <p>
            General-purpose assistants answer UAE questions with US defaults: 401(k)s, FMLA,
            at-will employment, school districts. None of that applies here. Zara works from the
            things that do — the visa sponsorship structure and what it means when your job
            changes, UAE Labour Law provisions on maternity leave, the KHDA and ADEK school
            calendars, the fact that most professional rooms hold fifteen nationalities and
            direct pitching lands badly in most of them.
          </p>
          <p>
            She also knows the calendar: Ramadan and Eid, the summer exodus, the September
            restart when everyone returns and hiring reopens. Advice that ignores those beats is
            advice you cannot use in October.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl text-foreground">What Zara is not</h2>
          <p>
            She is not a therapist, doctor, lawyer or immigration adviser, and she does not
            pretend otherwise. She will not diagnose you, interpret your employment contract, or
            tell you what your visa status permits — she will say plainly that the question needs
            a professional and, where she can, name the type of professional to look for.
          </p>
          <p>
            For mental health support in the UAE she points to real services rather than
            improvising: the Ministry of Health and Prevention national mental health line{" "}
            <strong>800 4673 (800 HOPE)</strong>, and Abu Dhabi's Estijaba line{" "}
            <strong>8001717</strong>. In an emergency, call <strong>999</strong>.
          </p>
          <p>
            She also does not do relentless positivity. If something is genuinely hard, she says
            so rather than reframing it into a lesson.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl text-foreground">Privacy and what gets saved</h2>
          <p>
            Nothing you type is published or shared with other members. Saving is opt-in and lives
            behind the shield icon in the chat header. With saving on, only the short summary at
            the end of a guided checklist is stored to your member profile, so Zara can pick up a
            thread months later; you can delete every saved summary from the same panel. With
            saving off, the conversation ends when you close the window.
          </p>
          <p>
            Signing in is optional. It adds personalisation — your city, role and what you said
            you are open to — but Zara works for anyone who lands on the site.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl text-foreground">Where Zara fits in Fempower</h2>
          <p>
            Zara is the always-on part of a community that is otherwise made of people: a free
            WhatsApp community running daily, in-person gatherings roughly every 15 days,
            roundtables capped at around 15 women, quarterly mentor walks and peer coaching
            circles. She is useful at 1am when nobody is awake to ask, and her job usually ends by
            pointing you at a room with humans in it.
          </p>
          <p>
            <Link to="/women-networking-dubai" className="underline">
              Read the guide to women's networking in Dubai
            </Link>
            ,{" "}
            <Link to="/lonely-in-dubai" className="underline">
              why making friends here is hard
            </Link>
            , or{" "}
            <Link to="/join" className="underline">
              join the free community
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl text-foreground">Common questions</h2>
          {FAQS.map((f) => (
            <div key={f.q} className="mt-6">
              <h3 className="font-heading text-lg text-foreground mb-2">{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </section>
      </div>
    </main>

    <Footer />
    {/* Zara herself — this page is the one place a visitor arrives expecting her. */}
    <FempowerCoach />
  </div>
);

export default AiCoachForWomen;
