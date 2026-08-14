import { supabase } from "@/integrations/supabase/client";

export const RESOURCE_BUCKET = "event-resources";
export const MAX_RESOURCE_MB = 25;
export const SIGNED_URL_TTL_SECONDS = 60 * 10;

export type ResourceKind =
  | "pre_read"
  | "instructions"
  | "worksheet"
  | "recap"
  | "link";

export type ResourceVisibility = "public" | "registered" | "attended";

export interface EventResource {
  id: string;
  event_id: string;
  kind: ResourceKind;
  title: string;
  description: string | null;
  external_url: string | null;
  storage_path: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  visibility: ResourceVisibility;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

/** Row shape returned by the list_event_resources RPC (locked rows have no target). */
export interface PublicEventResource {
  id: string;
  kind: ResourceKind;
  title: string;
  description: string | null;
  external_url: string | null;
  storage_path: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  visibility: ResourceVisibility;
  sort_order: number;
  locked: boolean;
}

export const KIND_LABELS: Record<ResourceKind, string> = {
  pre_read: "Pre-read",
  instructions: "Instructions",
  worksheet: "Worksheet",
  recap: "After the session",
  link: "Link",
};

/** Order the groups appear in on the event page. */
export const KIND_ORDER: ResourceKind[] = [
  "instructions",
  "pre_read",
  "worksheet",
  "link",
  "recap",
];

export const VISIBILITY_LABELS: Record<ResourceVisibility, string> = {
  public: "Anyone can see it",
  registered: "Registered attendees only",
  attended: "Only women who turned up",
};

export const formatFileSize = (bytes: number | null): string => {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Resolve a resource to an openable URL. Uploaded files live in a private
 * bucket, so they need a short-lived signed URL rather than a public path.
 */
export const resolveResourceUrl = async (
  resource: Pick<PublicEventResource, "external_url" | "storage_path">,
): Promise<string | null> => {
  if (resource.external_url) return resource.external_url;
  if (!resource.storage_path) return null;
  const { data, error } = await supabase.storage
    .from(RESOURCE_BUCKET)
    .createSignedUrl(resource.storage_path, SIGNED_URL_TTL_SECONDS);
  if (error) {
    console.warn("Could not sign event resource URL", error);
    return null;
  }
  return data?.signedUrl ?? null;
};

/** Accept only http(s) links, so a pasted value can't become a javascript: URL. */
export const normalizeExternalUrl = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withScheme);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
};
