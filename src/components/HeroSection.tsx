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
        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight text-foreground">
          A women-first community in the UAE—built for growth, courage, and connection.
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground font-body leading-relaxed max-w-xl">
          Daily WhatsApp prompts. Mentor walks. Peer coaching circles. Events every 15 days.
          For women who want real conversations and real momentum.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button size="lg" className="bg-accent text-accent-foreground hover:bg-blush-dark font-body text-base px-8" asChild>
            <a href="#join">Join WhatsApp</a>
          </Button>
          <Button size="lg" variant="outline" className="font-body text-base px-8 border-foreground/20" asChild>
            <a href="#programs">Explore Programs</a>
          </Button>
        </div>

        <p className="mt-8 text-sm text-muted-foreground font-body tracking-wide">
          Women across the UAE · Career + Personal Growth · Community-led
        </p>
      </motion.div>
    </div>
  </section>
);

export default HeroSection;
