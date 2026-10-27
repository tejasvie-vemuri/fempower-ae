import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Entry = Tables<"finance_entries">;
type EventRow = Pick<Tables<"events">, "id" | "title" | "starts_at" | "price_cents" | "status">;
type RegRow = Pick<Tables<"registrations">, "event_id" | "status" | "amount_paid_cents" | "discount_cents" | "quantity" | "created_at">;

const aed = (cents: number) => `AED ${(cents / 100).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const monthKey = (iso: string) => iso.slice(0, 7);
const monthLabel = (key: string) =>
  new Date(`${key}-01T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

const empty = { id: "", kind: "expense", label: "", amount: "", date: "", event: "none", note: "" };

export default function AdminFinances() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [regs, setRegs] = useState<RegRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const load = async () => {
    const [en, ev, rg] = await Promise.all([
      supabase.from("finance_entries").select("*").order("entry_date", { ascending: false }),
      supabase.from("events").select("id,title,starts_at,price_cents,status").order("starts_at", { ascending: false }),
      supabase.from("registrations").select("event_id,status,amount_paid_cents,discount_cents,quantity,created_at").in("status", ["confirmed", "refunded"]),
    ]);
    if (en.error || ev.error || rg.error) toast.error("Could not load finances");
    setEntries(en.data ?? []);
    setEvents(ev.data ?? []);
    setRegs(rg.data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const eventTitle = (id: string | null) => events.find((e) => e.id === id)?.title ?? "—";

  const perEvent = useMemo(() => {
    const map = new Map<string, { collected: number; discounts: number; refunds: number; tickets: number; costs: number; otherIncome: number }>();
    const ensure = (id: string) => {
      if (!map.has(id)) map.set(id, { collected: 0, discounts: 0, refunds: 0, tickets: 0, costs: 0, otherIncome: 0 });
      return map.get(id)!;
    };
    for (const r of regs) {
      const row = ensure(r.event_id);
      if (r.status === "confirmed") {
        row.collected += r.amount_paid_cents;
        row.discounts += r.discount_cents;
        row.tickets += r.quantity;
      } else if (r.status === "refunded") {
        // The money was collected first, then returned — count both sides.
        row.collected += r.amount_paid_cents;
        row.discounts += r.discount_cents;
        row.refunds += r.amount_paid_cents;
      }
    }
    for (const e of entries) {
      if (!e.event_id) continue;
      const row = ensure(e.event_id);
      if (e.kind === "expense") row.costs += e.amount_cents;
      else row.otherIncome += e.amount_cents;
    }
    return [...map.entries()]
      .map(([id, v]) => ({ id, title: eventTitle(id), ...v, net: v.collected + v.otherIncome - v.refunds - v.costs }))
      .filter((v) => v.collected > 0 || v.costs > 0 || v.otherIncome > 0 || v.refunds > 0);
  }, [regs, entries, events]);

  const monthly = useMemo(() => {
    const map = new Map<string, { tickets: number; manualIncome: number; expenses: number; refunds: number }>();
    const ensure = (k: string) => {
      if (!map.has(k)) map.set(k, { tickets: 0, manualIncome: 0, expenses: 0, refunds: 0 });
      return map.get(k)!;
    };
    for (const r of regs) {
      const row = ensure(monthKey(r.created_at));
      if (r.status === "confirmed") row.tickets += r.amount_paid_cents;
      else if (r.status === "refunded") {
        // Collected first, then returned — count both sides.
        row.tickets += r.amount_paid_cents;
        row.refunds += r.amount_paid_cents;
      }
    }
    for (const e of entries) {
      const row = ensure(monthKey(e.entry_date));
      if (e.kind === "income") row.manualIncome += e.amount_cents;
      else row.expenses += e.amount_cents;
    }
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([k, v]) => ({ month: k, ...v, net: v.tickets + v.manualIncome - v.refunds - v.expenses }));
  }, [regs, entries]);

  const totals = useMemo(() => {
    // Refunded money was collected first, then returned — count both sides.
    const collected = regs.reduce((s, r) => s + r.amount_paid_cents, 0);
    const refunds = regs.filter((r) => r.status === "refunded").reduce((s, r) => s + r.amount_paid_cents, 0);
    const discounts = regs.reduce((s, r) => s + r.discount_cents, 0);
    const manualIncome = entries.filter((e) => e.kind === "income").reduce((s, e) => s + e.amount_cents, 0);
    const expenses = entries.filter((e) => e.kind === "expense").reduce((s, e) => s + e.amount_cents, 0);
    return { collected, refunds, discounts, manualIncome, expenses, net: collected + manualIncome - refunds - expenses };
  }, [regs, entries]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!form.label.trim() || !Number.isFinite(amount) || amount <= 0) return toast.error("Enter a label and a valid amount");
    setSaving(true);
    const payload = {
      kind: form.kind,
      label: form.label.trim(),
      amount_cents: Math.round(amount * 100),
      entry_date: form.date || new Date().toISOString().slice(0, 10),
      event_id: form.event === "none" ? null : form.event,
      note: form.note.trim() || null,
    };
    const { error } = form.id
      ? await supabase.from("finance_entries").update(payload).eq("id", form.id)
      : await supabase.from("finance_entries").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Entry saved");
    setOpen(false);
    load();
  };

  const edit = (r: Entry) => {
    setForm({ id: r.id, kind: r.kind, label: r.label, amount: String(r.amount_cents / 100), date: r.entry_date, event: r.event_id ?? "none", note: r.note ?? "" });
    setOpen(true);
  };

  const remove = async (r: Entry) => {
    if (!window.confirm(`Delete "${r.label}"?`)) return;
    const { error } = await supabase.from("finance_entries").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Entry deleted");
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Link to="/admin/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Manage events
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="font-heading text-3xl">Finances</h1>
          <Button onClick={() => { setForm(empty); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add income / expense
          </Button>
        </div>

        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
              {[
                { label: "Ticket sales", value: aed(totals.collected) },
                { label: "Other income", value: aed(totals.manualIncome) },
                { label: "Discounts given", value: aed(totals.discounts) },
                { label: "Refunds", value: aed(totals.refunds) },
                { label: "Expenses", value: aed(totals.expenses) },
                { label: "Net", value: aed(totals.net) },
              ].map((c) => (
                <div key={c.label} className="rounded-lg border border-border p-4">
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="text-lg font-semibold mt-1">{c.value}</p>
                </div>
              ))}
            </div>

            <h2 className="font-heading text-xl mb-3">Per event</h2>
            {perEvent.length === 0 ? (
              <p className="text-muted-foreground mb-10">No paid event activity yet.</p>
            ) : (
              <div className="overflow-x-auto mb-10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="py-2 pr-3 font-medium">Event</th>
                      <th className="py-2 pr-3 font-medium">Tickets</th>
                      <th className="py-2 pr-3 font-medium">Collected</th>
                      <th className="py-2 pr-3 font-medium">Discounts</th>
                      <th className="py-2 pr-3 font-medium">Refunds</th>
                      <th className="py-2 pr-3 font-medium">Costs</th>
                      <th className="py-2 font-medium">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {perEvent.map((r) => (
                      <tr key={r.id}>
                        <td className="py-2 pr-3">{r.title}</td>
                        <td className="py-2 pr-3">{r.tickets}</td>
                        <td className="py-2 pr-3">{aed(r.collected)}</td>
                        <td className="py-2 pr-3">{aed(r.discounts)}</td>
                        <td className="py-2 pr-3">{aed(r.refunds)}</td>
                        <td className="py-2 pr-3">{aed(r.costs)}</td>
                        <td className="py-2 font-medium">{aed(r.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h2 className="font-heading text-xl mb-3">Monthly totals</h2>
            {monthly.length === 0 ? (
              <p className="text-muted-foreground mb-10">Nothing recorded yet.</p>
            ) : (
              <div className="overflow-x-auto mb-10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="py-2 pr-3 font-medium">Month</th>
                      <th className="py-2 pr-3 font-medium">Ticket sales</th>
                      <th className="py-2 pr-3 font-medium">Other income</th>
                      <th className="py-2 pr-3 font-medium">Refunds</th>
                      <th className="py-2 pr-3 font-medium">Expenses</th>
                      <th className="py-2 font-medium">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {monthly.map((m) => (
                      <tr key={m.month}>
                        <td className="py-2 pr-3">{monthLabel(m.month)}</td>
                        <td className="py-2 pr-3">{aed(m.tickets)}</td>
                        <td className="py-2 pr-3">{aed(m.manualIncome)}</td>
                        <td className="py-2 pr-3">{aed(m.refunds)}</td>
                        <td className="py-2 pr-3">{aed(m.expenses)}</td>
                        <td className="py-2 font-medium">{aed(m.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h2 className="font-heading text-xl mb-3">Manual entries</h2>
            {entries.length === 0 ? (
              <p className="text-muted-foreground">No manual income or expenses logged yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {entries.map((r) => (
                  <div key={r.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {r.label}{" "}
                        <span className={r.kind === "expense" ? "text-destructive" : "text-green-700"}>
                          {r.kind === "expense" ? "−" : "+"}
                          {aed(r.amount_cents)}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(`${r.entry_date}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        {r.event_id ? ` · ${eventTitle(r.event_id)}` : " · Not tied to an event"}
                      </p>
                      {r.note && <p className="text-xs text-muted-foreground mt-1">{r.note}</p>}
                    </div>
                    <div className="flex shrink-0">
                      <Button variant="ghost" size="icon" aria-label={`Edit ${r.label}`} onClick={() => edit(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Delete ${r.label}`} onClick={() => remove(r)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{form.id ? "Edit entry" : "Add income / expense"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={save} className="space-y-4">
              <div>
                <Label>Type</Label>
                <Select value={form.kind} onValueChange={(kind) => setForm({ ...form, kind })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fin-label">Label</Label>
                <Input id="fin-label" required maxLength={120} placeholder="e.g. Venue hire, Sponsorship" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="fin-amount">Amount (AED)</Label>
                  <Input id="fin-amount" type="number" required min={0.01} step={0.01} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="fin-date">Date</Label>
                  <Input id="fin-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Linked event (optional)</Label>
                <Select value={form.event} onValueChange={(event) => setForm({ ...form, event })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not tied to an event</SelectItem>
                    {events.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fin-note">Note (optional)</Label>
                <Textarea id="fin-note" rows={2} maxLength={500} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save entry
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
