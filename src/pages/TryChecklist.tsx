import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { Share2, ArrowRight, Lock, Clock } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageJsonLd from "@/components/PageJsonLd";
import FempowerCoach from "@/components/FempowerCoach";
import NotFound from "@/pages/NotFound";
import { logEngagement } from "@/lib/engagement";
import {
  TRY_BY_SLUG,
  TRY_CHECKLISTS,
  tryUrl,
  whatsappShareUrl,
  type TryChecklist,
} from "@/lib/zaraChecklists";

/**
 * One short, shareable landing page per Zara checklist (/try/<slug>).
 *
 * These exist for distribution: a WhatsApp status, an IG story or a DM needs a
 * link that opens on a single hook and one button, not the full Zara overview
 * page. Copy rule: lead with the feeling, never with "AI coach".
 */
const TryChecklistPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const checklist: TryChecklist | undefined = slug ? TRY_BY_SLUG[slug] : undefined;

  if (!checklist) return <NotFound />;

  const canonical = tryUrl(checklist.slug);

  const start = () => {
    const ref =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("ref")
        : null;
    void logEngagement("zara_checklist_started", null, {
      checklist: checklist.coachId,
      source: `try_page:${checklist.slug}`,
      ref,
    });
    window.dispatchEvent(
      new CustomEvent("open-zara", { detail: { start: checklist.coachId } }),
    );
  };

  const share = () => {
    void logEngagement("zara_share_click", null, {
      checklist: checklist.coachId,
      source: `try_page:${checklist.slug}`,
    });
    window.open(whatsappShareUrl(checklist, "share"), "_blank", "noopener");
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{checklist.metaTitle}</title>
        <meta name="description" content={checklist.metaDescription} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`${checklist.hook} — ${checklist.label}`} />
        <meta property="og:description" content={checklist.metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
      </Helmet>

      <PageJsonLd name={checklist.label} url={canonical} />
      <Header />

      <main className="container max-w-2xl py-14 md:py-20">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-body mb-4">
          Free · Private · No signup
        </p>

        <h1 className="font-heading text-3xl md:text-5xl leading-tight text-foreground">
          {checklist.hook}
        </h1>

        <p className="mt-5 font-body text-base md:text-lg text-foreground/85 leading-relaxed">
          {checklist.subhook}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-body text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} /> ~{checklist.minutes} min · {checklist.questionCount} questions
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Lock size={14} /> Nothing saved unless you say so
          </span>
        </div>

        {/* Primary action, kept high and thumb-reachable on mobile */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={start}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-4 text-sm font-body font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Start the {checklist.label} <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={share}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-7 py-4 text-sm font-body text-foreground transition-colors hover:bg-muted"
          >
            <Share2 size={16} /> Send to a friend
          </button>
        </div>

        <section className="mt-14">
          <h2 className="font-heading text-2xl text-foreground">
            Three of the {checklist.questionCount} questions
          </h2>
          <ul className="mt-4 space-y-3 font-body text-foreground/90">
            {checklist.sampleQuestions.map((q) => (
              <li
                key={q}
                className="rounded-2xl border border-border/70 bg-card px-5 py-4 leading-relaxed"
              >
                {q}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-body text-muted-foreground leading-relaxed">
            Zara asks them one at a time, reacts to what you say, and ends with a short
            summary of the pattern and one concrete next step. You can skip any question,
            pause, or stop whenever you want.
          </p>
        </section>

        <section className="mt-12 rounded-2xl bg-muted/50 px-6 py-6">
          <h2 className="font-heading text-xl text-foreground">Who is Zara?</h2>
          <p className="mt-3 font-body text-sm text-foreground/85 leading-relaxed">
            Zara is Fempower's free AI coach for women living in the UAE. She knows the local
            context — Emirates ID and Ejari paperwork, school timelines, the reality of
            rebuilding a career after a move — and she is not a therapist, doctor or legal
            adviser, and will say so rather than improvise.{" "}
            <Link to="/ai-coach-for-women-uae" className="underline underline-offset-2">
              More about Zara
            </Link>
            .
          </p>
          <p className="mt-3 font-body text-xs text-muted-foreground leading-relaxed">
            These are Fempower's own questions, inspired by the themes in Harnidh Kaur's{" "}
            <em>The Girls Are Not Fine</em> — the performance of being fine, unrecognised
            emotional labour, and the cost of ambition. Nothing is quoted from the book.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-heading text-xl text-foreground">The other checklists</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {TRY_CHECKLISTS.filter((c) => c.slug !== checklist.slug).map((c) => (
              <Link
                key={c.slug}
                to={`/try/${c.slug}`}
                className="rounded-2xl border border-border/70 px-5 py-4 transition-colors hover:bg-muted"
              >
                <span className="block font-heading text-base text-foreground">{c.label}</span>
                <span className="mt-1 block font-body text-xs text-muted-foreground leading-snug">
                  {c.hook}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-12 text-center">
          <Link
            to="/join"
            className="font-body text-sm underline underline-offset-4 text-foreground/80"
          >
            Or join the Fempower community in the UAE →
          </Link>
        </div>
      </main>

      <Footer />
      <FempowerCoach />
    </div>
  );
};

export default TryChecklistPage;
