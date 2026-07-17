import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const DISMISS_KEY = "fempower-intro-nudge-dismissed-v1";

/**
 * Soft dismissable banner shown to approved members who haven't posted
 * their Circle introduction yet. Auto-hides once `intro_posted_at` is set
 * or after 7 days of approval have passed.
 */
export const IntroNudgeBanner = () => {
  const { user, loading } = useAuth();
  const [show, setShow] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (loading || !user || dismissed) return;
    (async () => {
      const { data } = await supabase
        .from("member_profiles")
        .select("name, status, approved_at, intro_posted_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!data) return;
      if (data.status !== "approved") return;
      if (data.intro_posted_at) return;
      if (!data.approved_at) return;
      const approvedMs = new Date(data.approved_at as string).getTime();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - approvedMs > sevenDaysMs) return;
      setFirstName((data.name ?? "").split(" ")[0] || "sister");
      setShow(true);
    })();
  }, [user, loading, dismissed]);

  if (!show) return null;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  return (
    <div
      role="status"
      className="mb-6 rounded-2xl border border-blush-dark/30 bg-blush-light/60 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blush-dark/15 flex items-center justify-center">
        <Sparkles size={18} className="text-blush-dark" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-heading text-base sm:text-lg text-foreground">
          Welcome, {firstName} — tell the community who you are.
        </p>
        <p className="font-body text-sm text-muted-foreground mt-1">
          A 3-line intro in the Circle helps sisters find and connect with you. It only takes a minute.
        </p>
      </div>
      <div className="flex items-center gap-2 self-stretch sm:self-auto">
        <Link
          to="/circle?compose=intro"
          className="inline-flex items-center justify-center rounded-full bg-foreground text-primary-foreground hover:bg-foreground/90 font-body text-xs uppercase tracking-widest px-4 py-2 whitespace-nowrap"
          onClick={handleDismiss}
        >
          Write my intro
        </Link>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-background/60"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default IntroNudgeBanner;
