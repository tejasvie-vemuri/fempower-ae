import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check, EyeOff, Trash2, AlertTriangle, Shield, ShieldOff, UserX, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { topicLabel } from "@/lib/circle";

type Queue = "pending" | "flagged" | "reported" | "all";

type AdminPost = {
  id: string;
  user_id: string;
  topic_tag: string;
  body: string;
  is_anonymous: boolean;
  status: string;
  risk_level: string;
  flagged_keywords: string[];
  published_at: string | null;
  created_at: string;
  author?: { name: string | null; email?: string | null; is_trusted_poster?: boolean };
};

type Report = {
  id: string;
  target_type: string;
  target_id: string;
  reporter_id: string;
  reason: string;
  notes: string | null;
  status: string;
  created_at: string;
};

const AdminCircle = () => {
  const { toast } = useToast();
  const [queue, setQueue] = useState<Queue>("flagged");
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const load = async () => {
    setLoading(true);

    // Counts
    const { data: allPosts } = await (supabase as any)
      .from("circle_posts")
      .select("id, status, risk_level");
    const c: Record<string, number> = { pending: 0, flagged: 0, all: 0 };
    (allPosts ?? []).forEach((p: any) => {
      c.all += 1;
      if (p.status === "pending") c.pending += 1;
      if (p.risk_level === "high" && p.status !== "deleted") c.flagged += 1;
    });
    const { count: openReports } = await (supabase as any)
      .from("circle_reports").select("id", { count: "exact", head: true }).eq("status", "open");
    c.reported = openReports ?? 0;
    setCounts(c);

    if (queue === "reported") {
      const { data: r } = await (supabase as any)
        .from("circle_reports").select("*").eq("status", "open").order("created_at", { ascending: false });
      setReports(r ?? []);
      setPosts([]);
    } else {
      let q = (supabase as any).from("circle_posts").select("*").order("created_at", { ascending: false }).limit(200);
      if (queue === "pending") q = q.eq("status", "pending");
      if (queue === "flagged") q = q.eq("risk_level", "high").neq("status", "deleted");
      const { data: pRows } = await q;
      const rows: AdminPost[] = pRows ?? [];
      const userIds = Array.from(new Set(rows.map((p) => p.user_id))) as string[];
      let authorMap: Record<string, any> = {};
      if (userIds.length) {
        const { data: members } = await supabase
          .from("member_profiles")
          .select("user_id, name, is_trusted_poster")
          .in("user_id", userIds);
        (members ?? []).forEach((m: any) => { authorMap[m.user_id] = m; });
      }
      setPosts(rows.map((p) => ({ ...p, author: authorMap[p.user_id] })));
      setReports([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [queue]);

  const updatePost = async (id: string, patch: Record<string, any>) => {
    if (patch.status === "published" && !patch.published_at) patch.published_at = new Date().toISOString();
    const { error } = await (supabase as any).from("circle_posts").update(patch).eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Updated" });
    load();
  };

  const setTrusted = async (userId: string, value: boolean) => {
    const { error } = await supabase.from("member_profiles").update({ is_trusted_poster: value }).eq("user_id", userId);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: value ? "Marked trusted" : "Removed trusted" });
    load();
  };

  const banUser = async (userId: string) => {
    if (!confirm("Ban this member from Ask the Circle?")) return;
    const { error } = await (supabase as any).from("circle_bans").insert({ user_id: userId, reason: "Admin action" });
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Banned from the Circle" });
  };

  const resolveReport = async (id: string, status: "reviewed" | "dismissed") => {
    const { error } = await (supabase as any).from("circle_reports").update({ status }).eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    load();
  };

  return (
    <>
      <Header />
      <main className="pt-24 pb-20 min-h-screen bg-background">
        <div className="container max-w-5xl">
          <h1 className="font-heading text-3xl md:text-4xl text-primary mb-2">Ask the Circle · Moderation</h1>
          <p className="text-sm text-muted-foreground mb-6">Identities are always visible here. Members never see real identities behind anonymous posts.</p>

          <div className="mb-6 max-w-xs">
            <Select value={queue} onValueChange={(v) => setQueue(v as Queue)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="flagged">⚠ Crisis-flagged ({counts.flagged ?? 0})</SelectItem>
                <SelectItem value="pending">Pending review ({counts.pending ?? 0})</SelectItem>
                <SelectItem value="reported">Reported ({counts.reported ?? 0})</SelectItem>
                <SelectItem value="all">All posts ({counts.all ?? 0})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
          ) : queue === "reported" ? (
            reports.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No open reports.</p>
            ) : (
              <div className="space-y-3">
                {reports.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Flag size={14} className="text-blush-dark" />
                      <Badge variant="secondary">{r.reason}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm font-body text-foreground">Target: <code className="text-xs">{r.target_type}:{r.target_id}</code></p>
                    {r.notes && <p className="text-sm mt-2 font-body text-muted-foreground">"{r.notes}"</p>}
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => resolveReport(r.id, "reviewed")}>Mark reviewed</Button>
                      <Button size="sm" variant="ghost" onClick={() => resolveReport(r.id, "dismissed")}>Dismiss</Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : posts.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Nothing in this queue.</p>
          ) : (
            <div className="space-y-4">
              {posts.map((p) => (
                <article key={p.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">{topicLabel(p.topic_tag)}</Badge>
                      <Badge variant={p.status === "published" ? "default" : "outline"}>{p.status}</Badge>
                      {p.risk_level === "high" && (
                        <Badge variant="destructive" className="gap-1"><AlertTriangle size={12} /> Crisis</Badge>
                      )}
                      {p.is_anonymous && <Badge variant="outline">anonymous to members</Badge>}
                      {p.author?.is_trusted_poster && <Badge className="bg-blush-dark text-primary-foreground">trusted</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 font-body">
                    by <span className="font-medium text-foreground">{p.author?.name ?? "(unknown)"}</span>
                  </p>
                  <p className="font-body text-foreground whitespace-pre-wrap leading-relaxed">{p.body}</p>
                  {p.flagged_keywords?.length > 0 && (
                    <p className="mt-2 text-xs text-destructive font-body">Flagged keywords: {p.flagged_keywords.join(", ")}</p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {p.status !== "published" && (
                      <Button size="sm" onClick={() => updatePost(p.id, { status: "published" })} className="bg-foreground text-primary-foreground hover:bg-foreground/90"><Check size={14} className="mr-1"/> Approve</Button>
                    )}
                    {p.status !== "hidden" && (
                      <Button size="sm" variant="outline" onClick={() => updatePost(p.id, { status: "hidden" })}><EyeOff size={14} className="mr-1"/> Hide</Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => updatePost(p.id, { status: "deleted" })}><Trash2 size={14} className="mr-1"/> Delete</Button>
                    {p.author?.is_trusted_poster ? (
                      <Button size="sm" variant="ghost" onClick={() => setTrusted(p.user_id, false)}><ShieldOff size={14} className="mr-1"/> Untrust</Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setTrusted(p.user_id, true)}><Shield size={14} className="mr-1"/> Trust</Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => banUser(p.user_id)}><UserX size={14} className="mr-1"/> Ban</Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default AdminCircle;
