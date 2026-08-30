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
import { ArrowLeft, Check, Copy, Loader2, Plus, Send, Star, Trash2, X } from "lucide-react";
import { getMilestoneDisplay, MILESTONE_CATEGORIES, type MemberMilestone, type MemberSpotlight } from "@/lib/milestones";
import {
  STORY_QUESTIONS,
  emptyStoryAnswers,
  composeStoryText,
  composeLinkedInSnippet,
  type StoryAnswers,
  type SpotlightRequest,
} from "@/lib/spotlightRequests";
import SpotlightStory from "@/components/SpotlightStory";
import { MemberAvatar } from "@/components/directory/MemberAvatar";
import { LinkedInKitDialog } from "@/components/spotlight/LinkedInKitDialog";

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

// ── Story Requests Tab ──────────────────────────────────────

type DeliveryStatus = "sent" | "failed" | "dlq" | "suppressed" | "bounced" | "complained" | "pending";
type DeliveryInfo = { status: DeliveryStatus; at: string; error?: string | null };
type RequestRow = SpotlightRequest & {
  member_name?: string;
  member_photo?: string;
  delivery?: DeliveryInfo | null;
};

const emptyRequestForm = { user_id: "", personal_note: "" };

// Fetches the latest email_send_log row per idempotency-key prefix so admins can see
// whether the spotlight-story-request email actually landed. Kept lightweight: one
// query per page load, filtered to this template only.
async function loadDeliveryStatuses(
  requestIds: string[],
): Promise<Map<string, DeliveryInfo>> {
  if (requestIds.length === 0) return new Map();
  const prefixes = requestIds.map((id) => `spotlight-request-${id}%`);
  const orClause = prefixes.map((p) => `message_id.like.${p}`).join(",");
  const { data, error } = await (supabase as any)
    .from("email_send_log")
    .select("message_id, status, error_message, created_at")
    .eq("template_name", "spotlight-story-request")
    .or(orClause)
    .order("created_at", { ascending: false });
  if (error || !data) return new Map();

  const map = new Map<string, DeliveryInfo>();
  for (const row of data as Array<{ message_id: string | null; status: string; error_message: string | null; created_at: string }>) {
    if (!row.message_id) continue;
    // message_id is either `spotlight-request-<id>` or `spotlight-request-<id>-resend-<ts>` —
    // strip everything after the request UUID (36 chars after the fixed prefix).
    const match = row.message_id.match(/^spotlight-request-([0-9a-f-]{36})/i);
    if (!match) continue;
    const requestId = match[1];
    if (map.has(requestId)) continue; // rows are DESC-ordered so first wins
    map.set(requestId, {
      status: (row.status as DeliveryStatus) ?? "pending",
      at: row.created_at,
      error: row.error_message,
    });
  }
  return map;
}

const DELIVERY_LABEL: Record<DeliveryStatus, string> = {
  sent: "Email delivered",
  failed: "Email failed",
  dlq: "Email failed (retries exhausted)",
  suppressed: "Recipient suppressed",
  bounced: "Bounced",
  complained: "Marked as spam",
  pending: "Email queued",
};

