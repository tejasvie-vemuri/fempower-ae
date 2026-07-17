import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check, X, EyeOff, Eye, Linkedin, Instagram, Globe, Trash2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { MemberProfile } from "@/lib/memberProfile";
import { MemberAvatar } from "@/components/directory/MemberAvatar";

const STATUSES: Array<MemberProfile["status"] | "all"> = ["pending", "approved", "hidden", "rejected", "all"];
type IntroFilter = "all" | "posted" | "nudged" | "not-nudged";
type SortBy = "created-desc" | "created-asc" | "nudge-desc" | "nudge-asc";

const AdminMembers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<MemberProfile["status"] | "all">("pending");
  const [introFilter, setIntroFilter] = useState<IntroFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("created-desc");
  const [search, setSearch] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [emails, setEmails] = useState<Record<string, string>>({});

  const introCategory = (m: MemberProfile): IntroFilter => {
    if (m.status !== "approved") return "all";
    if (m.intro_posted_at) return "posted";
    if (m.intro_nudge_email_sent_at) return "nudged";
    return "not-nudged";
  };

  const displayMembers = useMemo(() => {
    let rows = [...members];
    if (introFilter !== "all") {
      rows = rows.filter((m) => m.status === "approved" && introCategory(m) === introFilter);
    }
    rows.sort((a, b) => {
      switch (sortBy) {
        case "created-asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "nudge-desc":
          return (b.intro_nudge_email_sent_at ? new Date(b.intro_nudge_email_sent_at).getTime() : 0) -
                 (a.intro_nudge_email_sent_at ? new Date(a.intro_nudge_email_sent_at).getTime() : 0);
        case "nudge-asc":
          return (a.intro_nudge_email_sent_at ? new Date(a.intro_nudge_email_sent_at).getTime() : 0) -
                 (b.intro_nudge_email_sent_at ? new Date(b.intro_nudge_email_sent_at).getTime() : 0);
        case "created-desc":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return rows;
  }, [members, introFilter, sortBy]);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("member_profiles").select("*").order("created_at", { ascending: false });
    if (status !== "all") q = q.eq("status", status);
    if (search.trim()) {
      const t = `%${search.trim()}%`;
      q = q.or(`name.ilike.${t},role.ilike.${t},company.ilike.${t}`);
    }
    const { data } = await q.limit(200);
    const rows = (data ?? []) as MemberProfile[];
    setMembers(rows);

    const userIds = rows.map((r) => r.user_id).filter(Boolean);
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, email")
        .in("user_id", userIds);
      const map: Record<string, string> = {};
      (profs ?? []).forEach((p: any) => { if (p.email) map[p.user_id] = p.email; });
      setEmails(map);
    } else {
      setEmails({});
    }

    const { data: all } = await supabase.from("member_profiles").select("status");
    const c: Record<string, number> = { pending: 0, approved: 0, hidden: 0, rejected: 0 };
    (all ?? []).forEach((r: any) => { c[r.status] = (c[r.status] || 0) + 1; });
    setCounts(c);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status, search]);
  useEffect(() => {
    if (status !== "approved" && status !== "all" && introFilter !== "all") {
      setIntroFilter("all");
    }
  }, [status, introFilter]);

  const updateStatus = async (id: string, newStatus: MemberProfile["status"]) => {
    const member = members.find((m) => m.id === id);
    const wasNotApproved = member?.status !== "approved";
    const patch: any = { status: newStatus };
    if (newStatus === "approved") { patch.approved_at = new Date().toISOString(); patch.approved_by = user?.id; }
    const { error } = await supabase.from("member_profiles").update(patch).eq("id", id);
    if (error) { toast({ title: "Update failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Marked as ${newStatus}` });

    // Send membership-approved email on first approval
    if (newStatus === "approved" && wasNotApproved && member?.user_id) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("user_id", member.user_id)
          .maybeSingle();
        if (profile?.email) {
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "membership-approved",
              recipientEmail: profile.email,
              idempotencyKey: `membership-approved-${member.id}`,
              templateData: { name: member.name, siteUrl: window.location.origin },
            },
          });
        }
      } catch (e) {
        console.warn("Failed to send membership-approved email", e);
      }
    }

    load();
  };

  const deleteMember = async (m: MemberProfile) => {
    if (!m.user_id) {
      toast({ title: "Cannot delete", description: "Missing user id", variant: "destructive" });
      return;
    }
    const { error } = await supabase.functions.invoke("admin-delete-member", {
      body: { user_id: m.user_id },
    });
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Member deleted", description: `${m.name || "User"} has been removed.` });
    load();
  };

  return (
    <>
      <Header />
      <main className="pt-24 pb-20 min-h-screen bg-background">
        <div className="container max-w-6xl">
          <h1 className="font-heading text-3xl md:text-4xl text-primary mb-2">Member Directory · Admin</h1>
          <p className="text-sm text-muted-foreground mb-6">Review and moderate community profiles.</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {STATUSES.map(s => {
              const active = status === s;
              const label = s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1);
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-4 py-2 rounded-full text-sm font-body border transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:border-primary/40"
                  }`}
                >
                  {label}
                  {s !== "all" && (
                    <span className={`ml-1.5 text-xs ${active ? "opacity-80" : "text-muted-foreground"}`}>
                      ({counts[s] ?? 0})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="md:w-72" />
            <Select value={introFilter} onValueChange={(v) => setIntroFilter(v as IntroFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Intro status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All intros</SelectItem>
                <SelectItem value="posted">Intro posted</SelectItem>
                <SelectItem value="nudged">Nudged, no intro</SelectItem>
                <SelectItem value="not-nudged">Not nudged</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created-desc">Newest members</SelectItem>
                <SelectItem value="created-asc">Oldest members</SelectItem>
                <SelectItem value="nudge-desc">Last nudge: newest</SelectItem>
                <SelectItem value="nudge-asc">Last nudge: oldest</SelectItem>
              </SelectContent>
            </Select>
            {(introFilter !== "all" || sortBy !== "created-desc") && (
              <button
                onClick={() => { setIntroFilter("all"); setSortBy("created-desc"); }}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Reset filters
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
          ) : displayMembers.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No members found.</p>
          ) : (
            <div className="space-y-3">
              {displayMembers.map(m => (
                <div key={m.id} className="bg-card border rounded-lg p-4 flex flex-col md:flex-row gap-4 md:items-center">
                  <div className="h-14 w-14 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                    <MemberAvatar path={m.photo_url} alt={m.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-heading text-lg">{m.name || "(no name)"}</h3>
                      <Badge variant={m.status === "approved" ? "default" : "outline"}>{m.status}</Badge>
                      {m.status === "approved" && (
                        m.intro_posted_at ? (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                            title={`Posted ${new Date(m.intro_posted_at).toLocaleString()}`}
                          >
                            Intro posted · {new Date(m.intro_posted_at).toLocaleDateString()}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-amber-400 text-amber-800"
                            title={
                              m.intro_nudge_email_sent_at
                                ? `Last nudge sent ${new Date(m.intro_nudge_email_sent_at).toLocaleString()}`
                                : "No nudge sent yet"
                            }
                          >
                            {m.intro_nudge_email_sent_at
                              ? `No intro · nudged ${new Date(m.intro_nudge_email_sent_at).toLocaleDateString()}`
                              : "No intro · not nudged"}
                          </Badge>
                        )
                      )}
                      {m.industry && <Badge variant="secondary">{m.industry}</Badge>}
                    </div>

                    <p className="text-sm text-muted-foreground">{[m.role, m.company, m.city].filter(Boolean).join(" · ") || "—"}</p>
                    {emails[m.user_id] && (
                      <a href={`mailto:${emails[m.user_id]}`} className="text-xs text-blush-dark hover:underline break-all">
                        {emails[m.user_id]}
                      </a>
                    )}
                    {m.bio && <p className="text-sm mt-1 line-clamp-2">{m.bio}</p>}
                    <div className="flex gap-3 mt-2 text-muted-foreground">
                      {m.linkedin_url && <a href={m.linkedin_url} target="_blank" rel="noreferrer"><Linkedin size={14} /></a>}
                      {m.instagram_url && <a href={m.instagram_url} target="_blank" rel="noreferrer"><Instagram size={14} /></a>}
                      {m.website_url && <a href={m.website_url} target="_blank" rel="noreferrer"><Globe size={14} /></a>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {m.status !== "approved" && (
                      <Button size="sm" onClick={() => updateStatus(m.id, "approved")}><Check size={14} className="mr-1" />Approve</Button>
                    )}
                    {m.status === "approved" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(m.id, "hidden")}><EyeOff size={14} className="mr-1" />Hide</Button>
                    )}
                    {m.status === "hidden" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(m.id, "approved")}><Eye size={14} className="mr-1" />Unhide</Button>
                    )}
                    {m.status !== "rejected" && (
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(m.id, "rejected")}><X size={14} className="mr-1" />Reject</Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                          <Trash2 size={14} className="mr-1" />Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {m.name || "this member"}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This permanently removes the user's account, profile, and member record. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMember(m)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete permanently
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default AdminMembers;
