import { useState } from "react";
import { Linkedin, Instagram, Globe, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MemberProfile } from "@/lib/memberProfile";

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join("");

export const MemberCard = ({ member, onClick }: { member: MemberProfile; onClick: () => void }) => {
  const [imgErr, setImgErr] = useState(false);
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer p-5 hover:shadow-lg transition-shadow flex flex-col gap-3 bg-card"
    >
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-primary/10">
          {member.photo_url && !imgErr ? (
            <img src={member.photo_url} alt={member.name} className="h-full w-full object-cover" onError={() => setImgErr(true)} />
          ) : (
            <span className="font-heading text-xl text-primary">{initials(member.name) || "·"}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-lg leading-tight truncate">{member.name}</h3>
          {(member.role || member.company) && (
            <p className="text-sm text-muted-foreground truncate">
              {[member.role, member.company].filter(Boolean).join(" · ")}
            </p>
          )}
          {member.city && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin size={12} /> {member.city}
            </p>
          )}
        </div>
      </div>

      {member.bio && <p className="text-sm text-foreground/80 line-clamp-2">{member.bio}</p>}

      {(member.industry || member.looking_for.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {member.industry && <Badge variant="secondary" className="text-xs">{member.industry}</Badge>}
          {member.looking_for.slice(0, 2).map(l => (
            <Badge key={l} variant="outline" className="text-xs">{l}</Badge>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mt-auto pt-1 text-muted-foreground">
        {member.linkedin_url && <Linkedin size={16} />}
        {member.instagram_url && <Instagram size={16} />}
        {member.website_url && <Globe size={16} />}
      </div>
    </Card>
  );
};
