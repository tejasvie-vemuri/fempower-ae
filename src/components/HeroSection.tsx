import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Instagram } from "lucide-react";
import heroImg from "@/assets/hero-community.jpg";
import { DuneWave } from "./GulfDecoratives";
import { useSiteImages } from "@/hooks/useSiteImages";

const HeroSection = () => {
  const { data: heroImages } = useSiteImages("hero");
  const bg = heroImages[0];
  return (
  <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden" aria-label="Fempower hero">
    <div className="absolute inset-0">
      <img
        src={bg?.url ?? heroImg}
        alt={bg?.alt ?? "Women of the Fempower community gathering in Dubai, UAE"}
        className="w-full h-full object-cover"
        fetchPriority="high"
        decoding="async"
      />
      <div className="absolute inset-0 bg-background/80" />
    </div>

    <div className="container relative z-10 py-10 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl"
      >
        <p className="text-[11px] sm:text-xs md:text-sm font-body font-semibold uppercase tracking-widest text-blush-dark mb-4">
          Women-first community · Dubai &amp; UAE
        </p>
        <h1 className="font-heading text-[2rem] leading-[1.1] sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground">
          Fempower — Women's Community in Dubai &amp; the UAE
        </h1>
        <p className="mt-3 text-sm sm:text-base text-blush-dark font-body italic">
          Rooted Together, Rising Together.
        </p>
        <p className="mt-4 text-base sm:text-lg md:text-xl text-muted-foreground font-body leading-relaxed max-w-xl">
          Fempower is a women-only community in Dubai and across the UAE. Join 300+ women from 15+ nationalities for daily WhatsApp prompts, mentor walks, peer coaching circles, and women's networking events every 15 days.
        </p>

        <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button size="lg" className="bg-foreground text-primary-foreground hover:bg-foreground/90 font-body uppercase tracking-widest text-xs px-6 sm:px-10 h-12 w-full sm:w-auto" asChild>
            <Link to="/join">Join Us</Link>
          </Button>
          <Button size="lg" variant="outline" className="font-body uppercase tracking-widest text-xs px-6 sm:px-10 h-12 border-foreground/20 w-full sm:w-auto" asChild>
            <a href="#programs">Explore Programs</a>
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground font-body uppercase tracking-widest">
          Career + Personal Growth · Community-led
        </p>

        {/* Social links */}
        <div className="mt-3 flex items-center gap-4">
          <a href="https://www.instagram.com/fempower.ae?igsh=cDB1OXNxcmhxanY5&utm_source=qr" target="_blank" rel="noreferrer" aria-label="Fempower on Instagram" className="text-muted-foreground hover:text-foreground transition-colors">
            <Instagram size={18} />
          </a>
          <a href="https://www.linkedin.com/company/fempowerae/" target="_blank" rel="noopener noreferrer" aria-label="Fempower on LinkedIn" className="text-muted-foreground hover:text-foreground transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
          </a>
        </div>

        {/* Zara teaser */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          onClick={() => window.dispatchEvent(new Event("open-zara"))}
          className="mt-6 inline-flex max-w-full items-center gap-3 rounded-full pl-2 pr-4 sm:pr-5 py-2 text-left shadow-sm hover:shadow-md transition-shadow group"
          style={{ background: "#FDF8F3", border: "1px solid #4A204025" }}
          aria-label="Open Zara, your AI career coach"
        >
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
            style={{ background: "#4A2040", color: "#D4A853" }}
            aria-hidden="true"
          >
            ✦
          </span>
          <span className="flex flex-col leading-tight min-w-0">
            <span className="font-body text-[10px] uppercase tracking-widest" style={{ color: "#4A204090" }}>
              Meet Zara · Your Coach
            </span>
            <span className="font-body text-[13px] sm:text-sm font-medium" style={{ color: "#4A2040" }}>
              Ask her anything about growing your career in UAE →
            </span>
          </span>
        </motion.button>
      </motion.div>
    </div>
    <DuneWave className="absolute bottom-0 left-0 z-10" />
  </section>
  );
};

export default HeroSection;
