/**
 * Deterministic anti-slop scorer for Zara's replies.
 *
 * The system prompt tells the model how to write; this file checks whether it
 * actually did. Every rule here maps 1:1 to a numbered Anti-Slop Rule in the
 * fempower-coach system prompt, so a failure in production points straight at
 * the rule that needs rewriting.
 *
 * Scoring is intentionally boring and regex-based: it has to run on every
 * response without adding latency or another model call.
 */

export type SlopContext = {
  /** The member's latest message. */
  userMessage: string;
  /** Zara's previous reply, used for the asymmetry check. */
  prevAssistant?: string;
  /** Profile fields we can require Zara to name concretely. */
  profile?: {
    name?: string | null;
    city?: string | null;
    role?: string | null;
    company?: string | null;
    industry?: string | null;
  } | null;
};

export type Violation = {
  rule: string;
  label: string;
  weight: number;
  detail: string;
};

export type SlopResult = {
  score: number;
  violations: Violation[];
  checks: Record<string, "pass" | "fail" | "na">;
  meta: {
    userWords: number;
    replyWords: number;
    replySentences: number;
    questions: number;
  };
};

const BANNED_OPENERS = [
  "that's a great question",
  "that is a great question",
  "that's such an important question",
  "great question",
  "it sounds like",
  "i hear you",
  "i can hear how",
  "i can hear that",
  "absolutely",
  "of course",
  "certainly",
  "let's unpack",
  "first, i want to acknowledge",
  "thank you for sharing",
  "thanks for sharing",
  "what a powerful",
  "i'm so glad you asked",
  "that's completely valid",
  "that's so valid",
];

const BANNED_PHRASES = [
  "journey",
  "navigate",
  "hold space",
  "unpack",
  "lean into",
  "honour your feelings",
  "honor your feelings",
  "that's so valid",
  "at the end of the day",
  "the truth is",
  "here's the thing",
  "i want you to know that",
  "you've got this",
  "you got this",
  "sending you strength",
  "you are not alone in this",
  "you're not alone in this",
  "slay",
  "queen",
  "boss babe",
  "good vibes",
  "dive deep",
  "delve",
  "tapestry",
  "in today's fast-paced",
  "empower yourself",
];

const ANTITHESIS = [
  /it'?s not just [^.?!]{1,60}?,?\s+(?:it'?s|but)\s/i,
  /it'?s not about [^.?!]{1,60}?,?\s+it'?s about\s/i,
  /this isn'?t (?:just )?(?:about )?[^.?!]{1,60}?,?\s+(?:it'?s|this is)\s/i,
  /not (?:just )?a [^.?!]{1,40}? — (?:it'?s|but) a /i,
];

const CLOSING_BOW = [
  /\byou'?(?:ve| have) got this\.?\s*$/i,
  /\bbe (?:kind|gentle) (?:to|with) yourself\.?\s*$/i,
  /\byou'?re doing (?:great|amazing|so well)[^.!?]*[.!]?\s*$/i,
  /\bi'?m (?:here|rooting) for you[^.!?]*[.!]?\s*$/i,
  /\b(?:in short|to sum up|in summary|all in all|ultimately)\b[^.!?]*[.!]\s*$/i,
  /\bremember[,:][^.!?]{5,}[.!]\s*$/i,
  /\bwhatever you (?:decide|choose)[^.!?]*[.!]\s*$/i,
];

const ADVICE_TRIGGERS = [
  /\bshould i\b/i,
  /\bwhat (?:do you think|would you do|should i)\b/i,
  /\bany advice\b/i,
  /\bwhich (?:one|option)\b/i,
  /\bhow do i (?:decide|choose)\b/i,
];

const POSITION_MARKERS = [
  /\bi'?d\b/i,
  /\bi would\b/i,
  /\bmy (?:take|view|advice|read)\b/i,
  /\bgo with\b/i,
  /\bdo (?:it|this|that) now\b/i,
  /\bi'?d lean\b/i,
];

