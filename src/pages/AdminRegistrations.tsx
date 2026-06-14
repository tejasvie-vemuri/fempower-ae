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
import { ArrowLeft, Check, Download, Loader2, Undo2, RefreshCcw, UserPlus } from "lucide-react";
import {
  parseQuestions,
  type AttendeeQuestion,
} from "@/lib/attendeeQuestions";

interface WaitlistEntry {
  id: string;
  user_id: string;
  position: number;
  notified_at: string | null;
  created_at: string;
}

interface Registration {
  id: string;
  user_id: string;
  status: string;
  ticket_code: string;
  amount_paid_cents: number;
  currency: string;
  checked_in_at: string | null;
  created_at: string;
  payment_intent_id: string | null;
  payment_provider: string | null;
  stripe_payment_intent_id: string | null;
  cancellation_requested_at: string | null;
  cancellation_reason: string | null;
  responses: Record<string, unknown> | null;
  quantity: number | null;
  guests: Array<{ name?: string; email?: string }> | null;
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
  attendee_questions: unknown;
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
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);


  const load = async () => {
    if (!eventId) return;
    setLoading(true);
    const [{ data: ev }, { data: regsData, error }, { data: wl }] = await Promise.all([
      supabase
        .from("events")
        .select("id, title, slug, starts_at, capacity, attendee_questions")
        .eq("id", eventId)
        .maybeSingle(),
      supabase
        .from("registrations")
        .select(
          "id, user_id, status, ticket_code, amount_paid_cents, currency, checked_in_at, created_at, payment_intent_id, payment_provider, stripe_payment_intent_id, cancellation_requested_at, cancellation_reason, responses, quantity, guests",
        )
        .eq("event_id", eventId)
        .order("created_at", { ascending: false }),
      supabase
        .from("waitlist")
        .select("id, user_id, position, notified_at, created_at")
        .eq("event_id", eventId)
        .order("position", { ascending: true }),
    ]);
    if (error) toast.error(error.message);
    setEvent(ev as EventInfo | null);
    const rows = (regsData as Registration[]) ?? [];
    setRegs(rows);
    setWaitlist((wl as WaitlistEntry[]) ?? []);

    const userIds = Array.from(
      new Set([...rows.map((r) => r.user_id), ...((wl as WaitlistEntry[]) ?? []).map((w) => w.user_id)]),
    );
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
    const seats = (r: Registration) => r.quantity ?? 1;
    const confirmed = regs
      .filter((r) => r.status === "confirmed")
      .reduce((a, r) => a + seats(r), 0);
    const checkedIn = regs
      .filter((r) => !!r.checked_in_at)
      .reduce((a, r) => a + seats(r), 0);
    const pending = regs.filter((r) => r.status === "pending").length;
    return { confirmed, checkedIn, pending };
  }, [regs]);

  const questions: AttendeeQuestion[] = useMemo(
    () => parseQuestions(event?.attendee_questions),
    [event?.attendee_questions],
  );

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

  const refund = async (r: Registration) => {
    if (
      !confirm(
        `Refund ${r.currency} ${(r.amount_paid_cents / 100).toFixed(2)}? This will mark the ticket as refunded and free up a seat.`,
      )
    )
      return;
    setBusyId(r.id);
    const { data, error } = await supabase.functions.invoke("refund-registration", {
      body: { registration_id: r.id },
    });
    setBusyId(null);
    if (error || data?.error) {
      toast.error(error?.message ?? data?.error ?? "Refund failed");
      return;
    }
    if (data?.refunded) {
      toast.success("Refunded");
      setRegs((prev) =>
        prev.map((x) => (x.id === r.id ? { ...x, status: "refunded" } : x)),
      );
    } else {
      toast.success("Refund started");
    }
  };

  const promoteFromWaitlist = async (entry: WaitlistEntry) => {
    if (!confirm("Promote this person off the waitlist? They'll need to complete payment.")) return;
    setBusyId(entry.id);
    const { error: insErr } = await supabase
      .from("registrations")
      .insert({
        event_id: eventId!,
        user_id: entry.user_id,
        status: "pending",
        amount_paid_cents: 0,
        currency: event?.id ? "AED" : "AED",
      });
    if (insErr && !insErr.message.includes("duplicate")) {
      setBusyId(null);
      toast.error(insErr.message);
      return;
    }
    const { error: delErr } = await supabase.from("waitlist").delete().eq("id", entry.id);
    setBusyId(null);
    if (delErr) {
      toast.error(delErr.message);
      return;
    }
    toast.success("Promoted — share the event link with them to complete payment.");
    load();
  };

  const exportCsv = () => {
    const baseHeaders = [
      "Name",
      "Email",
      "Phone",
      "Status",
      "Ticket code",
      "Amount",
      "Currency",
      "Checked in",
      "Registered at",
      "Payment provider",
      "Payment intent",
      "Seats",
      "Guests",
    ];
    const questionHeaders = questions.map((q) => q.label);
    const rows = [
      [...baseHeaders, ...questionHeaders],
      ...filtered.map((r) => {
        const p = profiles[r.user_id];
        const answers = (r.responses ?? {}) as Record<string, unknown>;
        const guestsText = Array.isArray(r.guests)
          ? r.guests
              .map((g) => (g?.email ? `${g?.name ?? ""} <${g.email}>` : g?.name ?? ""))
              .filter(Boolean)
              .join("; ")
          : "";
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
          r.payment_provider ?? "",
          r.payment_intent_id ?? r.stripe_payment_intent_id ?? "",
          String(r.quantity ?? 1),
          guestsText,
          ...questions.map((q) => {
            const v = answers[q.id];
            return v == null ? "" : String(v);
          }),
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
            { label: "Confirmed seats", value: stats.confirmed },
            { label: "Checked-in seats", value: stats.checkedIn },
            { label: "Pending bookings", value: stats.pending },
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
                      <TableCell className="font-medium align-top">
                        <div className="flex items-center gap-2">
                          <span>{p?.name ?? "—"}</span>
                          {(r.quantity ?? 1) > 1 && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                              +{(r.quantity ?? 1) - 1}
                            </span>
                          )}
                        </div>
                        {Array.isArray(r.guests) && r.guests.length > 0 && (
                          <div className="mt-1 text-xs font-normal text-muted-foreground">
                            Guests: {r.guests.map((g) => g?.name).filter(Boolean).join(", ")}
                          </div>
                        )}
                        {questions.length > 0 && r.responses && (
                          <div className="mt-1 space-y-0.5 text-xs font-normal text-muted-foreground">
                            {questions.map((q) => {
                              const v = (r.responses as Record<string, unknown>)[q.id];
                              if (v == null || v === "") return null;
                              return (
                                <div key={q.id} className="truncate max-w-[220px]" title={`${q.label}: ${String(v)}`}>
                                  <span className="text-foreground/70">{q.label}:</span>{" "}
                                  {String(v)}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{p?.email ?? "—"}</div>
                        {p?.phone && (
                          <div className="text-muted-foreground">{p.phone}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span
                            className={`text-xs uppercase tracking-wide px-2 py-1 rounded inline-block w-fit ${
                              r.status === "confirmed"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted"
                            }`}
                          >
                            {r.status}
                          </span>
                          {r.cancellation_requested_at && r.status !== "refunded" && (
                            <span
                              className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded w-fit"
                              title={r.cancellation_reason ?? "No reason given"}
                            >
                              Cancellation requested
                            </span>
                          )}
                        </div>
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
                        <div className="flex justify-end items-center gap-1">
                          {r.status === "confirmed" && (
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
                          )}
                          {r.status === "confirmed" && r.amount_paid_cents > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => refund(r)}
                              disabled={busyId === r.id}
                              title="Refund"
                            >
                              <RefreshCcw className="h-3 w-3" />
                            </Button>
                          )}
                          {r.status === "refunded" && (
                            <span className="text-xs text-muted-foreground">Refunded</span>
                          )}
                          {r.status === "pending" && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {waitlist.length > 0 && (
          <div className="mt-10">
            <h2 className="font-heading text-2xl text-primary mb-4">
              Waitlist ({waitlist.length})
            </h2>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {waitlist.map((w) => {
                    const p = profiles[w.user_id];
                    return (
                      <TableRow key={w.id}>
                        <TableCell className="font-mono">{w.position}</TableCell>
                        <TableCell className="font-medium">{p?.name ?? "—"}</TableCell>
                        <TableCell className="text-sm">
                          <div>{p?.email ?? "—"}</div>
                          {p?.phone && (
                            <div className="text-muted-foreground">{p.phone}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {fmtDate(w.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => promoteFromWaitlist(w)}
                            disabled={busyId === w.id}
                          >
                            {busyId === w.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <UserPlus className="h-3 w-3 mr-1" /> Promote
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Promoting moves them off the waitlist and creates a pending ticket. Share the event link so they can complete payment. (Automated email notifications will be enabled once your sender domain is set up.)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRegistrations;
