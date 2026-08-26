import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Sparkles, ShieldCheck, Star, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { logEngagement } from "@/lib/engagement";
import {
  TRY_BY_COACH_ID,
  SITE_ORIGIN,
  whatsappShareUrl,
} from "@/lib/zaraChecklists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { streamChat, type Msg, type ChecklistMemory } from "@/lib/streamChat";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import butterflyIcon from "@/assets/butterfly-icon.png";

const CONSENT_KEY = "fempower-coach-consent-v1";
const NEWSLETTER_OPTIN_KEY = "fempower-coach-newsletter-optin-v1";

type Pillar = "RISE" | "ROOTS" | "RESTORE";
type Starter = { id: string; pillar: Pillar; label: string; full: string };

const STARTER_LIBRARY: Starter[] = [
  // RISE
  { id: "RISE-01", pillar: "RISE", label: "I've been job searching for months…", full: "I've been job searching in Dubai for months and nothing is working. What am I doing wrong?" },
  { id: "RISE-02", pillar: "RISE", label: "I want to negotiate my salary…", full: "I got a job offer but the salary feels low. How do I negotiate without losing the offer?" },
  { id: "RISE-03", pillar: "RISE", label: "I want to switch industries in UAE…", full: "I want to switch industries in UAE — is that even realistic here?" },
  { id: "RISE-04", pillar: "RISE", label: "I'm on a spouse visa, want to work…", full: "I'm on a spouse visa and I want to work. Where do I even start?" },
  { id: "RISE-05", pillar: "RISE", label: "My LinkedIn feels invisible…", full: "Everyone around me seems to have the perfect LinkedIn profile. Mine feels invisible." },
  { id: "RISE-06", pillar: "RISE", label: "Help me prep for an interview…", full: "I have an interview next week and I'm terrified. Can you help me prepare?" },
  { id: "RISE-07", pillar: "RISE", label: "My boss takes credit for my work…", full: "My boss takes credit for my work. I don't know how to handle this without damaging the relationship." },
  { id: "RISE-08", pillar: "RISE", label: "I want to start a business in UAE…", full: "I want to start a business in UAE but I have no idea where to begin — free zone, mainland, what?" },
  { id: "RISE-09", pillar: "RISE", label: "Networking here feels transactional…", full: "I feel like I'm the only one who doesn't know how to 'network' here. It feels so transactional." },
  { id: "RISE-10", pillar: "RISE", label: "Should I stay in my role or leave?", full: "I've been in the same role for three years. I want to grow but I don't know if I should stay or leave." },
  { id: "RISE-11", pillar: "RISE", label: "I feel overlooked in my new role…", full: "I moved to Dubai for a great job and now I feel completely overlooked. What changed?" },
  { id: "RISE-12", pillar: "RISE", label: "How do I ask for a promotion?", full: "I want to ask for a promotion but I don't know if the timing is right or how to make the case." },
  { id: "RISE-13", pillar: "RISE", label: "Being taken seriously as a founder…", full: "I'm a female founder trying to get taken seriously in meetings here. Any advice?" },
  { id: "RISE-14", pillar: "RISE", label: "Influence in male-dominated industry…", full: "I work in a male-dominated industry in UAE. How do I build influence without losing myself?" },
  { id: "RISE-15", pillar: "RISE", label: "Starting over at mid-level here…", full: "I left a senior role back home and I'm starting over here as a mid-level. It's humbling in a hard way." },
  { id: "RISE-16", pillar: "RISE", label: "Interviews but no offers…", full: "I keep getting interviews but no offers. Is it my CV, my interview, or something else?" },
  { id: "RISE-17", pillar: "RISE", label: "Building a reputation from zero…", full: "How do I build a professional reputation here when I literally know nobody?" },
  { id: "RISE-18", pillar: "RISE", label: "I want to go freelance in UAE…", full: "I want to go freelance in UAE. What do I actually need to know before I quit my job?" },
  { id: "RISE-19", pillar: "RISE", label: "Passed over for a promotion…", full: "I got passed over for a promotion in favour of someone less experienced. I'm furious and lost." },
  { id: "RISE-20", pillar: "RISE", label: "Is my background holding me back?", full: "I feel like my accent or my background is holding me back here. Is that in my head?" },
  // ROOTS
  { id: "ROOTS-01", pillar: "ROOTS", label: "I still feel like a stranger here…", full: "I've been in Dubai for six months and I still feel like a stranger. Is this normal?" },
  { id: "ROOTS-02", pillar: "ROOTS", label: "How do I make real friends here?", full: "How do I make real friends here — not just work colleagues or acquaintances?" },
  { id: "ROOTS-03", pillar: "ROOTS", label: "Everyone seems to have it together…", full: "Everyone here seems to have their life together. I feel like I'm the only one struggling." },
  { id: "ROOTS-04", pillar: "ROOTS", label: "I moved here and lost my identity…", full: "I moved here for my partner's career. I gave up a lot. Now I'm not sure who I am anymore." },
  { id: "ROOTS-05", pillar: "ROOTS", label: "I feel like I belong nowhere…", full: "I've lived in three countries in five years. I feel like I belong nowhere." },
  { id: "ROOTS-06", pillar: "ROOTS", label: "Guilt about leaving family behind…", full: "My family back home doesn't understand why I chose to move to UAE. The guilt is real." },
  { id: "ROOTS-07", pillar: "ROOTS", label: "Help me understand UAE culture…", full: "I want to understand UAE culture better — especially as a non-Arab expat working with Emirati colleagues." },
  { id: "ROOTS-08", pillar: "ROOTS", label: "Lonely even when surrounded…", full: "I feel lonely here even though I'm constantly surrounded by people. How is that possible?" },
  { id: "ROOTS-09", pillar: "ROOTS", label: "Dating in Dubai is complicated…", full: "Dating and relationships as a single woman in Dubai is... complicated. I don't know where I fit." },
  { id: "ROOTS-10", pillar: "ROOTS", label: "Should I move back home?", full: "I'm thinking about leaving UAE and going back home. But I'm not sure if it's the right call." },
  { id: "ROOTS-11", pillar: "ROOTS", label: "Unexpected low after the move…", full: "I moved here with so much excitement and now I'm in a low I didn't expect. What is this?" },
  { id: "ROOTS-12", pillar: "ROOTS", label: "Finding my kind of people…", full: "I want to build a social life here but I don't know where to find my kind of people." },
  { id: "ROOTS-13", pillar: "ROOTS", label: "Emirati woman, family and ambition…", full: "I'm an Emirati woman navigating family expectations and my own ambitions at the same time." },
  { id: "ROOTS-14", pillar: "ROOTS", label: "5 years in, still feel like a guest…", full: "I've been here five years and I still feel like a guest. Will I ever feel at home?" },
  { id: "ROOTS-15", pillar: "ROOTS", label: "Everything moves so fast here…", full: "Everything in UAE moves so fast — people leave, things change, it's exhausting to keep up." },
  { id: "ROOTS-16", pillar: "ROOTS", label: "I want to give back here…", full: "I want to give back to this community but I don't know how to start." },
  // RESTORE
  { id: "RESTORE-01", pillar: "RESTORE", label: "I'm exhausted but I can't stop…", full: "I'm exhausted all the time but I can't stop. Everything feels urgent." },
  { id: "RESTORE-02", pillar: "RESTORE", label: "I've been quietly anxious for months…", full: "I've been anxious for months but I haven't told anyone. I'm not even sure why I'm telling you." },
  { id: "RESTORE-03", pillar: "RESTORE", label: "I feel like a fraud — help…", full: "I feel like a fraud. Everyone thinks I have it together and I absolutely don't." },
  { id: "RESTORE-04", pillar: "RESTORE", label: "Not sure what I came here for…", full: "I moved to UAE chasing something and I'm not sure what I was looking for anymore." },
  { id: "RESTORE-05", pillar: "RESTORE", label: "Comparison is destroying my confidence…", full: "I keep comparing myself to other women here and it's destroying my confidence." },
  { id: "RESTORE-06", pillar: "RESTORE", label: "I don't know how to ask for help…", full: "I don't know how to ask for help. I've always been the one who has it sorted." },
  { id: "RESTORE-07", pillar: "RESTORE", label: "I think I'm burning out…", full: "I think I'm burning out but I'm scared to slow down — what if everything falls apart?" },
  { id: "RESTORE-08", pillar: "RESTORE", label: "Achieved everything, still unhappy…", full: "I've achieved everything I planned for and I still don't feel happy. What's wrong with me?" },
  { id: "RESTORE-09", pillar: "RESTORE", label: "Performing 'thriving' is exhausting…", full: "I feel pressure to always be positive and 'thriving' here. The performance of it is exhausting." },
  { id: "RESTORE-10", pillar: "RESTORE", label: "How do I find therapy in Dubai?", full: "I want to start therapy in Dubai but I don't know how to find someone good — or if I even need it." },
  { id: "RESTORE-11", pillar: "RESTORE", label: "I've lost confidence since moving…", full: "My self-confidence has taken a huge hit since I moved. I used to know who I was." },
  { id: "RESTORE-12", pillar: "RESTORE", label: "Struggling, but must hold it together…", full: "I'm going through a difficult time personally but professionally I have to hold it together. Any advice?" },
  { id: "RESTORE-13", pillar: "RESTORE", label: "Guilty for struggling when life looks good…", full: "I feel guilty for struggling when objectively my life in UAE looks great from the outside." },
  { id: "RESTORE-14", pillar: "RESTORE", label: "I want to feel more grounded…", full: "I want to feel more grounded and present — but I don't know where to start." },
];

