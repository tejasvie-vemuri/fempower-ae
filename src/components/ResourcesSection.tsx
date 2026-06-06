import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ExternalLink, FileText, Loader2 } from "lucide-react";
import { PalmDivider } from "./GulfDecoratives";
import BookmarkButton from "@/components/BookmarkButton";

interface Resource {
  title: string;
  description: string;
  type: string;
  url: string;
}

const SUPABASE_URL = "https://uaiymunelgvvnznkxeik.supabase.co";

const ResourcesSection = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/fetch-resources`);
        const data = await res.json();
        setResources(data.resources || []);
      } catch (err) {
        console.error("Failed to fetch resources:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  if (!loading && resources.length === 0) return null;

  return (
    <section id="resources" className="py-7 md:py-10">
      <PalmDivider className="mb-6" />
      <div className="container max-w-5xl">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark text-center mb-3"
        >
          Curated For You
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading text-3xl md:text-4xl font-semibold text-foreground text-center"
        >
          Resources
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-3 text-center text-muted-foreground font-body"
        >
          Articles, guides, and tools to support your journey.
        </motion.p>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="animate-spin text-muted-foreground" size={32} />
          </div>
        ) : (
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {resources.map((resource, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="relative group bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <BookmarkButton
                  itemType="resource"
                  itemId={resource.url}
                  className="absolute top-3 right-3 z-10"
                />
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col flex-1"
                >
                  <div className="flex items-start gap-3 mb-3 pr-6">
                    <span className="text-xl flex-shrink-0 mt-0.5">🦋</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-heading text-sm font-semibold text-foreground group-hover:text-blush-dark transition-colors line-clamp-2">
                        {resource.title}
                      </h4>
                      <span className="text-[10px] font-body uppercase tracking-widest text-muted-foreground mt-1 inline-block">
                        {resource.type === "pdf" ? "PDF" : "Article"}
                      </span>
                    </div>
                  </div>
                  {resource.description && (
                    <p className="text-xs text-muted-foreground font-body line-clamp-3 flex-1">
                      {resource.description}
                    </p>
                  )}
                </a>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ResourcesSection;
