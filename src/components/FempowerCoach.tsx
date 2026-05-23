import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { streamChat, type Msg } from "@/lib/streamChat";
import { motion, AnimatePresence } from "framer-motion";
import butterflyIcon from "@/assets/butterfly-icon.png";

const STARTERS = [
  "I have a difficult conversation coming up...",
  "Help me prepare for a salary negotiation",
  "How do I manage a stakeholder who keeps changing requirements?",
  "I need to present to senior leadership next week",
  "Give me a framework for prioritizing my projects",
  "I want to set better boundaries at work",
];

const FempowerCoach = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
          <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-3">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-full px-4 py-2 shadow-md text-sm font-body font-medium whitespace-nowrap"
              style={{ background: "#FDF8F3", color: "#4A2040", border: "1px solid #D4A85360" }}
            >
              Talk to me 💜
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
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-body" style={{ color: "#4A2040" }}>
                    Hi, I'm Zara — your Fempower coach. Tell me what's on your plate this week, or pick a starting point below.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {STARTERS.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="text-xs font-body px-3 py-1.5 rounded-full border transition-colors hover:bg-opacity-10"
                        style={{ borderColor: "#D4A853", color: "#4A2040" }}
                      >
                        {s}
                      </button>
                    ))}
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
                  placeholder="Type your message..."
                  className="flex-1 text-sm font-body rounded-full border"
                  style={{ borderColor: "#4A204030" }}
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || !input.trim()}
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
