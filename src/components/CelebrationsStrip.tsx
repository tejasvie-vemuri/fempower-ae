import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getMilestoneDisplay } from "@/lib/milestones";
import { PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CelebrationItem {
  id: string;
  milestone_key: string;
  custom_text: string | null;
  created_at: string;
  member_name: string;
  member_photo: string | null;
}

const CelebrationsStrip = () => {
  const [items, setItems] = useState<CelebrationItem[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("member_milestones")
        .select("id, milestone_key, custom_text, created_at, user_id")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(6);

      if (!data || data.length === 0) return;

      const userIds = [...new Set(data.map((m: any) => m.user_id))];
      const { data: profiles } = await supabase
        .from("member_profiles")
        .select("user_id, name, photo_url")
        .in("user_id", userIds as string[]);
      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.user_id, p])
      );

      setItems(
        data.map((m: any) => ({
          id: m.id,
          milestone_key: m.milestone_key,
          custom_text: m.custom_text,
          created_at: m.created_at,
          member_name: profileMap.get(m.user_id)?.name ?? "A member",
          member_photo: profileMap.get(m.user_id)?.photo_url ?? null,
        }))
      );
    })();
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="py-10 md:py-14 bg-blush-light/40">
      <div className="container max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl flex items-center gap-2">
            <PartyPopper size={20} className="text-blush-dark" /> Recent Celebrations
          </h2>
          <Button variant="outline" size="sm" asChild className="font-body text-xs uppercase tracking-widest">
            <Link to="/share-win">Share your win</Link>
          </Button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory">
          {items.map((item) => {
            const display = getMilestoneDisplay(item.milestone_key, item.custom_text);
            return (
              <div
                key={item.id}
                className="flex-shrink-0 w-56 snap-start bg-card border border-border rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  {item.member_photo ? (
                    <img src={item.member_photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {item.member_name.charAt(0)}
                    </div>
                  )}
                  <p className="font-body text-sm font-medium truncate">{item.member_name}</p>
                </div>
                <p className="text-lg mb-1">{display.emoji}</p>
                <p className="font-body text-sm text-foreground/80">{display.label}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(item.created_at).toLocaleDateString("en-AE", { day: "numeric", month: "short" })}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CelebrationsStrip;
