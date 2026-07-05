import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarHeart, MapPin, Clock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UpcomingEvent {
  id: string;
  slug: string;
  title: string;
  starts_at: string;
  location: string | null;
}

/**
 * Compact card showing the next upcoming public event.
 * Safe to render for any visitor (published events are public).
 */
const NextEventCard = () => {
  const [event, setEvent] = useState<UpcomingEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("id, slug, title, starts_at, location")
        .eq("status", "published")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      setEvent((data as UpcomingEvent | null) ?? null);
      setLoading(false);
    })();
  }, []);

  if (loading || !event) return null;

  const d = new Date(event.starts_at);
  const dateLabel = d.toLocaleDateString("en-AE", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeLabel = d.toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <p className="text-xs font-body font-medium uppercase tracking-widest text-blush-dark mb-2">
        Next upcoming event
      </p>
      <Link
        to={`/events/${event.slug}`}
        className="block group"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blush-light flex items-center justify-center flex-shrink-0">
            <CalendarHeart size={18} className="text-blush-dark" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-heading text-base font-semibold text-foreground group-hover:text-blush-dark transition-colors">
              {event.title}
            </h4>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground font-body">
              <span className="inline-flex items-center gap-1"><Clock size={12} /> {dateLabel} · {timeLabel}</span>
              {event.location && (
                <span className="inline-flex items-center gap-1"><MapPin size={12} /> {event.location}</span>
              )}
            </div>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-body font-semibold uppercase tracking-widest text-foreground group-hover:text-blush-dark">
              View & register <ArrowRight size={12} />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default NextEventCard;
