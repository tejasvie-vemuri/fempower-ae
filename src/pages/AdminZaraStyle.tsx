import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Loader2, Play, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Zara's style lab.
 *
 * Three jobs on one page: edit the style rule sets, A/B them against each
 * other with the anti-slop test harness, and read which rules are actually
 * firing on live conversations.
 */

type Ruleset = {
  id: string;
  name: string;
  slug: string;
  rules: string;
  notes: string | null;
  is_active: boolean;
  traffic_weight: number;
  is_control: boolean;
};

type Violation = { rule: string; label: string; weight: number; detail: string };

type CaseResult = {
  case_key: string;
  label: string;
  trap: string;
  user_message: string;
  reply: string;
  score: number;
  violations: Violation[];
  checks: Record<string, string>;
};

type LogRow = {
  id: string;
  ruleset_slug: string | null;
  source: string;
  case_key: string | null;
  user_message: string | null;
  reply: string | null;
  score: number;
  violations: Violation[];
  created_at: string;
};

function scoreTone(score: number) {
  if (score >= 85) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (score >= 65) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-red-700 bg-red-50 border-red-200";
}

const AdminZaraStyle = () => {
  const [sets, setSets] = useState<Ruleset[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Record<string, CaseResult[]> | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);

  const loadSets = useCallback(async () => {
    const { data, error } = await supabase
      .from("coach_style_rulesets")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) toast.error(error.message);
    setSets((data ?? []) as Ruleset[]);
    setLoading(false);
  }, []);

  const loadLogs = useCallback(async () => {
    const { data, error } = await supabase
      .from("coach_slop_logs")
      .select("id, ruleset_slug, source, case_key, user_message, reply, score, violations, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) toast.error(error.message);
    setLogs((data ?? []) as unknown as LogRow[]);
  }, []);

  useEffect(() => {
    loadSets();
    loadLogs();
  }, [loadSets, loadLogs]);

  const update = (id: string, patch: Partial<Ruleset>) =>
    setSets((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const save = async (s: Ruleset) => {
    setSavingId(s.id);
    const { error } = await supabase
      .from("coach_style_rulesets")
      .update({
        name: s.name,
        rules: s.rules,
        notes: s.notes,
        is_active: s.is_active,
        traffic_weight: s.traffic_weight,
      })
      .eq("id", s.id);
    setSavingId(null);
    if (error) toast.error(error.message);
    else toast.success(`Saved "${s.name}"`);
  };

  const addSet = async () => {
    const stamp = Date.now().toString(36);
    const { error } = await supabase.from("coach_style_rulesets").insert({
      name: "New variant",
      slug: `variant-${stamp}`,
      rules: "### EXTRA STYLE OVERLAY (highest priority)\n- ",
      is_active: false,
      traffic_weight: 0,
    });
    if (error) toast.error(error.message);
    else { toast.success("Variant created"); loadSets(); }
  };

  const removeSet = async (s: Ruleset) => {
    if (s.is_control) { toast.error("The control ruleset can't be deleted."); return; }
    const { error } = await supabase.from("coach_style_rulesets").delete().eq("id", s.id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); loadSets(); }
  };

  const runHarness = async (slugs?: string[]) => {
    setRunning(true);
    setResults(null);
    const { data, error } = await supabase.functions.invoke("fempower-coach", {
      body: { mode: "eval", slugs: slugs ?? sets.filter((s) => s.is_active).map((s) => s.slug) },
    });
    setRunning(false);
    if (error) { toast.error(error.message); return; }
    if (data?.error) { toast.error(data.error); return; }
    setResults(data.results as Record<string, CaseResult[]>);
    toast.success("Harness finished");
    loadLogs();
  };

  const totalWeight = sets.filter((s) => s.is_active).reduce((a, s) => a + s.traffic_weight, 0);

  /** Which rules fire most often in production, last 100 responses. */
  const failureLeaderboard = useMemo(() => {
    const counts = new Map<string, { label: string; n: number }>();
    for (const l of logs) {
      for (const v of l.violations ?? []) {
        const prev = counts.get(v.rule);
        counts.set(v.rule, { label: v.label, n: (prev?.n ?? 0) + 1 });
      }
    }
    return [...counts.entries()].sort((a, b) => b[1].n - a[1].n);
  }, [logs]);

  const avgByRuleset = useMemo(() => {
    const acc = new Map<string, { sum: number; n: number }>();
    for (const l of logs) {
      const k = `${l.ruleset_slug ?? "none"} · ${l.source}`;
      const cur = acc.get(k) ?? { sum: 0, n: 0 };
      acc.set(k, { sum: cur.sum + l.score, n: cur.n + 1 });
    }
    return [...acc.entries()].map(([k, v]) => ({ key: k, avg: Math.round(v.sum / v.n), n: v.n }));
  }, [logs]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Zara Style Lab · Admin</title><meta name="robots" content="noindex" /></Helmet>
      <Header />
      <main className="container mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-serif text-3xl text-primary">Zara Style Lab</h1>
        <p className="mt-2 text-muted-foreground">
          Edit the anti-slop style rules, A/B two rule sets against the test harness, and see which
          rules are failing on live chats.
        </p>

        <Tabs defaultValue="rules" className="mt-8">
          <TabsList>
            <TabsTrigger value="rules">Rule sets</TabsTrigger>
            <TabsTrigger value="harness">Test harness</TabsTrigger>
            <TabsTrigger value="logs">Production logs</TabsTrigger>
          </TabsList>

          {/* ---------------- Rule sets ---------------- */}
          <TabsContent value="rules" className="space-y-6 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Active traffic weight total: <strong>{totalWeight}</strong>
                {totalWeight === 0 && " — no split configured, everyone gets the base prompt."}
              </p>
              <Button onClick={addSet} variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" /> New variant
              </Button>
            </div>

            {loading && <Loader2 className="h-5 w-5 animate-spin" />}

            {sets.map((s) => (
              <div key={s.id} className="rounded-xl border bg-card p-5 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    value={s.name}
                    onChange={(e) => update(s.id, { name: e.target.value })}
                    className="max-w-xs font-medium"
                  />
                  <Badge variant="secondary">{s.slug}</Badge>
                  {s.is_control && <Badge>control</Badge>}
                  <div className="ml-auto flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`a-${s.id}`} className="text-sm">Active</Label>
                      <Switch
                        id={`a-${s.id}`}
                        checked={s.is_active}
                        onCheckedChange={(v) => update(s.id, { is_active: v })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`w-${s.id}`} className="text-sm">Weight</Label>
                      <Input
                        id={`w-${s.id}`}
                        type="number"
                        min={0}
                        value={s.traffic_weight}
                        onChange={(e) => update(s.id, { traffic_weight: Number(e.target.value) || 0 })}
                        className="w-20"
                      />
                    </div>
                  </div>
                </div>

                <Textarea
                  value={s.rules}
                  onChange={(e) => update(s.id, { rules: e.target.value })}
                  rows={10}
                  placeholder="Leave empty to run the base system prompt unchanged (control)."
                  className="font-mono text-xs"
                />
                <Input
                  value={s.notes ?? ""}
                  onChange={(e) => update(s.id, { notes: e.target.value })}
                  placeholder="What is this variant testing?"
                />

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => save(s)} disabled={savingId === s.id}>
                    {savingId === s.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => runHarness([s.slug])} disabled={running}>
                    <Play className="mr-2 h-4 w-4" /> Run harness on this set
                  </Button>
                  {!s.is_control && (
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeSet(s)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* ---------------- Harness ---------------- */}
          <TabsContent value="harness" className="space-y-6 pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => runHarness()} disabled={running}>
                {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                Run all active rule sets
              </Button>
              <p className="text-sm text-muted-foreground">
                Eight example chats, each built to bait a specific slop tell. Higher score is better.
              </p>
            </div>

            {results && Object.entries(results).map(([slug, rows]) => {
              const avg = Math.round(rows.reduce((a, r) => a + r.score, 0) / (rows.length || 1));
              return (
                <div key={slug} className="rounded-xl border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-xl text-primary">{slug}</h2>
                    <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${scoreTone(avg)}`}>
                      avg {avg}/100
                    </span>
                  </div>
                  <div className="mt-4 space-y-4">
                    {rows.map((r) => (
                      <details key={r.case_key} className="rounded-lg border bg-background p-3">
                        <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                          <span className="font-medium">{r.label}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${scoreTone(r.score)}`}>
                            {r.score}
                          </span>
                        </summary>
                        <p className="mt-2 text-xs text-muted-foreground">Trap: {r.trap}</p>
                        <p className="mt-2 text-xs"><strong>Her:</strong> {r.user_message}</p>
                        <p className="mt-2 whitespace-pre-wrap text-xs"><strong>Zara:</strong> {r.reply}</p>
                        {r.violations.length > 0 && (
                          <ul className="mt-3 space-y-1">
                            {r.violations.map((v) => (
                              <li key={v.rule} className="text-xs text-red-700">
                                <strong>{v.rule}</strong> · {v.label} (−{v.weight}) — {v.detail}
                              </li>
                            ))}
                          </ul>
                        )}
                      </details>
                    ))}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          {/* ---------------- Logs ---------------- */}
          <TabsContent value="logs" className="space-y-6 pt-6">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={loadLogs}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
              <span className="text-sm text-muted-foreground">Last {logs.length} scored responses</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border bg-card p-4">
                <h3 className="font-medium">Average score</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {avgByRuleset.map((r) => (
                    <li key={r.key} className="flex justify-between">
                      <span className="text-muted-foreground">{r.key}</span>
                      <span className="font-semibold">{r.avg} <span className="text-xs text-muted-foreground">({r.n})</span></span>
                    </li>
                  ))}
                  {!avgByRuleset.length && <li className="text-sm text-muted-foreground">No data yet.</li>}
                </ul>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <h3 className="font-medium">Rules firing most</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {failureLeaderboard.map(([rule, v]) => (
                    <li key={rule} className="flex justify-between">
                      <span className="text-muted-foreground">{rule} · {v.label}</span>
                      <span className="font-semibold">{v.n}</span>
                    </li>
                  ))}
                  {!failureLeaderboard.length && <li className="text-sm text-muted-foreground">Nothing fired — clean run.</li>}
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              {logs.map((l) => (
                <details key={l.id} className="rounded-lg border bg-card p-3">
                  <summary className="flex cursor-pointer flex-wrap items-center gap-2 text-sm">
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${scoreTone(l.score)}`}>{l.score}</span>
                    <Badge variant="secondary">{l.ruleset_slug ?? "none"}</Badge>
                    <Badge variant="outline">{l.source}</Badge>
                    <span className="truncate text-muted-foreground">{l.user_message?.slice(0, 80)}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(l.created_at).toLocaleString()}
                    </span>
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap text-xs"><strong>Zara:</strong> {l.reply}</p>
                  {(l.violations ?? []).length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {l.violations.map((v) => (
                        <li key={v.rule} className="text-xs text-red-700">
                          <strong>{v.rule}</strong> · {v.label} (−{v.weight}) — {v.detail}
                        </li>
                      ))}
                    </ul>
                  )}
                </details>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default AdminZaraStyle;
