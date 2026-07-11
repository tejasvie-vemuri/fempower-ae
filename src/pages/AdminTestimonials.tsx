import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Check, X, Trash2, Loader2, Quote } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Row = {
  id: string;
  user_id: string;
  quote: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  author?: { name: string | null; photo_url: string | null } | null;
};

const TABS: Array<Row["status"]> = ["pending", "approved", "rejected"];

const AdminTestimonials = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Row["status"]>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("member_testimonials")
      .select("id, user_id, quote, status, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const list = (data ?? []) as Row[];
    const ids = Array.from(new Set(list.map((r) => r.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("member_profiles")
        .select("user_id, name, photo_url")
        .in("user_id", ids);
      const map = new Map((profs ?? []).map((p) => [p.user_id, p]));
      list.forEach((r) => { r.author = (map.get(r.user_id) as any) ?? null; });
    }
    setRows(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: Row["status"]) => {
    setBusyId(id);
    const patch: any = { status };
    if (status === "approved") { patch.approved_at = new Date().toISOString(); patch.approved_by = user?.id ?? null; }
    if (status !== "approved") { patch.approved_at = null; patch.approved_by = null; }
    const { error } = await supabase.from("member_testimonials").update(patch).eq("id", id);
    setBusyId(null);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    toast({ title: `Marked ${status}` });
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

  const visible = rows.filter((r) => r.status === tab);

  return (
    <>
      <Header />
      <main className="container max-w-4xl py-10">
        <h1 className="font-heading text-3xl font-semibold mb-1">Member Testimonials</h1>
        <p className="text-sm text-muted-foreground mb-6">Approve, reject, or delete member-submitted testimonials.</p>

        <div className="flex gap-2 mb-6">
          {TABS.map((t) => {
            const count = rows.filter((r) => r.status === t).length;
            return (
              <Button key={t} variant={tab === t ? "default" : "outline"} size="sm" onClick={() => setTab(t)} className="capitalize">
                {t} <span className="ml-1 text-xs opacity-70">({count})</span>
              </Button>
            );
          })}
        </div>

        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="animate-spin" /></div>
        ) : visible.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No {tab} testimonials.</p>
        ) : (
          <div className="space-y-4">
            {visible.map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  {r.author?.photo_url ? (
                    <img src={r.author.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs">
                      {(r.author?.name || "?").slice(0, 1)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{r.author?.name || "Unknown member"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Quote size={18} className="text-accent shrink-0 mt-1" />
                  <p className="text-sm italic text-foreground leading-relaxed">"{r.quote}"</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 justify-end">
                  {r.status !== "approved" && (
                    <Button size="sm" onClick={() => setStatus(r.id, "approved")} disabled={busyId === r.id}>
                      <Check size={14} className="mr-1" /> Approve
                    </Button>
                  )}
                  {r.status !== "rejected" && (
                    <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "rejected")} disabled={busyId === r.id}>
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
      </main>
      <Footer />
    </>
  );
};

export default AdminTestimonials;
