import { z } from "zod";

export const INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Education", "Marketing", "Media",
  "Design", "Retail", "Real Estate", "Consulting", "Legal", "Hospitality",
  "Nonprofit", "Government", "Entrepreneurship", "Arts & Culture", "Other",
] as const;

export const LOOKING_FOR_OPTIONS = [
  "Mentoring", "Being mentored", "Collaborators", "Hiring", "Looking for work",
  "Friendship", "Speaking opportunities", "Investors", "Co-founders",
] as const;

const parseHttpUrl = (value: string) => {
  if (!/^https?:\/\//i.test(value)) return null;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
};

const hasDomain = (url: URL, domain: string) => {
  const host = url.hostname.toLowerCase();
  return host === domain || host.endsWith(`.${domain}`);
};

const pathSegments = (url: URL) =>
  url.pathname.split("/").filter(Boolean);

const isLinkedInProfileUrl = (value: string) => {
  const url = parseHttpUrl(value);
  if (!url || !hasDomain(url, "linkedin.com")) return false;

  const segments = pathSegments(url);
  return (
    segments.length === 2 &&
    segments[0].toLowerCase() === "in" &&
    /^[a-zA-Z0-9_-]{3,100}$/.test(segments[1])
  );
};

const INSTAGRAM_RESERVED_PATHS = new Set([
  "accounts",
  "direct",
  "explore",
  "p",
  "reel",
  "reels",
  "stories",
  "tv",
]);

const isInstagramProfileUrl = (value: string) => {
  const url = parseHttpUrl(value);
  if (!url || !hasDomain(url, "instagram.com")) return false;

  const segments = pathSegments(url);
  if (segments.length !== 1) return false;

  const username = segments[0];
  return (
    !INSTAGRAM_RESERVED_PATHS.has(username.toLowerCase()) &&
    /^[a-zA-Z0-9._]{1,30}$/.test(username) &&
    !username.endsWith(".")
  );
};

const optionalUrl = (validator?: (value: string) => boolean, message = "Must be a valid URL for this network") =>
  z.string().trim().max(300).optional().or(z.literal(""))
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || !!parseHttpUrl(v), { message: "Must start with http(s)://" })
    .refine((v) => !v || !validator || validator(v), { message });

const requiredUrl = (requiredMessage: string, validator?: (value: string) => boolean, message = "Must be a valid URL for this network") =>
  z.string().trim().min(1, requiredMessage).max(300)
    .refine((v) => !!parseHttpUrl(v), { message: "Must start with http(s)://" })
    .refine((v) => !validator || validator(v), { message });

export const memberProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  photo_url: z.string().max(500).optional().or(z.literal("")).transform(v => v || null),
  role: z.string().trim().min(1, "Role / Title is required").max(120),
  company: z.string().trim().min(1, "Company is required").max(120),
  city: z.string().trim().min(1, "City is required").max(80),
  bio: z.string().trim().max(600).optional().or(z.literal("")).transform(v => v || null),
  linkedin_url: requiredUrl(
    "LinkedIn URL is required",
    isLinkedInProfileUrl,
    "Must be a valid LinkedIn profile URL, like https://linkedin.com/in/your-name",
  ),
  instagram_url: optionalUrl(
    isInstagramProfileUrl,
    "Must be a valid Instagram profile URL, like https://instagram.com/username",
  ),
  website_url: optionalUrl(),
  industry: z.string().max(60).optional().or(z.literal("")).transform(v => v || null),
  expertise_tags: z.array(z.string().trim().min(1).max(40)).max(15).default([]),
  interests: z.array(z.string().trim().min(1).max(40)).max(15).default([]),
  looking_for: z.array(z.string().trim().min(1).max(60)).max(10).default([]),
  why_here: z.string().trim().min(1, "Please share why you're part of Fempower").max(400),
});

export type MemberProfileInput = z.input<typeof memberProfileSchema>;
export type MemberProfile = {
  id: string;
  user_id: string;
  name: string;
  photo_url: string | null;
  role: string | null;
  company: string | null;
  city: string | null;
  bio: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  website_url: string | null;
  industry: string | null;
  expertise_tags: string[];
  interests: string[];
  looking_for: string[];
  why_here: string | null;
  status: "pending" | "approved" | "rejected" | "hidden";
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export const STATUS_LABELS: Record<MemberProfile["status"], string> = {
  pending: "Pending review",
  approved: "Live in directory",
  rejected: "Not approved",
  hidden: "Hidden",
};
