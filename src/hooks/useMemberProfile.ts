import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { MemberProfile } from "@/lib/memberProfile";

export const useMemberProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("member_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setProfile((data as MemberProfile) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  return { profile, loading: authLoading || loading, reload: load };
};
