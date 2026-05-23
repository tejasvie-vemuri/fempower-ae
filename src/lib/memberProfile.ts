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

const optionalUrl = (host?: RegExp) =>
  z.string().trim().max(300).optional().or(z.literal(""))
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || /^https?:\/\//i.test(v), { message: "Must start with http(s)://" })
    .refine((v) => !v || !host || host.test(v), { message: "Must be a valid URL for this network" });

export const memberProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  photo_url: z.string().url().max(500).optional().or(z.literal("")).transform(v => v || null),
  role: z.string().trim().max(120).optional().or(z.literal("")).transform(v => v || null),
  company: z.string().trim().max(120).optional().or(z.literal("")).transform(v => v || null),
  city: z.string().trim().max(80).optional().or(z.literal("")).transform(v => v || null),
  bio: z.string().trim().max(600).optional().or(z.literal("")).transform(v => v || null),
  linkedin_url: optionalUrl(/linkedin\.com/i),
  instagram_url: optionalUrl(/instagram\.com/i),
  website_url: optionalUrl(),
  industry: z.string().max(60).optional().or(z.literal("")).transform(v => v || null),
  expertise_tags: z.array(z.string().trim().min(1).max(40)).max(15).default([]),
  interests: z.array(z.string().trim().min(1).max(40)).max(15).default([]),
  looking_for: z.array(z.string().trim().min(1).max(60)).max(10).default([]),
  why_here: z.string().trim().max(400).optional().or(z.literal("")).transform(v => v || null),
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
