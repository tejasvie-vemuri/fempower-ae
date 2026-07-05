import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarHeart, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useJoinGate } from "./JoinGate";

interface UpcomingEvent {
  id: string;
  slug: string;
  title: string;
  starts_at: string;
}

/**
 * Slim banner directly under the fixed header announcing upcoming events.
 * Public: reads only published events, same as NextEventCard/EventsCalendarSection.
 */
const EventsStripBanner = () => {
  const { requireJoin } = useJoinGate();
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("id, slug, title, starts_at")
        .eq("status", "published")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(4);
      setEvents((data as UpcomingEvent[]) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading || events.length === 0) return null;

  const handleEventClick = (e: React.MouseEvent) => {
    if (!requireJoin()) e.preventDefault();
  };

  return (
    <div className="relative z-10 w-full bg-foreground text-primary-foreground">
      <div className="container flex items-center gap-3 py-2.5">
        <span className="hidden sm:inline-flex flex-shrink-0 items-center gap-1.5 text-[11px] font-body font-semibold uppercase tracking-widest text-blush">
          <CalendarHeart size={13} aria-hidden="true" /> Upcoming
        </span>

        <div className="flex-1 min-w-0 flex items-center gap-4 overflow-x-auto no-scrollbar">
          {events.map((event, i) => (
            <span key={event.id} className="flex items-center gap-4 flex-shrink-0">
              {i > 0 && <span className="text-primary-foreground/30" aria-hidden="true">•</span>}
              <Link
                to={`/events/${event.slug}`}
                onClick={handleEventClick}
                className="text-xs font-body whitespace-nowrap hover:text-blush transition-colors"
              >
                {event.title}
                <span className="text-primary-foreground/60">
                  {" "}
                  ·{" "}
                  {new Date(event.starts_at).toLocaleDateString("en-AE", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </Link>
            </span>
          ))}
        </div>

        <Link
          to="/#events-calendar"
          className="flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-body font-semibold uppercase tracking-widest text-blush hover:text-primary-foreground transition-colors"
        >
          View all <ArrowRight size={11} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
};

export default EventsStripBanner;
