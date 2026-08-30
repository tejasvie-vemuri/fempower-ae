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
const MIN_RATIO = 0.9;
const MAX_RATIO = 1.1;
const MIN_SIDE = 600;

const readDimensions = (file: File) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image file."));
    };
    img.src = url;
  });

const EventCoverUpload = ({ value, onChange }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
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
    let rawPath = "";
    try {
      const { width, height } = await readDimensions(file);
      const ratio = width / height;
      if (ratio < MIN_RATIO || ratio > MAX_RATIO) {
        toast.error(
          `Cover must be square (1:1). This image is ${width}×${height} (${ratio.toFixed(
            2,
          )}:1). Crop it to an Instagram-grid square first.`,
        );
        return;
      }
      if (Math.min(width, height) < MIN_SIDE) {
        toast.error(
          `Image is too small (${width}×${height}). Use at least ${MIN_SIDE}×${MIN_SIDE}, ideally 1080×1080.`,
        );
        return;
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      rawPath = `raw/upload-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("event-covers")
        .upload(rawPath, file, { cacheControl: "60", contentType: file.type });
      if (upErr) throw upErr;

      const { data, error } = await supabase.functions.invoke("process-event-cover", {
        body: { path: rawPath },
      });
      if (error) {
        // Surface the function's own message when available
        let message = error.message;
        try {
          const ctx = (error as unknown as { context?: Response }).context;
          if (ctx) {
            const parsed = await ctx.clone().json();
            if (parsed?.error) message = parsed.error;
          }
        } catch {
          /* keep default message */
        }
        throw new Error(message);
      }
      if (!data?.url) throw new Error(data?.error ?? "Processing failed");

      onChange(data.url);
      toast.success("Cover uploaded and resized to 1080×1080");
    } catch (err: unknown) {
      if (rawPath) await supabase.storage.from("event-covers").remove([rawPath]);
      toast.error((err as Error)?.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-border bg-muted">
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
          className="w-full aspect-square max-h-56 rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/40 flex flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors"
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <ImagePlus className="h-5 w-5" />
              <span className="text-xs font-medium">Upload square cover (1080×1080)</span>
              <span className="text-[10px]">
                1:1 only · JPG, PNG, WebP or AVIF · max 10 MB
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
