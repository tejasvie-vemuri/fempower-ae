import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2, CheckCircle, Clock, Instagram, ArrowRight, Zap } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import NextEventCard from "@/components/NextEventCard";


const INSTAGRAM_URL = "https://www.instagram.com/fempower.ae?igsh=cDB1OXNxcmhxanY5&utm_source=qr";

const bullets = [
  "Daily prompts + honest conversations",
  "Priority access to mentor walks + coaching circles",
  "Events every 15 days across UAE",
  "Private member directory once approved",
];

const Shell = ({ children }: { children: React.ReactNode }) => (
  <>
    <Header />
    <main className="pt-24 md:pt-28 pb-16 min-h-screen bg-background">
      <div className="container max-w-3xl">{children}</div>
    </main>
    <Footer />
  </>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-card border border-border rounded-2xl shadow-sm p-6 sm:p-8 md:p-12">
    {children}
  </div>
);

const JoinPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useMemberProfile();

  if (authLoading || (user && profileLoading)) {
    return (
      <Shell>
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  // 1. Not logged in
  if (!user) {
    return (
      <Shell>
        <Card>
          <p className="text-xs font-body font-medium uppercase tracking-widest text-blush-dark mb-3">
            Join Fempower
          </p>
          <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground leading-tight">
            Become a member of the community
          </h1>
          <p className="mt-4 text-muted-foreground font-body">
            Create your account to be added to the Fempower members directory. Each application is
            reviewed by our team — once approved, you unlock the private community, events,
            mentor walks, and circles.
          </p>
          <ul className="mt-6 space-y-2.5">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm font-body text-foreground">
                <CheckCircle size={18} className="text-blush-dark flex-shrink-0 mt-0.5" />
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button
              className="bg-foreground text-primary-foreground hover:bg-foreground/90 font-body uppercase tracking-widest text-xs h-11 px-6"
              asChild
            >
              <Link to="/auth?redirect=/join&tab=signup">
                Create account <ArrowRight size={16} className="ml-2" />
              </Link>
            </Button>
            <Button variant="outline" className="font-body uppercase tracking-widest text-xs h-11 px-6" asChild>
              <Link to="/auth?redirect=/join">I already have an account</Link>
            </Button>
          </div>
        </Card>
      </Shell>
    );
  }

  const status = profile?.status ?? "pending";

  // 3. Approved → community access
  if (status === "approved" || status === "hidden") {
    return (
      <Shell>
        <Card>
          <div className="flex items-center gap-2 text-blush-dark mb-3">
            <CheckCircle size={18} />
            <p className="text-xs font-body font-medium uppercase tracking-widest">
              You're in
            </p>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground leading-tight">
            Welcome to Fempower, {profile?.name?.split(" ")[0] || "friend"}
          </h1>
          <p className="mt-4 text-muted-foreground font-body">
            Your membership is active. Jump into the community below.
          </p>
          <div className="mt-8 grid sm:grid-cols-2 gap-3">
            <Button className="h-11 font-body uppercase tracking-widest text-xs" asChild>
              <Link to="/directory">Member directory</Link>
            </Button>
            <Button variant="outline" className="h-11 font-body uppercase tracking-widest text-xs" asChild>
              <Link to="/circle">Visit the Circle</Link>
            </Button>
            <Button variant="outline" className="h-11 font-body uppercase tracking-widest text-xs" asChild>
              <Link to="/meetups">Mentor walks & meetups</Link>
            </Button>
            <Button variant="outline" className="h-11 font-body uppercase tracking-widest text-xs" asChild>
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
                <Instagram size={16} className="mr-2" /> @fempower.ae
              </a>
            </Button>
          </div>
          <div className="mt-6">
            <Link
              to="/account/profile"
              className="text-sm font-body text-muted-foreground hover:text-foreground underline"
            >
              Edit your member profile
            </Link>
          </div>
        </Card>
      </Shell>
    );
  }

  // 2. Logged in but pending (or rejected)
  return (
    <Shell>
      <Card>
        <div className="flex items-center gap-2 text-blush-dark mb-3">
          <Clock size={18} />
          <p className="text-xs font-body font-medium uppercase tracking-widest">
            {status === "rejected" ? "Application not approved" : "Awaiting approval"}
          </p>
        </div>
        <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground leading-tight">
          {status === "rejected"
            ? "Thanks for applying"
            : "You're on the list"}
        </h1>
        <p className="mt-4 text-muted-foreground font-body">
          {status === "rejected"
            ? "Unfortunately your application wasn't approved at this time. Please reach out to the Fempower team if you'd like to discuss."
            : "Thanks for joining, " +
              (profile?.name?.split(" ")[0] || "friend") +
              ". Our team reviews each application personally. You'll get access to the member directory, Circle, and meetups as soon as you're approved."}
        </p>
        <div className="mt-6 rounded-xl bg-blush-light/50 border border-border p-4 text-sm font-body text-foreground">
          <p className="font-medium mb-1">Speed things up</p>
          <p className="text-muted-foreground">
            Complete your member profile so we can get to know you faster.
          </p>
          <Button className="mt-3 h-10 font-body uppercase tracking-widest text-xs" asChild>
            <Link to="/account/profile">Complete profile</Link>
          </Button>
        </div>
        <div className="mt-6">
          <p className="text-sm font-body text-muted-foreground mb-2">
            While you wait, follow us on Instagram:
          </p>
          <Button variant="outline" className="h-10 font-body uppercase tracking-widest text-xs" asChild>
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
              <Instagram size={16} className="mr-2" /> @fempower.ae
            </a>
          </Button>
        </div>
      </Card>
    </Shell>
  );
};

export default JoinPage;
