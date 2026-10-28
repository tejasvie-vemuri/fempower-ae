import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ALL_BADGES, BADGE_LABELS, BADGE_HINTS, MANUAL_ONLY_BADGES, type BadgeKey } from "@/lib/directoryEngagement";
import { MemberBadges } from "@/components/directory/MemberBadges";

export const AdminBadgeDialog = ({
  member, onOpenChange,
}: {
  member: { user_id: string; name: string } | null;
  onOpenChange: (open: boolean) => void;
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [awarded, setAwarded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!member) return;
    setLoading(true);
    supabase.from("member_badge_awards").select("badge_key").eq("user_id", member.user_id)
      .then(({ data }) => {
        setAwarded(new Set((data ?? []).map((r) => r.badge_key)));
        setLoading(false);
      });
  }, [member]);

  const toggle = async (key: BadgeKey, on: boolean) => {
    if (!member) return;
    setBusy(key);
    const { error } = on
      ? await supabase.from("member_badge_awards").insert({ user_id: member.user_id, badge_key: key, awarded_by: user?.id ?? null })
      : await supabase.from("member_badge_awards").delete().eq("user_id", member.user_id).eq("badge_key", key);
    setBusy(null);
    if (error) {
      toast({ title: "Couldn't update badge", description: error.message, variant: "destructive" });
      return;
    }
    setAwarded((prev) => {
      const next = new Set(prev);
      if (on) next.add(key); else next.delete(key);
      return next;
    });
    toast({ title: on ? `${BADGE_LABELS[key]} given` : `${BADGE_LABELS[key]} removed` });
  };

  const Row = ({ k }: { k: BadgeKey }) => (
    <label className="flex items-start gap-3 py-2 cursor-pointer">
      <Checkbox
        checked={awarded.has(k)}
        disabled={busy === k}
        onCheckedChange={(v) => toggle(k, v === true)}
        aria-label={BADGE_LABELS[k]}
      />
      <span>
        <span className="text-sm font-medium text-foreground">{BADGE_LABELS[k]}</span>
        <span className="block text-xs text-muted-foreground">{BADGE_HINTS[k]}</span>
      </span>
    </label>
  );

  const auto = ALL_BADGES.filter((k) => !MANUAL_ONLY_BADGES.includes(k));

  return (
    <Dialog open={!!member} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Badges for {member?.name}</DialogTitle>
          <DialogDescription>Ticked badges show on her directory card straight away.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {awarded.size > 0 && <MemberBadges badges={[...awarded] as BadgeKey[]} />}
            <div>
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Team-given badges</h4>
              {MANUAL_ONLY_BADGES.map((k) => <Row key={k} k={k} />)}
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Give an automatic badge by hand</h4>
              <p className="text-xs text-muted-foreground mb-1">Use when she earned it offline, e.g. attended events before online booking.</p>
              {auto.map((k) => <Row key={k} k={k} />)}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
