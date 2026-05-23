import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SiteImageCategory = "hero" | "team" | "event" | "gallery";

export interface SiteImage {
  id: string;
  category: SiteImageCategory;
  title: string | null;
  subtitle: string | null;
  alt: string | null;
  link_url: string | null;
  image_path: string;
  sort_order: number;
  is_active: boolean;
  url: string;
}

const BUCKET = "site-images";

export const getPublicUrl = (path: string) =>
  supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

export const useSiteImages = (category: SiteImageCategory, activeOnly = true) => {
  const [data, setData] = useState<SiteImage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from("site_images")
      .select("*")
      .eq("category", category)
      .order("sort_order", { ascending: true });
    if (activeOnly) query = query.eq("is_active", true);
    const { data: rows, error } = await query;
    if (error) {
      console.error("site_images load", error);
      setData([]);
    } else {
      setData(
        (rows ?? []).map((r) => ({ ...(r as any), url: getPublicUrl(r.image_path) }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, activeOnly]);

  return { data, loading, reload: load };
};
