/**
 * The anti-slop test harness: example chats that reliably tempt a model into
 * sounding like an assistant instead of a person.
 *
 * Each case pins the trap it is testing so a regression points at a rule.
 */

export type SlopCase = {
  key: string;
  label: string;
  /** What this case is designed to catch. */
  trap: string;
  /** Prior turns, oldest first. The last user turn is the one being scored. */
  messages: { role: "user" | "assistant"; content: string }[];
  profile?: {
    name?: string;
    city?: string;
    role?: string;
    company?: string;
    industry?: string;
  };
};

export const SLOP_CASES: SlopCase[] = [
  {
    key: "short_advice",
    label: "One-line advice question",
    trap: "Long balanced menu of options instead of one position; over-length reply.",
    messages: [{ role: "user", content: "hey quick q - should i ask for a raise now or wait till jan?" }],
    profile: { name: "Aisha", city: "Dubai", role: "Product Manager", industry: "Fintech" },
  },
  {
    key: "venting_short",
    label: "Short vent, high emotion",
    trap: "Validation opener, 'I hear you', bulleted feelings, closing affirmation.",
    messages: [{ role: "user", content: "my manager took credit for my work again today. i just sat there." }],
    profile: { name: "Priya", city: "Abu Dhabi", role: "Data Analyst", company: "Etihad" },
  },
  {
    key: "im_fine",
    label: "The 'I'm fine' reflex",
    trap: "Toxic positivity, 'hold space', therapy-speak.",
    messages: [{ role: "user", content: "im fine honestly. just tired." }],
    profile: { name: "Lina", city: "Sharjah" },
  },
  {
    key: "long_raw",
    label: "Long raw paragraph",
    trap: "Restating her words back; a three-suggestion arc; a bow at the end.",
    messages: [
      {
        role: "user",
        content:
          "I moved to Dubai in March with my husband and two kids and I have not stopped since. I did the visa runs, the Emirates ID appointments, three school tours, the Ejari, the DEWA account, and I started a new job in week two. My husband keeps saying I am doing amazingly but he has not made a single phone call about any of it. I am not even angry, I am just so tired that I cannot tell whether I like it here.",
      },
    ],
    profile: { name: "Rania", city: "Dubai", role: "Marketing Director", industry: "Hospitality" },
  },
  {
    key: "second_turn_shape",
    label: "Second turn (shape repetition)",
    trap: "Reusing the same reflect-then-question shape twice in a row.",
    messages: [
      { role: "user", content: "i keep saying yes to everything at work" },
      {
        role: "assistant",
        content:
          "Saying yes is cheap in the moment and expensive by Thursday. What was the last thing you agreed to that you wish you hadn't?",
      },
      { role: "user", content: "covering the quarterly report for someone on leave. again." },
    ],
    profile: { name: "Maryam", city: "Dubai", role: "Finance Lead", company: "Majid Al Futtaim" },
  },
  {
    key: "judgement_bait",
    label: "Judgement bait",
    trap: "Labelling her boss toxic or her partner unfair; jumping to a conclusion.",
    messages: [
      {
        role: "user",
        content:
          "my boss messages me at 11pm and gets annoyed if i reply in the morning. is that normal here?",
      },
    ],
    profile: { name: "Sara", city: "Dubai", role: "Consultant", industry: "Professional services" },
  },
  {
    key: "practical_uae",
    label: "Practical UAE admin",
    trap: "Invented fees and timelines; generic advice with no concrete noun.",
    messages: [
      { role: "user", content: "how do i get my daughter into a school in abu dhabi mid-year?" },
    ],
    profile: { name: "Noor", city: "Abu Dhabi" },
  },
  {
    key: "meta_ai",
    label: "Are you a real person?",
    trap: "Performing humanity; hedging; a long philosophical answer.",
    messages: [{ role: "user", content: "are you a real person?" }],
  },
];
