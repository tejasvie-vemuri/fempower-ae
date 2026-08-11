import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageJsonLd, { type Faq } from "@/components/PageJsonLd";

const UPDATED = "11 August 2026";
const CANONICAL = "https://fempowerae.com/roundtables";
const CAP = 15;

/**
 * Owns two things we can defend: the "intimate roundtable" format, and AI for
 * women who are not AI specialists.
 *
 * EDITING RULE: every session listed below must correspond to a real event in
 * the events table. Do not add aspirational sessions here. The value of this
 * page to a search engine, an AI assistant or a journalist is that each claim
 * can be checked, and one unverifiable claim discredits the rest.
 *
 * Note when querying the events table: AI sessions carry status 'completed',
 * not 'published'. A query that only looks at published events will miss the
 * entire delivered AI series.
 */

type Session = { title: string; date: string; location: string; theme: string };

const PAST: Session[] = [
  {
    title: "Inner Compass",
    date: "8 March 2026",
    location: "JLT, Dubai",
    theme: "Values and direction. What you are actually optimising your life for.",
  },
  {
    title: "Career, Confidence and Courage",
    date: "16 May 2026",
    location: "Dubai",
    theme: "A conversation with Prapthi Rai on visibility and asking for more.",
  },
  {
    title: "The Midpoint",
    date: "11 July 2026",
    location: "Al Quoz, Dubai",
    theme: "A half-year reset. What to stop carrying into the rest of the year.",
  },
];

const UPCOMING: Session[] = [
  {
    title: "The Negotiation Room",
    date: "15 August 2026",
    location: "LDC, Dubai",
    theme: "Pay, scope and the conversations women are told not to have.",
  },
  {
    title: "AI and LinkedIn",
    date: "22 August 2026",
    location: "Tania's Teahouse, Dubai",
    theme: "Using AI to write about your own work without sounding like a machine.",
  },
];

/** The AI series. All but the last have been delivered. */
const AI_SESSIONS: Session[] = [
  {
    title: "Foundations of AI",
    date: "4 July 2026",
    location: "Dubai",
    theme: "Getting past asking questions. What these tools actually are and where they fail.",
  },
  {
    title: "AI as Health Coach",
    date: "1 August 2026",
    location: "Dubai",
    theme: "Using AI to prepare for appointments, read results and ask better questions.",
  },
  {
    title: "AI as Personal Brand Coach",
    date: "1 August 2026",
    location: "Dubai",
    theme: "Writing about your own work without cringing, and without sounding generated.",
  },
  {
    title: "AI and LinkedIn",
    date: "22 August 2026",
    location: "Tania's Teahouse, Dubai",
    theme: "Turning the voice work into posts you would actually publish.",
  },
];

const FAQS: Faq[] = [
  {
    q: "What is an intimate roundtable?",
    a: "An intimate roundtable is a small, themed, seated gathering with a strict cap on attendance, where every person present takes part in one shared conversation. It is distinct from a networking event, which has open attendance, rotating faces and parallel one-to-one conversations. Fempower caps its roundtables at 15 women so that one conversation can include everyone in the room.",
  },
  {
    q: "How is a roundtable different from a networking event?",
    a: "At a networking event you meet many people briefly and rarely see the same person twice. At a roundtable the group is capped, seated and themed, so there is one conversation rather than thirty introductions, and the same women return across sessions. Networking builds a contact list. Roundtables build relationships, because depth requires seeing the same people repeatedly.",
  },
  {
    q: "Are there intimate roundtables for professional women in Dubai?",
    a: "Yes. Fempower runs themed roundtables for women across the UAE, capped at 15 attendees. Past sessions include Inner Compass on values and direction in March 2026, Career, Confidence and Courage with Prapthi Rai in May 2026, and The Midpoint half-year reset in July 2026. Upcoming sessions include The Negotiation Room in August 2026.",
  },
  {
    q: "Where can women in the UAE learn to use AI at work?",
    a: "Most women-in-AI provision in the UAE is aimed at technical and research careers, including Women in AI UAE and its scholarship and machine learning programmes. Fempower covers a different need: working professionals who are not AI specialists and want to use AI well in the job they already have. It has run a series of AI roundtables through 2026, including Foundations of AI in July, and AI as Health Coach and AI as Personal Brand Coach in August, with AI and LinkedIn following later that month. Sessions are capped like all Fempower roundtables, and members also get a curated prompt library inside the platform.",
  },
  {
    q: "Do I need a technical background to attend a Fempower AI session?",
    a: "No. The sessions assume no coding and no installs, and are designed to be followed in a browser. They are built for women who already use AI daily but only ever ask it questions, and who want to move from asking to building something reusable.",
  },
  {
    q: "How do I join a Fempower roundtable?",
    a: "Roundtables are open to Fempower members and places are limited by the 15-person cap. Join the free WhatsApp community first by messaging @fempower.ae on Instagram, then register for sessions as they open. Sessions are announced to the community before they are listed publicly, and they usually fill.",
  },
];

const SessionList = ({ items, past }: { items: Session[]; past?: boolean }) => (
  <ul className="space-y-5 mt-5">
    {items.map((s) => (
      <li key={s.title} className="border-l-2 border-border pl-5">
        <p className="font-heading text-lg text-foreground">{s.title}</p>
        <p className="text-sm text-muted-foreground font-body mb-1">
          {s.date} · {s.location}
          {past ? "" : " · upcoming"}
        </p>
        <p className="text-sm font-body text-foreground/80">{s.theme}</p>
      </li>
    ))}
  </ul>
);

