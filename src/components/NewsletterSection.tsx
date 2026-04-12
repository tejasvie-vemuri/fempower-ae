import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import communityImg from "@/assets/community-networking.jpg";
import { CrescentStar } from "./GulfDecoratives";

const NewsletterSection = () => (
  <section id="newsletter" className="py-10 md:py-14 bg-foreground text-primary-foreground">
    <div className="container">
      <div className="flex justify-center mb-5">
        <CrescentStar size={20} className="text-accent" />
      </div>
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p className="text-xs font-body font-medium uppercase tracking-widest-xl text-accent mb-5">The Fempower Newsletter</p>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">Join the leaders shaping what's next.</h2>
          <p className="mt-5 text-primary-foreground/70 font-body text-lg leading-relaxed">Community highlights, inspiring stories, career advice, and exclusive event invites—delivered to your inbox monthly.</p>

          <motion.form initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }} className="mt-8 flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Enter your email" required className="flex-1 rounded-none border border-primary-foreground/30 bg-transparent px-4 py-3.5 text-sm font-body placeholder:text-primary-foreground/40 focus:outline-none focus:border-accent transition-colors" />
            <Button type="submit" className="bg-accent text-accent-foreground hover:bg-blush-dark font-body uppercase tracking-widest text-xs px-8 h-12 rounded-none">
              Subscribe <ArrowRight size={14} className="ml-2" />
            </Button>
          </motion.form>
          <p className="mt-3 text-xs text-primary-foreground/40 font-body">No spam, ever. Unsubscribe anytime.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="hidden md:block">
          <img src={communityImg} alt="Fempower community" className="w-full aspect-square object-cover rounded-xl" loading="lazy" />
        </motion.div>
      </div>
    </div>
  </section>
);

export default NewsletterSection;
