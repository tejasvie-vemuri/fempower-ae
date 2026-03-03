import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

const NewsletterSection = () => (
  <section id="newsletter" className="py-24 md:py-32">
    <div className="container max-w-2xl text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="w-14 h-14 rounded-full bg-blush-light flex items-center justify-center mx-auto mb-6">
          <Mail size={24} className="text-blush-dark" />
        </div>
        <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground">
          Stay in the Loop
        </h2>
        <p className="mt-4 text-muted-foreground font-body leading-relaxed">
          Get our monthly newsletter with community highlights, upcoming events, inspiring stories, and exclusive resources — straight to your inbox.
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.15 }}
        className="mt-10 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          type="text"
          placeholder="Your name"
          className="flex-1 rounded-lg border border-border bg-card px-4 py-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="email"
          placeholder="Your email"
          required
          className="flex-1 rounded-lg border border-border bg-card px-4 py-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button type="submit" className="bg-accent text-accent-foreground hover:bg-blush-dark font-body px-6">
          Subscribe
        </Button>
      </motion.form>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.25 }}
        className="mt-4 text-xs text-muted-foreground font-body"
      >
        No spam, ever. Unsubscribe anytime.
      </motion.p>
    </div>
  </section>
);

export default NewsletterSection;
