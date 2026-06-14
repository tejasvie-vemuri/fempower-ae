import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  parseQuestions,
  DEFAULT_ATTENDEE_QUESTIONS,
  DEFAULT_ATTENDEE_QUESTION_IDS,
  type AttendeeQuestion,
} from "@/lib/attendeeQuestions";

interface EventRow {
  id: string;
  title: string;
  slug: string;
  starts_at: string;
  attendee_questions: unknown;
}

interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  ticket_code: string;
  amount_paid_cents: number;
  currency: string;
  checked_in_at: string | null;
  created_at: string;
  responses: Record<string, unknown> | null;
  quantity: number | null;
  guests: Array<{ name?: string; email?: string }> | null;
  payment_provider: string | null;
}

interface Profile {
  user_id: string;
  name: string | null;
  email: string;
  phone: string | null;
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

const statusColor = (s: string) =>
  s === "confirmed"
    ? "bg-primary/10 text-primary"
    : s === "refunded"
      ? "bg-amber-100 text-amber-800"
      : s === "cancelled"
        ? "bg-rose-100 text-rose-800"
        : "bg-muted text-foreground/70";

const AdminAllRegistrations = () => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: evs, error: evErr }, { data: rs, error: rErr }] =
        await Promise.all([
          supabase
            .from("events")
            .select("id, title, slug, starts_at, attendee_questions")
            .order("starts_at", { ascending: false }),
          supabase
            .from("registrations")
            .select(
              "id, event_id, user_id, status, ticket_code, amount_paid_cents, currency, checked_in_at, created_at, responses, quantity, guests, payment_provider",
            )
            .order("created_at", { ascending: false }),
        ]);
      if (evErr) toast.error(evErr.message);
      if (rErr) toast.error(rErr.message);
      const eventRows = (evs as EventRow[]) ?? [];
      const regRows = (rs as Registration[]) ?? [];
      setEvents(eventRows);
      setRegs(regRows);

      const userIds = Array.from(new Set(regRows.map((r) => r.user_id)));
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
    load();
  }, []);

  const eventsById = useMemo(() => {
    const m: Record<string, EventRow> = {};
    events.forEach((e) => {
      m[e.id] = e;
    });
    return m;
  }, [events]);

  // Per-event question list (defaults + custom) so we can label answers.
  const questionsByEvent = useMemo(() => {
    const m: Record<string, AttendeeQuestion[]> = {};
    events.forEach((e) => {
      const custom = parseQuestions(e.attendee_questions).filter(
        (q) => !DEFAULT_ATTENDEE_QUESTION_IDS.has(q.id),
      );
      m[e.id] = [...DEFAULT_ATTENDEE_QUESTIONS, ...custom];
    });
    return m;
  }, [events]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return regs.filter((r) => {
      if (eventFilter !== "all" && r.event_id !== eventFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      const p = profiles[r.user_id];
      const ev = eventsById[r.event_id];
      return (
        r.ticket_code.toLowerCase().includes(q) ||
        p?.email?.toLowerCase().includes(q) ||
        p?.name?.toLowerCase().includes(q) ||
        p?.phone?.toLowerCase().includes(q) ||
        ev?.title?.toLowerCase().includes(q)
      );
    });
  }, [regs, eventFilter, statusFilter, query, profiles, eventsById]);

  const stats = useMemo(() => {
    const seats = (r: Registration) => r.quantity ?? 1;
    const confirmed = filtered
      .filter((r) => r.status === "confirmed")
      .reduce((a, r) => a + seats(r), 0);
    const pending = filtered.filter((r) => r.status === "pending").length;
    const refunded = filtered.filter((r) => r.status === "refunded").length;
    return { total: filtered.length, confirmed, pending, refunded };
  }, [filtered]);

  const exportCsv = () => {
    // Build column list: base + union of all default question labels + per-row custom answers go in a single JSON column.
    const baseHeaders = [
      "Event",
      "Event date",
      "Name",
      "Email",
      "Phone",
      "Status",
      "Ticket code",
      "Seats",
      "Amount",
      "Currency",
      "Checked in",
      "Registered at",
    ];
    const defaultHeaders = DEFAULT_ATTENDEE_QUESTIONS.map((q) => q.label);
    const rows = [
      [...baseHeaders, ...defaultHeaders, "Other answers (JSON)", "Guests"],
      ...filtered.map((r) => {
        const p = profiles[r.user_id];
        const ev = eventsById[r.event_id];
        const answers = (r.responses ?? {}) as Record<string, unknown>;
        const customAnswers: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(answers)) {
          if (!DEFAULT_ATTENDEE_QUESTION_IDS.has(k)) customAnswers[k] = v;
        }
        const guestsText = Array.isArray(r.guests)
          ? r.guests
              .map((g) =>
                g?.email ? `${g?.name ?? ""} <${g.email}>` : g?.name ?? "",
              )
              .filter(Boolean)
              .join("; ")
          : "";
        return [
          ev?.title ?? "",
          ev?.starts_at ?? "",
          p?.name ?? "",
          p?.email ?? "",
          p?.phone ?? "",
          r.status,
          r.ticket_code,
          String(r.quantity ?? 1),
          (r.amount_paid_cents / 100).toFixed(2),
          r.currency,
          r.checked_in_at ?? "",
          r.created_at,
          ...DEFAULT_ATTENDEE_QUESTIONS.map((q) => {
            const v = answers[q.id];
            return v == null ? "" : String(v);
          }),
          Object.keys(customAnswers).length ? JSON.stringify(customAnswers) : "",
          guestsText,
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
    a.download = `all-registrations.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggle = (id: string) =>
    setExpanded((p) => ({ ...p, [id]: !p[id] }));

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
              All registrations
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Every attendee across every event — including their answers to
              the registration questions.
            </p>
          </div>
          <Button onClick={exportCsv} variant="outline" disabled={!filtered.length}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total (filter)", value: stats.total },
            { label: "Confirmed seats", value: stats.confirmed },
            { label: "Pending", value: stats.pending },
            { label: "Refunded", value: stats.refunded },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {s.label}
              </div>
              <div className="font-heading text-2xl text-primary mt-1">
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_180px] gap-3 mb-4">
          <Input
            placeholder="Search by name, email, phone, ticket or event…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No registrations match the current filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Attendee</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const p = profiles[r.user_id];
                  const ev = eventsById[r.event_id];
                  const qs = questionsByEvent[r.event_id] ?? DEFAULT_ATTENDEE_QUESTIONS;
                  const isOpen = !!expanded[r.id];
                  const answers = (r.responses ?? {}) as Record<string, unknown>;
                  return (
                    <>
                      <TableRow
                        key={r.id}
                        className="cursor-pointer"
                        onClick={() => toggle(r.id)}
                      >
                        <TableCell className="align-top">
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="align-top font-medium">
                          <div>{p?.name ?? "—"}</div>
                          <div className="text-xs font-normal text-muted-foreground">
                            {p?.email ?? "—"}
                            {p?.phone ? ` · ${p.phone}` : ""}
                          </div>
                          {(r.quantity ?? 1) > 1 && (
                            <span className="mt-1 inline-block text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                              +{(r.quantity ?? 1) - 1} guest
                              {(r.quantity ?? 1) - 1 === 1 ? "" : "s"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex items-center gap-1">
                            <span className="text-sm">{ev?.title ?? "—"}</span>
                            {ev && (
                              <Link
                                to={`/admin/events/${ev.id}/registrations`}
                                onClick={(e) => e.stopPropagation()}
                                title="Open event registrations"
                                className="text-muted-foreground hover:text-primary"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {fmtDate(ev?.starts_at ?? null)}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <span
                            className={`text-xs uppercase tracking-wide px-2 py-1 rounded inline-block ${statusColor(r.status)}`}
                          >
                            {r.status}
                          </span>
                        </TableCell>
                        <TableCell className="align-top">
                          {r.amount_paid_cents === 0
                            ? "Free"
                            : `${r.currency} ${(r.amount_paid_cents / 100).toFixed(2)}`}
                        </TableCell>
                        <TableCell className="align-top text-xs text-muted-foreground">
                          {fmtDate(r.created_at)}
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow key={`${r.id}-detail`} className="bg-muted/30">
                          <TableCell />
                          <TableCell colSpan={5}>
                            <div className="py-2 space-y-3">
                              <div>
                                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                                  Registration answers
                                </div>
                                {qs.length === 0 ? (
                                  <div className="text-xs text-muted-foreground">
                                    No questions configured.
                                  </div>
                                ) : (
                                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                    {qs.map((q) => {
                                      const v = answers[q.id];
                                      return (
                                        <div key={q.id}>
                                          <dt className="text-xs text-muted-foreground">
                                            {q.label}
                                          </dt>
                                          <dd className="text-foreground/90">
                                            {v == null || v === "" ? (
                                              <span className="text-muted-foreground italic">
                                                —
                                              </span>
                                            ) : (
                                              String(v)
                                            )}
                                          </dd>
                                        </div>
                                      );
                                    })}
                                  </dl>
                                )}
                              </div>
                              {Array.isArray(r.guests) && r.guests.length > 0 && (
                                <div>
                                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                                    Guests
                                  </div>
                                  <ul className="text-sm list-disc pl-5">
                                    {r.guests.map((g, i) => (
                                      <li key={i}>
                                        {g?.name ?? "—"}
                                        {g?.email ? ` · ${g.email}` : ""}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                Ticket: <span className="font-mono">{r.ticket_code}</span>
                                {r.payment_provider
                                  ? ` · Payment: ${r.payment_provider}`
                                  : ""}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
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

export default AdminAllRegistrations;
