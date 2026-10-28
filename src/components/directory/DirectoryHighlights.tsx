import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, UserPlus, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/directory/MemberAvatar";
import type { MemberProfile } from "@/lib/memberProfile";
import {
  profileCompleteness, nextProfileNudge, suggestMembers, NEW_MEMBER_DAYS,
} from "@/lib/directoryEngagement";

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

const Avatar = ({ m, size = "h-14 w-14" }: { m: MemberProfile; size?: string }) => (
  <div className={`${size} rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-accent/30`}>
    <MemberAvatar
      path={m.photo_url}
      alt={m.name}
      className="h-full w-full object-cover"
      fallback={<span className="font-heading text-lg text-primary">{initials(m.name) || "·"}</span>}
    />
  </div>
);

export const ProfileProgressCard = ({ profile }: { profile: MemberProfile }) => {
  const pct = profileCompleteness(profile);
  if (pct >= 100) return null;
  return (
    <div className="bg-card rounded-2xl border border-border p-5 mb-8 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <p className="font-heading text-lg text-foreground">Your profile is {pct}% done</p>
          <span className="text-sm font-semibold text-primary tabular-nums">{pct}%</span>
        </div>
        <Progress value={pct} aria-label={`Profile ${pct}% complete`} />
        <p className="text-sm text-muted-foreground font-body mt-2">
          {nextProfileNudge(profile)} Complete profiles show up in “Women you should meet”.
        </p>
      </div>
      <Button asChild variant="outline" className="font-body uppercase tracking-widest text-xs">
        <Link to="/account/profile">Finish profile</Link>
      </Button>
    </div>
  );
};

const POOL_COLUMNS =
  "id,user_id,name,photo_url,role,company,city,bio,linkedin_url,instagram_url,website_url,industry,expertise_tags,interests,looking_for,ask_me_about,why_here,status,approved_at,created_at,updated_at";

export const SuggestedMembers = ({ me, onSelect }: { me: MemberProfile; onSelect: (m: MemberProfile, source: string) => void }) => {
  const [pool, setPool] = useState<MemberProfile[]>([]);
  useEffect(() => {
    supabase.from("member_profiles").select(POOL_COLUMNS).eq("status", "approved").limit(1000)
      .then(({ data }) => setPool((data ?? []) as unknown as MemberProfile[]));
  }, []);
  const picks = useMemo(() => suggestMembers(me, pool, 3), [me, pool]);
  if (!picks.length) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <Heart size={16} className="text-accent" />
        <h2 className="font-heading text-2xl text-foreground">Women you should meet</h2>
        <span className="text-xs font-body uppercase tracking-widest text-muted-foreground ml-2">Refreshes weekly</span>
      </div>
      <div className="grid gap-4 md:grid-cols-3" data-clarity-mask="True">
        {picks.map(({ member, reasons }) => (
          <button
            key={member.user_id}
            onClick={() => onSelect(member, "suggested")}
            className="text-left bg-card border border-border rounded-2xl p-5 hover:border-accent hover:shadow-md transition flex gap-4"
          >
            <Avatar m={member} />
            <div className="min-w-0">
              <p className="font-heading text-lg text-foreground truncate">{member.name}</p>
              <p className="text-xs text-muted-foreground truncate">{[member.role, member.company].filter(Boolean).join(" · ")}</p>
              <ul className="mt-2 space-y-0.5">
                {reasons.slice(0, 2).map((r) => (
                  <li key={r} className="text-xs font-body text-primary flex items-center gap-1">
                    <Sparkles size={10} className="text-accent" /> {r}
                  </li>
                ))}
              </ul>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export const NewThisWeek = ({ meId, onSelect }: { meId?: string; onSelect: (m: MemberProfile, source: string) => void }) => {
  const [items, setItems] = useState<MemberProfile[]>([]);
  useEffect(() => {
    const since = new Date(Date.now() - NEW_MEMBER_DAYS * 86400000).toISOString();
    supabase.from("member_profiles").select(POOL_COLUMNS).eq("status", "approved")
      .gte("approved_at", since).order("approved_at", { ascending: false }).limit(20)
      .then(({ data }) => setItems(((data ?? []) as unknown as MemberProfile[]).filter((m) => m.user_id !== meId)));
  }, [meId]);
  if (!items.length) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus size={16} className="text-accent" />
        <h2 className="font-heading text-2xl text-foreground">New this week</h2>
        <span className="text-xs font-body uppercase tracking-widest text-muted-foreground ml-2">Say welcome 👋</span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1" data-clarity-mask="True">
        {items.map((m) => (
          <button
            key={m.user_id}
            onClick={() => onSelect(m, "new_this_week")}
            className="flex-shrink-0 w-28 flex flex-col items-center text-center gap-2 group"
          >
            <Avatar m={m} size="h-16 w-16" />
            <span className="text-sm font-body text-foreground leading-tight line-clamp-2 group-hover:text-primary">{m.name}</span>
            {m.city && <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{m.city}</span>}
          </button>
        ))}
      </div>
    </section>
  );
};
