import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, PartyPopper, Sparkles } from "lucide-react";
import {
  STORY_QUESTIONS,
  emptyStoryAnswers,
  type StoryAnswers,
  type SpotlightRequest,
} from "@/lib/spotlightRequests";
import SpotlightStory from "@/components/SpotlightStory";
import { composeStoryText } from "@/lib/spotlightRequests";
import { PhotoUpload } from "@/components/directory/PhotoUpload";
import { MemberAvatar } from "@/components/directory/MemberAvatar";

type Phase = "loading" | "none" | "form" | "photo" | "review" | "submitted";

const ShareMyStory = () => {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("loading");
  const [request, setRequest] = useState<SpotlightRequest | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<StoryAnswers>(emptyStoryAnswers);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("spotlight_requests")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) {
        setPhase("none");
        return;
      }
      setRequest(data);

      const { data: profile } = await supabase
        .from("member_profiles")
        .select("name, photo_url")
        .eq("user_id", user.id)
        .maybeSingle();
      setMemberName(profile?.name ?? "");
      // Pre-fill with her existing profile photo so she isn't forced to re-upload
      // if she's happy with it — she can still replace it.
      setPhotoPath(profile?.photo_url ?? null);

      setPhase("form");
    })();
  }, [user]);

  const question = STORY_QUESTIONS[step];
  const value = question ? answers[question.field] : "";
  const canAdvance = question ? (!question.required || value.trim().length > 0) : false;
  const isLastStep = step === STORY_QUESTIONS.length - 1;

  const setAnswer = (v: string) => {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.field]: v.slice(0, question.maxLength) }));
  };

  const goNext = () => {
    if (isLastStep) {
      setPhase("photo");
    } else {
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (step === 0) return;
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!request || !consent) return;
    setSubmitting(true);
    const { error } = await (supabase as any)
      .from("spotlight_requests")
      .update({
        ...answers,
        photo_url: photoPath,
        consent_social: consent,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", request.id);
    setSubmitting(false);
    if (error) {
      toast.error("Could not submit — please try again");
      return;
    }
    setPhase("submitted");
  };

  if (phase === "loading") {
    return (
      <>
        <Header />
        <main className="pt-28 pb-20 min-h-screen bg-background flex justify-center">
          <Loader2 className="animate-spin mt-20" />
        </main>
        <Footer />
      </>
    );
  }

  if (phase === "none") {
    return (
      <>
        <Header />
        <main className="pt-28 md:pt-32 pb-20 min-h-screen bg-background">
          <div className="container max-w-xl text-center">
            <Sparkles size={40} className="mx-auto text-blush-dark mb-4" />
            <h1 className="font-heading text-2xl md:text-3xl font-semibold mb-3">
              Spotlights are by invite
            </h1>
            <p className="font-body text-muted-foreground mb-8">
              There's no open invite for you right now. If you think your story deserves the
              spotlight, reach out to the FemPower team — we'd love to hear it.
            </p>
            <Button asChild>
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (phase === "submitted") {
    return (
      <>
        <Header />
        <main className="pt-28 md:pt-32 pb-20 min-h-screen bg-background">
          <div className="container max-w-xl text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <PartyPopper size={48} className="mx-auto text-blush-dark mb-4" />
              <h1 className="font-heading text-3xl font-semibold mb-3">Thank you for sharing 💛</h1>
              <p className="font-body text-muted-foreground mb-8">
                Your story is with our team. Once it's ready, it'll go live on the site and we'll
                let you know.
              </p>
              <Button asChild>
                <Link to="/">Back to home</Link>
              </Button>
            </motion.div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (phase === "photo") {
    return (
      <>
        <Header />
        <section className="pt-28 pb-6 md:pt-32 md:pb-8 bg-background">
          <div className="container max-w-xl">
            <button
              onClick={() => setStep(STORY_QUESTIONS.length - 1)}
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <p className="flex items-center gap-2 text-xs md:text-sm font-body font-bold uppercase tracking-widest-xl text-blush-dark mb-4">
              <Sparkles size={14} /> Your photo
            </p>
          </div>
        </section>
        <main className="bg-secondary pb-20">
          <div className="container max-w-xl pt-2">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div>
                <h2 className="font-heading text-xl font-semibold mb-1">Add a photo</h2>
                <p className="font-body text-sm text-muted-foreground mb-4">
                  A clear photo of you makes the story land. We've started you off with your
                  profile photo — swap it for another if you'd like.
                </p>
                {user && (
                  <PhotoUpload userId={user.id} value={photoPath} onChange={setPhotoPath} />
                )}
              </div>
              <div className="flex items-center justify-between gap-3 pt-2">
                <Button variant="outline" onClick={() => setPhase("form")}>
                  <ArrowLeft size={14} className="mr-1" /> Back
                </Button>
                <Button onClick={() => setPhase("review")} disabled={!photoPath}>
                  Review <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (phase === "review") {
    return (
      <>
        <Header />
        <section className="pt-28 pb-10 md:pt-32 md:pb-14 bg-background">
          <div className="container max-w-xl">
            <button
              onClick={() => setPhase("photo")}
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6"
            >
              <ArrowLeft size={14} /> Back to edit
            </button>
            <p className="flex items-center gap-2 text-xs md:text-sm font-body font-bold uppercase tracking-widest-xl text-blush-dark mb-4">
              <Sparkles size={14} /> Here's how it'll look
            </p>
          </div>
        </section>
        <main className="bg-secondary pb-20">
          <div className="container max-w-xl pt-2">
            <div className="bg-blush-light/50 border border-blush-dark/10 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0">
                <MemberAvatar
                  path={photoPath}
                  alt={memberName}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-blush-dark/20"
                  fallback={
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-blush-dark/10 flex items-center justify-center text-2xl font-heading font-semibold text-blush-dark">
                      {(memberName || "?").charAt(0)}
                    </div>
                  }
                />
              </div>
              <div className="flex-1 min-w-0">
                {memberName && <h3 className="font-heading text-xl font-semibold mb-2">{memberName}</h3>}
                <SpotlightStory story={composeStoryText(answers)} {...answers} />
              </div>
            </div>

            <div className="flex items-start gap-3 mt-6 bg-card border border-border rounded-xl p-4">
              <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
              <label htmlFor="consent" className="font-body text-sm text-foreground/85 leading-relaxed cursor-pointer">
                I agree that FemPower AE can publish this story and photo on the website and share
                it on social media (LinkedIn, Instagram, and similar). I can ask for it to be taken
                down at any time.
              </label>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || !consent}
              className="w-full mt-6"
            >
              {submitting && <Loader2 size={14} className="mr-2 animate-spin" />}
              Submit my story
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // phase === "form"
  return (
    <>
      <Header />
      <section className="pt-28 pb-6 md:pt-32 md:pb-8 bg-background">
        <div className="container max-w-xl">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6"
          >
            <ArrowLeft size={14} /> Back
          </Link>
          <p className="flex items-center gap-2 text-xs md:text-sm font-body font-bold uppercase tracking-widest-xl text-blush-dark mb-4">
            <Sparkles size={14} /> Share Your Story
          </p>
          {request?.personal_note && (
            <div className="bg-blush-light/50 border border-blush-dark/10 rounded-xl p-4 mb-2">
              <p className="font-body text-sm text-foreground/85 italic">"{request.personal_note}"</p>
            </div>
          )}
        </div>
      </section>

      <main className="bg-secondary pb-20">
        <div className="container max-w-xl pt-6">
          <div className="flex items-center gap-1.5 mb-4">
            {STORY_QUESTIONS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-blush-dark" : "bg-blush-dark/15"}`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground font-body mb-4">
            Step {step + 1} of {STORY_QUESTIONS.length}
          </p>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
              className="bg-card border border-border rounded-2xl p-6 space-y-4"
            >
              <div>
                <h2 className="font-heading text-xl font-semibold mb-1">{question.label}</h2>
                <p className="font-body text-sm text-muted-foreground mb-4">{question.prompt}</p>
                {question.multiline ? (
                  <Textarea
                    value={value}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder={question.placeholder}
                    rows={4}
                    maxLength={question.maxLength}
                    autoFocus
                  />
                ) : (
                  <Input
                    value={value}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder={question.placeholder}
                    maxLength={question.maxLength}
                    autoFocus
                  />
                )}
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {value.length}/{question.maxLength}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <Button variant="outline" onClick={goBack} disabled={step === 0}>
                  <ArrowLeft size={14} className="mr-1" /> Back
                </Button>
                <Button onClick={goNext} disabled={!canAdvance}>
                  {isLastStep ? "Review" : "Next"} <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ShareMyStory;
