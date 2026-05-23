import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const UPDATED = "23 May 2026";
const CONTACT_EMAIL = "hello@fempowerae.com";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Terms & Conditions — Fempower</title>
        <meta
          name="description"
          content="The rules of the road for using Fempower — community standards, what we expect from members, and how disputes are handled under UAE law."
        />
        <link rel="canonical" href="https://fempowerae.com/terms" />
      </Helmet>

      <Header />

      <main className="container max-w-3xl py-16 md:py-24">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-body mb-3">
            Legal
          </p>
          <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-4">
            Terms &amp; Conditions
          </h1>
          <p className="text-sm text-muted-foreground font-body">
            Last updated: {UPDATED}
          </p>
        </header>

        <div className="prose prose-neutral max-w-none font-body text-foreground/90 space-y-8 leading-relaxed">
          <section>
            <p>
              Welcome to Fempower. These Terms &amp; Conditions ("Terms")
              govern your use of the Fempower website, member directory,
              Safe Circle, pop-up meetups, events, newsletter, and the
              Fempower Coach AI assistant (together, the "Platform"). By
              creating an account or otherwise using the Platform you agree
              to these Terms and to our{" "}
              <Link
                to="/privacy"
                className="text-primary underline underline-offset-4"
              >
                Privacy Policy
              </Link>
              . If you do not agree, please do not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-foreground">
              1. Who can join
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Fempower is a women-only community based in the United Arab
                Emirates. You must be at least 18 years old to join.
              </li>
              <li>
                Membership is granted at our discretion. Admins review every
                application and may approve, reject, or revoke membership
                without giving a reason.
              </li>
              <li>
                You must provide accurate information about yourself and keep
                your profile up to date. One person, one account.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-foreground">
              2. Community standards
            </h2>
            <p>Fempower exists to be a safe, respectful space. You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Harass, intimidate, threaten, or bully other members.</li>
              <li>
                Post content that is hateful, discriminatory, sexually
                explicit, defamatory, or violent.
              </li>
              <li>
                Solicit, sell, market, recruit, or run multi-level marketing
                schemes inside the community without prior written approval.
              </li>
              <li>
                Share another member&apos;s personal information, photos,
                Safe Circle posts, or private details outside the community.
                What is shared in Fempower stays in Fempower.
              </li>
              <li>
                Impersonate anyone else, create fake accounts, or
                misrepresent your identity, gender, or affiliation.
              </li>
              <li>
                Use the Platform for illegal activity or anything that
                breaches UAE law.
              </li>
              <li>
                Scrape, copy, or republish member profiles, photos,
                conversations, or other community content.
              </li>
              <li>
                Attempt to bypass moderation, security controls, or rate
                limits, or upload malware or spam.
              </li>
            </ul>
            <p>
              Breaking these rules can lead to content removal, suspension,
              or a permanent ban — at our sole discretion. Serious breaches
              may be reported to the relevant UAE authorities.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-foreground">
              3. Your content
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                You own the content you post (profile, photos, Safe Circle
                posts, meetups, replies). You are responsible for it.
              </li>
              <li>
                By posting, you grant Fempower a non-exclusive,
                royalty-free, worldwide licence to host, display, and
                moderate your content within the Platform for as long as
                your account exists.
              </li>
              <li>
                Admins may remove or hide any content that breaches these
                Terms or our community standards, without prior notice.
              </li>
              <li>
                You must not post anything you do not have the right to
                share, including copyrighted material or other people&apos;s
                private information.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-foreground">
              4. Pop-up meetups &amp; events
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Any approved member can host a pop-up meetup. Hosts are
                responsible for organising their own meetup safely and
                lawfully. Fempower does not vet venues, transport, or
                content of member-hosted meetups.
              </li>
              <li>
                Attendees join meetups and events at their own risk. Use
                judgement, meet in public places, and trust your instincts.
              </li>
              <li>
                Fempower is not a party to any agreement, transaction, or
                exchange between members at meetups or events.
              </li>
              <li>
                For ticketed events, refund and cancellation terms are stated
                on the event page and follow Fempower&apos;s event policy at
                the time of booking.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-foreground">
              5. Fempower Coach (AI)
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Fempower Coach is an AI-powered chat assistant. Responses are
                generated automatically and may be inaccurate, incomplete, or
                out of date. Always use your own judgement.
              </li>
              <li>
                Fempower Coach is <strong>not</strong> a substitute for
                professional advice — medical, legal, financial,
                psychological, or otherwise. If you are in crisis or in
                danger, please contact the UAE emergency services (999) or a
                qualified professional.
              </li>
              <li>
                Do not share sensitive information (passwords, ID numbers,
                payment details, confidential business data) with the coach.
              </li>
              <li>
                Your messages are sent to a third-party AI provider to
                generate a response and are stored on your account. See our{" "}
                <Link
                  to="/privacy"
                  className="text-primary underline underline-offset-4"
                >
                  Privacy Policy
                </Link>{" "}
                for details.
              </li>
              <li>
                We may use anonymised, aggregated data to improve the
                experience. We will never sell your conversations.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-foreground">
              6. Newsletter &amp; email communications
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                We send you transactional emails (account, RSVPs, event
                confirmations) as part of running the Platform.
              </li>
              <li>
                We only send you newsletter or marketing emails if you
                explicitly opt in. You can unsubscribe at any time via the
                link in any email.
              </li>
              <li>
                We will never sell or rent your email address to third
                parties.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-foreground">
              7. Account closure
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                You can close your account at any time by emailing us at{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-primary underline underline-offset-4"
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </li>
              <li>
                We may suspend or close your account if you break these
                Terms, harm the community, or put others at risk.
              </li>
              <li>
                After closure we delete your personal data as described in
                our Privacy Policy, subject to limited backups and legal
                obligations.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-foreground">
              8. Intellectual property
            </h2>
            <p>
              The Fempower name, logo, brand, designs, written content, and
              the Platform itself are owned by Fempower. You may not copy,
              reproduce, or use them commercially without our written
              permission.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-foreground">
              9. Disclaimers
            </h2>
            <p>
              The Platform is provided on an &quot;as is&quot; and &quot;as
              available&quot; basis. While we work hard to keep it running
              smoothly, we do not guarantee that it will be uninterrupted,
              secure, or error-free. Content posted by members is their own
              and does not reflect Fempower&apos;s views.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-foreground">
              10. Limitation of liability
            </h2>
            <p>
              To the maximum extent permitted by UAE law, Fempower, its
              founders, employees, and contributors are not liable for any
              indirect, incidental, or consequential loss arising from your
              use of the Platform, including from interactions with other
              members, meetups, events, or third-party services we link to.
              Nothing in these Terms limits any liability that cannot be
              excluded by law.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-foreground">
              11. Changes to these Terms
            </h2>
            <p>
              We may update these Terms from time to time. When we do, we
              will change the &quot;Last updated&quot; date above and, for
              material changes, notify the community. Continuing to use the
              Platform after changes means you accept the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-foreground">
              12. Governing law
            </h2>
            <p>
              These Terms are governed by the laws of the United Arab
              Emirates. Any dispute will be subject to the exclusive
              jurisdiction of the competent courts of Dubai, UAE, unless
              another forum is required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-foreground">
              13. Contact
            </h2>
            <p>
              Questions about these Terms? Email us at{" "}
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
            These Terms are provided for transparency and to comply with
            applicable UAE law. They are not legal advice. For a formal
            legal review, please consult a qualified UAE-based lawyer.
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

export default Terms;
