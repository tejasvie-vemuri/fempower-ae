import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Check, Download, Loader2, Undo2 } from "lucide-react";

interface Registration {
  id: string;
  user_id: string;
  status: string;
  ticket_code: string;
  amount_paid_cents: number;
  currency: string;
  checked_in_at: string | null;
  created_at: string;
  stripe_payment_intent_id: string | null;
}

interface Profile {
  user_id: string;
  name: string | null;
  email: string;
  phone: string | null;
}

interface EventInfo {
  id: string;
  title: string;
  slug: string;
  starts_at: string;
  capacity: number;
}

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const AdminRegistrations = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    if (!eventId) return;
    setLoading(true);
    const [{ data: ev }, { data: regsData, error }] = await Promise.all([
      supabase
        .from("events")
        .select("id, title, slug, starts_at, capacity")
        .eq("id", eventId)
        .maybeSingle(),
      supabase
        .from("registrations")
        .select(
          "id, user_id, status, ticket_code, amount_paid_cents, currency, checked_in_at, created_at, stripe_payment_intent_id",
        )
        .eq("event_id", eventId)
        .order("created_at", { ascending: false }),
    ]);
    if (error) toast.error(error.message);
    setEvent(ev as EventInfo | null);
    const rows = (regsData as Registration[]) ?? [];
    setRegs(rows);

    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, name, email, phone")
        .in("user_id", userIds);
      const map: Record<string, Profile> = {};
      (profs as Profile[] | null)?.forEach((p) => {
        map[p.user_id] = p;
      });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return regs;
    return regs.filter((r) => {
      const p = profiles[r.user_id];
      return (
        r.ticket_code.toLowerCase().includes(q) ||
        p?.email?.toLowerCase().includes(q) ||
        p?.name?.toLowerCase().includes(q) ||
        p?.phone?.toLowerCase().includes(q)
      );
    });
  }, [regs, profiles, query]);

  const stats = useMemo(() => {
    const confirmed = regs.filter((r) => r.status === "confirmed").length;
    const checkedIn = regs.filter((r) => !!r.checked_in_at).length;
    const pending = regs.filter((r) => r.status === "pending").length;
    return { confirmed, checkedIn, pending };
  }, [regs]);

  const toggleCheckIn = async (r: Registration) => {
    setBusyId(r.id);
    const next = r.checked_in_at ? null : new Date().toISOString();
    const { error } = await supabase
      .from("registrations")
      .update({ checked_in_at: next })
      .eq("id", r.id);
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(next ? "Checked in" : "Check-in undone");
    setRegs((prev) =>
      prev.map((x) => (x.id === r.id ? { ...x, checked_in_at: next } : x)),
    );
  };

  const exportCsv = () => {
    const rows = [
      [
        "Name",
        "Email",
        "Phone",
        "Status",
        "Ticket code",
        "Amount",
        "Currency",
        "Checked in",
        "Registered at",
        "Payment intent",
      ],
      ...filtered.map((r) => {
        const p = profiles[r.user_id];
        return [
          p?.name ?? "",
          p?.email ?? "",
          p?.phone ?? "",
          r.status,
          r.ticket_code,
          (r.amount_paid_cents / 100).toFixed(2),
          r.currency,
          r.checked_in_at ?? "",
          r.created_at,
          r.stripe_payment_intent_id ?? "",
        ];
      }),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const s = String(cell ?? "");
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event?.slug ?? "event"}-registrations.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <Link
          to="/admin/events"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to events
        </Link>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl text-primary">
              {event?.title ?? "Registrations"}
            </h1>
            {event && (
              <p className="text-muted-foreground text-sm mt-1">
                {fmtDate(event.starts_at)} ·{" "}
                {event.capacity === 0 ? "Unlimited capacity" : `${event.capacity} seats`}
              </p>
            )}
          </div>
          <Button onClick={exportCsv} variant="outline" disabled={!regs.length}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Confirmed", value: stats.confirmed },
            { label: "Checked in", value: stats.checkedIn },
            { label: "Pending", value: stats.pending },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {s.label}
              </div>
              <div className="font-heading text-2xl text-primary mt-1">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <Input
            placeholder="Search by name, email, phone or ticket code"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              {regs.length === 0 ? "No registrations yet." : "No matches."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Attendee</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead className="text-right">Check-in</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const p = profiles[r.user_id];
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {p?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{p?.email ?? "—"}</div>
                        {p?.phone && (
                          <div className="text-muted-foreground">{p.phone}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs uppercase tracking-wide px-2 py-1 rounded ${
                            r.status === "confirmed"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted"
                          }`}
                        >
                          {r.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {r.amount_paid_cents === 0
                          ? "Free"
                          : `${r.currency} ${(r.amount_paid_cents / 100).toFixed(2)}`}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.ticket_code}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.status === "confirmed" ? (
                          <Button
                            size="sm"
                            variant={r.checked_in_at ? "outline" : "default"}
                            onClick={() => toggleCheckIn(r)}
                            disabled={busyId === r.id}
                          >
                            {busyId === r.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : r.checked_in_at ? (
                              <>
                                <Undo2 className="h-3 w-3 mr-1" /> Undo
                              </>
                            ) : (
                              <>
                                <Check className="h-3 w-3 mr-1" /> Check in
                              </>
                            )}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminRegistrations;
