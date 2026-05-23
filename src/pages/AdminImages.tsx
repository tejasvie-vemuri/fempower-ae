import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Trash2, Upload, Copy, Eye, EyeOff } from "lucide-react";
import {
  useSiteImages,
  type SiteImageCategory,
  getPublicUrl,
} from "@/hooks/useSiteImages";

const CATEGORIES: { key: SiteImageCategory; label: string; hint: string }[] = [
  { key: "hero", label: "Hero", hint: "Background image for the landing hero. First active wins." },
  { key: "team", label: "Team / Mentors", hint: "Portraits shown in the About section." },
  { key: "event", label: "Event covers", hint: "Upload here, then paste the public URL into your Events sheet." },
  { key: "gallery", label: "Community Gallery", hint: "Shown in the Community Moments grid." },
];

const compressImage = (file: File, maxW = 1920, quality = 0.82): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/jpeg", quality);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const CategoryPanel = ({ category, hint }: { category: SiteImageCategory; hint: string }) => {
  const { data, loading, reload } = useSiteImages(category, false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const blob = file.type.startsWith("image/") && file.type !== "image/gif"
          ? await compressImage(file)
          : file;
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${category}/${crypto.randomUUID()}.${ext === "gif" ? "gif" : "jpg"}`;
        const { error: upErr } = await supabase.storage
          .from("site-images")
          .upload(path, blob, { contentType: blob instanceof Blob ? "image/jpeg" : file.type });
        if (upErr) throw upErr;
        const maxSort = data.reduce((m, d) => Math.max(m, d.sort_order), 0);
        const { error: insErr } = await supabase.from("site_images").insert({
          category,
          image_path: path,
          title: file.name.replace(/\.[^.]+$/, ""),
          alt: file.name.replace(/\.[^.]+$/, ""),
          sort_order: maxSort + 1,
        });
        if (insErr) throw insErr;
      }
      toast.success("Uploaded");
      reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const updateField = async (id: string, patch: Record<string, unknown>) => {
    const { error } = await supabase.from("site_images").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else reload();
  };

  const handleDelete = async (id: string, path: string) => {
    if (!confirm("Delete this image?")) return;
    await supabase.storage.from("site-images").remove([path]);
    const { error } = await supabase.from("site_images").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      reload();
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{hint}</p>

      <div className="border-2 border-dashed border-border rounded-xl p-6 text-center bg-secondary/40">
        <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-body mb-3">Drop images or click to upload (auto-compressed)</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
        <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Choose files
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : data.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">No images yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((img) => {
            const url = getPublicUrl(img.image_path);
            return (
              <div key={img.id} className="border border-border rounded-xl p-4 bg-card flex gap-4">
                <img
                  src={url}
                  alt={img.alt ?? ""}
                  className="w-24 h-24 object-cover rounded-md flex-shrink-0"
                />
                <div className="flex-1 space-y-2 min-w-0">
                  <div>
                    <Label className="text-xs">Title</Label>
                    <Input
                      defaultValue={img.title ?? ""}
                      onBlur={(e) => updateField(img.id, { title: e.target.value })}
                      className="h-8"
                    />
                  </div>
                  {category === "team" && (
                    <div>
                      <Label className="text-xs">Role / Subtitle</Label>
                      <Input
                        defaultValue={img.subtitle ?? ""}
                        onBlur={(e) => updateField(img.id, { subtitle: e.target.value })}
                        className="h-8"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Alt text</Label>
                      <Input
                        defaultValue={img.alt ?? ""}
                        onBlur={(e) => updateField(img.id, { alt: e.target.value })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Sort order</Label>
                      <Input
                        type="number"
                        defaultValue={img.sort_order}
                        onBlur={(e) =>
                          updateField(img.id, { sort_order: parseInt(e.target.value || "0", 10) })
                        }
                        className="h-8"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(url);
                        toast.success("URL copied");
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy URL
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateField(img.id, { is_active: !img.is_active })}
                    >
                      {img.is_active ? (
                        <><Eye className="h-3 w-3 mr-1" /> Active</>
                      ) : (
                        <><EyeOff className="h-3 w-3 mr-1" /> Hidden</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(img.id, img.image_path)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const AdminImages = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-2">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to site
      </Link>
      <h1 className="font-heading text-3xl text-primary mb-2">Image Library</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Upload and manage every image used on the site, in one place.
      </p>

      <Tabs defaultValue="hero">
        <TabsList className="mb-6">
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c.key} value={c.key}>{c.label}</TabsTrigger>
          ))}
        </TabsList>
        {CATEGORIES.map((c) => (
          <TabsContent key={c.key} value={c.key}>
            <CategoryPanel category={c.key} hint={c.hint} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  </div>
);

export default AdminImages;
