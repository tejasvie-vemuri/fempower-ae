import { motion } from "framer-motion";
import { Heart, TrendingUp, Sparkles } from "lucide-react";

const pillars = [
  { icon: Heart, label: "Belonging", desc: "A safe space where you feel seen." },
  { icon: TrendingUp, label: "Growth", desc: "Practical tools to move forward." },
  { icon: Sparkles, label: "Confidence", desc: "The courage to show up fully." },
];

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.5 },
  }),
};

const AboutSection = () => (
  <section id="about" className="py-16 md:py-20">
    <div className="container max-w-3xl text-center">
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark mb-3"
      >
        Our Story
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-heading text-3xl md:text-4xl font-semibold text-foreground"
      >
        Why Fempower
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="mt-4 text-lg text-muted-foreground font-body leading-relaxed"
      >
        Fempower is a safe, energizing space for women in the UAE—newcomers, professionals, founders—who want community that's practical and deeply human.
      </motion.p>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {pillars.map((p, i) => (
          <motion.div
            key={p.label}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-14 h-14 rounded-full bg-blush-light flex items-center justify-center">
              <p.icon size={24} className="text-blush-dark" />
            </div>
            <h3 className="font-heading text-xl font-semibold text-foreground">{p.label}</h3>
            <p className="text-sm text-muted-foreground font-body">{p.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default AboutSection;
