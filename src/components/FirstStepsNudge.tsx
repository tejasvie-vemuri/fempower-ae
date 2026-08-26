import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, Sparkles, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const DISMISS_KEY = "fempower-first-steps-snoozed-until";
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

type Step = {
  key: "intro" | "rsvp" | "directory";
  label: string;
  href: string;
  cta: string;
  done: boolean;
};

/**
 * Nudges approved members towards their FIRST community action and keeps
 * nudging (with a 3-day snooze) until they have completed all three starter
 * steps — posting an intro, RSVPing to something, and meeting a sister in the
 * directory. Unlike the old intro-only banner this does not expire after 7 days
 * and is mounted on every member surface.
 */
export const FirstStepsNudge = ({ className = "" }: { className?: string }) => {
  const { user, loading } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [steps, setSteps] = useState<Step[] | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    let snoozedUntil = 0;
    try {
      snoozedUntil = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    } catch {
      /* ignore */
    }
    if (Date.now() < snoozedUntil) return;

    (async () => {
      const [{ data: profile }, { data: events }] = await Promise.all([
        supabase
          .from("member_profiles")
          .select("name, status, approved_at, intro_posted_at")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("engagement_events")
          .select("event_type")
          .eq("user_id", user.id)
          .in("event_type", [
            "event_rsvp",
            "meetup_rsvp",
            "meetup_host",
            "directory_profile_viewed",
            "circle_reply",
          ]),
      ]);

      if (!profile) return;
      if (profile.status !== "approved" && profile.status !== "hidden") return;

      const types = new Set((events ?? []).map((e) => e.event_type));
      const next: Step[] = [
        {
          key: "intro",
          label: "Introduce yourself in the Circle",
          href: "/circle?compose=intro",
          cta: "Write my intro",
          done: !!profile.intro_posted_at || types.has("circle_reply"),
        },
        {
          key: "rsvp",
          label: "RSVP to an event or meetup",
          href: "/meetups",
          cta: "Find a meetup",
          done: types.has("event_rsvp") || types.has("meetup_rsvp") || types.has("meetup_host"),
        },
        {
          key: "directory",
          label: "Say hi to one sister in the directory",
          href: "/directory",
          cta: "Browse members",
          done: types.has("directory_profile_viewed"),
        },
      ];

      if (next.every((s) => s.done)) return;
      setFirstName((profile.name ?? "").split(" ")[0] || "sister");
      setSteps(next);
    })();
  }, [user, loading]);

  if (!steps) return null;

  const snooze = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + SNOOZE_MS));
    } catch {
      /* ignore */
    }
    setSteps(null);
  };

  const nextStep = steps.find((s) => !s.done)!;
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div
      role="status"
      className={`rounded-2xl border border-blush-dark/30 bg-blush-light/60 p-4 sm:p-5 ${className}`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blush-dark/15 flex items-center justify-center">
          <Sparkles size={18} className="text-blush-dark" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading text-base sm:text-lg text-foreground">
            {doneCount === 0
              ? `Welcome, ${firstName} — start with one small step.`
              : `Nice work, ${firstName}. ${3 - doneCount} step${doneCount === 2 ? "" : "s"} to go.`}
          </p>
          <ul className="mt-3 space-y-2">
            {steps.map((s) => (
              <li key={s.key} className="flex items-center gap-2 font-body text-sm">
                <span
                  aria-hidden
                  className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    s.done
                      ? "bg-blush-dark/20 border-blush-dark/40 text-blush-dark"
                      : "border-muted-foreground/40 text-transparent"
                  }`}
                >
                  <Check size={12} />
                </span>
                <span className={s.done ? "text-muted-foreground line-through" : "text-foreground"}>
                  {s.label}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center gap-2">
            <Link
              to={nextStep.href}
              className="inline-flex items-center justify-center rounded-full bg-foreground text-primary-foreground hover:bg-foreground/90 font-body text-xs uppercase tracking-widest px-4 py-2 whitespace-nowrap"
            >
              {nextStep.cta}
            </Link>
            <button
              onClick={snooze}
              className="font-body text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              Remind me later
            </button>
          </div>
        </div>
        <button
          onClick={snooze}
          aria-label="Dismiss"
          className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-background/60"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default FirstStepsNudge;
