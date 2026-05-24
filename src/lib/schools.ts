import { supabase } from "@/integrations/supabase/client";

export type School = {
  id: string;
  name: string;
  slug: string;
  type: "school" | "nursery";
  emirate: string | null;
  area: string | null;
  curriculum: string[];
  age_min: number | null;
  age_max: number | null;
  website_url: string | null;
  logo_url: string | null;
  fees_min: number | null;
  fees_max: number | null;
  fees_year: string | null;
  waitlist_status: string | null;
  description: string | null;
  status: string;
  last_scraped_at: string | null;
};

export type SchoolReview = {
  id: string;
  school_id: string;
  user_id: string;
  rating: number;
  body: string;
  curriculum: string | null;
  child_age_group: string | null;
  waitlist_experience: string | null;
  fees_paid_cents: number | null;
  fees_year: string | null;
  status: string;
  created_at: string;
};

export const EMIRATES = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"];
export const CURRICULA = ["British", "American", "IB", "Indian/CBSE", "Montessori", "French", "German", "Other"];

export async function fetchPublishedSchools(): Promise<School[]> {
  const { data, error } = await supabase
    .from("schools")
    .select("*")
    .eq("status", "published")
    .order("name");
  if (error) throw error;
  return (data ?? []) as School[];
}

export async function fetchSchoolReviews(schoolId: string): Promise<SchoolReview[]> {
  const { data, error } = await supabase
    .from("school_reviews")
    .select("*")
    .eq("school_id", schoolId)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SchoolReview[];
}

export function formatFees(s: School) {
  if (!s.fees_min && !s.fees_max) return null;
  const fmt = (n: number) => `AED ${n.toLocaleString()}`;
  if (s.fees_min && s.fees_max) return `${fmt(s.fees_min)} – ${fmt(s.fees_max)}${s.fees_year ? ` (${s.fees_year})` : ""}`;
  return fmt((s.fees_min ?? s.fees_max) as number);
}
