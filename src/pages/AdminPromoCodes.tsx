import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
type Promo = Tables<"event_promo_codes">;
const empty = { id: "", code: "", type: "percentage", amount: "", event: "all", expiry: "", members: false, active: true };
export default function AdminPromoCodes() {
  const [rows, setRows] = useState<Promo[]>([]);
  const [events, setEvents] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const load = async () => {
    const [codes, ev] = await Promise.all([supabase.from("event_promo_codes").select("*").order("created_at", { ascending: false }), supabase.from("events").select("id,title").gt("price_cents", 0).order("starts_at", { ascending: false })]);
    if (codes.error || ev.error) toast.error("Could not load promo codes");
    setRows(codes.data ?? []); setEvents(ev.data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!/^[A-Z0-9_-]{2,40}$/.test(form.code.trim()) || !Number.isFinite(amount) || amount <= 0 || (form.type === "percentage" && (!Number.isInteger(amount) || amount > 100))) return toast.error("Enter a valid code and discount");
    setSaving(true);
    const payload = { code: form.code.trim(), discount_type: form.type, discount_value: form.type === "fixed" ? Math.round(amount * 100) : amount, event_id: form.event === "all" ? null : form.event, expires_at: form.expiry ? new Date(form.expiry).toISOString() : null, members_only: form.members, is_active: form.active };
    const { error } = form.id ? await supabase.from("event_promo_codes").update(payload).eq("id", form.id) : await supabase.from("event_promo_codes").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.code === "23505" ? "This promo code already exists" : error.message);
    toast.success("Promo code saved"); setOpen(false); load();
  };
  const edit = (r: Promo) => {
    const d = r.expires_at ? new Date(r.expires_at) : null;
    const local = d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,16) : "";
    setForm({ id: r.id, code: r.code, type: r.discount_type, amount: String(r.discount_type === "fixed" ? r.discount_value / 100 : r.discount_value), event: r.event_id ?? "all", expiry: local, members: r.members_only, active: r.is_active }); setOpen(true);
  };
  return <div className="min-h-screen bg-background"><main className="max-w-5xl mx-auto px-4 py-8">
    <Link to="/admin/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4"><ArrowLeft className="h-4 w-4" /> Manage events</Link>
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6"><h1 className="font-heading text-3xl">Promo codes</h1><Button onClick={() => { setForm(empty); setOpen(true); }}><Plus className="h-4 w-4 mr-2" /> New code</Button></div>
    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : rows.length === 0 ? <p className="text-muted-foreground">No promo codes yet.</p> : <div className="divide-y divide-border">{rows.map(r => <div key={r.id} className="flex items-start justify-between gap-3 py-4"><div className="min-w-0"><p className="font-medium">{r.code} <span className="text-muted-foreground">· {r.discount_type === "percentage" ? `${r.discount_value}%` : `AED ${(r.discount_value / 100).toFixed(2)}`} off</span></p><p className="text-sm text-muted-foreground">{events.find(e => e.id === r.event_id)?.title ?? "All paid events"} · {r.members_only ? "Members only" : "Members & guests"}</p><p className="text-xs text-muted-foreground mt-1">{!r.is_active ? "Inactive" : r.expires_at && Date.parse(r.expires_at) <= Date.now() ? "Expired" : "Active"}{r.expires_at ? ` · Expires ${new Date(r.expires_at).toLocaleString()}` : " · No expiry"}</p></div><Button variant="ghost" size="icon" aria-label={`Edit ${r.code}`} onClick={() => edit(r)}><Pencil className="h-4 w-4" /></Button></div>)}</div>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{form.id ? "Edit promo code" : "New promo code"}</DialogTitle></DialogHeader><form onSubmit={save} className="space-y-4">
      <div><Label htmlFor="promo-code">Code</Label><Input id="promo-code" required maxLength={40} pattern="[A-Z0-9_-]{2,40}" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
      <div className="grid grid-cols-2 gap-3"><div><Label>Discount type</Label><Select value={form.type} onValueChange={type => setForm({ ...form, type })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percentage">Percentage</SelectItem><SelectItem value="fixed">Fixed AED</SelectItem></SelectContent></Select></div><div><Label htmlFor="promo-amount">{form.type === "percentage" ? "Discount (%)" : "Discount (AED)"}</Label><Input id="promo-amount" type="number" required min={form.type === "percentage" ? 1 : 0.01} max={form.type === "percentage" ? 100 : undefined} step={form.type === "percentage" ? 1 : 0.01} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div></div>
      <div><Label>Applies to</Label><Select value={form.event} onValueChange={event => setForm({ ...form, event })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All paid events</SelectItem>{events.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}</SelectContent></Select></div>
      <div><Label htmlFor="promo-expiry">Expiry (optional, your local time)</Label><Input id="promo-expiry" type="datetime-local" value={form.expiry} onChange={e => setForm({ ...form, expiry: e.target.value })} /></div>
      <div className="flex items-center justify-between"><Label htmlFor="promo-members">Members only</Label><Switch id="promo-members" checked={form.members} onCheckedChange={members => setForm({ ...form, members })} /></div>
      <div className="flex items-center justify-between"><Label htmlFor="promo-active">Active</Label><Switch id="promo-active" checked={form.active} onCheckedChange={active => setForm({ ...form, active })} /></div>
      <Button type="submit" className="w-full" disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save code</Button>
    </form></DialogContent></Dialog>
  </main></div>;
}