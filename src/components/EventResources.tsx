import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileText, Link2, Lock, Loader2, ExternalLink } from "lucide-react";
import {
  KIND_LABELS,
  KIND_ORDER,
  PublicEventResource,
  ResourceKind,
  formatFileSize,
  resolveResourceUrl,
} from "@/lib/eventResources";

interface EventResourcesProps {
  eventId: string;
  isRegistered: boolean;
}

const SECTION_TITLES: Partial<Record<ResourceKind, string>> = {
  recap: "After the session",
};

export const EventResources = ({ eventId, isRegistered }: EventResourcesProps) => {
  const [resources, setResources] = useState<PublicEventResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase as any).rpc("list_event_resources", {
        _event_id: eventId,
      });
      if (cancelled) return;
      if (error) console.warn("Could not load event resources", error);
      setResources((data as PublicEventResource[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // Re-fetch on registration change so newly unlocked rows appear.
  }, [eventId, isRegistered]);

  const grouped = useMemo(() => {
    const map = new Map<ResourceKind, PublicEventResource[]>();
    for (const r of resources) {
      const list = map.get(r.kind) ?? [];
      list.push(r);
      map.set(r.kind, list);
    }
    return KIND_ORDER.filter((k) => map.has(k)).map((k) => ({
      kind: k,
      items: map.get(k)!,
    }));
  }, [resources]);

  const handleOpen = async (resource: PublicEventResource) => {
    setOpeningId(resource.id);
    const url = await resolveResourceUrl(resource);
    setOpeningId(null);
    if (!url) {
      toast.error("That file could not be opened. Try again in a moment.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="py-6 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (resources.length === 0) return null;

  const anyLocked = resources.some((r) => r.locked);

  return (
    <section className="space-y-5" aria-labelledby="event-resources-heading">
      <h2
        id="event-resources-heading"
        className="font-heading text-xl text-primary"
      >
        Before you come
      </h2>

      {grouped.map(({ kind, items }) => (
        <div key={kind} className="space-y-2">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground">
            {SECTION_TITLES[kind] ?? KIND_LABELS[kind]}
          </h3>
          {items.map((r) =>
            r.locked ? (
              <div
                key={r.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3"
              >
                <Lock className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{r.title}</p>
                  <p className="text-xs text-muted-foreground/80 mt-0.5">
                    {r.visibility === "attended"
                      ? "Shared with the women who were in the room"
                      : "Register to open this"}
                  </p>
                </div>
              </div>
            ) : (
              <button
                key={r.id}
                type="button"
                onClick={() => handleOpen(r)}
                disabled={openingId === r.id}
                className="w-full text-left flex items-start gap-3 rounded-lg border border-border bg-card p-3 hover:border-primary/50 transition-colors disabled:opacity-60"
              >
                {r.external_url ? (
                  <Link2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">
                    {r.title}
                  </span>
                  {r.description && (
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      {r.description}
                    </span>
                  )}
                  {r.file_size_bytes ? (
                    <span className="block text-xs text-muted-foreground/80 mt-0.5">
                      {formatFileSize(r.file_size_bytes)}
                    </span>
                  ) : null}
                </span>
                {openingId === r.id ? (
                  <Loader2 className="h-4 w-4 mt-0.5 animate-spin text-muted-foreground flex-shrink-0" />
                ) : (
                  <ExternalLink className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                )}
              </button>
            ),
          )}
        </div>
      ))}

      {anyLocked && !isRegistered && (
        <p className="text-xs text-muted-foreground">
          Materials open up as soon as your place is confirmed.
        </p>
      )}
    </section>
  );
};

export default EventResources;
