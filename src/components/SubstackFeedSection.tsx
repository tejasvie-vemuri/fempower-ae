import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Loader2 } from "lucide-react";
import { PalmDivider } from "./GulfDecoratives";

interface Post {
  title: string;
  author: string;
  description: string;
  date: string;
  link: string;
  image: string;
}

const SUPABASE_URL = "https://uaiymunelgvvnznkxeik.supabase.co";

const SubstackFeedSection = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/fetch-substacks`);
        const data = await res.json();
        setPosts(data.posts || []);
      } catch (err) {
        console.error("Failed to fetch Substack feed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (!loading && posts.length === 0) return null;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <section id="reads" className="py-5 md:py-7">
      <PalmDivider className="mb-6" />
      <div className="container max-w-5xl">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark text-center mb-3"
        >
          From My Reading List
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading text-3xl md:text-4xl font-semibold text-foreground text-center"
        >
          Substack Reads
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-3 text-center text-muted-foreground font-body"
        >
          Latest posts from publications I follow and love.
        </motion.p>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="animate-spin text-muted-foreground" size={32} />
          </div>
        ) : (
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post, i) => (
              <motion.a
                key={i}
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                {post.image && (
                  <div className="aspect-[16/9] overflow-hidden bg-muted">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-4 flex flex-col flex-1">
                  <span className="text-[10px] font-body uppercase tracking-widest text-blush-dark mb-1">
                    {post.author}
                  </span>
                  <h4 className="font-heading text-sm font-semibold text-foreground group-hover:text-blush-dark transition-colors line-clamp-2 mb-2">
                    {post.title}
                  </h4>
                  {post.description && (
                    <p className="text-xs text-muted-foreground font-body line-clamp-3 flex-1 mb-3">
                      {post.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] text-muted-foreground font-body">
                      {formatDate(post.date)}
                    </span>
                    <span className="text-[10px] text-blush-dark font-body flex items-center gap-1 group-hover:underline">
                      Read <ExternalLink size={10} />
                    </span>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SubstackFeedSection;
