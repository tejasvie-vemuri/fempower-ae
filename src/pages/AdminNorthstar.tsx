import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2, TrendingUp, Users, Sparkles, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  CartesianGrid,
} from "recharts";

type EngagementRow = {
  user_id: string;
  event_type: string;
  created_at: string;
};
type MemberRow = { user_id: string; status: string; approved_at: string | null; created_at: string };

const CONNECTION_TYPES = new Set([
  "event_rsvp",
  "circle_post",
  "circle_reply",
  "meetup_host",
  "meetup_rsvp",
  "learn_wing_completed",
  "directory_profile_viewed",
]);

const TYPE_LABELS: Record<string, string> = {
  event_rsvp: "Events",
  circle_post: "Circle posts",
  circle_reply: "Circle replies",
  meetup_host: "Meetup hosts",
  meetup_rsvp: "Meetup RSVPs",
  learn_wing_completed: "Learn completions",
  directory_profile_viewed: "Directory views",
  whatsapp_cta_click: "WhatsApp clicks",
  digest_click: "Digest clicks",
  intro_posted: "Intros posted",
};

// ISO week key `YYYY-Www` for a given date
function isoWeekKey(d: Date): string {
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function startOfIsoWeek(d: Date): Date {
  const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() - dayNum + 1);
  return dt;
}