function pickStarters(): Starter[] {
  const byPillar = (p: Pillar) => STARTER_LIBRARY.filter((s) => s.pillar === p);
  const rand = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
  const rise = rand(byPillar("RISE"));
  const roots = rand(byPillar("ROOTS"));
  const restore = rand(byPillar("RESTORE"));
  const used = new Set([rise.id, roots.id, restore.id]);
  const pool = STARTER_LIBRARY.filter((s) => !used.has(s.id));
  const fourth = rand(pool);
  const arr = [rise, roots, restore, fourth];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Guided checklists — conversational flows Zara runs one question at a time.
 * Inspired by the themes in Harnidh Kaur's "The Girls Are Not Fine".
 */
const CHECKLISTS: { id: string; label: string; full: string }[] = [
  {
    id: "invisible-labour",
    label: "Invisible Labour Audit",
    full: "I'd like to do the Invisible Labour Audit with you. Please walk me through it one question at a time.",
  },
  {
    id: "the-ask",
    label: "The Ask Checklist",
    full: "I'd like to do The Ask Checklist with you — I want to ask for something at work. Please walk me through it one question at a time.",
  },
  {
    id: "actually-fine",
    label: "Am I Actually Fine?",
    full: "I'd like to do the Am I Actually Fine? check-in with you. Please walk me through it one question at a time.",
  },
  {
    id: "relocation-load",
    label: "Relocation Load",
    full: "I'd like to do the Relocation Load checklist with you. Please walk me through it one question at a time.",
  },
];

const CHECKLIST_LABELS: Record<string, string> = Object.fromEntries(
  CHECKLISTS.map((c) => [c.id, c.label]),
);

const SAVE_PREF_KEY = "fempower-coach-save-checklists-v1";

/**
 * One short, answerable question per rating — a single specific prompt gets far
 * more usable feedback than an open "any comments?" box. Picked at random when
 * the rating panel opens, and stored alongside the answer so we always know
 * which question a piece of feedback was answering.
 */
const FEEDBACK_QUESTIONS = [
  "What is the one thing Zara could have done better here?",
  "What did you come here hoping for that you did not get?",
  "Which part of this chat was actually useful?",
  "What would have made this feel more like talking to a real person?",
  "What would you want Zara to remember for next time?",
];

const pickFeedbackQuestion = () =>
  FEEDBACK_QUESTIONS[Math.floor(Math.random() * FEEDBACK_QUESTIONS.length)];
const CHECKLIST_MARKER = /\[\[CHECKLIST_SAVE:\s*(\{[\s\S]*?\})\s*\]\]/;

/** Removes the machine-readable save marker before anything is shown to her. */
function stripMarker(content: string): string {
  return content.replace(CHECKLIST_MARKER, "").replace(/\n{3,}/g, "\n\n").trimEnd();
}





const FempowerCoach = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [starters, setStarters] = useState<Starter[]>(() => pickStarters());
  const [memberProfile, setMemberProfile] = useState<{
    name: string;
    city: string | null;
    role: string | null;
    industry: string | null;
    looking_for: string[];
  } | null>(null);
  const [hasConsented, setHasConsented] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(CONSENT_KEY) === "true";
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [saveChecklists, setSaveChecklists] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(SAVE_PREF_KEY) !== "false";
  });
  const [showPrivacy, setShowPrivacy] = useState(false);
  // Sticky A/B bucket: one visitor stays on one style ruleset so a chat never
  // changes voice mid-conversation.
  const [abBucketKey] = useState<string>(() => {
    if (typeof window === "undefined") return "ssr";
    const existing = window.localStorage.getItem("zara_ab_bucket");
    if (existing) return existing;
    const fresh = Math.random().toString(36).slice(2, 12);
    window.localStorage.setItem("zara_ab_bucket", fresh);
    return fresh;
  });

  const [checklistHistory, setChecklistHistory] = useState<ChecklistMemory[]>([]);
  const [showRating, setShowRating] = useState(false);
  const [ratingFromClose, setRatingFromClose] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState("");
  const [feedbackQuestion, setFeedbackQuestion] = useState(pickFeedbackQuestion);
  const [hasRated, setHasRated] = useState(false);
  /** The checklist this conversation is about, if any — drives the share link. */
  const [activeChecklist, setActiveChecklist] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  /** Checklist queued by a deep link, sent once the widget is open and consented. */
  const [pendingStart, setPendingStart] = useState<string | null>(null);

  // Allow other components (e.g. HeroSection, the /ai-coach-for-women-uae page)
  // to open Zara, optionally starting a named checklist straight away.
  useEffect(() => {
    const handler = (e: Event) => {
      const start = (e as CustomEvent<{ start?: string } | undefined>).detail?.start;
      if (start && CHECKLIST_LABELS[start]) setPendingStart(start);
      setOpen(true);
    };
    window.addEventListener("open-zara", handler);
    return () => window.removeEventListener("open-zara", handler);
  }, []);

  // ?start=<checklist-id> opens the flow directly, so a link cited by an AI
  // assistant or shared on social lands the reader inside the right checklist.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const start = new URLSearchParams(window.location.search).get("start");
    if (start && CHECKLIST_LABELS[start]) {
      setPendingStart(start);
      setOpen(true);
    }
  }, []);


  // For signed-in members, load her profile so Zara can personalise the chat.
  useEffect(() => {
    if (!user?.id) {
      setMemberProfile(null);
      setChecklistHistory([]);
      return;
    }
    let cancelled = false;
    supabase
      .from("member_profiles")
      .select("name, city, role, industry, looking_for, coach_save_checklists")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        if (data.name) {
          setMemberProfile({
            name: data.name,
            city: data.city ?? null,
            role: data.role ?? null,
            industry: data.industry ?? null,
            looking_for: data.looking_for ?? [],
          });
        }
        setSaveChecklists(data.coach_save_checklists !== false);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Her saved checklist results, so Zara can reference them in future sessions.
  const loadChecklistHistory = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("coach_checklist_results")
      .select("checklist_key, checklist_label, summary, created_at")
      .order("created_at", { ascending: false })
      .limit(6);
    setChecklistHistory(
      (data ?? []).map((r) => ({
        key: r.checklist_key,
        label: r.checklist_label,
        summary: r.summary,
        created_at: r.created_at,
      })),
    );
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && saveChecklists) void loadChecklistHistory();
  }, [user?.id, saveChecklists, loadChecklistHistory]);

  const updateSavePreference = async (next: boolean) => {
    setSaveChecklists(next);
    window.localStorage.setItem(SAVE_PREF_KEY, next ? "true" : "false");
    if (!user?.id) return;
    await supabase
      .from("member_profiles")
      .update({ coach_save_checklists: next })
      .eq("user_id", user.id);
    if (!next) setChecklistHistory([]);
  };

  const deleteSavedResults = async () => {
    if (!user?.id) return;
    await supabase.from("coach_checklist_results").delete().eq("user_id", user.id);
    setChecklistHistory([]);
  };

  const handleAcceptConsent = () => {
    if (!agreeTerms) return;
    window.localStorage.setItem(CONSENT_KEY, "true");
    window.localStorage.setItem(
      NEWSLETTER_OPTIN_KEY,
      newsletterOptIn ? "true" : "false",
    );
    setHasConsented(true);
  };

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /** Persists a checklist summary when she has opted in and is signed in. */
  const persistChecklistResult = useCallback(async (raw: string) => {
    const match = raw.match(CHECKLIST_MARKER);
    if (!match) return;
    if (!user?.id || !saveChecklists) return;
    let parsed: { key?: string; summary?: string };
    try {
      parsed = JSON.parse(match[1]);
    } catch {
      return;
    }
    if (!parsed.key || !parsed.summary) return;
    await supabase.from("coach_checklist_results").insert({
      user_id: user.id,
      checklist_key: parsed.key,
      checklist_label: CHECKLIST_LABELS[parsed.key] ?? "Checklist",
      summary: parsed.summary,
    });
    void loadChecklistHistory();
  }, [user?.id, saveChecklists, loadChecklistHistory]);

  const submitRating = async (value: number) => {
    const closeAfter = ratingFromClose;
    setHasRated(true);
    setShowRating(false);
    setRatingFromClose(false);
    await supabase.from("coach_ratings").insert({
      user_id: user?.id ?? null,
      rating: value,
      feedback: ratingFeedback.trim() || null,
      feedback_question: feedbackQuestion,
      // The chat the rating refers to — without it a 2-star score is unreadable.
      // Markers are already stripped from what we keep.
      transcript: messages.map((m) => ({ role: m.role, content: m.content })),
      message_count: messages.length,
    });
    setRatingFeedback("");
    if (closeAfter) setOpen(false);
  };

  const dismissRating = () => {
    const closeAfter = ratingFromClose;
    setHasRated(true);
    setShowRating(false);
    setRatingFromClose(false);
    if (closeAfter) setOpen(false);
  };

  /**
   * Turns a satisfied user into a distribution channel: opens WhatsApp with a
   * pre-filled message pointing at the /try page for the flow she just did
   * (or Zara's own page when the chat was not a checklist).
   */
  const shareWithFriend = () => {
    const flow = activeChecklist ? TRY_BY_COACH_ID[activeChecklist] : undefined;
    void logEngagement("zara_share_click", null, {
      checklist: activeChecklist,
      source: "zara_widget",
    });
    const url = flow
      ? whatsappShareUrl(flow, "zara-chat")
      : `https://wa.me/?text=${encodeURIComponent(
          `Found this useful — Zara is a free, private coach for women in the UAE. Five minutes, no signup: ${SITE_ORIGIN}/ai-coach-for-women-uae?ref=zara-chat`,
        )}`;
    window.open(url, "_blank", "noopener");
  };

  const handleClose = () => {
    if (!hasRated && messages.filter((m) => m.role === "user").length >= 2) {
      setFeedbackQuestion(pickFeedbackQuestion());
      setRatingFromClose(true);
      setShowRating(true);
      return;
    }
    setOpen(false);
  };

  // Fire a deep-linked checklist once she is past the consent gate and the
  // conversation is still empty (never interrupt one already in progress).
  useEffect(() => {
    if (!pendingStart || !open || !hasConsented || isLoading || messages.length > 0) return;
    const flow = CHECKLISTS.find((c) => c.id === pendingStart);
    setPendingStart(null);
    if (flow) void sendMessage(flow.full);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingStart, open, hasConsented, isLoading, messages.length]);


  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    // Remember which checklist this conversation is about, so "send to a
    // friend" shares the page for the flow she actually just did.
    const startedFlow = CHECKLISTS.find((c) => c.full === text.trim());
    if (startedFlow) {
      setActiveChecklist(startedFlow.id);
      void logEngagement("zara_checklist_started", null, {
        checklist: startedFlow.id,
        source: "zara_widget",
      });
    }
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    await streamChat({
      messages: [...messages, userMsg],
      userProfile: memberProfile ?? undefined,
      checklistHistory: user?.id && saveChecklists ? checklistHistory : undefined,
      saveChecklists: user?.id ? saveChecklists : false,
      bucketKey: abBucketKey,
      onDelta: upsertAssistant,
      onDone: () => {
        setIsLoading(false);
        void persistChecklistResult(assistantSoFar);
      },
      onError: (err) => {
        setMessages((prev) => [...prev, { role: "assistant", content: `Sorry, something went wrong: ${err}` }]);
        setIsLoading(false);
      },
    });
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <div data-coach-anchor className="fixed bottom-6 right-6 z-[60] flex items-end gap-3 max-w-[calc(100vw-3rem)]">
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              onClick={() => setOpen(true)}
              className="hidden sm:block rounded-2xl px-4 py-2.5 shadow-md text-sm font-body font-medium text-left leading-snug max-w-[260px] hover:shadow-lg transition-shadow"
              style={{ background: "#FDF8F3", color: "#4A2040", border: "1px solid #D4A85360" }}
              aria-label="Ask Zara anything about growing your career in UAE"
            >
              Ask Zara anything about growing your career in UAE.
            </motion.button>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="sm:hidden rounded-full px-3 py-1.5 shadow-md text-xs font-body font-medium whitespace-nowrap"
              style={{ background: "#FDF8F3", color: "#4A2040", border: "1px solid #D4A85360" }}
            >
              Ask Zara 💜
            </motion.div>
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.25 }}
              onClick={() => setOpen(true)}
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: "#4A2040" }}
              aria-label="Open Zara, your Fempower Coach"
            >
              <motion.img
                src={butterflyIcon}
                alt="Zara, Fempower Coach"
                width={34}
                height={34}
                animate={{
                  scale: [1, 1.12, 1],
                  rotateY: [0, 15, -15, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            data-coach-anchor
            className="fixed bottom-4 right-4 z-[60] w-[370px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-2rem)] rounded-2xl shadow-2xl flex flex-col overflow-hidden border"
            style={{ background: "#FDF8F3", borderColor: "#4A204030" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background: "#4A2040", borderColor: "#4A204040" }}>
              <div className="flex items-center gap-2">
                <Sparkles size={20} style={{ color: "#D4A853" }} />
                <div className="flex flex-col leading-tight">
                  <span className="font-heading text-base font-semibold text-white">Zara</span>
                  <span className="font-body text-[10px] uppercase tracking-widest text-white/70">Your Fempower Coach</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowPrivacy((v) => !v)}
                  className="text-white/70 hover:text-white transition-colors p-1"
                  aria-label="Checklist privacy settings"
                  aria-expanded={showPrivacy}
                >
                  <ShieldCheck size={18} />
                </button>
                <button onClick={handleClose} className="text-white/70 hover:text-white transition-colors p-1" aria-label="Close chat">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Checklist privacy panel */}
            <AnimatePresence>
              {showPrivacy && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b"
                  style={{ background: "#F6EFE8", borderColor: "#4A204020" }}
                >
                  <div className="px-4 py-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-body font-semibold" style={{ color: "#4A2040" }}>
                          Save my checklist results
                        </p>
                        <p className="text-[11px] font-body leading-snug" style={{ color: "#4A204090" }}>
                          {saveChecklists
                            ? "Your checklist summaries are saved privately to your profile, so Zara can pick up where you left off."
                            : "Nothing is stored. Your checklist summaries stay in this conversation only."}
                        </p>
                      </div>
                      <Switch
                        checked={saveChecklists}
                        onCheckedChange={(v) => void updateSavePreference(v)}
                        aria-label="Save checklist results"
                      />
                    </div>
                    {!user && (
                      <p className="text-[11px] font-body" style={{ color: "#4A204080" }}>
                        Sign in to save results across sessions.
                      </p>
                    )}
                    {user && checklistHistory.length > 0 && (
                      <button
                        onClick={() => void deleteSavedResults()}
                        className="text-[11px] font-body underline underline-offset-2"
                        style={{ color: "#a32a2a" }}
                      >
                        Delete my {checklistHistory.length} saved result{checklistHistory.length === 1 ? "" : "s"}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && !hasConsented && (
                <div className="space-y-4">
                  <p className="text-sm font-body" style={{ color: "#4A2040" }}>
                    Hi, I'm Zara — your Fempower coach. Before we start, a quick heads-up so you know exactly what you're saying yes to.
                  </p>
                  <ul className="text-xs font-body space-y-1.5 list-disc pl-4" style={{ color: "#4A204099" }}>
                    <li>Your messages are sent to an AI provider to generate a reply and saved to your account so you can revisit them.</li>
                    <li>Zara is not a substitute for professional medical, legal, or mental-health advice.</li>
                    <li>Please don't share passwords, ID numbers, or payment details.</li>
                  </ul>
                  <div className="space-y-2.5 rounded-xl border p-3" style={{ borderColor: "#4A204025", background: "#ffffff80" }}>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <Checkbox
                        checked={agreeTerms}
                        onCheckedChange={(v) => setAgreeTerms(v === true)}
                        className="mt-0.5 border-[#4A2040] data-[state=checked]:bg-[#4A2040]"
                      />
                      <span className="text-xs font-body leading-snug" style={{ color: "#4A2040" }}>
                        I agree to Fempower's{" "}
                        <Link to="/terms" target="_blank" className="underline underline-offset-2">
                          Terms &amp; Conditions
                        </Link>{" "}
                        and{" "}
                        <Link to="/privacy" target="_blank" className="underline underline-offset-2">
                          Privacy Policy
                        </Link>
                        . <span style={{ color: "#a32a2a" }}>(required)</span>
                      </span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <Checkbox
                        checked={newsletterOptIn}
                        onCheckedChange={(v) => setNewsletterOptIn(v === true)}
                        className="mt-0.5 border-[#4A2040] data-[state=checked]:bg-[#4A2040]"
                      />
                      <span className="text-xs font-body leading-snug" style={{ color: "#4A2040" }}>
                        Email me follow-up tips, resources, and community updates from Fempower. <span style={{ color: "#4A204080" }}>(optional — you can unsubscribe anytime)</span>
                      </span>
                    </label>
                  </div>
                  <Button
                    onClick={handleAcceptConsent}
                    disabled={!agreeTerms}
                    className="w-full rounded-full text-white"
                    style={{ background: agreeTerms ? "#4A2040" : "#4A204060" }}
                  >
                    Start chatting with Zara
                  </Button>
                </div>
              )}
              {messages.length === 0 && hasConsented && (
                <div className="space-y-3">
                  <p className="text-sm font-body" style={{ color: "#4A2040" }}>
                    Hi, I'm Zara — your Fempower coach.
                  </p>
                  <p className="text-xs font-body uppercase tracking-widest" style={{ color: "#4A204090" }}>
                    Where would you like to start?
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {starters.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => sendMessage(s.full)}
                        className="text-left text-xs font-body px-3 py-2 rounded-full border transition-colors hover:bg-[#4A2040]/5"
                        style={{ borderColor: "#4A2040", color: "#C9A84C", background: "transparent" }}
                      >
                        <span style={{ color: "#4A2040" }}>{s.label}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setStarters(pickStarters())}
                    className="text-[11px] font-body underline-offset-2 hover:underline"
                    style={{ color: "#4A204080" }}
                  >
                    Show me different options
                  </button>

                  <div className="pt-2 mt-1 border-t space-y-2" style={{ borderColor: "#4A204015" }}>
                    <p className="text-xs font-body uppercase tracking-widest" style={{ color: "#4A204090" }}>
                      Or walk through a checklist
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {CHECKLISTS.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => sendMessage(c.full)}
                          className="text-xs font-body px-3 py-2 rounded-full border transition-colors hover:bg-[#D4A853]/15"
                          style={{ borderColor: "#D4A853", color: "#4A2040", background: "#D4A85315" }}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] font-body leading-snug" style={{ color: "#4A204080" }}>
                      One question at a time, then a summary. These are Fempower's own questions, inspired by the themes in Harnidh Kaur's <em>The Girls Are Not Fine</em> — not quoted from it.
                    </p>
                  </div>

                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm font-body ${
                      msg.role === "user" ? "text-white" : ""
                    }`}
                    style={
                      msg.role === "user"
                        ? { background: "#4A2040" }
                        : { background: "#f3ede8", color: "#2d1a28" }
                    }
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_strong]:font-semibold">
                        <ReactMarkdown>{stripMarker(msg.content)}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3" style={{ background: "#f3ede8" }}>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#D4A853", animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#D4A853", animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#D4A853", animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Send to a friend — every satisfied user is a distribution channel */}
            {messages.length >= 2 && !isLoading && (
              <button
                type="button"
                onClick={shareWithFriend}
                className="flex items-center justify-center gap-2 border-t px-4 py-2.5 text-[11px] font-body transition-colors hover:bg-[#D4A853]/15"
                style={{ borderColor: "#4A204015", color: "#4A2040", background: "#D4A85310" }}
              >
                <Share2 size={13} />
                Found this useful? Send it to a woman who'd benefit.
              </button>
            )}

            {/* Input */}
            <div className="p-3 border-t" style={{ borderColor: "#4A204015" }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(input);
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={hasConsented ? "Or tell me what's on your mind…" : "Please accept the terms above to start chatting"}
                  className="flex-1 text-sm font-body rounded-full border"
                  style={{ borderColor: "#4A204030" }}
                  disabled={isLoading || !hasConsented}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || !input.trim() || !hasConsented}
                  className="rounded-full shrink-0"
                  style={{ background: "#4A2040" }}
                >
                  <Send size={16} className="text-white" />
                </Button>
              </form>
              <p className="text-[10px] text-center mt-1.5 font-body" style={{ color: "#4A204060" }}>
                Powered by Fempower UAE
                {messages.length > 0 && !hasRated && (
                  <>
                    {" · "}
                    <button
                      onClick={() => { setFeedbackQuestion(pickFeedbackQuestion()); setShowRating(true); }}
                      className="underline underline-offset-2"
                      style={{ color: "#4A204090" }}
                    >
                      Rate this chat
                    </button>
                  </>
                )}
              </p>
            </div>

            {/* Rating */}
            <AnimatePresence>
              {showRating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex items-end"
                  style={{ background: "#2d1a2880" }}
                >
                  <motion.div
                    initial={{ y: 40 }}
                    animate={{ y: 0 }}
                    exit={{ y: 40 }}
                    className="w-full rounded-t-2xl p-4 space-y-3"
                    style={{ background: "#FDF8F3" }}
                  >
                    <p className="font-heading text-base font-semibold" style={{ color: "#4A2040" }}>
                      How was this conversation with Zara?
                    </p>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onMouseEnter={() => setHoverRating(n)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(n)}
                          aria-label={`${n} star${n === 1 ? "" : "s"}`}
                          className="p-1"
                        >
                          <Star
                            size={28}
                            style={{ color: "#D4A853" }}
                            fill={(hoverRating || rating) >= n ? "#D4A853" : "transparent"}
                          />
                        </button>
                      ))}
                    </div>
                    <label
                      htmlFor="zara-feedback"
                      className="block font-body text-sm"
                      style={{ color: "#4A2040" }}
                    >
                      {feedbackQuestion}{" "}
                      <span style={{ color: "#4A204080" }}>(optional)</span>
                    </label>
                    <Textarea
                      id="zara-feedback"
                      value={ratingFeedback}
                      onChange={(e) => setRatingFeedback(e.target.value)}
                      placeholder="A sentence is plenty."
                      rows={2}
                      className="text-sm font-body"
                      style={{ borderColor: "#4A204030" }}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => void submitRating(rating)}
                        disabled={rating === 0}
                        className="flex-1 rounded-full text-white"
                        style={{ background: rating ? "#4A2040" : "#4A204060" }}
                      >
                        Send rating
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={dismissRating}
                        className="rounded-full text-sm font-body"
                        style={{ color: "#4A204090" }}
                      >
                        Not now
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FempowerCoach;
