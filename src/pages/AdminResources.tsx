import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Trash2,
  Upload,
  Link2,
  FileText,
  ExternalLink,
  Search,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  EventResource,
  KIND_LABELS,
  MAX_RESOURCE_MB,
  RESOURCE_BUCKET,
  ResourceKind,
  ResourceVisibility,
  VISIBILITY_LABELS,
  formatFileSize,
  normalizeExternalUrl,
  resolveResourceUrl,
} from "@/lib/eventResources";

interface EventRow {
  id: string;
  slug: string;
  title: string;
  starts_at: string;
  status: string;
}

type Draft = {
  mode: "file" | "link";
  kind: ResourceKind;
  title: string;
  description: string;
  url: string;
  file: File | null;
  visibility: ResourceVisibility;
};

const emptyDraft: Draft = {
  mode: "file",
  kind: "pre_read",
  title: "",
  description: "",
  url: "",
  file: null,
  visibility: "registered",
};

const fmtEventDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const AdminResources = () => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [resources, setResources] = useState<EventResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [openEventId, setOpenEventId] = useState<string>("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [savingEventId, setSavingEventId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: ev, error: evErr }, { data: res, error: resErr }] = await Promise.all([
      supabase
        .from("events")
        .select("id, slug, title, starts_at, status")
        .order("starts_at", { ascending: false }),
      (supabase as any)
        .from("event_resources")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);
    if (evErr) toast.error(evErr.message);
    if (resErr) toast.error(resErr.message);
    setEvents((ev as EventRow[]) ?? []);
    setResources((res as EventResource[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const byEvent = useMemo(() => {
    const map = new Map<string, EventResource[]>();
    for (const r of resources) {
      const list = map.get(r.event_id) ?? [];
      list.push(r);
      map.set(r.event_id, list);
    }
    return map;
  }, [resources]);

  const visibleEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => e.title.toLowerCase().includes(q));
  }, [events, query]);

  const draftFor = (eventId: string): Draft => drafts[eventId] ?? emptyDraft;

  const setDraft = (eventId: string, patch: Partial<Draft>) =>
    setDrafts((prev) => ({
      ...prev,
      [eventId]: { ...(prev[eventId] ?? emptyDraft), ...patch },
    }));

  const handleAdd = async (event: EventRow) => {
    const draft = draftFor(event.id);
    const title = draft.title.trim();
    if (!title) {
      toast.error("Give the resource a title");
      return;
    }

    let externalUrl: string | null = null;
    if (draft.mode === "link") {
      externalUrl = normalizeExternalUrl(draft.url);
      if (!externalUrl) {
        toast.error("That does not look like a valid http or https link");
        return;
      }
    } else if (!draft.file) {
      toast.error("Choose a file to upload");
      return;
    } else if (draft.file.size > MAX_RESOURCE_MB * 1024 * 1024) {
      toast.error(`"${draft.file.name}" is over the ${MAX_RESOURCE_MB}MB limit`);
      return;
    }

    setSavingEventId(event.id);
    let storagePath: string | null = null;

    try {
      if (draft.mode === "file" && draft.file) {
        const ext = draft.file.name.split(".").pop() || "bin";
        storagePath = `${event.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(RESOURCE_BUCKET)
          .upload(storagePath, draft.file, {
            contentType: draft.file.type || "application/octet-stream",
            upsert: false,
          });
        if (upErr) throw upErr;
      }

      const { data: userRes } = await supabase.auth.getUser();
      const existing = byEvent.get(event.id) ?? [];
      const { error: insErr } = await (supabase as any).from("event_resources").insert({
        event_id: event.id,
        kind: draft.kind,
        title,
        description: draft.description.trim() || null,
        external_url: externalUrl,
        storage_path: storagePath,
        file_name: draft.mode === "file" ? draft.file?.name ?? null : null,
        file_size_bytes: draft.mode === "file" ? draft.file?.size ?? null : null,
        mime_type: draft.mode === "file" ? draft.file?.type || null : null,
        visibility: draft.visibility,
        sort_order: existing.length,
        created_by: userRes.user?.id ?? null,
      });
      if (insErr) throw insErr;

      toast.success(`Added to ${event.title}`);
      setDrafts((prev) => ({ ...prev, [event.id]: { ...emptyDraft, kind: draft.kind } }));
      await load();
    } catch (err: any) {
      // Don't leave an orphaned file behind if the row insert failed.
      if (storagePath) {
        await supabase.storage.from(RESOURCE_BUCKET).remove([storagePath]);
      }
      toast.error(`Could not add resource: ${err.message ?? err}`);
    } finally {
      setSavingEventId(null);
    }
  };

  const handleDelete = async (resource: EventResource) => {
    if (!confirm(`Delete "${resource.title}"?`)) return;
    if (resource.storage_path) {
      const { error: sErr } = await supabase.storage
        .from(RESOURCE_BUCKET)
        .remove([resource.storage_path]);
      if (sErr) toast.error(sErr.message);
    }
    const { error } = await (supabase as any)
      .from("event_resources")
      .delete()
      .eq("id", resource.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Resource deleted");
    load();
  };

  const handleVisibility = async (resource: EventResource, visibility: ResourceVisibility) => {
    const { error } = await (supabase as any)
      .from("event_resources")
      .update({ visibility })
      .eq("id", resource.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setResources((prev) =>
      prev.map((r) => (r.id === resource.id ? { ...r, visibility } : r)),
    );
  };

  const handlePublished = async (resource: EventResource, isPublished: boolean) => {
    const { error } = await (supabase as any)
      .from("event_resources")
      .update({ is_published: isPublished })
      .eq("id", resource.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setResources((prev) =>
      prev.map((r) => (r.id === resource.id ? { ...r, is_published: isPublished } : r)),
    );
  };

  const handleOpen = async (resource: EventResource) => {
    const url = await resolveResourceUrl(resource);
    if (!url) {
      toast.error("Could not open that resource");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link
          to="/admin/events"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to events
        </Link>
        <h1 className="font-heading text-3xl text-primary mb-1">Event Resources</h1>
        <p className="text-muted-foreground mb-8">
          Pre-reads, instructions and session notes, posted under the event they belong to.
          Add them any time, before or after the roundtable.
        </p>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Find an event by name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : visibleEvents.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-card rounded-xl border border-border">
            {query ? "No events match that search." : "No events yet."}
          </div>
        ) : (
          <Accordion
            type="single"
            collapsible
            value={openEventId}
            onValueChange={setOpenEventId}
            className="space-y-3"
          >
            {visibleEvents.map((event) => {
              const list = byEvent.get(event.id) ?? [];
              const draft = draftFor(event.id);
              const saving = savingEventId === event.id;

              return (
                <AccordionItem
                  key={event.id}
                  value={event.id}
                  className="border border-border rounded-xl bg-card px-4"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center justify-between gap-4 w-full pr-2">
                      <div className="text-left">
                        <div className="font-medium text-foreground">{event.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {fmtEventDate(event.starts_at)} · {event.status}
                        </div>
                      </div>
                      <Badge variant={list.length ? "default" : "secondary"}>
                        {list.length} resource{list.length === 1 ? "" : "s"}
                      </Badge>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pb-5 space-y-5">
                    {list.length > 0 && (
                      <div className="space-y-2">
                        {list.map((r) => (
                          <div
                            key={r.id}
                            className="rounded-lg border border-border bg-background p-3 space-y-3"
                          >
                            <div className="flex items-start gap-3">
                              {r.external_url ? (
                                <Link2 className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                              ) : (
                                <FileText className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">{r.title}</span>
                                  <Badge variant="outline" className="text-[10px]">
                                    {KIND_LABELS[r.kind]}
                                  </Badge>
                                  {!r.is_published && (
                                    <Badge variant="secondary" className="text-[10px]">
                                      Hidden
                                    </Badge>
                                  )}
                                </div>
                                {r.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {r.description}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                  {r.external_url ??
                                    `${r.file_name ?? "File"}${
                                      r.file_size_bytes
                                        ? ` · ${formatFileSize(r.file_size_bytes)}`
                                        : ""
                                    }`}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpen(r)}
                                  title="Open"
                                  aria-label={`Open ${r.title}`}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(r)}
                                  title="Delete"
                                  aria-label={`Delete ${r.title}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 flex-wrap pl-7">
                              <Select
                                value={r.visibility}
                                onValueChange={(v) =>
                                  handleVisibility(r, v as ResourceVisibility)
                                }
                              >
                                <SelectTrigger className="h-8 w-auto min-w-[220px] text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {(
                                    Object.keys(VISIBILITY_LABELS) as ResourceVisibility[]
                                  ).map((v) => (
                                    <SelectItem key={v} value={v} className="text-xs">
                                      {VISIBILITY_LABELS[v]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                                {r.is_published ? (
                                  <Eye className="h-3.5 w-3.5" />
                                ) : (
                                  <EyeOff className="h-3.5 w-3.5" />
                                )}
                                <span>Live on the event page</span>
                                <Switch
                                  checked={r.is_published}
                                  onCheckedChange={(checked) => handlePublished(r, checked)}
                                />
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="rounded-lg border border-dashed border-border p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={draft.mode === "file" ? "default" : "outline"}
                          onClick={() => setDraft(event.id, { mode: "file" })}
                        >
                          <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload a file
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={draft.mode === "link" ? "default" : "outline"}
                          onClick={() => setDraft(event.id, { mode: "link" })}
                        >
                          <Link2 className="h-3.5 w-3.5 mr-1.5" /> Paste a link
                        </Button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label className="text-xs">Title *</Label>
                          <Input
                            value={draft.title}
                            placeholder="What to read before we meet"
                            onChange={(e) => setDraft(event.id, { title: e.target.value })}
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Type</Label>
                          <Select
                            value={draft.kind}
                            onValueChange={(v) =>
                              setDraft(event.id, { kind: v as ResourceKind })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(KIND_LABELS) as ResourceKind[]).map((k) => (
                                <SelectItem key={k} value={k}>
                                  {KIND_LABELS[k]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Note (optional)</Label>
                        <Textarea
                          rows={2}
                          value={draft.description}
                          placeholder="One line on why she should read this, or how long it takes"
                          onChange={(e) =>
                            setDraft(event.id, { description: e.target.value })
                          }
                          disabled={saving}
                        />
                      </div>

                      {draft.mode === "link" ? (
                        <div>
                          <Label className="text-xs">Link *</Label>
                          <Input
                            value={draft.url}
                            placeholder="https://docs.google.com/..."
                            onChange={(e) => setDraft(event.id, { url: e.target.value })}
                            disabled={saving}
                          />
                        </div>
                      ) : (
                        <div>
                          <Label className="text-xs">File *</Label>
                          <Input
                            type="file"
                            className="cursor-pointer"
                            onChange={(e) =>
                              setDraft(event.id, { file: e.target.files?.[0] ?? null })
                            }
                            disabled={saving}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            PDF, Word, slides or images · max {MAX_RESOURCE_MB}MB
                          </p>
                        </div>
                      )}

                      <div className="flex items-end justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-[220px]">
                          <Label className="text-xs">Who can see it</Label>
                          <Select
                            value={draft.visibility}
                            onValueChange={(v) =>
                              setDraft(event.id, { visibility: v as ResourceVisibility })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(
                                Object.keys(VISIBILITY_LABELS) as ResourceVisibility[]
                              ).map((v) => (
                                <SelectItem key={v} value={v}>
                                  {VISIBILITY_LABELS[v]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={() => handleAdd(event)} disabled={saving}>
                          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Add resource
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Shows up at{" "}
                      <Link
                        to={`/events/${event.slug}`}
                        className="text-primary hover:underline"
                      >
                        /events/{event.slug}
                      </Link>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </div>
  );
};

export default AdminResources;
