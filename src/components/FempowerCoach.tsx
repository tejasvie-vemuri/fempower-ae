import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { streamChat, type Msg } from "@/lib/streamChat";
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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Allow other components (e.g. HeroSection) to open Zara via a global event
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-zara", handler);
    return () => window.removeEventListener("open-zara", handler);
  }, []);

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

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
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
      onDelta: upsertAssistant,
      onDone: () => setIsLoading(false),
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
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

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
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
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
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FempowerCoach;
