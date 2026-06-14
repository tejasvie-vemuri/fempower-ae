import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { useToast } from "@/hooks/use-toast";
import { PhotoUpload } from "@/components/directory/PhotoUpload";
import {
  memberProfileSchema, INDUSTRIES, LOOKING_FOR_OPTIONS, STATUS_LABELS,
} from "@/lib/memberProfile";

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
            <button type="button" onClick={() => onChange(value.filter(x => x !== t))}><X size={12} /></button>
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
    // Re-submit for review if member had been rejected/hidden and now updates
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

  return (
    <>
      <Header />
      <main className="pt-24 pb-20 min-h-screen bg-background">
        <div className="container max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-heading text-3xl md:text-4xl text-primary">Your Profile</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Status: <Badge variant={profile.status === "approved" ? "default" : "outline"}>{STATUS_LABELS[profile.status]}</Badge>
              </p>
            </div>
            <Button variant="outline" asChild><Link to="/directory">Back to directory</Link></Button>
          </div>

          <div className="space-y-6 bg-card border rounded-lg p-6">
            <PhotoUpload userId={user!.id} value={form.photo_url || null} onChange={url => setForm(f => ({ ...f, photo_url: url || "" }))} />

            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Full name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>City *</Label><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Dubai" /></div>
              <div><Label>Role / Title *</Label><Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Product Manager" /></div>
              <div><Label>Company *</Label><Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} /></div>
            </div>

            <div>
              <Label>Short bio</Label>
              <Textarea rows={3} maxLength={600} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="A line or two about yourself." />
            </div>

            <div>
              <Label>Why are you part of Fempower? *</Label>
              <Textarea rows={2} maxLength={400} value={form.why_here} onChange={e => setForm(f => ({ ...f, why_here: e.target.value }))} />
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

            <div>
              <Label>Interests</Label>
              <TagInput value={form.interests} onChange={v => setForm(f => ({ ...f, interests: v }))} placeholder="Type and press Enter" />
            </div>

            <div>
              <Label>Open to</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {LOOKING_FOR_OPTIONS.map(opt => {
                  const active = form.looking_for.includes(opt);
                  return (
                    <button key={opt} type="button"
                      onClick={() => setForm(f => ({ ...f, looking_for: active ? f.looking_for.filter(x => x !== opt) : [...f.looking_for, opt] }))}
                      className={`px-3 py-1.5 text-xs rounded-full border transition ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:border-primary"}`}>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div><Label>LinkedIn URL *</Label><Input value={form.linkedin_url} onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))} placeholder="https://linkedin.com/in/…" /></div>
              <div><Label>Instagram URL</Label><Input value={form.instagram_url} onChange={e => setForm(f => ({ ...f, instagram_url: e.target.value }))} placeholder="https://instagram.com/…" /></div>
              <div><Label>Website</Label><Input value={form.website_url} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))} placeholder="https://…" /></div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={onSave} disabled={saving}>
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
