import { Linkedin, Instagram, Globe, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MemberProfile } from "@/lib/memberProfile";
import { MemberAvatar } from "@/components/directory/MemberAvatar";

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join("");

export const MemberCard = ({ member, onClick }: { member: MemberProfile; onClick: () => void }) => {
  const [imgErr, setImgErr] = useState(false);
  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col gap-4 bg-card border-border hover:border-blush-dark/40 rounded-2xl h-full"
    >
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-full bg-blush-light flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-blush-dark/15 group-hover:ring-blush-dark/40 transition-all">
          {member.photo_url && !imgErr ? (
            <img src={member.photo_url} alt={member.name} className="h-full w-full object-cover" onError={() => setImgErr(true)} />
          ) : (
            <span className="font-heading text-xl text-blush-dark">{initials(member.name) || "·"}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-xl leading-tight tracking-tight text-foreground truncate">{member.name}</h3>
          {(member.role || member.company) && (
            <p className="text-sm font-body text-muted-foreground truncate mt-0.5">
              {[member.role, member.company].filter(Boolean).join(" · ")}
            </p>
          )}
          {member.city && (
            <p className="text-xs font-body uppercase tracking-widest text-blush-dark flex items-center gap-1 mt-1.5">
              <MapPin size={11} /> {member.city}
            </p>
          )}
        </div>
      </div>

      {member.bio && (
        <p className="text-sm font-body text-foreground/75 leading-relaxed line-clamp-2">{member.bio}</p>
      )}

      {(member.industry || member.looking_for.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {member.industry && (
            <Badge className="text-[10px] font-body uppercase tracking-widest bg-blush-light text-blush-dark hover:bg-blush-light border-0 rounded-full px-2.5">
              {member.industry}
            </Badge>
          )}
          {member.looking_for.slice(0, 2).map(l => (
            <Badge key={l} variant="outline" className="text-[10px] font-body uppercase tracking-widest rounded-full px-2.5 border-border">
              {l}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mt-auto pt-3 border-t border-border/60 text-muted-foreground">
        {member.linkedin_url && <Linkedin size={15} className="hover:text-blush-dark transition-colors" />}
        {member.instagram_url && <Instagram size={15} className="hover:text-blush-dark transition-colors" />}
        {member.website_url && <Globe size={15} className="hover:text-blush-dark transition-colors" />}
        <span className="ml-auto text-[10px] font-body uppercase tracking-widest text-blush-dark opacity-0 group-hover:opacity-100 transition-opacity">
          View →
        </span>
      </div>
    </Card>
  );
};
