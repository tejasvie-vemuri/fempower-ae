import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { BadgeFacts } from "@/lib/directoryEngagement";

/** Fetches badge facts for the given members, caching across renders. */
export const useMemberBadges = (userIds: string[]) => {
  const [facts, setFacts] = useState<Record<string, BadgeFacts>>({});
  const key = Array.from(new Set(userIds)).sort().join(",");

  useEffect(() => {
    const missing = key ? key.split(",").filter((id) => !(id in facts)) : [];
    if (!missing.length) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_member_badges", { _user_ids: missing.slice(0, 200) });
      if (error || cancelled) return;
      setFacts((prev) => {
        const next = { ...prev };
        for (const row of data ?? []) {
          next[row.user_id] = {
            events_attended: row.events_attended ?? 0,
            spotlighted: !!row.spotlighted,
            circle_contributions: row.circle_contributions ?? 0,
            meetups_hosted: row.meetups_hosted ?? 0,
            wings_completed: row.wings_completed ?? 0,
            story_shared: !!row.story_shared,
          };
        }
        return next;
      });
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return facts;
};
