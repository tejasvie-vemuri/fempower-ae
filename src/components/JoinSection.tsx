import { motion } from "framer-motion";
import { CheckCircle, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import desertDunes from "@/assets/desert-dunes.jpg";
import { PalmDivider } from "./GulfDecoratives";

const INSTAGRAM_URL = "https://www.instagram.com/fempower.ae?igsh=cDB1OXNxcmhxanY5&utm_source=qr";

const bullets = [
  "Daily prompts + honest conversations",
  "Priority access to mentor walks + coaching circles",
  "Events every 15 days across UAE",
];

const JoinSection = () => (
  <section id="join" className="py-7 md:py-10 relative overflow-hidden">
    {/* Desert dunes background */}
    <div className="absolute inset-0 pointer-events-none">
      <img src={desertDunes} alt="" className="w-full h-full object-cover opacity-[0.08]" loading="lazy" width={1920} height={640} />
    </div>
    <div className="container max-w-4xl relative z-10">
      <PalmDivider className="mb-6" />
      <div className="bg-card rounded-2xl border border-border shadow-lg p-8 md:p-12">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark mb-3">Get Involved</p>
            <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground">Join the WhatsApp community by following us</h2>
            <p className="mt-3 text-muted-foreground font-body">Get daily prompts, event updates, and access to mentorship + circles.</p>
            <ul className="mt-5 space-y-2.5">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm font-body text-foreground">
                  <CheckCircle size={18} className="text-blush-dark flex-shrink-0 mt-0.5" />
                  {b}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-center">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Follow Fempower on Instagram"
              className="block w-48 h-48 mx-auto rounded-xl border border-border bg-blush-light hover:bg-blush-light/80 transition-colors flex flex-col items-center justify-center gap-3 group"
            >
              <Instagram size={48} className="text-blush-dark group-hover:scale-110 transition-transform" />
              <p className="text-sm font-body font-medium text-foreground px-4">@fempower.ae</p>
            </a>
            <Button className="mt-5 bg-foreground text-primary-foreground hover:bg-foreground/90 font-body uppercase tracking-widest text-xs w-full max-w-xs h-11" asChild>
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">DM on Instagram</a>
            </Button>
          </motion.div>
        </div>

      </div>
    </div>
  </section>
);

export default JoinSection;