const JUDGEMENT = [
  /\b(?:he|she|they|your (?:boss|manager|partner|husband|friend))\s+(?:is|are)\s+(?:clearly|obviously|definitely)\b/i,
  /\btoxic\b/i,
  /\bnarcissis/i,
  /\bgaslight/i,
  /\bthat'?s abuse\b/i,
  /\bbad (?:boss|friend|partner|manager)\b/i,
];

const STOPWORDS = new Set(
  ("a an the and or but if then so of to in on at for with about from into over after before my me i i'm im is are was were be been being do does did doing have has had " +
    "it its this that these those he she they them her his their you your we us our not no yes just really very much more most some any all can could would should will " +
    "what when where who why how which am as by out up down off again there here than too own same s t don now feel feels felt think thing things get got go going know like " +
    "want need time day days week weeks year years lot")
    .split(/\s+/),
);

function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function words(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

function shapeOf(text: string): string {
  const paras = text.split(/\n{2,}/).length;
  const bullets = /^\s*[-*•]\s/m.test(text) ? 1 : 0;
  const s = sentences(text).length;
  const endsQ = text.trim().endsWith("?") ? 1 : 0;
  const bucket = s <= 2 ? "s" : s <= 5 ? "m" : "l";
  return `${paras}:${bullets}:${bucket}:${endsQ}`;
}

/** Concrete nouns the reply could reasonably echo back from her world. */
function contextNouns(ctx: SlopContext): string[] {
  const out: string[] = [];
  const p = ctx.profile;
  for (const v of [p?.name, p?.city, p?.role, p?.company, p?.industry]) {
    if (v && typeof v === "string") out.push(...words(v).filter((w) => w.length > 2));
  }
  // Nouns-ish tokens from her own message: capitalised words, numbers, and
  // longer non-stopword tokens.
  const raw = ctx.userMessage ?? "";
  for (const tok of raw.split(/[^A-Za-z0-9'’+-]+/)) {
    const t = tok.trim();
    if (!t) continue;
    const lower = t.toLowerCase();
    if (STOPWORDS.has(lower)) continue;
    if (/^\d[\d,.]*$/.test(t)) { out.push(t); continue; }
    if (t.length >= 5 || /^[A-Z]/.test(t)) out.push(t);
  }
  return Array.from(new Set(out.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, "")))).filter(
    (w) => w.length >= 3,
  );
}

export function scoreReply(reply: string, ctx: SlopContext): SlopResult {
  const text = (reply ?? "").trim();
  const lower = text.toLowerCase();
  const userWords = words(ctx.userMessage ?? "").length;
  const sents = sentences(text);
  const violations: Violation[] = [];
  const checks: Record<string, "pass" | "fail" | "na"> = {};

  const fail = (rule: string, label: string, weight: number, detail: string) => {
    checks[rule] = "fail";
    violations.push({ rule, label, weight, detail });
  };
  const pass = (rule: string) => { if (!checks[rule]) checks[rule] = "pass"; };

  // R1 — banned openers / restating her words back at her
  const firstSentence = (sents[0] ?? "").toLowerCase();
  const hitOpener = BANNED_OPENERS.find((o) => firstSentence.startsWith(o) || firstSentence.startsWith(`${o},`));
  if (hitOpener) fail("R1_opener", "Banned opener", 20, `Opens with "${hitOpener}"`);
  else pass("R1_opener");

  // R2 — length / register matching
  if (userWords > 0 && userWords < 15 && sents.length > 3) {
    fail("R2_register_length", "Register: too long for a short message", 18,
      `She wrote ${userWords} words; reply is ${sents.length} sentences (max 3).`);
  } else if (userWords >= 15 && userWords < 40 && sents.length > 5) {
    fail("R2_register_length", "Register: too long for a medium message", 12,
      `She wrote ${userWords} words; reply is ${sents.length} sentences (max 5).`);
  } else pass("R2_register_length");

  // R2b — formality mirroring: she writes lowercase/clipped, Zara shouldn't lecture
  const herLower = (ctx.userMessage ?? "").length > 0 &&
    (ctx.userMessage ?? "") === (ctx.userMessage ?? "").toLowerCase();
  if (herLower && userWords < 25 && words(text).length > userWords * 12) {
    fail("R2b_formality", "Register: formality mismatch", 8,
      `Casual ${userWords}-word message answered with ${words(text).length} words.`);
  } else pass("R2b_formality");

  // R2c — one question per message
  const questions = (text.match(/\?/g) ?? []).length;
  if (questions > 1) fail("R2c_one_question", "More than one question", 10, `${questions} question marks.`);
  else pass("R2c_one_question");

  // R3 — banned phrase bank
  const hitPhrases = BANNED_PHRASES.filter((p) => lower.includes(p));
  if (hitPhrases.length) {
    fail("R3_banned_phrase", "Banned phrase", 6 * Math.min(hitPhrases.length, 3), hitPhrases.join(", "));
  } else pass("R3_banned_phrase");

  // R3b — the antithesis tell
  const anti = ANTITHESIS.find((r) => r.test(text));
  if (anti) fail("R3b_antithesis", '"Not just X, it\'s Y" construction', 15, anti.source.slice(0, 60));
  else pass("R3b_antithesis");

  // R4 — asymmetry vs previous reply
  if (ctx.prevAssistant && ctx.prevAssistant.trim()) {
    if (shapeOf(text) === shapeOf(ctx.prevAssistant)) {
      fail("R4_asymmetry", "Same shape as previous reply", 8, `Shape ${shapeOf(text)} repeated.`);
    } else pass("R4_asymmetry");
  } else checks["R4_asymmetry"] = "na";

  // R5 — no bow at the end
  const bow = CLOSING_BOW.find((r) => r.test(text));
  if (bow) fail("R5_closing_bow", "Closing summary or affirmation", 12, bow.source.slice(0, 60));
  else pass("R5_closing_bow");

  // R6 — take a position when asked for advice
  if (ADVICE_TRIGGERS.some((r) => r.test(ctx.userMessage ?? ""))) {
    if (POSITION_MARKERS.some((r) => r.test(text))) pass("R6_position");
    else fail("R6_position", "No clear recommendation when asked", 14, "Advice question answered without a stated position.");
  } else checks["R6_position"] = "na";

  // R7 — specificity quota: one concrete noun from her world
  const nouns = contextNouns(ctx);
  if (nouns.length) {
    const replyTokens = new Set(
      lower.split(/[^a-z0-9]+/).filter(Boolean),
    );
    const matched = nouns.filter((n) => replyTokens.has(n) || lower.includes(n));
    if (matched.length) pass("R7_specificity");
    else fail("R7_specificity", "No concrete noun from her context", 16,
      `None of: ${nouns.slice(0, 8).join(", ")}`);
  } else checks["R7_specificity"] = "na";

  // R8 — no judgement / verdicts on people in her life
  const judge = JUDGEMENT.find((r) => r.test(text));
  if (judge) fail("R8_judgement", "Verdict or label about a person", 14, judge.source.slice(0, 60));
  else pass("R8_judgement");

  // R10 — bullets on a short exchange
  if (/^\s*[-*•]\s/m.test(text) && userWords < 25) {
    fail("R10_bullets", "Bulleted reply to a short message", 10, `She wrote ${userWords} words.`);
  } else pass("R10_bullets");

  const score = Math.max(0, 100 - violations.reduce((a, v) => a + v.weight, 0));

  return {
    score,
    violations,
    checks,
    meta: { userWords, replyWords: words(text).length, replySentences: sents.length, questions },
  };
}

export const SLOP_RULE_LABELS: Record<string, string> = {
  R1_opener: "Banned opener",
  R2_register_length: "Length matches her message",
  R2b_formality: "Formality mirrors hers",
  R2c_one_question: "One question per message",
  R3_banned_phrase: "Banned phrase bank",
  R3b_antithesis: "No 'not just X, it's Y'",
  R4_asymmetry: "Different shape from last reply",
  R5_closing_bow: "No closing bow",
  R6_position: "Takes a position",
  R7_specificity: "Concrete noun from her context",
  R8_judgement: "No verdicts on people",
  R10_bullets: "No bullets on short messages",
};
