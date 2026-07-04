// Helpers to generate responsive srcSet for our image sources.
// - Supabase Storage public URLs use the /render/image/ transform endpoint.
// - Lovable Assets CDN URLs (/__l5e/assets-v1/...) are served as-is (no transform).
// - Anything else is returned unchanged.

const SUPABASE_PUBLIC = "/storage/v1/object/public/";
const SUPABASE_RENDER = "/storage/v1/render/image/public/";

export const DEFAULT_WIDTHS = [320, 480, 768, 1024, 1440, 1920];

const toSupabaseTransform = (url: string, width: number, quality = 75): string => {
  const idx = url.indexOf(SUPABASE_PUBLIC);
  if (idx === -1) return url;
  const base = url.slice(0, idx) + SUPABASE_RENDER + url.slice(idx + SUPABASE_PUBLIC.length);
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}width=${width}&quality=${quality}&resize=cover`;
};

export const isTransformable = (url: string | undefined | null): boolean =>
  !!url && url.includes(SUPABASE_PUBLIC);

export interface ResponsiveImageProps {
  src: string;
  srcSet?: string;
  sizes?: string;
}

/** Build srcSet + sizes for a Supabase Storage image. */
export const responsiveImage = (
  url: string,
  opts: { widths?: number[]; sizes?: string; quality?: number } = {}
): ResponsiveImageProps => {
  const { widths = DEFAULT_WIDTHS, sizes = "100vw", quality = 75 } = opts;
  if (!isTransformable(url)) {
    return { src: url };
  }
  const srcSet = widths
    .map((w) => `${toSupabaseTransform(url, w, quality)} ${w}w`)
    .join(", ");
  return {
    src: toSupabaseTransform(url, widths[Math.floor(widths.length / 2)], quality),
    srcSet,
    sizes,
  };
};
