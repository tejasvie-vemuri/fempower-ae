import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Check, X, Trash2, Loader2, Quote, MessageSquareWarning, Mail, Send, RotateCcw, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Status = "pending" | "approved" | "rejected" | "changes_requested";

type Row = {
  id: string;
  user_id: string;
  quote: string;
  status: Status;
  feedback_note: string | null;
  created_at: string;
  author?: { name: string | null; photo_url: string | null; email: string | null } | null;
};

type InviteRecord = {
  invited_at: string;
  last_sent_at: string;
  send_count: number;
};

type MemberLite = {
  user_id: string;
  name: string | null;
  photo_url: string | null;
  email: string | null;
  hasTestimonial: boolean;
  invite: InviteRecord | null;
};

const TABS: Array<Status | "all"> = ["pending", "changes_requested", "approved", "rejected"];

const STATUS_STYLE: Record<Status, string> = {
  pending: "bg-muted text-foreground",
  changes_requested: "bg-amber-100 text-amber-900",
  approved: "bg-green-100 text-green-900",
  rejected: "bg-destructive/10 text-destructive",
};

const AdminTestimonials = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [members, setMembers] = useState<MemberLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Status>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Feedback dialog (reject / request changes)
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState<{ row: Row; decision: "rejected" | "changes_requested" } | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");

  // Request-from-member dialog
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestMember, setRequestMember] = useState<MemberLite | null>(null);
  const [requestNote, setRequestNote] = useState("");
  const [requestSending, setRequestSending] = useState(false);
  const [memberFilter, setMemberFilter] = useState("");
  const [memberScope, setMemberScope] = useState<"awaiting" | "invited" | "never" | "all">("awaiting");

  const load = async () => {
    setLoading(true);
    const [{ data: t, error: tErr }, { data: mp }, { data: profs }, { data: invites }] = await Promise.all([
      supabase
        .from("member_testimonials")
        .select("id, user_id, quote, status, feedback_note, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("member_profiles")
        .select("user_id, name, photo_url, status")
        .in("status", ["approved", "hidden"]),
      supabase.from("profiles").select("user_id, email"),
      supabase.from("testimonial_invites").select("user_id, invited_at, last_sent_at, send_count"),
    ]);
    if (tErr) {
      toast({ title: "Failed to load", description: tErr.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const emailMap = new Map((profs ?? []).map((p: any) => [p.user_id, p.email]));
    const profMap = new Map((mp ?? []).map((p: any) => [p.user_id, p]));
    const inviteMap = new Map((invites ?? []).map((i: any) => [i.user_id, {
      invited_at: i.invited_at, last_sent_at: i.last_sent_at, send_count: i.send_count,
    } as InviteRecord]));

    const list = ((t ?? []) as Row[]).map((r) => {
      const p: any = profMap.get(r.user_id);
      r.author = p ? { name: p.name, photo_url: p.photo_url, email: emailMap.get(r.user_id) ?? null } : { name: null, photo_url: null, email: emailMap.get(r.user_id) ?? null };
      return r;
    });

    const withTestimonial = new Set(list.map((r) => r.user_id));
    const memberList: MemberLite[] = (mp ?? []).map((p: any) => ({
      user_id: p.user_id,
      name: p.name,
      photo_url: p.photo_url,
      email: emailMap.get(p.user_id) ?? null,
      hasTestimonial: withTestimonial.has(p.user_id),
      invite: inviteMap.get(p.user_id) ?? null,
    }));

    setRows(list);
    setMembers(memberList);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const sendFeedbackEmail = async (row: Row, decision: Status, feedbackNoteText: string | null) => {
    if (!row.author?.email) return;
    const { error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "testimonial-feedback",
        recipientEmail: row.author.email,
        idempotencyKey: `testimonial-${row.id}-${decision}-${Date.now()}`,
        templateData: {
          name: row.author?.name ?? "",
          decision,
          quote: row.quote,
          feedbackNote: feedbackNoteText ?? undefined,
          siteUrl: window.location.origin,
        },
      },
    });
    if (error) {
      toast({ title: "Notification email failed", description: error.message, variant: "destructive" });
    }
  };

  const approve = async (row: Row) => {
    setBusyId(row.id);
    const { error } = await supabase
      .from("member_testimonials")
      .update({ status: "approved", approved_at: new Date().toISOString(), approved_by: user?.id ?? null, feedback_note: null })
      .eq("id", row.id);
    if (error) {
      setBusyId(null);
      return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }
    await sendFeedbackEmail(row, "approved", null);
    setBusyId(null);
    toast({ title: "Approved & member notified" });
    load();
  };

  const openFeedback = (row: Row, decision: "rejected" | "changes_requested") => {
    setFeedbackTarget({ row, decision });
    setFeedbackNote(row.feedback_note ?? "");
    setFeedbackOpen(true);
  };

  const submitFeedback = async () => {
    if (!feedbackTarget) return;
    const note = feedbackNote.trim();
    if (note.length < 5) {
      return toast({ title: "Please add a short note", description: "Members need context for the change.", variant: "destructive" });
    }
    const { row, decision } = feedbackTarget;
    setBusyId(row.id);
    const { error } = await supabase
      .from("member_testimonials")
      .update({ status: decision, feedback_note: note, approved_at: null, approved_by: null })
      .eq("id", row.id);
    if (error) {
      setBusyId(null);
      return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }
    await sendFeedbackEmail(row, decision, note);
    setBusyId(null);
    setFeedbackOpen(false);
    setFeedbackTarget(null);
    toast({ title: decision === "rejected" ? "Rejected & member notified" : "Changes requested & member notified" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    setBusyId(id);
    const { error } = await supabase.from("member_testimonials").delete().eq("id", id);
    setBusyId(null);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    toast({ title: "Deleted" });
    load();
  };

  const openRequest = (m: MemberLite) => {
    setRequestMember(m);
    setRequestNote("");
    setRequestOpen(true);
  };

  const sendInviteEmail = async (member: MemberLite, note: string, isResend: boolean) => {
    if (!member.email) {
      toast({ title: "No email on file", description: "This member has no email address.", variant: "destructive" });
      return false;
    }
    const stamp = new Date().toISOString();
    const { error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "testimonial-request",
        recipientEmail: member.email,
        idempotencyKey: `testimonial-request-${member.user_id}-${stamp}`,
        templateData: {
          name: member.name ?? "",
          personalNote: note.trim() || undefined,
          siteUrl: window.location.origin,
          isReminder: isResend,
        },
      },
    });
    if (error) {
      toast({ title: "Couldn't send", description: error.message, variant: "destructive" });
      return false;
    }
    const prev = member.invite;
    const { error: upsertErr } = await supabase
      .from("testimonial_invites")
      .upsert({
        user_id: member.user_id,
        invited_by: user?.id ?? null,
        invited_at: prev?.invited_at ?? stamp,
        last_sent_at: stamp,
        send_count: (prev?.send_count ?? 0) + 1,
        last_note: note.trim() || null,
      }, { onConflict: "user_id" });
    if (upsertErr) {
      toast({ title: "Sent, but couldn't log invite", description: upsertErr.message, variant: "destructive" });
    }
    return true;
  };

  const sendRequest = async () => {
    if (!requestMember) return;
    setRequestSending(true);
    const ok = await sendInviteEmail(requestMember, requestNote, !!requestMember.invite);
    setRequestSending(false);
    if (!ok) return;
    toast({ title: requestMember.invite ? "Reminder sent 💌" : "Invitation sent 💌" });
    setRequestOpen(false);
    setRequestMember(null);
    load();
  };

  const quickResend = async (m: MemberLite) => {
    if (!confirm(`Resend testimonial request to ${m.name || "this member"}?`)) return;
    const ok = await sendInviteEmail(m, "", true);
    if (ok) {
      toast({ title: "Reminder sent 💌" });
      load();
    }
  };

  const visible = rows.filter((r) => r.status === tab);
  const counts = useMemo(() => {
    const c: Record<Status, number> = { pending: 0, approved: 0, rejected: 0, changes_requested: 0 };
    rows.forEach((r) => { c[r.status]++; });
    return c;
  }, [rows]);

  const scopeCounts = useMemo(() => ({
    awaiting: members.filter((m) => m.invite && !m.hasTestimonial).length,
    invited: members.filter((m) => m.invite).length,
    never: members.filter((m) => !m.invite && !m.hasTestimonial).length,
    all: members.length,
  }), [members]);

  const filteredMembers = useMemo(() => {
    const q = memberFilter.trim().toLowerCase();
    return members
      .filter((m) => {
        if (memberScope === "awaiting") return m.invite && !m.hasTestimonial;
        if (memberScope === "invited") return !!m.invite;
        if (memberScope === "never") return !m.invite && !m.hasTestimonial;
        return true;
      })
      .filter((m) => !q || (m.name ?? "").toLowerCase().includes(q) || (m.email ?? "").toLowerCase().includes(q))
      .sort((a, b) => {
        const at = a.invite?.last_sent_at ?? "";
        const bt = b.invite?.last_sent_at ?? "";
        return bt.localeCompare(at);
      })
      .slice(0, 100);
  }, [members, memberFilter, memberScope]);

  const fmtDate = (iso?: string | null) => iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";
  const daysSince = (iso?: string | null) => {
    if (!iso) return null;
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (d <= 0) return "today";
    if (d === 1) return "1 day ago";
    return `${d} days ago`;
  };

  return (
    <>
      <Header />
      <main className="container max-w-5xl py-10">
        <h1 className="font-heading text-3xl font-semibold mb-1">Member Testimonials</h1>
        <p className="text-sm text-muted-foreground mb-6">Approve, reject with a reason, request changes, or invite members to share their story.</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((t) => (
            <Button key={t} variant={tab === t ? "default" : "outline"} size="sm" onClick={() => setTab(t as Status)} className="capitalize">
              {t.replace("_", " ")} <span className="ml-1 text-xs opacity-70">({counts[t as Status]})</span>
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="animate-spin" /></div>
        ) : visible.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No {tab.replace("_", " ")} testimonials.</p>
        ) : (
          <div className="space-y-4">
            {visible.map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {r.author?.photo_url ? (
                      <img src={r.author.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs">
                        {(r.author?.name || "?").slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.author?.name || "Unknown member"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${STATUS_STYLE[r.status]}`}>{r.status.replace("_", " ")}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Quote size={18} className="text-accent shrink-0 mt-1" />
                  <p className="text-sm italic text-foreground leading-relaxed">"{r.quote}"</p>
                </div>
                {r.feedback_note && (
                  <p className="mt-2 text-xs bg-muted rounded-md px-3 py-2 text-muted-foreground">
                    <span className="font-medium">Team note:</span> {r.feedback_note}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2 justify-end">
                  {r.status !== "approved" && (
                    <Button size="sm" onClick={() => approve(r)} disabled={busyId === r.id}>
                      <Check size={14} className="mr-1" /> Approve
                    </Button>
                  )}
                  {r.status !== "changes_requested" && (
                    <Button size="sm" variant="outline" onClick={() => openFeedback(r, "changes_requested")} disabled={busyId === r.id}>
                      <MessageSquareWarning size={14} className="mr-1" /> Request changes
                    </Button>
                  )}
                  {r.status !== "rejected" && (
                    <Button size="sm" variant="outline" onClick={() => openFeedback(r, "rejected")} disabled={busyId === r.id}>
                      <X size={14} className="mr-1" /> Reject
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(r.id)} disabled={busyId === r.id} className="text-destructive">
                    <Trash2 size={14} className="mr-1" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Request testimonials from members */}
        <section className="mt-12 border-t pt-8">
          <div className="flex items-center gap-2 mb-2">
            <Mail size={18} className="text-accent" />
            <h2 className="font-heading text-2xl font-semibold">Ask members for a testimonial</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Send a warm invitation email. Members who already submitted are marked so you can focus on new voices.</p>
          <Input
            placeholder="Search by name or email…"
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            className="mb-4 max-w-sm"
          />
          <div className="grid sm:grid-cols-2 gap-3">
            {filteredMembers.map((m) => (
              <div key={m.user_id} className="flex items-center gap-3 border border-border rounded-lg p-3 bg-card">
                {m.photo_url ? (
                  <img src={m.photo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs">{(m.name || "?").slice(0,1)}</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.name || "Unnamed member"}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.email || "no email on file"}</p>
                </div>
                {m.hasTestimonial ? (
                  <span className="text-xs text-muted-foreground">Submitted</span>
                ) : (
                  <Button size="sm" variant="outline" disabled={!m.email} onClick={() => openRequest(m)}>
                    <Send size={14} className="mr-1" /> Invite
                  </Button>
                )}
              </div>
            ))}
            {filteredMembers.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full py-6 text-center">No members match that search.</p>
            )}
          </div>
        </section>
      </main>
      <Footer />

      {/* Reject / changes-requested dialog */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">
              {feedbackTarget?.decision === "rejected" ? "Reject testimonial" : "Request changes"}
            </DialogTitle>
            <DialogDescription>
              This note will be emailed to the member and shown when they open their testimonial to edit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="feedback">Message to the member</Label>
            <Textarea
              id="feedback"
              rows={5}
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value.slice(0, 600))}
              placeholder={feedbackTarget?.decision === "rejected"
                ? "Warm, honest reason (e.g. not suitable for the homepage right now)…"
                : "e.g. Could you add a specific moment or event? Keep it under 3 sentences."}
            />
            <p className="text-xs text-muted-foreground text-right">{600 - feedbackNote.length} left</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFeedbackOpen(false)}>Cancel</Button>
            <Button onClick={submitFeedback} disabled={busyId === feedbackTarget?.row.id}>
              {busyId === feedbackTarget?.row.id && <Loader2 className="animate-spin mr-2" size={14} />}
              Send & save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request from member dialog */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Invite {requestMember?.name || "member"} to share</DialogTitle>
            <DialogDescription>
              Sends a warm email with a one-click link to share a testimonial. Add an optional personal note.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="note">Personal note (optional)</Label>
            <Textarea
              id="note"
              rows={4}
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value.slice(0, 400))}
              placeholder="Loved seeing you at the last walk — would you share a few words?"
            />
            <p className="text-xs text-muted-foreground">Sending to: <span className="font-medium">{requestMember?.email}</span></p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRequestOpen(false)} disabled={requestSending}>Cancel</Button>
            <Button onClick={sendRequest} disabled={requestSending || !requestMember?.email}>
              {requestSending && <Loader2 className="animate-spin mr-2" size={14} />}
              <Send size={14} className="mr-1" /> Send invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminTestimonials;
