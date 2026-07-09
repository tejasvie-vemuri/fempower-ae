import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Mic, Square, Feather } from "lucide-react";
import {
  isVoiceRecordingSupported,
  startVoiceRecording,
  stopVoiceRecording,
  transcribeAudio,
} from "@/lib/voiceRecording";

interface JournalEntry {
  id: string;
  entry_date: string;
  gratitude_text: string | null;
  learning_text: string | null;
  free_text: string | null;
  created_at: string;
}

const VoiceButton = ({ onTranscribed }: { onTranscribed: (text: string) => void }) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const handleClick = async () => {
    if (!isVoiceRecordingSupported()) {
      toast({ title: "Voice input isn't supported on this browser", variant: "destructive" });
      return;
    }
    if (isRecording) {
      setIsRecording(false);
      setTranscribing(true);
      try {
        const blob = await stopVoiceRecording();
        const text = await transcribeAudio(blob);
        if (text) onTranscribed(text);
        else toast({ title: "Didn't catch that, try again" });
      } catch (e) {
        toast({
          title: "Couldn't transcribe that",
          description: e instanceof Error ? e.message : "Try again in a moment.",
          variant: "destructive",
        });
      } finally {
        setTranscribing(false);
      }
    } else {
      try {
        await startVoiceRecording();
        setIsRecording(true);
      } catch {
        toast({ title: "Couldn't access your microphone", description: "Check your browser's permission settings.", variant: "destructive" });
      }
    }
  };

  return (
    <button
      type="button"
      aria-label={isRecording ? "Stop recording" : "Record voice note"}
      onClick={handleClick}
      disabled={transcribing}
      className={isRecording ? "text-destructive" : "text-muted-foreground hover:text-lifestyle-terracotta transition-colors"}
    >
      {transcribing ? (
        <Loader2 size={16} className="animate-spin" />
      ) : isRecording ? (
        <Square size={16} />
      ) : (
        <Mic size={16} />
      )}
    </button>
  );
};

const ThePause = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [gratitude, setGratitude] = useState("");
  const [learning, setLearning] = useState("");
  const [freeText, setFreeText] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false });
      setEntries(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  const saveEntry = async () => {
    if (!user) return;
    if (!gratitude.trim() && !learning.trim() && !freeText.trim()) {
      toast({ title: "Nothing to save yet", description: "Write a little, even one line is enough." });
      return;
    }
    setSaving(true);
    const { data, error } = await (supabase as any)
      .from("journal_entries")
      .insert({
        user_id: user.id,
        gratitude_text: gratitude.trim() || null,
        learning_text: learning.trim() || null,
        free_text: freeText.trim() || null,
      })
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save that", description: error.message, variant: "destructive" });
      return;
    }
    setEntries((prev) => [data, ...prev]);
    setGratitude("");
    setLearning("");
    setFreeText("");
    await (supabase as any)
      .from("journal_nudge_settings")
      .upsert(
        { user_id: user.id, last_entry_at: new Date().toISOString(), current_interval_days: 1, consecutive_misses: 0 },
        { onConflict: "user_id" }
      );
    toast({ title: "Saved, this is yours to keep." });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lifestyle-ivory">
        <Loader2 className="h-6 w-6 animate-spin text-lifestyle-terracotta" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-24 pb-20 min-h-screen bg-lifestyle-ivory">
        <div className="container max-w-2xl">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-body uppercase tracking-widest text-muted-foreground hover:text-lifestyle-espresso mb-6"
          >
            <ArrowLeft size={13} /> Home
          </Link>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-2 mb-1">
              <Feather size={18} className="text-lifestyle-sage" />
              <p className="text-xs font-body font-bold uppercase tracking-widest-xl text-lifestyle-sage">
                The Pause
              </p>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl text-lifestyle-espresso leading-tight mb-1">
              A minute for you, nobody else.
            </h1>
            <p className="text-muted-foreground font-body">
              This stays private. Write as little or as much as you want.
            </p>
          </motion.div>

          <Card className="mt-8 p-5 bg-card border-border space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-body uppercase tracking-widest text-muted-foreground">
                  What are you grateful for?
                </p>
                <VoiceButton onTranscribed={(text) => setGratitude((prev) => (prev ? `${prev} ${text}` : text))} />
              </div>
              <Textarea
                value={gratitude}
                onChange={(e) => setGratitude(e.target.value)}
                placeholder="Even something small counts"
                className="font-body min-h-[70px]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-body uppercase tracking-widest text-muted-foreground">
                  What's one thing you learned today?
                </p>
                <VoiceButton onTranscribed={(text) => setLearning((prev) => (prev ? `${prev} ${text}` : text))} />
              </div>
              <Textarea
                value={learning}
                onChange={(e) => setLearning(e.target.value)}
                placeholder="About work, about yourself, anything"
                className="font-body min-h-[70px]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-body uppercase tracking-widest text-muted-foreground">
                  Anything else on your mind?
                </p>
                <VoiceButton onTranscribed={(text) => setFreeText((prev) => (prev ? `${prev} ${text}` : text))} />
              </div>
              <Textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="Whatever it is, it belongs here"
                className="font-body min-h-[100px]"
              />
            </div>

            <Button
              onClick={saveEntry}
              disabled={saving}
              className="w-full bg-lifestyle-sage hover:bg-lifestyle-sage/90"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : "Save today's entry"}
            </Button>
          </Card>

          <div className="mt-10">
            <p className="font-body text-sm font-medium text-lifestyle-espresso mb-4">Looking back</p>
            {entries.length === 0 ? (
              <p className="text-center text-muted-foreground font-body py-10">
                Nothing written yet, your first entry will show up here.
              </p>
            ) : (
              <div className="space-y-4">
                {entries.map((e) => (
                  <div key={e.id} className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground font-body mb-2">
                      {new Date(e.entry_date).toLocaleDateString("en-AE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    {e.gratitude_text && (
                      <p className="font-body text-sm text-lifestyle-espresso mb-1">
                        <span className="text-lifestyle-gold font-medium">Grateful for </span>
                        {e.gratitude_text}
                      </p>
                    )}
                    {e.learning_text && (
                      <p className="font-body text-sm text-lifestyle-espresso mb-1">
                        <span className="text-lifestyle-sage font-medium">Learned </span>
                        {e.learning_text}
                      </p>
                    )}
                    {e.free_text && (
                      <p className="font-body text-sm text-foreground/80 whitespace-pre-wrap mt-2">{e.free_text}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ThePause;
