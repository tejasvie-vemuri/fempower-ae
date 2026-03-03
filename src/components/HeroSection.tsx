import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-community.jpg";

const HeroSection = () => (
  <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
    {/* Background image */}
    <div className="absolute inset-0">
      <img src={heroImg} alt="Fempower community gathering" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-background/75" />
    </div>

    <div className="container relative z-10 py-20 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl"
      >
        <p className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark mb-6">
          Women-first community · UAE
        </p>
        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight text-foreground">
          Built for growth, courage, and connection.
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground font-body leading-relaxed max-w-xl">
          Daily WhatsApp prompts. Mentor walks. Peer coaching circles. Events every 15 days.
          For women who want real conversations and real momentum.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button size="lg" className="bg-foreground text-primary-foreground hover:bg-foreground/90 font-body uppercase tracking-widest text-xs px-10 h-12" asChild>
            <a href="#join">Join WhatsApp</a>
          </Button>
          <Button size="lg" variant="outline" className="font-body uppercase tracking-widest text-xs px-10 h-12 border-foreground/20" asChild>
            <a href="#programs">Explore Programs</a>
          </Button>
        </div>

        <p className="mt-8 text-xs text-muted-foreground font-body uppercase tracking-widest">
          Career + Personal Growth · Community-led
        </p>
      </motion.div>
    </div>
  </section>
);

export default HeroSection;
