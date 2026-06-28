import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, Copy, MessageCircle } from "lucide-react";

interface FeaturedWing {
  id: string;
  title: string;
  reflection_prompt: string;
  module_id: string;
  course_id: string;
  course_title: string;
}

const WingOfTheWeek = () => {
  const [wing, setWing] = useState<FeaturedWing | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("learn_wings")
        .select("id, title, reflection_prompt, module_id, featured_until")
        .gt("featured_until", new Date().toISOString())
        .order("featured_until", { ascending: false })
        .limit(1);

      if (!data || data.length === 0) return;
      const w = data[0];

      const { data: mod } = await (supabase as any)
        .from("learn_modules")
        .select("id, course_id")
        .eq("id", w.module_id)
        .single();

      if (!mod) return;

      const { data: course } = await (supabase as any)
        .from("learn_courses")
        .select("title")
        .eq("id", mod.course_id)
        .single();

      setWing({
        id: w.id,
        title: w.title,
        reflection_prompt: w.reflection_prompt,
        module_id: w.module_id,
        course_id: mod.course_id,
        course_title: course?.title ?? "",
      });
    })();
  }, []);

  if (!wing) return null;

  const whatsappText = `✨ *FemPower Wing of the Week*\n\n📖 *${wing.title}*\nfrom ${wing.course_title}\n\n💭 *Reflect on this:*\n${wing.reflection_prompt}\n\nWrite your reflection on FemPower Learn → fempower.ae/learn`;

  const copyForWhatsApp = () => {
    navigator.clipboard.writeText(whatsappText);
    toast.success("Copied — paste it in WhatsApp!");
  };

  return (
    <Card className="border-blush-dark/20 bg-blush-light/30 mb-8">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-lg flex items-center gap-2">
          <Sparkles size={18} className="text-blush-dark" />
          Wing of the Week
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Link
          to={`/learn/${wing.course_id}/${wing.module_id}/${wing.id}`}
          className="font-body font-medium text-foreground hover:text-blush-dark transition-colors"
        >
          {wing.title}
        </Link>
        <p className="text-sm text-muted-foreground mt-1 italic">
          "{wing.reflection_prompt}"
        </p>
        <div className="flex items-center gap-2 mt-4">
          <Button size="sm" variant="outline" onClick={copyForWhatsApp} className="font-body text-xs">
            <Copy size={12} className="mr-1.5" /> Copy for WhatsApp
          </Button>
          <Button size="sm" variant="ghost" asChild className="font-body text-xs">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={12} className="mr-1.5" /> Share on WhatsApp
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WingOfTheWeek;
