import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MemberAvatar } from "@/components/directory/MemberAvatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, MessageCircle, Flag, Send, Heart, LifeBuoy } from "lucide-react";
import BookmarkButton from "@/components/BookmarkButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CIRCLE_TOPICS, CIRCLE_REACTIONS, CRISIS_TOPICS, REPORT_REASONS, topicLabel, UAE_HELPLINES } from "@/lib/circle";
import CrisisBanner from "@/components/circle/CrisisBanner";

type Post = {
  id: string;
  topic_tag: string;
  body: string;
  is_anonymous: boolean;
  published_at: string | null;
  created_at: string;
  user_id: string | null;
  author_name: string | null;
  author_photo_url: string | null;
};

type Reply = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author?: { name: string | null; photo_url: string | null };
};

const Circle = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [memberStatus, setMemberStatus] = useState<string | null>(null);
  const [memberName, setMemberName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});
  const [reactions, setReactions] = useState<Record<string, Record<string, number>>>({}); // targetKey -> emoji -> count
  const [myReactions, setMyReactions] = useState<Record<string, Set<string>>>({}); // targetKey -> emoji set
  const [filterTopic, setFilterTopic] = useState<string>("all");

  // Composer state
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerTopic, setComposerTopic] = useState<string>("career");
  const [composerBody, setComposerBody] = useState("");
  const [composerAnon, setComposerAnon] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [crisisModal, setCrisisModal] = useState(false);
  const [pendingModal, setPendingModal] = useState(false);

  // Reply state
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [replySubmitting, setReplySubmitting] = useState<string | null>(null);

  // Report state
  const [reportTarget, setReportTarget] = useState<{ type: "post" | "reply"; id: string } | null>(null);
  const [reportReason, setReportReason] = useState("harmful");
  const [reportNotes, setReportNotes] = useState("");

  // Load my member status + name (for the "Post as [Name]" label)
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
    if (!user || (memberStatus !== "approved" && memberStatus !== "hidden")) return;
    setLoading(true);
    // Use the public-safe view so anonymous posts have no identity
    let q = (supabase as any)
      .from("circle_posts_public")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(100);
    if (filterTopic !== "all") q = q.eq("topic_tag", filterTopic);
    const { data: postRows } = await q;
    const safePosts: Post[] = (postRows ?? []) as Post[];
    setPosts(safePosts);

    if (safePosts.length === 0) {
      setReplies({}); setReactions({}); setMyReactions({});
      setLoading(false);
      return;
    }

    const postIds = safePosts.map((p) => p.id);
    const { data: replyRows } = await (supabase as any)
      .from("circle_replies")
      .select("id, post_id, user_id, body, created_at")
      .in("post_id", postIds)
      .eq("status", "published")
      .order("created_at", { ascending: true });

    // Fetch author info for replies (replies are always attributed)
    const replierIds: string[] = Array.from(new Set((replyRows ?? []).map((r: any) => r.user_id as string)));
    let authorMap: Record<string, { name: string | null; photo_url: string | null }> = {};
    if (replierIds.length) {
      const { data: members } = await supabase
        .from("member_profiles")
        .select("user_id, name, photo_url")
        .in("user_id", replierIds);
      (members ?? []).forEach((m: any) => {
        authorMap[m.user_id] = { name: m.name, photo_url: m.photo_url };
      });
    }
    const grouped: Record<string, Reply[]> = {};
    (replyRows ?? []).forEach((r: any) => {
      (grouped[r.post_id] ||= []).push({ ...r, author: authorMap[r.user_id] });
    });
    setReplies(grouped);

    // Reactions: gather for posts + replies
    const targets: Array<{ type: "post" | "reply"; id: string }> = [
      ...postIds.map((id) => ({ type: "post" as const, id })),
      ...(replyRows ?? []).map((r: any) => ({ type: "reply" as const, id: r.id })),
    ];
    if (targets.length) {
      const ids = targets.map((t) => t.id);
      const { data: rxs } = await (supabase as any)
        .from("circle_reactions")
        .select("target_type, target_id, user_id, emoji")
        .in("target_id", ids);
      const counts: Record<string, Record<string, number>> = {};
      const mine: Record<string, Set<string>> = {};
      (rxs ?? []).forEach((r: any) => {
        const key = `${r.target_type}:${r.target_id}`;
        counts[key] = counts[key] || {};
        counts[key][r.emoji] = (counts[key][r.emoji] || 0) + 1;
        if (r.user_id === user.id) {
          mine[key] = mine[key] || new Set();
          mine[key].add(r.emoji);
        }
      });
      setReactions(counts);
      setMyReactions(mine);
    } else {
      setReactions({}); setMyReactions({});
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user, memberStatus, filterTopic]);

  const submitPost = async () => {
    if (composerBody.trim().length < 10) {
      toast({ title: "Tell us a bit more", description: "Posts must be at least 10 characters." });
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("circle-submit", {
      body: { kind: "post", topic_tag: composerTopic, body: composerBody.trim(), is_anonymous: composerAnon },
    });
    setSubmitting(false);
    if (error || (data as any)?.error) {
      toast({ title: "Could not submit", description: (data as any)?.error ?? error?.message, variant: "destructive" });
      return;
    }
    const res = data as { status: string; crisis_resources?: boolean };
    setComposerOpen(false);
    setComposerBody("");
    if (res.crisis_resources) {
      setCrisisModal(true);
    } else if (res.status === "pending") {
      setPendingModal(true);
    } else {
      toast({ title: "Posted to the Circle 🤍" });
      load();
    }
  };

  const submitReply = async (postId: string) => {
    const text = (replyDraft[postId] || "").trim();
    if (text.length < 2) return;
    setReplySubmitting(postId);
    const { data, error } = await supabase.functions.invoke("circle-submit", {
      body: { kind: "reply", post_id: postId, body: text },
    });
    setReplySubmitting(null);
    if (error || (data as any)?.error) {
      toast({ title: "Could not reply", description: (data as any)?.error ?? error?.message, variant: "destructive" });
      return;
    }
    setReplyDraft((d) => ({ ...d, [postId]: "" }));
    load();
  };

  const toggleReaction = async (type: "post" | "reply", id: string, emoji: string) => {
    if (!user) return;
    const key = `${type}:${id}`;
    const has = myReactions[key]?.has(emoji);
    if (has) {
      await (supabase as any)
        .from("circle_reactions")
        .delete()
        .match({ target_type: type, target_id: id, user_id: user.id, emoji });
    } else {
      await (supabase as any)
        .from("circle_reactions")
        .insert({ target_type: type, target_id: id, user_id: user.id, emoji });
    }
    load();
  };

  const submitReport = async () => {
    if (!reportTarget || !user) return;
    const { error } = await (supabase as any).from("circle_reports").insert({
      target_type: reportTarget.type,
      target_id: reportTarget.id,
      reporter_id: user.id,
      reason: reportReason,
      notes: reportNotes || null,
    });
    if (error) {
      toast({ title: "Could not report", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Thank you — admins will review." });
    setReportTarget(null); setReportNotes(""); setReportReason("harmful");
  };

  // ===== render gating =====
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }
  if (!user) {
    const redirect = encodeURIComponent("/circle");
    return (
      <>
        <Header />
        <main className="pt-28 pb-20 min-h-screen container max-w-2xl text-center">
          <Heart className="mx-auto text-blush-dark mb-4" />
          <h1 className="font-heading text-4xl mb-3 text-foreground">Ask the Circle</h1>
          <p className="text-muted-foreground font-body mb-6">A members-only support space for the hard questions. Sign in to join.</p>
          <Button asChild className="bg-foreground text-primary-foreground hover:bg-foreground/90 font-body uppercase tracking-widest text-xs h-11 px-6">
            <Link to={`/auth?redirect=${redirect}`}>Sign in</Link>
          </Button>
        </main>
        <Footer />
      </>
    );
  }
  if (memberStatus && memberStatus !== "approved" && memberStatus !== "hidden") {
    return (
      <>
        <Header />
        <main className="pt-28 pb-20 min-h-screen container max-w-2xl text-center">
          <Heart className="mx-auto text-blush-dark mb-4" />
          <h1 className="font-heading text-4xl mb-3 text-foreground">Almost there</h1>
          <p className="text-muted-foreground font-body mb-2">Your member profile is <strong className="text-foreground">{memberStatus}</strong>.</p>
          <p className="text-muted-foreground font-body mb-6">Ask the Circle is open to approved Fempower members. Finish your profile and we'll review.</p>
          <Button asChild className="bg-foreground text-primary-foreground hover:bg-foreground/90 font-body uppercase tracking-widest text-xs h-11 px-6">
            <Link to="/account/profile">Edit my profile</Link>
          </Button>
        </main>
        <Footer />
      </>
    );
  }

  const showCrisisBanner = filterTopic === "all" || (CRISIS_TOPICS as string[]).includes(filterTopic);

  return (
    <>
      <Header />
      <main className="pt-24 pb-20 min-h-screen bg-background">
        <div className="container max-w-3xl">
          <div className="mb-6">
            <p className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark mb-2">Ask the Circle</p>
            <h1 className="font-heading text-3xl md:text-4xl text-foreground">A safe circle for the hard questions.</h1>
            <p className="text-muted-foreground font-body mt-2">Share anonymously or with your name. Replies are always from approved members and shown with their name.</p>
          </div>

          {showCrisisBanner && <div className="mb-6"><CrisisBanner /></div>}

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Button onClick={() => setComposerOpen(true)} className="bg-foreground text-primary-foreground hover:bg-foreground/90 font-body uppercase tracking-widest text-xs h-10">
              Ask the Circle
            </Button>
            <Select value={filterTopic} onValueChange={setFilterTopic}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Topic" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All topics</SelectItem>
                {CIRCLE_TOPICS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
          ) : posts.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 font-body">No posts here yet. Be the first to share.</p>
          ) : (
            <div className="space-y-5">
              {posts.map((p) => {
                const postKey = `post:${p.id}`;
                const postRx = reactions[postKey] || {};
                const myPostRx = myReactions[postKey] || new Set();
                return (
                  <article key={p.id} className="rounded-2xl border border-border bg-card p-5 md:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {p.is_anonymous ? (
                          <div className="w-8 h-8 rounded-full bg-blush-light flex items-center justify-center">
                            <Heart size={14} className="text-blush-dark" />
                          </div>
                        ) : (
                          <MemberAvatar
                            path={p.author_photo_url}
                            alt={p.author_name ?? ""}
                            className="w-8 h-8 rounded-full object-cover"
                            fallback={<div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">{(p.author_name ?? "?").charAt(0)}</div>}
                          />
                        )}
                        <div>
                          <p className="text-sm font-body font-medium text-foreground">
                            {p.is_anonymous ? "A sister in the circle" : p.author_name ?? "A member"}
                          </p>
                          <p className="text-xs text-muted-foreground">{new Date(p.published_at ?? p.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{topicLabel(p.topic_tag)}</Badge>
                    </div>

                    <p className="font-body text-foreground whitespace-pre-wrap leading-relaxed">{p.body}</p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {CIRCLE_REACTIONS.map((r) => {
                        const count = postRx[r.emoji] || 0;
                        const mine = myPostRx.has(r.emoji);
                        return (
                          <button
                            key={r.emoji}
                            onClick={() => toggleReaction("post", p.id, r.emoji)}
                            title={r.label}
                            className={`px-2.5 py-1 rounded-full border text-sm transition-colors ${mine ? "border-blush-dark bg-blush-light/50" : "border-border hover:bg-muted"}`}
                          >
                            <span>{r.emoji}</span>
                            {count > 0 && <span className="ml-1 text-xs text-muted-foreground">{count}</span>}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setReportTarget({ type: "post", id: p.id })}
                        className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Flag size={12} /> Report
                      </button>
                      <BookmarkButton itemType="circle_post" itemId={p.id} />
                    </div>

                    {/* Replies */}
                    <div className="mt-5 pt-5 border-t border-border space-y-4">
                      {(replies[p.id] || []).map((r) => {
                        const rkey = `reply:${r.id}`;
                        const rx = reactions[rkey] || {};
                        const mine = myReactions[rkey] || new Set();
                        return (
                          <div key={r.id} className="flex gap-3">
                            <MemberAvatar
                              path={r.author?.photo_url}
                              alt={r.author?.name ?? ""}
                              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                              fallback={<div className="w-7 h-7 rounded-full bg-muted flex-shrink-0 flex items-center justify-center text-xs">{(r.author?.name ?? "?").charAt(0)}</div>}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{r.author?.name ?? "A member"}</span> · {new Date(r.created_at).toLocaleString()}</p>
                              <p className="text-sm font-body text-foreground mt-1 whitespace-pre-wrap">{r.body}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                {CIRCLE_REACTIONS.map((rr) => {
                                  const c = rx[rr.emoji] || 0;
                                  const m = mine.has(rr.emoji);
                                  return (
                                    <button key={rr.emoji} onClick={() => toggleReaction("reply", r.id, rr.emoji)} title={rr.label} className={`px-2 py-0.5 rounded-full border text-xs transition-colors ${m ? "border-blush-dark bg-blush-light/50" : "border-border hover:bg-muted"}`}>
                                      {rr.emoji}{c > 0 && <span className="ml-1 text-muted-foreground">{c}</span>}
                                    </button>
                                  );
                                })}
                                <button onClick={() => setReportTarget({ type: "reply", id: r.id })} className="ml-auto text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><Flag size={10}/> Report</button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Reply composer */}
                      <div className="flex gap-2">
                        <Input
                          value={replyDraft[p.id] || ""}
                          onChange={(e) => setReplyDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                          placeholder="Reply with your name and photo…"
                          maxLength={1500}
                        />
                        <Button
                          size="icon"
                          onClick={() => submitReply(p.id)}
                          disabled={replySubmitting === p.id || (replyDraft[p.id] || "").trim().length < 2}
                          className="bg-foreground text-primary-foreground hover:bg-foreground/90"
                          aria-label="Send reply"
                        >
                          {replySubmitting === p.id ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Composer dialog */}
      <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ask the Circle</DialogTitle>
            <DialogDescription>Share what's on your mind. You can post anonymously or use your name.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-widest">Topic</Label>
              <Select value={composerTopic} onValueChange={setComposerTopic}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CIRCLE_TOPICS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest">Your message</Label>
              <Textarea
                value={composerBody}
                onChange={(e) => setComposerBody(e.target.value)}
                placeholder="Be honest. The circle is held with care."
                rows={6}
                maxLength={2000}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{composerBody.length}/2000</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label htmlFor="anon-toggle" className="text-sm font-medium text-foreground">
                  {composerAnon ? "Post anonymously" : `Post as ${memberName || "your name"}`}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">Admins can always see who posted. Other members cannot when anonymous.</p>
              </div>
              <Switch id="anon-toggle" checked={composerAnon} onCheckedChange={setComposerAnon} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setComposerOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={submitPost} disabled={submitting} className="bg-foreground text-primary-foreground hover:bg-foreground/90">
              {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null} Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Crisis modal */}
      <Dialog open={crisisModal} onOpenChange={setCrisisModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><LifeBuoy className="text-blush-dark" size={18}/> We hear you.</DialogTitle>
            <DialogDescription>
              Your post has been received and will be reviewed by an admin shortly. If you're in immediate distress, please reach out:
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-1 text-sm font-body">
            {UAE_HELPLINES.map(h => (
              <li key={h.name}><a href={h.href} className="font-medium hover:text-blush-dark">{h.value}</a> · {h.name}</li>
            ))}
          </ul>
          <DialogFooter><Button onClick={() => setCrisisModal(false)}>Okay</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pending review modal */}
      <Dialog open={pendingModal} onOpenChange={setPendingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sent for review 🤍</DialogTitle>
            <DialogDescription>An admin will approve your post shortly. You'll see it on the feed once it's live.</DialogDescription>
          </DialogHeader>
          <DialogFooter><Button onClick={() => setPendingModal(false)}>Got it</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report dialog */}
      <Dialog open={!!reportTarget} onOpenChange={(o) => !o && setReportTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report this {reportTarget?.type}</DialogTitle>
            <DialogDescription>Admins review every report.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={reportReason} onValueChange={setReportReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea value={reportNotes} onChange={(e) => setReportNotes(e.target.value)} placeholder="Anything we should know? (optional)" rows={3} maxLength={500}/>
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

export default Circle;
