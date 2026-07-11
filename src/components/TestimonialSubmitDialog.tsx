import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

type Existing = { id: string; quote: string; status: "pending" | "approved" | "rejected" };

interface Props {
  trigger: React.ReactNode;
  onSubmitted?: () => void;
}

const MIN = 20;
const MAX = 400;

const TestimonialSubmitDialog = ({ trigger, onSubmitted }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [quote, setQuote] = useState("");
  const [existing, setExisting] = useState<Existing | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    supabase
      .from("member_testimonials")
      .select("id, quote, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExisting(data as Existing);
          setQuote(data.quote);
        } else {
          setExisting(null);
          setQuote("");
        }
        setLoading(false);
      });
  }, [open, user]);

  const submit = async () => {
    if (!user) return;
    const trimmed = quote.trim();
    if (trimmed.length < MIN || trimmed.length > MAX) {
      toast({ title: "Please share a bit more", description: `Between ${MIN} and ${MAX} characters.`, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (existing && existing.status === "pending") {
        const { error } = await supabase
          .from("member_testimonials")
          .update({ quote: trimmed })
          .eq("id", existing.id);
        if (error) throw error;
        toast({ title: "Testimonial updated", description: "Still awaiting review." });
      } else {
        const { error } = await supabase
          .from("member_testimonials")
          .insert({ user_id: user.id, quote: trimmed });
        if (error) throw error;
        toast({ title: "Thank you 💗", description: "Your testimonial is with the team for review." });
      }
      setOpen(false);
      onSubmitted?.();
    } catch (e: any) {
      toast({ title: "Couldn't submit", description: e?.message ?? "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remaining = MAX - quote.length;
  const isApproved = existing?.status === "approved";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Sparkles size={18} className="text-accent" /> Share your Fempower story
          </DialogTitle>
          <DialogDescription>
            A line or two about what Fempower means to you. Attributed by first name only. Reviewed before it goes live.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            {isApproved && (
              <p className="text-xs bg-blush-light text-blush-dark rounded-md px-3 py-2">
                Your testimonial is live. Submitting new text will replace it once approved.
              </p>
            )}
            {existing?.status === "pending" && (
              <p className="text-xs bg-muted rounded-md px-3 py-2 text-muted-foreground">Pending review — you can still edit below.</p>
            )}
            <Textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value.slice(0, MAX))}
              rows={5}
              placeholder="Fempower helped me…"
              disabled={saving}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{quote.trim().length < MIN ? `${MIN - quote.trim().length} more characters` : "Looks good"}</span>
              <span>{remaining} left</span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
              <Button onClick={submit} disabled={saving || quote.trim().length < MIN}>
                {saving && <Loader2 className="animate-spin mr-2" size={14} />}
                {existing && existing.status !== "rejected" ? "Update" : "Submit"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TestimonialSubmitDialog;
