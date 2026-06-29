import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Check, Loader2, Plus, Star, Trash2, X } from "lucide-react";
import { getMilestoneDisplay, MILESTONE_CATEGORIES, type MemberMilestone, type MemberSpotlight } from "@/lib/milestones";

// ── Milestones Tab ──────────────────────────────────────────

function MilestonesTab() {
  const { user } = useAuth();
  const [items, setItems] = useState<(MemberMilestone & { member_name?: string; member_photo?: string })[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    let q = (supabase as any)
      .from("member_milestones")
      .select("*")
      .order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((m: any) => m.user_id))];
      const { data: profiles } = await supabase
        .from("member_profiles")
        .select("user_id, name, photo_url")
        .in("user_id", userIds as string[]);
      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.user_id, p])
      );
      setItems(
        data.map((m: any) => ({
          ...m,
          member_name: profileMap.get(m.user_id)?.name ?? "Unknown",
          member_photo: profileMap.get(m.user_id)?.photo_url ?? null,
        }))
      );
    } else {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const approve = async (m: MemberMilestone & { member_name?: string }) => {
    const display = getMilestoneDisplay(m.milestone_key, m.custom_text);
    const cat = MILESTONE_CATEGORIES[m.category as keyof typeof MILESTONE_CATEGORIES];
    const body = `🎉 ${m.member_name} just hit a milestone: ${display.emoji} ${display.label}!\n\nCelebrate with her in the comments.`;

    const { data: post, error: postErr } = await (supabase as any)
      .from("circle_posts")
      .insert({
        user_id: m.user_id,
        topic_tag: "other",
        body,
        is_anonymous: false,
        status: "published",
        risk_level: "none",
        flagged_keywords: [],
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (postErr) {
      toast.error("Could not create Circle post");
      return;
    }

    const { error } = await (supabase as any)
      .from("member_milestones")
      .update({ status: "approved", circle_post_id: post.id })
      .eq("id", m.id);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Milestone approved and posted to Circle!");
    load();
  };

  const reject = async (id: string) => {
    const { error } = await (supabase as any)
      .from("member_milestones")
      .update({ status: "rejected" })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Milestone rejected");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this milestone?")) return;
    const { error } = await (supabase as any)
      .from("member_milestones")
      .delete()
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Milestone deleted");
    load();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="font-heading text-lg">Milestones</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
      ) : items.length === 0 ? (
        <p className="text-center text-muted-foreground font-body py-12">
          {filter === "pending" ? "No pending milestones" : "No milestones found"}
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((m) => {
            const display = getMilestoneDisplay(m.milestone_key, m.custom_text);
            const cat = MILESTONE_CATEGORIES[m.category as keyof typeof MILESTONE_CATEGORIES];
            return (
              <div key={m.id} className="border border-border rounded-xl p-4 bg-card flex items-start gap-4">
                {m.member_photo ? (
                  <img src={m.member_photo} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {(m.member_name ?? "?").charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-body font-medium text-sm">{m.member_name}</p>
                  <p className="font-body text-sm mt-0.5">
                    {display.emoji} {display.label}
                    {m.custom_text && m.milestone_key === "custom" && (
                      <span className="text-muted-foreground"> — "{m.custom_text}"</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="secondary" className="text-xs">{cat?.emoji} {cat?.label}</Badge>
                    <Badge variant={m.status === "approved" ? "default" : m.status === "rejected" ? "destructive" : "outline"} className="text-xs">
                      {m.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString("en-AE", { dateStyle: "medium" })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {m.status === "pending" && (
                    <>
                      <Button size="icon" variant="ghost" title="Approve" onClick={() => approve(m)}>
                        <Check size={16} className="text-green-600" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Reject" onClick={() => reject(m.id)}>
                        <X size={16} className="text-red-500" />
                      </Button>
                    </>
                  )}
                  <Button size="icon" variant="ghost" title="Delete" onClick={() => remove(m.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── Spotlights Tab ──────────────────────────────────────────

const emptySpotlightForm = {
  id: "",
  user_id: "",
  story: "",
  active_from: "",
  active_until: "",
};

function SpotlightsTab() {
  const [items, setItems] = useState<(MemberSpotlight & { member_name?: string; member_photo?: string })[]>([]);
  const [members, setMembers] = useState<{ user_id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptySpotlightForm);
  const [saving, setSaving] = useState(false);

  const loadMembers = async () => {
    const { data } = await supabase
      .from("member_profiles")
      .select("user_id, name")
      .eq("status", "approved")
      .order("name");
    setMembers(data ?? []);
  };

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("member_spotlights")
      .select("*")
      .order("active_from", { ascending: false });

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((s: any) => s.user_id))];
      const { data: profiles } = await supabase
        .from("member_profiles")
        .select("user_id, name, photo_url")
        .in("user_id", userIds as string[]);
      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.user_id, p])
      );
      setItems(
        data.map((s: any) => ({
          ...s,
          member_name: profileMap.get(s.user_id)?.name ?? "Unknown",
          member_photo: profileMap.get(s.user_id)?.photo_url ?? null,
        }))
      );
    } else {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); loadMembers(); }, []);

  const openCreate = () => {
    const now = new Date();
    const monthLater = new Date(now);
    monthLater.setMonth(monthLater.getMonth() + 1);
    setForm({
      ...emptySpotlightForm,
      active_from: now.toISOString().slice(0, 16),
      active_until: monthLater.toISOString().slice(0, 16),
    });
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      user_id: form.user_id,
      story: form.story,
      active_from: new Date(form.active_from).toISOString(),
      active_until: new Date(form.active_until).toISOString(),
    };
    const { error } = form.id
      ? await (supabase as any).from("member_spotlights").update(payload).eq("id", form.id)
      : await (supabase as any).from("member_spotlights").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(form.id ? "Spotlight updated" : "Spotlight created");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this spotlight?")) return;
    const { error } = await (supabase as any).from("member_spotlights").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Spotlight deleted");
    load();
  };

  const isActive = (s: MemberSpotlight) => {
    const now = new Date();
    return new Date(s.active_from) <= now && new Date(s.active_until) >= now;
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-lg">Member Spotlights</h2>
        <Button size="sm" onClick={openCreate}><Plus size={14} className="mr-1" /> New spotlight</Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
      ) : items.length === 0 ? (
        <p className="text-center text-muted-foreground font-body py-12">No spotlights yet</p>
      ) : (
        <div className="space-y-3">
          {items.map((s) => (
            <div key={s.id} className="border border-border rounded-xl p-4 bg-card flex items-start gap-4">
              {s.member_photo ? (
                <img src={s.member_photo} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {(s.member_name ?? "?").charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-body font-medium text-sm">{s.member_name}</p>
                <p className="font-body text-sm text-muted-foreground mt-0.5 line-clamp-2">{s.story}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant={isActive(s) ? "default" : "secondary"} className="text-xs">
                    {isActive(s) ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(s.active_from).toLocaleDateString("en-AE", { dateStyle: "medium" })} — {new Date(s.active_until).toLocaleDateString("en-AE", { dateStyle: "medium" })}
                  </span>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 size={14} /></Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? "Edit Spotlight" : "New Spotlight"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Member</Label>
              <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>
                  {members.map((m) => <SelectItem key={m.user_id} value={m.user_id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Their story</Label>
              <Textarea value={form.story} onChange={(e) => setForm({ ...form, story: e.target.value })} rows={4} placeholder="Write their story or paste what they submitted..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Active from</Label><Input type="datetime-local" value={form.active_from} onChange={(e) => setForm({ ...form, active_from: e.target.value })} /></div>
              <div><Label>Active until</Label><Input type="datetime-local" value={form.active_until} onChange={(e) => setForm({ ...form, active_until: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.user_id || !form.story.trim()}>
              {saving && <Loader2 size={14} className="mr-2 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Main Page ────────────────────────────────────────────────

const AdminMilestones = () => (
  <div className="container max-w-6xl py-10">
    <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
      <ArrowLeft size={14} /> Back to site
    </Link>
    <h1 className="font-heading text-3xl mb-6">Milestones & Spotlights</h1>
    <Tabs defaultValue="milestones">
      <TabsList className="mb-6">
        <TabsTrigger value="milestones">Milestones</TabsTrigger>
        <TabsTrigger value="spotlights">Spotlights</TabsTrigger>
      </TabsList>
      <TabsContent value="milestones"><MilestonesTab /></TabsContent>
      <TabsContent value="spotlights"><SpotlightsTab /></TabsContent>
    </Tabs>
  </div>
);

export default AdminMilestones;
