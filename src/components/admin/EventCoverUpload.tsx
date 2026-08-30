import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  value: string;
  onChange: (url: string) => void;
}

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const EventCoverUpload = ({ value, onChange }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPT.includes(file.type)) {
      toast.error("Unsupported file type. Use JPG, PNG, WebP, or AVIF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("File too large. Max 10 MB.");
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `covers/cover-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("event-covers")
        .upload(path, file, { cacheControl: "3600", contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("event-covers").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Cover image uploaded");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-border bg-muted mx-auto w-full max-w-[288px]">
          <img
            src={value}
            alt="Event cover preview"
            className="w-full aspect-square object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Replace"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => onChange("")}
              disabled={busy}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-full h-28 rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/40 flex flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors"
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <ImagePlus className="h-5 w-5" />
              <span className="text-xs font-medium">Upload cover image</span>
              <span className="text-[10px] text-center px-2">
                Square 1:1 · 1080 × 1080 (Instagram grid) · JPG, PNG, WebP or AVIF · max 10 MB
              </span>
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT.join(",")}
        className="hidden"
        onChange={handlePick}
      />
    </div>
  );
};

export default EventCoverUpload;
