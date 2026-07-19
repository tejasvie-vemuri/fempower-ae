import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, ArrowLeft, Plus, Check, ShoppingBag, Sparkles, Send, Trash2, Mic, Square } from "lucide-react";
import {
  isVoiceRecordingSupported,
  startVoiceRecording,
  stopVoiceRecording,
  cancelVoiceRecording,
  transcribeAudio,
} from "@/lib/voiceRecording";
import { Switch } from "@/components/ui/switch";
import { enablePushNotifications, disablePushNotifications, isPushSupported } from "@/lib/webPush";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface NotificationPrefs {
  whatsapp: boolean;
  email: boolean;
  web_push: boolean;
  digest_time: string;
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  whatsapp: true,
  email: false,
  web_push: false,
  digest_time: "08:00",
};

interface LmProfile {
  user_id: string;
  assistant_name: string;
  preferred_name: string | null;
  whatsapp_number: string | null;
  city: string | null;
  notification_prefs: NotificationPrefs;
  trial_started_at: string;
  plan_tier: string;
}

interface Person {
  id: string;
  name: string;
  relationship: string | null;
  notes: string | null;
}

interface ImportantDate {
  id: string;
  person_id: string;
  label: string;
  date: string;
  recurrence: string;
}

interface Reminder {
  id: string;
  title: string;
  due_date: string | null;
  status: string;
  person_id: string | null;
}

interface GroceryItem {
  id: string;
  item_name: string;
  category: string | null;
  status: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const GROCERY_APPS = [
  { label: "Instashop", url: "https://www.instashop.com" },
  { label: "Noon Minutes", url: "https://food.noon.com" },
  { label: "Talabat", url: "https://www.talabat.com/uae" },
  { label: "Kibsons", url: "https://www.kibsons.com" },
];

const EXAMPLE_PROMPTS = [
  "Remind me to renew my visa next month",
  "Add milk and eggs to my grocery list",
  "My sister's birthday is March 3rd",
];

// A second, unmistakable confirmation beyond Zoya's reply, so it's never in
// doubt whether something actually saved.
const TOOL_CONFIRMATION: Record<string, string> = {
  add_person: "Saved to People",
  add_important_date: "Saved to People",
  add_reminder: "Saved to Today",
  mark_reminder_done: "Updated in Today",
  add_grocery_item: "Added to Groceries",
};

const daysUntil = (dateStr: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

// Yearly events (birthdays, anniversaries) count toward their next
// occurrence, not the raw stored date, otherwise a birthday added
// mid-year would wrongly read as "overdue" once it's passed this year.
const daysUntilNextOccurrence = (dateStr: string, recurrence: string) => {
  if (recurrence !== "yearly") return daysUntil(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  const next = new Date(today.getFullYear(), target.getMonth(), target.getDate());
  if (next.getTime() < today.getTime()) next.setFullYear(next.getFullYear() + 1);
  return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const dueLabel = (days: number) => {
  if (days < 0) return days === -1 ? "Overdue by 1 day" : `Overdue by ${Math.abs(days)} days`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
};

const LifestyleManager = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<LmProfile | null>(null);
  const [trialDays, setTrialDays] = useState(30);
  const [people, setPeople] = useState<Person[]>([]);
  const [dates, setDates] = useState<ImportantDate[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [groceries, setGroceries] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline "add" form state
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonRelationship, setNewPersonRelationship] = useState("");
  const [newReminderTitle, setNewReminderTitle] = useState("");
  const [newReminderDate, setNewReminderDate] = useState("");
  const [newGroceryItem, setNewGroceryItem] = useState("");
  const [addingPerson, setAddingPerson] = useState(false);
  const [addingReminder, setAddingReminder] = useState(false);
  const [addingGrocery, setAddingGrocery] = useState(false);
  const [assistantNameDraft, setAssistantNameDraft] = useState("");
  const [preferredNameDraft, setPreferredNameDraft] = useState("");
  const [notifPrefsDraft, setNotifPrefsDraft] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [cityDraft, setCityDraft] = useState("");
  const [whatsappNumberDraft, setWhatsappNumberDraft] = useState("");

  const UAE_CITIES = ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah", "Al Ain"];

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingName, setOnboardingName] = useState("");
  const [onboardingAssistantName, setOnboardingAssistantName] = useState("Zoya");

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);

      let { data: lmProfile } = await (supabase as any)
        .from("lm_profile")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!lmProfile) {
        const { data: created } = await (supabase as any)
          .from("lm_profile")
          .insert({ user_id: user.id })
          .select("*")
          .single();
        lmProfile = created;
      }

