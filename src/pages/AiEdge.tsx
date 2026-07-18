import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  Star,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
} from "lucide-react";

type Category = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  order_index: number;
};

type Prompt = {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  prompt_text: string;
  source: string | null;
  source_url: string | null;
  icon: string | null;
  order_index: number;
};

type View = { type: "home" } | { type: "category"; id: string } | { type: "saved" };

const AiEdge = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [view, setView] = useState<View>({ type: "home" });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [cats, prs, bms] = await Promise.all([
        (supabase as any)
          .from("ai_edge_categories")
          .select("*")
          .eq("is_published", true)
          .order("order_index", { ascending: true }),
        (supabase as any)
          .from("ai_edge_prompts")
          .select("*")
          .eq("is_published", true)
          .order("order_index", { ascending: true }),
        user
          ? (supabase as any)
              .from("ai_edge_bookmarks")
              .select("prompt_id")
              .eq("user_id", user.id)
          : Promise.resolve({ data: [] }),
      ]);
      setCategories(cats.data ?? []);
      setPrompts(prs.data ?? []);
      setBookmarks(new Set((bms.data ?? []).map((b: any) => b.prompt_id)));
      setLoading(false);
    })();
  }, [user]);

  const promptCount = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of prompts) m[p.category_id] = (m[p.category_id] ?? 0) + 1;
    return m;
  }, [prompts]);

  const toggleBookmark = async (promptId: string) => {
    if (!user) return;
    const isSaved = bookmarks.has(promptId);
    // optimistic
    setBookmarks((prev) => {
      const next = new Set(prev);
      isSaved ? next.delete(promptId) : next.add(promptId);
      return next;
    });
    if (isSaved) {
      const { error } = await (supabase as any)
        .from("ai_edge_bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("prompt_id", promptId);
      if (error) {
        setBookmarks((prev) => new Set(prev).add(promptId));
        toast({ title: "Couldn't remove", description: error.message, variant: "destructive" });
      }
    } else {
      const { error } = await (supabase as any)
        .from("ai_edge_bookmarks")
        .insert({ user_id: user.id, prompt_id: promptId });
      if (error) {
        setBookmarks((prev) => {
          const next = new Set(prev);
          next.delete(promptId);
          return next;
        });
        toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const savedPrompts = prompts.filter((p) => bookmarks.has(p.id));
  const activeCategory =
    view.type === "category" ? categories.find((c) => c.id === view.id) : undefined;
  const visiblePrompts =
    view.type === "category"
      ? prompts.filter((p) => p.category_id === view.id)
      : view.type === "saved"
      ? savedPrompts
      : [];

  return (
    <>
      <Header />
      <main className="pt-24 pb-20 min-h-screen bg-background">
        <div className="container max-w-3xl">
          {/* Back / breadcrumb */}
          {view.type === "home" ? (
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-body uppercase tracking-widest text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft size={13} /> Home
            </Link>
          ) : (
            <button
              onClick={() => setView({ type: "home" })}
              className="inline-flex items-center gap-1.5 text-xs font-body uppercase tracking-widest text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft size={13} /> Your AI Edge
            </button>
          )}

          {/* ── Home: subfolders ─────────────────────────────────────── */}
          {view.type === "home" && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={20} className="text-primary" />
                <h1 className="font-heading text-3xl text-foreground">Your AI Edge</h1>
              </div>
              <p className="text-muted-foreground font-body mb-8">
                Steal-worthy prompts for the working woman. Small moves, compounding into real fluency.
              </p>

              <div className="mb-6">
                <button
                  onClick={() => setView({ type: "saved" })}
                  className="inline-flex items-center gap-2 text-sm font-body text-foreground hover:text-primary"
                >
                  <Star size={15} className={savedPrompts.length ? "fill-primary text-primary" : ""} />
                  Saved
                  {savedPrompts.length > 0 && (
                    <span className="text-muted-foreground">({savedPrompts.length})</span>
                  )}
                </button>
              </div>

              {categories.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground font-body">
                  Prompts are coming soon. Check back shortly.
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setView({ type: "category", id: c.id })}
                      className="text-left"
                    >
                      <Card className="p-5 h-full hover:border-primary/50 transition-colors">
                        <div className="text-2xl mb-2">{c.icon ?? "✨"}</div>
                        <div className="font-heading text-lg text-foreground">{c.title}</div>
                        {c.description && (
                          <p className="text-sm text-muted-foreground font-body mt-1">
                            {c.description}
                          </p>
                        )}
                        <div className="text-xs font-body uppercase tracking-widest text-muted-foreground mt-3">
                          {promptCount[c.id] ?? 0} prompt{(promptCount[c.id] ?? 0) === 1 ? "" : "s"}
                        </div>
                      </Card>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Category or Saved: prompt list ───────────────────────── */}
          {view.type !== "home" && (
            <>
              <div className="flex items-center gap-2 mb-1">
                {view.type === "saved" ? (
                  <Star size={20} className="text-primary" />
                ) : (
                  <span className="text-2xl">{activeCategory?.icon ?? "✨"}</span>
                )}
                <h1 className="font-heading text-3xl text-foreground">
                  {view.type === "saved" ? "Saved" : activeCategory?.title}
                </h1>
              </div>
              {view.type === "category" && activeCategory?.description && (
                <p className="text-muted-foreground font-body mb-8">{activeCategory.description}</p>
              )}
              {view.type === "saved" && (
                <p className="text-muted-foreground font-body mb-8">
                  The prompts you starred, all in one place.
                </p>
              )}

              {visiblePrompts.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground font-body">
                  {view.type === "saved"
                    ? "No saved prompts yet. Star the ones you'll come back to."
                    : "No prompts in this subfolder yet."}
                </Card>
              ) : (
                <div className="space-y-4">
                  {visiblePrompts.map((p) => (
                    <PromptCard
                      key={p.id}
                      prompt={p}
                      saved={bookmarks.has(p.id)}
                      onToggleSave={() => toggleBookmark(p.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

const PromptCard = ({
  prompt,
  saved,
  onToggleSave,
}: {
  prompt: Prompt;
  saved: boolean;
  onToggleSave: () => void;
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.prompt_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: "Couldn't copy", description: "Select the text and copy manually.", variant: "destructive" });
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          {prompt.icon && <span className="text-xl leading-none mt-0.5">{prompt.icon}</span>}
          <div className="min-w-0">
            <div className="font-heading text-lg text-foreground">{prompt.title}</div>
            {prompt.description && (
              <p className="text-sm text-muted-foreground font-body mt-0.5">{prompt.description}</p>
            )}
          </div>
        </div>
        <button
          onClick={onToggleSave}
          aria-label={saved ? "Remove bookmark" : "Save prompt"}
          className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
        >
          <Star size={18} className={saved ? "fill-primary text-primary" : ""} />
        </button>
      </div>

      {/* Copyable prompt */}
      <div className="relative mt-3">
        <pre className="rounded-md bg-muted/60 border border-border p-4 pr-12 text-sm font-mono text-foreground whitespace-pre-wrap break-words">
          {prompt.prompt_text}
        </pre>
        <Button
          size="icon"
          variant="ghost"
          onClick={copy}
          aria-label="Copy prompt"
          className="absolute top-2 right-2 h-8 w-8"
        >
          {copied ? <Check size={15} className="text-primary" /> : <Copy size={15} />}
        </Button>
      </div>

      {prompt.source && (
        <div className="mt-2 text-xs font-body text-muted-foreground">
          Source:{" "}
          {prompt.source_url ? (
            <a
              href={prompt.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 hover:text-foreground underline underline-offset-2"
            >
              {prompt.source}
              <ExternalLink size={11} />
            </a>
          ) : (
            <span>{prompt.source}</span>
          )}
        </div>
      )}
    </Card>
  );
};

export default AiEdge;
