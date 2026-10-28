import { Mic, Sparkles, HeartHandshake, MapPin, MessageCircle, BookOpen, Quote, Star } from "lucide-react";
import { BADGE_LABELS, BADGE_HINTS, type BadgeKey } from "@/lib/directoryEngagement";
import { cn } from "@/lib/utils";

const ICONS: Record<BadgeKey, typeof Mic> = {
  spotlight: Sparkles,
  regular: Mic,
  host: MapPin,
  mentor: HeartHandshake,
  circle: MessageCircle,
  learner: BookOpen,
  story: Quote,
  allstar: Star,
};

export const MemberBadges = ({ badges, className }: { badges: BadgeKey[]; className?: string }) => {
  if (!badges.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {badges.map((b) => {
        const Icon = ICONS[b];
        return (
          <span
            key={b}
            title={BADGE_HINTS[b]}
            className="inline-flex items-center gap-1 rounded-full bg-accent/15 text-foreground px-2 py-0.5 text-[10px] font-body font-semibold uppercase tracking-widest"
          >
            <Icon size={11} className="text-accent" /> {BADGE_LABELS[b]}
          </span>
        );
      })}
    </div>
  );
};
