import type { MemberProfile } from "@/lib/memberProfile";

/* ---------- Profile completeness (shared by profile editor + directory) ---------- */

export interface CompletenessInput {
  name?: string | null;
  role?: string | null;
  company?: string | null;
  city?: string | null;
  linkedin_url?: string | null;
  linkedinValid?: boolean;
  why_here?: string | null;
  photo_url?: string | null;
  bio?: string | null;
  industry?: string | null;
  expertise_tags?: string[];
  interests?: string[];
  looking_for?: string[];
  ask_me_about?: string[];
}

const has = (v?: string | null) => !!v && v.trim().length > 0;

export const profileCompleteness = (p: CompletenessInput): number => {
  const items: [boolean, number][] = [
    [has(p.name), 10],
    [has(p.role), 10],
    [has(p.company), 10],
    [has(p.city), 8],
    [has(p.linkedin_url) && p.linkedinValid !== false, 12],
    [has(p.why_here), 13],
    [has(p.photo_url), 12],
    [!!p.bio && p.bio.trim().length >= 40, 8],
    [has(p.industry), 5],
    [(p.expertise_tags?.length ?? 0) >= 2, 4],
    [(p.interests?.length ?? 0) >= 2, 3],
    [(p.looking_for?.length ?? 0) >= 1, 3],
    [(p.ask_me_about?.length ?? 0) >= 1, 2],
  ];
  const total = items.reduce((a, [, w]) => a + w, 0);
  const got = items.reduce((a, [ok, w]) => a + (ok ? w : 0), 0);
  return Math.round((got / total) * 100);
};

export const nextProfileNudge = (p: CompletenessInput): string => {
  if (!has(p.photo_url)) return "Add a photo — profiles with a face get far more hellos.";
  if (!has(p.why_here)) return "Share why you're here — sisters love to know your story.";
  if (!p.bio || p.bio.trim().length < 40) return "Add a short bio (a line or two) to introduce yourself.";
  if (!has(p.industry)) return "Pick your industry so we can suggest the right women to meet.";
  if ((p.looking_for?.length ?? 0) === 0) return "Tell us what you're open to — mentoring, friendship, hiring…";
  if ((p.ask_me_about?.length ?? 0) === 0) return "Add an “Ask me about” topic so women know how to start a chat.";
  if ((p.expertise_tags?.length ?? 0) < 2) return "Add a couple of expertise tags — this helps others find you.";
  if ((p.interests?.length ?? 0) < 2) return "Add a couple of interests — easy conversation starters.";
  return "You're all set ✨";
};

/* ---------- Badges ---------- */

export interface BadgeFacts {
  events_attended: number;
  spotlighted: boolean;
  founding: boolean;
}

export const ROUNDTABLE_REGULAR_MIN = 3;

export type BadgeKey = "founding" | "regular" | "mentor" | "spotlight";
export const BADGE_LABELS: Record<BadgeKey, string> = {
  founding: "Founding member",
  regular: "Roundtable regular",
  mentor: "Mentor",
  spotlight: "Spotlight featured",
};

export const badgesFor = (
  member: Pick<MemberProfile, "looking_for">,
  facts?: BadgeFacts | null,
): BadgeKey[] => {
  const out: BadgeKey[] = [];
  if (facts?.founding) out.push("founding");
  if (facts?.spotlighted) out.push("spotlight");
  if ((facts?.events_attended ?? 0) >= ROUNDTABLE_REGULAR_MIN) out.push("regular");
  if (member.looking_for?.includes("Mentoring")) out.push("mentor");
  return out;
};

/* ---------- "Women you should meet" ---------- */

const COMPLEMENTS: Record<string, string[]> = {
  Mentoring: ["Being mentored"],
  "Being mentored": ["Mentoring"],
  Hiring: ["Looking for work"],
  "Looking for work": ["Hiring"],
  Investors: ["Investors"],
  "Co-founders": ["Co-founders"],
  Collaborators: ["Collaborators"],
  Friendship: ["Friendship"],
  "Speaking opportunities": ["Speaking opportunities"],
};

type Matchable = Pick<
  MemberProfile,
  "user_id" | "city" | "industry" | "looking_for" | "interests" | "expertise_tags"
>;

const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();
const lowerSet = (xs?: string[]) => new Set((xs ?? []).map(norm).filter(Boolean));

export interface MatchResult {
  score: number;
  reasons: string[];
}

export const matchScore = (me: Matchable, other: Matchable): MatchResult => {
  let score = 0;
  const reasons: string[] = [];

  for (const want of me.looking_for ?? []) {
    const fits = (COMPLEMENTS[want] ?? []).find((c) => other.looking_for?.includes(c));
    if (fits) {
      score += 3;
      reasons.push(want === fits ? `Both open to ${want.toLowerCase()}` : `${fits} ↔ ${want.toLowerCase()}`);
      break;
    }
  }
  if (norm(me.city) && norm(me.city) === norm(other.city)) {
    score += 2;
    reasons.push(`Both in ${other.city}`);
  }
  if (norm(me.industry) && norm(me.industry) === norm(other.industry)) {
    score += 2;
    reasons.push(`Both in ${other.industry}`);
  }
  const mine = lowerSet([...(me.interests ?? []), ...(me.expertise_tags ?? [])]);
  const shared = [...(other.interests ?? []), ...(other.expertise_tags ?? [])].filter((t) => mine.has(norm(t)));
  const uniqueShared = Array.from(new Set(shared.map(norm)));
  if (uniqueShared.length) {
    score += Math.min(uniqueShared.length, 3);
    reasons.push(`Shared: ${shared.slice(0, 2).join(", ")}`);
  }
  return { score, reasons };
};

/** Week number so suggestions rotate weekly but stay stable within a week. */
export const weekSeed = (d: Date = new Date()) => Math.floor(d.getTime() / (7 * 24 * 3600 * 1000));

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

export const suggestMembers = <T extends Matchable>(me: Matchable, pool: T[], count = 3, seed = weekSeed()) =>
  pool
    .filter((m) => m.user_id !== me.user_id)
    .map((m) => ({ member: m, ...matchScore(me, m), tie: hash(`${seed}:${me.user_id}:${m.user_id}`) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.tie - b.tie)
    .slice(0, count);

export const NEW_MEMBER_DAYS = 7;
export const isNewMember = (approvedAt: string | null, now: Date = new Date()) =>
  !!approvedAt && now.getTime() - new Date(approvedAt).getTime() <= NEW_MEMBER_DAYS * 86400000;