function StoryRequestsTab() {
  const { user } = useAuth();
  const [items, setItems] = useState<RequestRow[]>([]);
  const [members, setMembers] = useState<{ user_id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "submitted" | "published" | "declined" | "all">("submitted");

  const [requestOpen, setRequestOpen] = useState(false);
  const [requestForm, setRequestForm] = useState(emptyRequestForm);
  const [sending, setSending] = useState(false);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [editing, setEditing] = useState<RequestRow | null>(null);
  const [editAnswers, setEditAnswers] = useState<StoryAnswers>(emptyStoryAnswers);
  const [activeFrom, setActiveFrom] = useState("");
  const [activeUntil, setActiveUntil] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [kitOpen, setKitOpen] = useState(false);
  const [kitRow, setKitRow] = useState<RequestRow | null>(null);

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
    let q = (supabase as any)
      .from("spotlight_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((r: any) => r.user_id))];
      const requestIds = data.map((r: any) => r.id as string);
      const [{ data: profiles }, deliveryMap] = await Promise.all([
        supabase
          .from("member_profiles")
          .select("user_id, name, photo_url")
          .in("user_id", userIds as string[]),
        loadDeliveryStatuses(requestIds),
      ]);
      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      setItems(
        data.map((r: any) => ({
          ...r,
          member_name: profileMap.get(r.user_id)?.name ?? "Unknown",
          member_photo: profileMap.get(r.user_id)?.photo_url ?? null,
          delivery: deliveryMap.get(r.id) ?? null,
        }))
      );
    } else {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); loadMembers(); /* eslint-disable-next-line */ }, [filter]);

  const alreadyInvited = new Set(
    items.filter((r) => r.status === "pending" || r.status === "submitted").map((r) => r.user_id)
  );

  const sendRequest = async () => {
    if (!requestForm.user_id || !user) return;
    setSending(true);
    const { data: row, error } = await (supabase as any)
      .from("spotlight_requests")
      .insert({
        user_id: requestForm.user_id,
        requested_by: user.id,
        personal_note: requestForm.personal_note.trim() || null,
      })
      .select("id")
      .single();

    if (error) {
      toast.error(error.message);
      setSending(false);
      return;
    }

    const member = members.find((m) => m.user_id === requestForm.user_id);
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("user_id", requestForm.user_id)
      .maybeSingle();

    if (profile?.email) {
      const idempotencyKey = `spotlight-request-${row.id}`;
      const { error: emailErr } = await supabase.functions.invoke("send-app-email", {
        body: {
          templateName: "spotlight-story-request",
          recipientEmail: profile.email,
          idempotencyKey,
          templateData: {
            name: member?.name,
            personalNote: requestForm.personal_note.trim() || null,
            siteUrl: window.location.origin,
          },
        },
      });
      if (emailErr) {
        // Tagged so it's easy to grep in browser console; the edge function
        // separately writes a row to email_send_log for the Supabase-side trail.
        console.error("[spotlight-story-request] invoke failed", {
          requestId: row.id,
          recipient: profile.email,
          idempotencyKey,
          error: emailErr.message,
        });
        toast.error(`Request saved but email failed: ${emailErr.message}`);
      } else {
        console.log("[spotlight-story-request] invoke ok", { requestId: row.id, idempotencyKey });
        toast.success("Story request sent!");
      }
    } else {
      toast.warning("Request created, but no email on file to notify her");
    }

    setSending(false);
    setRequestOpen(false);
    setRequestForm(emptyRequestForm);
    load();
  };

  const resend = async (r: RequestRow) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("user_id", r.user_id)
      .maybeSingle();
    if (!profile?.email) {
      toast.error("No email on file for this member");
      return;
    }
    const idempotencyKey = `spotlight-request-${r.id}-resend-${Date.now()}`;
    const { error: emailErr } = await supabase.functions.invoke("send-app-email", {
      body: {
        templateName: "spotlight-story-request",
        recipientEmail: profile.email,
        idempotencyKey,
        templateData: {
          name: r.member_name,
          personalNote: r.personal_note,
          siteUrl: window.location.origin,
        },
      },
    });
    if (emailErr) {
      console.error("[spotlight-story-request] resend failed", {
        requestId: r.id,
        recipient: profile.email,
        idempotencyKey,
        error: emailErr.message,
      });
      toast.error(`Resend failed: ${emailErr.message}`);
      return;
    }
    console.log("[spotlight-story-request] resend ok", { requestId: r.id, idempotencyKey });
    toast.success("Reminder sent");
    load();
  };

  const decline = async (id: string) => {
    if (!confirm("Cancel this request?")) return;
    const { error } = await (supabase as any).from("spotlight_requests").update({ status: "declined" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Request cancelled");
    load();
  };

  const openReview = (r: RequestRow) => {
    setEditing(r);
    setEditAnswers({
      headline: r.headline ?? "",
      role_company: r.role_company ?? "",
      identity_tag: r.identity_tag ?? "",
      stopped_waiting_for: r.stopped_waiting_for ?? "",
      the_before: r.the_before ?? "",
      the_turning_point: r.the_turning_point ?? "",
      the_now: r.the_now ?? "",
      advice: r.advice ?? "",
      shoutout: r.shoutout ?? "",
    });
    const now = new Date();
    const monthLater = new Date(now);
    monthLater.setMonth(monthLater.getMonth() + 1);
    setActiveFrom(now.toISOString().slice(0, 16));
    setActiveUntil(monthLater.toISOString().slice(0, 16));
    setReviewOpen(true);
  };

  const saveEdits = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await (supabase as any)
      .from("spotlight_requests")
      .update(editAnswers)
      .eq("id", editing.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Changes saved");
    load();
  };

  const publish = async () => {
    if (!editing) return;
    setPublishing(true);
    const storyText = composeStoryText(editAnswers);
    const { data: spotlight, error: spotlightErr } = await (supabase as any)
      .from("member_spotlights")
      .insert({
        user_id: editing.user_id,
        story: storyText,
        ...editAnswers,
        photo_url: editing.photo_url,
        consent_social: editing.consent_social,
        active_from: new Date(activeFrom).toISOString(),
        active_until: new Date(activeUntil).toISOString(),
        request_id: editing.id,
      })
      .select("id")
      .single();

    if (spotlightErr) {
      toast.error(spotlightErr.message);
      setPublishing(false);
      return;
    }

    const { error: updateErr } = await (supabase as any)
      .from("spotlight_requests")
      .update({
        ...editAnswers,
        status: "published",
        published_at: new Date().toISOString(),
        spotlight_id: spotlight.id,
      })
      .eq("id", editing.id);

    setPublishing(false);
    if (updateErr) { toast.error(updateErr.message); return; }
    toast.success("Story published to the site!");
    setReviewOpen(false);
    load();
  };

  const copyLinkedIn = async (r: RequestRow) => {
    const snippet = composeLinkedInSnippet(
      {
        headline: r.headline ?? "",
        role_company: r.role_company ?? "",
        identity_tag: r.identity_tag ?? "",
        stopped_waiting_for: r.stopped_waiting_for ?? "",
        the_before: r.the_before ?? "",
        the_turning_point: r.the_turning_point ?? "",
        the_now: r.the_now ?? "",
        advice: r.advice ?? "",
        shoutout: r.shoutout ?? "",
      },
      r.member_name ?? ""
    );
    await navigator.clipboard.writeText(snippet);
    toast.success("Copied — paste into LinkedIn");
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="font-heading text-lg">Story Requests</h2>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setRequestOpen(true)}>
            <Send size={14} className="mr-1" /> Request a story
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
      ) : items.length === 0 ? (
        <p className="text-center text-muted-foreground font-body py-12">No requests here yet</p>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <div key={r.id} className="border border-border rounded-xl p-4 bg-card flex items-start gap-4">
              {r.photo_url || r.member_photo ? (
                <MemberAvatar
                  path={r.photo_url ?? r.member_photo}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  fallback={
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {(r.member_name ?? "?").charAt(0)}
                    </div>
                  }
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {(r.member_name ?? "?").charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-body font-medium text-sm">{r.member_name}</p>
                {r.headline ? (
                  <p className="font-body text-sm mt-0.5 italic text-foreground/85">"{r.headline}"</p>
                ) : r.personal_note ? (
                  <p className="font-body text-sm mt-0.5 text-muted-foreground line-clamp-1">Note: "{r.personal_note}"</p>
                ) : null}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge
                    variant={r.status === "published" ? "default" : r.status === "declined" ? "destructive" : "outline"}
                    className="text-xs"
                  >
                    {r.status}
                  </Badge>
                  {(r.status === "submitted" || r.status === "published") && (
                    <Badge variant={r.consent_social ? "secondary" : "destructive"} className="text-xs">
                      {r.consent_social ? "✓ Consented to share" : "No consent on file"}
                    </Badge>
                  )}
                  {r.delivery && (
                    <Badge
                      variant={
                        r.delivery.status === "sent"
                          ? "secondary"
                          : r.delivery.status === "pending"
                          ? "outline"
                          : "destructive"
                      }
                      className="text-xs"
                      title={
                        (r.delivery.error ? `${r.delivery.error} — ` : "") +
                        new Date(r.delivery.at).toLocaleString("en-AE")
                      }
                    >
                      {DELIVERY_LABEL[r.delivery.status]}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("en-AE", { dateStyle: "medium" })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {(r.status === "pending" || r.status === "submitted") && (
                  <Button size="sm" variant="ghost" onClick={() => resend(r)}>
                    <Send size={14} className="mr-1" />
                    {r.delivery?.status === "sent" ? "Send again" : "Send email"}
                  </Button>
                )}
                {r.status === "pending" && (
                  <Button size="icon" variant="ghost" title="Cancel" onClick={() => decline(r.id)}>
                    <X size={14} className="text-red-500" />
                  </Button>
                )}
                {r.status === "submitted" && (
                  <Button size="sm" onClick={() => openReview(r)}>Review &amp; publish</Button>
                )}
                {r.status === "published" && r.consent_social && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => copyLinkedIn(r)}>
                      <Copy size={14} className="mr-1" /> Snippet
                    </Button>
                    <Button size="sm" onClick={() => { setKitRow(r); setKitOpen(true); }}>
                      <Star size={14} className="mr-1" /> LinkedIn Kit
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request a story */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Request a story</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Member</Label>
              <Select value={requestForm.user_id} onValueChange={(v) => setRequestForm({ ...requestForm, user_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id} disabled={alreadyInvited.has(m.user_id)}>
                      {m.name}{alreadyInvited.has(m.user_id) ? " (already invited)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Personal note</Label>
              <Textarea
                value={requestForm.personal_note}
                onChange={(e) => setRequestForm({ ...requestForm, personal_note: e.target.value })}
                rows={3}
                placeholder="Tell her why you're asking — specific asks get better answers. e.g. 'Your career pivot this year would inspire so many of us.'"
              />
              <p className="text-xs text-muted-foreground mt-1">Shown to her at the top of the form.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestOpen(false)}>Cancel</Button>
            <Button onClick={sendRequest} disabled={sending || !requestForm.user_id}>
              {sending && <Loader2 size={14} className="mr-2 animate-spin" />} Send request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review & publish */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.member_name}'s story</DialogTitle></DialogHeader>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {STORY_QUESTIONS.map((q) => (
                <div key={q.field}>
                  <Label>{q.label}</Label>
                  {q.multiline ? (
                    <Textarea
                      value={editAnswers[q.field]}
                      onChange={(e) => setEditAnswers({ ...editAnswers, [q.field]: e.target.value.slice(0, q.maxLength) })}
                      rows={3}
                      maxLength={q.maxLength}
                    />
                  ) : (
                    <Input
                      value={editAnswers[q.field]}
                      onChange={(e) => setEditAnswers({ ...editAnswers, [q.field]: e.target.value.slice(0, q.maxLength) })}
                      maxLength={q.maxLength}
                    />
                  )}
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Active from</Label><Input type="datetime-local" value={activeFrom} onChange={(e) => setActiveFrom(e.target.value)} /></div>
                <div><Label>Active until</Label><Input type="datetime-local" value={activeUntil} onChange={(e) => setActiveUntil(e.target.value)} /></div>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Preview</Label>
              <div className="bg-blush-light/50 border border-blush-dark/10 rounded-2xl p-5 sticky top-0">
                <div className="flex items-center gap-3 mb-4">
                  <MemberAvatar
                    path={editing?.photo_url ?? editing?.member_photo}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover border-2 border-blush-dark/20"
                    fallback={
                      <div className="w-14 h-14 rounded-full bg-blush-dark/10 flex items-center justify-center text-lg font-heading font-semibold text-blush-dark">
                        {(editing?.member_name ?? "?").charAt(0)}
                      </div>
                    }
                  />
                  <div>
                    <p className="font-heading font-semibold">{editing?.member_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {editing?.consent_social ? "✓ Consented to publish on site + social" : "⚠ No consent on file"}
                    </p>
                  </div>
                </div>
                <SpotlightStory story={composeStoryText(editAnswers)} {...editAnswers} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Close</Button>
            <Button variant="outline" onClick={saveEdits} disabled={saving}>
              {saving && <Loader2 size={14} className="mr-2 animate-spin" />} Save changes
            </Button>
            <Button
              onClick={publish}
              disabled={publishing || !editAnswers.headline.trim() || !editing?.consent_social}
              title={!editing?.consent_social ? "Can't publish without her consent on file" : undefined}
            >
              {publishing && <Loader2 size={14} className="mr-2 animate-spin" />} Publish to site
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LinkedInKitDialog
        open={kitOpen}
        onClose={() => setKitOpen(false)}
        row={kitRow}
        onSaved={() => load()}
      />
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
    <Tabs defaultValue="requests">
      <TabsList className="mb-6">
        <TabsTrigger value="requests">Story Requests</TabsTrigger>
        <TabsTrigger value="milestones">Milestones</TabsTrigger>
        <TabsTrigger value="spotlights">Spotlights</TabsTrigger>
      </TabsList>
      <TabsContent value="requests"><StoryRequestsTab /></TabsContent>
      <TabsContent value="milestones"><MilestonesTab /></TabsContent>
      <TabsContent value="spotlights"><SpotlightsTab /></TabsContent>
    </Tabs>
  </div>
);

export default AdminMilestones;