const AdminNorthstar = () => {
  const [rangeWeeks, setRangeWeeks] = useState<number>(12);
  const [events, setEvents] = useState<EngagementRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const since = new Date();
      since.setUTCDate(since.getUTCDate() - rangeWeeks * 7 - 7);
      const [{ data: ev }, { data: mp }] = await Promise.all([
        supabase
          .from("engagement_events")
          .select("user_id, event_type, created_at")
          .gte("created_at", since.toISOString())
          .order("created_at", { ascending: false })
          .limit(50000),
        supabase
          .from("member_profiles")
          .select("user_id, status, approved_at, created_at"),
      ]);
      setEvents((ev ?? []) as EngagementRow[]);
      setMembers((mp ?? []) as MemberRow[]);
      setLoading(false);
    })();
  }, [rangeWeeks]);

  // WAM per week (last N weeks), plus breakdown by type
  const weeklyData = useMemo(() => {
    const buckets: Record<string, { week: string; wam: Set<string>; byType: Record<string, Set<string>> }> = {};
    const now = new Date();
    for (let i = rangeWeeks - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - i * 7);
      const key = isoWeekKey(d);
      buckets[key] = { week: key, wam: new Set(), byType: {} };
    }
    for (const ev of events) {
      if (!CONNECTION_TYPES.has(ev.event_type)) continue;
      const key = isoWeekKey(new Date(ev.created_at));
      const b = buckets[key];
      if (!b) continue;
      b.wam.add(ev.user_id);
      (b.byType[ev.event_type] ||= new Set()).add(ev.user_id);
    }
    return Object.values(buckets).map((b) => ({
      week: b.week.replace(/^\d{4}-/, ""),
      wam: b.wam.size,
      ...Object.fromEntries(Object.entries(b.byType).map(([k, v]) => [k, v.size])),
    }));
  }, [events, rangeWeeks]);

  const thisWeek = weeklyData[weeklyData.length - 1]?.wam ?? 0;
  const lastWeek = weeklyData[weeklyData.length - 2]?.wam ?? 0;
  const wowDelta = lastWeek === 0 ? (thisWeek > 0 ? 100 : 0) : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);

  // Type breakdown for latest week
  const latestBreakdown = useMemo(() => {
    const currentKey = isoWeekKey(new Date());
    const perType: Record<string, Set<string>> = {};
    for (const ev of events) {
      const key = isoWeekKey(new Date(ev.created_at));
      if (key !== currentKey) continue;
      if (!CONNECTION_TYPES.has(ev.event_type)) continue;
      (perType[ev.event_type] ||= new Set()).add(ev.user_id);
    }
    return Object.entries(perType)
      .map(([type, users]) => ({ type: TYPE_LABELS[type] ?? type, members: users.size }))
      .sort((a, b) => b.members - a.members);
  }, [events]);

  // Funnel (last 30 days)
  const funnel = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const signups = members.filter((m) => new Date(m.created_at).getTime() >= cutoff);
    const approved = signups.filter((m) => m.status === "approved" || m.status === "hidden");
    const approvedIds = new Set(approved.map((m) => m.user_id));
    const firstAction = new Set(
      events
        .filter((ev) => approvedIds.has(ev.user_id) && CONNECTION_TYPES.has(ev.event_type))
        .map((ev) => ev.user_id),
    );
    // W2 retention: acted in week of approval AND in following week
    const retained = new Set<string>();
    for (const m of approved) {
      if (!m.approved_at) continue;
      const approvedWeek = isoWeekKey(new Date(m.approved_at));
      const nextWeekDate = new Date(m.approved_at);
      nextWeekDate.setUTCDate(nextWeekDate.getUTCDate() + 7);
      const nextWeek = isoWeekKey(nextWeekDate);
      const acted = events.filter(
        (ev) => ev.user_id === m.user_id && CONNECTION_TYPES.has(ev.event_type),
      );
      const inW1 = acted.some((ev) => isoWeekKey(new Date(ev.created_at)) === approvedWeek);
      const inW2 = acted.some((ev) => isoWeekKey(new Date(ev.created_at)) === nextWeek);
      if (inW1 && inW2) retained.add(m.user_id);
    }
    return {
      signups: signups.length,
      approved: approved.length,
      firstAction: firstAction.size,
      retained: retained.size,
    };
  }, [members, events]);

  // Time-to-first-action median (last 30 days approvals)
  const ttfa = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentlyApproved = members.filter(
      (m) => m.approved_at && new Date(m.approved_at).getTime() >= cutoff,
    );
    const diffs: number[] = [];
    for (const m of recentlyApproved) {
      const first = events
        .filter((ev) => ev.user_id === m.user_id && CONNECTION_TYPES.has(ev.event_type))
        .map((ev) => new Date(ev.created_at).getTime())
        .filter((t) => m.approved_at && t >= new Date(m.approved_at).getTime())
        .sort((a, b) => a - b)[0];
      if (!first || !m.approved_at) continue;
      diffs.push(first - new Date(m.approved_at).getTime());
    }
    if (!diffs.length) return null;
    diffs.sort((a, b) => a - b);
    const median = diffs[Math.floor(diffs.length / 2)];
    const hours = median / (1000 * 60 * 60);
    if (hours < 48) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  }, [members, events]);

  return (
    <>
      <Helmet>
        <title>Northstar dashboard — Fempower Admin</title>
      </Helmet>
      <Header />
      <main className="pt-24 pb-20 min-h-screen bg-background">
        <div className="container max-w-6xl">
          <Link
            to="/admin/members"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft size={12} /> Admin
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <p className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark mb-2">
                Northstar
              </p>
              <h1 className="font-heading text-3xl md:text-4xl text-foreground">
                Weekly connection-active members
              </h1>
              <p className="text-muted-foreground font-body mt-1 max-w-2xl">
                A member is <strong className="text-foreground">connection-active</strong> in a week if she does ≥1 of: RSVP an event, post/reply in the Circle, RSVP or host a meetup, complete a Learn wing, or open a Directory profile.
              </p>
            </div>
            <Select value={String(rangeWeeks)} onValueChange={(v) => setRangeWeeks(Number(v))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">Last 4 weeks</SelectItem>
                <SelectItem value="8">Last 8 weeks</SelectItem>
                <SelectItem value="12">Last 12 weeks</SelectItem>
                <SelectItem value="26">Last 26 weeks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="This week WAM"
                  value={thisWeek}
                  delta={wowDelta}
                  icon={<Sparkles size={18} className="text-blush-dark" />}
                />
                <StatCard
                  label="Last week WAM"
                  value={lastWeek}
                  icon={<Users size={18} className="text-blush-dark" />}
                />
                <StatCard
                  label="Time-to-first-action"
                  value={ttfa ?? "—"}
                  icon={<TrendingUp size={18} className="text-blush-dark" />}
                  subtle="median, last 30 days"
                />
                <StatCard
                  label="W2 retention (30d)"
                  value={
                    funnel.approved
                      ? `${Math.round((funnel.retained / funnel.approved) * 100)}%`
                      : "—"
                  }
                  subtle={`${funnel.retained}/${funnel.approved} approved`}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-xl">WAM trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer>
                      <LineChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EDE4D8" />
                        <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="wam" stroke="#4A2040" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-xl">This week by pillar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {latestBreakdown.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No activity yet this week — the digest and intro rituals will start seeding this chart.
                      </p>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer>
                          <BarChart data={latestBreakdown} layout="vertical" margin={{ left: 40 }}>
                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                            <YAxis dataKey="type" type="category" width={130} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="members" fill="#D4A853" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-xl">Onboarding funnel (30 days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FunnelRow label="Signed up" value={funnel.signups} total={funnel.signups} />
                    <FunnelRow label="Approved" value={funnel.approved} total={funnel.signups} />
                    <FunnelRow label="First connection action" value={funnel.firstAction} total={funnel.approved} />
                    <FunnelRow label="Came back the following week" value={funnel.retained} total={funnel.approved} />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

const StatCard = ({
  label,
  value,
  delta,
  icon,
  subtle,
}: {
  label: string;
  value: string | number;
  delta?: number;
  icon?: React.ReactNode;
  subtle?: string;
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        {icon}
      </div>
      <div className="flex items-baseline gap-2">
        <p className="font-heading text-3xl text-foreground">{value}</p>
        {typeof delta === "number" && (
          <Badge variant={delta >= 0 ? "secondary" : "destructive"}>
            {delta >= 0 ? "+" : ""}
            {delta}%
          </Badge>
        )}
      </div>
      {subtle && <p className="text-xs text-muted-foreground mt-1">{subtle}</p>}
    </CardContent>
  </Card>
);

const FunnelRow = ({ label, value, total }: { label: string; value: number; total: number }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground font-mono">
          {value} <span className="text-xs">({pct}%)</span>
        </p>
      </div>
      <div className="h-2 rounded-full bg-blush-light overflow-hidden">
        <div
          className="h-full bg-blush-dark transition-all"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
};

export default AdminNorthstar;
