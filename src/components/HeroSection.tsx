import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Instagram } from "lucide-react";
import heroImg from "@/assets/hero-community.jpg";
import { DuneWave } from "./GulfDecoratives";

const HeroSection = () => (
  <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
    <div className="absolute inset-0">
      <img src={heroImg} alt="Fempower community gathering" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-background/75" />
    </div>

    <div className="container relative z-10 py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl"
      >
        <p className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark mb-5">
          Women-first community · UAE
        </p>
        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight text-foreground">
          Rooted Together, Rising Together.
        </h1>
        <p className="mt-5 text-lg md:text-xl text-muted-foreground font-body leading-relaxed max-w-xl">
          Daily WhatsApp prompts. Mentor walks. Peer coaching circles. Events every 15 days.
          For women who want real conversations and real momentum.
        </p>

        <div className="mt-7 flex flex-col sm:flex-row gap-4">
          <Button size="lg" className="bg-foreground text-primary-foreground hover:bg-foreground/90 font-body uppercase tracking-widest text-xs px-10 h-12" asChild>
            <a href="#join">Join WhatsApp</a>
          </Button>
          <Button size="lg" variant="outline" className="font-body uppercase tracking-widest text-xs px-10 h-12 border-foreground/20" asChild>
            <a href="#programs">Explore Programs</a>
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground font-body uppercase tracking-widest">
          Career + Personal Growth · Community-led
        </p>

        {/* Social links */}
        <div className="mt-3 flex items-center gap-4">
          <a href="https://www.instagram.com/fempower.ae" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <Instagram size={18} />
          </a>
          <a href="https://www.linkedin.com/company/fempowerae/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
          </a>
        </div>
      </motion.div>
    </div>
  </section>
);

export default HeroSection;