      setProfile(lmProfile);
      setAssistantNameDraft(lmProfile?.assistant_name ?? "Zoya");
      setPreferredNameDraft(lmProfile?.preferred_name ?? "");
      setOnboardingAssistantName(lmProfile?.assistant_name ?? "Zoya");
      if (!lmProfile?.preferred_name) setShowOnboarding(true);
      setNotifPrefsDraft({
        ...DEFAULT_NOTIFICATION_PREFS,
        ...(lmProfile?.notification_prefs ?? {}),
      });
      setCityDraft(lmProfile?.city ?? "");
      setWhatsappNumberDraft(lmProfile?.whatsapp_number ?? "");

      const { data: config } = await (supabase as any)
        .from("plan_config")
        .select("trial_days")
        .eq("id", 1)
        .maybeSingle();
      if (config?.trial_days) setTrialDays(config.trial_days);

      const [peopleRes, datesRes, remindersRes, groceriesRes, chatRes] = await Promise.all([
        (supabase as any).from("people").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        (supabase as any).from("important_dates").select("*").eq("user_id", user.id),
        (supabase as any).from("reminders").select("*").eq("user_id", user.id).order("due_date", { ascending: true }),
        (supabase as any).from("grocery_items").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        (supabase as any)
          .from("chat_messages")
          .select("id, role, content")
          .eq("user_id", user.id)
          .eq("channel", "web")
          .order("created_at", { ascending: true }),
      ]);

