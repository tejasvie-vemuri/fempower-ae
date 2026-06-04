import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Instagram, Loader2 } from "lucide-react";
import { useInstagramFeed } from "@/hooks/useInstagramFeed";

const PROFILE_URL = "https://www.instagram.com/fempower.ae";

interface Props {
  active: boolean;
}

// Instagram CDN ignores most query params, but appending a hint keeps URLs unique
// for the browser cache per use-case and lets us swap to a transformer later.
const thumbUrl = (url: string) => url;

interface TileProps {
  src: string;
  alt: string;
  caption: string;
  permalink: string;
  index: number;
}

const Tile = ({ src, alt, caption, permalink, index }: TileProps) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <motion.a
      href={permalink}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "200px" }}
      transition={{ delay: Math.min(index * 0.03, 0.15) }}
      className="group relative shrink-0 snap-start w-[70%] sm:w-[40%] md:w-auto aspect-square rounded-xl overflow-hidden bg-muted border border-border"
    >
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-secondary animate-pulse" />
      )}
      <img
        src={thumbUrl(src)}
        alt={alt}
        width={480}
        height={480}
        loading="lazy"
        decoding="async"
        // @ts-expect-error - fetchpriority is valid HTML but not yet in React types everywhere
        fetchpriority="low"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/0 to-foreground/0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 pointer-events-none">
        <p className="text-xs text-primary-foreground font-body line-clamp-3">
          {caption || "View on Instagram"}
        </p>
      </div>
      <div className="absolute top-2 right-2 bg-background/90 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <ExternalLink size={12} className="text-foreground" />
      </div>
    </motion.a>
  );
};

const SkeletonGrid = () => (
  <div className="mt-6 flex gap-4 overflow-hidden md:grid md:grid-cols-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="shrink-0 w-[70%] sm:w-[40%] md:w-auto aspect-square rounded-xl bg-gradient-to-br from-muted to-secondary animate-pulse"
      />
    ))}
  </div>
);

const InstagramStrip = ({ active }: Props) => {
  const { posts, loading, error } = useInstagramFeed(active);

  if (loading && posts.length === 0) {
    return (
      <>
        <SkeletonGrid />
        <div className="flex justify-center items-center py-4">
          <Loader2 className="animate-spin text-muted-foreground" size={20} />
        </div>
      </>
    );
  }

  if (error || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground font-body mb-4">
          {error ? "Instagram feed is taking a breath. Visit us directly:" : "No posts yet."}
        </p>
        <a
          href={PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-body text-sm hover:opacity-90 transition-opacity"
        >
          <Instagram size={16} /> Follow @fempower.ae
        </a>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible">
        {posts.map((post, i) => (
          <Tile
            key={post.id}
            src={post.image}
            alt={post.caption.slice(0, 80) || "Instagram post"}
            caption={post.caption}
            permalink={post.permalink}
            index={i}
          />
        ))}
      </div>

      <div className="mt-5 text-center">
        <a
          href={PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-body text-sm hover:opacity-90 transition-opacity"
        >
          <Instagram size={16} /> Follow @fempower.ae
        </a>
      </div>
    </div>
  );
};

export default InstagramStrip;
