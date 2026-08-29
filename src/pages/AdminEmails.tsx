import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Info, Loader2, RefreshCw } from "lucide-react";

const PAGE_SIZE = 50;
const DEFAULT_TEMPLATE = "profile-completion-reminder";

interface LogRow {
  id: string;
  message_id: string | null;
  template_name: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

interface SuppressedRow {
  id: string;
  email: string;
  reason: string;
  created_at: string;
}

type RangeKey = "24h" | "7d" | "30d" | "all" | "custom";

const RANGE_LABELS: Record<Exclude<RangeKey, "custom">, string> = {
  "24h": "Last 24h",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
};

function rangeStart(range: RangeKey, customFrom: string): Date | null {
  const now = Date.now();
  if (range === "24h") return new Date(now - 24 * 3600 * 1000);
  if (range === "7d") return new Date(now - 7 * 24 * 3600 * 1000);
  if (range === "30d") return new Date(now - 30 * 24 * 3600 * 1000);
  if (range === "custom" && customFrom) return new Date(`${customFrom}T00:00:00`);
  return null;
}

const STATUS_STYLES: Record<string, string> = {
  sent: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  dlq: "bg-destructive/15 text-destructive border-destructive/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  bounced: "bg-destructive/15 text-destructive border-destructive/30",
  complained: "bg-destructive/15 text-destructive border-destructive/30",
  suppressed: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  pending: "bg-muted text-muted-foreground border-border",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={STATUS_STYLES[status] ?? STATUS_STYLES.pending}>
      {status === "dlq" ? "failed" : status}
    </Badge>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default function AdminEmails() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [suppressed, setSuppressed] = useState<SuppressedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [template, setTemplate] = useState<string>(DEFAULT_TEMPLATE);
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(0);

  const load = async () => {
    setLoading(true);
    const [logRes, supRes] = await Promise.all([
      supabase
        .from("email_send_log")
        .select("id, message_id, template_name, recipient_email, status, error_message, created_at")
        .order("created_at", { ascending: false })
        .limit(5000),
      supabase
        .from("suppressed_emails")
        .select("id, email, reason, created_at")
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);
    setRows((logRes.data as LogRow[]) ?? []);
    setSuppressed((supRes.data as SuppressedRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [range, customFrom, customTo, template, status]);

  const templates = useMemo(
    () => [...new Set(rows.map((r) => r.template_name))].sort(),
    [rows],
  );

  // One email produces several rows (pending -> sent/dlq) sharing a message_id.
  // Keep only the latest row per message_id so counts reflect real emails.
  const deduped = useMemo(() => {
    const latest = new Map<string, LogRow>();
    for (const r of rows) {
      const key = r.message_id ?? `id:${r.id}`;
      const prev = latest.get(key);
      if (!prev || new Date(r.created_at) > new Date(prev.created_at)) latest.set(key, r);
    }
    return [...latest.values()].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [rows]);

  const inRange = useMemo(() => {
    const from = rangeStart(range, customFrom);
    const to = range === "custom" && customTo ? new Date(`${customTo}T23:59:59`) : null;
    return deduped.filter((r) => {
      const t = new Date(r.created_at);
      if (from && t < from) return false;
      if (to && t > to) return false;
      if (template !== "all" && r.template_name !== template) return false;
      return true;
    });
  }, [deduped, range, customFrom, customTo, template]);

  const filtered = useMemo(() => {
    if (status === "all") return inRange;
    if (status === "failed") return inRange.filter((r) => ["dlq", "failed", "bounced", "complained"].includes(r.status));
    return inRange.filter((r) => r.status === status);
  }, [inRange, status]);

  const stats = useMemo(() => {
    const count = (fn: (r: LogRow) => boolean) => inRange.filter(fn).length;
    return {
      total: inRange.length,
      sent: count((r) => r.status === "sent"),
      failed: count((r) => ["dlq", "failed", "bounced", "complained"].includes(r.status)),
      suppressed: count((r) => r.status === "suppressed"),
      pending: count((r) => r.status === "pending"),
    };
  }, [inRange]);

  const suppressedInRange = useMemo(() => {
    const from = rangeStart(range, customFrom);
    const to = range === "custom" && customTo ? new Date(`${customTo}T23:59:59`) : null;
    return suppressed.filter((s) => {
      const t = new Date(s.created_at);
      if (from && t < from) return false;
      if (to && t > to) return false;
      return true;
    });
  }, [suppressed, range, customFrom, customTo]);

  const suppressionByReason = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of suppressedInRange) map.set(s.reason, (map.get(s.reason) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [suppressedInRange]);

  const deliveryRate = stats.total ? Math.round((stats.sent / stats.total) * 100) : 0;
  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to site
        </Link>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl">Email delivery</h1>
            <p className="text-sm text-muted-foreground">
              Delivery and suppression stats for profile-completion nudges and other transactional emails.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="flex flex-wrap items-end gap-4 pt-6">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(RANGE_LABELS) as Array<keyof typeof RANGE_LABELS>).map((key) => (
                <Button
                  key={key}
                  size="sm"
                  variant={range === key ? "default" : "outline"}
                  onClick={() => setRange(key)}
                >
                  {RANGE_LABELS[key]}
                </Button>
              ))}
              <Button size="sm" variant={range === "custom" ? "default" : "outline"} onClick={() => setRange("custom")}>
                Custom
              </Button>
            </div>

            {range === "custom" && (
              <div className="flex items-end gap-2">
                <div>
                  <Label className="text-xs">From</Label>
                  <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">To</Label>
                  <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
                </div>
              </div>
            )}

            <div className="min-w-[220px]">
              <Label className="text-xs">Email type</Label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All templates</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[160px]">
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed / bounced</SelectItem>
                  <SelectItem value="suppressed">Suppressed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatCard label="Unique emails" value={stats.total} />
          <StatCard label="Delivered" value={stats.sent} hint={`${deliveryRate}% delivery rate`} />
          <StatCard label="Failed / bounced" value={stats.failed} />
          <StatCard label="Suppressed" value={stats.suppressed} />
          <StatCard label="Pending" value={stats.pending} />
        </div>

        <div className="mb-6 flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Open and click tracking isn't recorded for these emails — transactional sends go out without
            tracking pixels or link rewriting, so no per-recipient open/click data exists. The numbers above
            are delivery outcomes from the send log. If you want open/click rates, we'd need to add tracked
            links (and disclose the tracking to members).
          </p>
        </div>

        {/* Suppression breakdown */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Suppression list ({suppressedInRange.length} in range)</CardTitle>
          </CardHeader>
          <CardContent>
            {suppressionByReason.length === 0 ? (
              <p className="text-sm text-muted-foreground">No suppressions in this period.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {suppressionByReason.map(([reason, n]) => (
                  <Badge key={reason} variant="outline" className="text-sm">
                    {reason}: {n}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-sm">
                  total suppressed (all time): {suppressed.length}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Log table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Email log ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">No emails match these filters.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Template</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent at</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pageRows.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="whitespace-nowrap text-sm">{r.template_name}</TableCell>
                          <TableCell className="text-sm">{r.recipient_email}</TableCell>
                          <TableCell><StatusBadge status={r.status} /></TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {new Date(r.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="max-w-[280px] truncate text-xs text-destructive">
                            {r.error_message ?? ""}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {pageCount > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Page {page + 1} of {pageCount}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= pageCount - 1}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
