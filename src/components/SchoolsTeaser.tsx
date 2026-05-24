import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const SchoolsTeaser = () => (
  <section id="schools-teaser" className="py-8 md:py-10">
    <div className="container max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative rounded-2xl border border-border bg-card p-6 sm:p-8 md:p-12 overflow-hidden"
      >
        <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full bg-blush-light/40 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap size={16} className="text-blush-dark" />
            <p className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark">
              School & Nursery Reviews
            </p>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground mb-4">
            By real parents — fees, curriculum, waitlist intel.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground font-body max-w-2xl">
            The honest school directory we wished we had. Browse curriculum, age range, fees and waitlist
            status — then read what other Fempower mothers actually experienced. Share your own to help the next family.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild className="bg-foreground text-primary-foreground hover:bg-foreground/90 font-body uppercase tracking-widest text-xs h-11 px-6">
              <Link to="/schools">Browse the directory</Link>
            </Button>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-body">
              <Star size={12} /> Member-reviewed
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default SchoolsTeaser;