      setPeople(peopleRes.data ?? []);
      setDates(datesRes.data ?? []);
      setReminders(remindersRes.data ?? []);
      setGroceries(groceriesRes.data ?? []);
      setChatMessages(chatRes.data ?? []);
      setLoading(false);
    })();
  }, [user]);

  const refetchLifestyleData = async () => {
    if (!user) return;
    const [peopleRes, datesRes, remindersRes, groceriesRes] = await Promise.all([
      (supabase as any).from("people").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      (supabase as any).from("important_dates").select("*").eq("user_id", user.id),
      (supabase as any).from("reminders").select("*").eq("user_id", user.id).order("due_date", { ascending: true }),
      (supabase as any).from("grocery_items").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setPeople(peopleRes.data ?? []);
    setDates(datesRes.data ?? []);
    setReminders(remindersRes.data ?? []);
    setGroceries(groceriesRes.data ?? []);
  };

  const sendChatMessage = async (overrideText?: string) => {
    const text = (overrideText ?? chatInput).trim();
    if (!text || !user || chatSending) return;

    const userMsg: ChatMessage = { id: `local-${Date.now()}`, role: "user", content: text };
    const nextMessages = [...chatMessages, userMsg];
    setChatMessages(nextMessages);
    setChatInput("");
    setChatSending(true);

    await (supabase as any)
      .from("chat_messages")
      .insert({ user_id: user.id, role: "user", content: text, channel: "web" });

    const { data, error } = await supabase.functions.invoke("zoya-chat", {
      body: {
        messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        assistantName: profile?.assistant_name,
        preferredName: profile?.preferred_name,
      },
    });

    setChatSending(false);

    if (error || !data?.reply) {
      // Her message did save to history, but restore it to the input too so
      // she never has to remember and retype her own wording to try again.
      setChatInput(text);
      toast({
        title: "Couldn't reach Zoya",
        description: error?.message ?? "Try again in a moment.",
        variant: "destructive",
        action: (
          <ToastAction altText="Retry" onClick={() => sendChatMessage(text)}>
            Retry
          </ToastAction>
        ),
      });
      return;
    }

    const assistantMsg: ChatMessage = { id: `local-${Date.now()}-a`, role: "assistant", content: data.reply };
    setChatMessages((prev) => [...prev, assistantMsg]);

    await (supabase as any).from("chat_messages").insert({
      user_id: user.id,
      role: "assistant",
      content: data.reply,
      channel: "web",
      intent: data.toolsUsed?.[0] ?? null,
    });

    if (data.toolsUsed?.length > 0) {
      await refetchLifestyleData();
      const seen = new Set<string>();
      for (const toolName of data.toolsUsed as string[]) {
        const label = TOOL_CONFIRMATION[toolName];
        if (label && !seen.has(label)) {
          seen.add(label);
          toast({ title: label });
        }
      }
    }
  };

  // Tap to start, tap again to stop. The transcribed text lands in the
  // input box for her to glance at and send, it isn't sent automatically,
  // since a misheard word should be easy to catch before it reaches Zoya.
  const handleMicClick = async () => {
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
        if (text) {
          setChatInput((prev) => (prev ? `${prev} ${text}` : text));
        } else {
          toast({ title: "Didn't catch that, try again" });
        }
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

  useEffect(() => {
    return () => {
      if (isRecording) cancelVoiceRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  const upcoming = useMemo(() => {
    const dateItems = dates.map((d) => ({
      id: `date-${d.id}`,
      title: `${peopleById.get(d.person_id)?.name ?? "Someone"}'s ${d.label}`,
      days: daysUntilNextOccurrence(d.date, d.recurrence),
    }));
    const reminderItems = reminders
      .filter((r) => r.status === "pending" && r.due_date)
      .map((r) => ({ id: r.id, title: r.title, days: daysUntil(r.due_date as string) }));
    // Every pending reminder and date shows here, no matter how far out or
    // overdue, so nothing added through chat ever looks like it vanished.
    return [...dateItems, ...reminderItems].sort((a, b) => a.days - b.days);
  }, [dates, reminders, peopleById]);

  const pastReminders = reminders.filter((r) => r.status === "done");
  const pastGroceries = groceries.filter((g) => g.status !== "active");
  const activeGroceries = groceries.filter((g) => g.status === "active");

  const trialDaysLeft = profile
    ? trialDays - Math.floor((Date.now() - new Date(profile.trial_started_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const [profileSaveStatus, setProfileSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);

  const persistProfile = async (patch: Partial<Pick<LmProfile, "assistant_name" | "preferred_name" | "notification_prefs" | "city" | "whatsapp_number">>) => {
    if (!user) return;
    setProfileSaveStatus("saving");
    setProfileSaveError(null);
    const { error } = await (supabase as any)
      .from("lm_profile")
      .update(patch)
      .eq("user_id", user.id);
    if (error) {
      setProfileSaveStatus("error");
      setProfileSaveError(error.message);
      return;
    }
    setProfile((p) => (p ? { ...p, ...patch } as LmProfile : p));
    setProfileSaveStatus("saved");
  };

  // First-run naming moment just sets the drafts, the debounced auto-save
  // effects below (already wired for the Settings tab) persist it, same
  // path, no separate write.
  const completeOnboarding = (skip: boolean) => {
    const finalAssistantName = onboardingAssistantName.trim() || "Zoya";
    const finalPreferredName = skip ? "there" : onboardingName.trim() || "there";
    setAssistantNameDraft(finalAssistantName);
    setPreferredNameDraft(finalPreferredName);
    setShowOnboarding(false);
  };

  // Debounced auto-save for profile identity fields
  useEffect(() => {
    if (!profile || !user) return;
    const currentAssistant = profile.assistant_name ?? "Zoya";
    const currentPreferred = profile.preferred_name ?? "";
    const nextAssistant = assistantNameDraft.trim() || "Zoya";
    const nextPreferred = preferredNameDraft.trim() || null;
    if (nextAssistant === currentAssistant && (nextPreferred ?? "") === (currentPreferred ?? "")) {
      return;
    }
    const t = setTimeout(() => {
      persistProfile({ assistant_name: nextAssistant, preferred_name: nextPreferred });
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistantNameDraft, preferredNameDraft, profile?.assistant_name, profile?.preferred_name, user]);

  // Debounced auto-save for notification preferences
  useEffect(() => {
    if (!profile || !user) return;
    const current = { ...DEFAULT_NOTIFICATION_PREFS, ...(profile.notification_prefs ?? {}) };
    if (
      current.whatsapp === notifPrefsDraft.whatsapp &&
      current.email === notifPrefsDraft.email &&
      current.web_push === notifPrefsDraft.web_push &&
      current.digest_time === notifPrefsDraft.digest_time
    ) {
      return;
    }
    const t = setTimeout(() => {
      persistProfile({ notification_prefs: notifPrefsDraft });
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifPrefsDraft, profile?.notification_prefs, user]);

  // Debounced auto-save for city
  useEffect(() => {
    if (!profile || !user) return;
    const nextCity = cityDraft.trim() || null;
    if ((profile.city ?? null) === nextCity) return;
    const t = setTimeout(() => {
      persistProfile({ city: nextCity });
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityDraft, profile?.city, user]);

  // Debounced auto-save for WhatsApp number, this is how Zoya on WhatsApp
  // knows which account an incoming message belongs to.
  useEffect(() => {
    if (!profile || !user) return;
    const nextNumber = whatsappNumberDraft.trim() || null;
    if ((profile.whatsapp_number ?? null) === nextNumber) return;
    const t = setTimeout(() => {
      persistProfile({ whatsapp_number: nextNumber });
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whatsappNumberDraft, profile?.whatsapp_number, user]);

  // Fade "saved" indicator after a moment
  useEffect(() => {
    if (profileSaveStatus !== "saved") return;
    const t = setTimeout(() => setProfileSaveStatus("idle"), 2000);
    return () => clearTimeout(t);
  }, [profileSaveStatus]);

  const addPerson = async () => {
    if (!user || !newPersonName.trim() || addingPerson) return;
    setAddingPerson(true);
    const { data, error } = await (supabase as any)
      .from("people")
      .insert({ user_id: user.id, name: newPersonName.trim(), relationship: newPersonRelationship.trim() || null })
      .select("*")
      .single();
    setAddingPerson(false);
    if (error) {
      toast({ title: "Couldn't add them", description: error.message, variant: "destructive" });
      return;
    }
    setPeople((p) => [data, ...p]);
    setNewPersonName("");
    setNewPersonRelationship("");
  };

  const addReminder = async () => {
    if (!user || !newReminderTitle.trim() || addingReminder) return;
    setAddingReminder(true);
    const { data, error } = await (supabase as any)
      .from("reminders")
      .insert({ user_id: user.id, title: newReminderTitle.trim(), due_date: newReminderDate || null })
      .select("*")
      .single();
    setAddingReminder(false);
    if (error) {
      toast({ title: "Couldn't add that", description: error.message, variant: "destructive" });
      return;
    }
    setReminders((r) => [...r, data]);
    setNewReminderTitle("");
    setNewReminderDate("");
  };

  const markReminderDone = async (id: string) => {
    await (supabase as any).from("reminders").update({ status: "done" }).eq("id", id);
    setReminders((rs) => rs.map((r) => (r.id === id ? { ...r, status: "done" } : r)));
  };

  // Undoing a mistake, whether it's something she added by hand or
  // something Zoya got slightly wrong, should always be one tap away.
  const deleteUpcomingItem = async (itemId: string) => {
    if (itemId.startsWith("date-")) {
      const dateId = itemId.slice(5);
      await (supabase as any).from("important_dates").delete().eq("id", dateId);
      setDates((ds) => ds.filter((d) => d.id !== dateId));
    } else {
      await (supabase as any).from("reminders").delete().eq("id", itemId);
      setReminders((rs) => rs.filter((r) => r.id !== itemId));
    }
  };

  const deletePerson = async (id: string) => {
    await (supabase as any).from("people").delete().eq("id", id);
    setPeople((ps) => ps.filter((p) => p.id !== id));
    setDates((ds) => ds.filter((d) => d.person_id !== id));
  };

  const deleteGroceryItem = async (id: string) => {
    await (supabase as any).from("grocery_items").delete().eq("id", id);
    setGroceries((gs) => gs.filter((g) => g.id !== id));
  };

  const addGrocery = async () => {
    if (!user || !newGroceryItem.trim() || addingGrocery) return;
    setAddingGrocery(true);
    const { data, error } = await (supabase as any)
      .from("grocery_items")
      .insert({ user_id: user.id, item_name: newGroceryItem.trim() })
      .select("*")
      .single();
    setAddingGrocery(false);
    if (error) {
      toast({ title: "Couldn't add that", description: error.message, variant: "destructive" });
      return;
    }
    setGroceries((g) => [data, ...g]);
    setNewGroceryItem("");
  };

  const sendGroceriesToApp = async (appUrl: string) => {
    // Open the tab synchronously, in the same tick as the click, so browsers
    // (Safari in particular) still treat it as user-initiated once the
    // awaits below resolve. `noopener` would make window.open return null,
    // so we null out `.opener` ourselves to get the same tabnabbing
    // protection while keeping a handle to navigate later.
    const newWin = window.open("", "_blank", "noreferrer");
    if (newWin) newWin.opener = null;

    const text = activeGroceries.map((g) => g.item_name).join(", ");
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: "List copied", description: "Paste it in while you shop, opening the app now." });
      } catch {
        // clipboard may be unavailable, still proceed to open the app
      }
    }
    await (supabase as any)
      .from("grocery_items")
      .update({ status: "ordered" })
      .in("id", activeGroceries.map((g) => g.id));
    setGroceries((gs) => gs.map((g) => (g.status === "active" ? { ...g, status: "ordered" } : g)));
    if (newWin) {
      newWin.location.href = appUrl;
    } else {
      window.open(appUrl, "_blank", "noreferrer");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lifestyle-ivory">
        <Loader2 className="h-6 w-6 animate-spin text-lifestyle-terracotta" />
      </div>
    );
  }

  const displayAssistantName = profile?.assistant_name || "Zoya";
  const displayPreferredName = profile?.preferred_name;

  return (
    <>
      <Header />

      <Dialog open={showOnboarding} onOpenChange={(open) => !open && completeOnboarding(true)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-lifestyle-espresso">
              Let's make her yours.
            </DialogTitle>
            <DialogDescription className="font-body">
              Two quick things, then she's ready.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-xs font-body uppercase tracking-widest text-muted-foreground mb-1.5">
                What should she call you?
              </p>
              <Input
                autoFocus
                value={onboardingName}
                onChange={(e) => setOnboardingName(e.target.value)}
                placeholder="Your name, or whatever you like"
                className="font-body"
              />
            </div>
            <div>
              <p className="text-xs font-body uppercase tracking-widest text-muted-foreground mb-1.5">
                What do you want to call her?
              </p>
              <Input
                value={onboardingAssistantName}
                onChange={(e) => setOnboardingAssistantName(e.target.value)}
                placeholder="Zoya"
                className="font-body"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              onClick={() => completeOnboarding(false)}
              className="w-full bg-lifestyle-terracotta hover:bg-lifestyle-terracotta/90"
            >
              Let's go
            </Button>
            <button
              onClick={() => completeOnboarding(true)}
              className="text-xs text-muted-foreground hover:text-foreground font-body underline underline-offset-4"
            >
              Skip for now
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <Sparkles size={18} className="text-lifestyle-terracotta" />
              <p className="text-xs font-body font-bold uppercase tracking-widest-xl text-lifestyle-terracotta">
                Lifestyle Manager
              </p>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl text-lifestyle-espresso leading-tight mb-1">
              Hi{displayPreferredName ? ` ${displayPreferredName}` : ""}, it's {displayAssistantName}.
            </h1>
            <p className="text-muted-foreground font-body">
              I'm keeping track so you don't have to carry it all alone.
            </p>
            {trialDaysLeft !== null && (
              <Badge variant="outline" className="mt-3 font-body">
                {trialDaysLeft > 0 ? `${trialDaysLeft} days left in your free time together` : "Your free trial has ended"}
              </Badge>
            )}
          </motion.div>

          <Tabs value={lmTab} onValueChange={setLmTab} className="mt-8">
            {/* Mobile: vertical drawer via Select — no horizontal scroll */}
            <div className="md:hidden mb-6">
              <Select value={lmTab} onValueChange={setLmTab}>
                <SelectTrigger className="w-full font-body">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LM_TABS.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="font-body">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Desktop: premium segmented control (underline style comes from ui/tabs) */}
            <TabsList className="hidden md:inline-flex mb-6">
              {LM_TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── Chat ── */}
            <TabsContent value="chat" className="space-y-3 sm:space-y-4">
              <div
                className="flex items-center gap-2 sticky top-2 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 py-2 -mx-1 px-1 rounded-lg"
                style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
              >
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage();
                    }
                  }}
                  onFocus={(e) => {
                    // Ensure the input stays visible above the iOS keyboard
                    setTimeout(() => {
                      e.target.scrollIntoView({ block: "center", behavior: "smooth" });
                    }, 300);
                  }}
                  placeholder={
                    isRecording
                      ? "Listening..."
                      : transcribing
                        ? "Working out what you said..."
                        : `Tell ${displayAssistantName} anything...`
                  }
                  className="font-body"
                  disabled={chatSending || isRecording || transcribing}
                  enterKeyHint="send"
                />
                <Button
                  onClick={handleMicClick}
                  disabled={chatSending || transcribing}
                  variant={isRecording ? "destructive" : "outline"}
                  aria-label={isRecording ? "Stop recording" : "Record a voice note"}
                  className="shrink-0"
                >
                  {transcribing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : isRecording ? (
                    <Square size={16} />
                  ) : (
                    <Mic size={16} />
                  )}
                </Button>
                <Button
                  onClick={() => sendChatMessage()}
                  disabled={chatSending || !chatInput.trim() || isRecording || transcribing}
                  className="shrink-0 bg-lifestyle-terracotta hover:bg-lifestyle-terracotta/90"
                >
                  <Send size={16} />
                </Button>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 min-h-[260px] max-h-[55dvh] sm:min-h-[320px] sm:max-h-[480px] overflow-y-auto flex flex-col gap-3">
                {chatMessages.length === 0 ? (
                  <p className="text-center text-muted-foreground font-body py-16">
                    Tell {displayAssistantName} anything, she'll take it from there. Not sure where to start?
                    Try one of the quick-adds below.
                  </p>
                ) : (
                  chatMessages.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 font-body text-sm whitespace-pre-wrap ${
                        m.role === "user"
                          ? "self-end bg-lifestyle-terracotta text-white"
                          : "self-start bg-lifestyle-gold-light text-lifestyle-espresso"
                      }`}
                    >
                      {m.content}
                    </div>
                  ))
                )}
                {chatSending && (
                  <div className="self-start flex items-center gap-2 text-muted-foreground text-sm font-body">
                    <Loader2 size={14} className="animate-spin" /> Thinking
                  </div>
                )}
              </div>

              {/* Quick-add shortcuts, always visible, not just on a blank conversation */}
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map((example) => (
                  <button
                    key={example}
                    onClick={() => sendChatMessage(example)}
                    disabled={chatSending}
                    className="font-body text-xs px-3 py-1.5 rounded-full border border-lifestyle-terracotta/40 text-lifestyle-espresso hover:bg-lifestyle-terracotta-light transition-colors disabled:opacity-50"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </TabsContent>

            {/* ── Today ── */}
            <TabsContent value="today" className="space-y-5">
              <Card className="p-5 bg-card border-border">
                <p className="font-body text-sm font-medium text-lifestyle-espresso mb-3">Add something to remember</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="e.g. Get Mum a birthday card"
                    value={newReminderTitle}
                    onChange={(e) => setNewReminderTitle(e.target.value)}
                    className="font-body"
                  />
                  <Input
                    type="date"
                    value={newReminderDate}
                    onChange={(e) => setNewReminderDate(e.target.value)}
                    className="font-body sm:w-40"
                  />
                  <Button
                    onClick={addReminder}
                    disabled={addingReminder || !newReminderTitle.trim()}
                    className="bg-lifestyle-terracotta hover:bg-lifestyle-terracotta/90"
                  >
                    {addingReminder ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} className="mr-1" /> Add</>}
                  </Button>
                </div>
              </Card>

              {upcoming.length === 0 ? (
                <p className="text-center text-muted-foreground font-body py-10">
                  Nothing on your list right now. Nothing to do here, that's a good thing.
                </p>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
                    >
                      <div>
                        <p className="font-body text-lifestyle-espresso">{item.title}</p>
                        <p className={`text-xs font-body ${item.days < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {dueLabel(item.days)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!item.id.startsWith("date-") && (
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Mark "${item.title}" done`}
                            onClick={() => markReminderDone(item.id)}
                          >
                            <Check size={18} />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Delete "${item.title}"`}
                          onClick={() => deleteUpcomingItem(item.id)}
                        >
                          <Trash2 size={16} className="text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── People ── */}
            <TabsContent value="people" className="space-y-5">
              <Card className="p-5 bg-card border-border">
                <p className="font-body text-sm font-medium text-lifestyle-espresso mb-3">Who's on your mind?</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Name"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    className="font-body"
                  />
                  <Input
                    placeholder="Relationship (Mum, sister...)"
                    value={newPersonRelationship}
                    onChange={(e) => setNewPersonRelationship(e.target.value)}
                    className="font-body"
                  />
                  <Button
                    onClick={addPerson}
                    disabled={addingPerson || !newPersonName.trim()}
                    className="bg-lifestyle-terracotta hover:bg-lifestyle-terracotta/90"
                  >
                    {addingPerson ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} className="mr-1" /> Add</>}
                  </Button>
                </div>
              </Card>

              {people.length === 0 ? (
                <p className="text-center text-muted-foreground font-body py-10">
                  Add someone you care about, and I'll make sure nothing slips.
                </p>
              ) : (
                <div className="space-y-3">
                  {people.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                      <div>
                        <p className="font-body font-medium text-lifestyle-espresso">{p.name}</p>
                        {p.relationship && (
                          <p className="text-xs text-muted-foreground font-body">{p.relationship}</p>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Remove ${p.name}`}
                        onClick={() => deletePerson(p.id)}
                      >
                        <Trash2 size={16} className="text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Groceries ── */}
            <TabsContent value="groceries" className="space-y-5">
              <Card className="p-5 bg-card border-border">
                <p className="font-body text-sm font-medium text-lifestyle-espresso mb-3">Add to the list</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Milk"
                    value={newGroceryItem}
                    onChange={(e) => setNewGroceryItem(e.target.value)}
                    className="font-body"
                  />
                  <Button
                    onClick={addGrocery}
                    disabled={addingGrocery || !newGroceryItem.trim()}
                    className="bg-lifestyle-terracotta hover:bg-lifestyle-terracotta/90"
                  >
                    {addingGrocery ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} className="mr-1" /> Add</>}
                  </Button>
                </div>
              </Card>

              {activeGroceries.length === 0 ? (
                <p className="text-center text-muted-foreground font-body py-6">Your list is empty right now.</p>
              ) : (
                <div className="space-y-2">
                  {activeGroceries.map((g) => (
                    <div key={g.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5 font-body text-lifestyle-espresso">
                      {g.item_name}
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Remove ${g.item_name}`}
                        onClick={() => deleteGroceryItem(g.id)}
                      >
                        <Trash2 size={16} className="text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {activeGroceries.length > 0 && (
                <Card className="p-5 bg-lifestyle-gold-light border-none">
                  <p className="font-body text-sm font-medium text-lifestyle-espresso mb-3 flex items-center gap-2">
                    <ShoppingBag size={16} /> Order via
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {GROCERY_APPS.map((app) => (
                      <Button
                        key={app.label}
                        variant="outline"
                        size="sm"
                        className="bg-card font-body"
                        onClick={() => sendGroceriesToApp(app.url)}
                      >
                        {app.label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground font-body mt-2">
                    I'll copy your list and take you there, you finish it in their app.
                  </p>
                </Card>
              )}
            </TabsContent>

            {/* ── History ── */}
            <TabsContent value="history" className="space-y-3">
              {pastReminders.length === 0 && pastGroceries.length === 0 ? (
                <p className="text-center text-muted-foreground font-body py-10">
                  Nothing here yet, everything you complete stays visible so you can look back anytime.
                </p>
              ) : (
                <>
                  {pastReminders.map((r) => (
                    <div key={r.id} className="rounded-lg border border-border bg-card px-4 py-2.5 font-body text-muted-foreground flex items-center justify-between">
                      <span className="line-through">{r.title}</span>
                      <Badge variant="secondary">Done</Badge>
                    </div>
                  ))}
                  {pastGroceries.map((g) => (
                    <div key={g.id} className="rounded-lg border border-border bg-card px-4 py-2.5 font-body text-muted-foreground flex items-center justify-between">
                      <span>{g.item_name}</span>
                      <Badge variant="secondary">Ordered</Badge>
                    </div>
                  ))}
                </>
              )}
            </TabsContent>

            {/* ── Settings ── */}
            <TabsContent value="settings" className="space-y-5">
              <Card className="p-5 bg-card border-border space-y-4">
                <div>
                  <p className="text-xs font-body uppercase tracking-widest text-muted-foreground mb-1.5">
                    What should I be called?
                  </p>
                  <Input
                    value={assistantNameDraft}
                    onChange={(e) => setAssistantNameDraft(e.target.value)}
                    className="font-body"
                  />
                </div>
                <div>
                  <p className="text-xs font-body uppercase tracking-widest text-muted-foreground mb-1.5">
                    What should I call you?
                  </p>
                  <Input
                    value={preferredNameDraft}
                    onChange={(e) => setPreferredNameDraft(e.target.value)}
                    className="font-body"
                  />
                </div>
                <div>
                  <p className="text-xs font-body uppercase tracking-widest text-muted-foreground mb-1.5">
                    Which city are you in?
                  </p>
                  <Select
                    value={cityDraft || "__none"}
                    onValueChange={(v) => setCityDraft(v === "__none" ? "" : v)}
                  >
                    <SelectTrigger className="font-body">
                      <SelectValue placeholder="Select your city" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Prefer not to say</SelectItem>
                      {UAE_CITIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs font-body uppercase tracking-widest text-muted-foreground mb-1.5">
                    Your WhatsApp number
                  </p>
                  <Input
                    value={whatsappNumberDraft}
                    onChange={(e) => setWhatsappNumberDraft(e.target.value)}
                    placeholder="+971 50 123 4567"
                    className="font-body"
                  />
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    So you can text {displayAssistantName} directly on WhatsApp, coming soon.
                  </p>
                </div>

                <div className="pt-2 border-t border-border space-y-4">
                  <p className="text-xs font-body uppercase tracking-widest text-muted-foreground">
                    Notifications
                  </p>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label htmlFor="notif-whatsapp" className="font-body text-sm text-lifestyle-espresso">
                        WhatsApp nudges
                      </Label>
                      <p className="text-xs text-muted-foreground font-body">Reminders and check-ins on WhatsApp.</p>
                    </div>
                    <Switch
                      id="notif-whatsapp"
                      checked={notifPrefsDraft.whatsapp}
                      onCheckedChange={(v) => setNotifPrefsDraft((p) => ({ ...p, whatsapp: v }))}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label htmlFor="notif-email" className="font-body text-sm text-lifestyle-espresso">
                        Email digest
                      </Label>
                      <p className="text-xs text-muted-foreground font-body">A gentle summary in your inbox.</p>
                    </div>
                    <Switch
                      id="notif-email"
                      checked={notifPrefsDraft.email}
                      onCheckedChange={(v) => setNotifPrefsDraft((p) => ({ ...p, email: v }))}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label htmlFor="notif-webpush" className="font-body text-sm text-lifestyle-espresso">
                        Phone notifications
                      </Label>
                      <p className="text-xs text-muted-foreground font-body">
                        A notification right on your phone, browser permission needed once.
                      </p>
                    </div>
                    <Switch
                      id="notif-webpush"
                      checked={notifPrefsDraft.web_push}
                      onCheckedChange={async (v) => {
                        if (!user) return;
                        if (v) {
                          if (!isPushSupported()) {
                            toast({ title: "Not supported on this browser", variant: "destructive" });
                            return;
                          }
                          const result = await enablePushNotifications(user.id);
                          if (!result.ok) {
                            toast({ title: "Couldn't enable phone notifications", description: result.error, variant: "destructive" });
                            return;
                          }
                        } else {
                          await disablePushNotifications(user.id);
                        }
                        setNotifPrefsDraft((p) => ({ ...p, web_push: v }));
                      }}
                    />
                  </div>

                  <div>
                    <Label className="font-body text-sm text-lifestyle-espresso mb-1.5 block">
                      Daily digest time
                    </Label>
                    <Select
                      value={notifPrefsDraft.digest_time}
                      onValueChange={(v) => setNotifPrefsDraft((p) => ({ ...p, digest_time: v }))}
                    >
                      <SelectTrigger className="font-body">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["06:00","07:00","08:00","09:00","10:00","12:00","18:00","20:00","21:00"].map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="min-h-[20px] text-xs font-body text-muted-foreground flex items-center gap-2" aria-live="polite">
                  {profileSaveStatus === "saving" && (
                    <><Loader2 size={12} className="animate-spin" /> Saving…</>
                  )}
                  {profileSaveStatus === "saved" && <span className="text-lifestyle-terracotta">Saved ✓</span>}
                  {profileSaveStatus === "error" && (
                    <span className="text-destructive">
                      Couldn't save{profileSaveError ? `: ${profileSaveError}` : ""}.{" "}
                      <button
                        type="button"
                        className="underline"
                        onClick={() => persistProfile({
                          assistant_name: assistantNameDraft.trim() || "Zoya",
                          preferred_name: preferredNameDraft.trim() || null,
                          notification_prefs: notifPrefsDraft,
                        })}
                      >
                        Retry
                      </button>
                    </span>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default LifestyleManager;
