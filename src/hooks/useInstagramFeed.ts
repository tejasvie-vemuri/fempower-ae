import { useEffect, useState } from "react";

export interface InstagramPost {
  id: string;
  caption: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  image: string;
  permalink: string;
  timestamp: string;
}

const SUPABASE_URL = "https://uaiymunelgvvnznkxeik.supabase.co";

export const useInstagramFeed = (enabled = true) => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/fetch-instagram`);
        const data = await res.json();
        if (cancelled) return;
        if (data.error) setError(data.error);
        setPosts(data.posts || []);
      } catch (err) {
        if (!cancelled) setError(String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { posts, loading, error };
};
