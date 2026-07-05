import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Coffee, MapPin, Clock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatMeetupWhen, type Meetup } from "@/lib/meetups";

const MeetupsStrip = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Meetup[]>([]);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: prof } = await supabase
        .from("member_profiles").select("status").eq("user_id", user.id).maybeSingle();
      if (prof?.status !== "approved" && prof?.status !== "hidden") { setApproved(false); return; }
      setApproved(true);
      const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { data } = await (supabase as any)
        .from("meetups")
        .select("*")
        .eq("status", "published")
        .gte("starts_at", cutoff)
        .order("starts_at", { ascending: true })
        .limit(3);
      setItems(data ?? []);
    })();
  }, [user]);

  return (
    <div className="mt-12 rounded-2xl border border-border bg-blush-light/30 p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Coffee size={16} className="text-blush-dark" />
          <p className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark">Pop-up Meetups</p>
        </div>
        <Link to={user ? "/meetups" : "/join"} className="text-xs font-body uppercase tracking-widest text-foreground hover:text-blush-dark inline-flex items-center gap-1">
          {user ? "Post or browse" : "Join to RSVP"} <ArrowRight size={12} />
        </Link>

      </div>

      {!user || !approved ? (
        <p className="text-sm font-body text-muted-foreground">
          Casual coffee, walks, and study sessions hosted by Fempower members. Sign in to RSVP or post your own.
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm font-body text-muted-foreground">
          No pop-ups on the books yet. <Link to="/meetups" className="text-foreground underline">Be the first to post one.</Link>
        </p>
      ) : (
        <div className="grid sm:grid-cols-3 gap-3">
          {items.map((m) => (
            <Link
              key={m.id}
              to="/meetups"
              className="rounded-xl bg-card border border-border p-3 hover:border-blush-dark/50 transition-colors block"
            >
              <p className="font-heading text-base text-foreground line-clamp-1">{m.title}</p>
              <p className="mt-1.5 text-xs text-muted-foreground font-body flex items-center gap-1"><Clock size={11} /> {formatMeetupWhen(m.starts_at)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground font-body flex items-center gap-1"><MapPin size={11} /> {m.emirate || m.place}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MeetupsStrip;
