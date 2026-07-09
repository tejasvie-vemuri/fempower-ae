import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Trash2, Upload, GripVertical } from "lucide-react";
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
  sort_order: number;
  created_at: string;
}

const BUCKET = "event-photos";

const publicUrl = (path: string) =>
  supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

interface PhotoCardProps {
  photo: PhotoRow;
  onDelete: (p: PhotoRow) => void;
  onCaption: (p: PhotoRow, caption: string) => void;
}

const PhotoCard = ({ photo, onDelete, onCaption }: PhotoCardProps) => {
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
          alt={photo.caption ?? "Event photo"}
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
        <Input
          defaultValue={photo.caption ?? ""}
          placeholder="Caption (optional)"
          onBlur={(e) => onCaption(photo, e.target.value.trim())}
        />
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(photo)}
            title="Delete"
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

  const handleUpload = async (files: FileList | null) => {
    if (!files || !eventId) return;
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploading(true);
    let nextOrder = photos.length;
    for (const file of list) {
      try {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${eventId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        const { data: userRes } = await supabase.auth.getUser();
        const { error: insErr } = await (supabase as any).from("event_photos").insert({
          event_id: eventId,
          storage_path: path,
          sort_order: nextOrder++,
          uploaded_by: userRes.user?.id ?? null,
        });
        if (insErr) throw insErr;
      } catch (err: any) {
        toast.error(`Upload failed: ${err.message ?? err}`);
      }
    }
    setUploading(false);
    toast.success("Photos uploaded");
    load();
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = photos.findIndex((p) => p.id === active.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    // Optimistic update
    const previous = photos;
    const reordered = arrayMove(photos, oldIndex, newIndex).map((p, i) => ({
      ...p,
      sort_order: i,
    }));
    setPhotos(reordered);

    // Persist all rows with their new sort_order (upsert on id)
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

        <div className="mb-8 rounded-xl border border-dashed border-border p-6 flex items-center justify-between gap-4 bg-card">
          <div>
            <p className="font-medium">Upload photos</p>
            <p className="text-xs text-muted-foreground">
              JPG or PNG. Drag the handle on any photo to reorder.
            </p>
          </div>
          <label>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
            <Button asChild disabled={uploading}>
              <span>
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Choose files
              </span>
            </Button>
          </label>
        </div>

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
