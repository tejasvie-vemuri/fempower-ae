import { Linkedin, Instagram, Globe, MapPin, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MemberProfile } from "@/lib/memberProfile";

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join("");

export const MemberDrawer = ({
  member,
  open,
  onOpenChange,
}: {
  member: MemberProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  if (!member) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md w-full">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden ring-2 ring-primary/10">
              {member.photo_url ? (
                <img src={member.photo_url} alt={member.name} className="h-full w-full object-cover" />
              ) : (
                <span className="font-heading text-2xl text-primary">{initials(member.name) || "·"}</span>
              )}
            </div>
            <div>
              <SheetTitle className="font-heading text-2xl">{member.name}</SheetTitle>
              {(member.role || member.company) && (
                <p className="text-sm text-muted-foreground">
                  {[member.role, member.company].filter(Boolean).join(" · ")}
                </p>
              )}
              {member.city && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin size={12} /> {member.city}
                </p>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {member.bio && (
            <div>
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-1">About</h4>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{member.bio}</p>
            </div>
          )}

          {member.why_here && (
            <div>
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Why Fempower</h4>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{member.why_here}</p>
            </div>
          )}

          {member.industry && (
            <div>
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Industry</h4>
              <Badge variant="secondary">{member.industry}</Badge>
            </div>
          )}

          {member.expertise_tags.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Expertise</h4>
              <div className="flex flex-wrap gap-1.5">
                {member.expertise_tags.map(t => <Badge key={t} variant="outline">{t}</Badge>)}
              </div>
            </div>
          )}

          {member.interests.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Interests</h4>
              <div className="flex flex-wrap gap-1.5">
                {member.interests.map(t => <Badge key={t} variant="outline">{t}</Badge>)}
              </div>
            </div>
          )}

          {member.looking_for.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Open to</h4>
              <div className="flex flex-wrap gap-1.5">
                {member.looking_for.map(t => <Badge key={t}>{t}</Badge>)}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {member.linkedin_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer"><Linkedin size={14} className="mr-1.5" /> LinkedIn</a>
              </Button>
            )}
            {member.instagram_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={member.instagram_url} target="_blank" rel="noopener noreferrer"><Instagram size={14} className="mr-1.5" /> Instagram</a>
              </Button>
            )}
            {member.website_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={member.website_url} target="_blank" rel="noopener noreferrer"><Globe size={14} className="mr-1.5" /> Website</a>
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
