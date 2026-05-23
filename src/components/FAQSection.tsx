import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PalmDivider } from "./GulfDecoratives";

const faqs = [
  { q: "Is Fempower only for women in Dubai?", a: "Not at all! Fempower welcomes women from all emirates across the UAE. Our events happen in different cities, and the WhatsApp community connects women everywhere." },
  { q: "How does the WhatsApp community work?", a: "Once you join, you'll receive daily prompts, join conversations on career growth, book clubs, fitness challenges, and more. It's a supportive, unfiltered space." },
  { q: "How do Mentor Walks matching + cohorts work?", a: "Each quarter we open applications, match mentors with mentees based on goals and experience, and run a structured program with 10 pairs per cohort." },
  { q: "Are coaching circles free or paid?", a: "Our core WhatsApp community is free. Coaching circles and mentor walks may have a nominal fee to ensure commitment and quality. Details are shared when applications open." },
  { q: "How often are events and where do they happen?", a: "We host events every 15 days across the UAE—from Dubai Marina to Abu Dhabi. Locations vary to keep things fresh and accessible." },
  { q: "Is this for founders or corporate professionals?", a: "Both! Fempower is for any woman who wants growth—whether you're building a startup, climbing the corporate ladder, or exploring a career pivot." },
  { q: "What if I'm new to the UAE?", a: "Even better! Fempower is the perfect place to build your tribe. Many of our members joined when they first moved to the UAE." },
  { q: "How do I join?", a: "Simply DM us on our Instagram. We will respond promptly." },
];

const FAQSection = () => (
  <section id="faqs" className="py-7 md:py-10">
    <PalmDivider className="mb-6" />
    <div className="container max-w-3xl">
      <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark text-center mb-3">Common Questions</motion.p>
      <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-heading text-3xl md:text-4xl font-semibold text-foreground text-center">Frequently Asked Questions</motion.h2>

      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="mt-8">
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="bg-card border border-border rounded-xl px-6 overflow-hidden">
              <AccordionTrigger className="font-body font-medium text-left hover:no-underline py-4">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground font-body pb-4">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </div>
  </section>
);

export default FAQSection;
