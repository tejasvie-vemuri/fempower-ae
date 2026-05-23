import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const UPDATED = "23 May 2026";
const CONTACT_EMAIL = "hello@fempowerae.com";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Privacy Policy — Fempower</title>
        <meta
          name="description"
          content="How Fempower collects, uses, and protects your personal data under UAE PDPL. Your rights, our practices, and how to contact us."
        />
        <link rel="canonical" href="https://fempowerae.com/privacy" />
      </Helmet>

      <Header />

      <main className="container max-w-3xl py-16 md:py-24">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-body mb-3">
            Legal
          </p>
          <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground font-body">
            Last updated: {UPDATED}
          </p>
        </header>

        <div className="prose prose-neutral max-w-none font-body text-foreground/90 space-y-8 leading-relaxed">
          <section>
            <p>
              Fempower is a women-only community based in the United Arab
              Emirates. We care deeply about your privacy and treat your
              personal data with the same trust you place in our community.
              This policy explains, in plain language, what we collect, why we
              collect it, how we protect it, and the choices you have. It is
              written to comply with the UAE Personal Data Protection Law
              (Federal Decree-Law No. 45 of 2021, "PDPL") and reflects best
              practice for community platforms.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-foreground">Who we are</h2>
            <p>
              "Fempower", "we", "us" and "our" refer to the Fempower community
              operating in the UAE. If you have any questions about this
              policy or your data, contact us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-primary underline underline-offset-4"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-foreground">
              What data we collect
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account &amp; profile:</strong> name, email, phone
                number (if you provide it), profile photo, bio and the
                information you share in your member profile.
              </li>
              <li>
                <strong>Event &amp; meetup activity:</strong> event
                registrations, RSVPs to pop-up meetups, and any answers you
                give to host questions.
              </li>
              <li>
                <strong>Community contributions:</strong> posts in the Safe
                Circle (which can be posted anonymously — see below) and
                meetups you create or join.
              </li>
              <li>
                <strong>Fempower Coach conversations:</strong> the messages
                you send to our AI coach and the responses generated, so we
                can keep your chat history and improve the experience.
              </li>
              <li>
                <strong>Contact &amp; newsletter:</strong> messages you send
                via our contact form and email addresses submitted to our
                newsletter.
              </li>
              <li>
                <strong>Technical data:</strong> basic logs (such as IP
                address and browser type) handled by our hosting and backend
                providers for security and reliability.
              </li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              We do not knowingly collect data from anyone under 18.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-foreground">
              Why we collect it (legal basis)
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>To run the community</strong> — verify members,
                manage RSVPs, deliver events, and operate the member
                directory. Legal basis: performance of our community
                membership and your consent when joining.
              </li>
              <li>
                <strong>To provide Fempower Coach</strong> — your messages
                are sent to an AI model provider so we can return a response
                and saved to your account so you can revisit the
                conversation. Legal basis: your consent when you use the
                feature.
              </li>
              <li>
                <strong>To keep the community safe</strong> — admins can
                review and moderate posts, meetups and member applications.
                Legal basis: our legitimate interest in a safe space.
              </li>
              <li>
                <strong>To communicate with you</strong> — replying to your
                messages and sending newsletters you opt in to. Legal basis:
                your consent (you can unsubscribe at any time).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-foreground">
              Who can see your data
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Other approved members</strong> can see your member
                profile (name, photo, bio, the fields you fill in) inside the
                directory and the names/photos of people RSVPing to meetups.
                Your email and phone are never shown in the directory.
              </li>
              <li>
                <strong>Safe Circle posts</strong> can be made anonymously.
                When you post anonymously, your identity is not shown to
                other members. A small number of admins can see the author
                for safety and moderation only.
              </li>
              <li>
                <strong>Fempower admins</strong> can access member data
                strictly to review applications, moderate content and respond
                to support requests.
              </li>
              <li>
                <strong>You alone</strong> can see your Fempower Coach chat
                history (along with the AI provider that processes the
                request). Other members and the public cannot see it.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-foreground">
              Service providers we use
            </h2>
            <p>
              We rely on trusted third parties to run the site. They only
              process data on our behalf and under contractual safeguards:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Backend &amp; storage</strong> — our managed backend
                (database, authentication, file storage) provided by
                Lovable Cloud / Supabase.
              </li>
              <li>
                <strong>AI provider</strong> — the Lovable AI Gateway (which
                routes requests to Google Gemini) powers Fempower Coach
                replies. Your messages are sent to this provider to generate
                a response.
              </li>
              <li>
                <strong>Embedded content</strong> — events, frameworks and
                resources are pulled from Google Sheets and Google Drive
                where applicable; our newsletter content is hosted by
                Substack.
              </li>
            </ul>
            <p>
              Some of these providers may process data outside the UAE. Where
              that happens, we rely on the provider&apos;s contractual and
              technical safeguards, as permitted by PDPL.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-foreground">
              How we protect your data
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Data is transmitted over HTTPS and stored in our managed
                backend with row-level security so members can only access
                what they are allowed to see.
              </li>
              <li>
                Member photos are stored in a private bucket and served via
                short-lived signed URLs, not public links.
              </li>
              <li>
                Member approval status can only be changed by admins; members
                cannot self-approve themselves.
              </li>
              <li>
                We review our security posture regularly and act on findings.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-foreground">
              How long we keep your data
            </h2>
            <p>
              We keep your data for as long as you have an active membership
              or until you ask us to delete it. Newsletter emails are kept
              until you unsubscribe. Limited backups and logs may persist for
              a short period after deletion for security and recovery
              purposes.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-foreground">
              Your rights under UAE PDPL
            </h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access the personal data we hold about you.</li>
              <li>Ask us to correct data that is inaccurate or incomplete.</li>
              <li>Ask us to delete your account and personal data.</li>
              <li>Withdraw your consent (e.g. unsubscribe from emails, stop using Fempower Coach).</li>
              <li>Object to or restrict certain processing.</li>
              <li>Request a copy of your data in a portable format.</li>
              <li>Lodge a complaint with the UAE Data Office.</li>
            </ul>
            <p>
              To exercise any of these rights, email us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-primary underline underline-offset-4"
              >
                {CONTACT_EMAIL}
              </a>
              . We aim to respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-foreground">Cookies</h2>
            <p>
              We use only the minimum cookies and local storage needed to
              keep you signed in and remember basic preferences. We do not
              currently use advertising or cross-site tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-foreground">
              Changes to this policy
            </h2>
            <p>
              We may update this policy from time to time. When we do, we
              will change the &quot;Last updated&quot; date above and, for
              material changes, let the community know via email or a notice
              on the site.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-foreground">Contact</h2>
            <p>
              Questions, requests, or concerns about your data? Reach us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-primary underline underline-offset-4"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>

          <p className="text-sm text-muted-foreground pt-4 border-t border-border">
            This policy is provided for transparency and to comply with UAE
            PDPL. It is not legal advice. If you need a formal legal review,
            please consult a qualified UAE-based lawyer.
          </p>

          <p>
            <Link to="/" className="text-primary underline underline-offset-4">
              ← Back to home
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
