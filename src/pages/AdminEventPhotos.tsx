import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Trash2, Upload, GripVertical } from "lucide-react";

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

const AdminEventPhotos = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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
    const { error } = await (supabase as any)
      .from("event_photos")
      .update({ caption: caption || null })
      .eq("id", photo.id);
    if (error) toast.error(error.message);
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    const a = photos[index];
    const b = photos[target];
    const { error } = await (supabase as any).from("event_photos").upsert([
      { id: a.id, sort_order: b.sort_order },
      { id: b.id, sort_order: a.sort_order },
    ]);
    if (error) {
      toast.error(error.message);
      return;
    }
    load();
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
              JPG or PNG. 3–4 photos per event recommended.
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((p, i) => (
              <div key={p.id} className="rounded-xl overflow-hidden bg-card border border-border">
                <div className="aspect-[4/3] bg-muted">
                  <img
                    src={publicUrl(p.storage_path)}
                    alt={p.caption ?? "Event photo"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-3 space-y-2">
                  <Input
                    defaultValue={p.caption ?? ""}
                    placeholder="Caption (optional)"
                    onBlur={(e) => handleCaption(p, e.target.value.trim())}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Move up"
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                      >
                        <GripVertical className="h-4 w-4 rotate-180" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Move down"
                        onClick={() => move(i, 1)}
                        disabled={i === photos.length - 1}
                      >
                        <GripVertical className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(p)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEventPhotos;
