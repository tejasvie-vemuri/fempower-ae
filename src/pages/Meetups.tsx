import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Coffee, MapPin, Clock, Users, Plus, Flag, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { EMIRATES, MEETUP_REPORT_REASONS, hostDisplayName, formatMeetupWhen, type Meetup } from "@/lib/meetups";
import { MemberAvatar } from "@/components/directory/MemberAvatar";

type EnrichedMeetup = Meetup & {
  host?: { name: string | null; photo_url: string | null };
  rsvp_count: number;
  attendees: Array<{ user_id: string; name: string | null; photo_url: string | null }>;
  i_rsvped: boolean;
};

const Meetups = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [memberStatus, setMemberStatus] = useState<string | null>(null);
  const [memberName, setMemberName] = useState("");
  const [meetups, setMeetups] = useState<EnrichedMeetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEmirate, setFilterEmirate] = useState<string>("all");
  const [filterWindow, setFilterWindow] = useState<string>("week");

  const [composerOpen, setComposerOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    place: "",
    emirate: "",
    date: "",
    time: "",
    capacity: "",
    note: "",
    host_visibility: "full" as "full" | "first_name",
  });
  const [submitting, setSubmitting] = useState(false);

  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("unsafe");
  const [reportNotes, setReportNotes] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("member_profiles")
        .select("status, name")
        .eq("user_id", user.id)
        .maybeSingle();
      setMemberStatus(data?.status ?? null);
      setMemberName(data?.name ?? "");
    })();
  }, [user]);

  const load = async () => {
    if (!user || memberStatus !== "approved") return;
    setLoading(true);
    // Hide meetups whose start time was more than 2 hours ago
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    let q = (supabase as any)
      .from("meetups")
      .select("*")
      .eq("status", "published")
      .gte("starts_at", cutoff)
      .order("starts_at", { ascending: true })
      .limit(100);
    if (filterEmirate !== "all") q = q.eq("emirate", filterEmirate);
    if (filterWindow === "today") {
      const end = new Date(); end.setHours(23, 59, 59, 999);
      q = q.lte("starts_at", end.toISOString());
    } else if (filterWindow === "week") {
      const end = new Date(); end.setDate(end.getDate() + 7);
      q = q.lte("starts_at", end.toISOString());
    }
    const { data: rows } = await q;
    const list: Meetup[] = rows ?? [];

    if (!list.length) {
      setMeetups([]); setLoading(false); return;
    }

    const hostIds = Array.from(new Set(list.map((m) => m.host_id))) as string[];
    const ids = list.map((m) => m.id);
    const [{ data: hosts }, { data: rsvps }] = await Promise.all([
      supabase.from("member_profiles").select("user_id, name, photo_url").in("user_id", hostIds),
      (supabase as any).from("meetup_rsvps").select("meetup_id, user_id").in("meetup_id", ids),
    ]);

    const hostMap: Record<string, any> = {};
    (hosts ?? []).forEach((h: any) => { hostMap[h.user_id] = h; });

    const rsvpUserIds: string[] = Array.from(new Set((rsvps ?? []).map((r: any) => r.user_id as string)));
    let attendeeMap: Record<string, any> = {};
    if (rsvpUserIds.length) {
      const { data: people } = await supabase
        .from("member_profiles").select("user_id, name, photo_url").in("user_id", rsvpUserIds);
      (people ?? []).forEach((p: any) => { attendeeMap[p.user_id] = p; });
    }

    const enriched: EnrichedMeetup[] = list.map((m) => {
      const ours = (rsvps ?? []).filter((r: any) => r.meetup_id === m.id);
      return {
        ...m,
        host: hostMap[m.host_id],
        rsvp_count: ours.length,
        attendees: ours.slice(0, 6).map((r: any) => ({
          user_id: r.user_id,
          name: attendeeMap[r.user_id]?.name ?? null,
          photo_url: attendeeMap[r.user_id]?.photo_url ?? null,
        })),
        i_rsvped: ours.some((r: any) => r.user_id === user.id),
      };
    });
    setMeetups(enriched);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user, memberStatus, filterEmirate, filterWindow]);

  const toggleRsvp = async (m: EnrichedMeetup) => {
    if (!user) return;
    if (m.i_rsvped) {
      await (supabase as any).from("meetup_rsvps").delete().match({ meetup_id: m.id, user_id: user.id });
    } else {
      if (m.capacity && m.rsvp_count >= m.capacity) {
        toast({ title: "This meetup is full.", variant: "destructive" });
        return;
      }
      const { error } = await (supabase as any).from("meetup_rsvps").insert({ meetup_id: m.id, user_id: user.id });
      if (error) { toast({ title: "Could not RSVP", description: error.message, variant: "destructive" }); return; }
    }
    load();
  };

  const submit = async () => {
    if (!user) return;
    if (!form.title.trim() || !form.place.trim() || !form.date || !form.time) {
      toast({ title: "Add a title, place, and time." });
      return;
    }
    const starts = new Date(`${form.date}T${form.time}`);
    if (isNaN(starts.getTime()) || starts.getTime() < Date.now() - 60_000) {
      toast({ title: "Pick a time in the future." });
      return;
    }
    setSubmitting(true);
    const cap = form.capacity ? parseInt(form.capacity, 10) : null;
    const { error } = await (supabase as any).from("meetups").insert({
      host_id: user.id,
      title: form.title.trim().slice(0, 120),
      place: form.place.trim().slice(0, 160),
      emirate: form.emirate || null,
      starts_at: starts.toISOString(),
      capacity: cap && cap > 0 ? cap : null,
      note: form.note.trim().slice(0, 500) || null,
      host_visibility: form.host_visibility,
    });
    setSubmitting(false);
    if (error) { toast({ title: "Couldn't create meetup", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Meetup is live ☕" });
    setComposerOpen(false);
    setForm({ title: "", place: "", emirate: "", date: "", time: "", capacity: "", note: "", host_visibility: "full" });
    load();
  };

  const cancelMeetup = async (id: string) => {
    if (!confirm("Cancel this meetup? Attendees will no longer see it.")) return;
    const { error } = await (supabase as any).from("meetups").update({ status: "cancelled" }).eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    load();
  };

  const submitReport = async () => {
    if (!reportTarget || !user) return;
    const { error } = await (supabase as any).from("meetup_reports").insert({
      meetup_id: reportTarget,
      reporter_id: user.id,
      reason: reportReason,
      notes: reportNotes || null,
    });
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Thank you — admins will review." });
    setReportTarget(null); setReportReason("unsafe"); setReportNotes("");
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }
  if (!user) {
    const redirect = encodeURIComponent("/meetups");
    return (
      <>
        <Header />
        <main className="pt-28 pb-20 min-h-screen container max-w-2xl text-center">
          <Coffee className="mx-auto text-blush-dark mb-4" />
          <h1 className="font-heading text-4xl mb-3 text-foreground">Pop-up Meetups</h1>
          <p className="text-muted-foreground font-body mb-6">Casual hangouts hosted by Fempower members. Sign in to see what's on.</p>
          <Button asChild className="bg-foreground text-primary-foreground hover:bg-foreground/90 font-body uppercase tracking-widest text-xs h-11 px-6">
            <Link to={`/auth?redirect=${redirect}`}>Sign in</Link>
          </Button>
        </main>
        <Footer />
      </>
    );
  }
  if (memberStatus && memberStatus !== "approved") {
    return (
      <>
        <Header />
        <main className="pt-28 pb-20 min-h-screen container max-w-2xl text-center">
          <Coffee className="mx-auto text-blush-dark mb-4" />
          <h1 className="font-heading text-4xl mb-3 text-foreground">Almost there</h1>
          <p className="text-muted-foreground font-body mb-6">Pop-up Meetups are open to approved Fempower members. Your profile is <strong className="text-foreground">{memberStatus}</strong>.</p>
          <Button asChild className="bg-foreground text-primary-foreground hover:bg-foreground/90 font-body uppercase tracking-widest text-xs h-11 px-6">
            <Link to="/account/profile">Edit my profile</Link>
          </Button>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-24 pb-20 min-h-screen bg-background">
        <div className="container max-w-3xl">
          <div className="mb-6">
            <p className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark mb-2">Pop-up Meetups</p>
            <h1 className="font-heading text-3xl md:text-4xl text-foreground">Coffee, walks, study sessions — spontaneously.</h1>
            <p className="text-muted-foreground font-body mt-2">Post a casual hangout. Tap "I'm in" to RSVP. Meetups disappear after they're over.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Button onClick={() => setComposerOpen(true)} className="bg-foreground text-primary-foreground hover:bg-foreground/90 font-body uppercase tracking-widest text-xs h-10">
              <Plus size={14} className="mr-1.5" /> Post a meetup
            </Button>
            <Select value={filterWindow} onValueChange={setFilterWindow}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="all">All upcoming</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterEmirate} onValueChange={setFilterEmirate}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Emirate" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All emirates</SelectItem>
                {EMIRATES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
          ) : meetups.length === 0 ? (
            <div className="text-center py-12 font-body">
              <p className="text-muted-foreground">Nothing on the books. Be the first to post one.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {meetups.map((m) => {
                const isHost = user.id === m.host_id;
                const full = !!(m.capacity && m.rsvp_count >= m.capacity && !m.i_rsvped);
                return (
                  <article key={m.id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <MemberAvatar
                          path={m.host?.photo_url}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          fallback={<div className="w-10 h-10 rounded-full bg-blush-light flex-shrink-0 flex items-center justify-center"><Coffee size={16} className="text-blush-dark" /></div>}
                        />
                        <div className="min-w-0">
                          <h3 className="font-heading text-lg text-foreground truncate">{m.title}</h3>
                          <p className="text-xs text-muted-foreground">Hosted by {hostDisplayName(m.host?.name, m.host_visibility)}</p>
                        </div>
                      </div>
                      {m.emirate && <Badge variant="secondary" className="flex-shrink-0">{m.emirate}</Badge>}
                    </div>

                    <div className="grid gap-2 text-sm font-body text-foreground mb-3">
                      <p className="flex items-center gap-2"><MapPin size={14} className="text-muted-foreground" /> {m.place}</p>
                      <p className="flex items-center gap-2"><Clock size={14} className="text-muted-foreground" /> {formatMeetupWhen(m.starts_at)}</p>
                      <p className="flex items-center gap-2"><Users size={14} className="text-muted-foreground" /> {m.rsvp_count}{m.capacity ? ` / ${m.capacity}` : ""} going</p>
                    </div>

                    {m.note && <p className="text-sm text-muted-foreground font-body mb-3 whitespace-pre-wrap">{m.note}</p>}

                    {m.attendees.length > 0 && (
                      <div className="flex items-center gap-1 mb-3">
                        {m.attendees.map((a) => (
                          a.photo_url ? (
                            <img key={a.user_id} src={a.photo_url} alt="" title={a.name ?? ""} className="w-7 h-7 rounded-full object-cover border-2 border-card -ml-1.5 first:ml-0" />
                          ) : (
                            <div key={a.user_id} title={a.name ?? ""} className="w-7 h-7 rounded-full bg-muted border-2 border-card -ml-1.5 first:ml-0 flex items-center justify-center text-xs">{(a.name ?? "?").charAt(0)}</div>
                          )
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      {isHost ? (
                        <Button size="sm" variant="outline" onClick={() => cancelMeetup(m.id)}>
                          <X size={14} className="mr-1.5" /> Cancel meetup
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => toggleRsvp(m)}
                          disabled={full}
                          className={m.i_rsvped
                            ? "bg-blush-light text-foreground hover:bg-blush-light/80 border border-blush-dark/40"
                            : "bg-foreground text-primary-foreground hover:bg-foreground/90"}
                        >
                          {m.i_rsvped ? "You're in ✓" : full ? "Full" : "I'm in"}
                        </Button>
                      )}
                      <button onClick={() => setReportTarget(m.id)} className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                        <Flag size={12} /> Report
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Post a pop-up meetup</DialogTitle>
            <DialogDescription>Quick and casual. Other approved members will see this and can tap "I'm in".</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs uppercase tracking-widest">Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Coffee in DIFC" maxLength={120} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest">Place</Label>
              <Input value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} placeholder="Arabian Tea House, DIFC" maxLength={160} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-widest">Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest">Time</Label>
                <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-widest">Emirate</Label>
                <Select value={form.emirate} onValueChange={(v) => setForm({ ...form, emirate: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    {EMIRATES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest">Capacity</Label>
                <Input type="number" min={1} max={50} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="Optional" className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest">Note</Label>
              <Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Anything else (dress code, vibe, parking)?" rows={3} maxLength={500} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest">Show as</Label>
              <Select value={form.host_visibility} onValueChange={(v) => setForm({ ...form, host_visibility: v as any })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">My full name — {memberName || "your name"}</SelectItem>
                  <SelectItem value="first_name">First name only — {(memberName || "Member").split(" ")[0]}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setComposerOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={submit} disabled={submitting} className="bg-foreground text-primary-foreground hover:bg-foreground/90">
              {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null} Post meetup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reportTarget} onOpenChange={(o) => !o && setReportTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report this meetup</DialogTitle>
            <DialogDescription>Admins review every report.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={reportReason} onValueChange={setReportReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MEETUP_REPORT_REASONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea value={reportNotes} onChange={(e) => setReportNotes(e.target.value)} placeholder="Anything we should know? (optional)" rows={3} maxLength={500} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReportTarget(null)}>Cancel</Button>
            <Button onClick={submitReport} className="bg-foreground text-primary-foreground hover:bg-foreground/90">Submit report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </>
  );
};

export default Meetups;
