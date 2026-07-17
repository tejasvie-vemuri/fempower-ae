import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";
import SpotlightStory from "@/components/SpotlightStory";
import { MemberAvatar } from "@/components/directory/MemberAvatar";

interface SpotlightData {
  story: string;
  headline: string | null;
  the_before: string | null;
  the_turning_point: string | null;
  the_now: string | null;
  advice: string | null;
  shoutout: string | null;
  member_name: string;
  member_photo: string | null;
  member_role: string | null;
  member_user_id: string;
}

const SpotlightCard = () => {
  const [spotlight, setSpotlight] = useState<SpotlightData | null>(null);

  useEffect(() => {
    (async () => {
      const now = new Date().toISOString();
      const { data } = await (supabase as any)
        .from("member_spotlights")
        .select("user_id, story, headline, the_before, the_turning_point, the_now, advice, shoutout, photo_url")
        .lte("active_from", now)
        .gte("active_until", now)
        .order("active_from", { ascending: false })
        .limit(1);

      if (!data || data.length === 0) return;
      const s = data[0];

      const { data: profile } = await supabase
        .from("member_profiles")
        .select("user_id, name, photo_url, role")
        .eq("user_id", s.user_id)
        .single();

      if (!profile) return;

      setSpotlight({
        story: s.story,
        headline: s.headline ?? null,
        the_before: s.the_before ?? null,
        the_turning_point: s.the_turning_point ?? null,
        the_now: s.the_now ?? null,
        advice: s.advice ?? null,
        shoutout: s.shoutout ?? null,
        member_name: profile.name,
        member_photo: s.photo_url ?? profile.photo_url,
        member_role: profile.role,
        member_user_id: profile.user_id,
      });
    })();
  }, []);

  if (!spotlight) return null;

  return (
    <section className="py-10 md:py-14 bg-background">
      <div className="container max-w-4xl">
        <h2 className="font-heading text-2xl flex items-center gap-2 mb-6">
          <Star size={20} className="text-blush-dark fill-blush-dark" /> Member Spotlight
        </h2>
        <div className="bg-blush-light/50 border border-blush-dark/10 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-shrink-0">
            <MemberAvatar
              path={spotlight.member_photo}
              alt={spotlight.member_name}
              className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-blush-dark/20"
              fallback={
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-blush-dark/10 flex items-center justify-center text-2xl font-heading font-semibold text-blush-dark">
                  {spotlight.member_name.charAt(0)}
                </div>
              }
            />
          </div>
          <div className="flex-1">
            <h3 className="font-heading text-xl font-semibold">{spotlight.member_name}</h3>
            {spotlight.member_role && (
              <p className="font-body text-sm text-muted-foreground mt-0.5">{spotlight.member_role}</p>
            )}
            <div className="mt-3">
              <SpotlightStory
                story={spotlight.story}
                headline={spotlight.headline}
                the_before={spotlight.the_before}
                the_turning_point={spotlight.the_turning_point}
                the_now={spotlight.the_now}
                advice={spotlight.advice}
                shoutout={spotlight.shoutout}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpotlightCard;
