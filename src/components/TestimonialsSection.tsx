import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { SkylineSilhouette } from "./GulfDecoratives";

const testimonials = [
  { quote: "Fempower gave me the courage to negotiate my salary for the first time. The coaching circle changed everything." },
  { quote: "I moved to Dubai alone. This community made me feel like I belong. The mentor walks are my favourite part." },
  { quote: "Real conversations, real women, real growth. No fluff. Just exactly what I needed." },
];

const TestimonialsSection = () => (
  <section className="py-16 md:py-20 bg-blush-light">
    <div className="container max-w-5xl">
      <SkylineSilhouette className="text-foreground mx-auto mb-8" />
      <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark text-center mb-3">Voices</motion.p>
      <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-heading text-3xl md:text-4xl font-semibold text-foreground text-center">What Our Members Say</motion.h2>

      <div className="mt-10 grid md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-card rounded-xl p-5 shadow-sm border border-border">
            <Quote size={24} className="text-accent mb-3" />
            <p className="text-sm text-foreground font-body leading-relaxed italic">"{t.quote}"</p>
            <p className="mt-3 text-xs text-muted-foreground font-body font-medium uppercase tracking-widest">— Community Member</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
