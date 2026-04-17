import { motion } from "framer-motion";
import { Heart, TrendingUp, Sparkles, Globe2, Users } from "lucide-react";
import { PalmDivider, SkylineSilhouette } from "./GulfDecoratives";

const stats = [
  { icon: Globe2, value: "15+", label: "Nationalities" },
  { icon: Users, value: "400+", label: "Members" },
];

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
  <section id="about" className="py-10 md:py-14 relative overflow-hidden">
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

      <PalmDivider className="mt-5 mb-5" />

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

      <div className="flex justify-center mt-10">
        <SkylineSilhouette className="text-foreground" />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 max-w-md mx-auto">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col items-center gap-1.5 bg-card rounded-xl border border-border py-5 px-4 shadow-sm"
          >
            <s.icon size={20} className="text-blush-dark" />
            <p className="font-heading text-2xl md:text-3xl font-semibold text-foreground leading-none">{s.value}</p>
            <p className="text-xs font-body font-medium uppercase tracking-widest text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default AboutSection;
