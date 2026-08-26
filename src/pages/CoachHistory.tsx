/**
 * Checklist history — her own record of every Zara checklist she completed.
 *
 * Only summaries are stored (never the full conversation), and only when her
 * "save my results" setting is on. Everything here is scoped by RLS to her own
 * user id, so there is no member-id filtering to get wrong in the client.
 */
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ClipboardList, MessageCircle, Trash2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Result = {
  id: string;
  checklist_key: string;
  checklist_label: string;
  summary: string;
  created_at: string;
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "invisible-labour", label: "Invisible Labour" },
  { key: "the-ask", label: "The Ask" },
  { key: "actually-fine", label: "Actually Fine?" },
  { key: "relocation-load", label: "Relocation" },
];

/** Deep link that opens Zara straight into a re-run of the same checklist. */
const rerunHref = (key: string) => `/?start=${key}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

const CoachHistory = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [saveOn, setSaveOn] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const [{ data: rows }, { data: profile }] = await Promise.all([
      supabase
        .from("coach_checklist_results")
        .select("id, checklist_key, checklist_label, summary, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("member_profiles")
        .select("coach_save_checklists")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    setResults(rows ?? []);
    setSaveOn(profile?.coach_save_checklists !== false);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { void load(); }, [load]);

  const toggleSaving = async (next: boolean) => {
    if (!user?.id) return;
    setSaveOn(next);
    const { error } = await supabase
      .from("member_profiles")
      .update({ coach_save_checklists: next })
      .eq("user_id", user.id);
    if (error) {
      setSaveOn(!next);
      toast({ title: "Couldn't update that setting", variant: "destructive" });
      return;
    }
    window.localStorage.setItem(
      "fempower-coach-save-checklists-v1",
      next ? "true" : "false",
    );
    toast({
      title: next ? "Zara will save your summaries" : "Saving turned off",
      description: next
        ? "New checklist summaries will appear here."
        : "New summaries stay in the conversation only.",
    });
  };

  const deleteOne = async (id: string) => {
    const { error } = await supabase.from("coach_checklist_results").delete().eq("id", id);
    if (error) {
      toast({ title: "Couldn't delete that summary", variant: "destructive" });
      return;
    }
    setResults((r) => r.filter((x) => x.id !== id));
  };

  const deleteAll = async () => {
    if (!user?.id) return;
    const { error } = await supabase
      .from("coach_checklist_results").delete().eq("user_id", user.id);
    if (error) {
      toast({ title: "Couldn't clear your history", variant: "destructive" });
      return;
    }
    setResults([]);
    toast({ title: "History cleared" });
  };

  const visible = filter === "all" ? results : results.filter((r) => r.checklist_key === filter);

  return (
    <>
      <Header />
      <main className="pt-24 pb-20 min-h-screen bg-background">
        <div className="container max-w-3xl">
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
            <Link to="/account/profile"><ArrowLeft size={16} className="mr-1" /> Back to profile</Link>
          </Button>

          <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
            <div>
              <h1 className="font-heading text-3xl md:text-4xl text-primary">Your checklist history</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-prose">
                Summaries from the checklists you've walked through with Zara — Invisible
                Labour, The Ask, Am I Actually Fine? and Relocation Load. Only you can see them.
              </p>
            </div>
          </div>

          {/* Privacy control, mirroring the one inside the chat widget. */}
          <div className="bg-card border rounded-lg p-4 mb-6 flex items-start gap-3">
            <ShieldCheck size={18} className="text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">Let Zara save my checklist summaries</span>
                <Switch
                  checked={saveOn}
                  onCheckedChange={(v) => void toggleSaving(v)}
                  aria-label="Save checklist summaries"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                When this is off, summaries stay in the conversation and nothing is written here.
              </p>
            </div>
          </div>

          <Tabs value={filter} onValueChange={setFilter} className="mb-5">
            <TabsList className="flex flex-wrap h-auto">
              {FILTERS.map((f) => (
                <TabsTrigger key={f.key} value={f.key} className="text-xs">{f.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <ClipboardList size={28} className="mx-auto text-muted-foreground mb-3" />
              <p className="font-heading text-lg text-primary mb-1">Nothing saved yet</p>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                {results.length === 0
                  ? "Walk through a checklist with Zara and her summary will appear here."
                  : "No summaries for this checklist yet."}
              </p>
              <Button asChild className="rounded-full">
                <Link to="/?start=invisible-labour">
                  <MessageCircle size={16} className="mr-1.5" /> Start a checklist
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {visible.map((r) => (
                <article key={r.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <Badge variant="outline">{r.checklist_label}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                    {r.summary}
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <Button variant="outline" size="sm" asChild className="rounded-full">
                      <Link to={rerunHref(r.checklist_key)}>Do it again with Zara</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void deleteOne(r.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${r.checklist_label} summary from ${formatDate(r.created_at)}`}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {results.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="mt-6 text-muted-foreground hover:text-destructive">
                  Delete all saved summaries
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete every saved summary?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes all your checklist summaries permanently. Zara will no longer
                    be able to refer back to them in future conversations.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep them</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void deleteAll()}>Delete all</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default CoachHistory;
