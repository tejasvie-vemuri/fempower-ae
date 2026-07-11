import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Quote, Sparkles } from "lucide-react";
import { SkylineSilhouette } from "./GulfDecoratives";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { isActiveMemberStatus } from "@/lib/memberProfile";
import { Button } from "@/components/ui/button";
import TestimonialSubmitDialog from "./TestimonialSubmitDialog";

type Testimonial = { id: string; quote: string; first_name: string | null };

const FALLBACK: Testimonial[] = [
  { id: "f1", quote: "Fempower gave me the courage to negotiate my salary for the first time. The coaching circle changed everything.", first_name: null },
  { id: "f2", quote: "I moved to Dubai alone. This community made me feel like I belong. The mentor walks are my favourite part.", first_name: null },
  { id: "f3", quote: "Real conversations, real women, real growth. No fluff. Just exactly what I needed.", first_name: null },
];

const TestimonialsSection = () => {
  const { user } = useAuth();
  const { profile } = useMemberProfile();
  const canSubmit = !!user && isActiveMemberStatus(profile?.status);
  const [items, setItems] = useState<Testimonial[] | null>(null);

  const load = async () => {
    const { data, error } = await supabase.rpc("get_testimonials_public");
    if (error || !data || data.length === 0) {
      setItems(FALLBACK);
      return;
    }
    setItems(data as Testimonial[]);
  };

  useEffect(() => { load(); }, []);

  const list = items ?? FALLBACK;

  return (
    <section id="voices" className="py-7 md:py-10 bg-blush-light">
      <div className="container max-w-5xl">
        <SkylineSilhouette className="text-foreground mx-auto mb-5" />
        <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark text-center mb-3">Voices</motion.p>
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-heading text-3xl md:text-4xl font-semibold text-foreground text-center">What Our Members Say</motion.h2>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {list.slice(0, 6).map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-card rounded-xl p-5 shadow-sm border border-border">
              <Quote size={24} className="text-accent mb-3" />
              <p className="text-sm text-foreground font-body leading-relaxed italic">"{t.quote}"</p>
              <p className="mt-3 text-xs text-muted-foreground font-body font-medium uppercase tracking-widest">
                — {t.first_name ? t.first_name : "Community Member"}
              </p>
            </motion.div>
          ))}
        </div>

        {canSubmit && (
          <div className="mt-8 flex justify-center">
            <TestimonialSubmitDialog
              onSubmitted={load}
              trigger={
                <Button variant="outline" className="gap-2">
                  <Sparkles size={16} /> Share your testimonial
                </Button>
              }
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default TestimonialsSection;
