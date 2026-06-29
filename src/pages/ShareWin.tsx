import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Loader2, PartyPopper, Sparkles } from "lucide-react";
import { MILESTONE_PRESETS } from "@/lib/milestones";

const careerPresets = Object.entries(MILESTONE_PRESETS).filter(
  ([k, v]) => v.category === "career" && k !== "custom"
);
const lifePresets = Object.entries(MILESTONE_PRESETS).filter(
  ([k, v]) => v.category === "life" && k !== "custom"
);

const ShareWin = () => {
  const { user } = useAuth();
  const [category, setCategory] = useState<"career" | "life" | "">("");
  const [milestoneKey, setMilestoneKey] = useState("");
  const [customText, setCustomText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const presets = category === "career" ? careerPresets : category === "life" ? lifePresets : [];
  const needsCustom = milestoneKey === "custom";
  const canSubmit = category && milestoneKey && (!needsCustom || customText.trim());

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;
    setSubmitting(true);
    const { error } = await (supabase as any).from("member_milestones").insert({
      user_id: user.id,
      category,
      milestone_key: milestoneKey,
      custom_text: needsCustom ? customText.trim() : null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not submit — please try again");
      return;
    }
    setSubmitted(true);
    toast.success("Your win has been submitted!");
  };

  if (submitted) {
    return (
      <>
        <Header />
        <main className="pt-28 md:pt-32 pb-20 min-h-screen bg-background">
          <div className="container max-w-xl text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <PartyPopper size={48} className="mx-auto text-blush-dark mb-4" />
              <h1 className="font-heading text-3xl font-semibold mb-3">
                We see you!
              </h1>
              <p className="font-body text-muted-foreground mb-8">
                Your win has been submitted. Once approved, it will be shared with the FemPower community so everyone can celebrate with you.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => { setSubmitted(false); setCategory(""); setMilestoneKey(""); setCustomText(""); }}>
                  Share another win
                </Button>
                <Button asChild>
                  <Link to="/">Back to home</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <section className="relative pt-28 pb-10 md:pt-32 md:pb-14 bg-background overflow-hidden">
        <div className="container max-w-xl">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6"
          >
            <ArrowLeft size={14} /> Back
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p className="flex items-center gap-2 text-xs md:text-sm font-body font-bold uppercase tracking-widest-xl text-blush-dark mb-4">
              <Sparkles size={14} /> Share a Win
            </p>
            <h1 className="font-heading text-3xl md:text-4xl font-semibold leading-tight text-foreground">
              Something worth celebrating?
            </h1>
            <p className="mt-4 text-base text-muted-foreground font-body leading-relaxed">
              Big or small — a promotion, a new chapter, a bold move. Share it with the FemPower community and let us cheer you on.
            </p>
          </motion.div>
        </div>
      </section>

      <main className="bg-secondary pb-20">
        <div className="container max-w-xl pt-10">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <div>
              <Label>What kind of win is this?</Label>
              <Select value={category} onValueChange={(v) => { setCategory(v as any); setMilestoneKey(""); }}>
                <SelectTrigger><SelectValue placeholder="Pick a category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="career">💼 Career Win</SelectItem>
                  <SelectItem value="life">🌟 Life Milestone</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {category && (
              <div>
                <Label>What happened?</Label>
                <Select value={milestoneKey} onValueChange={setMilestoneKey}>
                  <SelectTrigger><SelectValue placeholder="Pick your win" /></SelectTrigger>
                  <SelectContent>
                    {presets.map(([key, preset]) => (
                      <SelectItem key={key} value={key}>
                        {preset.emoji} {preset.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">⭐ Something else</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {needsCustom && (
              <div>
                <Label>Tell us about it</Label>
                <Textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="I just..."
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground mt-1">{customText.length}/200</p>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={submitting || !canSubmit}
              className="w-full"
            >
              {submitting && <Loader2 size={14} className="mr-2 animate-spin" />}
              Submit my win
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default ShareWin;
