import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, X, Check, User, Briefcase, Heart, Compass, Link2, Sparkles, Wand2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { useToast } from "@/hooks/use-toast";
import { PhotoUpload } from "@/components/directory/PhotoUpload";
import {
  memberProfileSchema, INDUSTRIES, LOOKING_FOR_OPTIONS, STATUS_LABELS,
} from "@/lib/memberProfile";
import { cn } from "@/lib/utils";
import TestimonialSubmitDialog from "@/components/TestimonialSubmitDialog";

const TagInput = ({ value, onChange, placeholder, max = 15 }: {
  value: string[]; onChange: (v: string[]) => void; placeholder?: string; max?: number;
}) => {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v || value.includes(v) || value.length >= max) { setDraft(""); return; }
    onChange([...value, v]); setDraft("");
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map(t => (
          <Badge key={t} variant="secondary" className="gap-1">
            {t}
            <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter(x => x !== t))}><X size={12} /></button>
          </Badge>
        ))}
      </div>
      <Input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        onBlur={add}
        placeholder={placeholder}
      />
    </div>
  );
};

const NONE = "__none__";

const WHY_STARTERS = [
  "I'm here to find mentors and grow with women who get it.",
  "I want to build genuine friendships beyond work titles.",
  "I'm building my business and need a supportive circle around me.",
  "I recently moved to the UAE and want to root myself in community.",
];

const SectionCard = ({
  icon: Icon, title, subtitle, children,
}: { icon: React.ElementType; title: string; subtitle?: string; children: React.ReactNode }) => (
  <section className="bg-card border rounded-lg p-5 sm:p-6 space-y-4">
    <header className="flex items-start gap-3">
      <span className="mt-0.5 rounded-full bg-primary/10 text-primary p-2"><Icon size={18} /></span>
      <div>
        <h2 className="font-heading text-lg text-primary leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </header>
    <div className="space-y-4">{children}</div>
  </section>
);

// Inline validity indicator
const FieldOK = ({ show }: { show: boolean }) =>
  show ? (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 mt-1">
      <Check size={12} /> Looks good
    </span>
  ) : null;

const FieldError = ({ msg }: { msg?: string | null }) =>
  msg ? <p className="text-xs text-destructive mt-1">{msg}</p> : null;

// Nicely title-case a linkedin slug like "maya-hassan_22" → "Maya Hassan"
const nameFromLinkedIn = (url: string): string | null => {
  try {
    const u = new URL(url);
    if (!/linkedin\.com$/i.test(u.hostname) && !/\.linkedin\.com$/i.test(u.hostname)) return null;
    const seg = u.pathname.split("/").filter(Boolean);
    if (seg.length < 2 || seg[0].toLowerCase() !== "in") return null;
    const raw = seg[1].replace(/[_\d]+$/g, "").replace(/[-_]+/g, " ").trim();
    if (!raw) return null;
    return raw
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  } catch { return null; }
};

