import { Link } from "react-router-dom";
import { Clock, Instagram, LogOut, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import fempowerLogo from "@/assets/fempower-logo.png";

const INSTAGRAM_URL =
  "https://www.instagram.com/fempower.ae?igsh=cDB1OXNxcmhxanY5&utm_source=qr";

const STATUS_COPY: Record<string, { title: string; body: string }> = {
  pending: {
    title: "Your membership is pending approval",
    body: "Thanks for joining the Fempower circle. A team member is reviewing your profile — you'll get an email the moment you're approved. ✨",
  },
  rejected: {
    title: "Your application wasn't approved",
    body: "We weren't able to approve your membership at this time. If you think this was a mistake, please reach out to us on Instagram.",
  },
  hidden: {
    title: "Your profile is currently hidden",
    body: "Your account is on hold. Please reach out to us on Instagram if you'd like to come back to the community.",
  },
  missing: {
    title: "Let's set up your member profile",
    body: "Before we can welcome you in, please complete your member profile so the team can review it.",
  },
};

const PendingApproval = () => {
  const { user } = useAuth();
  const { profile, loading } = useMemberProfile();

  const status = !loading && !profile ? "missing" : profile?.status ?? "pending";
  const copy = STATUS_COPY[status] ?? STATUS_COPY.pending;

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2">
        <img src={fempowerLogo} alt="Fempower" className="h-10 w-auto" />
      </Link>

      <div className="w-full max-w-md text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-blush-light flex items-center justify-center mb-6">
          <Clock className="h-7 w-7 text-blush-dark" />
        </div>

        <h1 className="font-heading text-3xl md:text-4xl text-primary mb-3">
          {copy.title}
        </h1>
        <p className="font-body text-muted-foreground leading-relaxed mb-2">
          {copy.body}
        </p>
        {user?.email && (
          <p className="font-body text-xs text-muted-foreground/80 mb-8">
            Signed in as <span className="font-medium">{user.email}</span>
          </p>
        )}

        <div className="bg-card border border-border rounded-2xl p-6 space-y-3 text-left">
          {status === "missing" && (
            <Button asChild className="w-full font-body uppercase tracking-widest text-xs">
              <Link to="/profile">Complete my profile</Link>
            </Button>
          )}

          <Button
            variant="outline"
            asChild
            className="w-full font-body uppercase tracking-widest text-xs"
          >
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
              <Instagram size={14} className="mr-2" />
              Follow @fempower.ae
            </a>
          </Button>

          <Button
            variant="ghost"
            asChild
            className="w-full font-body uppercase tracking-widest text-xs"
          >
            <a href="mailto:hello@fempowerae.com">
              <Mail size={14} className="mr-2" />
              Contact the team
            </a>
          </Button>

          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full font-body uppercase tracking-widest text-xs text-muted-foreground"
          >
            <LogOut size={14} className="mr-2" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
