import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const CircleTeaser = () => (
  <section id="circle" className="py-12 md:py-16">
    <div className="container max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative rounded-2xl border border-border bg-card p-8 md:p-12 overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-blush-light/40 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Heart size={16} className="text-blush-dark" />
            <p className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark">
              Ask the Circle
            </p>
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-4">
            A safe circle for the hard questions.
          </h2>
          <p className="text-muted-foreground font-body max-w-2xl">
            Career pivots, motherhood, mental health, money, visa worries, relationships — share
            anonymously or with your name, and get supportive replies from approved Fempower
            members only. Moderated with care.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild className="bg-foreground text-primary-foreground hover:bg-foreground/90 font-body uppercase tracking-widest text-xs h-11 px-6">
              <Link to="/circle">Enter the Circle</Link>
            </Button>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-body">
              <Lock size={12} /> Members only · sign-in required
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default CircleTeaser;
