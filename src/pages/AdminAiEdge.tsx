import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";

type Category = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  order_index: number;
  is_published: boolean;
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
  is_published: boolean;
};

const labelCls =
  "font-body text-xs uppercase tracking-widest text-muted-foreground";

const AdminAiEdge = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = async () => {
    const [cats, prs] = await Promise.all([
      (supabase as any).from("ai_edge_categories").select("*").order("order_index", { ascending: true }),
      (supabase as any).from("ai_edge_prompts").select("*").order("order_index", { ascending: true }),
    ]);
    setCategories(cats.data ?? []);
    setPrompts(prs.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-24 pb-20 min-h-screen bg-background">
        <div className="container max-w-2xl">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-body uppercase tracking-widest text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft size={13} /> Home
          </Link>

          <h1 className="font-heading text-3xl text-foreground mb-1">Your AI Edge</h1>
          <p className="text-muted-foreground font-body mb-8">
            Curate the prompt library. Nothing shows to members until you publish it.
          </p>

          <NewCategory onSaved={load} nextOrder={categories.length} />

          <div className="space-y-4 mt-8">
            {categories.map((c) => (
              <Card key={c.id} className="p-5">
                <div className="flex items-center gap-2">
                  <button onClick={() => toggle(c.id)} className="text-muted-foreground hover:text-foreground">
                    {expanded.has(c.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                  <span className="text-xl">{c.icon ?? "✨"}</span>
                  <span className="font-heading text-lg text-foreground flex-1">{c.title}</span>
                  {!c.is_published && (
                    <span className="text-[10px] font-body uppercase tracking-widest text-muted-foreground border border-border rounded px-1.5 py-0.5">
                      Draft
                    </span>
                  )}
                  <span className="text-xs font-body text-muted-foreground">
                    {prompts.filter((p) => p.category_id === c.id).length}
                  </span>
                </div>

                {expanded.has(c.id) && (
                  <div className="mt-4 pl-1 space-y-6">
                    <CategoryEditor category={c} onSaved={load} />
                    <div className="border-t border-border pt-4">
                      <div className={`${labelCls} mb-3`}>Prompts</div>
                      <div className="space-y-3">
                        {prompts
                          .filter((p) => p.category_id === c.id)
                          .map((p) => (
                            <PromptEditor key={p.id} prompt={p} onSaved={load} />
                          ))}
                      </div>
                      <NewPrompt
                        categoryId={c.id}
                        onSaved={load}
                        nextOrder={prompts.filter((p) => p.category_id === c.id).length}
                      />
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

/* ── Subfolder: new ─────────────────────────────────────────────────────── */
const NewCategory = ({ onSaved, nextOrder }: { onSaved: () => void; nextOrder: number }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const { error } = await (supabase as any).from("ai_edge_categories").insert({
      title: title.trim(),
      description: description.trim() || null,
      icon: icon.trim() || null,
      order_index: nextOrder,
      is_published: false,
    });
    setSaving(false);
    if (error) return toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    setTitle(""); setDescription(""); setIcon(""); setOpen(false);
    onSaved();
  };

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)} className="w-full">
        <Plus size={15} className="mr-1.5" /> Add subfolder
      </Button>
    );
  }

  return (
    <Card className="p-5 space-y-4">
      <div className="flex gap-3">
        <div className="w-20">
          <Label className={labelCls}>Icon</Label>
          <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🚀" className="mt-1.5 text-center" />
        </div>
        <div className="flex-1">
          <Label className={labelCls}>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Career & Growth" className="mt-1.5" />
        </div>
      </div>
      <div>
        <Label className={labelCls}>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5" />
      </div>
      <div className="flex gap-2">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : "Add subfolder"}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </Card>
  );
};

/* ── Subfolder: edit ────────────────────────────────────────────────────── */
const CategoryEditor = ({ category, onSaved }: { category: Category; onSaved: () => void }) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(category.title);
  const [description, setDescription] = useState(category.description ?? "");
  const [icon, setIcon] = useState(category.icon ?? "");
  const [order, setOrder] = useState(String(category.order_index));
  const [published, setPublished] = useState(category.is_published);

  const save = async () => {
    setSaving(true);
    const { error } = await (supabase as any)
      .from("ai_edge_categories")
      .update({
        title: title.trim(),
        description: description.trim() || null,
        icon: icon.trim() || null,
        order_index: Number(order) || 0,
        is_published: published,
      })
      .eq("id", category.id);
    setSaving(false);
    if (error) return toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    toast({ title: "Saved" });
    onSaved();
  };

  const remove = async () => {
    if (!window.confirm("Delete this subfolder and all its prompts? This can't be undone.")) return;
    const { error } = await (supabase as any).from("ai_edge_categories").delete().eq("id", category.id);
    if (error) return toast({ title: "Couldn't delete", description: error.message, variant: "destructive" });
    toast({ title: "Deleted" });
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="w-20">
          <Label className={labelCls}>Icon</Label>
          <Input value={icon} onChange={(e) => setIcon(e.target.value)} className="mt-1.5 text-center" />
        </div>
        <div className="flex-1">
          <Label className={labelCls}>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" />
        </div>
        <div className="w-20">
          <Label className={labelCls}>Order</Label>
          <Input type="number" value={order} onChange={(e) => setOrder(e.target.value)} className="mt-1.5" />
        </div>
      </div>
      <div>
        <Label className={labelCls}>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch checked={published} onCheckedChange={setPublished} />
          <span className="text-sm font-body text-foreground">{published ? "Published" : "Draft"}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={remove} className="text-destructive hover:text-destructive">
            <Trash2 size={15} />
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ── Prompt: new ────────────────────────────────────────────────────────── */
const NewPrompt = ({
  categoryId,
  onSaved,
  nextOrder,
}: {
  categoryId: string;
  onSaved: () => void;
  nextOrder: number;
}) => {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="mt-3">
        <Plus size={14} className="mr-1.5" /> Add prompt
      </Button>
    );
  }
  return (
    <div className="mt-3">
      <PromptFields
        categoryId={categoryId}
        nextOrder={nextOrder}
        onDone={() => { setOpen(false); onSaved(); }}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
};

/* ── Prompt: edit ───────────────────────────────────────────────────────── */
const PromptEditor = ({ prompt, onSaved }: { prompt: Prompt; onSaved: () => void }) => {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);

  const remove = async () => {
    if (!window.confirm("Delete this prompt?")) return;
    const { error } = await (supabase as any).from("ai_edge_prompts").delete().eq("id", prompt.id);
    if (error) return toast({ title: "Couldn't delete", description: error.message, variant: "destructive" });
    toast({ title: "Deleted" });
    onSaved();
  };

  if (editing) {
    return (
      <div className="border border-border rounded-md p-4">
        <PromptFields
          prompt={prompt}
          categoryId={prompt.category_id}
          nextOrder={prompt.order_index}
          onDone={() => { setEditing(false); onSaved(); }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2">
      {prompt.icon && <span>{prompt.icon}</span>}
      <span className="text-sm font-body text-foreground flex-1 truncate">{prompt.title}</span>
      {!prompt.is_published && (
        <span className="text-[10px] font-body uppercase tracking-widest text-muted-foreground">Draft</span>
      )}
      <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit</Button>
      <Button variant="ghost" size="sm" onClick={remove} className="text-destructive hover:text-destructive">
        <Trash2 size={14} />
      </Button>
    </div>
  );
};

/* ── Prompt: shared form (create + edit) ────────────────────────────────── */
const PromptFields = ({
  prompt,
  categoryId,
  nextOrder,
  onDone,
  onCancel,
}: {
  prompt?: Prompt;
  categoryId: string;
  nextOrder: number;
  onDone: () => void;
  onCancel: () => void;
}) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(prompt?.title ?? "");
  const [description, setDescription] = useState(prompt?.description ?? "");
  const [promptText, setPromptText] = useState(prompt?.prompt_text ?? "");
  const [source, setSource] = useState(prompt?.source ?? "");
  const [sourceUrl, setSourceUrl] = useState(prompt?.source_url ?? "");
  const [icon, setIcon] = useState(prompt?.icon ?? "");
  const [order, setOrder] = useState(String(prompt?.order_index ?? nextOrder));
  const [published, setPublished] = useState(prompt?.is_published ?? false);

  const save = async () => {
    if (!title.trim() || !promptText.trim()) {
      return toast({ title: "Title and prompt text are required", variant: "destructive" });
    }
    setSaving(true);
    const payload = {
      category_id: categoryId,
      title: title.trim(),
      description: description.trim() || null,
      prompt_text: promptText,
      source: source.trim() || null,
      source_url: sourceUrl.trim() || null,
      icon: icon.trim() || null,
      order_index: Number(order) || 0,
      is_published: published,
    };
    const { error } = prompt
      ? await (supabase as any).from("ai_edge_prompts").update(payload).eq("id", prompt.id)
      : await (supabase as any).from("ai_edge_prompts").insert(payload);
    setSaving(false);
    if (error) return toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    onDone();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="w-16">
          <Label className={labelCls}>Icon</Label>
          <Input value={icon} onChange={(e) => setIcon(e.target.value)} className="mt-1.5 text-center" />
        </div>
        <div className="flex-1">
          <Label className={labelCls}>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" />
        </div>
        <div className="w-16">
          <Label className={labelCls}>Order</Label>
          <Input type="number" value={order} onChange={(e) => setOrder(e.target.value)} className="mt-1.5" />
        </div>
      </div>
      <div>
        <Label className={labelCls}>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5" />
      </div>
      <div>
        <Label className={labelCls}>Prompt text</Label>
        <Textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          rows={5}
          className="mt-1.5 font-mono text-sm"
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <Label className={labelCls}>Source</Label>
          <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Shared by Priya M." className="mt-1.5" />
        </div>
        <div className="flex-1">
          <Label className={labelCls}>Source URL</Label>
          <Input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://" className="mt-1.5" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Switch checked={published} onCheckedChange={setPublished} />
          <span className="text-sm font-body text-foreground">{published ? "Published" : "Draft"}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminAiEdge;