const MemberProfileEdit = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading, reload } = useMemberProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "", photo_url: "", role: "", company: "", city: "", bio: "",
    linkedin_url: "", instagram_url: "", website_url: "",
    industry: "", expertise_tags: [] as string[], interests: [] as string[],
    looking_for: [] as string[], why_here: "",
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/account/profile");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "",
        photo_url: profile.photo_url || "",
        role: profile.role || "",
        company: profile.company || "",
        city: profile.city || "",
        bio: profile.bio || "",
        linkedin_url: profile.linkedin_url || "",
        instagram_url: profile.instagram_url || "",
        website_url: profile.website_url || "",
        industry: profile.industry || "",
        expertise_tags: profile.expertise_tags || [],
        interests: profile.interests || [],
        looking_for: profile.looking_for || [],
        why_here: profile.why_here || "",
      });
    }
  }, [profile]);

  // Per-field validation using the shared schema (inline, live)
  const fieldIssues = useMemo(() => {
    const parsed = memberProfileSchema.safeParse(form);
    const issues: Record<string, string> = {};
    if (!parsed.success) {
      for (const i of parsed.error.issues) {
        const key = i.path[0]?.toString();
        if (key && !issues[key]) issues[key] = i.message;
      }
    }
    return issues;
  }, [form]);

  // Completeness meter (weights every meaningful field)
  const completeness = useMemo(() => {
    const items: [boolean, number][] = [
      [!!form.name.trim(), 10],
      [!!form.role.trim(), 10],
      [!!form.company.trim(), 10],
      [!!form.city.trim(), 8],
      [!!form.linkedin_url.trim() && !fieldIssues.linkedin_url, 12],
      [!!form.why_here.trim(), 15],
      [!!form.photo_url, 12],
      [!!form.bio && form.bio.trim().length >= 40, 8],
      [!!form.industry, 5],
      [form.expertise_tags.length >= 2, 4],
      [form.interests.length >= 2, 3],
      [form.looking_for.length >= 1, 3],
    ];
    const total = items.reduce((a, [, w]) => a + w, 0);
    const got = items.reduce((a, [ok, w]) => a + (ok ? w : 0), 0);
    return Math.round((got / total) * 100);
  }, [form, fieldIssues]);

  // Next best nudge for the progress bar
  const nextNudge = useMemo(() => {
    if (!form.photo_url) return "Add a photo — profiles with a face get 3× more connections.";
    if (!form.why_here.trim()) return "Share why you're here — sisters love to know your story.";
    if (!form.bio || form.bio.trim().length < 40) return "Add a short bio (a line or two) to introduce yourself.";
    if (!form.industry) return "Pick your industry so we can match you with the right sisters.";
    if (form.expertise_tags.length < 2) return "Add a couple of expertise tags — this helps others find you.";
    if (form.looking_for.length === 0) return "Tell us what you're open to — mentoring, friendship, hiring…";
    if (completeness === 100) return "You're a 100% sparkle ✨ — thank you!";
    return "Almost there — polish a few more details to shine.";
  }, [form, completeness]);

  const applyLinkedInSmartFill = () => {
    if (!form.linkedin_url.trim()) {
      toast({ title: "Paste your LinkedIn URL first", description: "Then tap Smart-fill again." });
      return;
    }
    const guess = nameFromLinkedIn(form.linkedin_url);
    if (!guess) {
      toast({ title: "Couldn't read that URL", description: "Make sure it looks like linkedin.com/in/your-name", variant: "destructive" });
      return;
    }
    setForm(f => ({ ...f, name: f.name.trim() ? f.name : guess }));
    toast({ title: "Prefilled from LinkedIn", description: `Set your name to "${guess}" — edit as needed.` });
  };

  const onSave = async () => {
    if (!user) return;
    const parsed = memberProfileSchema.safeParse(form);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast({ title: "Please fix", description: first.message, variant: "destructive" });
      return;
    }
    setSaving(true);
    const wasUnapproved = profile && profile.status !== "approved";
    const updates: any = { ...parsed.data };
    if (profile?.status === "rejected") updates.status = "pending";

    const { error } = await supabase
      .from("member_profiles")
      .update(updates)
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Profile saved", description: wasUnapproved ? "An admin will review and approve it shortly." : "Your profile is up to date." });
    reload();
  };

  if (authLoading || loading) {
    return (
      <><Header /><main className="pt-24 min-h-screen flex justify-center"><Loader2 className="animate-spin text-primary" /></main></>
    );
  }
  if (!profile) return null;

  const ok = (k: keyof typeof form) => {
    const v = form[k];
    const hasValue = Array.isArray(v) ? v.length > 0 : !!(v && String(v).trim());
    return hasValue && !fieldIssues[k as string];
  };

  return (
    <>
      <Header />
      <main className="pt-24 pb-20 min-h-screen bg-background">
        <div className="container max-w-3xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="font-heading text-3xl md:text-4xl text-primary">Your Profile</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Status: <Badge variant={profile.status === "approved" ? "default" : "outline"}>{STATUS_LABELS[profile.status]}</Badge>
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild><Link to="/account/checklists">Checklist history</Link></Button>
              <Button variant="outline" asChild><Link to="/directory">Back to directory</Link></Button>
            </div>
          </div>

          {/* Completeness meter */}
          <div className="bg-card border rounded-lg p-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                <span className="text-sm font-medium">Profile completeness</span>
              </div>
              <span className="text-sm font-semibold text-primary tabular-nums">{completeness}%</span>
            </div>
            <Progress value={completeness} aria-label={`Profile ${completeness}% complete`} />
            <p className="text-xs text-muted-foreground mt-2">{nextNudge}</p>
          </div>

          <div className="space-y-5">
            {/* WHO YOU ARE */}
            <SectionCard icon={User} title="Who you are" subtitle="The basics — so sisters recognise you.">
              <PhotoUpload
                userId={user!.id}
                value={form.photo_url || null}
                onChange={url => setForm(f => ({ ...f, photo_url: url || "" }))}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Full name *</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  <FieldOK show={ok("name")} />
                  <FieldError msg={form.name ? fieldIssues.name : null} />
                </div>
                <div>
                  <Label>City *</Label>
                  <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Dubai" />
                  <FieldOK show={ok("city")} />
                </div>
              </div>
            </SectionCard>

            {/* WHAT YOU DO */}
            <SectionCard icon={Briefcase} title="What you do" subtitle="Your work in the world.">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Role / Title *</Label>
                  <Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Product Manager" />
                  <FieldOK show={ok("role")} />
                </div>
                <div>
                  <Label>Company *</Label>
                  <Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
                  <FieldOK show={ok("company")} />
                </div>
              </div>
              <div>
                <Label>Industry</Label>
                <Select value={form.industry || NONE} onValueChange={v => setForm(f => ({ ...f, industry: v === NONE ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Choose industry" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>—</SelectItem>
                    {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Areas of expertise</Label>
                <TagInput value={form.expertise_tags} onChange={v => setForm(f => ({ ...f, expertise_tags: v }))} placeholder="Type and press Enter" />
              </div>
            </SectionCard>

            {/* YOUR STORY */}
            <SectionCard icon={Heart} title="Your story" subtitle="A few honest lines. No corporate speak needed.">
              <div>
                <Label>Short bio</Label>
                <Textarea rows={3} maxLength={600} value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="A line or two about yourself — what you love, what you're building." />
                <div className="flex justify-between mt-1">
                  <FieldOK show={!!form.bio && form.bio.trim().length >= 40} />
                  <span className="text-xs text-muted-foreground">{(form.bio || "").length}/600</span>
                </div>
              </div>
              <div>
                <Label>Why are you part of Fempower? *</Label>
                <Textarea rows={3} maxLength={400} value={form.why_here}
                  onChange={e => setForm(f => ({ ...f, why_here: e.target.value }))}
                  placeholder="Share what brought you here." />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-xs text-muted-foreground w-full mb-0.5">Not sure where to start? Try one of these:</span>
                  {WHY_STARTERS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, why_here: s }))}
                      className="text-xs px-2.5 py-1 rounded-full border border-input hover:border-primary hover:bg-primary/5 transition text-left"
                    >
                      {s.length > 60 ? s.slice(0, 58) + "…" : s}
                    </button>
                  ))}
                </div>
                <FieldOK show={ok("why_here")} />
              </div>
              <div>
                <Label>Interests</Label>
                <TagInput value={form.interests} onChange={v => setForm(f => ({ ...f, interests: v }))} placeholder="Type and press Enter" />
              </div>
            </SectionCard>

            {/* WHAT YOU'RE LOOKING FOR */}
            <SectionCard icon={Compass} title="What you're open to" subtitle="Help sisters know how to show up for you.">
              <div className="flex flex-wrap gap-2">
                {LOOKING_FOR_OPTIONS.map(opt => {
                  const active = form.looking_for.includes(opt);
                  return (
                    <button key={opt} type="button"
                      onClick={() => setForm(f => ({
                        ...f,
                        looking_for: active ? f.looking_for.filter(x => x !== opt) : [...f.looking_for, opt],
                      }))}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-full border transition",
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-input hover:border-primary",
                      )}>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            {/* LINKS */}
            <SectionCard icon={Link2} title="Your links" subtitle="LinkedIn is required for verification.">
              <div>
                <Label>LinkedIn URL *</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.linkedin_url}
                    onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))}
                    placeholder="https://linkedin.com/in/your-name"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={applyLinkedInSmartFill} className="shrink-0 gap-1.5">
                    <Wand2 size={14} /> Smart-fill
                  </Button>
                </div>
                <FieldOK show={ok("linkedin_url")} />
                <FieldError msg={form.linkedin_url ? fieldIssues.linkedin_url : null} />
                <p className="text-xs text-muted-foreground mt-1">
                  Tip: Smart-fill reads your name from the URL to save typing.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Instagram URL</Label>
                  <Input value={form.instagram_url} onChange={e => setForm(f => ({ ...f, instagram_url: e.target.value }))} placeholder="https://instagram.com/…" />
                  <FieldError msg={form.instagram_url ? fieldIssues.instagram_url : null} />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input value={form.website_url} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))} placeholder="https://…" />
                  <FieldError msg={form.website_url ? fieldIssues.website_url : null} />
                </div>
              </div>
            </SectionCard>

            <div id="testimonial" className="scroll-mt-24">
              <SectionCard icon={Sparkles} title="Share your story" subtitle="A short testimonial for the Voices section — first name only, reviewed before it goes live.">
                <TestimonialSubmitDialog
                  trigger={
                    <Button type="button" variant="outline" className="gap-2">
                      <Sparkles size={16} /> Write or edit my testimonial
                    </Button>
                  }
                />
              </SectionCard>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <p className="text-xs text-muted-foreground">
                {completeness < 100 ? `${100 - completeness}% to a sparkle profile ✨` : "Sparkle profile unlocked ✨"}
              </p>
              <Button onClick={onSave} disabled={saving} size="lg">
                {saving && <Loader2 className="animate-spin mr-2" size={14} />}Save profile
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default MemberProfileEdit;
