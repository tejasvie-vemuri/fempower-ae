import { useMemo, useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Copy, Check, ExternalLink } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TRY_CHECKLISTS, tryUrl } from "@/lib/zaraChecklists";

/**
 * The WhatsApp broadcast kit.
 *
 * Zara's fastest distribution channel is the community that already exists, so
 * this page holds one ready-to-send message per checklist — framed as a gift,
 * not a feature push — with a copy button and the tracked share link. Send one
 * per week to avoid fatigue.
 */

type Draft = {
  id: string;
  title: string;
  when: string;
  body: string;
};

function buildDrafts(): Draft[] {
  const week = ["Week 1", "Week 2", "Week 3", "Week 4"];
  return TRY_CHECKLISTS.map((c, i) => ({
    id: c.slug,
    title: c.label,
    when: week[i] ?? `Week ${i + 1}`,
    body: [
      `${c.hook}`,
      "",
      `We built something for you. ${c.subhook}`,
      "",
      `${c.questionCount} questions, about ${c.minutes} minutes. Free, private, nothing saved unless you ask for it.`,
      "",
      `${tryUrl(c.slug)}?ref=whatsapp-broadcast`,
      "",
      "— Fempower 💜",
    ].join("\n"),
  }));
}

const INTRO: Draft = {
  id: "intro",
  title: "Opening message (send first)",
  when: "Week 0",
  body: [
    "Something new for you, and it costs nothing.",
    "",
    "Meet Zara — a private space to think out loud about the things you don't have anyone neutral to ask about: the raise you keep postponing, the visa admin nobody costed in, the weeks where \"I'm fine\" is a reflex.",
    "",
    "She's free, she's built for women living in the UAE, and there's no signup.",
    "",
    `${"https://fempowerae.com/ai-coach-for-women-uae"}?ref=whatsapp-broadcast`,
    "",
    "Over the next few weeks we'll send you one short guided check-in at a time. No pressure to do any of them.",
    "",
    "— Fempower 💜",
  ].join("\n"),
};

const AdminZaraBroadcast = () => {
  const drafts = useMemo(() => [INTRO, ...buildDrafts()], []);
  const [copied, setCopied] = useState<string | null>(null);
  const [stats, setStats] = useState<{ started: number; shared: number } | null>(null);

  useEffect(() => {
    (async () => {
      const since = new Date();
      since.setUTCDate(since.getUTCDate() - 30);
      const { data } = await supabase
        .from("engagement_events")
        .select("event_type")
        .in("event_type", ["zara_checklist_started", "zara_share_click"])
        .gte("created_at", since.toISOString())
        .limit(10000);
      setStats({
        started: (data ?? []).filter((r) => r.event_type === "zara_checklist_started").length,
        shared: (data ?? []).filter((r) => r.event_type === "zara_share_click").length,
      });
    })();
  }, []);

  const copy = async (draft: Draft) => {
    try {
      await navigator.clipboard.writeText(draft.body);
      setCopied(draft.id);
      toast.success("Copied — paste into your WhatsApp broadcast");
      setTimeout(() => setCopied((c) => (c === draft.id ? null : c)), 2000);
    } catch {
      toast.error("Could not copy — select the text and copy manually");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Zara broadcast kit — Fempower admin</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Header />

      <main className="container max-w-3xl py-12">
        <h1 className="font-heading text-3xl text-foreground">Zara WhatsApp broadcast kit</h1>
        <p className="mt-3 font-body text-sm text-muted-foreground leading-relaxed">
          One ready-to-send message per week. Frame it as a gift, not a feature push, and send
          one checklist at a time so the community doesn't tune out. Every link carries
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">?ref=whatsapp-broadcast</code>
          so you can see which sends actually convert.
        </p>

        {stats && (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/70 px-5 py-4">
              <p className="font-heading text-2xl text-foreground">{stats.started}</p>
              <p className="font-body text-xs text-muted-foreground">
                Checklists started · last 30 days
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 px-5 py-4">
              <p className="font-heading text-2xl text-foreground">{stats.shared}</p>
              <p className="font-body text-xs text-muted-foreground">
                "Send to a friend" taps · last 30 days
              </p>
            </div>
          </div>
        )}

        <div className="mt-10 space-y-6">
          {drafts.map((d) => (
            <section key={d.id} className="rounded-2xl border border-border/70 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-widest font-body text-muted-foreground">
                    {d.when}
                  </p>
                  <h2 className="font-heading text-xl text-foreground">{d.title}</h2>
                </div>
                <Button size="sm" variant="outline" onClick={() => copy(d)}>
                  {copied === d.id ? <Check size={14} /> : <Copy size={14} />}
                  <span className="ml-2">{copied === d.id ? "Copied" : "Copy message"}</span>
                </Button>
              </div>
              <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-muted/60 p-4 font-body text-sm leading-relaxed text-foreground/90">
                {d.body}
              </pre>
              {d.id !== "intro" && (
                <a
                  href={`/try/${d.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 font-body text-xs underline underline-offset-2 text-muted-foreground"
                >
                  Preview the landing page <ExternalLink size={12} />
                </a>
              )}
            </section>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminZaraBroadcast;
