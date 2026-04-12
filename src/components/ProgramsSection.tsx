import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SkylineSilhouette } from "./GulfDecoratives";

const programs = [
  { id: "whatsapp", title: "WhatsApp Community", content: ["Daily prompts to spark honest conversations", "Book club discussions & reading challenges", "UAE-focused workplace conversations", "Fitness challenge threads", "Support circle energy—real wins, real struggles"] },
  { id: "mentor", title: "Mentor Walks", content: ["Quarterly cohorts with a structured matching process", "Limited to 10 mentor–mentee pairs per cohort", "Clear mentor/mentee expectations set from day one", "Application-based selection", "Walking conversations in beautiful UAE locations"] },
  { id: "coaching", title: "Coaching Circles", content: ["Empathy-led leadership", "Negotiation skills & salary conversations", "Personal brand building", "Confidence & boundary setting", "Inner compass journey—finding your purpose"] },
  { id: "events", title: "Events", content: ["Frequency: every 15 days across the UAE", "Iftar nights & cultural celebrations", "Annual review planning workshops", "Busy Girl Glam Up self-care events", "Networking walks & outdoor meetups"] },
];

const ProgramsSection = () => (
  <section id="programs" className="py-16 md:py-20">
    <div className="container max-w-3xl">
      <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark text-center mb-3">Deep Dive</motion.p>
      <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-heading text-3xl md:text-4xl font-semibold text-foreground text-center">Programs Spotlight</motion.h2>
      <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="mt-3 text-center text-muted-foreground font-body">Explore what each program offers in detail.</motion.p>

      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="mt-8">
        <Accordion type="single" collapsible className="space-y-3">
          {programs.map((p) => (
            <AccordionItem key={p.id} value={p.id} className="bg-card border border-border rounded-xl px-6 overflow-hidden">
              <AccordionTrigger className="font-heading text-lg font-semibold hover:no-underline py-4">{p.title}</AccordionTrigger>
              <AccordionContent className="pb-4">
                <ul className="space-y-2">
                  {p.content.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground font-body">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </div>
  </section>
);

export default ProgramsSection;
