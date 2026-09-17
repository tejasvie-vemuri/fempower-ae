/**
 * The four Zara checklists, in the shape the shareable /try/<slug> landing
 * pages need. `coachId` is the id the Zara widget understands (?start= and the
 * `open-zara` event); `slug` is the public, shareable URL.
 *
 * Keep this list in sync with CHECKLISTS in src/components/FempowerCoach.tsx.
 */
export type TryChecklist = {
  slug: string;
  coachId: string;
  label: string;
  /** The emotional hook — never lead with "AI coach". */
  hook: string;
  subhook: string;
  /** Real questions from the flow, used as the page's proof and its marketing. */
  sampleQuestions: string[];
  /**
   * Every question in the flow, written out. Zara phrases them in her own words
   * in the moment, but these are the questions she works through — published as
   * readable text so search engines and AI assistants can actually see what the
   * checklist contains instead of an opaque "start chat" button.
   */
  allQuestions: string[];
  /** One line on what the closing summary gives her. */
  outcome: string;
  minutes: number;
  questionCount: number;
  metaTitle: string;
  metaDescription: string;
  /** Pre-filled WhatsApp share message (link appended at share time). */
  shareText: string;
};

export const TRY_CHECKLISTS: TryChecklist[] = [
  {
    slug: "invisible-labour-audit",
    coachId: "invisible-labour",
    label: "Invisible Labour Audit",
    hook: "You're not tired because you're doing too little.",
    subhook:
      "The remembering, organising, smoothing-over and admin you carry never shows up on a job description or a performance review. Eight questions to see the whole load in one place — and name one thing worth handing over.",
    sampleQuestions: [
      "What did you organise this week that nobody asked you to organise?",
      "Whose birthdays, appointments or deadlines live in your head?",
      "What would fall apart next week if you simply stopped?",
    ],
    allQuestions: [
      "Who remembers the birthdays, renewals, visas and appointments in your household?",
      "What do you organise at work that nobody calls work \u2014 notes, planning, onboarding, the socials?",
      "Whose moods do you manage in a normal week?",
      "What happens if you stop doing all of it for one week?",
      "How much of this lands after hours, once the official day is over?",
      "Has anyone ever thanked you for a specific piece of it, by name?",
      "If you could hand over exactly one thing, what would it be?",
      "What would you do with the time that hands back?",
    ],
    outcome:
      "Zara names the load \u2014 in rough hours per week if you gave her enough to estimate \u2014 and ends with one thing to hand back to someone else.",
    minutes: 6,
    questionCount: 8,
    metaTitle: "Invisible Labour Audit — a free 6-minute check with Zara | Fempower",
    metaDescription:
      "A free, private 8-question audit of the unrecognised work you carry at home and at work. Guided one question at a time by Zara, Fempower's AI coach for women in the UAE.",
    shareText:
      "This one made me stop and count everything I carry that nobody sees. Eight questions, about 6 minutes, free and private:",
  },
  {
    slug: "the-ask-checklist",
    coachId: "the-ask",
    label: "The Ask Checklist",
    hook: "\"I think I deserve more\" is not a sentence you can say out loud.",
    subhook:
      "Seven questions that turn a vague feeling into a specific ask: what exactly you want, the evidence behind it, who actually decides, when to raise it, and what you'll do if the answer is no.",
    sampleQuestions: [
      "What are you asking for, in one sentence, with a number in it?",
      "Who actually signs off on this — and have you ever spoken to them?",
      "What is your answer if they say \"not right now\"?",
    ],
    allQuestions: [
      "What exactly are you asking for \u2014 a raise, a promotion, a title, or a boundary?",
      "What are your three strongest pieces of evidence?",
      "What is your number, or your line? (\"More\" is not an ask \u2014 pick a figure or a limit.)",
      "What do you think you're worth, versus what you plan to ask for \u2014 and why do those differ?",
      "Who actually decides, and what do they care about?",
      "What will you say if the answer is no, or \"not right now\"?",
      "When are you putting it in the calendar?",
    ],
    outcome:
      "Zara ends with a word-for-word script you can say or send, plus your line for a no \u2014 factoring in UAE realities like salary bands, sponsorship and end-of-service, and pointing to MOHRE rather than quoting law.",
    minutes: 6,
    questionCount: 7,
    metaTitle: "The Ask Checklist — prepare your raise or promotion ask | Fempower",
    metaDescription:
      "Free, private 7-question prep for asking for a raise, a promotion, a title or a boundary — built for the UAE market. Guided by Zara, Fempower's AI coach for women.",
    shareText:
      "If you've been putting off asking for a raise, this walks you through it in 7 questions. Free, private, takes about 6 minutes:",
  },
  {
    slug: "am-i-actually-fine",
    coachId: "actually-fine",
    label: "Am I Actually Fine?",
    hook: "How many times this week did you say \"I'm fine\" without checking?",
    subhook:
      "Six questions for the weeks when fine is a reflex, not a report. Sleep, capacity, resentment, what you quietly dropped. No score, no diagnosis — just a clearer read on where you actually are.",
    sampleQuestions: [
      "When you said \"I'm fine\" this week, what was the true answer?",
      "What have you quietly dropped that you used to care about?",
      "Who, if anyone, has asked you how you're doing and waited for the answer?",
    ],
    allQuestions: [
      "How are you sleeping \u2014 honestly, on a scale of 1 to 5?",
      "What are you quietly resentful about right now?",
      "What are you dreading this week?",
      "Where are you carrying it in your body?",
      "When did you last feel genuinely delighted by something?",
      "Where did you say yes this week when you meant no?",
    ],
    outcome:
      "Zara gives you a plain-language read \u2014 never a diagnosis, never a score out of 100 \u2014 and one act of subtraction: something to remove, not add. If several answers point to real distress, she stops the questions and shares UAE support lines.",
    minutes: 5,
    questionCount: 6,
    metaTitle: "Am I Actually Fine? — a free weekly check-in with Zara | Fempower",
    metaDescription:
      "A free, private 6-question weekly check-in for the weeks when \"I'm fine\" is a reflex. Guided one question at a time by Zara, Fempower's AI coach for women in the UAE.",
    shareText:
      "Six questions for anyone who's been saying \"I'm fine\" on autopilot. Free, private, five minutes:",
  },
  {
    slug: "relocation-load",
    coachId: "relocation-load",
    label: "Relocation Load",
    hook: "Moving country is a full-time job that lands on one person.",
    subhook:
      "Nine UAE-specific questions on the load nobody costed in: visas and Emirates ID, Ejari and DEWA, school applications and KHDA or ADEK timelines, household set-up and the family logistics. Zara points you to official sources, not guesses.",
    sampleQuestions: [
      "Which piece of paperwork is currently blocking everything else?",
      "Who in your household is holding the school applications?",
      "What did you assume would take a week and has taken a month?",
    ],
    allQuestions: [
      "How long have you been in the UAE, or when do you move?",
      "Visa and paperwork \u2014 what is still open (entry permit, medical, Emirates ID, stamping, attestation, licence conversion, Ejari, DEWA or ADDC, health insurance), and who is doing the chasing?",
      "Schools \u2014 where are you in the process: shortlisting, KHDA or ADEK ratings, assessments, waiting lists, transfer certificates, uniforms, bus routes, term-date mismatches? (If no children, what are you coordinating instead?)",
      "Household \u2014 who set up the home: movers, shipping, furniture, internet, domestic help visas, the hundred small decisions?",
      "Family logistics \u2014 who else depends on you here or back home?",
      "What are you carrying that nobody else in the house even knows exists?",
      "What did you give up to come here?",
      "Who can you call at 9pm on a bad day \u2014 a real name, not \"I'd manage\"?",
      "What one thing would make next month lighter?",
    ],
    outcome:
      "Zara names the load as labour rather than admin, then gives you one admin action (the single unblocked next step), one human action (a person to contact this week), the Newcomer Starter Kit, and a real meetup or event in your emirate. She points to official sources \u2014 ICP, GDRFA, MOHRE, KHDA, ADEK, RTA \u2014 rather than quoting fees or rules.",
    minutes: 7,
    questionCount: 9,
    metaTitle: "Relocation Load — the invisible admin of moving to the UAE | Fempower",
    metaDescription:
      "A free, private 9-question walkthrough of UAE relocation admin: visas, Emirates ID, Ejari, DEWA, school applications and household logistics. Guided by Zara, Fempower's AI coach.",
    shareText:
      "If you're mid-move to the UAE (or helping someone who is), this untangles the admin in 9 questions. Free and private:",
  },
];

export const TRY_BY_SLUG: Record<string, TryChecklist> = Object.fromEntries(
  TRY_CHECKLISTS.map((c) => [c.slug, c]),
);

export const TRY_BY_COACH_ID: Record<string, TryChecklist> = Object.fromEntries(
  TRY_CHECKLISTS.map((c) => [c.coachId, c]),
);

export const SITE_ORIGIN = "https://fempowerae.com";

export const tryUrl = (slug: string) => `${SITE_ORIGIN}/try/${slug}`;

/** WhatsApp share link for a checklist — the "send to a friend" distribution loop. */
export function whatsappShareUrl(checklist: TryChecklist, source: string) {
  const url = `${tryUrl(checklist.slug)}?ref=${encodeURIComponent(source)}`;
  return `https://wa.me/?text=${encodeURIComponent(`${checklist.shareText} ${url}`)}`;
}
