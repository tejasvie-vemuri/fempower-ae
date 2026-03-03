import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const bullets = [
  "Daily prompts + honest conversations",
  "Priority access to mentor walks + coaching circles",
  "Events every 15 days across UAE",
];

const JoinSection = () => (
  <section id="join" className="py-16 md:py-20">
    <div className="container max-w-4xl">
      <div className="bg-card rounded-2xl border border-border shadow-lg p-8 md:p-12">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark mb-3">Get Involved</p>
            <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground">Join the WhatsApp community</h2>
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
            <div className="w-48 h-48 mx-auto bg-muted rounded-xl border-2 border-dashed border-border flex items-center justify-center">
              <p className="text-sm text-muted-foreground font-body px-4">[Insert WhatsApp Invite QR Code Here]</p>
            </div>
            <Button className="mt-5 bg-foreground text-primary-foreground hover:bg-foreground/90 font-body uppercase tracking-widest text-xs w-full max-w-xs h-11" asChild>
              <a href="https://chat.whatsapp.com/YOUR_INVITE_LINK" target="_blank" rel="noopener noreferrer">Open WhatsApp Invite Link</a>
            </Button>
          </motion.div>
        </div>

        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground font-body text-center mb-3">Prefer email updates instead?</p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input type="text" placeholder="Your name" className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring" />
            <input type="email" placeholder="Your email" className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring" />
            <Button type="submit" variant="outline" className="font-body uppercase tracking-widest text-xs">Subscribe</Button>
          </form>
        </div>
      </div>
    </div>
  </section>
);

export default JoinSection;