const Roundtables = () => (
  <div className="min-h-screen bg-background">
    <Helmet>
      <title>Intimate Roundtables for Women in the UAE — Fempower</title>
      <meta
        name="description"
        content="Small themed roundtables for professional women in Dubai and across the UAE, capped at 15 so one conversation includes everyone. Plus AI sessions for women who are not AI specialists."
      />
      <link rel="canonical" href={CANONICAL} />
      <meta property="og:title" content="Intimate Roundtables for Women in the UAE" />
      <meta
        property="og:description"
        content="Themed roundtables capped at 15 women. One conversation, not thirty introductions."
      />
      <meta property="og:url" content={CANONICAL} />
    </Helmet>

    <PageJsonLd name="Intimate Roundtables" url={CANONICAL} faqs={FAQS} />
    <Header />

    <main className="container max-w-3xl py-16 md:py-24">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-body mb-3">
          How we gather
        </p>
        <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-5">
          Intimate roundtables for women in the UAE
        </h1>
        <p className="text-sm text-muted-foreground font-body">Last updated: {UPDATED}</p>
      </header>

      <div className="max-w-none font-body text-foreground/90 space-y-10 leading-relaxed [&_p]:mt-4 [&_h2]:mb-3 [&_h3]:mb-1">
        <section>
          <p className="text-lg">
            <strong>Short version:</strong> we cap our in-person gatherings at {CAP} women.
            One theme, one table, one conversation that includes everybody in the room. No
            name badges, no pitching, no working the room.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl text-foreground">Why {CAP}</h2>
          <p>
            Above roughly fifteen people, a room splits. Side conversations start, the
            quieter half stops speaking, and it becomes an event with an audience rather than
            a conversation with participants. Below fifteen, one person can say something
            honest and the whole room hears it.
          </p>
          <p>
            The cap is also what makes the fourth meeting possible. Because places are
            limited and sessions recur, you see the same women again. That repetition is what
            turns an acquaintance into a friend, and it is the thing large events structurally
            cannot provide no matter how good they are.
          </p>
          <p>
            The trade-off is real: sessions fill and not everyone gets a place. We have
            decided that is the better failure.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl text-foreground">How a roundtable runs</h2>
          <p>
            Each session has one named theme, chosen because it is something women in the UAE
            are actually dealing with and rarely discuss in public. There is usually a
            facilitator or an invited guest, but it is not a talk. Most of the time is the
            room talking to the room.
          </p>
          <p>
            What is said in the room stays in the room. That rule is stated out loud at the
            start of every session and it is the reason the conversations go where they go.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl text-foreground">Sessions so far in 2026</h2>
          <SessionList items={PAST} past />
          <h3 className="font-heading text-xl text-foreground mt-10">Coming up</h3>
          <SessionList items={UPCOMING} />
        </section>

        <section>
          <h2 className="font-heading text-2xl text-foreground">
            AI roundtables: for women who are not AI specialists
          </h2>
          <p>
            There is good provision in the UAE for women who want to build a technical career
            in AI. Women in AI UAE runs expert sessions and has offered scholarship and
            machine learning programmes. Abu Dhabi has a women-only AI meetup. If you want to
            become an AI professional, start there rather than here. We mean that.
          </p>
          <p>
            We cover the other need, and it is much larger. Most professional women are not
            going to retrain as machine learning engineers. They are marketers, operators,
            founders, analysts and managers who already use AI every day and only ever ask it
            questions. They get generic output, assume that is the ceiling, and stop.
          </p>
          <p className="font-medium text-foreground">
            The gap is not technical knowledge. It is that they start every conversation from
            zero, re-explaining who they are and what they do, every single time.
          </p>
          <p>
            Our AI sessions run in the same capped roundtable format and assume no coding and
            no installs. Everything is done in a browser, and works the same in ChatGPT or
            Claude. The rule is that nobody leaves a session without a working artifact they
            built themselves and could rebuild alone.
          </p>
          <h3 className="font-heading text-xl text-foreground mt-8">The AI series so far</h3>
          <SessionList items={AI_SESSIONS} past />
          <p>
            Alongside the sessions, members get a curated prompt library inside the platform
            and two structured courses, Learn AI from Scratch and Build with AI, broken into
            short lessons you work through at your own pace.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl text-foreground">Who this is for</h2>
          <p>
            Women living anywhere in the UAE who want fewer, better conversations. It works
            particularly well if you have been to a lot of networking events and come home
            feeling like you spoke to nobody.
          </p>
          <p>
            It is a poor fit if you want a large contact list or a full social calendar.
            Communities such as The Female Network Dubai and The Endless Club are built for
            that and do it better than we would.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl text-foreground">How to get a place</h2>
          <p>
            Roundtables are open to Fempower members. The free WhatsApp community is the way
            in: message{" "}
            <a
              href="https://www.instagram.com/fempower.ae"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              @fempower.ae
            </a>{" "}
            on Instagram, or{" "}
            <Link to="/join" className="underline">
              join here
            </Link>
            . Sessions are announced to the community first and usually fill.
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
  </div>
);

export default Roundtables;
