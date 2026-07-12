import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
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

  if (!loading && frameworks.length === 0) return null;

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
        ) : (
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
        )}
      </div>
    </section>
  );
};

export default BecomingSpaceSection;
