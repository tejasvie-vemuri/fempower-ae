import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Trash2, Upload, GripVertical, Sparkles, AlertTriangle } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface EventRow {
  id: string;
  title: string;
  starts_at: string;
}

interface PhotoRow {
  id: string;
  event_id: string;
  storage_path: string;
  caption: string | null;
  alt_text: string | null;
  file_hash: string | null;
  sort_order: number;
  created_at: string;
}

const BUCKET = "event-photos";
const MIN_PHOTOS = 3;
const MAX_PHOTOS = 4;
const MAX_FILE_MB = 8;

const publicUrl = (path: string) =>
  supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface PhotoCardProps {
  photo: PhotoRow;
  onDelete: (p: PhotoRow) => void;
  onCaption: (p: PhotoRow, caption: string) => void;
  onAlt: (p: PhotoRow, alt: string) => void;
  onRegenerateAlt: (p: PhotoRow) => void;
  regenerating: boolean;
}

const PhotoCard = ({ photo, onDelete, onCaption, onAlt, onRegenerateAlt, regenerating }: PhotoCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: photo.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl overflow-hidden bg-card border border-border shadow-sm"
    >
      <div className="relative aspect-[4/3] bg-muted">
        <img
          src={publicUrl(photo.storage_path)}
          alt={photo.alt_text ?? photo.caption ?? "Event photo"}
          className="w-full h-full object-cover"
          loading="lazy"
          draggable={false}
        />
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 bg-black/60 hover:bg-black text-white rounded-md p-1.5 cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to reorder"
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>
      <div className="p-3 space-y-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Caption</label>
          <Input
            defaultValue={photo.caption ?? ""}
            placeholder="Optional caption shown under the photo"
            onBlur={(e) => onCaption(photo, e.target.value.trim())}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-muted-foreground">Alt text (accessibility)</label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onRegenerateAlt(photo)}
              disabled={regenerating}
              title="Regenerate with AI"
            >
              {regenerating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3 mr-1" />
              )}
              AI
            </Button>
          </div>
          <Textarea
            key={photo.alt_text ?? "empty"}
            defaultValue={photo.alt_text ?? ""}
            placeholder="Describe the photo for screen readers"
            rows={2}
            maxLength={200}
            onBlur={(e) => onAlt(photo, e.target.value.trim())}
          />
        </div>
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(photo)}
            title="Delete"
            aria-label="Delete photo"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const AdminEventPhotos = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = async () => {
    if (!eventId) return;
    setLoading(true);
    const [{ data: ev }, { data: ph, error }] = await Promise.all([
      supabase.from("events").select("id, title, starts_at").eq("id", eventId).maybeSingle(),
      (supabase as any)
        .from("event_photos")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);
    if (error) toast.error(error.message);
    setEvent((ev as EventRow) ?? null);
    setPhotos((ph as PhotoRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [eventId]);

  const generateAltFor = async (photoId: string, storagePath: string, eventTitle?: string) => {
    try {
      const url = publicUrl(storagePath);
      const { error } = await supabase.functions.invoke("generate-photo-alt", {
        body: { photoId, imageUrl: url, eventTitle },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Alt-text generation failed:", err);
      toast.error(`Alt-text generation failed: ${err.message ?? err}`);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || !eventId) return;
    const list = Array.from(files);
    if (list.length === 0) return;

    // Enforce max cap
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_PHOTOS} photos per event. Delete one before adding another.`);
      return;
    }
    if (list.length > remaining) {
      toast.error(
        `Only ${remaining} more photo${remaining === 1 ? "" : "s"} allowed (max ${MAX_PHOTOS} per event). Selecting first ${remaining}.`,
      );
    }
    const toUpload = list.slice(0, remaining);

    // Per-file validation + hashing
    const existingHashes = new Set(photos.map((p) => p.file_hash).filter(Boolean) as string[]);
    const seenInBatch = new Set<string>();
    const prepared: { file: File; hash: string }[] = [];

    for (const file of toUpload) {
      if (!file.type.startsWith("image/")) {
        toast.error(`Skipped "${file.name}": not an image.`);
        continue;
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        toast.error(`Skipped "${file.name}": exceeds ${MAX_FILE_MB}MB.`);
        continue;
      }
      const hash = await sha256Hex(file);
      if (existingHashes.has(hash)) {
        toast.error(`Skipped "${file.name}": already uploaded to this event.`);
        continue;
      }
      if (seenInBatch.has(hash)) {
        toast.error(`Skipped "${file.name}": duplicate within this batch.`);
        continue;
      }
      seenInBatch.add(hash);
      prepared.push({ file, hash });
    }

    if (prepared.length === 0) return;

    setUploading(true);
    let nextOrder = photos.length;
    const newIds: { id: string; path: string }[] = [];

    for (const { file, hash } of prepared) {
      try {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${eventId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        const { data: userRes } = await supabase.auth.getUser();
        const { data: inserted, error: insErr } = await (supabase as any)
          .from("event_photos")
          .insert({
            event_id: eventId,
            storage_path: path,
            sort_order: nextOrder++,
            uploaded_by: userRes.user?.id ?? null,
            file_hash: hash,
          })
          .select("id, storage_path")
          .single();
        if (insErr) throw insErr;
        if (inserted) newIds.push({ id: inserted.id, path: inserted.storage_path });
      } catch (err: any) {
        toast.error(`Upload failed: ${err.message ?? err}`);
      }
    }

    setUploading(false);
    toast.success(`Uploaded ${newIds.length} photo${newIds.length === 1 ? "" : "s"}`);
    await load();

    // Fire off alt-text generation in background (don't await)
    if (newIds.length > 0) {
      toast.info("Generating accessible alt text with AI…");
      Promise.all(newIds.map((n) => generateAltFor(n.id, n.path, event?.title))).then(() => {
        toast.success("Alt text ready");
        load();
      });
    }
  };

  const handleDelete = async (photo: PhotoRow) => {
    if (!confirm("Delete this photo?")) return;
    const { error: sErr } = await supabase.storage.from(BUCKET).remove([photo.storage_path]);
    if (sErr) toast.error(sErr.message);
    const { error: dErr } = await (supabase as any)
      .from("event_photos")
      .delete()
      .eq("id", photo.id);
    if (dErr) {
      toast.error(dErr.message);
      return;
    }
    toast.success("Photo deleted");
    load();
  };

  const handleCaption = async (photo: PhotoRow, caption: string) => {
    if ((photo.caption ?? "") === caption) return;
    const { error } = await (supabase as any)
      .from("event_photos")
      .update({ caption: caption || null })
      .eq("id", photo.id);
    if (error) toast.error(error.message);
  };

  const handleAlt = async (photo: PhotoRow, alt: string) => {
    if ((photo.alt_text ?? "") === alt) return;
    const { error } = await (supabase as any)
      .from("event_photos")
      .update({ alt_text: alt || null })
      .eq("id", photo.id);
    if (error) toast.error(error.message);
    else setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, alt_text: alt || null } : p)));
  };

  const handleRegenerateAlt = async (photo: PhotoRow) => {
    setRegeneratingId(photo.id);
    await generateAltFor(photo.id, photo.storage_path, event?.title);
    setRegeneratingId(null);
    await load();
    toast.success("Alt text regenerated");
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = photos.findIndex((p) => p.id === active.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const previous = photos;
    const reordered = arrayMove(photos, oldIndex, newIndex).map((p, i) => ({
      ...p,
      sort_order: i,
    }));
    setPhotos(reordered);

    const payload = reordered.map((p) => ({
      id: p.id,
      event_id: p.event_id,
      storage_path: p.storage_path,
      sort_order: p.sort_order,
    }));
    const { error } = await (supabase as any)
      .from("event_photos")
      .upsert(payload, { onConflict: "id" });
    if (error) {
      toast.error(`Reorder failed: ${error.message}`);
      setPhotos(previous);
    }
  };

  const atCap = photos.length >= MAX_PHOTOS;
  const belowMin = photos.length > 0 && photos.length < MIN_PHOTOS;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link
          to="/admin/events"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to events
        </Link>
        <h1 className="font-heading text-3xl text-primary mb-1">Event Photos</h1>
        <p className="text-muted-foreground mb-8">
          {event ? event.title : "Loading..."}
        </p>

        <div className="mb-4 rounded-xl border border-dashed border-border p-6 flex items-center justify-between gap-4 bg-card">
          <div>
            <p className="font-medium">
              Upload photos ({photos.length} / {MAX_PHOTOS})
            </p>
            <p className="text-xs text-muted-foreground">
              {MIN_PHOTOS}–{MAX_PHOTOS} photos per event · JPG or PNG · max {MAX_FILE_MB}MB each · duplicates blocked
            </p>
          </div>
          <label>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={atCap || uploading}
              onChange={(e) => {
                handleUpload(e.target.files);
                e.target.value = "";
              }}
            />
            <Button asChild disabled={atCap || uploading}>
              <span>
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {atCap ? "Max reached" : "Choose files"}
              </span>
            </Button>
          </label>
        </div>

        {belowMin && (
          <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200 px-4 py-3 flex items-start gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Add at least <strong>{MIN_PHOTOS - photos.length} more photo{MIN_PHOTOS - photos.length === 1 ? "" : "s"}</strong> for this event to look complete on the homepage (recommended {MIN_PHOTOS}–{MAX_PHOTOS}).
            </span>
          </div>
        )}

        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : photos.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-card rounded-xl border border-border">
            No photos yet.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={photos.map((p) => p.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {photos.map((p) => (
                  <PhotoCard
                    key={p.id}
                    photo={p}
                    onDelete={handleDelete}
                    onCaption={handleCaption}
                    onAlt={handleAlt}
                    onRegenerateAlt={handleRegenerateAlt}
                    regenerating={regeneratingId === p.id}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};

export default AdminEventPhotos;
