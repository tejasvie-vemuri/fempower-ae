import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, RefreshCw, Plus, Eye, EyeOff, Trash2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EMIRATES } from "@/lib/schools";

type School = any;
type Review = any;
type Request = any;

const AdminSchools = () => {
  const { toast } = useToast();
  const [schools, setSchools] = useState<School[]>([]);
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<School | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [scrapingId, setScrapingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const [schoolsRes, reviewsRes, requestsRes] = await Promise.all([
      supabase.from("schools").select("*").order("created_at", { ascending: false }),
      supabase.from("school_reviews").select("*").eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("school_requests").select("*").eq("status", "open").order("created_at", { ascending: false }),
    ]);
    setSchools(schoolsRes.data ?? []);
    setPendingReviews(reviewsRes.data ?? []);
    setRequests(requestsRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const scrape = async (school: School) => {
    setScrapingId(school.id);
    try {
      const { data, error } = await supabase.functions.invoke("schools-scrape", {
        body: { school_id: school.id, url: school.website_url, name: school.name },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "Scraped & updated" });
      load();
    } catch (e: any) {
      toast({ title: "Scrape failed", description: e.message, variant: "destructive" });
    } finally {
      setScrapingId(null);
    }
  };

  const setSchoolStatus = async (id: string, status: string) => {
    await supabase.from("schools").update({ status }).eq("id", id);
    load();
  };
  const deleteSchool = async (id: string) => {
    if (!confirm("Delete this school and all its reviews?")) return;
    await supabase.from("schools").delete().eq("id", id);
    load();
  };

  const setReviewStatus = async (id: string, status: string) => {
    await supabase.from("school_reviews").update({ status }).eq("id", id);
    load();
  };

  const closeRequest = async (id: string) => {
    await supabase.from("school_requests").update({ status: "closed" }).eq("id", id);
    load();
  };

  const bulkSearch = async () => {
    if (!searchQuery.trim()) return;
    setBulkLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("schools-search-external", {
        body: { query: searchQuery.trim(), limit: 5 },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: `Added ${(data as any).inserted?.length ?? 0} draft schools` });
      setSearchQuery("");
      load();
    } catch (e: any) {
      toast({ title: "Search failed", description: e.message, variant: "destructive" });
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen container max-w-6xl">
        <h1 className="font-heading text-3xl font-semibold">Schools admin</h1>

        <Tabs defaultValue="schools" className="mt-6">
          <TabsList>
            <TabsTrigger value="schools">All schools ({schools.length})</TabsTrigger>
            <TabsTrigger value="reviews">Pending reviews ({pendingReviews.length})</TabsTrigger>
            <TabsTrigger value="requests">Requests ({requests.length})</TabsTrigger>
            <TabsTrigger value="discover">Discover</TabsTrigger>
          </TabsList>

          <TabsContent value="schools" className="mt-6">
            <Button onClick={() => setAddOpen(true)} className="mb-4"><Plus size={14} className="mr-1.5" /> Add school</Button>
            {loading ? <Loader2 className="animate-spin" /> : (
              <div className="space-y-2">
                {schools.map((s) => (
                  <div key={s.id} className="rounded-lg border border-border p-4 flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-semibold">{s.name}</span>
                        <Badge variant={s.status === "published" ? "default" : "outline"} className="capitalize text-[10px]">{s.status}</Badge>
                        <Badge variant="secondary" className="capitalize text-[10px]">{s.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-body">{[s.area, s.emirate].filter(Boolean).join(", ") || "—"}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => setEditing(s)}>Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => scrape(s)} disabled={scrapingId === s.id}>
                        {scrapingId === s.id ? <Loader2 className="animate-spin" size={12} /> : <RefreshCw size={12} />}
                        <span className="ml-1">Scrape</span>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setSchoolStatus(s.id, s.status === "published" ? "draft" : "published")}>
                        {s.status === "published" ? <><EyeOff size={12} className="mr-1" /> Unpublish</> : <><Eye size={12} className="mr-1" /> Publish</>}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteSchool(s.id)}><Trash2 size={12} /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            {pendingReviews.length === 0 ? <p className="text-muted-foreground">No pending reviews.</p> : (
              <div className="space-y-3">
                {pendingReviews.map((r) => {
                  const school = schools.find((s) => s.id === r.school_id);
                  return (
                    <div key={r.id} className="rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-heading font-semibold">{school?.name ?? r.school_id}</span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={12} className="fill-blush-dark text-blush-dark" />)}
                        </div>
                      </div>
                      <p className="text-sm font-body whitespace-pre-wrap">{r.body}</p>
                      <div className="mt-2 text-xs text-muted-foreground font-body space-x-2">
                        {r.curriculum && <span>{r.curriculum}</span>}
                        {r.child_age_group && <span>· {r.child_age_group}</span>}
                        {r.fees_paid_cents != null && <span>· AED {(r.fees_paid_cents/100).toLocaleString()} {r.fees_year}</span>}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" onClick={() => setReviewStatus(r.id, "published")}>Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => setReviewStatus(r.id, "hidden")}>Hide</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="mt-6">
            {requests.length === 0 ? <p className="text-muted-foreground">No open requests.</p> : (
              <div className="space-y-2">
                {requests.map((r) => (
                  <div key={r.id} className="rounded-lg border border-border p-4">
                    <div className="font-heading font-semibold">{r.name}</div>
                    {r.website_url && <a href={r.website_url} target="_blank" rel="noreferrer" className="text-xs text-blush-dark hover:underline">{r.website_url}</a>}
                    {r.notes && <p className="mt-1 text-sm font-body">{r.notes}</p>}
                    <Button size="sm" variant="outline" className="mt-2" onClick={() => closeRequest(r.id)}>Mark handled</Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="discover" className="mt-6">
            <Label className="text-xs">Search Google (via Firecrawl) and import as drafts</Label>
            <div className="mt-2 flex gap-2">
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="e.g. British nurseries JVC Dubai" />
              <Button onClick={bulkSearch} disabled={bulkLoading}>
                {bulkLoading && <Loader2 className="animate-spin mr-2" size={14} />}
                Search & import
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Creates draft entries. Open each one, click <em>Scrape</em> to enrich, then <em>Publish</em>.</p>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />

      {editing && <EditDialog school={editing} onClose={() => { setEditing(null); load(); }} />}
      {addOpen && <AddDialog onClose={() => { setAddOpen(false); load(); }} />}
    </>
  );
};

const EditDialog = ({ school, onClose }: { school: any; onClose: () => void }) => {
  const { toast } = useToast();
  const [form, setForm] = useState({ ...school, curriculum: (school.curriculum ?? []).join(", ") });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("schools").update({
      name: form.name,
      type: form.type,
      emirate: form.emirate || null,
      area: form.area || null,
      curriculum: form.curriculum ? form.curriculum.split(",").map((c: string) => c.trim()).filter(Boolean) : [],
      age_min: form.age_min ? Number(form.age_min) : null,
      age_max: form.age_max ? Number(form.age_max) : null,
      website_url: form.website_url || null,
      fees_min: form.fees_min ? Number(form.fees_min) : null,
      fees_max: form.fees_max ? Number(form.fees_max) : null,
      fees_year: form.fees_year || null,
      waitlist_status: form.waitlist_status || null,
      description: form.description || null,
    }).eq("id", school.id);
    setSaving(false);
    if (error) { toast({ title: error.message, variant: "destructive" }); return; }
    toast({ title: "Saved" });
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit school</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="col-span-2"><Label>Name</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Type</Label><Input value={form.type ?? ""} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="school or nursery" /></div>
          <div><Label>Emirate</Label><Input value={form.emirate ?? ""} onChange={(e) => setForm({ ...form, emirate: e.target.value })} /></div>
          <div><Label>Area</Label><Input value={form.area ?? ""} onChange={(e) => setForm({ ...form, area: e.target.value })} /></div>
          <div className="col-span-2"><Label>Curriculum (comma-separated)</Label><Input value={form.curriculum} onChange={(e) => setForm({ ...form, curriculum: e.target.value })} /></div>
          <div><Label>Age min</Label><Input type="number" value={form.age_min ?? ""} onChange={(e) => setForm({ ...form, age_min: e.target.value })} /></div>
          <div><Label>Age max</Label><Input type="number" value={form.age_max ?? ""} onChange={(e) => setForm({ ...form, age_max: e.target.value })} /></div>
          <div><Label>Fees min (AED)</Label><Input type="number" value={form.fees_min ?? ""} onChange={(e) => setForm({ ...form, fees_min: e.target.value })} /></div>
          <div><Label>Fees max (AED)</Label><Input type="number" value={form.fees_max ?? ""} onChange={(e) => setForm({ ...form, fees_max: e.target.value })} /></div>
          <div><Label>Fees year</Label><Input value={form.fees_year ?? ""} onChange={(e) => setForm({ ...form, fees_year: e.target.value })} /></div>
          <div><Label>Waitlist status</Label><Input value={form.waitlist_status ?? ""} onChange={(e) => setForm({ ...form, waitlist_status: e.target.value })} placeholder="open / waitlist / closed" /></div>
          <div className="col-span-2"><Label>Website</Label><Input value={form.website_url ?? ""} onChange={(e) => setForm({ ...form, website_url: e.target.value })} /></div>
          <div className="col-span-2"><Label>Description</Label><Textarea rows={4} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <DialogFooter><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={saving}>{saving && <Loader2 className="animate-spin mr-2" size={14} />}Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AddDialog = ({ onClose }: { onClose: () => void }) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [type, setType] = useState("school");
  const [website, setWebsite] = useState("");
  const [saving, setSaving] = useState(false);

  const add = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) + "-" + Math.random().toString(36).slice(2, 6);
    const { error } = await supabase.from("schools").insert({ name: name.trim(), slug, type, website_url: website.trim() || null, status: "draft" });
    setSaving(false);
    if (error) { toast({ title: error.message, variant: "destructive" }); return; }
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add school (draft)</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Type</Label><Input value={type} onChange={(e) => setType(e.target.value)} placeholder="school or nursery" /></div>
          <div><Label>Website</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
        </div>
        <DialogFooter><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={add} disabled={saving || !name.trim()}>Add</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminSchools;
