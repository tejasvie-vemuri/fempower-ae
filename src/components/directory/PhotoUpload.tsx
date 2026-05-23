import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  userId: string;
  value: string | null;
  onChange: (url: string | null) => void;
}

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

export const PhotoUpload = ({ userId, value, onChange }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPT.includes(file.type)) {
      toast({ title: "Unsupported file", description: "Use JPG, PNG, or WebP.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({ title: "Too large", description: "Max 5 MB.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("member-photos").upload(path, file, {
        cacheControl: "3600", upsert: true, contentType: file.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("member-photos").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="h-20 w-20 rounded-full bg-secondary overflow-hidden flex items-center justify-center ring-2 ring-primary/10">
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <Upload className="text-muted-foreground" size={20} />}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="animate-spin mr-1.5" size={14} /> : <Upload size={14} className="mr-1.5" />}
          {value ? "Replace photo" : "Upload photo"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)} disabled={busy}>Remove</Button>
        )}
      </div>
      <input ref={inputRef} type="file" accept={ACCEPT.join(",")} className="hidden" onChange={handlePick} />
    </div>
  );
};
