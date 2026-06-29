import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";

interface SpotlightData {
  story: string;
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
        .select("user_id, story")
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
        member_name: profile.name,
        member_photo: profile.photo_url,
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
            {spotlight.member_photo ? (
              <img
                src={spotlight.member_photo}
                alt={spotlight.member_name}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-blush-dark/20"
              />
            ) : (
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-blush-dark/10 flex items-center justify-center text-2xl font-heading font-semibold text-blush-dark">
                {spotlight.member_name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-heading text-xl font-semibold">{spotlight.member_name}</h3>
            {spotlight.member_role && (
              <p className="font-body text-sm text-muted-foreground mt-0.5">{spotlight.member_role}</p>
            )}
            <p className="font-body text-foreground/85 leading-relaxed mt-3 whitespace-pre-wrap">
              {spotlight.story}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpotlightCard;
