import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  path: string | null | undefined;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
}

const cache = new Map<string, { url: string; exp: number }>();
const TTL_SECONDS = 3600;

export async function getMemberPhotoUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  // Backwards-compat: if a full http(s) URL slipped through, return as-is.
  if (/^https?:\/\//i.test(path)) return path;
  const cached = cache.get(path);
  if (cached && cached.exp > Date.now()) return cached.url;
  const { data, error } = await supabase.storage.from("member-photos").createSignedUrl(path, TTL_SECONDS);
  if (error || !data?.signedUrl) return null;
  cache.set(path, { url: data.signedUrl, exp: Date.now() + (TTL_SECONDS - 60) * 1000 });
  return data.signedUrl;
}

export const MemberAvatar = ({ path, alt = "", className, fallback = null }: Props) => {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setErr(false);
    setUrl(null);
    getMemberPhotoUrl(path).then((u) => { if (!cancelled) setUrl(u); });
    return () => { cancelled = true; };
  }, [path]);

  if (!path || err || !url) return <>{fallback}</>;
  return <img src={url} alt={alt} className={className} onError={() => setErr(true)} />;
};
