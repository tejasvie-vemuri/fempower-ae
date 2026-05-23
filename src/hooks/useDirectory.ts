import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { MemberProfile } from "@/lib/memberProfile";

export interface DirectoryFilters {
  search: string;
  industry: string | null;
  city: string | null;
  lookingFor: string | null;
}

const PAGE_SIZE = 24;

export const useDirectory = (filters: DirectoryFilters) => {
  const [items, setItems] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchPage = useCallback(async (pageIdx: number, reset: boolean) => {
    setLoading(true);
    let q = supabase
      .from("member_profiles")
      .select("*")
      .eq("status", "approved")
      .order("approved_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (filters.industry) q = q.eq("industry", filters.industry);
    if (filters.city) q = q.ilike("city", filters.city);
    if (filters.lookingFor) q = q.contains("looking_for", [filters.lookingFor]);
    if (filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      q = q.or(`name.ilike.${term},role.ilike.${term},company.ilike.${term},bio.ilike.${term}`);
    }

    const from = pageIdx * PAGE_SIZE;
    q = q.range(from, from + PAGE_SIZE - 1);

    const { data, error } = await q;
    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as MemberProfile[];
    setItems(prev => (reset ? rows : [...prev, ...rows]));
    setHasMore(rows.length === PAGE_SIZE);
    setLoading(false);
  }, [filters.search, filters.industry, filters.city, filters.lookingFor]);

  useEffect(() => {
    setPage(0);
    fetchPage(0, true);
  }, [fetchPage]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPage(next, false);
  };

  return { items, loading, hasMore, loadMore };
};
