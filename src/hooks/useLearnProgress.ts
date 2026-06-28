import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useLearnProgress(wingIds?: string[]) {
  const { user } = useAuth();
  const [completedWingIds, setCompletedWingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setCompletedWingIds(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    let q = (supabase as any)
      .from("learn_progress")
      .select("wing_id")
      .eq("user_id", user.id);
    if (wingIds && wingIds.length > 0) {
      q = q.in("wing_id", wingIds);
    }
    const { data } = await q;
    setCompletedWingIds(
      new Set((data ?? []).map((r: { wing_id: string }) => r.wing_id))
    );
    setLoading(false);
  }, [user, wingIds?.join(",")]);

  useEffect(() => {
    load();
  }, [load]);

  return { completedWingIds, loading, refresh: load };
}
