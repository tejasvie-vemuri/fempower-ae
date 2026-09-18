import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, ExternalLink, Clock } from "lucide-react";
import { CrescentStar } from "./GulfDecoratives";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Framework {
  name: string;
  inspiredBy: string;
  description: string;
  howUseful: string;
  howToImplement: string;
}

type ArticleCategory = "Mindset" | "Communication" | "Career" | "AI & Learning";
type FilterTab = "All" | ArticleCategory;

interface Article {
  title: string;
  subtitle: string;
  hook: string;
  readTime: string;
  category: ArticleCategory;
  url: string;
}

const FILTER_TABS: FilterTab[] = ["All", "Mindset", "Communication", "Career", "AI & Learning"];

const CATEGORY_STYLES: Record<ArticleCategory, { pill: string; dot: string }> = {
  Mindset:         { pill: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", dot: "bg-purple-400" },
  Communication:   { pill: "bg-blush/20 text-blush-dark",                                              dot: "bg-blush-dark" },
  Career:          { pill: "bg-gold/20 text-amber-700 dark:bg-gold/10 dark:text-amber-300",            dot: "bg-amber-400" },
  "AI & Learning": { pill: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",         dot: "bg-blue-400" },
};

const CURATED_ARTICLES: Article[] = [
  {
    title: "The Imposter Paradox",
    subtitle: "All of us feel like frauds. So what?",
    hook: "71% of CEOs feel like frauds — including women at the top. This explains why, and how to stop letting it hold you back.",
    readTime: "2 min",
    category: "Mindset",
    url: "https://sandeepswadia.beehiiv.com/p/the-imposter-paradox",
  },
  {
    title: "Don't Let Your Mistakes Become You",
    subtitle: "How To Turn Self-Criticism Into Something Useful",
    hook: "Self-criticism and self-awareness look identical from the inside. This shows you the difference — and how to use it.",
    readTime: "3 min",
    category: "Mindset",
    url: "https://sandeepswadia.beehiiv.com/p/mistakes",
  },
  {
    title: "Rock Bottom Is Your Foundation",
    subtitle: "How to survive failure, rebuild, and stop fearing the future",
    hook: "When everything falls apart, this is how you find solid ground — and start rising again.",
    readTime: "3 min",
    category: "Mindset",
    url: "https://sandeepswadia.beehiiv.com/p/rock-bottom-is-your-foundation",
  },
  {
    title: "Four Seconds of Silence",
    subtitle: "The Underrated Superpower in High-stakes Communication",
    hook: "The most powerful move in any room? Stop talking. Silence is not weakness — it is control.",
    readTime: "3 min",
    category: "Communication",
    url: "https://sandeepswadia.beehiiv.com/p/four-seconds-of-silence",
  },
  {
    title: "They Judged You In 100 Milliseconds",
    subtitle: "Learn the three things that shape how people see you",
    hook: "People formed an opinion about you before you said a word. Here's the presence framework that shapes what they see.",
    readTime: "3 min",
    category: "Communication",
    url: "https://sandeepswadia.beehiiv.com/p/they-judged-you-in-100-milliseconds",
  },
  {
    title: "How to Become a Better Communicator",
    subtitle: "The Secret? You Can Talk Less to Say More",
    hook: "The counterintuitive truth: saying less makes people listen more. Command the room without filling it with words.",
    readTime: "3 min",
    category: "Communication",
    url: "https://sandeepswadia.beehiiv.com/p/how-to-become-a-better-communicator",
  },
  {
    title: "Why Do Your Big Goals Feel Impossible?",
    subtitle: "What 20 years of research wants you to do instead",
    hook: "Stop staring at the summit — research shows visualising success can slow you down. Here's what actually works.",
    readTime: "3 min",
    category: "Career",
    url: "https://sandeepswadia.beehiiv.com/p/why-do-your-big-goals-feel-impossible",
  },
  {
    title: "The Secret to Prioritising What Matters",
    subtitle: "Be Lazy Where It's Capped. Obsessed Where It Counts.",
    hook: "You can't give everything 100%. This shows you where to protect your energy — and where to go all in.",
    readTime: "2 min",
    category: "Career",
    url: "https://sandeepswadia.beehiiv.com/p/the-secret-to-prioritizing-what-matters",
  },
  {
    title: '"Never Give Up" Is Terrible Advice',
    subtitle: "When Persistence Becomes Self-destruction",
    hook: "Sometimes walking away is the stronger move. Here's how to tell resilience apart from self-destruction — before it costs you.",
    readTime: "2 min",
    category: "Career",
    url: "https://sandeepswadia.beehiiv.com/p/the-most-dangerous-success-advice",
  },
  {
    title: "The Biggest Edge in the AI Era",
    subtitle: "Learning How to Learn",
    hook: "The one meta-skill that keeps you ahead — not just of AI, but of everyone who uses it without thinking.",
    readTime: "3 min",
    category: "AI & Learning",
    url: "https://sandeepswadia.beehiiv.com/p/the-biggest-edge-in-ai-era-is-learning-how-to-learn",
  },
  {
    title: "The Secret to Brilliant AI Is Three Simple Lines",
    subtitle: "A Three-Part Framework to get the most out of AI",
    hook: "One framework that changes how you use Zara — and every AI tool — from this moment on.",
    readTime: "2 min",
    category: "AI & Learning",
    url: "https://sandeepswadia.beehiiv.com/p/the-secret-to-brilliant-ai-is-three-simple-lines",
  },
];

const ArticleCard = ({ article, index }: { article: Article; index: number }) => {
  const style = CATEGORY_STYLES[article.category];
  return (
    <motion.a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group flex flex-col bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-blush/50 transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-body font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full ${style.pill}`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
          {article.category}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-body">
          <Clock size={11} />
          {article.readTime}
        </span>
      </div>

      <h4 className="font-heading text-sm md:text-base font-semibold text-foreground leading-snug group-hover:text-blush-dark transition-colors">
        {article.title}
      </h4>
      <p className="text-[11px] font-body text-muted-foreground mt-0.5 mb-3">
        {article.subtitle}
      </p>

      <p className="text-xs font-body text-muted-foreground leading-relaxed flex-1 border-t border-border/60 pt-3 mt-auto">
        <span className="text-blush-dark font-medium">Why this matters for you: </span>
        {article.hook}
      </p>

      <div className="mt-4 flex items-center gap-1 text-xs font-body font-medium text-blush-dark group-hover:gap-2 transition-all">
        Read article
        <ExternalLink size={11} />
      </div>
    </motion.a>
  );
};

const CuratedReads = () => {
  const [activeTab, setActiveTab] = useState<FilterTab>("All");

  const filtered = activeTab === "All"
    ? CURATED_ARTICLES
    : CURATED_ARTICLES.filter((a) => a.category === activeTab);

  return (
    <div className="mt-12">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-body font-medium uppercase tracking-widest-xl text-muted-foreground flex-shrink-0">
          Curated Reads
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <p className="text-center text-xs font-body text-muted-foreground mb-6">
        Handpicked reads for the woman who is building herself.
      </p>

      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[11px] font-body font-medium uppercase tracking-widest px-4 py-1.5 rounded-full border transition-all duration-150 ${
              activeTab === tab
                ? "bg-blush-dark text-white border-blush-dark"
                : "border-border text-muted-foreground hover:border-blush-dark hover:text-blush-dark"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((article, i) => (
          <ArticleCard key={article.url} article={article} index={i} />
        ))}
      </div>
    </div>
  );
};

const EMOJIS = ["🌱", "💡", "🚀"];
const SUPABASE_URL = "https://uaiymunelgvvnznkxeik.supabase.co";

const FrameworkItem = ({ fw, index }: { fw: Framework; index: number }) => (
  <AccordionItem
    value={`fw-${index}`}
    className="bg-card border border-border rounded-xl px-5 shadow-sm"
  >
    <AccordionTrigger className="hover:no-underline py-4">
      <div className="flex items-center gap-3 text-left min-w-0 flex-1">
        <span className="text-xl flex-shrink-0">
          {EMOJIS[index % EMOJIS.length]}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="font-heading text-sm md:text-base font-semibold text-foreground break-words">
            {fw.name}
          </h4>
          {fw.inspiredBy && (
            <p className="text-[11px] font-body text-muted-foreground mt-0.5 break-words">
              Inspired by {fw.inspiredBy}
            </p>
          )}
        </div>
      </div>
    </AccordionTrigger>
    <AccordionContent className="pb-5">
      <div className="space-y-3 pl-9">
        {fw.description && (
          <div>
            <p className="text-xs font-body font-medium uppercase tracking-widest text-blush-dark mb-1">
              What it is
            </p>
            <p className="text-sm text-muted-foreground font-body">
              {fw.description}
            </p>
          </div>
        )}
        {fw.howUseful && (
          <div>
            <p className="text-xs font-body font-medium uppercase tracking-widest text-blush-dark mb-1">
              How it's useful
            </p>
            <p className="text-sm text-muted-foreground font-body">
              {fw.howUseful}
            </p>
          </div>
        )}
        {fw.howToImplement && (
          <div>
            <p className="text-xs font-body font-medium uppercase tracking-widest text-blush-dark mb-1">
              How to implement
            </p>
            <p className="text-sm text-muted-foreground font-body">
              {fw.howToImplement}
            </p>
          </div>
        )}
      </div>
    </AccordionContent>
  </AccordionItem>
);

const BecomingSpaceSection = () => {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFrameworks = async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/fetch-frameworks`);
        const data = await res.json();
        setFrameworks(data.frameworks || []);
      } catch (err) {
        console.error("Failed to fetch frameworks:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFrameworks();
  }, []);

  // Only hide the whole section if frameworks failed AND we're still loading
  // (Curated Reads is static and always shows)

  return (
    <section id="becoming-space" className="py-7 md:py-10 bg-secondary/40">
      <div className="container max-w-4xl">
        <CrescentStar size={24} className="text-blush-dark mx-auto mb-6" />
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark text-center mb-3"
        >
          Grow · Learn · Transform
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading text-3xl md:text-4xl font-semibold text-foreground text-center"
        >
          The Becoming Space
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-3 text-center text-muted-foreground font-body max-w-xl mx-auto"
        >
          Frameworks and tools to guide your personal and professional growth.
        </motion.p>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="animate-spin text-muted-foreground" size={32} />
          </div>
        ) : frameworks.length > 0 ? (
          <>
            <Accordion type="single" collapsible className="mt-10 space-y-3">
              {frameworks.slice(0, 3).map((fw, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <FrameworkItem fw={fw} index={i} />
                </motion.div>
              ))}
            </Accordion>

            {frameworks.length > 3 && (
              <div className="flex justify-center mt-6">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="font-body uppercase tracking-widest text-xs px-6"
                    >
                      View All Frameworks ({frameworks.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="font-heading text-lg">
                        All Frameworks 🦋
                      </DialogTitle>
                    </DialogHeader>
                    <Accordion type="single" collapsible className="mt-4 space-y-3">
                      {frameworks.map((fw, i) => (
                        <FrameworkItem key={i} fw={fw} index={i} />
                      ))}
                    </Accordion>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </>
        ) : null}

        {!loading && <CuratedReads />}
      </div>
    </section>
  );
};

export default BecomingSpaceSection;
